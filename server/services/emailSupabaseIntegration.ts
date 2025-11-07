/**
 * Supabase Integration for Microsoft Email Authentication
 * Stores user bearer tokens and email metadata in Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserEmailToken {
  user_id: string;
  email_address: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type: 'Bearer';
  scopes: string[];
  created_at: string;
  updated_at: string;
  display_name?: string;
}

export interface WebhookEmailData {
  user_id: string;
  email_connected: boolean;
  bearer_token?: string;
  user_email?: string;
  outlook_registered?: boolean;
}

export class EmailSupabaseService {
  private supabase: SupabaseClient;
  
  constructor(
    supabaseUrl: string = process.env.SUPABASE_URL || '',
    supabaseKey: string = process.env.SUPABASE_SERVICE_KEY || ''
  ) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Store user's Microsoft OAuth tokens in Supabase
   */
  async storeUserTokens(
    userId: string, 
    tokenData: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_email: string;
      display_name?: string;
      scopes?: string[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
      
      const emailToken: Partial<UserEmailToken> = {
        user_id: userId,
        email_address: tokenData.user_email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        token_type: 'Bearer',
        scopes: tokenData.scopes || ['Mail.Read', 'User.Read'],
        display_name: tokenData.display_name,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('user_email_tokens')
        .upsert(emailToken, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Supabase store tokens error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Stored email tokens for user: ${userId}`);
      return { success: true };

    } catch (error) {
      console.error('Failed to store user tokens:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's bearer token for webhook requests
   */
  async getUserTokenForWebhook(userId: string): Promise<WebhookEmailData> {
    try {
      const { data, error } = await this.supabase
        .from('user_email_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return {
          user_id: userId,
          email_connected: false,
          outlook_registered: false
        };
      }

      // Check if token is expired
      const isExpired = new Date(data.expires_at) <= new Date();
      
      if (isExpired) {
        console.warn(`⚠️  Token expired for user: ${userId}`);
        // TODO: Implement token refresh logic
        return {
          user_id: userId,
          email_connected: false,
          outlook_registered: true, // Was registered but token expired
          user_email: data.email_address
        };
      }

      return {
        user_id: userId,
        email_connected: true,
        bearer_token: data.access_token,
        user_email: data.email_address,
        outlook_registered: true
      };

    } catch (error) {
      console.error('Failed to get user token:', error);
      return {
        user_id: userId,
        email_connected: false,
        outlook_registered: false
      };
    }
  }

  /**
   * Check if user has connected their email
   */
  async isUserEmailConnected(userId: string): Promise<boolean> {
    const webhookData = await this.getUserTokenForWebhook(userId);
    return webhookData.email_connected;
  }

  /**
   * Refresh expired token using refresh token
   */
  async refreshUserToken(userId: string): Promise<{ success: boolean; newToken?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('user_email_tokens')
        .select('refresh_token, email_address')
        .eq('user_id', userId)
        .single();

      if (error || !data?.refresh_token) {
        return { success: false };
      }

      // TODO: Implement Microsoft Graph token refresh
      // This would use MSAL to refresh the token with the refresh_token
      
      console.log(`🔄 Would refresh token for user: ${userId}`);
      return { success: false }; // Placeholder

    } catch (error) {
      console.error('Failed to refresh token:', error);
      return { success: false };
    }
  }

  /**
   * Remove user's email connection (disconnect)
   */
  async disconnectUserEmail(userId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await this.supabase
        .from('user_email_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to disconnect user email:', error);
        return { success: false };
      }

      console.log(`🔌 Disconnected email for user: ${userId}`);
      return { success: true };

    } catch (error) {
      console.error('Failed to disconnect user email:', error);
      return { success: false };
    }
  }
}

// Singleton instance
export const emailSupabaseService = new EmailSupabaseService();