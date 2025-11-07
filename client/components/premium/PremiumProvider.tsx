// Premium Context Provider
// Provides premium features context to all child components

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePremiumStore, selectAnimationSettings, selectVisualSettings, selectAccessibilitySettings } from '../../stores/premiumStore';
import { monitoringService } from '../../services/monitoringService';
import type { PremiumContextValue } from './types';

const PremiumContext = createContext<PremiumContextValue | null>(null);

interface PremiumProviderProps {
  children: ReactNode;
  initialTheme?: 'light' | 'dark';
  enableAnalytics?: boolean;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({
  children,
  initialTheme = 'light',
  enableAnalytics = true,
  enablePerformanceMonitoring = true,
  debugMode = process.env.NODE_ENV === 'development',
}) => {
  // Premium store integration
  const {
    // Animation settings
    animationsEnabled,
    setAnimationsEnabled,
    reducedMotion,
    setReducedMotion,
    
    // Visual settings
    isDarkMode,
    setDarkMode,
    glassmorphismEnabled,
    setGlassmorphismEnabled,
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    
    // Accessibility settings
    screenReaderEnabled,
    setScreenReaderEnabled,
    
    // Performance settings
    performanceMode,
    setPerformanceMode,
    
    // Error handling
    addError,
    
    // System initialization
    initializeFromSystemPreferences,
    loadFromStorage,
    saveToStorage,
  } = usePremiumStore();

  // Initialize premium store on mount
  useEffect(() => {
    // Load system preferences and saved settings
    initializeFromSystemPreferences();
    loadFromStorage();
    
    // Set initial theme if provided
    if (initialTheme !== 'auto') {
      setDarkMode(initialTheme === 'dark');
    }
    
    // Initialize monitoring service
    if (enablePerformanceMonitoring) {
      monitoringService.trackEvent('premium_provider_initialized', {
        enableAnalytics,
        enablePerformanceMonitoring,
        debugMode,
        initialTheme,
      });
    }
  }, [
    initializeFromSystemPreferences,
    loadFromStorage,
    initialTheme,
    setDarkMode,
    enableAnalytics,
    enablePerformanceMonitoring,
    debugMode
  ]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Apply accessibility classes
    root.classList.toggle('reduced-motion', reducedMotion);
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('large-text', largeText);
    root.classList.toggle('screen-reader', screenReaderEnabled);
    root.classList.toggle('performance-mode', performanceMode);
    
    // Apply animation classes
    root.classList.toggle('animations-enabled', animationsEnabled);
    root.classList.toggle('glassmorphism-enabled', glassmorphismEnabled);
  }, [
    isDarkMode,
    reducedMotion,
    highContrast,
    largeText,
    screenReaderEnabled,
    performanceMode,
    animationsEnabled,
    glassmorphismEnabled
  ]);

