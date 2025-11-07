# Email Reader for Microsoft Outlook

A secure native macOS application for reading Outlook emails via Microsoft Graph API. Designed for limited connectivity environments, providing offline-compatible email access with Azure AD authentication.

## Features

- **Secure Azure AD Authentication**: OAuth2 with PKCE flow, no client secrets
- **Read-Only Email Access**: Minimal permissions (Mail.Read, User.Read)
- **Offline Compatible**: Works with limited internet connectivity
- **Native macOS Integration**: Secure token storage using macOS Keychain
- **Privacy-Focused**: No data leaves your device except Microsoft Graph API calls
- **Simple GUI**: Easy-to-use Tkinter interface

## Prerequisites

- **macOS**: 10.15 (Catalina) or later
- **Python**: 3.9 or later
- **Azure AD App Registration**: With proper permissions configured
- **Internet Access**: Required only for authentication and Graph API calls

## Quick Start

### 1. Configure Azure AD App Registration

Before running the application, you need to set up an Azure AD app registration:

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Configure:
   - **Name**: "Email Reader for Microsoft Outlook" (or your preferred name)
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**: Platform: "Public client/native (mobile & desktop)", URI: `http://localhost:8001`

4. After registration:
   - Note down the **Application (client) ID**
   - Note down the **Directory (tenant) ID**

5. Configure API permissions:
   - Go to "API permissions" → "Add a permission" → "Microsoft Graph" → "Delegated permissions"
   - Add: `Mail.Read`, `MailboxSettings.Read`, `User.Read`
   - Click "Grant admin consent" (if you're an admin)

6. Configure authentication:
   - Go to "Authentication"
   - Enable "Allow public client flows" = Yes
   - Add redirect URI: `http://localhost:8001`

### 2. Install Dependencies

```bash
cd "MICROSOFT APP/yacht-email-reader"
pip3 install -r requirements.txt
```

### 3. Configure Application

Edit `config.py` and replace the placeholder values:

```python
# Replace these with your Azure AD app registration details
TENANT_ID = "your-tenant-id-here"  # or use "common" for multi-tenant
CLIENT_ID = "your-client-id-here"
```

### 4. Run the Application

```bash
python3 gui_app.py
```

## Usage

1. **Authentication**: Click "Login to Microsoft" to authenticate via Azure AD
2. **Search Emails**: Enter search terms, set filters, and click "Search"
3. **View Results**: Click on emails in the list to view preview
4. **Full Details**: Double-click emails to view complete content
5. **Logout**: Click "Logout" to clear stored credentials

## Configuration Options

### config.py Settings

```python
# Azure Configuration
TENANT_ID = "your-tenant-id"      # Azure tenant ID or "common"
CLIENT_ID = "your-client-id"      # Azure app registration client ID
REDIRECT_URI = "http://localhost:8001"  # OAuth redirect URI

# API Permissions (do not modify unless needed)
SCOPES = [
    "Mail.Read",                  # Read user mailbox
    "MailboxSettings.Read",       # Read mailbox folder structure  
    "User.Read"                   # Read user profile
]

# UI Configuration
WINDOW_WIDTH = 1000               # Application window width
WINDOW_HEIGHT = 700               # Application window height
```

## Security Features

- **No Client Secrets**: Uses public client flow with PKCE
- **Secure Token Storage**: Tokens encrypted in macOS Keychain
- **Minimal Permissions**: Only read-only access to emails
- **Local Operation**: No data sent to external servers
- **Automatic Token Refresh**: Handles token expiration transparently

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Verify Azure AD app registration configuration
- Check tenant ID and client ID in config.py
- Ensure redirect URI matches Azure configuration
- Verify API permissions are granted

**"Network error"**
- Check internet connectivity
- Verify firewall settings allow https://login.microsoftonline.com
- Ensure Graph API endpoints are accessible

**"Insufficient permissions"**
- Verify Mail.Read permission is granted in Azure AD
- Check if admin consent is required and granted
- Confirm user has email access

**"Port already in use"**
- Change LOCAL_SERVER_PORT in config.py to a different port
- Update redirect URI in Azure AD to match new port

### Debug Mode

Enable debug logging by modifying gui_app.py:

```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Token Issues

Clear stored tokens:
```bash
python3 -c "from token_manager import TokenManager; TokenManager().clear_tokens()"
```

## Offline Operation

The application is designed for limited connectivity environments:

- **Authentication**: Requires initial internet connection
- **Token Refresh**: Periodic internet access needed
- **Email Search**: Requires internet for Graph API calls
- **Cached Data**: Previous searches remain viewable offline

## Production Deployment

### For Yacht Hardware

1. **System Requirements**:
   - macOS with Python 3.9+
   - Reliable authentication connectivity
   - Intermittent internet for email sync

2. **Installation**:
   ```bash
   # Create dedicated directory
   sudo mkdir -p /opt/yacht-email-reader
   sudo cp -r yacht-email-reader/* /opt/yacht-email-reader/
   
   # Install dependencies system-wide
   sudo pip3 install -r /opt/yacht-email-reader/requirements.txt
   
   # Create application launcher
   sudo ln -s /opt/yacht-email-reader/gui_app.py /usr/local/bin/yacht-email-reader
   chmod +x /usr/local/bin/yacht-email-reader
   ```

3. **Configuration**:
   - Update config.py with production Azure AD settings
   - Consider using environment variables for sensitive data
   - Test authentication and email access

## API Reference

### Core Components

- **AuthManager**: Handles Azure AD authentication and token management
- **GraphClient**: Microsoft Graph API client for email operations
- **TokenManager**: Secure token storage using macOS Keychain
- **ErrorHandler**: Comprehensive error handling and offline scenarios

### Key Methods

```python
# Authentication
auth_manager = AuthManager()
auth_manager.login()                    # Interactive login
auth_manager.is_authenticated()         # Check auth status
auth_manager.get_access_token()         # Get valid token

# Email Operations
graph_client = GraphClient(auth_manager)
graph_client.search_emails(query="important", days_back=7)
graph_client.get_email_details(message_id)
graph_client.get_user_profile()
```

## Privacy & Compliance

This application:
- ✅ Uses minimal necessary permissions (Mail.Read, User.Read only)
- ✅ Stores data locally only - no external data transmission
- ✅ Implements secure token management with macOS Keychain
- ✅ Follows OAuth2 + PKCE best practices
- ✅ Provides transparent permission usage
- ✅ Supports user consent and logout
- ✅ Complies with Microsoft Graph API terms of service
- ✅ Includes comprehensive privacy policy (see PRIVACY_POLICY.md)
- ✅ Implements proper rate limiting and error handling
- ✅ Uses environment variables for sensitive configuration

## Support

For technical issues:
1. Check troubleshooting section above
2. Verify Azure AD configuration
3. Test network connectivity to Microsoft endpoints
4. Review application logs for specific errors

## License

This application is provided as-is for private yacht hardware installations. Ensure compliance with your organization's security policies and Microsoft Graph API terms of service.