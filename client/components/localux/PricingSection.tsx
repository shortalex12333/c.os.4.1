/**
 * Pricing Section - LOCAL UX Implementation
 * Tier comparison animations with interactive pricing cards
 * Blueprint reference: pricing-section-tier-comparison
 */

import React, { useState } from 'react';
import { PricingSection as AnimatedPricingSection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { 
  Check,
  Star,
  Zap,
  Shield,
  Users,
  Compass,
  Crown,
  Clock,
  Database,
  Phone,
  Globe,
  Award
} from '../icons';

interface PricingSectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  highlight?: boolean;
  popular?: boolean;
  icon: React.ComponentType<any>;
  features: string[];
  limits: {
    manuals: string;
    queries: string;
    support: string;
    users: string;
  };
  cta: string;
  badge?: string;
}

interface BillingPeriod {
  id: 'monthly' | 'annual';
  label: string;
  discount?: string;
}

const billingPeriods: BillingPeriod[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual', discount: 'Save 20%' }
];

const pricingTiers: PricingTier[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Perfect for individual yacht owners getting started',
    price: {
      monthly: 299,
      annual: 239
    },
    icon: Compass,
    features: [
      'AI-powered manual search',
      'Confidence scoring',
      'Mobile & desktop access',
      'Basic troubleshooting',
      'Email support'
    ],
    limits: {
      manuals: 'Up to 5 yacht manuals',
      queries: '100 queries/month',
      support: 'Email support',
      users: '1 user account'
    },
    cta: 'Start Exploring'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For yacht managers and small fleet operations',
    price: {
      monthly: 799,
      annual: 639
    },
    highlight: true,
    popular: true,
    icon: Star,
    badge: 'Most Popular',
    features: [
      'Everything in Explorer',
      'Advanced diagnostics',
      'Preventive maintenance alerts',
      'Multi-yacht management',
      'Priority support',
      'Custom integrations'
    ],
    limits: {
      manuals: 'Up to 25 yacht manuals',
      queries: '500 queries/month',
      support: 'Priority phone & email',
      users: 'Up to 5 user accounts'
    },
    cta: 'Go Professional'
  },
  {
    id: 'fleet',
    name: 'Fleet',
    description: 'Comprehensive solution for large yacht operations',
    price: {
      monthly: 1999,
      annual: 1599
    },
    icon: Crown,
    features: [
      'Everything in Professional',
      'Unlimited yacht manuals',
      'API access',
      'Custom AI training',
      'Dedicated account manager',
      '24/7 white-glove support',
      'Advanced analytics',
      'Compliance reporting'
    ],
    limits: {
      manuals: 'Unlimited yacht manuals',
      queries: 'Unlimited queries',
      support: '24/7 dedicated support',
      users: 'Unlimited user accounts'
    },
    cta: 'Contact Sales'
  }
];

const additionalFeatures = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliance, end-to-end encryption'
  },
  {
    icon: Database,
    title: 'Data Sovereignty',
    description: 'Your yacht data stays on your infrastructure'
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Works anywhere in the world, even offline'
  },
  {
    icon: Award,
    title: 'Industry Certified',
    description: 'Maritime safety and yacht industry certified'
  }
];

