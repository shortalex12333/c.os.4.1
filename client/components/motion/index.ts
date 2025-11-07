/**
 * LOCAL UX Motion System - Export Module
 * Transform/opacity only animations with exact timing specifications
 * Fully compliant with blueprint motion requirements
 */

// Core animation hooks
export { useLenis, type LenisInstance, type LenisOptions } from './useLenis';
export { useReveal, revealPresets, type RevealOptions, type RevealState } from './useReveal';

// GSAP compatibility layer (SSR:false)
export { getGSAP, motionConfig, type GSAP, type GSAPTimeline } from './gsapClient';

// Section animation components
export {
  AnimatedSection,
  HeroSection,
  ProblemReliefSection,
  DemoSection,
  ContentSection,
  CTASection,
  type AnimatedSectionProps
} from './AnimatedSection';

// Motion configuration and utilities
import { localHouseConfig } from '../../config/localhouse';

/**
 * Motion utilities for LOCAL UX
 */
export const motionUtils = {
  // Timing specifications from authority reference
  timing: {
    micro: localHouseConfig.motion.micro,     // 120-180ms
    ui: localHouseConfig.motion.ui,           // 240-320ms  
    section: localHouseConfig.motion.section, // 380-520ms
    page: localHouseConfig.motion.page,       // 500-700ms
    stagger: localHouseConfig.motion.stagger  // 60-90ms
  },
  
  // Easing curve from blueprint
  easing: localHouseConfig.motion.easing, // cubic-bezier(0.22,0.61,0.36,1)
  
  // Property restrictions
  allowedProperties: localHouseConfig.motion.allowedProperties, // ['transform', 'opacity']
  
  // Animation disable conditions
  isDisabled: localHouseConfig.features.reducedMotion,
  
  // Convert ms to seconds for CSS/GSAP
  toSeconds: (ms: number) => ms / 1000,
  
  // Generate CSS animation string
  cssAnimation: (duration: number, ease: string = localHouseConfig.motion.easing, delay: number = 0) => 
    `${duration}ms ${ease} ${delay}ms both`,
    
  // Check if element should animate
  shouldAnimate: (element?: HTMLElement) => {
    if (localHouseConfig.features.reducedMotion) return false;
    if (!element) return true;
    
    // Check for data-no-animate attribute
    if (element.dataset.noAnimate === 'true') return false;
    
    // Check for reduced motion class
    if (element.closest('.reduced-motion')) return false;
    
    return true;
  },
  
  // Create staggered delays
  staggerDelay: (index: number, staggerMs: number = localHouseConfig.motion.stagger) => 
    index * staggerMs,
    
  // Validate animation properties (development mode)
  validateProperties: (properties: string[]) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const invalid = properties.filter(prop => 
      !localHouseConfig.motion.allowedProperties.includes(prop as any)
    );
    
    if (invalid.length > 0) {
      console.warn('LOCAL UX Motion: Invalid properties detected:', invalid, 
        'Only transform and opacity are allowed for motion compliance.');
    }
  }
};

/**
 * Motion presets for common LOCAL UX patterns
 */
export const motionPresets = {
  // Hero section masked headline reveal
  heroReveal: {
    initial: { opacity: 0, y: 60, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    duration: motionUtils.timing.section,
    ease: motionUtils.easing
  },
  
  // Problem→Relief section desat→color shift
  problemRelief: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    duration: motionUtils.timing.section,
    ease: motionUtils.easing
  },
  
  // Demo section tabs
  demoTabs: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    duration: motionUtils.timing.ui,
    ease: motionUtils.easing,
    stagger: motionUtils.timing.stagger
  },
  
  // Security section offline-first diagram
  securityDiagram: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    duration: motionUtils.timing.section,
    ease: motionUtils.easing
  },
  
  // CTA section gradient loop background
  ctaGradient: {
    duration: 30000, // 30s ultra-slow loop
    ease: 'linear',
    infinite: true
  },
  
  // Card stagger pattern
  cardStagger: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    duration: motionUtils.timing.ui,
    ease: motionUtils.easing,
    stagger: motionUtils.timing.stagger
  },
  
  // Parallax effect (transform only)
  parallax: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    duration: motionUtils.timing.section,
    ease: motionUtils.easing,
    threshold: 0.1
  }
};

// Export configuration for external use
export { localHouseConfig as motionConfig } from '../../config/localhouse';