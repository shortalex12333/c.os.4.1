// Fixed Webhook Service for n8n Integration
import { WEBHOOK_BASE_URL, WEBHOOK_CONFIG } from '../config/webhookConfig';
import type { NasragResponse } from '../types/nasragResponse';

// Types
interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ChatPayload {
  userId: string;
  userName: string;
  message: string;
  search_strategy: 'yacht' | 'email';
  conversation_id: string;
  sessionId: string;
  timestamp: string;
  webhookUrl: string;
  executionMode: 'production' | 'test';
}

// Updated ChatResponse to match debloated NASRAG output
// Note: n8n may wrap the NASRAG response or return it directly
type ChatResponse = NasragResponse;

// Legacy ChatResponse format (if n8n transforms the response)
interface LegacyChatResponse {
  success: boolean;
  query_id: string;
  session_id: string;
  conversation_id: string;
  yacht_id: string;
  user_id: string;
  message: string;
  confidence_score: number;
  solutions: Array<{
    solution_id: string;
    title: string;
    confidence: number;
    steps: string[];
    documents_used: string[];
    document_locations: string[];
  }>;
  documents_used: string[];
  sources?: string[];
  awaiting_feedback: boolean;
}

// Fixed request function that sends object instead of array
const sendWebhookRequest = async <T = any>(
  endpoint: string,
  payload: any,
  options: {
    maxRetries?: number;
    timeout?: number;
    signal?: AbortSignal;
  } = {}
): Promise<WebhookResponse<T>> => {
  const { maxRetries = 2, timeout = 30000, signal } = options;
  const url = `${WEBHOOK_BASE_URL}${endpoint}`;
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const requestSignal = signal || controller.signal;

      console.log(`🔄 Webhook attempt ${attempt + 1}/${maxRetries}:`, { 
        url, 
        payload,
        payloadType: typeof payload,
        isArray: Array.isArray(payload)
      });

      // CRITICAL FIX: Send the payload directly, not wrapped in array
      const bodyToSend = Array.isArray(payload) ? payload[0] : payload;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bodyToSend), // Send object, not array
        signal: requestSignal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Handle empty responses
      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response from webhook');
        return { success: true, data: {} as T };
      }

      // Handle HTML error pages
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html>')) {
        throw new Error('Server returned HTML instead of JSON');
      }

      let data: T;
      try {
        data = JSON.parse(responseText) as T;
      } catch (parseError) {
        console.error('Failed to parse response:', responseText.substring(0, 200));
        throw new Error('Invalid JSON response from server');
      }

      console.log(`✅ Webhook success:`, { url, data });
      return { success: true, data };

    } catch (error: any) {
      console.error(`❌ Webhook attempt ${attempt + 1} failed:`, error);
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    data: undefined
  };
};

// Fixed WebhookService class
class FixedWebhookService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = WEBHOOK_BASE_URL;
  }

  // Send chat message with proper search_strategy field
  async sendTextChat(
    payload: ChatPayload,
    options: { signal?: AbortSignal } = {}
  ): Promise<WebhookResponse<ChatResponse>> {
    // Ensure the payload has the correct structure
    const webhookPayload = {
      userId: payload.userId,
      userName: payload.userName,
      message: payload.message,
      search_strategy: payload.search_strategy || 'yacht',
      conversation_id: payload.conversation_id,
      sessionId: payload.sessionId,
      timestamp: payload.timestamp || new Date().toISOString(),
      webhookUrl: `${this.baseUrl}/text-chat`,
      executionMode: payload.executionMode || 'production'
    };

    console.log('📤 Sending to n8n text-chat webhook:', webhookPayload);

    return sendWebhookRequest<ChatResponse>(
      '/text-chat',
      webhookPayload,
      options
    );
  }

  // Generic webhook sender for other endpoints
  async sendWebhook(
    endpoint: string,
    payload: any,
    options: { signal?: AbortSignal } = {}
  ): Promise<WebhookResponse<any>> {
    // Ensure we're not sending arrays
    const cleanPayload = Array.isArray(payload) ? payload[0] : payload;
    
    return sendWebhookRequest(
      endpoint,
      cleanPayload,
      options
    );
  }

  // Test the webhook connection
  async testConnection(): Promise<boolean> {
    try {
      const testPayload: ChatPayload = {
        userId: 'test-user',
        userName: 'Test User',
        message: 'Test connection',
        search_strategy: 'yacht',
        conversation_id: `test_${Date.now()}`,
        sessionId: `session_test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        webhookUrl: `${this.baseUrl}/text-chat`,
        executionMode: 'test'
      };

      const result = await this.sendTextChat(testPayload, { 
        signal: AbortSignal.timeout(5000) 
      });
      
      return result.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const fixedWebhookService = new FixedWebhookService();

export default fixedWebhookService;
export { fixedWebhookService, FixedWebhookService };
export type { WebhookResponse, ChatResponse, ChatPayload, LegacyChatResponse };