// Simplified Webhook Service for Celeste Yacht AI
// Removed authentication and MongoDB dependencies

import { WEBHOOK_BASE_URL, WEBHOOK_CONFIG } from '../config/webhookConfig';

// Mock data for development
const MOCK_DATA = {
  chat: {
    response: "I'm Celeste, your yacht AI assistant. How can I help you with your yacht needs today?",
    metadata: {
      stage: 'exploring',
      category: 'yacht_assistance'
    }
  }
};

class WebhookService {
  constructor() {
    this.baseUrl = WEBHOOK_BASE_URL;
    this.isOnline = true;
    this.failureCount = 0;
    this.maxFailures = 3;
  }

  // Basic request handler without authentication
  async makeRequest(endpoint, payload, options = {}) {
    const fullUrl = `${WEBHOOK_BASE_URL}${endpoint}`;
    
    console.log(`🔵 Yacht AI Request: ${endpoint}`, {
      url: fullUrl,
      payload
    });

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        ...options
      });

      const data = await response.json();
      
      if (response.ok) {
        this.failureCount = 0;
        console.log(`🟢 Yacht AI Success: ${endpoint}`, data);
        return { success: true, data };
      } else {
        this.failureCount++;
        console.warn(`🟡 Yacht AI Error: ${endpoint}`, {
          status: response.status,
          statusText: response.statusText,
          data
        });
        return { success: false, data, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      this.failureCount++;
      console.error(`🔴 Yacht AI Failed: ${endpoint}`, error);
      
      // Use fallback for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 Using development fallback');
        return this.getDevelopmentFallback(endpoint, payload);
      }
      
      throw error;
    }
  }

  // Development fallback data
  getDevelopmentFallback(endpoint, payload) {
    console.log('📱 Development fallback activated for:', endpoint);
    
    // Chat endpoints
    if (endpoint.includes('/chat') || endpoint.includes('/search') || endpoint.includes('/yacht')) {
      return { success: true, data: MOCK_DATA.chat };
    }
    
    // Default fallback
    return { 
      success: true, 
      data: { 
        message: 'Development fallback response',
        endpoint,
        development_mode: true 
      }
    };
  }

  // Yacht-specific chat method
  async sendYachtChat(message, sessionId) {
    return this.makeRequest('/yacht-chat', {
      message,
      sessionId: sessionId || `yacht_session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'yacht_assistance'
    });
  }

  // Search yacht-related information
  async searchYachts(query, filters = {}) {
    return this.makeRequest('/search-yachts', {
      query,
      filters,
      timestamp: new Date().toISOString()
    });
  }

  // Get yacht recommendations
  async getYachtRecommendations(preferences = {}) {
    return this.makeRequest('/yacht-recommendations', {
      preferences,
      timestamp: new Date().toISOString()
    });
  }

  // Health check for yacht AI endpoints
  async healthCheck() {
    const endpoints = [
      { name: 'Yacht Chat', endpoint: '/yacht-chat', payload: { message: 'Hello yacht AI' } },
      { name: 'Search Yachts', endpoint: '/search-yachts', payload: { query: 'luxury yacht' } },
      { name: 'Recommendations', endpoint: '/yacht-recommendations', payload: { preferences: {} } }
    ];

    const results = {};
    
    for (const { name, endpoint, payload } of endpoints) {
      try {
        const startTime = Date.now();
        const result = await this.makeRequest(endpoint, payload);
        const responseTime = Date.now() - startTime;
        
        results[name] = {
          success: result.success,
          responseTime: `${responseTime}ms`,
          status: result.success ? 'OK' : 'ERROR',
          endpoint: `${WEBHOOK_BASE_URL}${endpoint}`
        };
      } catch (error) {
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
      isOnline: this.isOnline,
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
      baseUrl: this.baseUrl,
      type: 'yacht_ai'
    };
  }
}

// Create singleton instance
const webhookService = new WebhookService();

export default webhookService;
export { webhookService };