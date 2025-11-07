// Webhook Configuration - HARDCODED URLs
// This file ensures ALL webhook calls use the correct base URL
// regardless of where the frontend is hosted

// CRITICAL: This URL is HARDCODED and should NEVER be dynamic
const WEBHOOK_BASE_URL = 'http://localhost:8000';

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
  
  // Chat endpoints
  chat: {
    textChatFast: `${WEBHOOK_BASE_URL}/text-chat-fast`,
    fetchChat: `${WEBHOOK_BASE_URL}/fetch-chat`,
    fetchConversations: `${WEBHOOK_BASE_URL}/fetch-conversations`
  },
  
  // Data endpoints
  data: {
    getData: `${WEBHOOK_BASE_URL}/get-data`
  },
  
  // Request configuration
  defaults: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  },
  
  // Timeouts and retries
  timeout: 30000,
  maxRetries: 2,
  retryDelay: 1000
};

// Export individual URLs for convenience
export const WEBHOOK_URLS = {
  AUTH_LOGIN: WEBHOOK_CONFIG.auth.login,
  AUTH_SIGNUP: WEBHOOK_CONFIG.auth.signup,
  AUTH_LOGOUT: WEBHOOK_CONFIG.auth.logout,
  AUTH_VERIFY_TOKEN: WEBHOOK_CONFIG.auth.verifyToken,
  TEXT_CHAT_FAST: WEBHOOK_CONFIG.chat.textChatFast,
  FETCH_CHAT: WEBHOOK_CONFIG.chat.fetchChat,
  FETCH_CONVERSATIONS: WEBHOOK_CONFIG.chat.fetchConversations,
  GET_DATA: WEBHOOK_CONFIG.data.getData
};

// Export base URL
export { WEBHOOK_BASE_URL };

export default WEBHOOK_CONFIG;