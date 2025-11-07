/**
 * React Hook for Auto Token Refresh
 * Automatically refreshes expired JWT tokens when chat is loaded
 */

import { useState, useEffect, useCallback } from 'react';
import { autoRefreshChatTokens } from '../services/tokenRefreshService';

interface UseTokenRefreshOptions {
  enabled?: boolean;
  userId: string;
  userRole?: string;
}

interface UseTokenRefreshReturn {
  refreshedHistory: any[];
  isRefreshing: boolean;
  wasRefreshed: boolean;
  error: string | null;
  manualRefresh: () => Promise<void>;
}

/**
 * Hook to automatically refresh expired JWT tokens in chat history
 *
 * Usage:
 * ```tsx
 * const { refreshedHistory, isRefreshing } = useTokenRefresh({
 *   chatHistory,
 *   userId: user.id,
 *   userRole: user.role
 * });
 * ```
 */
export function useTokenRefresh(
  chatHistory: any[],
  options: UseTokenRefreshOptions
): UseTokenRefreshReturn {
  const { enabled = true, userId, userRole = 'chief_engineer' } = options;

  const [refreshedHistory, setRefreshedHistory] = useState<any[]>(chatHistory);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wasRefreshed, setWasRefreshed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performRefresh = useCallback(async () => {
    if (!enabled || !userId || chatHistory.length === 0) {
      setRefreshedHistory(chatHistory);
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const result = await autoRefreshChatTokens(chatHistory, userId, userRole);

      setRefreshedHistory(result.chatHistory);
      setWasRefreshed(result.refreshed);

      if (result.refreshed) {
        console.log('✅ Chat tokens auto-refreshed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token refresh failed';
      setError(errorMessage);
      console.error('Token refresh error:', err);
      // Fall back to original history on error
      setRefreshedHistory(chatHistory);
    } finally {
      setIsRefreshing(false);
    }
  }, [chatHistory, userId, userRole, enabled]);

  // Auto-refresh when chat history changes or component mounts
  useEffect(() => {
    performRefresh();
  }, [performRefresh]);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    await performRefresh();
  }, [performRefresh]);

  return {
    refreshedHistory,
    isRefreshing,
    wasRefreshed,
    error,
    manualRefresh
  };
}

/**
 * Simpler hook for one-time refresh on mount
 */
export function useTokenRefreshOnMount(
  chatHistory: any[],
  userId: string,
  userRole: string = 'chief_engineer'
) {
  const [refreshedHistory, setRefreshedHistory] = useState<any[]>(chatHistory);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      if (!userId || chatHistory.length === 0) return;

      setIsRefreshing(true);
      try {
        const result = await autoRefreshChatTokens(chatHistory, userId, userRole);
        if (isMounted) {
          setRefreshedHistory(result.chatHistory);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        if (isMounted) {
          setRefreshedHistory(chatHistory);
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    refresh();

    return () => {
      isMounted = false;
    };
  }, []); // Only run on mount

  return { refreshedHistory, isRefreshing };
}
