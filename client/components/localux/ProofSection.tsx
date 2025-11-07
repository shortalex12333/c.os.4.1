/**
 * Proof Section - LOCAL UX Implementation
 * Evidence presentation with reveals and social proof integration
 * Blueprint reference: proof-section-evidence-presentation
 */

import React from 'react';
import { ProofSection as AnimatedProofSection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { 
  Trophy, 
  Users, 
  Clock, 
  TrendingUp, 
  Star, 
  Shield, 
  Award,
  CheckCircle,
  BarChart3,
  Zap,
  Target
} from '../icons';

interface ProofSectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

interface MetricItem {
  id: string;
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  highlight?: boolean;
}

interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  yacht: string;
  metric?: string;
  avatar?: string;
}

interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  icon: React.ComponentType<any>;
  description: string;
}

const performanceMetrics: MetricItem[] = [
  {
    id: 'accuracy',
    value: '98.7%',
    label: 'Solution Accuracy',
    icon: Target,
    description: 'Based on verification against official yacht manuals',
    highlight: true
  },
  {
    id: 'response-time',
    value: '12sec',
    label: 'Avg Response Time',
    icon: Clock,
    description: 'From query to verified solution delivery',
    highlight: false
  },
  {
    id: 'coverage',
    value: '2,400+',
    label: 'Manual Pages Indexed',
    icon: BarChart3,
    description: 'Comprehensive coverage of yacht systems',
    highlight: false
  },
  {
    id: 'satisfaction',
    value: '94%',
    label: 'User Satisfaction',
    icon: TrendingUp,
    description: 'Based on post-resolution feedback',
    highlight: true
  }
];

const clientTestimonials: TestimonialItem[] = [
  {
    id: 'captain-martinez',
    quote: "CelesteOS saved us 6 hours on a critical engine diagnostic. The AI found the exact procedure in our Caterpillar manual that we'd been searching for all morning.",
    author: "Captain Rodriguez",
    role: "Master Mariner",
    yacht: "M/Y Serenity (65m)",
    metric: "6hr time saved"
  },
  {
    id: 'chief-engineer',
    quote: "The confidence scores give me exactly what I need to make quick decisions. When CelesteOS shows 96% confidence with OEM manual citations, I trust it completely.",
    author: "James Mitchell",
    role: "Chief Engineer",
    yacht: "M/Y Apex (78m)",
    metric: "96% avg confidence"
  },
  {
    id: 'fleet-manager',
    quote: "Our maintenance efficiency improved 340% after implementing CelesteOS. Every crew member can now access expert-level troubleshooting instantly.",
    author: "Sarah Chen",
    role: "Fleet Operations",
    yacht: "Northern Star Fleet",
    metric: "340% efficiency gain"
  }
];

const certifications: CertificationItem[] = [
  {
    id: 'maritime-safety',
    title: 'Maritime Safety Certified',
    issuer: 'International Maritime Organization',
    icon: Shield,
    description: 'Compliance with SOLAS and maritime safety standards'
  },
  {
    id: 'yacht-excellence',
    title: 'Yacht Industry Excellence',
    issuer: 'Superyacht Builders Association',
    icon: Award,
    description: 'Recognized for innovation in yacht technology'
  },
  {
    id: 'ai-accuracy',
    title: 'AI Accuracy Verified',
    issuer: 'Marine Technology Institute',
    icon: CheckCircle,
    description: 'Third-party validation of AI solution accuracy'
  }
];

