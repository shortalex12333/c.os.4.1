import React, { Suspense, lazy } from 'react';
import { isLocalHouse, debugLog } from './config/localhouse';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Lazy load components to avoid including unused code in bundles
const CelesteOSApp = lazy(() => import('./AppFigma')); // Original ChatGPT Clone with webhook auth
const LocalUXApp = lazy(() => import('./components/localux/LocalUXApp'));
const MicrosoftCallback = lazy(() => import('./components/MicrosoftCallback').then(m => ({ default: m.MicrosoftCallback })));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-600 font-medium">
        {isLocalHouse ? 'Loading LOCAL UX...' : 'Loading CelesteOS...'}
      </span>
    </div>
  </div>
);

/**
 * App Router Component
 * Routes between CelesteOS production app and LOCAL UX implementation
 * Based on environment detection and https://studio.local hostname
 */
export default function AppRouter() {
  debugLog('AppRouter initializing', { 
    isLocalHouse,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    environment: import.meta.env.VITE_ENVIRONMENT
  });

  // Check if this is a Microsoft OAuth callback
  const isMicrosoftCallback = typeof window !== 'undefined' && 
    window.location.pathname === '/auth/microsoft/callback';

  return (
    <Suspense fallback={<LoadingFallback />}>
      {isMicrosoftCallback ? (
        <MicrosoftCallback />
      ) : isLocalHouse ? (
        <LocalUXApp />
      ) : (
        <AuthProvider>
          <SettingsProvider>
            <CelesteOSApp />
          </SettingsProvider>
        </AuthProvider>
      )}
    </Suspense>
  );
}