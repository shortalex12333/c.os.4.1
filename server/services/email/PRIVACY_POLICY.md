# Privacy Policy - Email Reader for Microsoft Outlook

**Last Updated:** August 1, 2025

## Overview

Email Reader for Microsoft Outlook ("the Application") is designed to provide secure, read-only access to your Microsoft Outlook email account. This privacy policy explains how we handle your information.

## Information We Collect

### Microsoft Account Information
- **User Profile**: Display name, email address, and basic profile information
- **Email Data**: Email messages, subjects, senders, recipients, and timestamps
- **Mailbox Structure**: Folder names and organization

### Authentication Tokens
- **Access Tokens**: Temporary tokens for Microsoft Graph API access
- **Refresh Tokens**: Long-term tokens for automatic authentication renewal

## How We Use Your Information

### Local Processing Only
- All email data is processed locally on your device
- No email content is transmitted to external servers (except Microsoft Graph API)
- No analytics, telemetry, or usage tracking

### Microsoft Graph API
- We use Microsoft Graph API solely to retrieve your email data
- All communications use HTTPS encryption
- We request minimal permissions: Mail.Read, User.Read, MailboxSettings.Read

## Data Storage

### Local Storage
- Email data is temporarily cached in device memory during use
- Authentication tokens are securely stored in macOS Keychain
- No persistent storage of email content on device

### Security Measures
- All tokens encrypted using macOS Keychain services
- Automatic token refresh without storing credentials
- Secure OAuth2 flow with PKCE (Proof Key for Code Exchange)

## Data Sharing

### No Third-Party Sharing
- We do not share your data with any third parties
- We do not sell or monetize your personal information
- We do not perform marketing or advertising activities

### Microsoft Services Only
- The application only communicates with official Microsoft Graph API endpoints
- Your data remains within Microsoft's secure infrastructure
- Microsoft's privacy policies apply to their services

## Your Rights

### Access Control
- You control all authentication through Microsoft's consent system
- You can revoke application access anytime through Azure AD
- Logout feature immediately clears local tokens

### Data Retention
- No permanent data retention by our application
- Email data is only cached temporarily during active sessions
- All cached data is cleared when application closes

## Security

### Technical Safeguards
- OAuth2 with PKCE for secure authentication
- No client secrets or credentials stored
- Automatic token expiration and refresh
- HTTPS for all network communications

### Best Practices
- Minimal permission requests (read-only access)
- Regular security updates and patches
- Secure coding practices following Microsoft guidelines

## Compliance

### Microsoft Standards
- Compliant with Microsoft Graph API terms of service
- Follows Azure AD authentication best practices
- Adheres to Microsoft App Store policies

### Privacy Regulations
- Designed with privacy-by-design principles
- Minimal data collection and processing
- User control over data access and authentication

## Changes to This Policy

We may update this privacy policy periodically. Any changes will be reflected in the "Last Updated" date. Continued use of the application constitutes acceptance of any changes.

## Contact Information

For questions about this privacy policy or the application:
- Review the application documentation
- Check Microsoft's privacy policies for their services
- Consult your organization's IT administrator for enterprise deployments

## Microsoft Services

This application uses Microsoft Graph API services. Please review Microsoft's privacy policy at: https://privacy.microsoft.com/privacystatement

Your use of Microsoft services through this application is governed by Microsoft's terms of service and privacy policies.