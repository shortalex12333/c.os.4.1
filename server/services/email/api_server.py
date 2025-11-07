#!/usr/bin/env python3
"""
REST API Server for n8n Email Search Integration
Provides Microsoft Graph email access via HTTP endpoints
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime, timezone
import traceback

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth_manager import AuthManager
from graph_client import GraphClient
from token_manager import TokenManager
from config import validate_config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for n8n integration

# Global components (initialized on first use)
auth_manager = None
graph_client = None

def get_graph_client():
    """Get or initialize Graph client with authentication"""
    global auth_manager, graph_client
    
    if not auth_manager:
        try:
            validate_config()
            auth_manager = AuthManager()
            graph_client = GraphClient(auth_manager)
            logger.info("Graph client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Graph client: {str(e)}")
            raise
    
    return graph_client

def get_bearer_token():
    """Get current Microsoft Graph bearer token"""
    try:
        client = get_graph_client()
        token = client.auth_manager.get_access_token()
        if token:
            return f"Bearer {token}"
        else:
            logger.error("No valid access token available")
            return None
    except Exception as e:
        logger.error(f"Failed to get bearer token: {str(e)}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        token = get_bearer_token()
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "has_auth": token is not None,
            "message": "Email API server is running"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/email/search', methods=['GET', 'POST'])
@app.route('/email/search', methods=['GET', 'POST'])  # Support both routes for compatibility
def search_emails():
    """Email search endpoint for n8n integration"""
    try:
        logger.info(f"Received {request.method} request to email search")
        
        # Get Graph client
        client = get_graph_client()
        
        # Parse request data
        if request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400
        else:
            # Handle GET request with query parameters
            data = {
                "query": request.args.get('query', ''),
                "filters": {},
                "top": int(request.args.get('top', 50))
            }
        
        # Extract search parameters
        query = data.get('query', '').replace('[undefined]', '')
        filters = data.get('filters', {})
        top = min(data.get('top', 50), 100)  # Cap at 100 emails
        order_by = data.get('order_by', 'receivedDateTime desc')
        select_fields = data.get('select_fields', [
            'id', 'subject', 'from', 'receivedDateTime', 
            'bodyPreview', 'hasAttachments', 'importance', 'conversationId'
        ])
        
        logger.info(f"Search query: '{query}', top: {top}")
        
        # Build search parameters
        search_params = {}
        
        if query and query.strip():
            search_params['search_query'] = query.strip()
        
        # Handle date filtering
        if 'date_filter' in filters and filters['date_filter']:
            date_str = filters['date_filter']
            if 'ge ' in date_str:
                try:
                    date_part = date_str.split('ge ')[1]
                    from datetime import datetime
                    date_obj = datetime.fromisoformat(date_part.replace('Z', '+00:00'))
                    days_ago = (datetime.now(timezone.utc) - date_obj).days
                    if days_ago > 0:
                        search_params['days_back'] = days_ago
                        logger.info(f"Filtering emails from {days_ago} days ago")
                except Exception as e:
                    logger.warning(f"Failed to parse date filter: {e}")
        
        # Perform search
        try:
            emails = client.search_emails(
                search_query=search_params.get('search_query'),
                days_back=search_params.get('days_back')
            )
            
            logger.info(f"Found {len(emails) if emails else 0} emails")
            
            # Format response for n8n
            response_data = {
                "success": True,
                "count": len(emails) if emails else 0,
                "query": query,
                "filters": filters,
                "emails": emails or [],
                "bearer_token_status": "valid",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Add Graph API format compatibility
            response_data["value"] = emails or []
            response_data["@odata.count"] = len(emails) if emails else 0
            
            return jsonify(response_data)
            
        except Exception as search_error:
            logger.error(f"Email search failed: {str(search_error)}")
            return jsonify({
                "success": False,
                "error": "Email search failed",
                "details": str(search_error),
                "bearer_token_status": "check_required",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 500
            
    except Exception as e:
        logger.error(f"Email search endpoint error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Server error",
            "details": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    """Check authentication status and bearer token"""
    try:
        client = get_graph_client()
        token = get_bearer_token()
        
        if token:
            # Test token by getting user profile
            try:
                profile = client.get_user_profile()
                return jsonify({
                    "authenticated": True,
                    "bearer_token": token[:20] + "...",  # Partial token for security
                    "user_email": profile.get('mail') or profile.get('userPrincipalName'),
                    "user_name": profile.get('displayName'),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            except Exception as profile_error:
                return jsonify({
                    "authenticated": False,
                    "error": "Token validation failed",
                    "details": str(profile_error),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }), 401
        else:
            return jsonify({
                "authenticated": False,
                "error": "No valid bearer token available",
                "message": "Please authenticate first using the desktop app",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 401
            
    except Exception as e:
        return jsonify({
            "authenticated": False,
            "error": "Authentication check failed",
            "details": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": [
            "GET /health",
            "POST /api/email/search", 
            "GET /api/auth/status"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 404

if __name__ == '__main__':
    try:
        logger.info("Starting Email API Server...")
        logger.info("Available endpoints:")
        logger.info("  GET  /health")
        logger.info("  POST /api/email/search")  
        logger.info("  GET  /api/auth/status")
        logger.info("  POST /email/search (compatibility)")
        
        # Start server on port 8001
        app.run(
            host='localhost',
            port=8001,
            debug=False,
            use_reloader=False
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)