export function PricingSection({ 
  isMobile = false, 
  isDarkMode = false 
}: PricingSectionProps) {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('annual');

  // CRITICAL: Pricing CTA button click handlers for actual functionality
  const handlePricingCTA = (tierId: string, tierName: string, ctaText: string) => {
    console.log(`💰 Pricing CTA Clicked: ${tierId} - ${tierName} - ${ctaText}`);
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(50);
    }
    
    switch (tierId) {
      case 'explorer':
        // Start with Explorer plan
        window.location.href = '/?plan=explorer&billing=' + selectedBilling;
        break;
      case 'professional':
        // Most popular plan
        window.location.href = '/?plan=professional&billing=' + selectedBilling;
        break;
      case 'fleet':
        // Enterprise - contact sales
        window.location.href = '/?contact=sales&plan=fleet';
        break;
      default:
        console.warn(`Unknown pricing tier: ${tierId}`);
    }
  };

  // Section reveal animations with tier-specific delays
  const { ref: headerRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: billingToggleRef } = useReveal({
    ...revealPresets.scaleIn({
      delay: 0.3,
      threshold: 0.2
    })
  });

  const { ref: pricingGridRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.5,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000
    })
  });

  const { ref: featuresRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.7,
      threshold: 0.2
    })
  });

  return (
    <AnimatedPricingSection
      className="relative py-16 md:py-24 pricing-section"
      blueprintRef="pricing-section-tier-comparison"
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <h2 
            className="font-display text-3xl md:text-5xl font-normal mb-4 pricing-headline"
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
            Choose Your
            <br />
            <span 
              style={{
                color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
              }}
            >
              Maritime AI Solution
            </span>
          </h2>
          <p 
            className="font-text text-lg md:text-xl max-w-3xl mx-auto pricing-subtitle"
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
            Scalable plans for every yacht operation, from individual owners to large fleets
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div ref={billingToggleRef} className="flex justify-center mb-12 md:mb-16">
          <div 
            className="inline-flex p-1 rounded-xl billing-toggle"
            style={{
              background: isDarkMode 
                ? 'rgba(32, 20, 40, 0.6)' 
                : 'rgba(248, 250, 252, 0.8)',
              border: `1px solid ${isDarkMode 
                ? 'rgba(200, 169, 81, 0.2)' 
                : 'rgba(0, 0, 0, 0.08)'}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            {billingPeriods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedBilling(period.id)}
                className={cn(
                  "relative px-6 py-3 rounded-lg transition-all duration-300 billing-button",
                  "flex items-center gap-2"
                )}
                style={{
                  background: selectedBilling === period.id
                    ? isDarkMode 
                      ? 'linear-gradient(135deg, var(--opulent-gold, #c8a951) 0%, var(--opulent-gold-600, #b69647) 100%)' 
                      : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'transparent',
                  color: selectedBilling === period.id
                    ? isDarkMode ? 'var(--opulent-plum-900, #0f0b12)' : '#ffffff'
                    : isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                  fontFamily: 'var(--font-text)',
                  fontWeight: 500,
                  fontSize: isMobile ? '14px' : '16px'
                }}
              >
                <span>{period.label}</span>
                {period.discount && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full discount-badge"
                    style={{
                      background: selectedBilling === period.id
                        ? isDarkMode 
                          ? 'rgba(15, 11, 18, 0.2)' 
                          : 'rgba(255, 255, 255, 0.2)'
                        : isDarkMode 
                          ? 'rgba(34, 197, 94, 0.15)' 
                          : 'rgba(34, 197, 94, 0.1)',
                      color: selectedBilling === period.id
                        ? 'inherit'
                        : '#22c55e',
                      fontSize: '10px',
                      fontWeight: 600
                    }}
                  >
                    {period.discount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Tiers Grid */}
        <div ref={pricingGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
          {pricingTiers.map((tier, index) => {
            const IconComponent = tier.icon;
            const currentPrice = tier.price[selectedBilling];
            
            return (
              <div
                key={tier.id}
                className={cn(
                  "group relative p-6 md:p-8 rounded-xl transition-all duration-300 pricing-card",
                  tier.highlight && "hover:scale-[1.02] md:scale-[1.05]",
                  "transform-gpu"
                )}
                style={{
                  background: tier.highlight
                    ? isDarkMode 
                      ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.15) 0%, rgba(32, 20, 40, 0.8) 100%)' 
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)'
                    : isDarkMode 
                      ? 'rgba(246, 247, 251, 0.03)' 
                      : 'rgba(255, 255, 255, 0.8)',
                  border: `2px solid ${tier.highlight
                    ? isDarkMode 
                      ? 'var(--opulent-gold, #c8a951)' 
                      : '#2563eb'
                    : isDarkMode 
                      ? 'rgba(246, 247, 251, 0.08)' 
                      : 'rgba(0, 0, 0, 0.06)'}`,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                  boxShadow: tier.highlight
                    ? isDarkMode 
                      ? '0 16px 64px rgba(200, 169, 81, 0.2)' 
                      : '0 16px 64px rgba(37, 99, 235, 0.15)'
                    : isDarkMode 
                      ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.08)',
                  transform: tier.highlight ? (isMobile ? 'none' : 'scale(1.05)') : 'none'
                }}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full popular-badge"
                    style={{
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, var(--opulent-gold, #c8a951) 0%, var(--opulent-gold-600, #b69647) 100%)' 
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: isDarkMode ? 'var(--opulent-plum-900, #0f0b12)' : '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'var(--font-text)',
                      fontWeight: 600
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                {/* Tier Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="p-3 rounded-lg tier-icon"
                    style={{
                      background: tier.highlight
                        ? isDarkMode 
                          ? 'rgba(200, 169, 81, 0.2)' 
                          : 'rgba(37, 99, 235, 0.1)'
                        : isDarkMode 
                          ? 'rgba(246, 247, 251, 0.05)' 
                          : 'rgba(248, 250, 252, 0.8)'
                    }}
                  >
                    <IconComponent 
                      className="w-6 h-6"
                      style={{
                        color: tier.highlight
                          ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                          : isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                      }}
                    />
                  </div>
                  <div>
                    <h3 
                      className="font-display text-xl md:text-2xl font-medium tier-name"
                      style={{
                        fontSize: isMobile ? '18px' : '22px',
                        lineHeight: isMobile ? '24px' : '28px',
                        fontFamily: 'var(--font-display)',
                        color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                        fontWeight: 500
                      }}
                    >
                      {tier.name}
                    </h3>
                    <p 
                      className="font-text text-sm tier-description"
                      style={{
                        fontSize: isMobile ? '13px' : '14px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
                        fontWeight: 400
                      }}
                    >
                      {tier.description}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6 pricing-amount">
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="font-display text-3xl md:text-4xl font-semibold price-amount"
                      style={{
                        fontSize: isMobile ? '28px' : '36px',
                        lineHeight: isMobile ? '32px' : '40px',
                        fontFamily: 'var(--font-display)',
                        color: tier.highlight
                          ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                          : isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                        fontWeight: 600
                      }}
                    >
                      ${currentPrice.toLocaleString()}
                    </span>
                    <span 
                      className="font-text text-base price-period"
                      style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280',
                        fontWeight: 400
                      }}
                    >
                      /{selectedBilling === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {selectedBilling === 'annual' && (
                    <p 
                      className="font-text text-xs mt-1 savings-note"
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-text)',
                        color: '#22c55e',
                        fontWeight: 500
                      }}
                    >
                      Save ${((tier.price.monthly * 12) - tier.price.annual).toLocaleString()}/year
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="mb-6 space-y-2 tier-limits">
                  {Object.entries(tier.limits).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div 
                        className="w-1.5 h-1.5 rounded-full limit-indicator"
                        style={{
                          background: tier.highlight
                            ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                            : isDarkMode ? 'rgba(246, 247, 251, 0.4)' : '#6b7280'
                        }}
                      />
                      <span 
                        className="font-text text-sm limit-text"
                        style={{
                          fontSize: isMobile ? '12px' : '13px',
                          fontFamily: 'var(--font-text)',
                          color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                          fontWeight: 400
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="mb-8 space-y-3 tier-features">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <Check 
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{
                          color: tier.highlight
                            ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                            : '#22c55e'
                        }}
                      />
                      <span 
                        className="font-text text-sm feature-text"
                        style={{
                          fontSize: isMobile ? '13px' : '14px',
                          lineHeight: isMobile ? '18px' : '20px',
                          fontFamily: 'var(--font-text)',
                          color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                          fontWeight: 400
                        }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePricingCTA(tier.id, tier.name, tier.cta)}
                  className="w-full py-3 md:py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] cta-button cursor-pointer"
                  style={{
                    background: tier.highlight
                      ? isDarkMode 
                        ? 'linear-gradient(135deg, var(--opulent-gold, #c8a951) 0%, var(--opulent-gold-600, #b69647) 100%)' 
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : isDarkMode 
                        ? 'rgba(246, 247, 251, 0.08)' 
                        : 'rgba(37, 99, 235, 0.08)',
                    color: tier.highlight
                      ? isDarkMode ? 'var(--opulent-plum-900, #0f0b12)' : '#ffffff'
                      : isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb',
                    border: tier.highlight 
                      ? 'none'
                      : `1px solid ${isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'}`,
                    fontFamily: 'var(--font-text)',
                    fontWeight: 500,
                    fontSize: isMobile ? '14px' : '16px',
                    boxShadow: tier.highlight
                      ? isDarkMode 
                        ? '0 8px 32px rgba(200, 169, 81, 0.3)' 
                        : '0 8px 32px rgba(37, 99, 235, 0.25)'
                      : 'none'
                  }}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Features */}
        <div ref={featuresRef} className="text-center">
          <h3 
            className="font-display text-2xl md:text-3xl font-medium mb-8 md:mb-12 features-header"
            style={{
              fontSize: isMobile ? '22px' : '30px',
              lineHeight: isMobile ? '28px' : '36px',
              fontFamily: 'var(--font-display)',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontWeight: 500
            }}
          >
            Enterprise-Grade Features Included
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={index}
                  className="text-center feature-item"
                  style={{
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`
                  }}
                >
                  <div 
                    className="inline-flex p-4 mb-4 rounded-xl feature-icon-wrapper"
                    style={{
                      background: isDarkMode 
                        ? 'rgba(200, 169, 81, 0.1)' 
                        : 'rgba(37, 99, 235, 0.08)'
                    }}
                  >
                    <IconComponent 
                      className="w-6 h-6"
                      style={{
                        color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                      }}
                    />
                  </div>
                  
                  <h4 
                    className="font-display text-lg font-medium mb-2 feature-title"
                    style={{
                      fontSize: isMobile ? '16px' : '18px',
                      lineHeight: isMobile ? '20px' : '24px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                      fontWeight: 500
                    }}
                  >
                    {feature.title}
                  </h4>
                  
                  <p 
                    className="font-text text-sm feature-description"
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      lineHeight: isMobile ? '18px' : '20px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                      fontWeight: 400
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedPricingSection>
  );
}