  // Auto-save settings when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    animationsEnabled,
    reducedMotion,
    isDarkMode,
    glassmorphismEnabled,
    highContrast,
    largeText,
    screenReaderEnabled,
    performanceMode,
    saveToStorage
  ]);

  // Monitor system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = [
      {
        query: '(prefers-color-scheme: dark)',
        handler: (e: MediaQueryListEvent) => {
          if (initialTheme === 'auto') {
            setDarkMode(e.matches);
          }
        }
      },
      {
        query: '(prefers-reduced-motion: reduce)',
        handler: (e: MediaQueryListEvent) => {
          setReducedMotion(e.matches);
          if (e.matches) {
            setAnimationsEnabled(false);
            setGlassmorphismEnabled(false);
          }
        }
      },
      {
        query: '(prefers-contrast: high)',
        handler: (e: MediaQueryListEvent) => {
          setHighContrast(e.matches);
          if (e.matches) {
            setGlassmorphismEnabled(false);
          }
        }
      }
    ];

    const cleanupFunctions = mediaQueries.map(({ query, handler }) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [
    initialTheme,
    setDarkMode,
    setReducedMotion,
    setAnimationsEnabled,
    setGlassmorphismEnabled,
    setHighContrast
  ]);

  // Debug logging
  useEffect(() => {
    if (debugMode) {
      const settings = {
        theme: isDarkMode ? 'dark' : 'light',
        animationsEnabled,
        reducedMotion,
        glassmorphismEnabled,
        highContrast,
        largeText,
        screenReaderEnabled,
        performanceMode,
      };
      
      console.group('🎨 Premium Provider Settings');
      console.table(settings);
      console.groupEnd();
    }
  }, [
    debugMode,
    isDarkMode,
    animationsEnabled,
    reducedMotion,
    glassmorphismEnabled,
    highContrast,
    largeText,
    screenReaderEnabled,
    performanceMode
  ]);

  // Context value
  const contextValue: PremiumContextValue = {
    // Theme and styling
    theme: isDarkMode ? 'dark' : 'light',
    setTheme: (theme) => {
      setDarkMode(theme === 'dark');
      if (enableAnalytics) {
        monitoringService.trackEvent('theme_changed', { theme });
      }
    },
    
    // Animation preferences
    animationsEnabled,
    setAnimationsEnabled: (enabled) => {
      setAnimationsEnabled(enabled);
      if (enableAnalytics) {
        monitoringService.trackEvent('animations_toggled', { enabled });
      }
    },
    reducedMotion,
    
    // Accessibility settings
    accessibilityMode: screenReaderEnabled || highContrast || largeText,
    setAccessibilityMode: (enabled) => {
      setScreenReaderEnabled(enabled);
      if (enabled) {
        setAnimationsEnabled(false);
        setGlassmorphismEnabled(false);
      }
      if (enableAnalytics) {
        monitoringService.trackEvent('accessibility_mode_toggled', { enabled });
      }
    },
    
    highContrast,
    setHighContrast: (enabled) => {
      setHighContrast(enabled);
      if (enabled) {
        setGlassmorphismEnabled(false);
      }
      if (enableAnalytics) {
        monitoringService.trackEvent('high_contrast_toggled', { enabled });
      }
    },
    
    largeText,
    setLargeText: (enabled) => {
      setLargeText(enabled);
      if (enableAnalytics) {
        monitoringService.trackEvent('large_text_toggled', { enabled });
      }
    },
    
    // Performance settings
    performanceMode,
    setPerformanceMode: (enabled) => {
      setPerformanceMode(enabled);
      if (enabled) {
        setAnimationsEnabled(false);
        setGlassmorphismEnabled(false);
      }
      if (enableAnalytics) {
        monitoringService.trackEvent('performance_mode_toggled', { enabled });
      }
    },
    
    // Error handling
    reportError: (error, context) => {
      addError({
        message: error.message,
        component: context,
      });
      
      if (enableAnalytics) {
        monitoringService.recordError(error, context);
      }
      
      if (debugMode) {
        console.error('Premium Provider Error:', error, context);
      }
    },
    
    // Analytics
    trackEvent: (event, properties = {}) => {
      if (enableAnalytics) {
        monitoringService.trackEvent(event, {
          ...properties,
          timestamp: Date.now(),
          theme: isDarkMode ? 'dark' : 'light',
          animationsEnabled,
          performanceMode,
        });
      }
      
      if (debugMode) {
        console.log('Premium Event:', event, properties);
      }
    },
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
};

// Hook to use premium context
export const usePremiumContext = (): PremiumContextValue => {
  const context = useContext(PremiumContext);
  
  if (!context) {
    throw new Error('usePremiumContext must be used within a PremiumProvider');
  }
  
  return context;
};

// Selector hooks for optimized subscriptions
export const usePremiumAnimations = () => {
  const store = usePremiumStore(selectAnimationSettings);
  return store;
};

export const usePremiumVisuals = () => {
  const store = usePremiumStore(selectVisualSettings);
  return store;
};

export const usePremiumAccessibility = () => {
  const store = usePremiumStore(selectAccessibilitySettings);
  return store;
};

// HOC for components that need premium context
export const withPremiumContext = <P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithPremiumContextComponent = (props: P) => {
    const premiumContext = usePremiumContext();
    
    return (
      <WrappedComponent
        {...props}
        premiumContext={premiumContext}
      />
    );
  };
  
  WithPremiumContextComponent.displayName = `withPremiumContext(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return WithPremiumContextComponent;
};

export default PremiumProvider;