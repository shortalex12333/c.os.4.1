/**
 * useLenis Hook - LOCAL UX Smooth Scroll System
 * Implements smooth scrolling with precise control
 * Blueprint reference: 120-180ms micro animations
 */

import { useEffect, useRef } from 'react';
import { localHouseConfig, debugLog } from '../../config/localhouse';

interface LenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  orientation?: 'vertical' | 'horizontal';
  gestureOrientation?: 'vertical' | 'horizontal' | 'both';
  smoothWheel?: boolean;
  smoothTouch?: boolean;
  touchMultiplier?: number;
  infinite?: boolean;
}

interface LenisInstance {
  scroll: number;
  targetScroll: number;
  isScrolling: boolean;
  velocity: number;
  direction: number;
  
  scrollTo: (target: number | string | HTMLElement, options?: {
    offset?: number;
    duration?: number;
    easing?: (t: number) => number;
    immediate?: boolean;
    lock?: boolean;
    force?: boolean;
  }) => void;
  
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
  destroy: () => void;
  start: () => void;
  stop: () => void;
  raf: (time: number) => void;
}

// Custom easing function matching LOCAL UX spec: cubic-bezier(0.22,0.61,0.36,1)
const customEasing = (t: number): number => {
  // Approximation of cubic-bezier(0.22,0.61,0.36,1)
  const c1 = 0.22;
  const c3 = 0.36;
  const c4 = 1;
  
  const t2 = t * t;
  const t3 = t2 * t;
  
  return c1 * t + (3 * c3 - 3 * c1) * t2 + (c4 + 3 * c1 - 3 * c3) * t3;
};

/**
 * Custom Lenis implementation for LOCAL UX
 * Transform/opacity only animations with precise timing
 */
class LocalLenis implements LenisInstance {
  private container: HTMLElement;
  private options: LenisOptions;
  private animationFrame?: number;
  private startTime?: number;
  private targetElement?: HTMLElement;
  private startScroll: number = 0;
  
  scroll: number = 0;
  targetScroll: number = 0;
  isScrolling: boolean = false;
  velocity: number = 0;
  direction: number = 0;
  
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(container: HTMLElement = document.documentElement, options: LenisOptions = {}) {
    this.container = container;
    this.options = {
      duration: localHouseConfig.motion.section, // 450ms default
      easing: customEasing,
      orientation: 'vertical',
      smoothWheel: true,
      smoothTouch: false, // Disable on touch to preserve native feel
      touchMultiplier: 1,
      infinite: false,
      ...options
    };
    
    this.init();
  }

  private init() {
    // Get initial scroll position
    this.scroll = this.container === document.documentElement 
      ? window.pageYOffset 
      : this.container.scrollTop;
    this.targetScroll = this.scroll;
    
    // Add wheel listener if enabled
    if (this.options.smoothWheel) {
      this.container.addEventListener('wheel', this.onWheel, { passive: false });
    }
    
    debugLog('LocalLenis initialized', { 
      container: this.container.tagName,
      options: this.options 
    });
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.options.smoothWheel) return;
    
    e.preventDefault();
    
    const delta = e.deltaY;
    this.targetScroll += delta;
    
    // Clamp to bounds
    const maxScroll = this.container.scrollHeight - this.container.clientHeight;
    this.targetScroll = Math.max(0, Math.min(this.targetScroll, maxScroll));
    
    this.start();
  };

  scrollTo(target: number | string | HTMLElement, options: any = {}) {
    const {
      offset = 0,
      duration = this.options.duration,
      easing = this.options.easing,
      immediate = false
    } = options;

    let targetPosition = 0;

    if (typeof target === 'number') {
      targetPosition = target;
    } else if (typeof target === 'string') {
      const element = document.querySelector(target) as HTMLElement;
      if (element) {
        targetPosition = element.offsetTop;
      }
    } else if (target instanceof HTMLElement) {
      targetPosition = target.offsetTop;
    }

    targetPosition += offset;

    // Clamp to bounds
    const maxScroll = this.container.scrollHeight - this.container.clientHeight;
    targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));

    if (immediate) {
      this.scroll = targetPosition;
      this.targetScroll = targetPosition;
      this.setScroll(targetPosition);
      this.emit('scroll', this);
    } else {
      this.targetScroll = targetPosition;
      this.startScroll = this.scroll;
      this.startTime = Date.now();
      this.options.duration = duration;
      this.options.easing = easing;
      this.start();
    }
  }

  private setScroll(value: number) {
    if (this.container === document.documentElement) {
      window.scrollTo(0, value);
    } else {
      this.container.scrollTop = value;
    }
  }

  raf = (time: number) => {
    if (!this.isScrolling) return;

    const elapsed = Date.now() - (this.startTime || Date.now());
    const progress = Math.min(elapsed / (this.options.duration || 450), 1);
    
    const eased = this.options.easing ? this.options.easing(progress) : progress;
    const newScroll = this.startScroll + (this.targetScroll - this.startScroll) * eased;
    
    const oldScroll = this.scroll;
    this.scroll = newScroll;
    this.velocity = this.scroll - oldScroll;
    this.direction = Math.sign(this.velocity);
    
    this.setScroll(this.scroll);
    this.emit('scroll', this);

    if (progress >= 1) {
      this.stop();
    } else {
      this.animationFrame = requestAnimationFrame(this.raf);
    }
  };

  start() {
    if (this.isScrolling) return;
    
    this.isScrolling = true;
    this.startTime = Date.now();
    this.startScroll = this.scroll;
    
    this.emit('start', this);
    this.animationFrame = requestAnimationFrame(this.raf);
  }

  stop() {
    if (!this.isScrolling) return;
    
    this.isScrolling = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    
    this.emit('stop', this);
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(callback => callback(...args));
  }

  destroy() {
    this.stop();
    this.container.removeEventListener('wheel', this.onWheel);
    this.listeners.clear();
    
    debugLog('LocalLenis destroyed');
  }
}

/**
 * useLenis Hook
 * Provides smooth scroll functionality for LOCAL UX
 */
export const useLenis = (options?: LenisOptions) => {
  const lenisRef = useRef<LenisInstance | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    // Skip if reduced motion is preferred
    if (localHouseConfig.features.reducedMotion) {
      debugLog('Lenis disabled due to reduced motion preference');
      return;
    }

    // Initialize Lenis
    lenisRef.current = new LocalLenis(document.documentElement, options);
    
    // Animation loop
    const animate = (time: number) => {
      lenisRef.current?.raf(time);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lenisRef.current?.destroy();
    };
  }, []);

  return lenisRef.current;
};

// Export for use in other components
export type { LenisInstance, LenisOptions };