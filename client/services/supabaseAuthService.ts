/**
 * Supabase Authentication Service for CelesteOS-Modern
 * Replaces webhook-based authentication with direct Supabase Auth
 */

import { supabase } from '../config/supabaseConfig';
import type { 
  User, 
  Session, 
  AuthResponse, 
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials 
} from '@supabase/supabase-js';

// Types matching the existing UserAuthResponse interface used by AuthContext
export interface SupabaseUserAuthResponse {
  success: boolean;
  userId: string;
  user_id: string; // Keep for backward compatibility
  userName: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  token?: string;
  sessionId: string;
  message?: string;
  user?: User;
  session?: Session;
}

export interface SupabaseAuthResponse {
  success: boolean;
  data?: SupabaseUserAuthResponse;
  error?: string;
}

class SupabaseAuthService {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  constructor() {
    // Initialize session from Supabase
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from Supabase session
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      this.currentSession = session;
      this.currentUser = session?.user || null;

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        this.currentSession = session;
        this.currentUser = session?.user || null;
      });

    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }

  /**
   * Sign up a new user with email and password
   */
  async signup(
    displayName: string, 
    email: string, 
    password: string
  ): Promise<SupabaseAuthResponse> {
    try {
      const credentials: SignUpWithPasswordCredentials = {
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            full_name: displayName.trim(),
          }
        }
      };

      const { data, error }: AuthResponse = await supabase.auth.signUp(credentials);

      if (error) {
        console.error('Signup error:', error);
        return {
          success: false,
          error: error.message || 'Signup failed'
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user data returned from signup'
        };
      }

      // Update local state
      this.currentUser = data.user;
      this.currentSession = data.session;

      const userResponse: SupabaseUserAuthResponse = {
        success: true,
        userId: data.user.id,
        user_id: data.user.id,
        userName: displayName.trim(),
        email: data.user.email || email,
        display_name: displayName.trim(),
        avatar_url: data.user.user_metadata?.avatar_url,
        provider: 'supabase',
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at || 0,
        token: data.session?.access_token,
        sessionId: data.session?.id || `session_${Date.now()}`,
        user: data.user,
        session: data.session,
        message: data.user.email_confirmed_at ? 'Signup successful' : 'Please check your email to confirm your account'
      };

      return {
        success: true,
        data: userResponse
      };

    } catch (error: any) {
      console.error('Signup exception:', error);
      return {
        success: false,
        error: error.message || 'Signup failed'
      };
    }
  }

  /**
   * Sign in user with email and password
   */
  async login(email: string, password: string): Promise<SupabaseAuthResponse> {
    try {
      const credentials: SignInWithPasswordCredentials = {
        email: email.toLowerCase().trim(),
        password
      };

      const { data, error }: AuthResponse = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error.message || 'Login failed'
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user data returned from login'
        };
      }

      // Update local state
      this.currentUser = data.user;
      this.currentSession = data.session;

      const displayName = data.user.user_metadata?.display_name || 
                         data.user.user_metadata?.full_name || 
                         data.user.email?.split('@')[0] || 
                         'User';

      const userResponse: SupabaseUserAuthResponse = {
        success: true,
        userId: data.user.id,
        user_id: data.user.id,
        userName: displayName,
        email: data.user.email || email,
        display_name: displayName,
        avatar_url: data.user.user_metadata?.avatar_url,
        provider: 'supabase',
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at || 0,
        token: data.session?.access_token,
        sessionId: data.session?.id || `session_${Date.now()}`,
        user: data.user,
        session: data.session,
        message: 'Login successful'
      };

      return {
        success: true,
        data: userResponse
      };

    } catch (error: any) {
      console.error('Login exception:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        return false;
      }

      // Clear local state
      this.currentUser = null;
      this.currentSession = null;

      return true;

    } catch (error) {
      console.error('Logout exception:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser(): SupabaseUserAuthResponse | null {
    // Try to get from Supabase directly if not in memory
    if (!this.currentUser || !this.currentSession) {
      const session = supabase.auth.getSession().then(({ data }) => data.session);
      // For synchronous call, we can't wait for promise, so return null
      // The auth state listener will update when ready
      return null;
    }

    const displayName = this.currentUser.user_metadata?.display_name || 
                       this.currentUser.user_metadata?.full_name || 
                       this.currentUser.email?.split('@')[0] || 
                       'User';

    return {
      success: true,
      userId: this.currentUser.id,
      user_id: this.currentUser.id,
      userName: displayName,
      email: this.currentUser.email || '',
      display_name: displayName,
      avatar_url: this.currentUser.user_metadata?.avatar_url,
      provider: 'supabase',
      access_token: this.currentSession.access_token,
      refresh_token: this.currentSession.refresh_token,
      expires_at: this.currentSession.expires_at || 0,
      token: this.currentSession.access_token,
      sessionId: this.currentSession.id || `session_${Date.now()}`,
      user: this.currentUser,
      session: this.currentSession
    };
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.currentUser && this.currentSession);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.currentSession?.access_token || null;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Get current user email
   */
  getUserEmail(): string | null {
    return this.currentUser?.email || null;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return false;
      }

      this.currentSession = data.session;
      this.currentUser = data.user;
      return true;

    } catch (error) {
      console.error('Session refresh exception:', error);
      return false;
    }
  }

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed' };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Password update failed' };
    }
  }

  /**
   * Update user profile data
   */
  async updateProfile(updates: {
    display_name?: string;
    full_name?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Profile update failed' };
    }
  }
}

// Create singleton instance
const supabaseAuthService = new SupabaseAuthService();

export default supabaseAuthService;
export { SupabaseAuthService };