/**
 * JWT Token Refresh Service
 * Regenerates expired JWT tokens when users reopen old chats
 */

import { documentJWTService } from './documentJWTService';

interface DocumentLink {
  url: string;
  document_path: string;
  page?: number;
}

interface RefreshResult {
  original_url: string;
  refreshed_url: string;
  document_path: string;
  success: boolean;
  error?: string;
}

class TokenRefreshService {
  /**
   * Extract document path from JWT URL
   * Example: http://localhost:8098/api/documents/stream/eyJ0eXAi...
   * Returns the document_path from the JWT payload
   */
  private async extractDocumentPath(jwtUrl: string): Promise<string | null> {
    try {
      // Extract JWT token from URL
      const urlParts = jwtUrl.split('/stream/');
      if (urlParts.length !== 2) return null;

      const token = urlParts[1];

      // Decode JWT payload (without verification - just to extract path)
      const base64Payload = token.split('.')[1];
      if (!base64Payload) return null;

      const payload = JSON.parse(atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/')));
      return payload.document_path || null;

    } catch (error) {
      console.warn('Failed to extract document path from JWT:', error);
      return null;
    }
  }

  /**
   * Check if a JWT token is expired by attempting to decode it
   */
  private isTokenExpired(jwtUrl: string): boolean {
    try {
      const urlParts = jwtUrl.split('/stream/');
      if (urlParts.length !== 2) return true;

      const token = urlParts[1];
      const base64Payload = token.split('.')[1];
      if (!base64Payload) return true;

      const payload = JSON.parse(atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/')));
      const exp = payload.exp;

      if (!exp) return true;

      // Check if expired (with 30 second buffer)
      return Date.now() / 1000 > (exp - 30);

    } catch (error) {
      return true; // If we can't decode, assume expired
    }
  }

  /**
   * Refresh a single document link
   */
  async refreshDocumentLink(
    documentLink: DocumentLink,
    userId: string,
    userRole: string = 'chief_engineer'
  ): Promise<RefreshResult> {
    try {
      // Extract document path from JWT URL
      let documentPath = documentLink.document_path;

      // If document_path not provided, try to extract from JWT
      if (!documentPath) {
        documentPath = await this.extractDocumentPath(documentLink.url);
        if (!documentPath) {
          return {
            original_url: documentLink.url,
            refreshed_url: documentLink.url,
            document_path: 'unknown',
            success: false,
            error: 'Could not extract document path from JWT'
          };
        }
      }

      // Generate fresh JWT token
      const freshUrl = await documentJWTService.getSecureDocumentURL(
        documentPath,
        userId,
        userRole
      );

      // Add page parameter if present
      let finalUrl = freshUrl;
      if (documentLink.page) {
        finalUrl += `#page=${documentLink.page}`;
      }

      return {
        original_url: documentLink.url,
        refreshed_url: finalUrl,
        document_path: documentPath,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to refresh document link:', error);

      return {
        original_url: documentLink.url,
        refreshed_url: documentLink.url,
        document_path: documentLink.document_path || 'unknown',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Refresh multiple document links (batch operation)
   */
  async refreshDocumentLinks(
    documentLinks: DocumentLink[],
    userId: string,
    userRole: string = 'chief_engineer'
  ): Promise<RefreshResult[]> {
    console.log(`🔄 Refreshing ${documentLinks.length} document links for user ${userId}`);

    // Refresh all links in parallel
    const refreshPromises = documentLinks.map(link =>
      this.refreshDocumentLink(link, userId, userRole)
    );

    const results = await Promise.all(refreshPromises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Token refresh complete: ${successCount} succeeded, ${failCount} failed`);

    return results;
  }

  /**
   * Refresh document links in chat history (React components)
   */
  async refreshChatDocumentLinks(
    chatHistory: any[],
    userId: string,
    userRole: string = 'chief_engineer'
  ): Promise<any[]> {
    try {
      // Extract all document links from chat history
      const documentLinks: DocumentLink[] = [];
      const linkMap = new Map<string, Array<{ messageIndex: number, linkIndex: number }>>();

      chatHistory.forEach((message, messageIndex) => {
        if (message.document_links && Array.isArray(message.document_links)) {
          message.document_links.forEach((link: any, linkIndex: number) => {
            if (link && link.url) {
              // Only refresh JWT URLs that look expired
              if (link.url.includes('/api/documents/stream/') && this.isTokenExpired(link.url)) {
                const docLink: DocumentLink = {
                  url: link.url,
                  document_path: link.document_path || link.doc || '',
                  page: link.page
                };
                documentLinks.push(docLink);

                // Store all locations for this URL (multiple messages may have same URL)
                if (!linkMap.has(link.url)) {
                  linkMap.set(link.url, []);
                }
                linkMap.get(link.url)!.push({ messageIndex, linkIndex });
              }
            }
          });
        }
      });

      if (documentLinks.length === 0) {
        console.log('ℹ️ No expired document links found in chat history');
        return chatHistory;
      }

      console.log(`🔄 Found ${documentLinks.length} expired document links in chat`);

      // Refresh all expired links
      const refreshResults = await this.refreshDocumentLinks(documentLinks, userId, userRole);

      // Update chat history with refreshed URLs (deep clone to avoid mutations)
      const updatedChatHistory = chatHistory.map(message => ({
        ...message,
        document_links: message.document_links
          ? message.document_links.map((link: any) => ({ ...link }))
          : undefined
      }));

      refreshResults.forEach(result => {
        if (result.success) {
          const locations = linkMap.get(result.original_url);
          if (locations && locations.length > 0) {
            // Update all locations that had this original URL
            locations.forEach(({ messageIndex, linkIndex }) => {
              if (updatedChatHistory[messageIndex]?.document_links?.[linkIndex]) {
                updatedChatHistory[messageIndex].document_links[linkIndex].url = result.refreshed_url;
                updatedChatHistory[messageIndex].document_links[linkIndex].refreshed_at = new Date().toISOString();
              }
            });
          }
        }
      });

      console.log('✅ Chat history document links refreshed');
      return updatedChatHistory;

    } catch (error) {
      console.error('Failed to refresh chat document links:', error);
      return chatHistory; // Return original on error
    }
  }

  /**
   * Auto-refresh: Check and refresh links if needed
   * Call this when chat is reopened/loaded
   */
  async autoRefreshIfNeeded(
    chatHistory: any[],
    userId: string,
    userRole: string = 'chief_engineer'
  ): Promise<{ refreshed: boolean, chatHistory: any[] }> {
    try {
      // Quick check: any JWT URLs in the chat?
      const hasJWTLinks = chatHistory.some(message =>
        message.document_links?.some((link: any) =>
          link?.url?.includes('/api/documents/stream/')
        )
      );

      if (!hasJWTLinks) {
        return { refreshed: false, chatHistory };
      }

      // Check if any links are expired
      const hasExpiredLinks = chatHistory.some(message =>
        message.document_links?.some((link: any) =>
          link?.url?.includes('/api/documents/stream/') && this.isTokenExpired(link.url)
        )
      );

      if (!hasExpiredLinks) {
        console.log('ℹ️ All document links are still valid');
        return { refreshed: false, chatHistory };
      }

      // Refresh expired links
      const refreshedChat = await this.refreshChatDocumentLinks(chatHistory, userId, userRole);
      return { refreshed: true, chatHistory: refreshedChat };

    } catch (error) {
      console.error('Auto-refresh failed:', error);
      return { refreshed: false, chatHistory };
    }
  }
}

// Singleton instance
export const tokenRefreshService = new TokenRefreshService();

// Helper functions for React components
export async function refreshChatTokens(
  chatHistory: any[],
  userId: string,
  userRole: string = 'chief_engineer'
): Promise<any[]> {
  return tokenRefreshService.refreshChatDocumentLinks(chatHistory, userId, userRole);
}

export async function autoRefreshChatTokens(
  chatHistory: any[],
  userId: string,
  userRole: string = 'chief_engineer'
): Promise<{ refreshed: boolean, chatHistory: any[] }> {
  return tokenRefreshService.autoRefreshIfNeeded(chatHistory, userId, userRole);
}
