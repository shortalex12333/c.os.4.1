// Enhanced Webhook Service with TypeScript support
import { WEBHOOK_BASE_URL, WEBHOOK_CONFIG } from '../config/webhookConfig';

// Types
interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  metadata?: {
    category?: string;
    confidence?: number;
    responseTime?: number;
    tokensUsed?: number;
    tokensRemaining?: number;
    stage?: string;
  };
  timestamp?: string;
  requestId?: string;
}

interface DocSummary {
  title: string;
  doc_link: string;
  confidence: number;
}

interface MaritimeResponse {
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
    confidence_percentage: number;
    steps: string[];
    document_locations: string[];
  }>;
  documents_used: string[];
  sources?: string[];
  awaiting_feedback: boolean;
  other_docs?: DocSummary[];
  all_docs?: DocSummary[];
}

interface User {
  id: string;
  name: string;
  displayName?: string;
}

// Request Queue to prevent API hammering
class RequestQueue {
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
    
    this.running++;
    const { fn, resolve, reject } = this.queue.shift()!;
    
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const apiQueue = new RequestQueue(3);

// Enhanced request function with TypeScript
const sendRequestWithRetry = async <T = any>(
  endpoint: string, 
  payload: any, 
  options: {
    maxRetries?: number;
    timeout?: number;
    signal?: AbortSignal;
  } = {}
): Promise<WebhookResponse<T>> => {
  return apiQueue.add(async () => {
    const { maxRetries = WEBHOOK_CONFIG.maxRetries, timeout = WEBHOOK_CONFIG.timeout, signal } = options;
    const url = `${WEBHOOK_BASE_URL}${endpoint}`;
    let lastError: Error;
    
    const actualRetries = endpoint.includes('chat') ? 1 : maxRetries;
    
    for (let attempt = 0; attempt < actualRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const requestSignal = signal || controller.signal;
        
        console.log(`🔄 Webhook attempt ${attempt + 1}/${actualRetries}:`, { url, payload });
        
        const response = await fetch(url, {
          ...WEBHOOK_CONFIG.defaults,
          body: JSON.stringify(payload),
          signal: requestSignal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        
        // Handle potential HTML responses (server misconfiguration)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html>')) {
          throw new Error('Server returned HTML instead of JSON - check webhook configuration');
        }
        
        let data: T;
        try {
          data = JSON.parse(responseText) as T;
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error('Invalid JSON response from server');
        }
        
        console.log(`✅ Webhook success:`, { url, data });
        return { success: true, data };
        
      } catch (error: any) {
        console.error(`❌ Webhook attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        if (attempt < actualRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, WEBHOOK_CONFIG.retryDelay * (attempt + 1)));
        }
      }
    }
    
    return { 
      success: false, 
      error: lastError?.message || 'Unknown error',
      data: undefined 
    };
  });
};

// WebhookService class with TypeScript
class WebhookService {
  private baseUrl: string;
  private failureCount = 0;
  private maxFailures = 3;

  constructor() {
    this.baseUrl = WEBHOOK_BASE_URL;
  }

  // Send chat message with enhanced email search capabilities
  async sendChat(
    user: User, 
    message: string, 
    options: { 
      chatId?: string; 
      sessionId?: string; 
      signal?: AbortSignal;
      includeEmailSearch?: boolean;
    } = {}
  ): Promise<WebhookResponse<ChatResponse | MaritimeResponse>> {
    const { chatId, sessionId, signal, includeEmailSearch = true } = options;
    
    const payload = {
      userId: user.id,
      userName: user.name || user.displayName,
      message,
      chatId: chatId || `chat_${user.id}_${Date.now()}`,
      sessionId: sessionId || `session_${user.id}`,
      timestamp: new Date().toISOString(),
      // Enhanced maritime context with email integration
      context: {
        maritime: true,
        emailSearch: includeEmailSearch,
        searchTypes: ['technical_manuals', 'maintenance_records', 'email_correspondence', 'operational_logs']
      }
    };

    try {
      const result = await sendRequestWithRetry<ChatResponse | MaritimeResponse>(
        '/text-chat', 
        payload, 
        { signal }
      );
      
      if (result.success) {
        this.failureCount = 0;
      } else {
        this.failureCount++;
      }
      
      return result;
    } catch (error: any) {
      this.failureCount++;
      throw error;
    }
  }

  // Email-specific search functionality
  async searchEmails(
    user: User,
    query: string,
    options: {
      dateRange?: { start: string; end: string };
      folder?: string;
      sender?: string;
      maxResults?: number;
    } = {}
  ): Promise<WebhookResponse<{
    emails: Array<{
      id: string;
      subject: string;
      sender: string;
      date: string;
      snippet: string;
      relevanceScore: number;
    }>;
    totalFound: number;
    searchQuery: string;
  }>> {
    const payload = {
      userId: user.id,
      query,
      ...options,
      timestamp: new Date().toISOString()
    };

    return sendRequestWithRetry('/email-search', payload);
  }

  // Get email content for maritime analysis
  async getEmailContent(
    user: User,
    emailId: string
  ): Promise<WebhookResponse<{
    id: string;
    subject: string;
    body: string;
    sender: string;
    recipients: string[];
    date: string;
    attachments: Array<{
      name: string;
      type: string;
      size: number;
    }>;
  }>> {
    const payload = {
      userId: user.id,
      emailId,
      timestamp: new Date().toISOString()
    };

    return sendRequestWithRetry('/email-content', payload);
  }

  // Submit maritime AI solution feedback
  async submitSolutionFeedback(feedbackData: {
    query_id: string;
    solution_id: string;
    worked: boolean;
    yacht_id: string;
  }): Promise<boolean> {
    try {
      const result = await sendRequestWithRetry('/solution-feedback', feedbackData);
      return result.success;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<WebhookResponse> {
    return sendRequestWithRetry('/auth/login', { 
      email: email.toLowerCase().trim(), 
      password 
    });
  }

  async signup(displayName: string, email: string, password: string): Promise<WebhookResponse> {
    return sendRequestWithRetry('/auth-signup', { 
      displayName: displayName.trim() || email.split('@')[0], 
      email: email.toLowerCase().trim(), 
      password 
    });
  }

  async logout(token: string): Promise<WebhookResponse> {
    return sendRequestWithRetry('/auth/logout', { token });
  }

  async verifyToken(token: string): Promise<WebhookResponse> {
    return sendRequestWithRetry('/auth/verify-token', { token });
  }

  // Health check
  async healthCheck(): Promise<Record<string, any>> {
    const endpoints = [
      { name: 'Text Chat', endpoint: '/text-chat', payload: { message: 'test', userId: 'test' } },
      { name: 'Auth Login', endpoint: '/auth/login', payload: { email: 'test@test.com', password: 'test' } }
    ];

    const results: Record<string, any> = {};
    
    for (const { name, endpoint, payload } of endpoints) {
      try {
        const startTime = Date.now();
        const result = await sendRequestWithRetry(endpoint, payload);
        const responseTime = Date.now() - startTime;
        
        results[name] = {
          success: result.success,
          responseTime: `${responseTime}ms`,
          status: result.success ? 'OK' : 'ERROR',
          endpoint: `${WEBHOOK_BASE_URL}${endpoint}`
        };
      } catch (error: any) {
        results[name] = {
          success: false,
          responseTime: 'N/A',
          status: 'FAILED',
          error: error.message,
          endpoint: `${WEBHOOK_BASE_URL}${endpoint}`
        };
      }
    }
    
    return results;
  }

  // Get current status
  getStatus() {
    return {
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
      baseUrl: this.baseUrl
    };
  }
}

// Create singleton instance
const webhookService = new WebhookService();

export default webhookService;
export { webhookService, WebhookService };
export type { WebhookResponse, ChatResponse, MaritimeResponse, User, DocSummary };