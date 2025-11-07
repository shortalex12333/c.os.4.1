import { Router, Request, Response } from 'express';
import { emailSupabaseService } from '../services/emailSupabaseIntegration';

const router = Router();

/**
 * Enhanced webhook proxy that includes user's bearer token
 * This endpoint receives webhook requests from frontend and enriches them with bearer tokens
 */
router.post('/enhanced', async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      userName, 
      search_strategy, 
      message, 
      conversation_id, 
      sessionId, 
      timestamp, 
      webhookUrl, 
      executionMode,
      email_integration 
    } = req.body;

    // Get user's bearer token from Supabase
    const emailData = await emailSupabaseService.getUserTokenForWebhook(userId);
    
    // Enhanced webhook payload with bearer token and Microsoft Graph API credentials
    const enhancedPayload = {
      userId,
      userName,
      search_strategy,
      message,
      conversation_id,
      sessionId,
      timestamp,
      webhookUrl,
      executionMode,
      // Enhanced email integration data with actual bearer token and app credentials
      email_integration: {
        connected: emailData.email_connected,
        user_email: emailData.user_email,
        bearer_token: emailData.bearer_token, // User's access token
        outlook_registered: emailData.outlook_registered,
        token_available: !!emailData.bearer_token,
        // Microsoft Graph API credentials for n8n
        graph_api: {
          client_id: process.env.AZURE_CLIENT_ID || 'a744caeb-9896-4dbf-8b85-d5e07dba935c',
          tenant_id: process.env.AZURE_TENANT_ID || 'd44c2402-b515-4d6d-a392-5cfc88ae53bb',
          base_url: 'https://graph.microsoft.com/v1.0',
          scopes: ['Mail.Read', 'MailboxSettings.Read', 'User.Read']
        }
      }
    };

    console.log(`📧 Enhanced webhook for user ${userId}:`, {
      email_connected: emailData.email_connected,
      has_bearer_token: !!emailData.bearer_token,
      user_email: emailData.user_email ? '***@***.***' : undefined,
      has_graph_credentials: true
    });

    // Forward to actual n8n webhook with bearer token
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedPayload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    const webhookResponse = await response.json();
    res.json(webhookResponse);

  } catch (error) {
    console.error('Enhanced webhook error:', error);
    res.status(500).json({ 
      error: 'Enhanced webhook failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Store user bearer token after Microsoft OAuth callback
 */
router.post('/store-bearer-token', async (req: Request, res: Response) => {
  try {
    const { 
      user_id, 
      access_token, 
      refresh_token, 
      expires_in, 
      user_email, 
      display_name,
      scopes 
    } = req.body;

    if (!user_id || !access_token || !user_email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_id', 'access_token', 'user_email'] 
      });
    }

    const result = await emailSupabaseService.storeUserTokens(user_id, {
      access_token,
      refresh_token,
      expires_in: expires_in || 3600,
      user_email,
      display_name,
      scopes
    });

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Bearer token stored successfully',
        user_id,
        user_email
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error) {
    console.error('Store bearer token error:', error);
    res.status(500).json({ 
      error: 'Failed to store bearer token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's email connection status with bearer token info
 */
router.get('/user/:userId/bearer-status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const emailData = await emailSupabaseService.getUserTokenForWebhook(userId);
    
    res.json({
      user_id: userId,
      email_connected: emailData.email_connected,
      bearer_token_available: !!emailData.bearer_token,
      outlook_registered: emailData.outlook_registered,
      user_email: emailData.user_email,
      // Don't send actual token in response for security
      has_valid_token: emailData.email_connected
    });

  } catch (error) {
    console.error('Bearer status error:', error);
    res.status(500).json({ 
      error: 'Failed to get bearer status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;