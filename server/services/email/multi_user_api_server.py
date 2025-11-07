#!/usr/bin/env python3
"""
Multi-User REST API Server for n8n Email Search Integration
Handles multiple users with individual bearer tokens
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime, timezone
import traceback
import json
import sqlite3
from threading import Lock

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
CORS(app)

# Database for user tokens
DB_LOCK = Lock()
DB_PATH = "user_tokens.db"

def init_database():
    """Initialize SQLite database for user token storage"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_tokens (
                user_id TEXT PRIMARY KEY,
                user_email TEXT,
                access_token TEXT,
                refresh_token TEXT,
                expires_at INTEGER,
                created_at INTEGER,
                updated_at INTEGER
            )
        ''')
        conn.commit()

def store_user_token(user_id: str, user_email: str, token_data: dict):
    """Store user-specific bearer token"""
    with DB_LOCK:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            now = int(datetime.now().timestamp())
            expires_at = now + token_data.get('expires_in', 3600)
            
            cursor.execute('''
                INSERT OR REPLACE INTO user_tokens 
                (user_id, user_email, access_token, refresh_token, expires_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, user_email,
                token_data.get('access_token'),
                token_data.get('refresh_token'),
                expires_at, now, now
            ))
            conn.commit()
            logger.info(f"Stored token for user {user_id} ({user_email})")

def get_user_token(user_id: str) -> dict:
    """Retrieve user-specific bearer token"""
    with DB_LOCK:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT access_token, refresh_token, expires_at, user_email
                FROM user_tokens WHERE user_id = ?
            ''', (user_id,))
            row = cursor.fetchone()
            
            if row:
                access_token, refresh_token, expires_at, user_email = row
                now = int(datetime.now().timestamp())
                
                return {
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'expires_at': expires_at,
                    'user_email': user_email,
                    'is_valid': expires_at > now
                }
            return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "Multi-user Email API server is running"
    })

@app.route('/api/auth/register', methods=['POST'])
def register_user_token():
    """Register a new user's bearer token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        user_id = data.get('user_id')
        user_email = data.get('user_email')
        access_token = data.get('access_token')
        refresh_token = data.get('refresh_token')
        expires_in = data.get('expires_in', 3600)
        
        if not all([user_id, user_email, access_token]):
            return jsonify({
                "error": "Missing required fields",
                "required": ["user_id", "user_email", "access_token"]
            }), 400
        
        # Store token
        token_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': expires_in
        }
        store_user_token(user_id, user_email, token_data)
        
        return jsonify({
            "success": True,
            "message": f"Token registered for user {user_id}",
            "user_email": user_email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to register user token: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to register token",
            "details": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/email/search', methods=['POST'])
def search_user_emails():
    """Search emails for a specific user"""
    try:
        logger.info("Received multi-user email search request")
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract user context
        user_context = data.get('user_context', {})
        user_id = user_context.get('user_id')
        
        if not user_id or user_id == '[undefined]':
            return jsonify({
                "success": False,
                "error": "Missing user_id in user_context",
                "message": "Each request must include user_context.user_id",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 400
        
        # Get user's bearer token
        token_info = get_user_token(user_id)
        if not token_info:
            return jsonify({
                "success": False,
                "error": "User not authenticated",
                "message": f"No bearer token found for user {user_id}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 401
        
        if not token_info['is_valid']:
            return jsonify({
                "success": False,
                "error": "Token expired",
                "message": f"Bearer token expired for user {user_id}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 401
        
        # Create user-specific Graph client
        # Note: This would need modification to accept external tokens
        # For now, simulate the search response
        
        # Extract search parameters
        query = data.get('query', '').replace('[undefined]', '')
        filters = data.get('filters', {})
        top = min(data.get('top', 50), 100)
        
        logger.info(f"Searching emails for user {user_id}: query='{query}', top={top}")
        
        # Simulate email search (replace with actual Graph API call)
        mock_emails = [
            {
                "id": f"email_{i}",
                "subject": f"Mock Email {i}: {query}",
                "from": {"emailAddress": {"address": f"sender{i}@example.com", "name": f"Sender {i}"}},
                "receivedDateTime": datetime.now(timezone.utc).isoformat(),
                "bodyPreview": f"This is a mock email containing '{query}' for user {user_id}",
                "hasAttachments": i % 2 == 0,
                "importance": "normal",
                "conversationId": f"conv_{i}"
            }
            for i in range(min(top, 5))  # Return up to 5 mock emails
        ]
        
        response_data = {
            "success": True,
            "count": len(mock_emails),
            "query": query,
            "filters": filters,
            "user_id": user_id,
            "user_email": token_info['user_email'],
            "emails": mock_emails,
            "bearer_token_status": "valid",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Add Graph API format compatibility
        response_data["value"] = mock_emails
        response_data["@odata.count"] = len(mock_emails)
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Multi-user email search error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Server error",
            "details": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@app.route('/api/users', methods=['GET'])
def list_users():
    """List all registered users (for debugging)"""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT user_id, user_email, expires_at FROM user_tokens')
            rows = cursor.fetchall()
            
            now = int(datetime.now().timestamp())
            users = []
            for user_id, user_email, expires_at in rows:
                users.append({
                    "user_id": user_id,
                    "user_email": user_email,
                    "token_valid": expires_at > now,
                    "expires_at": datetime.fromtimestamp(expires_at).isoformat()
                })
            
            return jsonify({
                "users": users,
                "count": len(users),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
    except Exception as e:
        return jsonify({
            "error": "Failed to list users",
            "details": str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": [
            "GET /health",
            "POST /api/auth/register", 
            "POST /api/email/search",
            "GET /api/users"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 404

if __name__ == '__main__':
    try:
        # Initialize database
        init_database()
        
        logger.info("Starting Multi-User Email API Server...")
        logger.info("Available endpoints:")
        logger.info("  GET  /health")
        logger.info("  POST /api/auth/register")
        logger.info("  POST /api/email/search")  
        logger.info("  GET  /api/users")
        
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