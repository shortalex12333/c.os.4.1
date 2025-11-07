/**
 * LOCAL UX Font Loading System
 * Manages font loading for LOCAL_HOUSE mode with fallback strategies
 * Prevents FOIT/FOUT and ensures optimal loading performance
 */

import { isLocalHouse, localHouseConfig, debugLog } from '../config/localhouse';

// Font loading state management
interface FontLoadingState {
  eloquiaDisplay: 'loading' | 'loaded' | 'error' | 'fallback';
  eloquiaText: 'loading' | 'loaded' | 'error' | 'fallback';
  interLocal: 'loading' | 'loaded' | 'error' | 'fallback';
}

let fontLoadingState: FontLoadingState = {
  eloquiaDisplay: 'loading',
  eloquiaText: 'loading', 
  interLocal: 'loading'
};

// Font loading callbacks
type FontLoadCallback = (fontFamily: string, status: 'loaded' | 'error') => void;
const fontLoadCallbacks: FontLoadCallback[] = [];

/**
 * Add font load event listener
 */
export const onFontLoad = (callback: FontLoadCallback): (() => void) => {
  fontLoadCallbacks.push(callback);
  
  // Return cleanup function
  return () => {
    const index = fontLoadCallbacks.indexOf(callback);
    if (index > -1) {
      fontLoadCallbacks.splice(index, 1);
    }
  };
};

/**
 * Notify font load callbacks
 */
const notifyFontLoad = (fontFamily: string, status: 'loaded' | 'error') => {
  fontLoadCallbacks.forEach(callback => {
    try {
      callback(fontFamily, status);
    } catch (error) {
      console.warn('Font load callback error:', error);
    }
  });
};

/**
 * Load individual font face with timeout and fallback
 */
const loadFontFace = async (
  fontFamily: string, 
  fontWeight: string | number,
  woff2Path: string,
  woffPath: string,
  timeout: number = 3000
): Promise<boolean> => {
  if (!isLocalHouse) {
    debugLog(`Skipping local font load for ${fontFamily} - not in LOCAL_HOUSE mode`);
    return false;
  }

  const fontFace = new FontFace(fontFamily, `
    url('${woff2Path}') format('woff2'),
    url('${woffPath}') format('woff')
  `, {
    weight: fontWeight.toString(),
    display: 'block',
    style: 'normal'
  });

  try {
    // Race between font load and timeout
    const loadPromise = fontFace.load();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Font load timeout')), timeout);
    });

    await Promise.race([loadPromise, timeoutPromise]);
    
    // Add to document fonts
    document.fonts.add(fontFace);
    
    debugLog(`Font loaded successfully: ${fontFamily} ${fontWeight}`);
    return true;
    
  } catch (error) {
    debugLog(`Font load failed: ${fontFamily} ${fontWeight}`, error);
    return false;
  }
};

/**
 * Load Eloquia Display font family
 */
const loadEloquiaDisplay = async (): Promise<boolean> => {
  debugLog('Loading Eloquia Display font family');
  
  const fonts = [
    { weight: 400, woff2: '/fonts/eloquia-display-regular.woff2', woff: '/fonts/eloquia-display-regular.woff' },
    { weight: 500, woff2: '/fonts/eloquia-display-medium.woff2', woff: '/fonts/eloquia-display-medium.woff' },
    { weight: 600, woff2: '/fonts/eloquia-display-semibold.woff2', woff: '/fonts/eloquia-display-semibold.woff' }
  ];

  const results = await Promise.allSettled(
    fonts.map(font => loadFontFace('Eloquia Display', font.weight, font.woff2, font.woff))
  );

  const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
  const success = successCount > 0; // At least one weight loaded successfully

  fontLoadingState.eloquiaDisplay = success ? 'loaded' : 'error';
  notifyFontLoad('Eloquia Display', success ? 'loaded' : 'error');
  
  return success;
};

/**
 * Load Eloquia Text font family  
 */
const loadEloquiaText = async (): Promise<boolean> => {
  debugLog('Loading Eloquia Text font family');
  
  const fonts = [
    { weight: 400, woff2: '/fonts/eloquia-text-regular.woff2', woff: '/fonts/eloquia-text-regular.woff' },
    { weight: 500, woff2: '/fonts/eloquia-text-medium.woff2', woff: '/fonts/eloquia-text-medium.woff' },
    { weight: 600, woff2: '/fonts/eloquia-text-semibold.woff2', woff: '/fonts/eloquia-text-semibold.woff' }
  ];

  const results = await Promise.allSettled(
    fonts.map(font => loadFontFace('Eloquia Text', font.weight, font.woff2, font.woff))
  );

  const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
  const success = successCount > 0;

  fontLoadingState.eloquiaText = success ? 'loaded' : 'error';
  notifyFontLoad('Eloquia Text', success ? 'loaded' : 'error');
  
  return success;
};

