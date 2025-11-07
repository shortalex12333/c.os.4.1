/**
 * AnimatedSection Component - LOCAL UX Section Animation System
 * Adds data-animate attributes and handles section-level animations
 * Transform/opacity only with exact timing specifications
 */

import React, { forwardRef, HTMLAttributes } from 'react';
import { useReveal, revealPresets, type RevealOptions } from './useReveal';
import { localHouseConfig, debugLog } from '../../config/localhouse';
import { cn } from '../../lib/utils';

interface AnimatedSectionProps extends HTMLAttributes<HTMLElement> {
  // Animation type - matches data-animate attribute values from authority reference
  animate?: 'reveal' | 'stagger' | 'parallax' | 'fadeUp' | 'scaleIn' | 'slideInLeft' | 'slideInRight' | 'none';
  
  // Section semantic type
  as?: 'section' | 'div' | 'article' | 'header' | 'main' | 'footer';
  
  // Animation configuration
  animationOptions?: Partial<RevealOptions>;
  
  // Stagger configuration for child elements
  staggerChildren?: boolean;
  staggerDelay?: number;
  
  // Debug mode
  debug?: boolean;
  
  // Blueprint reference for comment tracking
  blueprintRef?: string;
}

/**
 * Get animation configuration based on animate prop
 */
const getAnimationConfig = (animateType: string, options: Partial<RevealOptions> = {}): RevealOptions => {
  switch (animateType) {
    case 'reveal':
      return revealPresets.fadeUp(options);
      
    case 'stagger':
      return revealPresets.cardStagger(options);
      
    case 'fadeUp':
      return revealPresets.fadeUp(options);
      
    case 'scaleIn':
      return revealPresets.scaleIn(options);
      
    case 'slideInLeft':
      return revealPresets.slideInLeft(options);
      
    case 'slideInRight':
      return revealPresets.slideInRight(options);
      
    case 'parallax':
      // Simplified parallax with transform-only
      return {
        from: { opacity: 0, y: 20 },
        to: { opacity: 1, y: 0 },
        duration: localHouseConfig.motion.section / 1000,
        ease: localHouseConfig.motion.easing,
        threshold: 0.1,
        ...options
      };
      
    default:
      return revealPresets.fadeUp(options);
  }
};

/**
 * AnimatedSection Component
 * Handles section-level animations with data-animate attributes
 */
export const AnimatedSection = forwardRef<HTMLElement, AnimatedSectionProps>(
  ({
    animate = 'reveal',
    as: Component = 'section',
    animationOptions = {},
    staggerChildren = false,
    staggerDelay = localHouseConfig.motion.stagger,
    debug = false,
    blueprintRef,
    className,
    children,
    ...props
  }, forwardedRef) => {
    
    // Skip animation if disabled
    const shouldAnimate = animate !== 'none' && !localHouseConfig.features.reducedMotion;
    
    // Configure animation options
    const finalAnimationOptions = shouldAnimate ? {
      ...getAnimationConfig(animate, animationOptions),
      stagger: staggerChildren ? staggerDelay / 1000 : 0,
      markers: debug || (process.env.NODE_ENV === 'development' && debug)
    } : {};

    // Use reveal hook if animation enabled
    const { ref: animationRef, isRevealed, isInView, progress } = shouldAnimate 
      ? useReveal<HTMLElement>(finalAnimationOptions)
      : { ref: { current: null }, isRevealed: true, isInView: true, progress: 1 };

    // Merge refs
    const elementRef = (element: HTMLElement | null) => {
      if (animationRef) {
        (animationRef as React.MutableRefObject<HTMLElement | null>).current = element;
      }
      
      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    };

    // Debug logging
    if (debug && shouldAnimate) {
      debugLog(`AnimatedSection [${animate}]`, {
        blueprintRef,
        isRevealed,
        isInView,
        progress,
        options: finalAnimationOptions
      });
    }

    // Generate class names
    const sectionClasses = cn(
      'animated-section',
      `animate-${animate}`,
      {
        'is-revealed': isRevealed,
        'is-in-view': isInView,
        'reduced-motion': localHouseConfig.features.reducedMotion,
        'debug-mode': debug
      },
      className
    );

    return (
      <Component
        ref={elementRef}
        className={sectionClasses}
        data-animate={animate}
        data-blueprint-ref={blueprintRef}
        data-animation-progress={progress}
        data-stagger={staggerChildren}
        {...props}
      >
        {children}
        
        {/* Debug information overlay */}
        {debug && process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 p-2 bg-black/80 text-white text-xs font-mono z-50 pointer-events-none">
            <div>animate: {animate}</div>
            <div>revealed: {isRevealed ? 'true' : 'false'}</div>
            <div>in-view: {isInView ? 'true' : 'false'}</div>
            <div>progress: {Math.round(progress * 100)}%</div>
            {blueprintRef && <div>blueprint: {blueprintRef}</div>}
          </div>
        )}
      </Component>
    );
  }
);

