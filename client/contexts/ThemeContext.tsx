// Theme Context for CelesteOS
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSunSweepOverlay } from '../utils/sunSweep';
import { flags } from '../utils/featureFlags';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
  setIsDarkMode: (dark: boolean) => void;
  theme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to dark
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('celesteos-theme');
      return saved !== null ? saved === 'dark' : true; // Default to dark
    }
    return true;
  });

  // Flag to prevent useEffect from re-applying the same changes
  const justFlippedRef = React.useRef(false);

  // Apply theme to document
  useEffect(() => {
    // Skip if we already did a sync flip
    if (justFlippedRef.current) {
      justFlippedRef.current = false;
      return;
    }

    // Fallback path (initial mount, external updates)
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#fafafa');
      root.style.setProperty('--card', '#0a0a0a');
      root.style.setProperty('--card-foreground', '#fafafa');
      root.style.setProperty('--popover', '#0a0a0a');
      root.style.setProperty('--popover-foreground', '#fafafa');
      root.style.setProperty('--primary', '#fafafa');
      root.style.setProperty('--primary-foreground', '#0a0a0a');
      root.style.setProperty('--secondary', '#262626');
      root.style.setProperty('--secondary-foreground', '#fafafa');
      root.style.setProperty('--muted', '#262626');
      root.style.setProperty('--muted-foreground', '#a1a1aa');
      root.style.setProperty('--accent', '#262626');
      root.style.setProperty('--accent-foreground', '#fafafa');
      root.style.setProperty('--destructive', '#dc2626');
      root.style.setProperty('--destructive-foreground', '#fafafa');
      root.style.setProperty('--border', '#262626');
      root.style.setProperty('--input', '#262626');
      root.style.setProperty('--ring', '#d4d4d8');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#0a0a0a');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#0a0a0a');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#0a0a0a');
      root.style.setProperty('--primary', '#0a0a0a');
      root.style.setProperty('--primary-foreground', '#fafafa');
      root.style.setProperty('--secondary', '#f5f5f5');
      root.style.setProperty('--secondary-foreground', '#0a0a0a');
      root.style.setProperty('--muted', '#f5f5f5');
      root.style.setProperty('--muted-foreground', '#71717a');
      root.style.setProperty('--accent', '#f5f5f5');
      root.style.setProperty('--accent-foreground', '#0a0a0a');
      root.style.setProperty('--destructive', '#dc2626');
      root.style.setProperty('--destructive-foreground', '#fafafa');
      root.style.setProperty('--border', '#e5e5e5');
      root.style.setProperty('--input', '#e5e5e5');
      root.style.setProperty('--ring', '#71717a');
    }

    // Save to localStorage
    try {
      localStorage.setItem('celesteos-theme', isDarkMode ? 'dark' : 'light');
    } catch {}
  }, [isDarkMode]);

  const applyThemeToDOM = (isDark: boolean) => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      // Apply dark theme CSS properties
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#fafafa');
      root.style.setProperty('--card', '#0a0a0a');
      root.style.setProperty('--card-foreground', '#fafafa');
      root.style.setProperty('--popover', '#0a0a0a');
      root.style.setProperty('--popover-foreground', '#fafafa');
      root.style.setProperty('--primary', '#fafafa');
      root.style.setProperty('--primary-foreground', '#0a0a0a');
      root.style.setProperty('--secondary', '#262626');
      root.style.setProperty('--secondary-foreground', '#fafafa');
      root.style.setProperty('--muted', '#262626');
      root.style.setProperty('--muted-foreground', '#a1a1aa');
      root.style.setProperty('--accent', '#262626');
      root.style.setProperty('--accent-foreground', '#fafafa');
      root.style.setProperty('--destructive', '#dc2626');
      root.style.setProperty('--destructive-foreground', '#fafafa');
      root.style.setProperty('--border', '#262626');
      root.style.setProperty('--input', '#262626');
      root.style.setProperty('--ring', '#d4d4d8');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      // Apply light theme CSS properties
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#0a0a0a');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#0a0a0a');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#0a0a0a');
      root.style.setProperty('--primary', '#0a0a0a');
      root.style.setProperty('--primary-foreground', '#fafafa');
      root.style.setProperty('--secondary', '#f5f5f5');
      root.style.setProperty('--secondary-foreground', '#0a0a0a');
      root.style.setProperty('--muted', '#f5f5f5');
      root.style.setProperty('--muted-foreground', '#71717a');
      root.style.setProperty('--accent', '#f5f5f5');
      root.style.setProperty('--accent-foreground', '#0a0a0a');
      root.style.setProperty('--destructive', '#dc2626');
      root.style.setProperty('--destructive-foreground', '#fafafa');
      root.style.setProperty('--border', '#e5e5e5');
      root.style.setProperty('--input', '#e5e5e5');
      root.style.setProperty('--ring', '#71717a');
    }
  };

  const toggleTheme = async () => {
    const nextIsDark = !isDarkMode;
    const nextTheme = nextIsDark ? 'dark' : 'light';

    // Telemetry
    if (typeof window !== 'undefined' && (window as any).analytics?.track) {
      (window as any).analytics.track('theme_toggle', {
        to: nextTheme,
        source: 'button'
      });
    }

    console.log('🎨 Theme Toggle Debug:', {
      flagEnabled: flags.FX_SUN_SWEEP,
      targetTheme: nextTheme,
      localStorage: localStorage.getItem('FX_SUN_SWEEP')
    });

    if (flags.FX_SUN_SWEEP) {
      console.log('🌅 Starting sun sweep animation for', nextTheme);

      // Create callback to switch theme mid-animation
      const switchTheme = () => {
        console.log('🔄 Theme switch callback triggered');
        applyThemeToDOM(nextIsDark);
        justFlippedRef.current = true;
        setIsDarkMode(nextIsDark);

        // Persist to localStorage
        try {
          localStorage.setItem('celesteos-theme', nextTheme);
        } catch {}
      };

      // Start animation with theme switch callback
      await createSunSweepOverlay(nextTheme, switchTheme);
      console.log('✅ Sun sweep animation completed');
    } else {
      // No animation - immediate switch
      applyThemeToDOM(nextIsDark);
      justFlippedRef.current = true;
      setIsDarkMode(nextIsDark);

      try {
        localStorage.setItem('celesteos-theme', nextTheme);
      } catch {}
    }
  };

  const setTheme = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleTheme, 
      setTheme, 
      setIsDarkMode,
      theme: isDarkMode ? 'dark' : 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};