/**
 * Load Inter Local font family (fallback)
 */
const loadInterLocal = async (): Promise<boolean> => {
  debugLog('Loading Inter Local font family');
  
  const fonts = [
    { weight: 400, woff2: '/fonts/inter-regular.woff2', woff: '/fonts/inter-regular.woff' },
    { weight: 500, woff2: '/fonts/inter-medium.woff2', woff: '/fonts/inter-medium.woff' },
    { weight: 600, woff2: '/fonts/inter-semibold.woff2', woff: '/fonts/inter-semibold.woff' },
    { weight: 700, woff2: '/fonts/inter-bold.woff2', woff: '/fonts/inter-bold.woff' }
  ];

  const results = await Promise.allSettled(
    fonts.map(font => loadFontFace('Inter Local', font.weight, font.woff2, font.woff))
  );

  const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
  const success = successCount > 0;

  fontLoadingState.interLocal = success ? 'loaded' : 'error';
  notifyFontLoad('Inter Local', success ? 'loaded' : 'error');
  
  return success;
};

/**
 * Initialize font loading for LOCAL_HOUSE mode
 */
export const initializeFontLoading = async (): Promise<void> => {
  if (!isLocalHouse) {
    debugLog('Skipping font initialization - not in LOCAL_HOUSE mode');
    return;
  }

  debugLog('Initializing LOCAL UX font loading system');

  // Load fonts in parallel for optimal performance
  const [eloquiaDisplayLoaded, eloquiaTextLoaded, interLocalLoaded] = await Promise.allSettled([
    loadEloquiaDisplay(),
    loadEloquiaText(), 
    loadInterLocal()
  ]);

  // Log results
  const results = {
    eloquiaDisplay: eloquiaDisplayLoaded.status === 'fulfilled' && eloquiaDisplayLoaded.value,
    eloquiaText: eloquiaTextLoaded.status === 'fulfilled' && eloquiaTextLoaded.value,
    interLocal: interLocalLoaded.status === 'fulfilled' && interLocalLoaded.value
  };

  debugLog('Font loading results:', results);

  // Apply fallback strategies if needed
  if (!results.eloquiaDisplay || !results.eloquiaText) {
    debugLog('Applying font fallback strategy');
    applyFontFallbacks(results);
  }

  // Trigger document reflow to apply loaded fonts
  document.documentElement.classList.add('fonts-loaded');
};

/**
 * Apply fallback font strategies
 */
const applyFontFallbacks = (loadResults: Record<string, boolean>) => {
  const root = document.documentElement;
  
  // Add fallback classes to document
  if (!loadResults.eloquiaDisplay) {
    root.classList.add('eloquia-display-fallback');
    fontLoadingState.eloquiaDisplay = 'fallback';
  }
  
  if (!loadResults.eloquiaText) {
    root.classList.add('eloquia-text-fallback');
    fontLoadingState.eloquiaText = 'fallback';
  }
  
  if (!loadResults.interLocal) {
    root.classList.add('inter-local-fallback');
    fontLoadingState.interLocal = 'fallback';
  }
};

/**
 * Get current font loading state
 */
export const getFontLoadingState = (): FontLoadingState => {
  return { ...fontLoadingState };
};

/**
 * Check if fonts are ready for optimal rendering
 */
export const areFontsReady = (): boolean => {
  if (!isLocalHouse) return true;
  
  return Object.values(fontLoadingState).every(
    state => state === 'loaded' || state === 'fallback'
  );
};

/**
 * Generate font preload links for HTML head
 */
export const getFontPreloadLinks = (): string[] => {
  if (!isLocalHouse) return [];
  
  return [
    '<link rel="preload" href="/fonts/eloquia-display-regular.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/fonts/eloquia-text-regular.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/fonts/inter-regular.woff2" as="font" type="font/woff2" crossorigin>'
  ];
};

// Initialize on module load if in browser
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFontLoading);
} else if (typeof window !== 'undefined') {
  // Document already loaded
  initializeFontLoading();
}