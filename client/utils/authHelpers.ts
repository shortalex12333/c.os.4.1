/**
 * Authentication Helper Utilities
 * Handles auth token cleanup and validation
 */

import { supabase } from '../lib/supabase';

/**
 * Clear all Supabase auth tokens and session data
 * Useful when encountering "User from JWT does not exist" errors
 */
export async function clearAuthTokens(): Promise<void> {
  try {
    console.log('🧹 Clearing Supabase auth tokens...');

    // Sign out from Supabase (clears tokens)
    await supabase.auth.signOut();

    // Clear any remaining localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('supabase.') ||
        key.includes('auth-token') ||
        key.includes('sb-') ||
        key === 'supabase-auth-token'
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      console.log('  Removing:', key);
      localStorage.removeItem(key);
    });

    console.log('✅ Auth tokens cleared');
  } catch (error) {
    console.error('❌ Error clearing auth tokens:', error);
  }
}

/**
 * Check if current auth session is valid
 */
export async function validateAuthSession(): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Auth session invalid:', error);

      // If error is "User from JWT does not exist", clear tokens
      if (error.message.includes('User from sub claim in JWT does not exist')) {
        console.warn('⚠️ Stale JWT detected - clearing auth tokens');
        await clearAuthTokens();
      }

      return false;
    }

    if (!user) {
      console.log('⚠️ No authenticated user');
      return false;
    }

    console.log('✅ Auth session valid for user:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Error validating auth:', error);
    return false;
  }
}

/**
 * Force re-authentication (sign out and redirect to login)
 */
export async function forceReAuthentication(): Promise<void> {
  await clearAuthTokens();
  // Redirect to login page
  window.location.href = '/login';
}
