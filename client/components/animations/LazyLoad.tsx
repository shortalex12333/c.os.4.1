import React, { useState, useEffect, useRef } from 'react';
import { siteDesignSystem } from '../../design-system';

interface LazyLoadProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animationType?: 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'fadeIn' | 'scale' | 'custom';
  customAnimation?: {
    from: React.CSSProperties;
    to: React.CSSProperties;
  };
}

export default function LazyLoad({
  children,
  delay = 0,
  duration = 350,
  className = '',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  animationType = 'slideUp',
  customAnimation
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          setTimeout(() => {
            setIsVisible(true);
            setHasTriggered(true);
          }, delay);
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay, threshold, rootMargin, triggerOnce, hasTriggered]);

  const getAnimationStyles = () => {
    const { animation } = siteDesignSystem;
    
    if (customAnimation) {
      return {
        from: customAnimation.from,
        to: customAnimation.to
      };
    }

    const animations = {
      slideUp: {
        from: { opacity: 0, transform: 'translateY(20px)' },
        to: { opacity: 1, transform: 'translateY(0px)' }
      },
      slideDown: {
        from: { opacity: 0, transform: 'translateY(-20px)' },
        to: { opacity: 1, transform: 'translateY(0px)' }
      },
      slideLeft: {
        from: { opacity: 0, transform: 'translateX(20px)' },
        to: { opacity: 1, transform: 'translateX(0px)' }
      },
      slideRight: {
        from: { opacity: 0, transform: 'translateX(-20px)' },
        to: { opacity: 1, transform: 'translateX(0px)' }
      },
      fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 }
      },
      scale: {
        from: { opacity: 0, transform: 'scale(0.95)' },
        to: { opacity: 1, transform: 'scale(1)' }
      }
    };

    return animations[animationType] || animations.slideUp;
  };

  const animationStyles = getAnimationStyles();
  const { easing } = siteDesignSystem.animation;

  return (
    <div
      ref={elementRef}
      className={`lazy-load ${className}`}
      style={{
        ...(!isVisible ? animationStyles.from : animationStyles.to),
        transition: `all ${duration}ms ${easing.easeOut}`,
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </div>
  );
}

// Staggered lazy loading for lists/grids
interface StaggeredLazyLoadProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
  className?: string;
  animationType?: 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'fadeIn' | 'scale';
}

export function StaggeredLazyLoad({
  children,
  staggerDelay = 150,
  baseDelay = 0,
  duration = 350,
  className = '',
  animationType = 'slideUp'
}: StaggeredLazyLoadProps) {
  return (
    <div className={`staggered-lazy-load ${className}`}>
      {children.map((child, index) => (
        <LazyLoad
          key={index}
          delay={baseDelay + (index * staggerDelay)}
          duration={duration}
          animationType={animationType}
          triggerOnce={true}
        >
          {child}
        </LazyLoad>
      ))}
    </div>
  );
}

// Chat-specific lazy loading animations
interface ChatAnimationProps {
  children: React.ReactNode;
  type: 'newChat' | 'existingChat' | 'message' | 'card';
  delay?: number;
}

export function ChatAnimation({ children, type, delay = 0 }: ChatAnimationProps) {
  const animationConfig = {
    newChat: {
      animationType: 'fadeIn' as const,
      duration: 500,
      delay: delay
    },
    existingChat: {
      animationType: 'slideDown' as const,
      duration: 300,
      delay: delay
    },
    message: {
      animationType: 'slideUp' as const,
      duration: 250,
      delay: delay
    },
    card: {
      animationType: 'slideUp' as const,
      duration: 350,
      delay: delay
    }
  };

  const config = animationConfig[type];

  return (
    <LazyLoad
      animationType={config.animationType}
      duration={config.duration}
      delay={config.delay}
      triggerOnce={true}
    >
      {children}
    </LazyLoad>
  );
}

// Entrance animation for entire page sections
interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export function PageSection({ children, className = '', stagger = true }: PageSectionProps) {
  if (stagger && React.Children.count(children) > 1) {
    return (
      <StaggeredLazyLoad
        staggerDelay={100}
        baseDelay={0}
        duration={400}
        className={className}
        animationType="slideUp"
      >
        {React.Children.toArray(children)}
      </StaggeredLazyLoad>
    );
  }

  return (
    <LazyLoad
      duration={400}
      animationType="slideUp"
      className={className}
    >
      {children}
    </LazyLoad>
  );
}

// Loading skeleton component
interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({
  width = '100%',
  height = '1em',
  lines = 1,
  className = ''
}: LoadingSkeletonProps) {
  return (
    <div className={`loading-skeleton ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            marginBottom: lines > 1 && index < lines - 1 ? '8px' : '0',
            background: 'linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%)',
            backgroundSize: '400% 100%',
            animation: 'skeleton-loading 1.5s ease-in-out infinite',
            borderRadius: '4px'
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes skeleton-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: -100% 50%;
          }
        }
        
        .loading-skeleton {
          display: block;
        }
        
        .skeleton-line {
          display: block;
        }
      `}</style>
    </div>
  );
}

// Typing indicator for chat
export function TypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`typing-indicator ${className}`}>
      <div className="typing-dots">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          padding: 12px 16px;
        }
        
        .typing-dots {
          display: flex;
          gap: 4px;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          background-color: #9CA3AF;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}