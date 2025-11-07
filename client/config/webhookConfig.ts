// Webhook Configuration - Environment-based URLs
// This file ensures ALL webhook calls use the correct base URL
// regardless of where the frontend is hosted

// Use environment variable with fallback to Express proxy on port 8082
// IMPORTANT: Always go through Express proxy, never directly to n8n (port 5678)
const getDefaultBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const baseUrl = `${window.location.origin}/webhook`;
    console.log('🔍 [webhookConfig] Computed baseUrl:', baseUrl);
    console.log('🔍 [webhookConfig] window.location.origin:', window.location.origin);
    console.log('🔍 [webhookConfig] window.location.hostname:', window.location.hostname);
    return baseUrl;
  }
  return 'http://localhost:8082/webhook';
};

const envWebhookUrl = import.meta.env.VITE_WEBHOOK_BASE_URL?.trim();
const WEBHOOK_BASE_URL = envWebhookUrl && envWebhookUrl.length > 0
  ? envWebhookUrl
  : getDefaultBaseUrl();

console.log('🔍 [webhookConfig] Final WEBHOOK_BASE_URL:', WEBHOOK_BASE_URL);

// Webhook endpoints configuration
export const WEBHOOK_CONFIG = {
  baseUrl: WEBHOOK_BASE_URL,
  
  // Authentication endpoints
  auth: {
    login: `${WEBHOOK_BASE_URL}/auth/login`,
    signup: `${WEBHOOK_BASE_URL}/auth-signup`,
    logout: `${WEBHOOK_BASE_URL}/auth/logout`,
    verifyToken: `${WEBHOOK_BASE_URL}/auth/verify-token`
  },
  
  // Chat endpoints - text-chat for local mode
  chat: {
    textChat: `${WEBHOOK_BASE_URL}/text-chat`,
    askAI: typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? `http://localhost:5678/webhook/ask-ai`
      : `https://api.celeste7.ai/webhook/ask-ai`
  },
  
  // Maritime AI feedback endpoint
  feedback: {
    solutionFeedback: `${WEBHOOK_BASE_URL}/solution-feedback`
  },

  // Export endpoints
  export: {
    outlook: `${WEBHOOK_BASE_URL}/export-outlook`
  },

  
  // Request configuration
  defaults: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    mode: 'cors' as RequestMode,
    credentials: 'omit' as RequestCredentials
  },
  
  // Timeouts and retries
  timeout: 30000,
  maxRetries: 2,
  retryDelay: 1000
};

// Export individual URLs for convenience
export const WEBHOOK_URLS = {
  TEXT_CHAT: WEBHOOK_CONFIG.chat.textChat
};

// Export base URL
export { WEBHOOK_BASE_URL };

export default WEBHOOK_CONFIG;
