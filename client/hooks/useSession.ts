// Session Management Hook
import { useState, useEffect } from 'react';

export interface PortalSession {
  sessionToken: string;
  userId: string;
  expiresAt: Date;
}

const SESSION_KEY = 'celesteos_portal_session';

export function useSession() {
  const [session, setSession] = useState<PortalSession | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const expiresAt = new Date(parsed.expiresAt);

      // Check if expired
      if (expiresAt <= new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return {
        ...parsed,
        expiresAt
      };
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  });

  // Auto-cleanup on expiration
  useEffect(() => {
    if (!session) return;

    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    if (timeUntilExpiry <= 0) {
      clearSession();
      return;
    }

    const timer = setTimeout(() => {
      clearSession();
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [session]);

  const setPortalSession = (sessionToken: string, userId: string) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const newSession: PortalSession = {
      sessionToken,
      userId,
      expiresAt
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify({
      sessionToken,
      userId,
      expiresAt: expiresAt.toISOString()
    }));

    setSession(newSession);
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return {
    session,
    setSession: setPortalSession,
    clearSession,
    isAuthenticated: !!session
  };
}
