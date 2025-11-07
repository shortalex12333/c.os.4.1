// Premium Higher-Order Component
// Enhances any component with premium features including error boundaries, performance monitoring, accessibility, and analytics

import React, { ComponentType, forwardRef, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import PremiumErrorBoundary from './PremiumErrorBoundary';
import { useAnimationCleanup } from '../../hooks/useAnimationCleanup';
import { useFallbackMode } from '../../hooks/useFallbackMode';
import { usePerformanceBudget } from '../../hooks/usePerformanceBudget';
import { useAccessibility } from '../../hooks/useAccessibility';
import { trackEvent, recordMetric } from '../../services/monitoringService';
import { usePremiumStore } from '../../stores/premiumStore';
import type { 
  PremiumBaseProps, 
  WithPremiumFeaturesOptions,
  PremiumInteractionEvent,
  PremiumPerformanceEvent
} from './types';

const DEFAULT_OPTIONS: WithPremiumFeaturesOptions = {
  errorBoundary: true,
  performance: true,
  accessibility: true,
  analytics: true,
  animations: true,
  responsive: true,
};

export function withPremiumFeatures<P extends Record<string, any>>(
  WrappedComponent: ComponentType<P>,
  options: WithPremiumFeaturesOptions = {}
) {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const PremiumEnhancedComponent = forwardRef<any, P & PremiumBaseProps>((props, ref) => {
    const {
      enableAnimations = true,
      reducedMotion = false,
      animationComplexity = 'high',
      glassmorphism = true,
      performanceBudget,
      onError,
      onPerformanceMetric,
      onInteraction,
      lazy = false,
      priority = 'normal',
      'data-testid': testId,
      ...restProps
    } = props;

    // Component state
    const [isVisible, setIsVisible] = useState(!lazy);
    const [renderStartTime] = useState(() => performance.now());
    const componentRef = useRef<HTMLElement>(null);
    
    // Premium store integration
    const {
      animationsEnabled,
      reducedMotion: globalReducedMotion,
      performanceMode,
      glassmorphismEnabled,
      addError,
      updatePerformanceMetrics
    } = usePremiumStore();

    // Premium hooks
    const { cleanup } = useAnimationCleanup();
    const { shouldAnimateComponent, shouldUseGlassEffect } = useFallbackMode();
    const { shouldDisableAnimations, registerAnimation, unregisterAnimation } = usePerformanceBudget(performanceBudget);
    const { announceToScreenReader } = useAccessibility();

    // Compute final animation settings
    const finalAnimationsEnabled = enableAnimations && 
                                  animationsEnabled && 
                                  !globalReducedMotion && 
                                  !reducedMotion && 
                                  !performanceMode &&
                                  shouldAnimateComponent(componentName) &&
                                  !shouldDisableAnimations;

    const finalGlassmorphismEnabled = glassmorphism && 
                                     glassmorphismEnabled && 
                                     shouldUseGlassEffect() &&
                                     !performanceMode;

    // Performance monitoring
    useEffect(() => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;
      
      // Record render performance
      recordMetric(`${componentName}_render_time`, renderDuration);
      
      if (onPerformanceMetric) {
        onPerformanceMetric({
          name: `${componentName}_render_time`,
          value: renderDuration,
          timestamp: renderEndTime
        });
      }

      // Update store metrics
      updatePerformanceMetrics({ activeAnimations: finalAnimationsEnabled ? 1 : 0 });

      // Track slow renders
      if (renderDuration > 16) {
        trackEvent('slow_render', {
          component: componentName,
          duration: renderDuration,
          animationsEnabled: finalAnimationsEnabled
        });
      }
    }, [componentName, renderStartTime, finalAnimationsEnabled, onPerformanceMetric, updatePerformanceMetrics]);

    // Animation registration
    useEffect(() => {
      if (finalAnimationsEnabled) {
        registerAnimation(`${componentName}-${Date.now()}`);
        return () => unregisterAnimation(`${componentName}-${Date.now()}`);
      }
    }, [finalAnimationsEnabled, componentName, registerAnimation, unregisterAnimation]);

    // Lazy loading with Intersection Observer
    useEffect(() => {
      if (!lazy || isVisible) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            trackEvent('component_lazy_loaded', { component: componentName });
          }
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
        }
      );

      if (componentRef.current) {
        observer.observe(componentRef.current);
      }

      return () => observer.disconnect();
    }, [lazy, isVisible, componentName]);

    // Error handling
    const handleError = (error: Error, errorInfo?: any) => {
      addError({
        message: error.message,
        component: componentName,
      });

      if (onError) {
        onError(error, errorInfo);
      }

      trackEvent('component_error', {
        component: componentName,
        error: error.message,
        stack: error.stack,
      });
    };

    // Interaction tracking
    const handleInteraction = (event: PremiumInteractionEvent) => {
      if (finalOptions.analytics && onInteraction) {
        onInteraction(event);
      }

      trackEvent('component_interaction', {
        component: componentName,
        type: event.type,
        element: event.element,
        timestamp: event.timestamp,
        ...event.metadata,
      });
    };

    // Common interaction handlers
    const interactionHandlers = finalOptions.analytics ? {
      onClick: (e: React.MouseEvent) => {
        handleInteraction({
          type: 'click',
          component: componentName,
          element: (e.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now(),
          metadata: {
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
          }
        });
        (restProps as any).onClick?.(e);
      },
      onMouseEnter: (e: React.MouseEvent) => {
        handleInteraction({
          type: 'hover',
          component: componentName,
          element: (e.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now(),
        });
        (restProps as any).onMouseEnter?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        handleInteraction({
          type: 'focus',
          component: componentName,
          element: (e.target as HTMLElement).tagName.toLowerCase(),
          timestamp: Date.now(),
        });
        (restProps as any).onFocus?.(e);
      }
    } : {};

    // Accessibility enhancements
    const accessibilityProps = finalOptions.accessibility ? {
      'data-component': componentName,
      'data-premium': 'true',
      'data-animations': finalAnimationsEnabled,
      'data-glassmorphism': finalGlassmorphismEnabled,
      ...(testId && { 'data-testid': testId }),
    } : {};

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanup();
        if (finalAnimationsEnabled) {
          unregisterAnimation(`${componentName}-cleanup`);
        }
      };
    }, [cleanup, finalAnimationsEnabled, componentName, unregisterAnimation]);

    // Enhanced props for wrapped component
    const enhancedProps = {
      ...restProps,
      ...interactionHandlers,
      ...accessibilityProps,
      // Premium feature flags
      premiumFeatures: {
        animationsEnabled: finalAnimationsEnabled,
        glassmorphismEnabled: finalGlassmorphismEnabled,
        performanceMode,
        accessibilityMode: true,
        componentName,
      },
      // Performance data
      performanceMetrics: {
        renderTime: performance.now() - renderStartTime,
        animationComplexity,
        priority,
      },
      // Utility functions
      utils: {
        announceToScreenReader,
        trackEvent: (event: string, properties?: Record<string, any>) => 
          trackEvent(event, { component: componentName, ...properties }),
        recordMetric: (name: string, value: number) => 
          recordMetric(`${componentName}_${name}`, value),
      },
      ref: ref || componentRef,
    } as P & {
      premiumFeatures: any;
      performanceMetrics: any;
      utils: any;
    };

    // Render with lazy loading
    if (lazy && !isVisible) {
      return (
        <div 
          ref={componentRef}
          className="premium-component-placeholder"
          style={{ minHeight: '200px' }}
          data-component={componentName}
          data-loading="lazy"
        >
          {priority === 'high' && (
            <div className="premium-loading-skeleton">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2" />
            </div>
          )}
        </div>
      );
    }

    // Animation wrapper
    const AnimationWrapper = finalAnimationsEnabled ? motion.div : 'div';
    const animationProps = finalAnimationsEnabled ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: {
        type: 'spring',
        stiffness: animationComplexity === 'low' ? 50 : animationComplexity === 'medium' ? 100 : 200,
        damping: 20,
      },
    } : {};

    const ComponentWithFeatures = () => (
      <AnimationWrapper {...animationProps} data-premium-wrapper="true">
        <WrappedComponent {...enhancedProps} />
      </AnimationWrapper>
    );

    // Wrap with error boundary if enabled
    if (finalOptions.errorBoundary) {
      return (
        <PremiumErrorBoundary
          onError={handleError}
          componentName={componentName}
        >
          <ComponentWithFeatures />
        </PremiumErrorBoundary>
      );
    }

    return <ComponentWithFeatures />;
  });

  PremiumEnhancedComponent.displayName = `withPremiumFeatures(${componentName})`;

  return PremiumEnhancedComponent;
}

// Utility function to create premium components with specific configurations
export const createPremiumComponent = <P extends Record<string, any>>(
  component: ComponentType<P>,
  options?: WithPremiumFeaturesOptions
) => {
  return withPremiumFeatures(component, options);
};

// Pre-configured premium component creators
export const createPremiumAnimatedComponent = <P extends Record<string, any>>(
  component: ComponentType<P>
) => {
  return withPremiumFeatures(component, {
    errorBoundary: true,
    performance: true,
    accessibility: true,
    analytics: true,
    animations: true,
    responsive: true,
  });
};

export const createPremiumStaticComponent = <P extends Record<string, any>>(
  component: ComponentType<P>
) => {
  return withPremiumFeatures(component, {
    errorBoundary: true,
    performance: true,
    accessibility: true,
    analytics: false,
    animations: false,
    responsive: true,
  });
};

export const createPremiumPerformantComponent = <P extends Record<string, any>>(
  component: ComponentType<P>
) => {
  return withPremiumFeatures(component, {
    errorBoundary: true,
    performance: true,
    accessibility: true,
    analytics: true,
    animations: false,
    responsive: true,
  });
};

export default withPremiumFeatures;