AnimatedSection.displayName = 'AnimatedSection';

/**
 * Specialized section components for LOCAL UX
 */

// Hero section with masked headline reveal
export const HeroSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="reveal"
      animationOptions={revealPresets.heroReveal()}
      blueprintRef="hero-section-masked-headline"
    />
  )
);

// Problem→Relief section with desat→color shift capability
export const ProblemReliefSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="fadeUp"
      animationOptions={{
        from: { opacity: 0, y: 40 },
        to: { opacity: 1, y: 0 },
        duration: localHouseConfig.motion.section / 1000,
        threshold: 0.3
      }}
      blueprintRef="problem-relief-desat-color-shift"
    />
  )
);

// Demo section with tab animations
export const DemoSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="stagger"
      staggerChildren={true}
      staggerDelay={localHouseConfig.motion.stagger}
      blueprintRef="demo-section-tabs"
    />
  )
);

// Generic content section with staggered reveals
export const ContentSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="stagger"
      staggerChildren={true}
      blueprintRef="content-section-stagger"
    />
  )
);

// How It Works section with process flow animations
export const HowItWorksSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="fadeUp"
      animationOptions={{
        from: { opacity: 0, y: 30 },
        to: { opacity: 1, y: 0 },
        duration: localHouseConfig.motion.section / 1000,
        threshold: 0.2
      }}
      blueprintRef="how-it-works-process-flow"
    />
  )
);

// Proof section with evidence presentation and reveals
export const ProofSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="stagger"
      staggerChildren={true}
      staggerDelay={localHouseConfig.motion.stagger}
      animationOptions={{
        from: { opacity: 0, y: 40 },
        to: { opacity: 1, y: 0 },
        duration: localHouseConfig.motion.section / 1000,
        threshold: 0.2
      }}
      blueprintRef="proof-section-evidence-presentation"
    />
  )
);

// Pricing section with tier comparison animations
export const PricingSection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="stagger"
      staggerChildren={true}
      staggerDelay={localHouseConfig.motion.stagger}
      animationOptions={{
        from: { opacity: 0, y: 50, scale: 0.95 },
        to: { opacity: 1, y: 0, scale: 1 },
        duration: localHouseConfig.motion.section / 1000,
        threshold: 0.3
      }}
      blueprintRef="pricing-section-tier-comparison"
    />
  )
);

// Security section with offline-first diagram
export const SecuritySection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="fadeUp"
      animationOptions={{
        from: { opacity: 0, y: 30 },
        to: { opacity: 1, y: 0 },
        duration: localHouseConfig.motion.section / 1000,
        threshold: 0.2
      }}
      blueprintRef="security-section-offline-first-diagram"
    />
  )
);

// CTA section with ultra-slow gradient loop capability
export const CTASection = forwardRef<HTMLElement, Omit<AnimatedSectionProps, 'animate'>>(
  (props, ref) => (
    <AnimatedSection
      {...props}
      ref={ref}
      animate="scaleIn"
      animationOptions={{
        from: { opacity: 0, scale: 0.95, y: 30 },
        to: { opacity: 1, scale: 1, y: 0 },
        duration: localHouseConfig.motion.page / 1000,
        threshold: 0.4
      }}
      blueprintRef="cta-section-gradient-loop"
      className="relative overflow-hidden"
    />
  )
);

// Export types
export type { AnimatedSectionProps };