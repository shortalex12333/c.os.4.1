// Premium Glass Card Component
// Advanced glassmorphism card with performance optimizations and accessibility

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePremiumContext } from './PremiumProvider';
import { useFallbackMode } from '../../hooks/useFallbackMode';
import { usePerformanceBudget } from '../../hooks/usePerformanceBudget';
import { useAccessibility } from '../../hooks/useAccessibility';
import { trackEvent } from '../../services/monitoringService';
import type { PremiumCardProps } from './types';

interface PremiumGlassCardProps extends PremiumCardProps {
  // Glass effect properties
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  saturation?: number;
  
  // Interactive effects
  hover3D?: boolean;
  tiltEffect?: boolean;
  glowEffect?: boolean;
  
  // Animation properties
  animateOnHover?: boolean;
  animateOnFocus?: boolean;
  
  // Background options
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'circuit';
  backgroundGradient?: string;
}

const blurValues = {
  none: 'backdrop-blur-none',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

const glassOpacities = {
  light: {
    primary: 'bg-white/10 border-white/20',
    secondary: 'bg-gray-100/15 border-white/15',
    accent: 'bg-blue-100/15 border-blue-200/25',
    neutral: 'bg-gray-50/12 border-gray-200/18',
  },
  dark: {
    primary: 'bg-white/5 border-white/10',
    secondary: 'bg-gray-800/20 border-gray-700/30',
    accent: 'bg-blue-900/20 border-blue-800/30',
    neutral: 'bg-gray-900/15 border-gray-800/25',
  }
};

export const PremiumGlassCard = forwardRef<HTMLDivElement, PremiumGlassCardProps>(({
  children,
  header,
  footer,
  className,
  style,
  variant = 'primary',
  size = 'md',
  blur = 'lg',
  opacity = 0.1,
  saturation = 1.5,
  hover3D = true,
  tiltEffect = false,
  glowEffect = false,
  animateOnHover = true,
  animateOnFocus = true,
  hoverable = true,
  clickable = false,
  onClick,
  padding = 'lg',
  bordered = true,
  backgroundPattern = 'none',
  backgroundGradient,
  glassmorphism = true,
  enableAnimations = true,
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Premium context and hooks
  const { theme, animationsEnabled } = usePremiumContext();
  const { shouldUseGlassEffect } = useFallbackMode();
  const { shouldDisableAnimations } = usePerformanceBudget();
  const { announceToScreenReader, createKeyboardHandler } = useAccessibility();

  // Determine if effects should be enabled
  const effectsEnabled = enableAnimations && 
                        animationsEnabled && 
                        !shouldDisableAnimations &&
                        shouldUseGlassEffect();
  
  const glassEffectEnabled = glassmorphism && shouldUseGlassEffect();

  // Size configurations
  const sizeStyles = {
    xs: 'p-3 text-sm',
    sm: 'p-4 text-sm',
    md: 'p-6 text-base',
    lg: 'p-8 text-lg',
    xl: 'p-12 text-xl',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  // Mouse tracking for 3D effects
  useEffect(() => {
    if (!hover3D || !effectsEnabled || !cardRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cardRef.current!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setMousePosition({
        x: (e.clientX - centerX) / (rect.width / 2),
        y: (e.clientY - centerY) / (rect.height / 2),
      });
    };

    const handleMouseLeave = () => {
      setMousePosition({ x: 0, y: 0 });
      setIsHovered(false);
    };

    const card = cardRef.current;
    if (hoverable) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [hover3D, effectsEnabled, hoverable]);

  // Background pattern generator
  const renderBackgroundPattern = () => {
    if (backgroundPattern === 'none') return null;

    const patterns = {
      dots: (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.current)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>
      ),
      grid: (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(theme(colors.current)_1px,transparent_1px),linear-gradient(90deg,theme(colors.current)_1px,transparent_1px)] bg-[length:20px_20px]" />
        </div>
      ),
      circuit: (
        <div className="absolute inset-0 opacity-25">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0v40M0 20h40" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>
      ),
    };

    return patterns[backgroundPattern];
  };

  // Animation variants
  const cardVariants = effectsEnabled ? {
    rest: {
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      z: 0,
    },
    hover: {
      scale: animateOnHover ? 1.02 : 1,
      rotateX: tiltEffect ? mousePosition.y * -5 : 0,
      rotateY: tiltEffect ? mousePosition.x * 5 : 0,
      z: hover3D ? 50 : 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    focus: {
      scale: animateOnFocus ? 1.01 : 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
  } : {};

  // Glow effect styles
  const glowStyles = glowEffect && effectsEnabled ? {
    boxShadow: isHovered || isFocused ? 
      `0 0 30px ${variant === 'accent' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.3)'}` :
      'none',
  } : {};

  // Glass background styles
  const glassBackground = glassEffectEnabled ? 
    glassOpacities[theme][variant] : 
    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  // Keyboard navigation
  const handleKeyboard = createKeyboardHandler({
    'Enter': () => {
      if (clickable && onClick) {
        onClick({} as React.MouseEvent<HTMLDivElement>);
        trackEvent('glass_card_keyboard_activated', { variant, size });
      }
    },
    'Space': (e) => {
      e.preventDefault();
      if (clickable && onClick) {
        onClick({} as React.MouseEvent<HTMLDivElement>);
        trackEvent('glass_card_keyboard_activated', { variant, size });
      }
    },
  });

  // Event handlers
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverable && ariaLabel) {
      announceToScreenReader(`Entered ${ariaLabel}`, 'polite');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (ariaLabel) {
      announceToScreenReader(`Focused on ${ariaLabel}`, 'polite');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
      trackEvent('glass_card_clicked', { variant, size, clickable });
    }
  };

  const cardClasses = cn(
    // Base styles
    'premium-glass-card relative overflow-hidden rounded-xl transition-all duration-300',
    
    // Glass effect
    glassEffectEnabled && blurValues[blur],
    glassBackground,
    
    // Size and padding
    sizeStyles[size],
    padding !== size && paddingStyles[padding],
    
    // Border
    bordered && 'border',
    
    // Interactive states
    hoverable && 'hover:shadow-lg',
    clickable && 'cursor-pointer',
    
    // Focus styles
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
    
    // Custom className
    className
  );

  const MotionComponent = effectsEnabled ? motion.div : 'div';
  const motionProps = effectsEnabled ? {
    variants: cardVariants,
    initial: 'rest',
    animate: isHovered ? 'hover' : isFocused ? 'focus' : 'rest',
    style: {
      transformStyle: 'preserve-3d' as const,
      ...glowStyles,
      ...style,
    },
  } : { style };

  return (
    <MotionComponent
      ref={ref || cardRef}
      className={cardClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyboard}
      tabIndex={clickable ? 0 : -1}
      role={clickable ? 'button' : 'article'}
      aria-label={ariaLabel}
      data-testid={testId}
      data-premium-glass-card="true"
      data-variant={variant}
      data-size={size}
      data-glass-enabled={glassEffectEnabled}
      data-effects-enabled={effectsEnabled}
      {...motionProps}
      {...props}
    >
      {/* Background gradient */}
      {backgroundGradient && (
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: backgroundGradient,
            mixBlendMode: theme === 'dark' ? 'overlay' : 'multiply',
          }}
        />
      )}
      
      {/* Background pattern */}
      {renderBackgroundPattern()}
      
      {/* Content container */}
      <div className="relative z-10">
        {/* Header */}
        {header && (
          <div className="premium-glass-card-header mb-4 pb-4 border-b border-current/10">
            {header}
          </div>
        )}
        
        {/* Main content */}
        <div className="premium-glass-card-content">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="premium-glass-card-footer mt-4 pt-4 border-t border-current/10">
            {footer}
          </div>
        )}
      </div>
      
      {/* Hover overlay */}
      {hoverable && effectsEnabled && (
        <div className={cn(
          'absolute inset-0 transition-opacity duration-300',
          'bg-gradient-to-br from-white/5 to-transparent',
          isHovered ? 'opacity-100' : 'opacity-0'
        )} />
      )}
    </MotionComponent>
  );
});

PremiumGlassCard.displayName = 'PremiumGlassCard';

export default PremiumGlassCard;