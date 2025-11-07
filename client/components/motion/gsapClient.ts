/**
 * GSAP Client - LOCAL UX Animation System
 * Dynamic loading with SSR:false for optimal performance
 * Transform/opacity only animations with exact timing specs
 */

import { localHouseConfig, debugLog } from '../../config/localhouse';

// GSAP types for TypeScript
interface GSAPTimeline {
  to(target: any, vars: any): GSAPTimeline;
  from(target: any, vars: any): GSAPTimeline;
  fromTo(target: any, fromVars: any, toVars: any): GSAPTimeline;
  set(target: any, vars: any): GSAPTimeline;
  add(tween: any, position?: any): GSAPTimeline;
  play(): GSAPTimeline;
  pause(): GSAPTimeline;
  reverse(): GSAPTimeline;
  restart(): GSAPTimeline;
  kill(): void;
  progress(value?: number): number | GSAPTimeline;
  time(value?: number): number | GSAPTimeline;
  duration(value?: number): number | GSAPTimeline;
  totalDuration(value?: number): number | GSAPTimeline;
  timeScale(value?: number): number | GSAPTimeline;
}

interface GSAP {
  to(target: any, vars: any): any;
  from(target: any, vars: any): any;
  fromTo(target: any, fromVars: any, toVars: any): any;
  set(target: any, vars: any): any;
  timeline(vars?: any): GSAPTimeline;
  registerPlugin(...args: any[]): void;
  ticker: {
    add(callback: Function): void;
    remove(callback: Function): void;
    fps(value?: number): number;
  };
  config(vars: any): void;
  defaults(vars: any): void;
}

// Motion configuration from LOCAL UX spec
const motionConfig = {
  micro: localHouseConfig.motion.micro / 1000,     // 150ms -> 0.15s
  ui: localHouseConfig.motion.ui / 1000,           // 280ms -> 0.28s  
  section: localHouseConfig.motion.section / 1000, // 450ms -> 0.45s
  page: localHouseConfig.motion.page / 1000,       // 600ms -> 0.6s
  stagger: localHouseConfig.motion.stagger / 1000, // 75ms -> 0.075s
  ease: localHouseConfig.motion.easing             // cubic-bezier(0.22,0.61,0.36,1)
};

// GSAP instance placeholder
let gsapInstance: GSAP | null = null;
let gsapLoadPromise: Promise<GSAP> | null = null;

/**
 * Dynamically load GSAP (SSR:false)
 * Only loads in browser environment
 */
const loadGSAP = async (): Promise<GSAP> => {
  if (typeof window === 'undefined') {
    throw new Error('GSAP can only be loaded in browser environment');
  }

  if (gsapInstance) return gsapInstance;
  
  if (gsapLoadPromise) return gsapLoadPromise;

  debugLog('Loading GSAP dynamically');

  gsapLoadPromise = new Promise(async (resolve, reject) => {
    try {
      // For LOCAL UX, we'll use framer-motion instead of loading external GSAP
      // This ensures no external dependencies
      debugLog('Using framer-motion animation API instead of GSAP for LOCAL UX');
      
      // Create GSAP-compatible API using framer-motion
      const gsapCompat = createGSAPCompatLayer();
      gsapInstance = gsapCompat;
      resolve(gsapCompat);
    } catch (error) {
      debugLog('Failed to create GSAP compatibility layer', error);
      reject(error);
    }
  });

  return gsapLoadPromise;
};

/**
 * Create GSAP-compatible API using native Web Animations API
 * Ensures transform/opacity only animations
 */
