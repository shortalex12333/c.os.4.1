/**
 * Problem→Relief Section - LOCAL UX Implementation
 * Desat→color shift with microcopy integration
 * Blueprint reference: problem-relief-desat-color-shift
 */

import React from 'react';
import { ProblemReliefSection as AnimatedProblemReliefSection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { AlertTriangle, CheckCircle, Clock, Search, Shield, Target } from 'lucide-react';

interface ProblemReliefSectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

interface ProblemItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  microcopy: string;
}

interface ReliefItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  microcopy: string;
  highlight?: string;
}

const problemItems: ProblemItem[] = [
  {
    id: 'slow-search',
    title: 'Slow Manual Searches',
    description: 'Hours spent digging through yacht manuals and technical docs',
    icon: Search,
    microcopy: 'avg. 45min per search'
  },
  {
    id: 'unreliable-info',
    title: 'Unreliable Information',
    description: 'Outdated procedures and conflicting advice from online sources',
    icon: AlertTriangle,
    microcopy: '73% accuracy rate'
  },
  {
    id: 'critical-downtime',
    title: 'Critical System Downtime',
    description: 'Equipment failures that could have been prevented with proper guidance',
    icon: Clock,
    microcopy: 'avg. 8hr delays'
  }
];

const reliefItems: ReliefItem[] = [
  {
    id: 'instant-answers',
    title: 'Instant Expert Answers',
    description: 'Get precise solutions from your yacht\'s actual manuals in seconds',
    icon: Target,
    microcopy: 'avg. 12sec response',
    highlight: '225x faster'
  },
  {
    id: 'verified-procedures',
    title: 'Verified Procedures',
    description: 'Every solution is sourced from official manuals with confidence scores',
    icon: CheckCircle,
    microcopy: '98.7% accuracy rate',
    highlight: 'OEM-sourced'
  },
  {
    id: 'proactive-maintenance',
    title: 'Proactive Maintenance',
    description: 'Prevent issues before they become costly problems',
    icon: Shield,
    microcopy: 'prevent 89% of issues',
    highlight: 'Zero downtime'
  }
];

