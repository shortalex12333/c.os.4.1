// Premium Button Component
// High-performance button with advanced animations, accessibility, and glassmorphism

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePremiumContext } from './PremiumProvider';
import { useFallbackMode } from '../../hooks/useFallbackMode';
import { usePerformanceBudget } from '../../hooks/usePerformanceBudget';
import { useAccessibility } from '../../hooks/useAccessibility';
import { trackEvent } from '../../services/monitoringService';
import type { PremiumButtonProps } from './types';

const buttonVariants = {
  primary: {
    light: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl',
    dark: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl',
    glass: 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 backdrop-blur-md text-blue-100 shadow-lg hover:shadow-xl',
  },
  secondary: {
    light: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 shadow-md hover:shadow-lg border border-gray-300',
    dark: 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-100 shadow-md hover:shadow-lg border border-gray-600',
    glass: 'bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white shadow-md hover:shadow-lg',
  },
  accent: {
    light: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl',
    dark: 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg hover:shadow-xl',
    glass: 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 backdrop-blur-md text-emerald-100 shadow-lg hover:shadow-xl',
  },
  neutral: {
    light: 'bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg border border-gray-200',
    dark: 'bg-gray-800 hover:bg-gray-700 text-gray-200 shadow-md hover:shadow-lg border border-gray-700',
    glass: 'bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 backdrop-blur-md text-gray-100 shadow-md hover:shadow-lg',
  },
};

const sizeStyles = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
  xl: 'px-8 py-4 text-xl rounded-xl',
};

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  href,
  target,
  fullWidth = false,
  glassmorphism = false,
  enableAnimations = true,
  animationComplexity = 'high',
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);
  
  // Premium context and hooks
  const { theme, animationsEnabled } = usePremiumContext();
  const { shouldUseGlassEffect } = useFallbackMode();
  const { shouldDisableAnimations } = usePerformanceBudget();
  const { announceToScreenReader, createKeyboardHandler } = useAccessibility();

  // Determine styling mode
  const glassMode = glassmorphism && shouldUseGlassEffect();
  const styleMode = glassMode ? 'glass' : theme;
  
  // Determine if effects should be enabled
  const effectsEnabled = enableAnimations && 
                        animationsEnabled && 
                        !shouldDisableAnimations;

  // Ripple effect
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!effectsEnabled || disabled || loading) return;
    
    const button = buttonRef.current;
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = {
      id: rippleId.current++,
      x,
      y,
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <motion.div
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );

  // Animation variants
  const buttonAnimationVariants = effectsEnabled ? {
    rest: { 
      scale: 1,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    tap: { 
      scale: 0.98,
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 30,
      },
    },
  } : {};

  // Keyboard navigation
  const handleKeyboard = createKeyboardHandler({
    'Enter': () => {
      if (!disabled && !loading && onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
        trackEvent('premium_button_keyboard_activated', { variant, size });
      }
    },
    'Space': (e) => {
      e.preventDefault();
      if (!disabled && !loading && onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
        trackEvent('premium_button_keyboard_activated', { variant, size });
      }
    },
  });

  // Event handlers
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    createRipple(e);
    
    if (onClick) {
      onClick(e);
      trackEvent('premium_button_clicked', { 
        variant, 
        size, 
        hasIcon: !!icon,
        iconPosition,
        glassmorphism: glassMode,
      });
    }
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // Announce state changes to screen readers
  useEffect(() => {
    if (loading) {
      announceToScreenReader('Button is loading', 'polite');
    }
  }, [loading, announceToScreenReader]);

  const buttonClasses = cn(
    // Base styles
    'premium-button relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden',
    
    // Size styles
    sizeStyles[size],
    
    // Variant styles
    buttonVariants[variant][styleMode],
    
    // State styles
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'cursor-wait',
    fullWidth && 'w-full',
    
    // Glass effect
    glassMode && 'backdrop-blur-md',
    
    // Custom className
    className
  );

  const iconElement = icon && (
    <span className={cn(
      'inline-flex items-center justify-center',
      children && iconPosition === 'left' && 'mr-2',
      children && iconPosition === 'right' && 'ml-2',
      loading && 'opacity-0'
    )}>
      {icon}
    </span>
  );

  const content = (
    <>
      {/* Loading spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner />
        </span>
      )}
      
      {/* Button content */}
      <span className={cn(
        'inline-flex items-center justify-center',
        loading && 'opacity-0'
      )}>
        {iconPosition === 'left' && iconElement}
        {children}
        {iconPosition === 'right' && iconElement}
      </span>
      
      {/* Ripple effects */}
      {effectsEnabled && ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </>
  );

  // Render as link if href is provided
  if (href) {
    const LinkComponent = effectsEnabled ? motion.a : 'a';
    const linkProps = effectsEnabled ? {
      variants: buttonAnimationVariants,
      initial: 'rest',
      whileHover: !disabled && !loading ? 'hover' : 'rest',
      whileTap: !disabled && !loading ? 'tap' : 'rest',
    } : {};

    return (
      <LinkComponent
        ref={ref as any}
        href={disabled || loading ? undefined : href}
        target={target}
        className={buttonClasses}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyboard}
        role="button"
        aria-label={ariaLabel}
        aria-disabled={disabled || loading}
        data-testid={testId}
        data-premium-button="true"
        data-variant={variant}
        data-size={size}
        data-loading={loading}
        data-glass={glassMode}
        {...linkProps}
        {...props}
      >
        {content}
      </LinkComponent>
    );
  }

  // Render as button
  const ButtonComponent = effectsEnabled ? motion.button : 'button';
  const buttonProps = effectsEnabled ? {
    variants: buttonAnimationVariants,
    initial: 'rest',
    whileHover: !disabled && !loading ? 'hover' : 'rest',
    whileTap: !disabled && !loading ? 'tap' : 'rest',
  } : {};

  return (
    <ButtonComponent
      ref={ref || buttonRef}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyboard}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      data-testid={testId}
      data-premium-button="true"
      data-variant={variant}
      data-size={size}
      data-loading={loading}
      data-glass={glassMode}
      {...buttonProps}
      {...props}
    >
      {content}
    </ButtonComponent>
  );
});

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;