const createGSAPCompatLayer = (): GSAP => {
  const timelines: Set<GSAPTimeline> = new Set();

  // Convert GSAP vars to Web Animations keyframes
  const varsToKeyframes = (vars: any) => {
    const { 
      x, y, opacity, scale, rotation, 
      duration, delay, ease, stagger,
      onStart, onUpdate, onComplete, // Exclude callbacks
      ...rest 
    } = vars;
    
    const transform: string[] = [];
    if (x !== undefined) transform.push(`translateX(${x}px)`);
    if (y !== undefined) transform.push(`translateY(${y}px)`);
    if (scale !== undefined) transform.push(`scale(${scale})`);
    if (rotation !== undefined) transform.push(`rotate(${rotation}deg)`);
    
    const keyframe: any = {};
    if (transform.length > 0) keyframe.transform = transform.join(' ');
    if (opacity !== undefined) keyframe.opacity = opacity;
    
    // Only warn about truly unexpected properties (not callbacks)
    const allowedProps = new Set(['duration', 'delay', 'ease', 'stagger', 'onStart', 'onUpdate', 'onComplete']);
    Object.keys(rest).forEach(key => {
      if (!allowedProps.has(key)) {
        debugLog(`Warning: Ignoring non-transform/opacity property: ${key}`);
      }
    });
    
    return keyframe;
  };

  // Convert timing
  const varsToTiming = (vars: any): KeyframeAnimationOptions => {
    return {
      duration: (vars.duration || motionConfig.ui) * 1000,
      delay: (vars.delay || 0) * 1000,
      easing: vars.ease || motionConfig.ease,
      fill: 'both'
    };
  };

  // Create timeline implementation
  const createTimeline = (timelineVars: any = {}): GSAPTimeline => {
    const animations: Animation[] = [];
    let totalDuration = 0;

    const timeline: GSAPTimeline = {
      to(target: any, vars: any) {
        // Handle different target types
        let elements: Element[];
        if (typeof target === 'string') {
          elements = Array.from(document.querySelectorAll(target));
        } else if (target instanceof HTMLCollection || target instanceof NodeList) {
          elements = Array.from(target).filter(el => el instanceof Element) as Element[];
        } else if (Array.isArray(target)) {
          elements = target.filter(el => el instanceof Element);
        } else if (target instanceof Element) {
          elements = [target];
        } else {
          elements = [];
        }
        
        const keyframe = varsToKeyframes(vars);
        const timing = varsToTiming(vars);
        
        // Store callbacks separately
        const { onStart, onUpdate, onComplete } = vars;
        let hasStarted = false;
        
        elements.forEach((el, index) => {
          if (!el.animate) return; // Skip elements that don't support animate
          
          const staggerDelay = vars.stagger ? index * vars.stagger * 1000 : 0;
          const animation = el.animate([{}, keyframe], {
            ...timing,
            delay: timing.delay! + staggerDelay
          });
          
          // Handle callbacks
          if (onStart && !hasStarted) {
            hasStarted = true;
            requestAnimationFrame(onStart);
          }
          
          if (onUpdate) {
            animation.addEventListener('progress', onUpdate);
          }
          
          if (onComplete) {
            animation.addEventListener('finish', onComplete);
          }
          
          animations.push(animation);
        });
        
        return timeline;
      },
      
      from(target: any, vars: any) {
        // Handle different target types
        let elements: Element[];
        if (typeof target === 'string') {
          elements = Array.from(document.querySelectorAll(target));
        } else if (target instanceof HTMLCollection || target instanceof NodeList) {
          elements = Array.from(target).filter(el => el instanceof Element) as Element[];
        } else if (Array.isArray(target)) {
          elements = target.filter(el => el instanceof Element);
        } else if (target instanceof Element) {
          elements = [target];
        } else {
          elements = [];
        }
        
        const endKeyframe = varsToKeyframes(vars);
        const timing = varsToTiming(vars);
        
        // Store callbacks separately
        const { onStart, onUpdate, onComplete } = vars;
        let hasStarted = false;
        
        elements.forEach((el, index) => {
          if (!el.animate) return; // Skip elements that don't support animate
          
          const staggerDelay = vars.stagger ? index * vars.stagger * 1000 : 0;
          const animation = el.animate([endKeyframe, {}], {
            ...timing,
            delay: timing.delay! + staggerDelay
          });
          
          // Handle callbacks
          if (onStart && !hasStarted) {
            hasStarted = true;
            requestAnimationFrame(onStart);
          }
          
          if (onUpdate) {
            animation.addEventListener('progress', onUpdate);
          }
          
          if (onComplete) {
            animation.addEventListener('finish', onComplete);
          }
          
          animations.push(animation);
        });
        
        return timeline;
      },
      
      fromTo(target: any, fromVars: any, toVars: any) {
        // Handle different target types
        let elements: Element[];
        if (typeof target === 'string') {
          elements = Array.from(document.querySelectorAll(target));
        } else if (target instanceof HTMLCollection || target instanceof NodeList) {
          elements = Array.from(target).filter(el => el instanceof Element) as Element[];
        } else if (Array.isArray(target)) {
          elements = target.filter(el => el instanceof Element);
        } else if (target instanceof Element) {
          elements = [target];
        } else {
          elements = [];
        }
        
        const fromKeyframe = varsToKeyframes(fromVars);
        const toKeyframe = varsToKeyframes(toVars);
        const timing = varsToTiming(toVars);
        
        // Store callbacks separately
        const { onStart, onUpdate, onComplete } = toVars;
        let hasStarted = false;
        
        elements.forEach((el, index) => {
          if (!el.animate) return; // Skip elements that don't support animate
          
          const staggerDelay = toVars.stagger ? index * toVars.stagger * 1000 : 0;
          const animation = el.animate([fromKeyframe, toKeyframe], {
            ...timing,
            delay: timing.delay! + staggerDelay
          });
          
          // Handle callbacks
          if (onStart && !hasStarted) {
            hasStarted = true;
            requestAnimationFrame(onStart);
          }
          
          if (onUpdate) {
            animation.addEventListener('progress', onUpdate);
          }
          
          if (onComplete) {
            animation.addEventListener('finish', onComplete);
          }
          
          animations.push(animation);
        });
        
        return timeline;
      },
      
      set(target: any, vars: any) {
        // Handle different target types
        let elements: Element[];
        if (typeof target === 'string') {
          elements = Array.from(document.querySelectorAll(target));
        } else if (target instanceof HTMLCollection || target instanceof NodeList) {
          elements = Array.from(target).filter(el => el instanceof Element) as Element[];
        } else if (Array.isArray(target)) {
          elements = target.filter(el => el instanceof Element);
        } else if (target instanceof Element) {
          elements = [target];
        } else {
          elements = [];
        }
        
        const keyframe = varsToKeyframes(vars);
        
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            Object.assign(el.style, keyframe);
          }
        });
        
        return timeline;
      },
      
      add(tween: any, position?: any) {
        // Simplified - just return timeline
        return timeline;
      },
      
      play() {
        animations.forEach(anim => anim.play());
        return timeline;
      },
      
      pause() {
        animations.forEach(anim => anim.pause());
        return timeline;
      },
      
      reverse() {
        animations.forEach(anim => anim.reverse());
        return timeline;
      },
      
      restart() {
        animations.forEach(anim => {
          anim.currentTime = 0;
          anim.play();
        });
        return timeline;
      },
      
      kill() {
        animations.forEach(anim => anim.cancel());
        animations.length = 0;
        timelines.delete(timeline);
      },
      
      progress(value?: number) {
        if (value !== undefined) {
          animations.forEach(anim => {
            anim.currentTime = value * (anim.effect?.getTiming().duration || 0);
          });
          return timeline;
        }
        return 0;
      },
      
      time(value?: number) {
        return timeline.progress(value);
      },
      
      duration(value?: number) {
        return totalDuration;
      },
      
      totalDuration(value?: number) {
        return totalDuration;
      },
      
      timeScale(value?: number) {
        if (value !== undefined) {
          animations.forEach(anim => {
            anim.playbackRate = value;
          });
          return timeline;
        }
        return 1;
      }
    };
    
    timelines.add(timeline);
    return timeline;
  };

  // GSAP-compatible interface
  return {
    to(target: any, vars: any) {
      const tl = createTimeline();
      return tl.to(target, vars).play();
    },
    
    from(target: any, vars: any) {
      const tl = createTimeline();
      return tl.from(target, vars).play();
    },
    
    fromTo(target: any, fromVars: any, toVars: any) {
      const tl = createTimeline();
      return tl.fromTo(target, fromVars, toVars).play();
    },
    
    set(target: any, vars: any) {
      const tl = createTimeline();
      return tl.set(target, vars);
    },
    
    timeline(vars?: any) {
      return createTimeline(vars);
    },
    
    registerPlugin(...args: any[]) {
      debugLog('Plugin registration not implemented in LOCAL UX');
    },
    
    ticker: {
      add(callback: Function) {
        // Use RAF for ticker
      },
      remove(callback: Function) {
        // Remove RAF
      },
      fps(value?: number) {
        return 60;
      }
    },
    
    config(vars: any) {
      debugLog('GSAP config:', vars);
    },
    
    defaults(vars: any) {
      debugLog('GSAP defaults:', vars);
    }
  };
};

