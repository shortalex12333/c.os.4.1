# Azure AD App Registration Setup Guide

Complete step-by-step guide for configuring Azure Active Directory app registration for the Yacht Email Reader application.

## Prerequisites

- Access to Azure Portal with sufficient permissions to create app registrations
- Administrator access (recommended for granting consent)
- Understanding of your organization's Azure AD setup

## Step 1: Create App Registration

1. **Navigate to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure AD account

2. **Access App Registrations**
   - In the left sidebar, click "Azure Active Directory"
   - Under "Manage", click "App registrations"
   - Click "New registration"

3. **Configure Basic Settings**
   - **Name**: `Yacht Email Reader` (or your preferred name)
   - **Supported account types**: Choose one:
     - `Accounts in this organizational directory only` (Single tenant)
     - `Accounts in any organizational directory` (Multi-tenant)
     - `Accounts in any organizational directory and personal Microsoft accounts` (Multi-tenant + personal)
   - **Redirect URI**: 
     - Platform: `Public client/native (mobile & desktop)`
     - URI: `http://localhost:8002`  <!-- Port 8002 for authentication, 8001 for API -->

4. **Create Registration**
   - Click "Register"
   - **IMPORTANT**: Copy and save the following values:
     - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
     - **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Step 2: Configure Authentication

1. **Navigate to Authentication Settings**
   - In your app registration, click "Authentication" in the left sidebar

2. **Configure Redirect URIs**
   - Verify `http://localhost:8002` is listed under "Public client/native (mobile & desktop)"  <!-- Updated port -->
   - If you need to use a different port, add additional URIs like `http://localhost:8002`

3. **Enable Public Client Flows**
   - Scroll down to "Advanced settings"
   - Set "Allow public client flows" to **Yes**
   - This is required for native desktop applications

4. **Save Configuration**
   - Click "Save" at the top of the page

## Step 3: Configure API Permissions

1. **Navigate to API Permissions**
   - Click "API permissions" in the left sidebar

2. **Add Microsoft Graph Permissions**
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Choose "Delegated permissions"
   - Search for and select the following permissions:
     - `Mail.Read` - Read user mail
     - `MailboxSettings.Read` - Read user mailbox settings (for folder access)
     - `User.Read` - Sign in and read user profile (usually added by default)

3. **Grant Admin Consent** (Recommended)
   - After adding permissions, click "Grant admin consent for [Your Organization]"
   - Click "Yes" to confirm
   - All permissions should show "Granted for [Your Organization]" status

   **Note**: If you cannot grant admin consent, users will see consent prompts during first login.

## Step 4: Configure Application Settings (Optional)

1. **Branding** (Optional)
   - Click "Branding" in the left sidebar
   - Add logo, terms of service URL, privacy statement URL as needed

2. **Owners** (Recommended)
   - Click "Owners" in the left sidebar
   - Add additional owners who can manage this app registration

## Step 5: Update Application Configuration

1. **Open config.py** in your application directory

2. **Update Configuration Values**
   ```python
   # Replace with your actual values from Step 1
   TENANT_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Directory (tenant) ID
   CLIENT_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Application (client) ID
   ```

3. **Alternative: Use Environment Variables** (More Secure)
   ```bash
   export AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   export AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
   
   Then modify config.py:
   ```python
   import os
   TENANT_ID = os.getenv('AZURE_TENANT_ID', 'YOUR_TENANT_ID_HERE')
   CLIENT_ID = os.getenv('AZURE_CLIENT_ID', 'YOUR_CLIENT_ID_HERE')
   ```

## Step 6: Test Configuration

1. **Run the Application**
   ```bash
   cd yacht-email-reader
   python3 gui_app.py
   ```

2. **Test Authentication**
   - Click "Login to Microsoft"
   - You should be redirected to Microsoft login page
   - After successful login, you should see "Authenticated" status

3. **Test Email Access**
   - Try searching for emails
   - Verify you can view email results

## Common Configuration Issues

### Issue: "AADSTS50011: The reply URL specified in the request does not match"
**Solution**: Verify redirect URI in Azure exactly matches your application configuration
- Azure: `http://localhost:8002`  <!-- Authentication callback port -->
- config.py: `REDIRECT_URI = "http://localhost:8002"`  <!-- Matches Azure -->
- Note: API server runs on port 8001, authentication on 8002

### Issue: "AADSTS65001: The user or administrator has not consented"
**Solution**: Grant admin consent in API permissions section, or users must consent during first login

### Issue: "AADSTS700016: Application not found in directory"
**Solution**: Verify the CLIENT_ID in config.py matches the Application (client) ID from Azure

### Issue: "AADSTS90002: Tenant not found"
**Solution**: Verify the TENANT_ID in config.py matches the Directory (tenant) ID from Azure

## Security Considerations

1. **Minimal Permissions**
   - Only request permissions your application actually needs
   - Current setup uses minimal read-only permissions

2. **Public Client Security**
   - No client secrets are used (secure for native apps)
   - PKCE (Proof Key for Code Exchange) provides additional security

3. **Token Storage**
   - Tokens are stored securely in macOS Keychain
   - Tokens are automatically refreshed when possible

4. **Network Security**
   - All communication uses HTTPS
   - Only Microsoft endpoints are contacted

## Multi-Tenant Considerations

If you chose multi-tenant support:

1. **Verification Requirements**
   - Microsoft may require publisher verification for multi-tenant apps
   - Consider single-tenant if only for your organization

2. **Admin Consent**
   - Each tenant admin must grant consent
   - Or users will see consent prompts

3. **Tenant Restrictions**
   - Some organizations block external apps
   - Coordinate with tenant administrators

## Production Deployment Notes

1. **Dedicated Service Account** (Recommended)
   - Create dedicated Azure AD user for the application
   - Assign minimal required permissions

2. **Conditional Access**
   - Consider Azure AD Conditional Access policies
   - May affect authentication on yacht hardware

3. **Monitoring**
   - Monitor sign-in logs in Azure AD
   - Track API usage in Azure Portal

## Backup Configuration

**Important**: Save this information securely:
- Tenant ID
- Client ID  
- App registration name
- Redirect URIs
- API permissions list
- Any custom configuration

Store this information in your organization's secure documentation system.

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure AD App Registration Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [MSAL Authentication Flows](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows)