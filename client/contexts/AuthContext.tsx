import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import supabaseAuthService from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';
import type { SupabaseUserAuthResponse } from '../services/supabaseAuthService';
import type { Session } from '@supabase/supabase-js';

// Keep backward compatibility with existing UserAuthResponse type
type UserAuthResponse = SupabaseUserAuthResponse;

interface AuthContextType {
  user: UserAuthResponse | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (displayName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  connectMicrosoft: () => Promise<{ success: boolean; error?: string }>;
  isMicrosoftConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAuthResponse | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with current session
    const initializeAuth = async () => {
      // First get the session directly from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Format the user data
        const displayName = session.user.user_metadata?.display_name ||
                          session.user.user_metadata?.full_name ||
                          session.user.email?.split('@')[0] ||
                          'User';

        const userData: UserAuthResponse = {
          userId: session.user.id, // Fixed: use userId instead of user_id
          user_id: session.user.id, // Keep for backward compatibility
          email: session.user.email || '',
          userName: displayName, // Fixed: add userName property
          display_name: displayName,
          avatar_url: session.user.user_metadata?.avatar_url,
          provider: 'supabase',
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0
        };

        setUser(userData);
        setSession(session);
      } else {
        setSession(null);
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          // User logged in - format the user data directly
          const displayName = session.user.user_metadata?.display_name ||
                            session.user.user_metadata?.full_name ||
                            session.user.email?.split('@')[0] ||
                            'User';

          const userData: UserAuthResponse = {
            userId: session.user.id, // Fixed: use userId instead of user_id
            user_id: session.user.id, // Keep for backward compatibility
            email: session.user.email || '',
            userName: displayName, // Fixed: add userName property
            display_name: displayName,
            avatar_url: session.user.user_metadata?.avatar_url,
            provider: 'supabase',
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || 0
          };

          setUser(userData);
          setSession(session);
        } else {
          // User logged out
          setUser(null);
          setSession(null);
        }

        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await supabaseAuthService.login(email, password);
      if (response.success) {
        // No need to manually setUser - the auth state change listener will handle it
        return { success: true };
      }
      return { 
        success: false, 
        error: response.error || 'Login failed' 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (displayName: string, email: string, password: string) => {
    try {
      const response = await supabaseAuthService.signup(displayName, email, password);
      if (response.success) {
        // No need to manually setUser - the auth state change listener will handle it
        return { success: true };
      }
      return { 
        success: false, 
        error: response.error || 'Signup failed' 
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    await supabaseAuthService.logout();
    // No need to manually setUser(null) - the auth state change listener will handle it
  };

  const connectMicrosoft = async () => {
    try {
      // Note: Microsoft integration will still use webhook service for now
      // as it requires complex OAuth flow with n8n workflows
      const completeWebhookService = await import('../services/webhookServiceComplete');
      const response = await completeWebhookService.default.connectMicrosoftEmail();
      if (response.success) {
        return { success: true };
      }
      return { 
        success: false, 
        error: response.error || 'Failed to connect Microsoft account' 
      };
    } catch (error: any) {
      console.error('Microsoft connect error:', error);
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    connectMicrosoft,
    isMicrosoftConnected: false // TODO: Implement Microsoft connection check with Supabase
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}