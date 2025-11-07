/**
 * JWT Document Access Service
 * Integrates with EXPOSE NAS JWT-secured document service on port 8098
 */

import { getHostIP } from '../config/network';

const getJWTServiceUrl = (): string => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const port = typeof window !== 'undefined' ? window.location.port : '';

  // If accessing via any domain/tunnel or non-localhost, use Caddy proxy path
  // Caddy has JWT service reverse proxy at /jwt/*
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const baseUrl = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    return `${baseUrl}/jwt`;
  }

  // Localhost only - direct access to JWT service
  return `http://localhost:8098`;
};

const JWT_SERVICE_URL = getJWTServiceUrl();

interface SessionResponse {
  session_id: string;
  expires_in: number;
  role: string;
  yacht: string;
  allowed_paths: string[];
}

interface JWTTokenResponse {
  projection_token: string;
  expires_in: number;
  document_path: string;
}

class DocumentJWTService {
  private sessionId: string | null = null;
  private sessionExpiry: number = 0;

  /**
   * Get or create session for current user
   */
  async getSession(crewId: string, role: string): Promise<string> {
    // Check if we have a valid session
    if (this.sessionId && Date.now() < this.sessionExpiry) {
      return this.sessionId;
    }

    try {
      const response = await fetch(`${JWT_SERVICE_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          crew_id: crewId,
          role: role
        })
      });

      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`);
      }

      const data: SessionResponse = await response.json();

      // Store session
      this.sessionId = data.session_id;
      this.sessionExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer

      console.log('✅ Document session created:', {
        role: data.role,
        yacht: data.yacht,
        paths: data.allowed_paths
      });

      return data.session_id;
    } catch (error) {
      console.error('❌ Failed to create document session:', error);
      throw error;
    }
  }

  /**
   * Convert a plain document path/URL to a JWT-secured stream URL
   */
  async getSecureDocumentURL(
    documentPath: string,
    crewId: string,
    role: string
  ): Promise<string> {
    try {
      // Extract path from URL if needed (handle both full URLs and plain paths)
      let cleanPath = documentPath;

      // If it's a full URL like http://localhost:8095/ROOT/..., extract the path
      if (documentPath.includes('://')) {
        const url = new URL(documentPath);
        cleanPath = url.pathname;
      }

      // Ensure path starts with /ROOT/
      if (!cleanPath.startsWith('/ROOT/')) {
        // Try to fix common path issues
        if (cleanPath.startsWith('ROOT/')) {
          cleanPath = '/' + cleanPath;
        } else {
          throw new Error(`Invalid document path: ${cleanPath}`);
        }
      }

      // Get session
      const sessionId = await this.getSession(crewId, role);

      // Request JWT token for this document
      const response = await fetch(`${JWT_SERVICE_URL}/api/documents/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          document_path: cleanPath
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `JWT request failed: ${response.status}`);
      }

      const data: JWTTokenResponse = await response.json();

      // Return the secure stream URL
      const secureURL = `${JWT_SERVICE_URL}/api/documents/stream/${data.projection_token}`;

      console.log('✅ Secure document URL generated:', {
        original: documentPath,
        path: cleanPath,
        expires_in: data.expires_in,
        secure_url: secureURL.substring(0, 80) + '...'
      });

      return secureURL;
    } catch (error) {
      console.error('❌ Failed to get secure document URL:', error);
      throw error;
    }
  }

  /**
   * Open document in new tab with JWT security
   */
  async openSecureDocument(
    documentPath: string,
    crewId: string,
    role: string
  ): Promise<void> {
    try {
      const secureURL = await this.getSecureDocumentURL(documentPath, crewId, role);
      window.open(secureURL, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('❌ Failed to open secure document:', error);

      // User-friendly error message
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to open document';

      alert(`Document access error: ${errorMessage}\n\nPlease contact support if this issue persists.`);
    }
  }

  /**
   * Clear session (useful for logout)
   */
  clearSession(): void {
    this.sessionId = null;
    this.sessionExpiry = 0;
    console.log('🔒 Document session cleared');
  }
}

// Singleton instance
export const documentJWTService = new DocumentJWTService();

// Helper function for React components
export async function openDocument(
  documentPath: string,
  userId: string,
  userRole: string = 'chief_engineer' // Default role
): Promise<void> {
  await documentJWTService.openSecureDocument(documentPath, userId, userRole);
}
