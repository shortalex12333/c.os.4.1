import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Path to the email services (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_SERVICES_PATH = path.join(__dirname, '..', 'services', 'email');

// Microsoft OAuth configuration
const MICROSOFT_CONFIG = {
  tenantId: 'common', // Use 'common' for multitenant apps
  clientId: '41f6dc82-8127-4330-97e0-c6b26e6aa967',
  clientSecret: '<your-azure-client-secret>',
  redirectUri: process.env.NODE_ENV === 'production'
    ? 'https://celeste7.ai/auth/microsoft/callback'
    : 'http://localhost:8888/auth/microsoft/callback',
  scopes: [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'https://graph.microsoft.com/MailboxSettings.Read',
    'offline_access'
  ]
};

// Generate OAuth2 authorization URL
function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: MICROSOFT_CONFIG.redirectUri,
    scope: MICROSOFT_CONFIG.scopes.join(' '),
    state: state,
    prompt: 'select_account', // Allow user to pick account, maintains session
    response_mode: 'query'
  });

  const authority = `https://login.microsoftonline.com/${MICROSOFT_CONFIG.tenantId}`;
  return `${authority}/oauth2/v2.0/authorize?${params}`;
}

// Generate random state for CSRF protection
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Route: /microsoft-auth - Initiate OAuth flow
router.get('/microsoft-auth', (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required. Please ensure you are logged in.'
      });
    }

    // Simple state: just use user_id directly with random suffix for CSRF
    const state = `${user_id}:${generateState()}`;
    const authUrl = generateAuthUrl(state);

    console.log(`🚀 Generated Microsoft auth URL for user: ${user_id}`);

    // For AJAX requests, return JSON with authUrl for frontend to open in new tab
    if (req.headers.accept?.includes('application/json')) {
      res.json({
        success: true,
        authUrl: authUrl,
        state: state,
        message: 'Open this URL in a new tab to authenticate'
      });
    } else {
      // Direct redirect (fallback behavior)
      res.redirect(authUrl);
    }
  } catch (error) {
    console.error('❌ Microsoft auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication URL'
    });
  }
});

