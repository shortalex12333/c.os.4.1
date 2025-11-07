import { Router, Request, Response } from 'express';

const router = Router();

// Helper function to get n8n base URL based on environment
const getN8nBaseUrl = (): string => {
  return process.env.NODE_ENV === 'production'
    ? 'https://api.celeste7.ai/webhook'
    : 'http://localhost:5678/webhook';
};

/**
 * Text-Chat webhook endpoint
 * Receives chat messages from frontend and forwards to n8n
 */
router.post('/text-chat', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    console.log('📨 Received text-chat webhook:', {
      userId: payload.userId,
      message: payload.message?.substring(0, 50) + '...',
      search_strategy: payload.search_strategy,
      timestamp: new Date().toISOString()
    });

    // Forward to n8n webhook
    const n8nWebhookUrl = `${getN8nBaseUrl()}/text-chat`;
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    // Get response text first
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ n8n webhook failed:', response.status, responseText);
      return res.status(response.status).json({ 
        error: 'Webhook forwarding failed',
        details: responseText
      });
    }

    // Try to parse as JSON if possible
    if (responseText && responseText.trim()) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('✅ n8n response received:', responseData);
        return res.json(responseData);
      } catch (e) {
        // Not JSON, return as text
        console.log('✅ n8n response (text):', responseText);
        return res.send(responseText);
      }
    } else {
      // Empty response from n8n
      console.log('⚠️ Empty response from n8n');
      return res.json({
        success: true,
        message: 'Message received and processed',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Text-chat webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Email search webhook endpoint
 */
router.post('/email-search', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    console.log('📧 Received email-search webhook');

    // Forward to n8n
    const n8nWebhookUrl = `${getN8nBaseUrl()}/email-search`;
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Email search failed',
        details: responseData
      });
    }

    // Try to parse and return
    try {
      const data = JSON.parse(responseData);
      res.json(data);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('Email search webhook error:', error);
    res.status(500).json({ 
      error: 'Email search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * LLM-only webhook endpoint (no search, just Ollama)
 */
router.post('/llm-only', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    console.log('🤖 Received llm-only webhook');

    // Forward to n8n
    const n8nWebhookUrl = `${getN8nBaseUrl()}/llm-only`;
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'LLM processing failed',
        details: responseData
      });
    }

    // Try to parse and return
    try {
      const data = JSON.parse(responseData);
      res.json(data);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('LLM-only webhook error:', error);
    res.status(500).json({ 
      error: 'LLM processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * User authentication webhook endpoint
 */
router.post('/user-auth', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log('🔐 Received user-auth webhook:', {
      action: payload.action,
      username: payload.username,
      timestamp: new Date().toISOString()
    });

    // Forward to n8n
    const n8nWebhookUrl = `${getN8nBaseUrl()}/user-auth`;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'User authentication failed',
        details: responseData
      });
    }

    // Try to parse and return
    try {
      const data = JSON.parse(responseData);
      res.json(data);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('User auth webhook error:', error);
    res.status(500).json({
      error: 'User authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Ask AI Solution webhook endpoint
 */
router.post('/ask-ai-sol', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log('🤖 Received ask-ai-sol webhook:', {
      userId: payload.userId,
      message: payload.message?.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    // Forward to n8n
    const n8nWebhookUrl = `${getN8nBaseUrl()}/ask-ai-sol`;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Ask AI processing failed',
        details: responseData
      });
    }

    // Try to parse and return
    try {
      const data = JSON.parse(responseData);
      res.json(data);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('Ask AI webhook error:', error);
    res.status(500).json({
      error: 'Ask AI processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Token refresh trigger webhook endpoint
 */
router.post('/token-refresh-trigger', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log('🔄 Received token-refresh-trigger webhook');

    // Forward to n8n
    const n8nWebhookUrl = `${getN8nBaseUrl()}/token-refresh-trigger`;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Token refresh failed',
        details: responseData
      });
    }

    // Try to parse and return
    try {
      const data = JSON.parse(responseData);
      res.json(data);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('Token refresh webhook error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Token refresh complete webhook endpoint
 */
router.post('/token-refresh-complete', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log('✅ Received token-refresh-complete webhook');

    // Forward to n8n
    const n8nWebhookUrl = `${getN8nBaseUrl()}/token-refresh-complete`;

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Token refresh complete callback failed',
        details: responseData
      });
    }

    // Try to parse and return
    try {
      const data = JSON.parse(responseData);
      res.json(data);
    } catch {
      res.send(responseData);
    }

  } catch (error) {
    console.error('Token refresh complete webhook error:', error);
    res.status(500).json({
      error: 'Token refresh complete callback failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check for webhook endpoints
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    endpoints: [
      '/webhook/text-chat',
      '/webhook/email-search',
      '/webhook/llm-only',
      '/webhook/user-auth',
      '/webhook/ask-ai-sol',
      '/webhook/token-refresh-trigger',
      '/webhook/token-refresh-complete'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;