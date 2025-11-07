// Premium Animation Components
// High-performance, accessible animation components with fallback support

import React, { forwardRef } from 'react';
import { motion, AnimatePresence, MotionProps, AnimatePresenceProps } from 'framer-motion';
import { usePremiumContext } from './PremiumProvider';
import { useFallbackMode } from '../../hooks/useFallbackMode';
import { usePerformanceBudget } from '../../hooks/usePerformanceBudget';
import type { PremiumAnimationProps, PremiumBaseProps } from './types';

// Enhanced Motion Div with premium features
interface PremiumMotionDivProps extends 
  Omit<MotionProps, 'animate' | 'initial' | 'exit'>,
  PremiumAnimationProps,
  PremiumBaseProps {
  
  // Animation presets
  preset?: 'fade' | 'slide' | 'scale' | 'bounce' | 'spring' | 'custom';
  direction?: 'up' | 'down' | 'left' | 'right';
  
  // Performance optimizations
  disableOnLowFPS?: boolean;
  memoryThreshold?: number;
  
  // Custom animations
  customInitial?: MotionProps['initial'];
  customAnimate?: MotionProps['animate'];
  customExit?: MotionProps['exit'];
  customTransition?: MotionProps['transition'];
}

const animationPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  slide: {
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    left: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    right: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    transition: { 
      type: 'spring', 
      stiffness: 600, 
      damping: 15,
      bounce: 0.4
    }
  },
  spring: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
    transition: { 
      type: 'spring', 
      stiffness: 200, 
      damping: 20,
      mass: 1
    }
  }
};

export const PremiumMotionDiv = forwardRef<HTMLDivElement, PremiumMotionDivProps>(({
  preset = 'fade',
  direction = 'up',
  enableAnimations = true,
  reducedMotion = false,
  animationComplexity = 'high',
  disableOnLowFPS = true,
  memoryThreshold = 100,
  customInitial,
  customAnimate,
  customExit,
  customTransition,
  customAnimations,
  fallbackStyles,
  children,
  className,
  style,
  ...motionProps
}, ref) => {
  const { animationsEnabled, reducedMotion: globalReducedMotion } = usePremiumContext();
  const { shouldAnimateComponent } = useFallbackMode();
  const { shouldDisableAnimations, currentFPS, memoryUsage } = usePerformanceBudget();

  // Determine if animations should be enabled
  const shouldAnimate = enableAnimations &&
                       animationsEnabled &&
                       !globalReducedMotion &&
                       !reducedMotion &&
                       shouldAnimateComponent('PremiumMotionDiv') &&
                       !shouldDisableAnimations &&
                       (!disableOnLowFPS || currentFPS > 30) &&
                       (memoryUsage < memoryThreshold);

  // Get animation configuration
  const getAnimationConfig = () => {
    if (preset === 'custom') {
      return {
        initial: customInitial,
        animate: customAnimate,
        exit: customExit,
        transition: customTransition,
      };
    }

    if (preset === 'slide') {
      return animationPresets.slide[direction];
    }

    return animationPresets[preset];
  };

  const animationConfig = getAnimationConfig();

  // Apply animation complexity adjustments
  const adjustedConfig = {
    ...animationConfig,
    transition: {
      ...animationConfig.transition,
      duration: animationComplexity === 'low' ? 
        (animationConfig.transition?.duration || 0.3) * 0.5 :
        animationComplexity === 'medium' ?
        (animationConfig.transition?.duration || 0.3) * 0.75 :
        animationConfig.transition?.duration,
      stiffness: animationComplexity === 'low' ? 
        (animationConfig.transition?.stiffness || 300) * 0.5 :
        animationComplexity === 'medium' ?
        (animationConfig.transition?.stiffness || 300) * 0.75 :
        animationConfig.transition?.stiffness,
    }
  };

  // Merge with custom animations
  const finalConfig = customAnimations ? {
    ...adjustedConfig,
    ...customAnimations,
  } : adjustedConfig;

  // Fallback rendering for disabled animations
  if (!shouldAnimate) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          ...fallbackStyles,
        }}
        data-premium-animation="disabled"
        {...(motionProps as any)}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={finalConfig.initial}
      animate={finalConfig.animate}
      exit={finalConfig.exit}
      transition={finalConfig.transition}
      data-premium-animation="enabled"
      data-animation-preset={preset}
      data-animation-complexity={animationComplexity}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
});

