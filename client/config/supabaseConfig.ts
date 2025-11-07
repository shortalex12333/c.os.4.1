/**
 * Supabase Configuration for CelesteOS-Modern
 * Handles client-side authentication with local Supabase instance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getHostIP } from './network';

// Supabase configuration - Dynamic IP detection for LAN access
const getSupabaseUrl = (): string => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  // If accessing via tunnel (loca.lt, ngrok, etc.), use proxy path
  if (hostname.includes('.loca.lt') || hostname.includes('.ngrok.io') || hostname.includes('.trycloudflare.com')) {
    return `${protocol}//${hostname}/supabase`;
  }

  // Otherwise use direct port access
  return `http://${getHostIP()}:54321`;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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