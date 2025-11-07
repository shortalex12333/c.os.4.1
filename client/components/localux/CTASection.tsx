/**
 * CTA Section - LOCAL UX Implementation
 * Ultra-slow gradient loop with call-to-action optimization
 * Blueprint reference: cta-section-gradient-loop
 */

import React from 'react';
import { CTASection as AnimatedCTASection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { 
  ArrowRight,
  Zap,
  Phone,
  Calendar,
  Star,
  Shield,
  Clock,
  Users
} from '../icons';

interface CTASectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

interface CTAButton {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  variant: 'primary' | 'secondary';
  action: string;
  href?: string;
}

const ctaButtons: CTAButton[] = [
  {
    id: 'start-trial',
    title: 'Start Free Trial',
    subtitle: '30-day full access',
    icon: Zap,
    variant: 'primary',
    action: 'start_trial'
  },
  {
    id: 'book-demo',
    title: 'Book Demo',
    subtitle: 'See it in action',
    icon: Calendar,
    variant: 'secondary',
    action: 'book_demo'
  },
  {
    id: 'contact-sales',
    title: 'Contact Sales',
    subtitle: 'Enterprise solutions',
    icon: Phone,
    variant: 'secondary',
    action: 'contact_sales'
  }
];

const trustIndicators = [
  {
    icon: Users,
    text: '500+ yacht operations'
  },
  {
    icon: Star,
    text: '98.7% accuracy rate'
  },
  {
    icon: Shield,
    text: 'Enterprise security'
  },
  {
    icon: Clock,
    text: '24/7 support'
  }
];

export function CTASection({ 
  isMobile = false, 
  isDarkMode = false 
}: CTASectionProps) {

  // CRITICAL: Button click handlers for actual functionality
  const handleCTAClick = (action: string, button: CTAButton) => {
    console.log(`🎯 CTA Button Clicked: ${action} - ${button.title}`);
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(50);
    }
    
    switch (action) {
      case 'start_trial':
        // Open sign-up flow
        window.location.href = '/?signup=true';
        break;
      case 'book_demo':
        // Open demo booking
        window.open('https://calendly.com/celesteos-demo', '_blank');
        break;
      case 'contact_sales':
        // Open contact form
        window.location.href = '/?contact=sales';
        break;
      default:
        console.warn(`Unknown CTA action: ${action}`);
    }
  };

  // Section reveal animations with enhanced timing
  const { ref: headerRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.3
    })
  });

  const { ref: buttonsRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.3,
      threshold: 0.3,
      stagger: localHouseConfig.motion.stagger / 1000
    })
  });

  const { ref: trustRef } = useReveal({
    ...revealPresets.scaleIn({
      delay: 0.5,
      threshold: 0.3
    })
  });

  return (
    <AnimatedCTASection
      className="relative py-20 md:py-32 overflow-hidden cta-section"
      blueprintRef="cta-section-gradient-loop"
    >
      {/* Ultra-slow gradient loop background - 30-45s duration */}
      <div className="absolute inset-0 overflow-hidden">
        {isDarkMode ? (
          <>
            {/* Dark mode gradient system - Royal Plum + Champagne Gold */}
            
            {/* Layer 1: Base gradient with ultra-slow drift */}
            <div 
              className="absolute inset-0 opacity-80"
              style={{
                background: `
                  radial-gradient(ellipse 120% 140% at 50% 50%, 
                    var(--opulent-plum-900, #0f0b12) 0%, 
                    var(--opulent-plum-800, #201428) 40%, 
                    var(--opulent-plum-700, #2a1c32) 70%, 
                    var(--opulent-plum-900, #0f0b12) 100%
                  )
                `,
                animation: `gradientDriftSlow 42s cubic-bezier(0.22, 0.61, 0.36, 1) infinite alternate`
              }}
            />
            
            {/* Layer 2: Gold accent gradient with opposite drift */}
            <div 
              className="absolute inset-0 opacity-60"
              style={{
                background: `
                  radial-gradient(ellipse 100% 120% at 30% 70%, 
                    rgba(200, 169, 81, 0.15) 0%, 
                    rgba(200, 169, 81, 0.08) 30%, 
                    rgba(182, 150, 71, 0.12) 60%, 
                    transparent 90%
                  )
                `,
                animation: `gradientCounterDrift 38s cubic-bezier(0.22, 0.61, 0.36, 1) infinite alternate-reverse`
              }}
            />
            
            {/* Layer 3: Conic gradient with ultra-slow rotation */}
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: `
                  conic-gradient(from 0deg at 60% 40%, 
                    transparent 0deg,
                    rgba(200, 169, 81, 0.1) 60deg,
                    rgba(200, 169, 81, 0.15) 120deg,
                    rgba(200, 169, 81, 0.08) 180deg,
                    transparent 240deg,
                    rgba(200, 169, 81, 0.05) 300deg,
                    transparent 360deg
                  )
                `,
                animation: `conicRotateUltraSlow 45s linear infinite`
              }}
            />
            
            {/* Layer 4: Floating orbs effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `
                  radial-gradient(ellipse 80% 100% at 80% 20%, 
                    rgba(200, 169, 81, 0.12) 0%, 
                    transparent 50%
                  ),
                  radial-gradient(ellipse 60% 80% at 20% 80%, 
                    rgba(200, 169, 81, 0.08) 0%, 
                    transparent 50%
                  )
                `,
                animation: `floatingOrbs 35s ease-in-out infinite alternate`
              }}
            />
          </>
        ) : (
          <>
            {/* Light mode gradient system */}
            
            {/* Layer 1: Base gradient with ultra-slow drift */}
            <div 
              className="absolute inset-0 opacity-70"
              style={{
                background: `
                  radial-gradient(ellipse 140% 120% at 50% 50%, 
                    #ffffff 0%, 
                    #f8fafc 30%, 
                    #e0f2fe 60%, 
                    #bae6fd 85%, 
                    #7dd3fc 100%
                  )
                `,
                animation: `gradientDriftSlow 42s cubic-bezier(0.22, 0.61, 0.36, 1) infinite alternate`
              }}
            />
            
            {/* Layer 2: Blue accent gradient with opposite drift */}
            <div 
              className="absolute inset-0 opacity-50"
              style={{
                background: `
                  radial-gradient(ellipse 100% 120% at 70% 30%, 
                    rgba(37, 99, 235, 0.12) 0%, 
                    rgba(59, 130, 246, 0.08) 40%, 
                    rgba(147, 197, 253, 0.15) 70%, 
                    transparent 90%
                  )
                `,
                animation: `gradientCounterDrift 38s cubic-bezier(0.22, 0.61, 0.36, 1) infinite alternate-reverse`
              }}
            />
            
            {/* Layer 3: Conic gradient with ultra-slow rotation */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `
                  conic-gradient(from 45deg at 40% 60%, 
                    transparent 0deg,
                    rgba(37, 99, 235, 0.08) 60deg,
                    rgba(59, 130, 246, 0.12) 120deg,
                    rgba(147, 197, 253, 0.06) 180deg,
                    transparent 240deg,
                    rgba(37, 99, 235, 0.04) 300deg,
                    transparent 360deg
                  )
                `,
                animation: `conicRotateUltraSlow 45s linear infinite`
              }}
            />
            
            {/* Layer 4: Floating orbs effect */}
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                background: `
                  radial-gradient(ellipse 80% 100% at 20% 80%, 
                    rgba(37, 99, 235, 0.1) 0%, 
                    transparent 50%
                  ),
                  radial-gradient(ellipse 60% 80% at 80% 20%, 
                    rgba(59, 130, 246, 0.08) 0%, 
                    transparent 50%
                  )
                `,
                animation: `floatingOrbs 35s ease-in-out infinite alternate`
              }}
            />
          </>
        )}
      </div>

      {/* Gradient overlay for content readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(15, 11, 18, 0.3) 0%, rgba(32, 20, 40, 0.2) 50%, rgba(15, 11, 18, 0.4) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.3) 50%, rgba(255, 255, 255, 0.5) 100%)'
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        
        {/* Main CTA Header */}
        <div ref={headerRef} className="mb-12 md:mb-16">
          <h2 
            className="font-display text-4xl md:text-6xl font-normal mb-6 cta-headline"
            style={{
              fontSize: isMobile ? '32px' : '56px',
              lineHeight: isMobile ? '38px' : '64px',
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              letterSpacing: '-0.02em',
              textWrap: 'balance'
            }}
          >
            Ready to Transform
            <br />
            <span 
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(115deg, var(--opulent-gold, #c8a951) 0%, var(--opulent-gold-300, #e0c169) 100%)'
                  : 'linear-gradient(115deg, #2563eb 0%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Your Yacht Operations?
            </span>
          </h2>
          
          <p 
            className="font-text text-xl md:text-2xl max-w-3xl mx-auto cta-subtitle"
            style={{
              fontSize: isMobile ? '18px' : '22px',
              lineHeight: isMobile ? '26px' : '32px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : 'rgba(31, 41, 55, 0.8)',
              fontWeight: 400,
              letterSpacing: '0.01em',
              textWrap: 'pretty'
            }}
          >
            Join the elite yacht operations already using CelesteOS to reduce downtime, 
            improve efficiency, and ensure safety at sea.
          </p>
        </div>

        {/* CTA Buttons */}
        <div ref={buttonsRef} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-16 md:mb-20">
          {ctaButtons.map((button, index) => {
            const IconComponent = button.icon;
            const isPrimary = button.variant === 'primary';
            
            return (
              <button
                key={button.id}
                onClick={() => handleCTAClick(button.action, button)}
                className={cn(
                  "group relative flex items-center gap-4 px-8 py-4 md:py-5 rounded-xl transition-all duration-300",
                  "hover:scale-[1.02] active:scale-[0.98] transform-gpu cta-button cursor-pointer",
                  isMobile && "w-full max-w-sm"
                )}
                style={{
                  background: isPrimary
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'transparent',
                  border: isPrimary 
                    ? 'none'
                    : '2px solid #2563eb',
                  color: isPrimary
                    ? '#ffffff'
                    : '#2563eb',
                  backdropFilter: !isPrimary ? 'blur(16px)' : 'none',
                  WebkitBackdropFilter: !isPrimary ? 'blur(16px)' : 'none',
                  boxShadow: isPrimary
                    ? '0 12px 48px rgba(37, 99, 235, 0.4), 0 4px 16px rgba(37, 99, 235, 0.2)'
                    : '0 8px 32px rgba(37, 99, 235, 0.15)',
                  animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                  minWidth: isMobile ? 'auto' : '200px'
                }}
                onMouseEnter={(e) => {
                  if (isPrimary) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)';
                  } else {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isPrimary) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                  } else {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Icon */}
                <div 
                  className="flex-shrink-0 p-2 rounded-lg button-icon"
                  style={{
                    background: isPrimary
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(37, 99, 235, 0.1)'
                  }}
                >
                  <IconComponent 
                    className="w-5 h-5"
                    style={{
                      color: isPrimary
                        ? 'inherit'
                        : '#2563eb'
                    }}
                  />
                </div>
                
                {/* Text */}
                <div className="text-left">
                  <div 
                    className="font-display text-lg font-medium button-title"
                    style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      color: 'inherit'
                    }}
                  >
                    {button.title}
                  </div>
                  <div 
                    className="font-text text-sm opacity-80 button-subtitle"
                    style={{
                      fontSize: isMobile ? '12px' : '14px',
                      fontFamily: 'var(--font-text)',
                      fontWeight: 400,
                      color: 'inherit'
                    }}
                  >
                    {button.subtitle}
                  </div>
                </div>
                
                {/* Arrow */}
                <ArrowRight 
                  className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 button-arrow"
                  style={{ color: 'inherit' }}
                />
              </button>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div ref={trustRef} className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {trustIndicators.map((indicator, index) => {
            const IconComponent = indicator.icon;
            
            return (
              <div
                key={index}
                className="flex items-center gap-2 trust-indicator"
                style={{
                  animationDelay: `${index * (localHouseConfig.motion.stagger * 0.5)}ms`
                }}
              >
                <IconComponent 
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    color: '#2563eb'
                  }}
                />
                <span 
                  className="font-text text-sm font-medium"
                  style={{
                    fontSize: isMobile ? '12px' : '14px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : 'rgba(31, 41, 55, 0.8)',
                    fontWeight: 500
                  }}
                >
                  {indicator.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ultra-slow gradient animation keyframes */}
      <style>
        {`
          @keyframes gradientDriftSlow {
            0% {
              transform: translate(0%, 0%) rotate(0deg) scale(1);
            }
            25% {
              transform: translate(2%, -1%) rotate(0.5deg) scale(1.02);
            }
            50% {
              transform: translate(-1%, 2%) rotate(-0.3deg) scale(0.98);
            }
            75% {
              transform: translate(1.5%, 1%) rotate(0.2deg) scale(1.01);
            }
            100% {
              transform: translate(-0.5%, -1.5%) rotate(-0.1deg) scale(0.99);
            }
          }
          
          @keyframes gradientCounterDrift {
            0% {
              transform: translate(0%, 0%) rotate(0deg) scale(1);
            }
            33% {
              transform: translate(-1.5%, 1%) rotate(-0.4deg) scale(1.01);
            }
            66% {
              transform: translate(1%, -2%) rotate(0.3deg) scale(0.99);
            }
            100% {
              transform: translate(0.5%, 0.5%) rotate(0.1deg) scale(1.02);
            }
          }
          
          @keyframes conicRotateUltraSlow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          @keyframes floatingOrbs {
            0% {
              transform: translate(0%, 0%) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translate(3%, -2%) scale(1.1);
              opacity: 0.4;
            }
            100% {
              transform: translate(-2%, 1%) scale(0.9);
              opacity: 0.2;
            }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .cta-section * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedCTASection>
  );
}