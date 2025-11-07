/**
 * How It Works Section - LOCAL UX Implementation
 * Step-by-step process explanation with animated workflow
 * Blueprint reference: how-it-works-process-flow
 */

import React from 'react';
import { HowItWorksSection as AnimatedHowItWorksSection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { 
  Upload, 
  Search, 
  Brain, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  Zap,
  Target
} from 'lucide-react';

interface HowItWorksSectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

interface ProcessStep {
  id: string;
  number: number;
  title: string;
  description: string;
  detail: string;
  icon: React.ComponentType<any>;
  color: {
    light: string;
    dark: string;
  };
}

const processSteps: ProcessStep[] = [
  {
    id: 'upload-manuals',
    number: 1,
    title: 'Upload Your Manuals',
    description: 'Securely upload your yacht\'s technical documentation',
    detail: 'PDF manuals are processed locally on your device - no data ever leaves your yacht',
    icon: Upload,
    color: {
      light: '#3b82f6',
      dark: '#60a5fa'
    }
  },
  {
    id: 'ai-processing', 
    number: 2,
    title: 'AI Indexing',
    description: 'Advanced AI creates searchable knowledge from your manuals',
    detail: 'Every page, diagram, and procedure is indexed with intelligent tagging',
    icon: Brain,
    color: {
      light: '#8b5cf6',
      dark: '#a78bfa'
    }
  },
  {
    id: 'instant-search',
    number: 3,
    title: 'Ask Questions',
    description: 'Natural language queries return precise answers',
    detail: 'Get specific solutions with exact page references from your manuals',
    icon: Search,
    color: {
      light: '#06b6d4',
      dark: '#22d3ee'
    }
  },
  {
    id: 'verified-results',
    number: 4,
    title: 'Verified Results',
    description: 'Every answer includes source verification and confidence scoring',
    detail: 'Manual references, page numbers, and reliability indicators for every response',
    icon: CheckCircle,
    color: {
      light: '#10b981',
      dark: '#34d399'
    }
  }
];

export function HowItWorksSection({ 
  isMobile = false, 
  isDarkMode = false 
}: HowItWorksSectionProps) {

  // Section reveal animations
  const { ref: headerRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: stepsRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.3,
      threshold: 0.1,
      stagger: localHouseConfig.motion.stagger / 1000 * 1.5 // Slower stagger for process steps
    })
  });

  const { ref: ctaRef } = useReveal({
    ...revealPresets.scaleIn({
      delay: 0.8,
      threshold: 0.2
    })
  });

  return (
    <AnimatedHowItWorksSection
      className="relative py-16 md:py-24 how-it-works-section"
      blueprintRef="how-it-works-process-flow"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle gradient background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: isDarkMode 
              ? `radial-gradient(ellipse 120% 100% at 50% 20%, 
                  rgba(15, 11, 18, 0.8) 0%, 
                  rgba(37, 99, 235, 0.05) 40%, 
                  rgba(15, 11, 18, 0.6) 100%)`
              : `radial-gradient(ellipse 120% 100% at 50% 20%, 
                  rgba(248, 250, 252, 0.8) 0%, 
                  rgba(37, 99, 235, 0.03) 40%, 
                  rgba(255, 255, 255, 0.9) 100%)`
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 md:mb-20">
          <h2 
            className="font-display text-3xl md:text-5xl font-normal mb-6 how-it-works-headline"
            style={{
              fontSize: isMobile ? '28px' : '48px',
              lineHeight: isMobile ? '34px' : '56px',
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              letterSpacing: '-0.02em',
              textWrap: 'balance'
            }}
          >
            How It
            <br />
            <span 
              style={{
                color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
              }}
            >
              Works
            </span>
          </h2>
          <p 
            className="font-text text-lg md:text-xl max-w-3xl mx-auto how-it-works-subtitle"
            style={{
              fontSize: isMobile ? '16px' : '18px',
              lineHeight: isMobile ? '24px' : '28px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#6b7280',
              fontWeight: 400,
              letterSpacing: '0.01em',
              textWrap: 'pretty'
            }}
          >
            From manual upload to expert answers in four simple steps - completely offline and secure
          </p>
        </div>

        {/* Process Steps */}
        <div ref={stepsRef} className="space-y-8 md:space-y-12">
          {processSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isEven = index % 2 === 1;
            
            return (
              <div 
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-8 md:gap-12",
                  isMobile ? "" : isEven ? "md:flex-row-reverse" : "md:flex-row"
                )}
              >
                {/* Step Content */}
                <div className={cn(
                  "flex-1 text-center",
                  isMobile ? "" : "md:text-left"
                )}>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <div 
                      className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg step-number"
                      style={{
                        background: isDarkMode 
                          ? `linear-gradient(135deg, ${step.color.dark}20 0%, ${step.color.dark}10 100%)`
                          : `linear-gradient(135deg, ${step.color.light}15 0%, ${step.color.light}05 100%)`,
                        border: `2px solid ${isDarkMode ? step.color.dark + '40' : step.color.light + '30'}`,
                        color: isDarkMode ? step.color.dark : step.color.light,
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {step.number}
                    </div>
                    
                    {/* Arrow connector for non-mobile */}
                    {!isMobile && index < processSteps.length - 1 && (
                      <div className="hidden md:flex items-center">
                        <ArrowRight 
                          className="w-6 h-6 mx-4 arrow-connector"
                          style={{
                            color: isDarkMode ? 'rgba(246, 247, 251, 0.3)' : 'rgba(107, 114, 128, 0.4)',
                            transform: isEven ? 'scaleX(-1)' : 'scaleX(1)'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <h3 
                    className="font-display text-xl md:text-2xl font-medium mb-3 step-title"
                    style={{
                      fontSize: isMobile ? '20px' : '24px',
                      lineHeight: isMobile ? '26px' : '30px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                      fontWeight: 500
                    }}
                  >
                    {step.title}
                  </h3>
                  
                  <p 
                    className="font-text text-base md:text-lg mb-3 step-description"
                    style={{
                      fontSize: isMobile ? '15px' : '17px',
                      lineHeight: isMobile ? '22px' : '26px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                      fontWeight: 400,
                      marginBottom: '12px'
                    }}
                  >
                    {step.description}
                  </p>
                  
                  <p 
                    className="font-text text-sm step-detail"
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      lineHeight: isMobile ? '19px' : '21px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
                      fontWeight: 400
                    }}
                  >
                    {step.detail}
                  </p>
                </div>

                {/* Step Visual */}
                <div className="flex-shrink-0">
                  <div 
                    className="flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-2xl step-visual"
                    style={{
                      background: isDarkMode 
                        ? `linear-gradient(135deg, ${step.color.dark}15 0%, rgba(15, 11, 18, 0.8) 100%)`
                        : `linear-gradient(135deg, ${step.color.light}10 0%, rgba(255, 255, 255, 0.9) 100%)`,
                      border: `1px solid ${isDarkMode ? step.color.dark + '30' : step.color.light + '20'}`,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: isDarkMode 
                        ? `0 8px 32px ${step.color.dark}15`
                        : `0 8px 32px ${step.color.light}10`
                    }}
                  >
                    <IconComponent 
                      className="w-10 h-10 md:w-12 md:h-12"
                      style={{
                        color: isDarkMode ? step.color.dark : step.color.light
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div ref={ctaRef} className="text-center mt-16 md:mt-20">
          <div 
            className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-6 p-6 md:p-8 rounded-2xl how-it-works-cta"
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.1) 0%, rgba(15, 11, 18, 0.8) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(200, 169, 81, 0.2)' : 'rgba(37, 99, 235, 0.15)'}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{
                  background: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb',
                  color: isDarkMode ? 'var(--opulent-plum-900, #0f0b12)' : '#ffffff'
                }}
              >
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 
                  className="font-display text-lg md:text-xl font-medium"
                  style={{
                    fontSize: isMobile ? '17px' : '19px',
                    fontFamily: 'var(--font-display)',
                    color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                    fontWeight: 500,
                    marginBottom: '4px'
                  }}
                >
                  Ready to Get Started?
                </h4>
                <p 
                  className="font-text text-sm"
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                  }}
                >
                  Upload your first manual and see the difference
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                console.log('📄 Upload Manual CTA clicked');
                // Haptic feedback for mobile
                if ('vibrate' in navigator && isMobile) {
                  navigator.vibrate(50);
                }
                // Navigate to upload flow
                window.location.href = '/?upload=manual';
              }}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 cta-button cursor-pointer"
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, var(--opulent-gold, #c8a951) 0%, #b69647 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: isDarkMode ? 'var(--opulent-plum-900, #0f0b12)' : '#ffffff',
                fontSize: isMobile ? '14px' : '15px',
                fontFamily: 'var(--font-text)',
                fontWeight: 500,
                border: 'none',
                boxShadow: isDarkMode 
                  ? '0 4px 16px rgba(200, 169, 81, 0.3)'
                  : '0 4px 16px rgba(37, 99, 235, 0.3)'
              }}
            >
              Upload Manual
            </button>
          </div>
        </div>
      </div>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedHowItWorksSection>
  );
}