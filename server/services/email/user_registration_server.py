#!/usr/bin/env python3
"""
User Registration Server for ChatLLM Email Integration
Handles new user email account connections
"""

import os
import sys
from flask import Flask, request, render_template_string, redirect, jsonify
from flask_cors import CORS
import logging
from datetime import datetime, timezone
import uuid
import webbrowser
import threading
import time

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth_manager import AuthManager
from token_manager import TokenManager
from config import validate_config
import requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Store pending registrations
pending_registrations = {}

# HTML Templates
REGISTRATION_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Connect Your Email - Yacht AI</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .container { background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center; }
        .btn { background: #0078d4; color: white; padding: 15px 30px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin: 20px 0; font-size: 16px; }
        .btn:hover { background: #106ebe; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚢 Connect Your Email to Yacht AI</h1>
        <div class="info">
            <p><strong>You're about to connect your Microsoft email account to Yacht AI's ChatLLM.</strong></p>
            <p>This will allow you to search your emails using natural language within our chat interface.</p>
        </div>
        
        <h3>What happens next:</h3>
        <ol style="text-align: left; display: inline-block;">
            <li>Click "Connect Email Account" below</li>
            <li>Sign in with your Microsoft account</li>
            <li>Grant permission to read your emails</li>
            <li>Return to ChatLLM to start searching!</li>
        </ol>
        
        <a href="/auth/start?user_id={{ user_id }}" class="btn">
            📧 Connect Email Account
        </a>
        
        <div class="info">
            <p><small><strong>Secure:</strong> Your login is handled directly by Microsoft. We only store an access token to search your emails when you request it.</small></p>
        </div>
    </div>
</body>
</html>
"""

SUCCESS_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Email Connected Successfully - Yacht AI</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .container { background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center; }
        .success { background: #4caf50; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .next-steps { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">
            <h1>✅ Email Connected Successfully!</h1>
            <p>Your Microsoft email account is now connected to Yacht AI.</p>
        </div>
        
        <div class="next-steps">
            <h3>🎉 You can now:</h3>
            <ul>
                <li>Search your emails using natural language in ChatLLM</li>
                <li>Find emails by sender, subject, date, or content</li>
                <li>Ask questions like "Find emails about yacht contracts from last month"</li>
                <li>Retrieve email attachments and details</li>
            </ul>
        </div>
        
        <p><strong>Return to ChatLLM and try asking:</strong></p>
        <p><em>"Search my emails for yacht maintenance contracts"</em></p>
        <p><em>"Find emails from John Smith last week"</em></p>
        
        <p><small>This window will close automatically in 10 seconds...</small></p>
        <script>
            setTimeout(function() {
                window.close();
            }, 10000);
        </script>
    </div>
</body>
</html>
"""

@app.route('/register')
def register_user():
    """Show registration page for new user"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400
    
    # Store the registration request
    registration_id = str(uuid.uuid4())
    pending_registrations[registration_id] = {
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    
    logger.info(f"New registration request for user_id: {user_id}")
    return render_template_string(REGISTRATION_PAGE, user_id=user_id)

@app.route('/auth/start')
def start_auth():
    """Start Microsoft authentication process"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400
    
    try:
        # Create a user-specific AuthManager
        token_manager = TokenManager(username=user_id)
        auth_manager = AuthManager(token_manager=token_manager)
        
        # Start authentication process
        result = auth_manager.login()
        
        if result and result.get("access_token"):
            # Registration successful - register with API server
            registration_success = requests.post(
                "http://localhost:8001/api/auth/register",
                json={
                    "user_id": user_id,
                    "user_email": result.get("account", {}).get("username", "unknown"),
                    "access_token": result["access_token"],
                    "refresh_token": result.get("refresh_token", ""),
                    "expires_in": result.get("expires_in", 3600)
                },
                headers={"Content-Type": "application/json"}
            )
            
            if registration_success.status_code == 200:
                logger.info(f"User {user_id} successfully registered")
                return render_template_string(SUCCESS_PAGE)
            else:
                logger.error(f"Failed to register user {user_id}: {registration_success.text}")
                return jsonify({"error": "Registration failed"}), 500
        else:
            logger.error(f"Authentication failed for user {user_id}")
            return jsonify({"error": "Authentication failed"}), 400
            
    except Exception as e:
        logger.error(f"Error during authentication for user {user_id}: {str(e)}")
        return jsonify({"error": "Authentication process failed"}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "User Registration Server",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pending_registrations": len(pending_registrations)
    })

@app.route('/api/registrations')
def list_registrations():
    """List all pending/completed registrations"""
    return jsonify({
        "registrations": list(pending_registrations.values()),
        "count": len(pending_registrations),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

if __name__ == "__main__":
    try:
        validate_config()
        logger.info("Starting User Registration Server...")
        logger.info("Available endpoints:")
        logger.info("  GET  /register?user_id=<id>")
        logger.info("  GET  /auth/start?user_id=<id>") 
        logger.info("  GET  /health")
        logger.info("  GET  /api/registrations")
        
        # Run on a different port to avoid conflicts
        app.run(host='0.0.0.0', port=8003, debug=False)
        
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)