export function ProofSection({ 
  isMobile = false, 
  isDarkMode = false 
}: ProofSectionProps) {

  // Section reveal animations with progressive disclosure
  const { ref: headerRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: metricsRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.3,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000
    })
  });

  const { ref: testimonialsRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.5,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000
    })
  });

  const { ref: certificationsRef } = useReveal({
    ...revealPresets.scaleIn({
      delay: 0.7,
      threshold: 0.2
    })
  });

  return (
    <AnimatedProofSection
      className="relative py-16 md:py-24 proof-section"
      blueprintRef="proof-section-evidence-presentation"
    >
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <h2 
            className="font-display text-3xl md:text-5xl font-normal mb-4 proof-headline"
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
            Proven Results from
            <br />
            <span 
              style={{
                color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
              }}
            >
              Elite Yacht Operations
            </span>
          </h2>
          <p 
            className="font-text text-lg md:text-xl max-w-3xl mx-auto proof-subtitle"
            style={{
              fontSize: isMobile ? '16px' : '18px',
              lineHeight: isMobile ? '24px' : '28px',
              fontFamily: 'var(--font-text)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.75)' : '#6b7280',
              fontWeight: 400,
              letterSpacing: '0.01em',
              textWrap: 'pretty'
            }}
          >
            Trusted by yacht professionals worldwide for mission-critical operations
          </p>
        </div>

        {/* Performance Metrics Grid */}
        <div ref={metricsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-20">
          {performanceMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            
            return (
              <div
                key={metric.id}
                className={cn(
                  "group p-4 md:p-6 rounded-xl transition-all duration-300 metric-card",
                  metric.highlight && "hover:scale-[1.02]"
                )}
                style={{
                  background: metric.highlight
                    ? isDarkMode 
                      ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.12) 0%, rgba(15, 11, 18, 0.8) 100%)' 
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)'
                    : isDarkMode 
                      ? 'rgba(246, 247, 251, 0.03)' 
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${metric.highlight
                    ? isDarkMode 
                      ? 'rgba(200, 169, 81, 0.25)' 
                      : 'rgba(37, 99, 235, 0.2)'
                    : isDarkMode 
                      ? 'rgba(246, 247, 251, 0.08)' 
                      : 'rgba(0, 0, 0, 0.06)'}`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                  boxShadow: metric.highlight
                    ? isDarkMode 
                      ? '0 8px 32px rgba(200, 169, 81, 0.15)' 
                      : '0 8px 32px rgba(37, 99, 235, 0.1)'
                    : 'none'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <IconComponent 
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{
                      color: metric.highlight
                        ? isDarkMode 
                          ? 'var(--opulent-gold, #c8a951)' 
                          : '#2563eb'
                        : isDarkMode 
                          ? 'rgba(246, 247, 251, 0.6)' 
                          : '#6b7280'
                    }}
                  />
                  {metric.highlight && (
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                      }}
                    />
                  )}
                </div>
                
                <div 
                  className="font-display text-2xl md:text-3xl font-semibold mb-1 metric-value"
                  style={{
                    fontSize: isMobile ? '20px' : '28px',
                    lineHeight: isMobile ? '24px' : '32px',
                    fontFamily: 'var(--font-display)',
                    color: metric.highlight
                      ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                      : isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                    fontWeight: 600
                  }}
                >
                  {metric.value}
                </div>
                
                <div 
                  className="font-text text-sm font-medium mb-2 metric-label"
                  style={{
                    fontSize: isMobile ? '12px' : '14px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                    fontWeight: 500
                  }}
                >
                  {metric.label}
                </div>
                
                <p 
                  className="font-text text-xs metric-desc"
                  style={{
                    fontSize: isMobile ? '11px' : '12px',
                    lineHeight: isMobile ? '14px' : '16px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
                    fontWeight: 400
                  }}
                >
                  {metric.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Client Testimonials */}
        <div ref={testimonialsRef} className="mb-16 md:mb-20">
          <h3 
            className="font-display text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12 testimonials-header"
            style={{
              fontSize: isMobile ? '22px' : '30px',
              lineHeight: isMobile ? '28px' : '36px',
              fontFamily: 'var(--font-display)',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontWeight: 500
            }}
          >
            Trusted by Maritime Professionals
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {clientTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="group p-6 md:p-8 rounded-xl transition-all duration-300 hover:scale-[1.01] testimonial-card"
                style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(32, 20, 40, 0.6) 0%, rgba(15, 11, 18, 0.8) 100%)' 
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
                  border: `1px solid ${isDarkMode 
                    ? 'rgba(200, 169, 81, 0.15)' 
                    : 'rgba(37, 99, 235, 0.1)'}`,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Metric Badge */}
                {testimonial.metric && (
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full testimonial-metric"
                    style={{
                      background: isDarkMode 
                        ? 'rgba(34, 197, 94, 0.15)' 
                        : 'rgba(34, 197, 94, 0.1)',
                      border: `1px solid ${isDarkMode 
                        ? 'rgba(34, 197, 94, 0.25)' 
                        : 'rgba(34, 197, 94, 0.2)'}`
                    }}
                  >
                    <Star 
                      className="w-3 h-3"
                      style={{ color: '#22c55e' }}
                    />
                    <span 
                      className="font-text text-xs font-medium"
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-text)',
                        color: '#22c55e',
                        fontWeight: 600
                      }}
                    >
                      {testimonial.metric}
                    </span>
                  </div>
                )}
                
                {/* Quote */}
                <blockquote 
                  className="font-text text-base mb-6 testimonial-quote"
                  style={{
                    fontSize: isMobile ? '14px' : '16px',
                    lineHeight: isMobile ? '20px' : '24px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.85)' : '#374151',
                    fontWeight: 400,
                    fontStyle: 'italic'
                  }}
                >
                  "{testimonial.quote}"
                </blockquote>
                
                {/* Author Info */}
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center testimonial-avatar"
                    style={{
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, var(--opulent-gold, #c8a951) 0%, var(--opulent-gold-600, #b69647) 100%)' 
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    }}
                  >
                    <span 
                      className="font-display font-medium"
                      style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--opulent-plum-900, #0f0b12)' : '#ffffff',
                        fontWeight: 500
                      }}
                    >
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  <div>
                    <div 
                      className="font-display text-sm font-medium testimonial-author"
                      style={{
                        fontSize: isMobile ? '13px' : '14px',
                        fontFamily: 'var(--font-display)',
                        color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                        fontWeight: 500
                      }}
                    >
                      {testimonial.author}
                    </div>
                    <div 
                      className="font-text text-xs testimonial-role"
                      style={{
                        fontSize: isMobile ? '11px' : '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
                        fontWeight: 400
                      }}
                    >
                      {testimonial.role}
                    </div>
                    <div 
                      className="font-text text-xs testimonial-yacht"
                      style={{
                        fontSize: isMobile ? '11px' : '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb',
                        fontWeight: 500
                      }}
                    >
                      {testimonial.yacht}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications & Awards */}
        <div ref={certificationsRef} className="text-center">
          <h3 
            className="font-display text-2xl md:text-3xl font-medium mb-8 md:mb-12 certifications-header"
            style={{
              fontSize: isMobile ? '22px' : '30px',
              lineHeight: isMobile ? '28px' : '36px',
              fontFamily: 'var(--font-display)',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontWeight: 500
            }}
          >
            Industry Recognition
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {certifications.map((cert, index) => {
              const IconComponent = cert.icon;
              
              return (
                <div
                  key={cert.id}
                  className="group p-6 md:p-8 rounded-xl transition-all duration-300 certification-card"
                  style={{
                    background: isDarkMode 
                      ? 'rgba(246, 247, 251, 0.02)' 
                      : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${isDarkMode 
                      ? 'rgba(246, 247, 251, 0.08)' 
                      : 'rgba(0, 0, 0, 0.06)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`
                  }}
                >
                  <IconComponent 
                    className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-4"
                    style={{
                      color: isDarkMode 
                        ? 'var(--opulent-gold, #c8a951)' 
                        : '#2563eb'
                    }}
                  />
                  
                  <h4 
                    className="font-display text-lg md:text-xl font-medium mb-2 cert-title"
                    style={{
                      fontSize: isMobile ? '16px' : '18px',
                      lineHeight: isMobile ? '20px' : '24px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                      fontWeight: 500
                    }}
                  >
                    {cert.title}
                  </h4>
                  
                  <p 
                    className="font-text text-sm mb-3 cert-issuer"
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb',
                      fontWeight: 500
                    }}
                  >
                    {cert.issuer}
                  </p>
                  
                  <p 
                    className="font-text text-xs cert-desc"
                    style={{
                      fontSize: isMobile ? '11px' : '12px',
                      lineHeight: isMobile ? '16px' : '18px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
                      fontWeight: 400
                    }}
                  >
                    {cert.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedProofSection>
  );
}