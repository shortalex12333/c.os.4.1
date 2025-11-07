/**
 * Hero Section - LOCAL UX Implementation
 * Masked headline reveal with subtle gradient drift and depth parallax
 * Blueprint reference: hero-section-masked-headline
 */

import React from 'react';
import { HeroSection as AnimatedHeroSection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { ChevronDown, Zap, Target, Wind } from '../icons';

interface ModelType {
  id: 'power' | 'reach' | 'air';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface HeroSectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  displayName?: string;
}

const models: ModelType[] = [
  {
    id: 'power',
    name: 'Power',
    description: 'Our most advanced model',
    icon: Zap
  },
  {
    id: 'reach',
    name: 'Reach', 
    description: 'Get more thorough answers',
    icon: Target
  },
  {
    id: 'air',
    name: 'Air',
    description: 'Fastest model, for simple tasks',
    icon: Wind
  }
];

export function HeroSection({ 
  isMobile = false, 
  isDarkMode = false, 
  selectedModel = 'air',
  onModelChange,
  displayName = 'John Doe'
}: HeroSectionProps) {
  
  // Time-based greeting
  const getTimeBasedGreeting = () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 5 && hour < 12) return 'Morning';
      else if (hour >= 12 && hour < 17) return 'Afternoon';
      else return 'Evening';
    } catch {
      return 'Hello';
    }
  };

  // Hero reveal animations with staggered elements
  const { ref: titleRef } = useReveal({
    ...revealPresets.maskedHeadline({
      delay: 0.1,
      threshold: 0.3
    })
  });

  const { ref: subtitleRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.3,
      threshold: 0.3
    })
  });

  const { ref: modelSelectorRef } = useReveal({
    ...revealPresets.scaleIn({
      delay: 0.5,
      threshold: 0.3
    })
  });

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <AnimatedHeroSection
      className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 hero-section"
      blueprintRef="hero-section-masked-headline"
    >
      {/* Subtle gradient drift background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Layer 1: Base gradient with subtle drift */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 140% 120% at 60% 40%, 
                rgba(240, 248, 255, 0.8) 0%, 
                rgba(232, 244, 255, 0.6) 30%, 
                rgba(224, 240, 255, 0.4) 60%, 
                transparent 90%
              )
            `,
            animation: `gradientDrift 45s cubic-bezier(0.22, 0.61, 0.36, 1) infinite alternate`
          }}
        />
        
        {/* Layer 2: Depth parallax layer */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 100% 140% at 40% 60%, 
                rgba(67, 166, 216, 0.15) 0%, 
                rgba(129, 200, 228, 0.12) 40%, 
                transparent 80%
              )
            `,
            animation: `parallaxFloat 60s linear infinite`
          }}
        />
        
        {/* Layer 3: Accent gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              conic-gradient(from 45deg at 70% 30%, 
                rgba(240, 248, 255, 0.3) 0deg,
                rgba(248, 252, 255, 0.2) 120deg,
                rgba(232, 244, 255, 0.3) 240deg,
                rgba(240, 248, 255, 0.3) 360deg
              )
            `,
            animation: `conicRotate 90s linear infinite`
          }}
        />
      </div>

      {/* Main content container with depth parallax */}
      <div 
        className="relative z-10 max-w-4xl mx-auto text-center"
        style={{
          transform: 'translateZ(0)', // Create stacking context for parallax
        }}
      >
        {/* Greeting line with masked reveal */}
        <div 
          ref={titleRef}
          className="overflow-hidden mb-4"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)' }}
        >
          <h2 
            className="font-text text-lg md:text-xl text-gray-600 font-medium"
            style={{
              fontSize: isMobile ? '16px' : '18px',
              lineHeight: isMobile ? '24px' : '28px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
              letterSpacing: '0.01em'
            }}
          >
            Good {getTimeBasedGreeting()}, {displayName}
          </h2>
        </div>

        {/* Main headline with masked reveal */}
        <div 
          ref={titleRef}
          className="overflow-hidden mb-6"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
          }}
        >
          <h1 
            className="font-display text-4xl md:text-6xl lg:text-7xl font-normal mb-2"
            style={{
              fontSize: isMobile ? '32px' : '56px',
              lineHeight: isMobile ? '40px' : '64px',
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              letterSpacing: '-0.02em',
              textWrap: 'balance'
            }}
          >
            What can I help you with?
          </h1>
        </div>

        {/* Subtitle with fade up reveal */}
        <div ref={subtitleRef} className="mb-12">
          <p 
            className="font-text text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            style={{
              fontSize: isMobile ? '16px' : '18px',
              lineHeight: isMobile ? '24px' : '28px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.65)' : '#6b7280',
              fontWeight: 400,
              letterSpacing: '0.01em',
              textWrap: 'pretty'
            }}
          >
            Choose a model to get started, or dive right in with a question
          </p>
        </div>

        {/* Model selector with scale in reveal */}
        <div 
          ref={modelSelectorRef}
          className="flex flex-col items-center gap-6"
        >
          {/* Current model indicator */}
          {selectedModelData && (
            <div 
              className="flex items-center gap-3 px-6 py-3 rounded-full"
              style={{
                background: isDarkMode 
                  ? 'rgba(200, 169, 81, 0.1)' 
                  : 'rgba(0, 112, 255, 0.08)',
                border: `1px solid ${isDarkMode 
                  ? 'rgba(200, 169, 81, 0.2)' 
                  : 'rgba(0, 112, 255, 0.2)'}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <selectedModelData.icon 
                className="w-5 h-5"
                style={{
                  color: isDarkMode 
                    ? 'var(--opulent-gold, #c8a951)' 
                    : '#2563eb'
                }}
              />
              <span 
                className="font-medium"
                style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontFamily: 'var(--font-text)',
                  color: isDarkMode 
                    ? 'var(--opulent-gold, #c8a951)' 
                    : '#2563eb',
                  fontWeight: 500
                }}
              >
                {selectedModelData.name} Model
              </span>
              <span 
                className="text-sm opacity-70"
                style={{
                  fontSize: isMobile ? '12px' : '14px',
                  fontFamily: 'var(--font-text)',
                  color: isDarkMode 
                    ? 'rgba(200, 169, 81, 0.7)' 
                    : 'rgba(37, 99, 235, 0.7)'
                }}
              >
                {selectedModelData.description}
              </span>
            </div>
          )}

          {/* Model selection grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            {models.map((model, index) => {
              const IconComponent = model.icon;
              const isSelected = selectedModel === model.id;
              
              return (
                <button
                  key={model.id}
                  onClick={() => onModelChange?.(model.id)}
                  className={cn(
                    "group p-6 rounded-xl transition-all duration-300 text-left",
                    "hover:scale-[1.02] hover:shadow-lg",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isSelected && "ring-2 ring-offset-2",
                    "transform-gpu" // GPU acceleration
                  )}
                  style={{
                    background: isSelected 
                      ? isDarkMode 
                        ? 'rgba(200, 169, 81, 0.12)' 
                        : 'rgba(0, 112, 255, 0.08)'
                      : isDarkMode 
                        ? 'rgba(246, 247, 251, 0.04)' 
                        : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${isSelected 
                      ? isDarkMode 
                        ? 'rgba(200, 169, 81, 0.3)' 
                        : 'rgba(0, 112, 255, 0.3)'
                      : isDarkMode 
                        ? 'rgba(246, 247, 251, 0.1)' 
                        : 'rgba(0, 0, 0, 0.08)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    ringColor: isDarkMode 
                      ? 'var(--opulent-gold, #c8a951)' 
                      : '#2563eb',
                    // Staggered animation delay
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <IconComponent 
                      className="w-6 h-6 transition-colors duration-200"
                      style={{
                        color: isSelected 
                          ? isDarkMode 
                            ? 'var(--opulent-gold, #c8a951)' 
                            : '#2563eb'
                          : isDarkMode 
                            ? 'rgba(246, 247, 251, 0.7)' 
                            : '#6b7280'
                      }}
                    />
                    <h3 
                      className="font-medium"
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontFamily: 'var(--font-display)',
                        color: isSelected 
                          ? isDarkMode 
                            ? 'var(--opulent-gold, #c8a951)' 
                            : '#2563eb'
                          : isDarkMode 
                            ? 'var(--headline, #f6f7fb)' 
                            : '#1f2937',
                        fontWeight: 500
                      }}
                    >
                      {model.name}
                    </h3>
                  </div>
                  
                  <p 
                    className="text-sm opacity-80"
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode 
                        ? 'rgba(246, 247, 251, 0.65)' 
                        : '#6b7280',
                      lineHeight: '20px'
                    }}
                  >
                    {model.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 opacity-60"
          style={{
            animation: `bounce 2s infinite`
          }}
        >
          <span 
            className="text-xs font-medium tracking-wide uppercase"
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
              letterSpacing: '1px'
            }}
          >
            Scroll to explore
          </span>
          <ChevronDown 
            className="w-4 h-4"
            style={{
              color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280'
            }}
          />
        </div>
      </div>

      {/* Animation keyframes are now in globals.localux.css */}
    </AnimatedHeroSection>
  );
}