/**
 * CelesteOS LOCAL HOUSE Configuration
 * Environment detection and feature flags for LOCAL UX mode
 * Ensures no external dependencies when serving at https://studio.local
 */

// Environment Detection
export const isLocalHouse = 
  import.meta.env.VITE_ENVIRONMENT === 'local_house' || 
  (typeof window !== 'undefined' && (
    window.location.hostname === 'studio.local'
    // Disabled localhost for normal CelesteOS operation
    // window.location.hostname === 'localhost' // Enable for development
  ));

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Core Configuration  
export const localHouseConfig = {
  baseUrl: isLocalHouse ? 'https://studio.local' : import.meta.env.VITE_BASE_URL || 'http://localhost:8080',
  apiUrl: isLocalHouse ? 'https://studio.local/api' : import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  wsUrl: isLocalHouse ? 'wss://studio.local/ws' : import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  
  // Asset paths for LOCAL HOUSE
  fontsPath: '/fonts',
  assetsPath: '/assets', 
  iconsPath: '/icons',
  
  // Feature flags - disable external dependencies in LOCAL HOUSE
  features: {
    externalFonts: !isLocalHouse,
    cdnAssets: !isLocalHouse,
    oauth: !isLocalHouse,
    analytics: !isLocalHouse,
    telemetry: !isLocalHouse,
    offlineMode: isLocalHouse,
    
    // Motion system
    animations: true,
    reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    // Performance features
    bundleAnalyzer: isDevelopment && !isLocalHouse,
    sourceMaps: isDevelopment,
    
    // Security features
    corsStrict: isLocalHouse,
    httpsOnly: isLocalHouse
  },
  
  // Performance limits for LOCAL HOUSE
  performance: {
    bundleSizeLimit: 180 * 1024, // 180KB
    chunkSizeWarning: 64 * 1024,  // 64KB  
    lighthouse: {
      performance: 90,
      accessibility: 100,
      bestPractices: 90,
      seo: 90,
      pwa: 80
    },
    webVitals: {
      lcp: 1800, // 1.8s
      fid: 100,  // 100ms
      cls: 0.05  // 0.05
    }
  },
  
  // Motion specifications - exact timings from authority reference
  motion: {
    micro: 150,     // 120-180ms 
    ui: 280,        // 240-320ms
    section: 450,   // 380-520ms  
    page: 600,      // 500-700ms
    stagger: 75,    // 60-90ms
    
    // Easing curve from authority reference
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    
    // Property restrictions
    allowedProperties: ['transform', 'opacity'],
    
    // Animation disable conditions
    disableAnimations: isLocalHouse && 
      (typeof window !== 'undefined' && (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.innerWidth < 768 // Disable complex animations on mobile
      ))
  },
  
  // Typography configuration
  typography: {
    fontFamily: {
      display: isLocalHouse 
        ? ['Eloquia Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
        : ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      text: isLocalHouse
        ? ['Eloquia Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'] 
        : ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    },
    fontDisplay: 'block',
    fontSynthesis: 'none'
  }
};

// Helper functions
export const getAssetUrl = (path: string): string => {
  if (isLocalHouse) {
    return `${localHouseConfig.baseUrl}${path}`;
  }
  return path;
};

export const getFontUrl = (filename: string): string => {
  return getAssetUrl(`${localHouseConfig.fontsPath}/${filename}`);
};

export const shouldLoadExternalResource = (): boolean => {
  return !isLocalHouse;
};

export const getMotionConfig = () => {
  return {
    ...localHouseConfig.motion,
    disabled: localHouseConfig.motion.disableAnimations
  };
};

// Debug logging for LOCAL HOUSE
export const debugLog = (message: string, data?: any) => {
  if (isDevelopment || isLocalHouse) {
    console.log(`[LOCAL_HOUSE] ${message}`, data || '');
  }
};

// Environment validation
if (isLocalHouse) {
  debugLog('LOCAL HOUSE mode activated', {
    baseUrl: localHouseConfig.baseUrl,
    features: localHouseConfig.features,
    motion: localHouseConfig.motion
  });
}

export default localHouseConfig;