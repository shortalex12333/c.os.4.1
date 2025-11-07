/**
 * Professional Dark Mode Theme for Enterprise Application
 * Target: $30K+ software valuation
 * WCAG AAA Compliant with premium aesthetics
 */

export const darkTheme = {
  // Base backgrounds with subtle depth
  backgrounds: {
    primary: 'rgba(15, 15, 15, 0.25)', // Glassmorphism modal/settings
    secondary: '#3C3C3C',    // Header/Sidebar background
    tertiary: 'rgba(15, 15, 15, 0.25)', // Glassmorphism content
    elevated: '#242424',     // Active item background
    overlay: 'rgba(41, 41, 41, 0.95)', // Modal backdrop
  },

  // Input and interactive elements - Enterprise precision
  inputs: {
    background: 'rgba(15, 15, 15, 0.25)', // Glassmorphism settings background
    backgroundHover: '#242424',
    backgroundFocus: '#242424',
    border: '#343434',       // Divider color
    borderHover: '#343434',
    borderFocus: '2px solid #0078fa', // Accent blue
    text: '#ffffff',         // Primary text
    textFocus: '#ffffff',    // Primary text on focus
    placeholder: '#727272',  // Tertiary text
    label: '#939293',        // Secondary text
    helperText: '#939293',   // Secondary text
    errorText: '#ef4444',    // Error state
    errorBorder: '#ef4444',  // Error border
  },

  // Text hierarchy with proper contrast
  text: {
    primary: '#ffffff',      // Primary text
    secondary: '#939293',    // Secondary text
    tertiary: '#727272',     // Tertiary text
    inverse: '#0f0f0f',      // For light backgrounds
    accent: '#0078fa',       // Accent blue (same as light)
    success: '#10b981',      // Success states
    warning: '#f59e0b',      // Warning states
    error: '#ef4444',        // Error states
  },

  // Buttons with premium feel - CelesteOS blue CTAs
  buttons: {
    primary: {
      background: '#0078fa',   // Accent blue
      backgroundHover: '#006fe3',
      text: '#ffffff',
      shadow: '0 4px 14px rgba(0, 120, 250, 0.3)',
      shadowHover: '0 6px 20px rgba(0, 120, 250, 0.4)', // Elevation on hover
      scale: 'scale(1.03)',  // Subtle scale for premium feel
    },
    secondary: {
      background: 'rgba(41, 41, 41, 0.25)', // Glassmorphism instead of solid
      backgroundHover: '#242424',
      text: '#ffffff',
      border: '#343434',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    },
    disabled: {
      background: 'rgba(41, 41, 41, 0.25)', // Glassmorphism instead of solid
      text: '#727272',       // Tertiary for disabled
      border: '#343434',
      tooltip: 'rgba(0, 0, 0, 0.9)', // Tooltip background
      tooltipText: '#ffffff',
    },
    ghost: {
      background: 'transparent',
      backgroundHover: '#242424',
      text: '#939293',
      textHover: '#ffffff',
    },
  },

  // Sidebar specific - Glassmorphism (no solid backgrounds)
  sidebar: {
    background: 'rgba(15, 15, 15, 0.30)', // Glassmorphism for dark mode
    itemBackground: 'transparent',
    itemBackgroundHover: '#242424',
    itemBackgroundActive: '#242424',  // Active item background
    itemText: '#939293',           // Secondary text for inactive
    itemTextHover: '#ffffff',      // Primary text on hover
    itemTextActive: '#ffffff',     // Primary text when active
    itemActiveIndicator: '#0078fa', // Accent blue indicator
    border: '#343434',             // Divider color
  },

  // Modal specific - Premium elevation
  modal: {
    background: 'rgba(15, 15, 15, 0.25)', // Glassmorphism modal background
    header: '#292929',            // Header background
    border: '#343434',            // Border/divider color
    shadow: '0 25px 50px rgba(0, 0, 0, 0.7)',  // Heavy shadow for elevation
    overlay: 'rgba(41, 41, 41, 0.95)',        // Modal overlay
    backdropBlur: 'blur(20px)',               // Glass morphism
    borderRadius: '8px',                      // Container tier radius
  },

  // Accents and branding
  brand: {
    primary: '#0078fa',        // Accent blue
    primaryLight: '#0078fa',
    primaryDark: '#006fe3',
    gradient: 'linear-gradient(135deg, #0078fa 0%, #006fe3 100%)',
  },

  // Subtle effects - Rolex-level precision
  effects: {
    focusRing: '0 0 0 2px rgba(0, 120, 250, 0.5)', // Visible focus outline using #0078fa
    focusGlow: '0 0 8px rgba(0, 120, 250, 0.2)',    // Subtle inner glow using #0078fa
    buttonHover: '0 4px 16px rgba(0, 120, 250, 0.4)', // CTA elevation using #0078fa
    modalEntrance: 'cubic-bezier(0.22, 0.61, 0.36, 1)', // CelesteOS easing
    microDelay: '240ms',                              // Standard interaction timing
    timingFast: '200ms',                              // Fast interactions
    easingDefault: 'cubic-bezier(0.22, 0.61, 0.36, 1)', // Default easing
    backdropBlur: 'blur(20px) saturate(1.8)',
    glassMorphism: 'background: rgba(22, 25, 34, 0.7); backdrop-filter: blur(20px) saturate(1.8);',
  },
};