/**
 * Get GSAP instance with LOCAL UX configuration
 */
export const getGSAP = async (): Promise<GSAP> => {
  if (localHouseConfig.features.reducedMotion) {
    debugLog('GSAP disabled due to reduced motion preference');
    return createNoOpGSAP();
  }
  
  return loadGSAP();
};

/**
 * Create no-op GSAP for reduced motion
 */
const createNoOpGSAP = (): GSAP => {
  const noOp = () => {};
  const noOpTimeline: GSAPTimeline = {
    to: () => noOpTimeline,
    from: () => noOpTimeline,
    fromTo: () => noOpTimeline,
    set: () => noOpTimeline,
    add: () => noOpTimeline,
    play: () => noOpTimeline,
    pause: () => noOpTimeline,
    reverse: () => noOpTimeline,
    restart: () => noOpTimeline,
    kill: noOp,
    progress: () => 0,
    time: () => 0,
    duration: () => 0,
    totalDuration: () => 0,
    timeScale: () => 1
  };

  return {
    to: noOp,
    from: noOp,
    fromTo: noOp,
    set: noOp,
    timeline: () => noOpTimeline,
    registerPlugin: noOp,
    ticker: {
      add: noOp,
      remove: noOp,
      fps: () => 60
    },
    config: noOp,
    defaults: noOp
  };
};

// Export motion configuration for use in components
export { motionConfig };

// Export types
export type { GSAP, GSAPTimeline };