PremiumMotionDiv.displayName = 'PremiumMotionDiv';

// Enhanced AnimatePresence with premium features
interface PremiumAnimatePresenceProps extends 
  AnimatePresenceProps,
  Pick<PremiumAnimationProps, 'enableAnimations' | 'reducedMotion' | 'animationComplexity'> {
  
  fallbackMode?: 'none' | 'css' | 'immediate';
  performanceMode?: boolean;
}

export const PremiumAnimatePresence: React.FC<PremiumAnimatePresenceProps> = ({
  enableAnimations = true,
  reducedMotion = false,
  animationComplexity = 'high',
  fallbackMode = 'css',
  performanceMode = false,
  children,
  ...animatePresenceProps
}) => {
  const { animationsEnabled, reducedMotion: globalReducedMotion, performanceMode: globalPerformanceMode } = usePremiumContext();
  const { shouldAnimateComponent } = useFallbackMode();
  const { shouldDisableAnimations } = usePerformanceBudget();

  // Determine if animations should be enabled
  const shouldAnimate = enableAnimations &&
                       animationsEnabled &&
                       !globalReducedMotion &&
                       !reducedMotion &&
                       !performanceMode &&
                       !globalPerformanceMode &&
                       shouldAnimateComponent('PremiumAnimatePresence') &&
                       !shouldDisableAnimations;

  // Fallback rendering for disabled animations
  if (!shouldAnimate) {
    if (fallbackMode === 'immediate') {
      return <>{children}</>;
    }

    if (fallbackMode === 'css') {
      return (
        <div 
          className="premium-animate-presence-fallback"
          data-premium-animation="disabled"
          style={{
            transition: 'opacity 0.15s ease-in-out',
          }}
        >
          {children}
        </div>
      );
    }

    return <>{children}</>;
  }

  return (
    <AnimatePresence
      {...animatePresenceProps}
      data-premium-animation="enabled"
      data-animation-complexity={animationComplexity}
    >
      {children}
    </AnimatePresence>
  );
};

// Utility function to create premium animated components
export const createPremiumAnimatedComponent = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  defaultAnimationProps?: Partial<PremiumMotionDivProps>
) => {
  const PremiumAnimatedComponent = forwardRef<any, P & Partial<PremiumMotionDivProps>>((props, ref) => {
    const { children, ...restProps } = props;
    const animationProps = { ...defaultAnimationProps, ...restProps };

    return (
      <PremiumMotionDiv ref={ref} {...animationProps}>
        <Component {...(restProps as P)}>
          {children}
        </Component>
      </PremiumMotionDiv>
    );
  });

  PremiumAnimatedComponent.displayName = `PremiumAnimated(${Component.displayName || Component.name || 'Component'})`;

  return PremiumAnimatedComponent;
};

// Pre-configured animation components
export const PremiumFadeIn = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="fade" {...props} />
));

export const PremiumSlideUp = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset' | 'direction'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="slide" direction="up" {...props} />
));

export const PremiumSlideDown = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset' | 'direction'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="slide" direction="down" {...props} />
));

export const PremiumSlideLeft = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset' | 'direction'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="slide" direction="left" {...props} />
));

export const PremiumSlideRight = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset' | 'direction'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="slide" direction="right" {...props} />
));

export const PremiumScaleIn = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="scale" {...props} />
));

export const PremiumBounceIn = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="bounce" {...props} />
));

export const PremiumSpringIn = forwardRef<HTMLDivElement, Omit<PremiumMotionDivProps, 'preset'>>((props, ref) => (
  <PremiumMotionDiv ref={ref} preset="spring" {...props} />
));

PremiumFadeIn.displayName = 'PremiumFadeIn';
PremiumSlideUp.displayName = 'PremiumSlideUp';
PremiumSlideDown.displayName = 'PremiumSlideDown';
PremiumSlideLeft.displayName = 'PremiumSlideLeft';
PremiumSlideRight.displayName = 'PremiumSlideRight';
PremiumScaleIn.displayName = 'PremiumScaleIn';
PremiumBounceIn.displayName = 'PremiumBounceIn';
PremiumSpringIn.displayName = 'PremiumSpringIn';