/**
 * API Utility for Cloud Sync
 * Handles communication with https://api.celeste7.ai/webhook/sop-creation
 */

import type { SOPData, CloudSyncResponse } from '../types/sop';

const API_ENDPOINT = 'https://api.celeste7.ai/webhook/sop-creation';
const SAVE_ENDPOINT = 'https://api.celeste7.ai/webhook/save-sop';
const TIMEOUT_MS = 30000; // 30 second timeout

export class SOPApiClient {
  private static abortController: AbortController | null = null;

  /**
   * Sync SOP to cloud backend
   */
  static async syncToCloud(sop: SOPData): Promise<CloudSyncResponse> {
    // Cancel any pending request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `Update SOP: ${sop.title}`,
          yacht_id: sop.yacht_id,
          user_id: sop.user_id,
          sop_data: {
            sop_id: sop.sop_id,
            title: sop.title,
            content_md: sop.content_md,
            timestamp: new Date().toISOString(),
          },
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        sop_id: data.sop_id || sop.sop_id,
        message: data.message || 'SOP synced successfully',
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out. Working offline.',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred',
      };
    }
  }

  /**
   * Save SOP to database (save-sop endpoint)
   * This sends to Supabase via n8n webhook
   */
  static async saveToDatabase(sop: SOPData): Promise<CloudSyncResponse> {
    // Cancel any pending request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(SAVE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: sop.user_id,
          yacht_id: sop.yacht_id,
          equipment: '', // Optional field
          title: sop.title,
          query: `Save SOP: ${sop.title}`,
          content_markdown: sop.content_md,
          source_chunks: [], // Optional field
          version: sop.version || 1,
          metadata: {
            sop_id: sop.sop_id,
            timestamp: new Date().toISOString(),
          },
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        sop_id: data.id || sop.sop_id,
        message: data.message || 'SOP saved to database successfully',
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Save request timed out',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred while saving',
      };
    }
  }

  /**
   * Check if API is reachable
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(API_ENDPOINT, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 405; // 405 = Method Not Allowed but endpoint exists
    } catch {
      return false;
    }
  }
}
