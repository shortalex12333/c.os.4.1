/**
 * useReveal Hook - LOCAL UX Reveal Animation System
 * Implements reveal animations with exact timing specifications
 * Transform/opacity only with intersection observer
 */

import { useEffect, useRef, useState } from 'react';
import { localHouseConfig, debugLog } from '../../config/localhouse';
import { getGSAP, motionConfig, type GSAP } from './gsapClient';

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
  duration?: number;
  ease?: string;
  from?: {
    opacity?: number;
    y?: number;
    x?: number;
    scale?: number;
    rotation?: number;
  };
  to?: {
    opacity?: number;
    y?: number;
    x?: number;
    scale?: number;
    rotation?: number;
  };
  stagger?: number;
  markers?: boolean; // Debug markers
}

interface RevealState {
  isRevealed: boolean;
  isInView: boolean;
  progress: number;
}

/**
 * Default reveal configurations based on LOCAL UX spec
 */
const defaultRevealConfigs = {
  fadeUp: {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    duration: motionConfig.ui,
    ease: motionConfig.ease
  },
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: motionConfig.micro,
    ease: motionConfig.ease
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: motionConfig.ui,
    ease: motionConfig.ease
  },
  slideInLeft: {
    from: { opacity: 0, x: -50 },
    to: { opacity: 1, x: 0 },
    duration: motionConfig.section,
    ease: motionConfig.ease
  },
  slideInRight: {
    from: { opacity: 0, x: 50 },
    to: { opacity: 1, x: 0 },
    duration: motionConfig.section,
    ease: motionConfig.ease
  }
};

/**
 * useReveal Hook
 * Provides intersection-based reveal animations
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
  dependencies: any[] = []
) => {
  const ref = useRef<T>(null);
  const gsapRef = useRef<GSAP | null>(null);
  const animationRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const [state, setState] = useState<RevealState>({
    isRevealed: false,
    isInView: false,
    progress: 0
  });

  const {
    threshold = 0.1,
    rootMargin = '0px',
    once = true,
    delay = 0,
    duration = motionConfig.ui,
    ease = motionConfig.ease,
    from = defaultRevealConfigs.fadeUp.from,
    to = defaultRevealConfigs.fadeUp.to,
    stagger = 0,
    markers = false
  } = options;

  useEffect(() => {
    if (!ref.current) return;
    
    // Skip animations if reduced motion is preferred
    if (localHouseConfig.features.reducedMotion) {
      setState({ isRevealed: true, isInView: true, progress: 1 });
      return;
    }

    const element = ref.current;
    let isCleanedUp = false;

    // Initialize GSAP
    const initAnimation = async () => {
      try {
        gsapRef.current = await getGSAP();
        
        if (isCleanedUp) return;

        // Set initial state
        gsapRef.current.set(element, from);

        // Create intersection observer
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const isInView = entry.isIntersecting;
              
              setState(prev => ({ ...prev, isInView }));

              if (isInView && !state.isRevealed) {
                // Trigger reveal animation
                performReveal();
              } else if (!isInView && !once && state.isRevealed) {
                // Reset if not "once" mode
                resetReveal();
              }
            });
          },
          {
            threshold,
            rootMargin
          }
        );

        observerRef.current.observe(element);

        // Add debug markers if enabled
        if (markers && process.env.NODE_ENV === 'development') {
          addDebugMarkers(element);
        }

      } catch (error) {
        debugLog('Failed to initialize reveal animation', error);
      }
    };

    const performReveal = () => {
      if (!gsapRef.current || !element) return;

      // Handle staggered children animations
      const targets = stagger > 0 ? element.children : element;
      
      animationRef.current = gsapRef.current.to(targets, {
        ...to,
        duration,
        delay,
        ease,
        stagger,
        onStart: () => {
          setState(prev => ({ ...prev, isRevealed: true, progress: 0 }));
        },
        onUpdate: function(this: any) {
          const progress = this.progress ? this.progress() : 0;
          setState(prev => ({ ...prev, progress }));
        },
        onComplete: () => {
          setState(prev => ({ ...prev, progress: 1 }));
          
          if (once && observerRef.current) {
            observerRef.current.unobserve(element);
          }
        }
      });
    };

    const resetReveal = () => {
      if (!gsapRef.current || !element) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      gsapRef.current.set(element, from);
      setState({ isRevealed: false, isInView: false, progress: 0 });
    };

    initAnimation();

    // Cleanup
    return () => {
      isCleanedUp = true;
      
      if (animationRef.current) {
        animationRef.current.kill();
      }
      
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [...dependencies, once, threshold, rootMargin]);

  return {
    ref,
    ...state
  };
};

/**
 * Reveal presets for common animations
 */
export const revealPresets = {
  fadeUp: (options?: Partial<RevealOptions>) => ({
    ...defaultRevealConfigs.fadeUp,
    ...options
  }),
  
  fadeIn: (options?: Partial<RevealOptions>) => ({
    ...defaultRevealConfigs.fadeIn,
    ...options
  }),
  
  scaleIn: (options?: Partial<RevealOptions>) => ({
    ...defaultRevealConfigs.scaleIn,
    ...options
  }),
  
  slideInLeft: (options?: Partial<RevealOptions>) => ({
    ...defaultRevealConfigs.slideInLeft,
    ...options
  }),
  
  slideInRight: (options?: Partial<RevealOptions>) => ({
    ...defaultRevealConfigs.slideInRight,
    ...options
  }),
  
  // Special presets for LOCAL UX sections
  heroReveal: (options?: Partial<RevealOptions>) => ({
    from: { opacity: 0, y: 60, scale: 0.98 },
    to: { opacity: 1, y: 0, scale: 1 },
    duration: motionConfig.section,
    ease: motionConfig.ease,
    threshold: 0.3,
    ...options
  }),
  
  maskedHeadline: (options?: Partial<RevealOptions>) => ({
    from: { opacity: 0, y: 100 },
    to: { opacity: 1, y: 0 },
    duration: motionConfig.page,
    ease: motionConfig.ease,
    threshold: 0.5,
    stagger: motionConfig.stagger,
    ...options
  }),
  
  cardStagger: (options?: Partial<RevealOptions>) => ({
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    duration: motionConfig.ui,
    ease: motionConfig.ease,
    stagger: motionConfig.stagger,
    threshold: 0.2,
    ...options
  })
};

/**
 * Add debug markers for development
 */
const addDebugMarkers = (element: HTMLElement) => {
  const marker = document.createElement('div');
  marker.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: #00ff00;
    z-index: 9999;
    pointer-events: none;
  `;
  
  const label = document.createElement('div');
  label.style.cssText = `
    position: absolute;
    top: 2px;
    left: 0;
    padding: 2px 8px;
    background: #00ff00;
    color: #000;
    font-size: 10px;
    font-family: monospace;
    z-index: 9999;
    pointer-events: none;
  `;
  label.textContent = 'REVEAL TRIGGER';
  
  element.style.position = 'relative';
  element.appendChild(marker);
  element.appendChild(label);
};

// Export types
export type { RevealOptions, RevealState };