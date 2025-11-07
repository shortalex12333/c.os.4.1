// n8n Webhook Client
import { CONFIG } from './config';

export interface LoginResponse {
  status: 'awaiting_2fa' | 'error';
  user_id?: string;
  message: string;
}

export interface Verify2FAResponse {
  status: 'success' | 'error';
  session_token?: string;
  user_id?: string;
  message?: string;
}

export interface DownloadRequestResponse {
  status: 'success' | 'error';
  download_token?: string;
  message: string;
}

export const n8nAPI = {
  /**
   * Step 1: User login - generates and sends 2FA code via email
   */
  async login(userId: string, email: string): Promise<LoginResponse> {
    try {
      const response = await fetch(CONFIG.n8n.webhooks.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('n8n login error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },

  /**
   * Step 2: Verify 2FA code - creates session if code is valid
   */
  async verify2FA(userId: string, code: string): Promise<Verify2FAResponse> {
    try {
      const response = await fetch(CONFIG.n8n.webhooks.verify2FA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('n8n verify 2FA error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  },

  /**
   * Step 3: Request download link - generates download token
   */
  async requestDownload(sessionToken: string): Promise<DownloadRequestResponse> {
    try {
      const response = await fetch(CONFIG.n8n.webhooks.downloadRequest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('n8n download request error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
};