export function ProblemReliefSection({ 
  isMobile = false, 
  isDarkMode = false 
}: ProblemReliefSectionProps) {

  // Section reveal animations
  const { ref: problemHeaderRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: problemGridRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.3,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000 // Convert ms to seconds for GSAP
    })
  });

  const { ref: reliefHeaderRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: reliefGridRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.3,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000 // Convert ms to seconds for GSAP
    })
  });

  return (
    <AnimatedProblemReliefSection
      className="relative py-16 md:py-24 problem-relief-section"
      blueprintRef="problem-relief-desat-color-shift"
    >
      {/* Problem Section - Desaturated */}
      <div className="relative mb-16 md:mb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Problem Header */}
          <div ref={problemHeaderRef} className="text-center mb-12 md:mb-16">
            <h2 
              className="font-display text-3xl md:text-5xl font-normal mb-4 problem-headline"
              style={{
                fontSize: isMobile ? '28px' : '48px',
                lineHeight: isMobile ? '34px' : '56px',
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : 'rgba(31, 41, 55, 0.7)', // Desaturated
                letterSpacing: '-0.02em',
                textWrap: 'balance'
              }}
            >
              The Hidden Cost of
              <br />
              <span 
                style={{
                  color: isDarkMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.6)' // Desaturated red
                }}
              >
                Manual Troubleshooting
              </span>
            </h2>
            <p 
              className="font-text text-lg md:text-xl max-w-3xl mx-auto problem-subtitle"
              style={{
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: isMobile ? '24px' : '28px',
                fontFamily: 'var(--font-text)',
                color: isDarkMode ? 'rgba(246, 247, 251, 0.5)' : 'rgba(107, 114, 128, 0.8)', // Desaturated
                fontWeight: 400,
                letterSpacing: '0.01em',
                textWrap: 'pretty'
              }}
            >
              Every minute spent searching through manuals is time your yacht isn't performing at its best
            </p>
          </div>

          {/* Problem Grid - Desaturated styling */}
          <div ref={problemGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {problemItems.map((item, index) => {
              const IconComponent = item.icon;
              
              return (
                <div
                  key={item.id}
                  className="group p-6 md:p-8 rounded-xl transition-all duration-300 problem-card"
                  style={{
                    background: isDarkMode 
                      ? 'rgba(15, 11, 18, 0.3)' 
                      : 'rgba(255, 255, 255, 0.4)', // Desaturated background
                    border: `1px solid ${isDarkMode 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.05)'}`, // Subtle border
                    backdropFilter: 'blur(8px) saturate(0.7)', // Desaturate backdrop
                    WebkitBackdropFilter: 'blur(8px) saturate(0.7)',
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <IconComponent 
                      className="w-6 h-6 md:w-7 md:h-7"
                      style={{
                        color: isDarkMode 
                          ? 'rgba(239, 68, 68, 0.4)' 
                          : 'rgba(220, 38, 38, 0.5)' // Desaturated red icons
                      }}
                    />
                    <span 
                      className="font-text text-xs md:text-sm font-medium uppercase tracking-wide microcopy"
                      style={{
                        fontSize: isMobile ? '10px' : '11px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode 
                          ? 'rgba(239, 68, 68, 0.5)' 
                          : 'rgba(220, 38, 38, 0.6)', // Desaturated red
                        letterSpacing: '1px'
                      }}
                    >
                      {item.microcopy}
                    </span>
                  </div>
                  
                  <h3 
                    className="font-display text-xl md:text-2xl font-medium mb-3 problem-card-title"
                    style={{
                      fontSize: isMobile ? '18px' : '22px',
                      lineHeight: isMobile ? '24px' : '28px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : 'rgba(31, 41, 55, 0.8)', // Desaturated
                      fontWeight: 500
                    }}
                  >
                    {item.title}
                  </h3>
                  
                  <p 
                    className="font-text text-base problem-card-desc"
                    style={{
                      fontSize: isMobile ? '14px' : '16px',
                      lineHeight: isMobile ? '20px' : '24px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.5)' : 'rgba(107, 114, 128, 0.7)', // Desaturated
                      fontWeight: 400
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transition Arrow/Divider */}
      <div className="flex justify-center mb-16 md:mb-24 transition-indicator">
        <div 
          className="flex items-center gap-4 px-6 py-3 rounded-full transition-colors-indicator"
          style={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(15, 11, 18, 0.8) 0%, rgba(37, 99, 235, 0.1) 100%)' 
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(37, 99, 235, 0.1) 100%)',
            border: `1px solid ${isDarkMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.15)'}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <span 
            className="font-text text-sm font-medium"
            style={{
              fontSize: isMobile ? '13px' : '14px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontWeight: 500
            }}
          >
            There's a better way
          </span>
        </div>
      </div>

      {/* Relief Section - Full Color */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6">
          {/* Relief Header */}
          <div ref={reliefHeaderRef} className="text-center mb-12 md:mb-16">
            <h2 
              className="font-display text-3xl md:text-5xl font-normal mb-4 relief-headline"
              style={{
                fontSize: isMobile ? '28px' : '48px',
                lineHeight: isMobile ? '34px' : '56px',
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937', // Full color
                letterSpacing: '-0.02em',
                textWrap: 'balance'
              }}
            >
              Meet Your
              <br />
              <span 
                style={{
                  color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb' // Full color
                }}
              >
                AI Yacht Expert
              </span>
            </h2>
            <p 
              className="font-text text-lg md:text-xl max-w-3xl mx-auto relief-subtitle"
              style={{
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: isMobile ? '24px' : '28px',
                fontFamily: 'var(--font-text)',
                color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#6b7280', // Full color
                fontWeight: 400,
                letterSpacing: '0.01em',
                textWrap: 'pretty'
              }}
            >
              Instant access to verified solutions from your yacht's technical manuals
            </p>
          </div>

          {/* Relief Grid - Full color styling */}
          <div ref={reliefGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {reliefItems.map((item, index) => {
              const IconComponent = item.icon;
              
              return (
                <div
                  key={item.id}
                  className="group p-6 md:p-8 rounded-xl transition-all duration-300 hover:scale-[1.02] relief-card"
                  style={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.08) 0%, rgba(15, 11, 18, 0.6) 100%)' 
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%)', // Full color gradients
                    border: `1px solid ${isDarkMode 
                      ? 'rgba(200, 169, 81, 0.2)' 
                      : 'rgba(37, 99, 235, 0.15)'}`, // Colored borders
                    backdropFilter: 'blur(12px) saturate(1.1)', // Enhance saturation
                    WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                    boxShadow: isDarkMode 
                      ? '0 8px 32px rgba(200, 169, 81, 0.12)' 
                      : '0 8px 32px rgba(37, 99, 235, 0.08)' // Colored shadows
                  }}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <IconComponent 
                        className="w-6 h-6 md:w-7 md:h-7"
                        style={{
                          color: isDarkMode 
                            ? 'var(--opulent-gold, #c8a951)' 
                            : '#2563eb' // Full color icons
                        }}
                      />
                      <span 
                        className="font-text text-xs md:text-sm font-medium uppercase tracking-wide microcopy"
                        style={{
                          fontSize: isMobile ? '10px' : '11px',
                          fontFamily: 'var(--font-text)',
                          color: isDarkMode 
                            ? 'var(--opulent-gold, #c8a951)' 
                            : '#2563eb', // Full color
                          letterSpacing: '1px'
                        }}
                      >
                        {item.microcopy}
                      </span>
                    </div>
                    
                    {/* Highlight badge */}
                    {item.highlight && (
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full highlight-badge"
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-text)',
                          background: isDarkMode 
                            ? 'rgba(34, 197, 94, 0.15)' 
                            : 'rgba(34, 197, 94, 0.1)',
                          color: isDarkMode 
                            ? '#22c55e' 
                            : '#16a34a', // Green success color
                          fontWeight: 600
                        }}
                      >
                        {item.highlight}
                      </span>
                    )}
                  </div>
                  
                  <h3 
                    className="font-display text-xl md:text-2xl font-medium mb-3 relief-card-title"
                    style={{
                      fontSize: isMobile ? '18px' : '22px',
                      lineHeight: isMobile ? '24px' : '28px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937', // Full color
                      fontWeight: 500
                    }}
                  >
                    {item.title}
                  </h3>
                  
                  <p 
                    className="font-text text-base relief-card-desc"
                    style={{
                      fontSize: isMobile ? '14px' : '16px',
                      lineHeight: isMobile ? '20px' : '24px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#6b7280', // Full color
                      fontWeight: 400
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedProblemReliefSection>
  );
}