/**
 * Complete Webhook Service with All Endpoints
 * Includes authentication, chat, and Microsoft integration
 */

import { WEBHOOK_BASE_URL, WEBHOOK_CONFIG } from '../config/webhookConfig';

// ============ TYPE DEFINITIONS ============

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserAuthPayload {
  email: string;
  password: string;
  displayName?: string;
}

interface UserAuthResponse {
  success: boolean;
  userId: string;
  userName: string;
  email: string;
  token?: string;
  sessionId: string;
  message?: string;
}

interface TextChatPayload {
  userId: string;
  userName: string;
  message: string;
  search_strategy: 'yacht' | 'email';
  conversation_id: string;
  sessionId: string;
  timestamp: string;
  webhookUrl?: string;
  executionMode: 'production' | 'test';
}

interface MicrosoftAuthPayload {
  userId: string;
  email: string;
  redirectUri?: string;
}

interface MicrosoftAuthResponse {
  success: boolean;
  authUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  userEmail?: string;
  displayName?: string;
}

interface TokenRefreshPayload {
  userId: string;
  refreshToken: string;
  email: string;
}

// ============ WEBHOOK SERVICE CLASS ============

class CompleteWebhookService {
  private baseUrl: string;
  private currentUser: UserAuthResponse | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseUrl = WEBHOOK_BASE_URL;
    // Try to restore session from localStorage
    this.restoreSession();
  }

  // ============ HELPER METHODS ============

  private async sendRequest<T = any>(
    endpoint: string,
    payload: any,
    options: RequestInit = {}
  ): Promise<WebhookResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Wrap payload in the expected format with metadata
    const webhookPayload = {
      ...payload,
      webhookUrl: url,
      executionMode: 'production'
    };
    
    try {
      console.log(`📤 Webhook request to ${endpoint}:`, webhookPayload);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
        },
        body: JSON.stringify(webhookPayload),
        ...options
      });

      const responseText = await response.text();
      
      // Handle empty responses
      if (!responseText || responseText.trim() === '') {
        return { 
          success: response.ok, 
          data: {} as T,
          message: 'Empty response from webhook'
        };
      }

      // Try to parse JSON
      try {
        const data = JSON.parse(responseText);
        console.log(`✅ Webhook response from ${endpoint}:`, data);
        return { success: response.ok, data };
      } catch (e) {
        console.warn('Non-JSON response:', responseText);
        return { 
          success: response.ok, 
          data: responseText as any,
          message: 'Non-JSON response'
        };
      }

    } catch (error: any) {
      console.error(`❌ Webhook error for ${endpoint}:`, error);
      return {
        success: false,
        error: error.message || 'Request failed'
      };
    }
  }

  private saveSession(): void {
    if (this.currentUser) {
      localStorage.setItem('celesteos_user', JSON.stringify(this.currentUser));
    }
    if (this.accessToken) {
      localStorage.setItem('celesteos_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('celesteos_refresh_token', this.refreshToken);
    }
  }

  private restoreSession(): void {
    const userStr = localStorage.getItem('celesteos_user');
    const accessToken = localStorage.getItem('celesteos_access_token');
    const refreshToken = localStorage.getItem('celesteos_refresh_token');

    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to restore user session');
      }
    }
    
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  private clearSession(): void {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('celesteos_user');
    localStorage.removeItem('celesteos_access_token');
    localStorage.removeItem('celesteos_refresh_token');
  }

  // ============ AUTHENTICATION WEBHOOKS ============

  /**
   * User Login
   * Webhook: http://localhost:5678/webhook/user-auth
   */
  async login(email: string, password: string): Promise<WebhookResponse<UserAuthResponse>> {
    const payload = {
      action: 'user_login',
      username: email.toLowerCase().trim(),
      password,
      timestamp: new Date().toISOString(),
      source: 'celesteos_modern_local_ux',
      client_info: {
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    const response = await this.sendRequest<UserAuthResponse>('/user-auth', payload);
    
    if (response.success && response.data) {
      this.currentUser = response.data;
      this.saveSession();
    }

    return response;
  }

  /**
   * User Signup (also uses user-auth endpoint with displayName)
   */
  async signup(displayName: string, email: string, password: string): Promise<WebhookResponse<UserAuthResponse>> {
    const payload = {
      action: 'user_signup',
      username: email.toLowerCase().trim(),
      password,
      displayName: displayName.trim(),
      timestamp: new Date().toISOString(),
      source: 'celesteos_modern_local_ux',
      client_info: {
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    const response = await this.sendRequest<UserAuthResponse>('/user-auth', payload);
    
    if (response.success && response.data) {
      this.currentUser = response.data;
      this.saveSession();
    }

    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<boolean> {
    this.clearSession();
    // Optionally notify server about logout
    if (this.currentUser) {
      await this.sendRequest('/user-auth', {
        action: 'logout',
        userId: this.currentUser.userId
      });
    }
    return true;
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserAuthResponse | null {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  // ============ CHAT WEBHOOKS ============

  /**
   * Send Text Chat Message
   * Webhook: http://localhost:5678/webhook/text-chat
   */
  async sendTextChat(
    message: string,
    searchStrategy: 'yacht' | 'email' = 'yacht',
    userData?: { email: string; userName?: string; userId?: string; conversationId?: string; sessionId?: string; selectedModel?: string }
  ): Promise<WebhookResponse<any>> {
    // Use passed conversation tracking or generate fallback
    const conversationId = userData?.conversationId || `conversation_${Date.now()}`;
    const sessionId = userData?.sessionId || `session_${Date.now()}`;

    // ALWAYS prioritize passed userData over internal auth system
    const userEmail = userData?.email || 'user@example.com';
    const userName = userData?.userName || 'User';
    const userId = userData?.userId || `user_${Date.now()}`;

    // Log warning if no userData provided (should not happen)
    if (!userData?.userId) {
      console.warn('🚨 No userId provided to sendTextChat - using fallback. This may cause data mismatch.');
    }

    // Determine ai_bypass based on model selection
    // AIR = search-only (bypass AI), REACH/POWER = AI analysis mode
    const selectedModel = userData?.selectedModel || 'air';
    const ai_bypass = selectedModel === 'air'; // Only AIR bypasses AI (search-only mode)

    // Send the flat structure that matches your validation code
    const payload = {
      "action": "text_chat",
      "userId": userId,
      "userName": userName,
      "message": message,
      "search_strategy": searchStrategy,
      "conversation_id": conversationId,
      "sessionId": sessionId,
      "selectedModel": selectedModel,  // Model selection: air/reach/power
      "ai_bypass": ai_bypass,          // true for AIR (search-only), false for REACH/POWER (AI mode)
      "timestamp": new Date().toISOString(),
      "source": "celesteos_modern_local_ux",
      "client_info": {
        "user_agent": navigator.userAgent,
        "platform": navigator.platform,
        "language": navigator.language
      },
      "webhookUrl": WEBHOOK_CONFIG.chat.textChat,
      "executionMode": "production"
    };

    try {
      console.log('📤 Sending text chat with flat payload structure:', payload);

      // Use configured webhook URL (not window.location.origin to avoid 127.0.0.1 issues)
      const response = await fetch(WEBHOOK_CONFIG.chat.textChat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        return { 
          success: response.ok, 
          data: {},
          message: 'Empty response from webhook'
        };
      }

      try {
        const data = JSON.parse(responseText);
        console.log('✅ Text chat response:', data);
        return { success: response.ok, data };
      } catch (e) {
        console.warn('Non-JSON response:', responseText);
        return { 
          success: response.ok, 
          data: responseText as any,
          message: 'Non-JSON response'
        };
      }

    } catch (error: any) {
      console.error('❌ Text chat error:', error);
      return {
        success: false,
        error: error.message || 'Request failed'
      };
    }
  }

  // ============ MICROSOFT INTEGRATION WEBHOOKS ============

  /**
   * Connect Microsoft Email
   * Webhook: http://localhost:5678/webhook/microsoft-auth
   */
  async connectMicrosoftEmail(): Promise<WebhookResponse<MicrosoftAuthResponse>> {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'User not logged in'
      };
    }

    const payload: MicrosoftAuthPayload = {
      userId: this.currentUser.userId,
      email: this.currentUser.email,
      redirectUri: window.location.origin + '/auth/microsoft/callback'
    };

    const response = await this.sendRequest<MicrosoftAuthResponse>('/microsoft-auth', payload);
    
    if (response.success && response.data) {
      // If we got an auth URL, redirect to it
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
      
      // If we got tokens, save them
      if (response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken || null;
        this.saveSession();
      }
    }

    return response;
  }

  /**
   * Handle Microsoft OAuth Callback
   */
  async handleMicrosoftCallback(code: string): Promise<WebhookResponse<MicrosoftAuthResponse>> {
    if (!this.currentUser) {
      return {
        success: false,
        error: 'User not logged in'
      };
    }

    const payload = {
      userId: this.currentUser.userId,
      email: this.currentUser.email,
      code,
      action: 'callback'
    };

    const response = await this.sendRequest<MicrosoftAuthResponse>('/microsoft-auth', payload);
    
    if (response.success && response.data?.accessToken) {
      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken || null;
      this.saveSession();
    }

    return response;
  }

  /**
   * Refresh Microsoft Token
   * Webhook: http://localhost:5678/webhook/token-refresh-trigger
   */
  async refreshMicrosoftToken(): Promise<WebhookResponse<MicrosoftAuthResponse>> {
    if (!this.currentUser || !this.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    const payload: TokenRefreshPayload = {
      userId: this.currentUser.userId,
      refreshToken: this.refreshToken,
      email: this.currentUser.email
    };

    const response = await this.sendRequest<MicrosoftAuthResponse>('/token-refresh-trigger', payload);

    if (response.success && response.data?.accessToken) {
      this.accessToken = response.data.accessToken;
      if (response.data.refreshToken) {
        this.refreshToken = response.data.refreshToken;
      }
      this.saveSession();
    }

    return response;
  }

  /**
   * Check if Microsoft email is connected
   */
  isMicrosoftConnected(): boolean {
    return !!this.accessToken;
  }

  /**
   * Disconnect Microsoft email
   */
  disconnectMicrosoft(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.saveSession();
  }

  // ============ EXPORT WEBHOOKS ============

  /**
   * Export to Outlook
   * Webhook: http://localhost:5678/webhook/export-outlook
   */
  async exportToOutlook(
    dateRange: 'today' | '7d' | '30d' | '60d' | 'custom',
    customStartDate?: string,
    userData?: { email: string; userName?: string; userId?: string },
    generationSource?: string
  ): Promise<WebhookResponse<any>> {
    // Calculate export_date_start based on selected range
    const today = new Date();
    let exportDateStart: string;

    if (dateRange === 'custom' && customStartDate) {
      exportDateStart = customStartDate;
    } else {
      const daysToSubtract = {
        'today': 0,
        '7d': 7,
        '30d': 30,
        '60d': 60
      }[dateRange] || 0;

      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToSubtract);
      exportDateStart = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // ALWAYS prioritize passed userData over internal auth system
    const userEmail = userData?.email || 'user@example.com';
    const userName = userData?.userName || 'User';
    const userId = userData?.userId || `user_${Date.now()}`;

    // Log warning if no userData provided (should not happen)
    if (!userData?.userId) {
      console.warn('🚨 No userId provided to exportToOutlook - using fallback. This may cause data mismatch.');
    }

    // Convert UI value format to API format
    const handoverSourceMap: Record<string, string> = {
      'outlook': 'outlook',
      'my-notes': 'my_notes',
      'both': 'both'
    };
    const handoverSource = handoverSourceMap[generationSource || 'both'] || 'both';

    const payload = {
      "action": "export-outlook",
      "userId": userId,
      "userName": userName,
      "export_type": "user",
      "export_date_start": exportDateStart,
      "handover_source": handoverSource,
      "timestamp": new Date().toISOString(),
      "source": "celesteos_modern_local_ux",
      "client_info": {
        "user_agent": navigator.userAgent,
        "platform": navigator.platform,
        "language": navigator.language
      },
      "webhookUrl": WEBHOOK_CONFIG.export.outlook,
      "executionMode": "production",
      "retryCount": 0,
      "clientVersion": "1.0.0"
    };

    // Send the payload directly without array wrapping
    console.log('📤 Export to Outlook payload:', payload);

    return await this.sendRequest('/export-outlook', payload);
  }

  // ============ UTILITY METHODS ============

  /**
   * Test all webhook connections
   */
  async testAllWebhooks(): Promise<Record<string, boolean>> {
    const endpoints = [
      { name: 'user-auth', endpoint: '/user-auth' },
      { name: 'text-chat', endpoint: '/text-chat' },
      { name: 'microsoft-auth', endpoint: '/microsoft-auth' },
      { name: 'token-refresh', endpoint: '/token-refresh-trigger' }
    ];

    const results: Record<string, boolean> = {};

    for (const { name, endpoint } of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'OPTIONS',
          signal: AbortSignal.timeout(2000)
        });
        results[name] = response.ok || response.status === 405; // 405 means endpoint exists but doesn't support OPTIONS
      } catch {
        results[name] = false;
      }
    }

    return results;
  }
}

// Create singleton instance
const completeWebhookService = new CompleteWebhookService();

export default completeWebhookService;
export { CompleteWebhookService };
export type { 
  WebhookResponse, 
  UserAuthResponse, 
  TextChatPayload, 
  MicrosoftAuthResponse 
};