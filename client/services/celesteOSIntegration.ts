/**
 * CelesteOS Integration Service
 * HIGH CALIBER PRODUCTION INTEGRATION
 * 
 * This service bridges LOCAL UX architecture with CelesteOS yacht LLM system
 * Maintains full functionality while providing LOCAL UX interface
 */

import { type UserData } from '../components/Login';
import { NetworkConfig } from '../config/network';

// Define types locally since types/webhook doesn't exist
export type SearchStrategy = 'yacht' | 'email';

// CelesteOS Webhook Response Types
export interface CelesteOSMaritimeResponse {
  response?: string;
  message?: string;
  solutions?: Array<{
    title: string;
    description?: string;
    solution?: string;
    problem?: string;
    error_code?: string;
    source?: string;
    diagnostics?: string[];
    parts_needed?: string[];
    files?: string[];
  }>;
  confidence_score?: string;
  processing_time_ms?: number;
  tokens_used?: {
    query?: number;
    response?: number;
  };
  source_documents?: number;
  system_info?: {
    platform_name?: string;
    assistant_name?: string;
    welcome_message?: string;
    connection?: string;
    model_version?: string;
  };
}

export interface CelesteOSEmailResult {
  subject: string;
  from: string;
  sender_name?: string;
  body_preview?: string;
  snippet?: string;
  summary?: string;
  received_date: string;
  web_link?: string;
  attachments?: Array<{
    name: string;
    size?: string;
    type?: string;
  }>;
}

export interface CelesteOSEmailSearchResponse {
  success: boolean;
  results?: CelesteOSEmailResult[];
  error?: string;
}

export interface CelesteOSEmailStatus {
  email_connected: boolean;
  user_email?: string;
  user_id?: string;
  connection_status?: string;
}

// CelesteOS Webhook Integration Class
export class CelesteOSWebhookService {
  private get baseWebhookUrl() { return `${NetworkConfig.n8n.getBaseUrl()}/webhook`; }
  private currentUser: UserData | null = null;

  setCurrentUser(userData: UserData) {
    this.currentUser = userData;
    console.log('🎯 CelesteOS Service - User set:', userData.display_name);
  }

  // Unified webhook endpoint - all requests go to single endpoint with search_strategy parameter
  private getWebhookEndpoint(searchStrategy: 'yacht' | 'email'): string {
    // All search strategies now use the unified text-chat endpoint
    // The search_strategy parameter in the payload determines the backend routing
    const unifiedEndpoint = `${this.baseWebhookUrl}/text-chat`;
    console.log(`🚀 CelesteOS Unified Webhook - Using endpoint: ${unifiedEndpoint} with strategy: ${searchStrategy}`);
    return unifiedEndpoint;
  }

  // Send query to CelesteOS yacht LLM system
  async sendQuery(
    query: string, 
    searchStrategy: SearchStrategy,
    emailStatus?: CelesteOSEmailStatus
  ): Promise<CelesteOSMaritimeResponse> {
    if (!this.currentUser) {
      throw new Error('CelesteOS user not authenticated');
    }

    const webhookUrl = this.getWebhookEndpoint(searchStrategy);

    // Create webhook payload
    const payload = {
      userId: this.currentUser.id || this.currentUser.user_id,
      userName: this.currentUser.display_name || this.currentUser.user_name,
      message: query,
      search_strategy: searchStrategy,
      conversation_id: `conv_${Date.now()}`,
      sessionId: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      webhookUrl: webhookUrl,
      executionMode: 'production' as const
    };

    console.log(`📤 CelesteOS Query - Sending to: ${webhookUrl}`, {
      ...payload,
      message: query.substring(0, 50) + '...'
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`CelesteOS webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ CelesteOS Response received:', result);

    return result as CelesteOSMaritimeResponse;
  }
}

// CelesteOS Email Integration Service
export class CelesteOSEmailService {
  private get baseApiUrl() { return `${NetworkConfig.main.getBaseUrl()}/api/email`; }
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    this.currentUserId = userId;
    console.log('📧 CelesteOS Email Service - User ID set:', userId);
  }

  // Get email connection status
  async getEmailStatus(): Promise<CelesteOSEmailStatus | null> {
    if (!this.currentUserId) {
      console.warn('📧 CelesteOS Email Service - No user ID set');
      return null;
    }

    try {
      const response = await fetch(`${this.baseApiUrl}/user/${this.currentUserId}/status`);
      
      if (!response.ok) {
        console.warn(`📧 CelesteOS Email Status - Failed: ${response.status}`);
        return null;
      }

      const status = await response.json();
      console.log('📧 CelesteOS Email Status:', status);
      
      return {
        email_connected: status.email_connected || false,
        user_email: status.user_email,
        user_id: status.user_id,
        connection_status: status.connection_status
      };
    } catch (error) {
      console.error('📧 CelesteOS Email Status Error:', error);
      return null;
    }
  }

  // Connect email (redirect to OAuth)
  connectEmail(userId: string, openInNewTab: boolean = false) {
    const oauthUrl = `${NetworkConfig.emailAuth.getBaseUrl()}/login/${userId}`;
    console.log('📧 CelesteOS Email Connect - Redirecting to:', oauthUrl);
    
    if (openInNewTab) {
      window.open(oauthUrl, '_blank');
    } else {
      window.location.href = oauthUrl;
    }
  }

  // Search emails using CelesteOS email integration
  async searchEmails(query: string): Promise<CelesteOSEmailSearchResponse> {
    if (!this.currentUserId) {
      return {
        success: false,
        error: 'User not authenticated for CelesteOS email search'
      };
    }

    try {
      console.log('📧 CelesteOS Email Search - Query:', query);
      
      const response = await fetch(`${this.baseApiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentUserId,
          query: query,
          maxResults: 10
        })
      });

      if (!response.ok) {
        throw new Error(`CelesteOS email search failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ CelesteOS Email Search Results:', result);

      return {
        success: true,
        results: result.emails || []
      };
    } catch (error) {
      console.error('❌ CelesteOS Email Search Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email search failed'
      };
    }
  }

  // Check for successful email connection in URL parameters
  checkForEmailConnectionSuccess(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const emailConnected = urlParams.get('email_connected');
    
    if (emailConnected === 'true') {
      console.log('✅ CelesteOS Email Connection Success detected in URL');
      return true;
    }
    
    return false;
  }
}

// Singleton instances for app-wide use
export const celesteOSWebhookService = new CelesteOSWebhookService();
export const celesteOSEmailService = new CelesteOSEmailService();

// Export types for use in components
export type {
  CelesteOSMaritimeResponse,
  CelesteOSEmailResult,
  CelesteOSEmailSearchResponse,
  CelesteOSEmailStatus
};