// Route: /auth/microsoft/relay - Handle OAuth relay from localhost:8888
router.post('/auth/microsoft/relay', async (req: Request, res: Response) => {
  try {
    const {
      code,
      state,
      success,
      access_token,
      refresh_token,
      expires_in,
      user_id,
      microsoft_user_id,
      user_email,
      display_name
    } = req.body;

    console.log(`🔄 Received OAuth relay from localhost:8888 - Success: ${success}`);
    console.log('📄 Token data to store:', {
      supabase_user_id: user_id,
      microsoft_user_id: microsoft_user_id,
      user_email: user_email,
      display_name: display_name,
      has_access_token: !!access_token,
      has_refresh_token: !!refresh_token,
      expires_in: expires_in
    });

    if (success && code && access_token) {
      // Direct Supabase storage - Process and store Microsoft tokens
      console.log('💾 Processing Microsoft tokens and storing to Supabase...');

      const supabaseUrl = 'http://127.0.0.1:54321';
      const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

      // Extract email with fallback handling
      let originalEmail = user_email || '';
      if (!originalEmail && user_email?.includes('#EXT#')) {
        const parts = user_email.split('#EXT#')[0].split('_');
        originalEmail = parts.slice(0, -1).join('_') + '@' + parts[parts.length - 1];
      }

      // Calculate timestamps properly
      const now = new Date();
      const expiresIn = parseInt(expires_in) || 3600;
      const tokenExpiresAt = new Date(now.getTime() + (expiresIn * 1000)).toISOString();

      // Token data for insert - matching actual table structure
      const tokenData = {
        // User identity
        user_id: user_id, // Supabase auth user_id
        microsoft_user_id: microsoft_user_id, // Microsoft Graph user ID

        // Tokens
        microsoft_access_token: access_token,
        microsoft_refresh_token: refresh_token,
        token_expires_at: tokenExpiresAt,

        // Email info
        microsoft_email: user_email,
        original_email: originalEmail,

        // Profile
        display_name: display_name || null,

        // Token metadata
        token_type: 'Bearer',
        scopes: MICROSOFT_CONFIG.scopes, // Array of scopes

        // Timestamps
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      // Remove any empty string values that should be null
      Object.keys(tokenData).forEach(key => {
        if (tokenData[key] === '' || tokenData[key] === 'null') {
          tokenData[key] = null;
        }
      });

      try {
        // Step 1: Delete existing tokens
        console.log('🗑️ Deleting existing tokens for user:', user_id);
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/user_microsoft_tokens?user_id=eq.${user_id}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          console.log('✅ Existing tokens deleted (if any)');
        } else {
          const deleteError = await deleteResponse.text();
          console.warn('⚠️ Delete operation failed:', deleteResponse.status, deleteError);
        }

        // Step 2: Insert new token record
        console.log('➕ Creating new token record for user:', user_id);
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_microsoft_tokens`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(tokenData)
        });

        if (insertResponse.ok) {
          const result = await insertResponse.json();
          console.log('✅ Token stored successfully:', {
            record_id: result[0]?.id,
            user_id: user_id,
            microsoft_user_id: microsoft_user_id,
            email: user_email,
            display_name: display_name,
            expires_at: tokenExpiresAt
          });

          // Success - show success page
          const successHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Email Connected!</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: green; }
              </style>
            </head>
            <body>
              <h2 class="success">✅ Email Successfully Connected!</h2>
              <p>Your Microsoft account has been linked to CelesteOS.</p>
              <p>You can now close this window and return to the app.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'MICROSOFT_AUTH_SUCCESS',
                    email: '${user_email}',
                    display_name: '${display_name}'
                  }, '*');
                  setTimeout(function() { window.close(); }, 2000);
                } else {
                  setTimeout(function() {
                    window.location.href = 'http://localhost:8888';
                  }, 3000);
                }
              </script>
            </body>
            </html>
          `;
          return res.send(successHtml);
        } else {
          const error = await insertResponse.text();
          console.error('❌ Failed to store token:', insertResponse.status, error);
          throw new Error(`Database insert failed: ${error}`);
        }
      } catch (error) {
        console.error('❌ Token storage error:', error);
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Connection Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <h2 class="error">❌ Failed to Save Email Connection</h2>
            <p>Authentication succeeded but failed to save credentials.</p>
            <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p>Please try again or contact support.</p>
            <script>
              setTimeout(function() { window.close(); }, 5000);
            </script>
          </body>
          </html>
        `;
        return res.status(500).send(errorHtml);
      }
    } else {
      // Missing required data
      return res.status(400).send('Authentication relay failed - missing required data');
    }
  } catch (error) {
    console.error('❌ OAuth relay error:', error);
    res.status(500).send('Relay processing failed');
  }
});

// Route: /auth/microsoft/callback - Handle OAuth callback
router.get('/auth/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error(`❌ OAuth error: ${error} - ${error_description}`);

      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h2 class="error">❌ Authentication Error</h2>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${error_description}</p>
          <p>Please close this window and try again.</p>
          <script>
            setTimeout(function() { window.close(); }, 5000);
          </script>
        </body>
        </html>
      `;
      return res.status(400).send(errorHtml);
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'No authorization code received'
      });
    }

    // Extract user_id from state parameter (format: "user_id:random")
    const user_id = (state as string).split(':')[0];

    if (!user_id) {
      console.error('❌ No user_id found in state parameter');
      return res.status(400).json({
        success: false,
        error: 'User ID required. Please ensure you are logged in before connecting email.'
      });
    }

    console.log(`✅ Received auth code for user_id: ${user_id}`);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CONFIG.clientId,
        client_secret: MICROSOFT_CONFIG.clientSecret,
        scope: MICROSOFT_CONFIG.scopes.join(' '),
        code: code as string,
        redirect_uri: MICROSOFT_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenError,
        requestDetails: {
          client_id: MICROSOFT_CONFIG.clientId,
          redirect_uri: MICROSOFT_CONFIG.redirectUri,
          code_length: (code as string).length
        }
      });
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${tokenError}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('📄 Token data received:', {
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : 'none',
      refresh_token: tokenData.refresh_token ? `${tokenData.refresh_token.substring(0, 20)}...` : 'none',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

    // Get user profile info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    let userInfo = null;
    if (userResponse.ok) {
      userInfo = await userResponse.json();
      console.log('👤 Microsoft user info:', {
        microsoft_id: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName,
        displayName: userInfo.displayName
      });
    }

    // Relay the auth success to backend for storage
    const relayHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: green; }
        </style>
      </head>
      <body>
        <h2 class="success">✅ Authentication Successful!</h2>
        <p>Redirecting you back to CelesteOS...</p>
        <form id="relayForm" action="http://localhost:8888/auth/microsoft/relay" method="post">
          <input type="hidden" name="code" value="${code}">
          <input type="hidden" name="state" value="${state}">
          <input type="hidden" name="success" value="true">
          <input type="hidden" name="access_token" value="${tokenData.access_token}">
          <input type="hidden" name="refresh_token" value="${tokenData.refresh_token || ''}">
          <input type="hidden" name="expires_in" value="${tokenData.expires_in}">
          <input type="hidden" name="user_id" value="${user_id}">
          <input type="hidden" name="microsoft_user_id" value="${userInfo?.id || ''}">
          <input type="hidden" name="user_email" value="${userInfo?.mail || userInfo?.userPrincipalName || ''}">
          <input type="hidden" name="display_name" value="${userInfo?.displayName || ''}">
        </form>
        <script>
          // Auto-submit the form to relay back to backend
          document.getElementById('relayForm').submit();
        </script>
      </body>
      </html>
    `;

    res.send(relayHtml);

  } catch (error) {
    console.error('❌ Callback handling error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });

    res.status(500).json({
      success: false,
      error: 'Failed to process authentication callback',
      details: errorMessage
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'email-integration',
    timestamp: new Date().toISOString()
  });
});

// Get user email status
router.get('/user/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user has email tokens in Supabase
    const supabaseUrl = 'http://127.0.0.1:54321';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
    
    console.log('🔍 Checking email status for user:', userId);
    
    // Try exact user_id match first
    let queryUrl = `${supabaseUrl}/rest/v1/user_microsoft_tokens?user_id=eq.${userId}`;
    console.log('📡 Supabase query URL (exact):', queryUrl);
    
    let response = await fetch(queryUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    let tokens = [];
    if (response.ok) {
      tokens = await response.json();
      console.log('📄 Exact match response:', tokens.length, 'tokens found');
    }
    
    // If no exact match and the userId looks like an email, try searching by original_email
    if ((!tokens || tokens.length === 0) && userId.includes('@')) {
      console.log('🔄 No exact match found, trying email lookup for:', userId);
      queryUrl = `${supabaseUrl}/rest/v1/user_microsoft_tokens?original_email=eq.${userId}`;
      console.log('📡 Supabase query URL (email):', queryUrl);
      
      response = await fetch(queryUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        tokens = await response.json();
        console.log('📄 Email match response:', tokens.length, 'tokens found');
      }
    }
    
    // If still no match, try getting the first available token (fallback for demos)
    if (!tokens || tokens.length === 0) {
      console.log('🔄 No matches found, checking for any tokens (fallback)');
      queryUrl = `${supabaseUrl}/rest/v1/user_microsoft_tokens?limit=1`;
      
      response = await fetch(queryUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        tokens = await response.json();
        console.log('📄 Fallback response:', tokens.length, 'tokens found');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Supabase query failed:', response.status, response.statusText, errorText);
      throw new Error(`Supabase query failed: ${response.status} ${response.statusText}`);
    }
    
    console.log('📄 Final Supabase response data:', JSON.stringify(tokens, null, 2));
    
    // Check if user has valid refresh token (not just access token)
    const userConnected = tokens && tokens.length > 0 && tokens[0].microsoft_refresh_token;
    const userRecord = userConnected ? tokens[0] : null;
    
    // Estimate refresh token expiry (90 days from creation)
    let refreshTokenValid = false;
    let estimatedRefreshExpiry = null;
    let refreshDaysRemaining = 0;
    
    if (userRecord && userRecord.created_at) {
      const createdAt = new Date(userRecord.created_at);
      estimatedRefreshExpiry = new Date(createdAt.getTime() + (90 * 24 * 60 * 60 * 1000));
      refreshTokenValid = estimatedRefreshExpiry > new Date();
      refreshDaysRemaining = Math.ceil((estimatedRefreshExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }
    
    const finalConnected = userConnected && refreshTokenValid;
    
    console.log('✅ Email status result:', { 
      userConnected, 
      refreshTokenValid, 
      finalConnected,
      refreshDaysRemaining,
      userRecord: userRecord ? { id: userRecord.id, email: userRecord.microsoft_email } : null 
    });
    
    res.json({
      user_id: userId,
      email_connected: finalConnected,
      status: finalConnected ? 'connected' : 'not_connected',
      user_email: userRecord ? userRecord.microsoft_email : null,
      display_name: userRecord ? userRecord.display_name : null,
      connected_at: userRecord ? userRecord.created_at : null,
      estimated_refresh_expires_at: estimatedRefreshExpiry ? estimatedRefreshExpiry.toISOString() : null,
      refresh_days_remaining: refreshDaysRemaining,
      // Add debugging info
      debug: {
        query_user_id: userId,
        found_user_id: userRecord ? userRecord.user_id : null,
        has_refresh_token: userRecord ? !!userRecord.microsoft_refresh_token : false,
        refresh_token_valid: refreshTokenValid,
        lookup_method: userRecord ? 'found' : 'not_found'
      }
    });
  } catch (error) {
    console.error('Error checking user email status:', error);
    res.status(500).json({ 
      error: 'Failed to check email status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search user emails
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { user_id, query, limit = 10 } = req.body;

    if (!user_id || !query) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'query']
      });
    }

    // Forward request to email API service
    const response = await fetch('http://localhost:8001/api/email/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, query, limit })
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ 
      error: 'Email search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start user registration flow
router.get('/connect', (req: Request, res: Response) => {
  const { user_id, return_url } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  // Redirect to registration service
  const registrationUrl = `http://localhost:8003/register?user_id=${user_id}${return_url ? `&return_url=${encodeURIComponent(return_url as string)}` : ''}`;
  res.redirect(registrationUrl);
});

// Microsoft OAuth callback

export default router;