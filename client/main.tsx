import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter.tsx'
import './global.css' // Always load CSS

// CSS consolidated into globals.localux.css only

// Conditional CSS loading based on LOCAL_HOUSE environment
const isLocalHouse = 
  import.meta.env.VITE_ENVIRONMENT === 'local_house' || 
  (typeof window !== 'undefined' && (
    window.location.hostname === 'studio.local'
    // Disabled localhost for normal CelesteOS operation
    // || window.location.hostname === 'localhost' // Enable for development
  ));

// Load LOCAL UX styles if in LOCAL_HOUSE mode
if (isLocalHouse) {
  // Temporarily disable font loading until we fix font files
  // import('./styles/fonts.localux.css');
  import('./styles/globals.localux.css');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppRouter />
)

// Service worker registration is now handled automatically by vite-plugin-pwa
// in production builds. It's disabled in development to avoid conflicts.