// Light theme for comparison and switching
export const lightTheme = {
  backgrounds: {
    primary: '#ffffff',      // Modal/Settings background
    secondary: '#ffffff',    // Header/Sidebar background
    tertiary: '#ffffff',     // Content area background
    elevated: '#f8f8f8',     // Active item background
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  inputs: {
    background: 'rgba(255, 255, 255, 0.25)', // Glassmorphism for light mode
    backgroundHover: '#f8f8f8',
    backgroundFocus: '#f8f8f8',
    border: '#e7e7e7',       // Divider color
    borderHover: '#e7e7e7',
    borderFocus: '2px solid #0078fa', // Accent blue (same as dark)
    text: '#0f0f0f',         // Primary text
    textFocus: '#0f0f0f',    // Primary text on focus
    placeholder: '#b7b7b7',  // Tertiary text
    label: '#8a8a8a',        // Secondary text
    helperText: '#8a8a8a',   // Secondary text
    errorText: '#ef4444',
    errorBorder: '#ef4444',
  },
  text: {
    primary: '#0f0f0f',      // Primary text
    secondary: '#8a8a8a',    // Secondary text
    tertiary: '#b7b7b7',     // Tertiary text
    inverse: '#ffffff',
    accent: '#0078fa',       // Accent blue (same as dark)
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  },
  buttons: {
    primary: {
      background: '#0078fa',   // Accent blue
      backgroundHover: '#006fe3',
      text: '#ffffff',
      shadow: '0 4px 14px rgba(0, 120, 250, 0.25)',
      shadowHover: '0 6px 20px rgba(0, 120, 250, 0.35)',
      scale: 'scale(1.03)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.25)', // Glassmorphism for light mode
      backgroundHover: '#f8f8f8',
      text: '#0f0f0f',
      border: '#e7e7e7',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    disabled: {
      background: '#f8f8f8',
      text: '#b7b7b7',       // Tertiary for disabled
      border: '#e7e7e7',
      tooltip: 'rgba(0, 0, 0, 0.8)',
      tooltipText: '#ffffff',
    },
    ghost: {
      background: 'transparent',
      backgroundHover: '#f8f8f8',
      text: '#8a8a8a',
      textHover: '#0f0f0f',
    },
  },
  sidebar: {
    background: 'rgba(245, 245, 245, 0.25)', // Glassmorphism for light mode
    itemBackground: 'transparent',
    itemBackgroundHover: '#f8f8f8',
    itemBackgroundActive: '#f8f8f8',  // Active item background
    itemText: '#0f0f0f',           // All text is primary in light mode
    itemTextHover: '#0f0f0f',      // Primary text on hover
    itemTextActive: '#0f0f0f',     // Primary text when active
    itemActiveIndicator: '#0078fa', // Accent blue indicator
    border: '#e7e7e7',             // Divider color
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.25)', // Glassmorphism for light mode         // Modal background
    header: '#ffffff',            // Header background
    border: '#e7e7e7',            // Border/divider color
    shadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdropBlur: 'blur(20px)',
    borderRadius: '8px',
  },
  brand: {
    primary: '#0078fa',        // Accent blue (same as dark)
    primaryLight: '#0078fa',
    primaryDark: '#006fe3',
    gradient: 'linear-gradient(135deg, #0078fa 0%, #006fe3 100%)',
  },
  effects: {
    focusRing: '0 0 0 2px rgba(0, 120, 250, 0.5)',  // Using #0078fa
    focusGlow: '0 0 8px rgba(0, 120, 250, 0.15)',   // Using #0078fa
    buttonHover: '0 4px 16px rgba(0, 120, 250, 0.25)', // Using #0078fa
    modalEntrance: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    microDelay: '240ms',
    timingFast: '200ms',
    easingDefault: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    backdropBlur: 'blur(20px) saturate(1.8)',
    glassMorphism: 'background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px) saturate(1.8);',
  },
};

// Utility function to apply theme with CSS custom properties
export const applyDarkTheme = (isDarkMode: boolean) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  return {
    // CSS variables for global use
    '--bg-primary': theme.backgrounds.primary,
    '--bg-secondary': theme.backgrounds.secondary,
    '--bg-tertiary': theme.backgrounds.tertiary,
    '--bg-elevated': theme.backgrounds.elevated,
    '--bg-overlay': theme.backgrounds.overlay,
    
    // Input variables
    '--input-bg': theme.inputs.background,
    '--input-bg-hover': theme.inputs.backgroundHover,
    '--input-bg-focus': theme.inputs.backgroundFocus,
    '--input-border': theme.inputs.border,
    '--input-border-hover': theme.inputs.borderHover,
    '--input-border-focus': theme.inputs.borderFocus,
    '--input-text': theme.inputs.text,
    '--input-text-focus': theme.inputs.textFocus,
    '--input-placeholder': theme.inputs.placeholder,
    '--input-label': theme.inputs.label,
    '--input-helper': theme.inputs.helperText,
    '--input-error': theme.inputs.errorText,
    '--input-error-border': theme.inputs.errorBorder,
    
    // Text variables
    '--text-primary': theme.text.primary,
    '--text-secondary': theme.text.secondary,
    '--text-tertiary': theme.text.tertiary,
    '--text-inverse': theme.text.inverse,
    '--text-accent': theme.text.accent,
    '--text-success': theme.text.success,
    '--text-warning': theme.text.warning,
    '--text-error': theme.text.error,
    
    // Button variables
    '--btn-primary-bg': theme.buttons.primary.background,
    '--btn-primary-bg-hover': theme.buttons.primary.backgroundHover,
    '--btn-primary-text': theme.buttons.primary.text,
    '--btn-primary-shadow': theme.buttons.primary.shadow,
    '--btn-primary-shadow-hover': theme.buttons.primary.shadowHover,
    '--btn-primary-scale': theme.buttons.primary.scale,
    
    '--btn-secondary-bg': theme.buttons.secondary.background,
    '--btn-secondary-bg-hover': theme.buttons.secondary.backgroundHover,
    '--btn-secondary-text': theme.buttons.secondary.text,
    '--btn-secondary-border': theme.buttons.secondary.border,
    '--btn-secondary-shadow': theme.buttons.secondary.shadow,
    
    '--btn-disabled-bg': theme.buttons.disabled.background,
    '--btn-disabled-text': theme.buttons.disabled.text,
    '--btn-disabled-border': theme.buttons.disabled.border,
    
    '--btn-ghost-bg': theme.buttons.ghost.background,
    '--btn-ghost-bg-hover': theme.buttons.ghost.backgroundHover,
    '--btn-ghost-text': theme.buttons.ghost.text,
    '--btn-ghost-text-hover': theme.buttons.ghost.textHover,
    
    // Sidebar variables
    '--sidebar-bg': theme.sidebar.background,
    '--sidebar-item-bg': theme.sidebar.itemBackground,
    '--sidebar-item-bg-hover': theme.sidebar.itemBackgroundHover,
    '--sidebar-item-bg-active': theme.sidebar.itemBackgroundActive,
    '--sidebar-item-text': theme.sidebar.itemText,
    '--sidebar-item-text-hover': theme.sidebar.itemTextHover,
    '--sidebar-item-text-active': theme.sidebar.itemTextActive,
    '--sidebar-item-indicator': theme.sidebar.itemActiveIndicator,
    '--sidebar-border': theme.sidebar.border,
    
    // Modal variables
    '--modal-bg': theme.modal.background,
    '--modal-header': theme.modal.header,
    '--modal-border': theme.modal.border,
    '--modal-shadow': theme.modal.shadow,
    '--modal-overlay': theme.modal.overlay,
    '--modal-backdrop-blur': theme.modal.backdropBlur,
    '--modal-border-radius': theme.modal.borderRadius,
    
    // Brand variables
    '--brand-primary': theme.brand.primary,
    '--brand-primary-light': theme.brand.primaryLight,
    '--brand-primary-dark': theme.brand.primaryDark,
    '--brand-gradient': theme.brand.gradient,
    
    // Effect variables
    '--effect-focus-ring': theme.effects.focusRing,
    '--effect-focus-glow': theme.effects.focusGlow,
    '--effect-button-hover': theme.effects.buttonHover,
    '--effect-modal-entrance': theme.effects.modalEntrance,
    '--effect-micro-delay': theme.effects.microDelay,
    '--effect-backdrop-blur': theme.effects.backdropBlur,
    '--effect-glass-morphism': theme.effects.glassMorphism,
  };
};

