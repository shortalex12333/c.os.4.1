#!/usr/bin/env python3
"""
Production Configuration for celeste7.ai
Microsoft Email Authentication System
"""

import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# PRODUCTION CONFIGURATION FOR CELESTE7.AI
# =============================================================================

# Azure AD Configuration
TENANT_ID = os.getenv('AZURE_TENANT_ID')  # Same as development
CLIENT_ID = os.getenv('AZURE_CLIENT_ID')  # Same as development

# Production URLs (celeste7.ai)
DOMAIN = "celeste7.ai"
BASE_URL = f"https://{DOMAIN}"

# Production redirect URI for Azure AD
REDIRECT_URI = f"{BASE_URL}/auth/microsoft/callback"

# Microsoft Graph API Configuration
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES = [
    "Mail.Read",
    "MailboxSettings.Read", 
    "User.Read",
    "offline_access"
]

# API Endpoints for CelesteOS-Modern Integration
API_ENDPOINTS = {
    "email_search": f"{BASE_URL}/api/email/search",
    "user_status": f"{BASE_URL}/api/email/user/{{user_id}}/status",
    "register": f"{BASE_URL}/auth/microsoft/register",
    "callback": f"{BASE_URL}/auth/microsoft/callback",
    "users": f"{BASE_URL}/api/email/users"
}

# Production Database Configuration
DATABASE_CONFIG = {
    "type": "postgresql",  # or your preferred database
    "host": os.getenv('DB_HOST', 'localhost'),
    "port": os.getenv('DB_PORT', 5432),
    "database": os.getenv('DB_NAME', 'celesteos'),
    "username": os.getenv('DB_USER', 'celesteos'),
    "password": os.getenv('DB_PASSWORD'),
    "table": "user_email_tokens"
}

# Redis Configuration (for token caching)
REDIS_CONFIG = {
    "host": os.getenv('REDIS_HOST', 'localhost'),
    "port": os.getenv('REDIS_PORT', 6379),
    "password": os.getenv('REDIS_PASSWORD'),
    "database": 0
}

# Security Settings
SECURITY = {
    "token_encryption_key": os.getenv('EMAIL_TOKEN_ENCRYPTION_KEY'),
    "session_secret": os.getenv('SESSION_SECRET_KEY'),
    "https_only": True,
    "secure_cookies": True,
    "csrf_protection": True
}

# CelesteOS-Modern Integration Settings
CELESTEOS_INTEGRATION = {
    "user_api_endpoint": f"{BASE_URL}/api/users",  # Existing CelesteOS user API
    "chat_interface_url": f"{BASE_URL}/chatllm",
    "return_url_after_auth": f"{BASE_URL}/chatllm?email_connected=true"
}

# Service Configuration
SERVICES = {
    "email_api_service": {
        "host": "0.0.0.0",
        "port": int(os.getenv('EMAIL_API_PORT', 8001)),
        "workers": int(os.getenv('EMAIL_API_WORKERS', 4))
    },
    "auth_service": {
        "host": "0.0.0.0", 
        "port": int(os.getenv('AUTH_SERVICE_PORT', 8002)),
        "workers": int(os.getenv('AUTH_SERVICE_WORKERS', 2))
    },
    "registration_service": {
        "host": "0.0.0.0",
        "port": int(os.getenv('REGISTRATION_PORT', 8003)),
        "workers": int(os.getenv('REGISTRATION_WORKERS', 2))
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    "level": os.getenv('LOG_LEVEL', 'INFO'),
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "handlers": {
        "file": {
            "filename": "/var/log/celesteos/email-auth.log",
            "max_bytes": 10485760,  # 10MB
            "backup_count": 5
        },
        "syslog": {
            "address": os.getenv('SYSLOG_ADDRESS', '/dev/log'),
            "facility": "local0"
        }
    }
}

# Monitoring & Analytics
MONITORING = {
    "prometheus_port": int(os.getenv('PROMETHEUS_PORT', 9090)),
    "health_check_interval": 30,
    "alert_webhook": os.getenv('ALERT_WEBHOOK_URL'),
    "metrics_retention_days": 30
}

# Rate Limiting
RATE_LIMITING = {
    "auth_requests_per_minute": 10,
    "api_requests_per_minute": 100,
    "email_searches_per_hour": 1000
}

def validate_production_config():
    """Validate all required production configuration"""
    required_env_vars = [
        'AZURE_TENANT_ID',
        'AZURE_CLIENT_ID', 
        'EMAIL_TOKEN_ENCRYPTION_KEY',
        'SESSION_SECRET_KEY'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    logger.info("✅ Production configuration validated successfully")
    return True

def get_azure_ad_config():
    """Get Azure AD configuration for production"""
    return {
        "client_id": CLIENT_ID,
        "authority": AUTHORITY,
        "redirect_uri": REDIRECT_URI,
        "scopes": SCOPES
    }

def get_database_url():
    """Get database connection URL"""
    config = DATABASE_CONFIG
    return f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"

if __name__ == "__main__":
    # Test configuration
    try:
        validate_production_config()
        print("🎉 Production configuration is valid!")
        print(f"🌐 Domain: {DOMAIN}")
        print(f"🔗 Redirect URI: {REDIRECT_URI}")
        print(f"📧 Email API: {API_ENDPOINTS['email_search']}")
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        print("Please set the required environment variables.")