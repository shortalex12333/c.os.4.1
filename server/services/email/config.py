"""
Configuration file for Email Reader for Microsoft Outlook
Fill in your Azure AD app registration details below
"""

import os

# Azure AD Configuration - REPLACE WITH YOUR VALUES
# SECURITY: Use environment variables in production
TENANT_ID = os.getenv('AZURE_TENANT_ID', 'common')  # Multi-tenant - accepts any Microsoft account
CLIENT_ID = os.getenv('AZURE_CLIENT_ID', 'YOUR_CLIENT_ID_HERE')
REDIRECT_URI = "http://localhost:8082/auth/microsoft/callback"  # Matches Microsoft App config

# Validate configuration
def validate_config():
    """Validate that required configuration is set"""
    if TENANT_ID == 'YOUR_TENANT_ID_HERE' or not TENANT_ID:
        raise ValueError("AZURE_TENANT_ID environment variable not set or still has placeholder value")
    if CLIENT_ID == 'YOUR_CLIENT_ID_HERE' or not CLIENT_ID:
        raise ValueError("AZURE_CLIENT_ID environment variable not set or still has placeholder value")
    return True

# Microsoft Graph API Configuration
# Only construct authority if config is valid
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES = [
    "Mail.Read",
    "MailboxSettings.Read", 
    "User.Read"
]

# Application Configuration
APP_NAME = "Email Reader for Microsoft Outlook"
KEYCHAIN_SERVICE = "yacht-email-reader"
LOCAL_SERVER_PORT = 8082  # Matches Microsoft App redirect URI

# Graph API Endpoints
GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"
MESSAGES_ENDPOINT = f"{GRAPH_BASE_URL}/me/messages"
FOLDERS_ENDPOINT = f"{GRAPH_BASE_URL}/me/mailFolders"
USER_ENDPOINT = f"{GRAPH_BASE_URL}/me"

# UI Configuration
WINDOW_WIDTH = 1000
WINDOW_HEIGHT = 700