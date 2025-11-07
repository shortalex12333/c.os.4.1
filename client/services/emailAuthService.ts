// Microsoft Email Authentication Service for CelesteOS
// Implements OAuth2 + PKCE flow for secure email access

interface EmailAuthConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
  endpoints: {
    authority: string;
    authorize: string;
    token: string;
    graphApi: string;
    metadata: string;
  };
}

interface EmailAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

interface EmailAuthUser {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  companyName?: string;
}

class EmailAuthService {
  private config: EmailAuthConfig;
  private tokens: EmailAuthTokens | null = null;
  private user: EmailAuthUser | null = null;

  constructor() {
    const tenantId = process.env.REACT_APP_AZURE_TENANT_ID || 'common';

    this.config = {
      clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '41f6dc82-8127-4330-97e0-c6b26e6aa967',
      tenantId: tenantId,
      redirectUri: 'http://localhost:8888/auth/callback',
      scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/MailboxSettings.Read',
        'offline_access'
      ],
      endpoints: {
        // Organization-specific authority (accounts in this organizational directory only)
        authority: `https://login.microsoftonline.com/${tenantId}`,
        // OAuth 2.0 v2 endpoints
        authorize: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
        token: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        // Microsoft Graph API
        graphApi: 'https://graph.microsoft.com/v1.0',
        // OpenID Connect metadata
        metadata: `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`
      }
    };
  }

  // Generate PKCE code verifier and challenge
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = btoa(String.fromCharCode.apply(null, 
      Array.from(new Uint8Array(
        new TextEncoder().encode(codeVerifier)
      ))
    )).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    return { codeVerifier, codeChallenge };
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }

  // Initiate OAuth2 login flow
  async initiateLogin(): Promise<{ loginUrl: string; state: string }> {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = this.generateRandomString(32);
    
    // Store PKCE verifier and state in session storage
    sessionStorage.setItem('pkce_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent'
    });

    const loginUrl = `${this.config.endpoints.authorize}?${params}`;
    
    return { loginUrl, state };
  }

  // Handle OAuth callback and exchange code for tokens
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      // Verify state parameter
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      const codeVerifier = sessionStorage.getItem('pkce_verifier');
      if (!codeVerifier) {
        throw new Error('Missing PKCE verifier');
      }

      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
      
      if (tokenResponse.access_token) {
        this.tokens = {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
          scope: tokenResponse.scope
        };

        // Get user profile
        await this.fetchUserProfile();
        
        // Store tokens securely (in production, use backend storage)
        this.storeTokens();
        
        // Clean up session storage
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('oauth_state');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }

  // Handle popup-based OAuth flow
  async initiatePopupLogin(): Promise<boolean> {
    try {
      const { loginUrl, state } = await this.initiateLogin();
      
      // Open Microsoft login in popup window
      const popup = window.open(
        loginUrl,
        'microsoftAuth',
        'width=500,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
      );
      
      if (!popup) {
        throw new Error('Popup blocked - please allow popups for this site');
      }
      
      // Wait for OAuth callback
      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          // Only accept messages from the callback server
          if (!event.origin.includes('localhost:8888')) return;
          
          if (event.data.type === 'OAUTH_CALLBACK') {
            window.removeEventListener('message', messageHandler);
            popup.close();
            
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              // Handle the callback with received code and state
              this.handleCallback(event.data.code, event.data.state)
                .then(success => resolve(success))
                .catch(error => reject(error));
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            resolve(false); // User cancelled
          }
        }, 1000);
        
        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout'));
        }, 10 * 60 * 1000);
      });
      
    } catch (error) {
      console.error('Popup login error:', error);
      throw error;
    }
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      code: code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    });

    const response = await fetch(this.config.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Fetch user profile from Microsoft Graph
  private async fetchUserProfile(): Promise<void> {
    if (!this.tokens?.accessToken) return;

    try {
      const response = await fetch(`${this.config.endpoints.graphApi}/me`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profile = await response.json();
        this.user = {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.mail || profile.userPrincipalName,
          jobTitle: profile.jobTitle,
          companyName: profile.companyName
        };
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }

  // Store tokens (in production, send to backend for secure storage)
  private storeTokens(): void {
    if (this.tokens && this.user) {
      localStorage.setItem('email_auth_tokens', JSON.stringify(this.tokens));
      localStorage.setItem('email_auth_user', JSON.stringify(this.user));
    }
  }

  // Load stored tokens
  loadStoredTokens(): boolean {
    try {
      const storedTokens = localStorage.getItem('email_auth_tokens');
      const storedUser = localStorage.getItem('email_auth_user');
      
      if (storedTokens && storedUser) {
        this.tokens = JSON.parse(storedTokens);
        this.user = JSON.parse(storedUser);
        
        // Check if tokens are still valid
        if (this.tokens && this.tokens.expiresAt > Date.now()) {
          return true;
        }
        
        // Try to refresh if expired
        return this.refreshTokens();
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    }
    
    return false;
  }

  // Refresh access token using refresh token
  private async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;

    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        scope: this.config.scopes.join(' '),
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token'
      });

      const response = await fetch(this.config.endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (response.ok) {
        const tokenData = await response.json();
        this.tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || this.tokens.refreshToken,
          expiresAt: Date.now() + (tokenData.expires_in * 1000),
          scope: tokenData.scope
        };
        
        this.storeTokens();
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }

  // Get current authentication status
  isAuthenticated(): boolean {
    return !!(this.tokens && this.user && this.tokens.expiresAt > Date.now());
  }

  // Get OpenID Connect metadata for validation
  async getMetadata(): Promise<any> {
    try {
      const response = await fetch(this.config.endpoints.metadata);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching OpenID Connect metadata:', error);
      throw error;
    }
  }

  // Get configuration information
  getConfig(): EmailAuthConfig {
    return { ...this.config };
  }

  // Validate endpoints connectivity
  async validateEndpoints(): Promise<{
    metadata: boolean;
    graphApi: boolean;
    endpoints: typeof this.config.endpoints;
  }> {
    const results = {
      metadata: false,
      graphApi: false,
      endpoints: this.config.endpoints
    };

    // Test metadata endpoint
    try {
      await this.getMetadata();
      results.metadata = true;
    } catch (error) {
      console.warn('Metadata endpoint validation failed:', error);
    }

    // Test Graph API endpoint (without auth)
    try {
      const response = await fetch(`${this.config.endpoints.graphApi}/$metadata`);
      results.graphApi = response.ok;
    } catch (error) {
      console.warn('Graph API endpoint validation failed:', error);
    }

    return results;
  }

  // Get user information
  getUser(): EmailAuthUser | null {
    return this.user;
  }

  // Get access token for API calls
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) return null;
    
    // Check if token needs refresh
    if (this.tokens.expiresAt <= Date.now() + 60000) { // Refresh 1 minute early
      const refreshed = await this.refreshTokens();
      if (!refreshed) return null;
    }
    
    return this.tokens.accessToken;
  }

  // Logout and clear stored data
  logout(): void {
    this.tokens = null;
    this.user = null;
    localStorage.removeItem('email_auth_tokens');
    localStorage.removeItem('email_auth_user');
  }

  // Search emails using Microsoft Graph API
  async searchEmails(query: string, options: {
    folder?: string;
    top?: number;
    skip?: number;
  } = {}): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) throw new Error('Not authenticated');

    const { folder = 'inbox', top = 25, skip = 0 } = options;
    let endpoint = `${this.config.endpoints.graphApi}/me/mailFolders/${folder}/messages`;
    
    const params = new URLSearchParams({
      $search: `"${query}"`,
      $top: top.toString(),
      $skip: skip.toString(),
      $select: 'id,subject,from,receivedDateTime,bodyPreview,hasAttachments,importance',
      $orderby: 'receivedDateTime desc'
    });

    const response = await fetch(`${endpoint}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Email search failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Create singleton instance
const emailAuthService = new EmailAuthService();

export default emailAuthService;
export { EmailAuthService };
export type { EmailAuthUser, EmailAuthTokens };