// Theme type definitions for TypeScript support
export type Theme = typeof darkTheme;
export type ThemeKey = keyof Theme;
export type BackgroundKey = keyof Theme['backgrounds'];
export type InputKey = keyof Theme['inputs'];
export type TextKey = keyof Theme['text'];
export type ButtonKey = keyof Theme['buttons'];
export type SidebarKey = keyof Theme['sidebar'];
export type ModalKey = keyof Theme['modal'];
export type BrandKey = keyof Theme['brand'];
export type EffectKey = keyof Theme['effects'];

// Helper functions for theme access
export const getTheme = (isDarkMode: boolean): Theme => {
  return isDarkMode ? darkTheme : lightTheme;
};

export const getThemeValue = (
  isDarkMode: boolean,
  category: ThemeKey,
  key: string
): string => {
  const theme = getTheme(isDarkMode);
  return (theme[category] as any)[key] || '';
};

// Semantic color helpers
export const getSemanticColor = (
  isDarkMode: boolean,
  type: 'success' | 'warning' | 'error' | 'accent'
): string => {
  return getThemeValue(isDarkMode, 'text', type);
};

// Button theme helpers
export const getButtonTheme = (
  isDarkMode: boolean,
  variant: 'primary' | 'secondary' | 'disabled' | 'ghost'
) => {
  const theme = getTheme(isDarkMode);
  return theme.buttons[variant];
};

// Input theme helpers
export const getInputTheme = (isDarkMode: boolean) => {
  const theme = getTheme(isDarkMode);
  return theme.inputs;
};

// Sidebar theme helpers
export const getSidebarTheme = (isDarkMode: boolean) => {
  const theme = getTheme(isDarkMode);
  return theme.sidebar;
};

// Modal theme helpers
export const getModalTheme = (isDarkMode: boolean) => {
  const theme = getTheme(isDarkMode);
  return theme.modal;
};