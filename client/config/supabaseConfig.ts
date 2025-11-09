/**
 * Supabase Configuration for CelesteOS-Modern
 * Handles client-side authentication with cloud/local Supabase instance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getHostIP } from './network';

// Production Supabase credentials (fallback if env vars not available)
const PRODUCTION_SUPABASE_URL = 'https://vivovcnaapmcfxxfhzxk.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E';

// Supabase configuration - Dynamic based on environment
const getSupabaseUrl = (): string => {
  // Use environment variable if available
  const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  if (envUrl) {
    console.log('🔍 [supabaseConfig] Using env URL:', envUrl);
    return envUrl;
  }

  // Production fallback
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    console.log('🔍 [supabaseConfig] Using production URL');
    return PRODUCTION_SUPABASE_URL;
  }

  // Development - dynamic IP detection for LAN access
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  // If accessing via tunnel (loca.lt, ngrok, etc.), use proxy path
  if (hostname.includes('.loca.lt') || hostname.includes('.ngrok.io') || hostname.includes('.trycloudflare.com')) {
    return `${protocol}//${hostname}/supabase`;
  }

  // Otherwise use direct port access for local development
  return `http://${getHostIP()}:54321`;
};

const getSupabaseAnonKey = (): string => {
  // Use environment variable if available
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envKey) {
    console.log('🔍 [supabaseConfig] Using env anon key');
    return envKey;
  }

  // Production fallback
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    console.log('🔍 [supabaseConfig] Using production anon key');
    return PRODUCTION_SUPABASE_ANON_KEY;
  }

  // Development - local Supabase anon key
  console.log('🔍 [supabaseConfig] Using local dev anon key');
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence
    persistSession: true,
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Detect session from URL (useful for OAuth redirects)
    detectSessionInUrl: true,
    // Storage key for session data (unique for NEWSITE)
    storageKey: 'newsite-auth-token',
  },
  // Enable realtime features if needed
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Export configuration values for debugging/testing
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isLocal: supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'),
} as const;

export default supabase;