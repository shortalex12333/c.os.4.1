/**
 * Microsoft Email Integration Service
 * Handles email authentication and search functionality
 */

export interface EmailStatus {
  user_id: string;
  email_connected: boolean;
  status: 'connected' | 'not_connected';
  user_email?: string;
}

export interface EmailSearchResult {
  id: string;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  receivedDateTime: string;
  bodyPreview: string;
  attachments?: string[];
  hasAttachments: boolean;
  importance: string;
  conversationId: string;
  webLink?: string;
}

export interface EmailSearchResponse {
  success: boolean;
  results?: EmailSearchResult[];
  count?: number;
  query?: string;
  error?: string;
}

export class EmailIntegrationService {
  private baseUrl: string;
  private currentUserId: string | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || window.location.origin;
  }

  /**
   * Set the current user ID for email operations
   */
  setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get the current user's email connection status
   */
  async getEmailStatus(userId?: string): Promise<EmailStatus | null> {
    const user = userId || this.currentUserId;
    if (!user) {
      console.warn('No user ID provided for email status check');
      return null;
    }

    try {
      const statusUrl = `${this.baseUrl}/api/email/user/${user}/status`;
      console.log('📡 Fetching email status from:', statusUrl);
      const response = await fetch(statusUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.json();
      console.log('📊 Raw email status response:', status);
      return status;
    } catch (error) {
      console.error('Failed to get email status:', error);
      return null;
    }
  }

  /**
   * Start the email connection process - redirects to Microsoft authentication
   */
  connectEmail(userId?: string, openInNewTab: boolean = true): void {
    const user = userId || this.currentUserId;
    if (!user) {
      console.error('No user ID provided for email connection');
      return;
    }

    // Use direct OAuth URL instead of API endpoint
    const oauthUrl = `http://localhost:8003/auth/start?user_id=${encodeURIComponent(user)}`;
    
    if (openInNewTab) {
      console.log('Opening Microsoft OAuth in new tab:', oauthUrl);
      window.open(oauthUrl, '_blank');
    } else {
      console.log('Redirecting to Microsoft OAuth:', oauthUrl);
      window.location.href = oauthUrl;
    }
  }

  /**
   * Search user's emails with natural language query
   */
  async searchEmails(query: string, userId?: string, limit: number = 10): Promise<EmailSearchResponse> {
    const user = userId || this.currentUserId;
    if (!user) {
      return {
        success: false,
        error: 'No user ID provided for email search'
      };
    }

    if (!query.trim()) {
      return {
        success: false,
        error: 'Search query cannot be empty'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/email/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user,
          query: query.trim(),
          limit
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: result.success || true,
        results: result.results || [],
        count: result.count || 0,
        query: query
      };
    } catch (error) {
      console.error('Email search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if the current URL contains email connection success parameters
   */
  checkForEmailConnectionSuccess(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('email_connected') && urlParams.get('email_connected') === 'true';
  }

  /**
   * Generate a unique user ID for demo purposes
   * In production, this should come from your user authentication system
   */
  generateDemoUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const emailService = new EmailIntegrationService();