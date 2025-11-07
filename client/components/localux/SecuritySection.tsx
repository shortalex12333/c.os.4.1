/**
 * Security Section - LOCAL UX Implementation
 * Offline-first diagram with opacity-only transitions and security feature highlights
 * Blueprint reference: security-section-offline-first-diagram
 */

import React, { useState } from 'react';
import { SecuritySection as AnimatedSecuritySection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { 
  Shield,
  Lock,
  Database,
  Wifi,
  WifiOff,
  Server,
  Key,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Globe,
  HardDrive,
  Network,
  Smartphone,
  Monitor,
  Cloud,
  Router
} from '../icons';

interface SecuritySectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

interface SecurityFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'encryption' | 'access' | 'compliance' | 'infrastructure';
  highlight?: boolean;
}

interface DataFlowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  position: { x: number; y: number };
  connections: string[];
  offline: boolean;
}

const securityFeatures: SecurityFeature[] = [
  {
    id: 'end-to-end-encryption',
    title: 'End-to-End Encryption',
    description: 'AES-256 encryption for all data in transit and at rest',
    icon: Lock,
    category: 'encryption',
    highlight: true
  },
  {
    id: 'zero-trust-architecture',
    title: 'Zero Trust Architecture',
    description: 'Every access request is verified, nothing is trusted by default',
    icon: Shield,
    category: 'access'
  },
  {
    id: 'offline-first-design',
    title: 'Offline-First Design',
    description: 'Full functionality without internet connectivity',
    icon: WifiOff,
    category: 'infrastructure',
    highlight: true
  },
  {
    id: 'role-based-access',
    title: 'Role-Based Access Control',
    description: 'Granular permissions for different user roles',
    icon: Key,
    category: 'access'
  },
  {
    id: 'audit-logging',
    title: 'Comprehensive Audit Logs',
    description: 'Complete audit trail of all system activities',
    icon: FileText,
    category: 'compliance'
  },
  {
    id: 'data-sovereignty',
    title: 'Data Sovereignty',
    description: 'Your data never leaves your infrastructure',
    icon: Database,
    category: 'infrastructure',
    highlight: true
  },
  {
    id: 'privacy-by-design',
    title: 'Privacy by Design',
    description: 'GDPR compliant with privacy built into every feature',
    icon: Eye,
    category: 'compliance'
  },
  {
    id: 'secure-enclaves',
    title: 'Hardware Security Modules',
    description: 'Dedicated security hardware for sensitive operations',
    icon: Server,
    category: 'encryption'
  }
];

const dataFlowSteps: DataFlowStep[] = [
  {
    id: 'yacht-device',
    title: 'Yacht Device',
    description: 'iPad/Laptop on yacht',
    icon: Smartphone,
    position: { x: 10, y: 20 },
    connections: ['local-server'],
    offline: true
  },
  {
    id: 'local-server',
    title: 'Local Server',
    description: 'On-board CelesteOS server',
    icon: Server,
    position: { x: 40, y: 20 },
    connections: ['yacht-network', 'manual-storage'],
    offline: true
  },
  {
    id: 'yacht-network',
    title: 'Yacht Network',
    description: 'Isolated LAN environment',
    icon: Router,
    position: { x: 70, y: 20 },
    connections: ['bridge-systems'],
    offline: true
  },
  {
    id: 'manual-storage',
    title: 'Manual Storage',
    description: 'Local encrypted database',
    icon: HardDrive,
    position: { x: 40, y: 50 },
    connections: [],
    offline: true
  },
  {
    id: 'bridge-systems',
    title: 'Bridge Systems',
    description: 'Navigation & monitoring',
    icon: Monitor,
    position: { x: 90, y: 35 },
    connections: ['satellite-link'],
    offline: true
  },
  {
    id: 'satellite-link',
    title: 'Satellite Link',
    description: 'Optional external connectivity',
    icon: Globe,
    position: { x: 90, y: 65 },
    connections: ['cloud-backup'],
    offline: false
  },
  {
    id: 'cloud-backup',
    title: 'Cloud Backup',
    description: 'Encrypted remote backup',
    icon: Cloud,
    position: { x: 70, y: 80 },
    connections: [],
    offline: false
  }
];

export function SecuritySection({ 
  isMobile = false, 
  isDarkMode = false 
}: SecuritySectionProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);

  // Section reveal animations with progressive disclosure
  const { ref: headerRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: diagramRef } = useReveal({
    ...revealPresets.scaleIn({
      delay: 0.3,
      threshold: 0.2
    })
  });

  const { ref: featuresRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.5,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000
    })
  });

  const { ref: complianceRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.7,
      threshold: 0.2
    })
  });

  const filteredSteps = showOfflineOnly 
    ? dataFlowSteps.filter(step => step.offline)
    : dataFlowSteps;

  return (
    <AnimatedSecuritySection
      className="relative py-16 md:py-24 security-section"
      blueprintRef="security-section-offline-first-diagram"
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <h2 
            className="font-display text-3xl md:text-5xl font-normal mb-4 security-headline"
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
            Military-Grade
            <br />
            <span 
              style={{
                color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
              }}
            >
              Security & Privacy
            </span>
          </h2>
          <p 
            className="font-text text-lg md:text-xl max-w-3xl mx-auto security-subtitle"
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
            Designed for complete privacy and operational security, even when disconnected from the internet
          </p>
        </div>

        {/* Offline-First Architecture Diagram */}
        <div ref={diagramRef} className="mb-16 md:mb-20">
          <div className="text-center mb-8">
            <h3 
              className="font-display text-2xl md:text-3xl font-medium mb-4 diagram-title"
              style={{
                fontSize: isMobile ? '22px' : '30px',
                lineHeight: isMobile ? '28px' : '36px',
                fontFamily: 'var(--font-display)',
                color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                fontWeight: 500
              }}
            >
              Offline-First Data Flow
            </h3>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span 
                className="font-text text-sm"
                style={{
                  fontFamily: 'var(--font-text)',
                  color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                  fontWeight: 400
                }}
              >
                Show all systems
              </span>
              <button
                onClick={() => setShowOfflineOnly(!showOfflineOnly)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none offline-toggle"
                style={{
                  background: showOfflineOnly
                    ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                    : isDarkMode ? 'rgba(246, 247, 251, 0.2)' : '#d1d5db'
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 toggle-thumb"
                  style={{
                    transform: showOfflineOnly ? 'translateX(1.5rem)' : 'translateX(0.25rem)'
                  }}
                />
              </button>
              <span 
                className="font-text text-sm"
                style={{
                  fontFamily: 'var(--font-text)',
                  color: showOfflineOnly
                    ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                    : isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                  fontWeight: showOfflineOnly ? 500 : 400
                }}
              >
                Offline-only systems
              </span>
            </div>
          </div>

          {/* Interactive Diagram */}
          <div 
            className="relative w-full rounded-xl p-8 md:p-12 data-flow-diagram"
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(32, 20, 40, 0.6) 0%, rgba(15, 11, 18, 0.8) 100%)' 
                : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
              border: `1px solid ${isDarkMode 
                ? 'rgba(200, 169, 81, 0.2)' 
                : 'rgba(37, 99, 235, 0.15)'}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              minHeight: isMobile ? '400px' : '500px'
            }}
          >
            {/* Connection Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none connection-lines"
              style={{ zIndex: 1 }}
            >
              {filteredSteps.map((step) =>
                step.connections.map((connectionId) => {
                  const connectedStep = filteredSteps.find(s => s.id === connectionId);
                  if (!connectedStep) return null;
                  
                  const startX = `${step.position.x}%`;
                  const startY = `${step.position.y}%`;
                  const endX = `${connectedStep.position.x}%`;
                  const endY = `${connectedStep.position.y}%`;
                  
                  return (
                    <line
                      key={`${step.id}-${connectionId}`}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={
                        (step.offline && connectedStep.offline) || showOfflineOnly
                          ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                          : isDarkMode ? 'rgba(246, 247, 251, 0.3)' : '#d1d5db'
                      }
                      strokeWidth="2"
                      strokeDasharray={
                        !(step.offline && connectedStep.offline) && !showOfflineOnly ? '4 4' : 'none'
                      }
                      className="transition-all duration-300"
                      style={{
                        opacity: showOfflineOnly && (!step.offline || !connectedStep.offline) ? 0.3 : 1
                      }}
                    />
                  );
                })
              )}
            </svg>

            {/* System Nodes */}
            {filteredSteps.map((step, index) => {
              const IconComponent = step.icon;
              const isSelected = selectedStep === step.id;
              const isOfflineHighlighted = showOfflineOnly && step.offline;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(isSelected ? null : step.id)}
                  className="absolute group transition-all duration-300 transform hover:scale-105 system-node"
                  style={{
                    left: `${step.position.x}%`,
                    top: `${step.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected ? 10 : 2,
                    animationDelay: `${index * (localHouseConfig.motion.stagger * 0.5)}ms`
                  }}
                >
                  <div 
                    className={cn(
                      "relative p-4 rounded-xl transition-all duration-300",
                      isSelected && "scale-110"
                    )}
                    style={{
                      background: isSelected || isOfflineHighlighted
                        ? isDarkMode 
                          ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.2) 0%, rgba(32, 20, 40, 0.9) 100%)' 
                          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)'
                        : isDarkMode 
                          ? 'rgba(246, 247, 251, 0.05)' 
                          : 'rgba(255, 255, 255, 0.8)',
                      border: `2px solid ${isSelected || isOfflineHighlighted
                        ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                        : isDarkMode ? 'rgba(246, 247, 251, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      opacity: showOfflineOnly && !step.offline ? 0.4 : 1,
                      minWidth: isMobile ? '80px' : '100px'
                    }}
                  >
                    {/* Offline Indicator */}
                    {step.offline && (
                      <div 
                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full offline-indicator"
                        style={{
                          background: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#22c55e',
                          border: '2px solid currentColor'
                        }}
                      />
                    )}
                    
                    <IconComponent 
                      className={cn(
                        "w-6 h-6 mx-auto mb-2 transition-colors duration-200",
                        isMobile && "w-5 h-5"
                      )}
                      style={{
                        color: isSelected || isOfflineHighlighted
                          ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                          : isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                      }}
                    />
                    
                    <div 
                      className="font-text text-xs font-medium text-center node-title"
                      style={{
                        fontSize: isMobile ? '10px' : '11px',
                        fontFamily: 'var(--font-text)',
                        color: isSelected || isOfflineHighlighted
                          ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                          : isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                        fontWeight: 500,
                        lineHeight: '14px'
                      }}
                    >
                      {step.title}
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  {isSelected && (
                    <div 
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 rounded-lg node-tooltip"
                      style={{
                        background: isDarkMode 
                          ? 'rgba(15, 11, 18, 0.95)' 
                          : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDarkMode 
                          ? 'rgba(200, 169, 81, 0.3)' 
                          : 'rgba(37, 99, 235, 0.2)'}`,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        minWidth: '150px',
                        maxWidth: '200px'
                      }}
                    >
                      <div 
                        className="font-text text-sm font-medium mb-1 tooltip-title"
                        style={{
                          fontSize: '13px',
                          fontFamily: 'var(--font-text)',
                          color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                          fontWeight: 500
                        }}
                      >
                        {step.title}
                      </div>
                      <div 
                        className="font-text text-xs tooltip-description"
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          fontFamily: 'var(--font-text)',
                          color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                          fontWeight: 400
                        }}
                      >
                        {step.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Features Grid */}
        <div ref={featuresRef} className="mb-16 md:mb-20">
          <h3 
            className="font-display text-2xl md:text-3xl font-medium text-center mb-8 md:mb-12 features-header"
            style={{
              fontSize: isMobile ? '22px' : '30px',
              lineHeight: isMobile ? '28px' : '36px',
              fontFamily: 'var(--font-display)',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontWeight: 500
            }}
          >
            Comprehensive Security Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {securityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={feature.id}
                  className={cn(
                    "group p-6 rounded-xl transition-all duration-300 security-feature",
                    feature.highlight && "hover:scale-[1.02]"
                  )}
                  style={{
                    background: feature.highlight
                      ? isDarkMode 
                        ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.12) 0%, rgba(32, 20, 40, 0.8) 100%)' 
                        : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)'
                      : isDarkMode 
                        ? 'rgba(246, 247, 251, 0.03)' 
                        : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${feature.highlight
                      ? isDarkMode 
                        ? 'rgba(200, 169, 81, 0.25)' 
                        : 'rgba(37, 99, 235, 0.2)'
                      : isDarkMode 
                        ? 'rgba(246, 247, 251, 0.08)' 
                        : 'rgba(0, 0, 0, 0.06)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                    boxShadow: feature.highlight
                      ? isDarkMode 
                        ? '0 8px 32px rgba(200, 169, 81, 0.15)' 
                        : '0 8px 32px rgba(37, 99, 235, 0.1)'
                      : 'none'
                  }}
                >
                  {/* Feature Icon */}
                  <div 
                    className="inline-flex p-3 mb-4 rounded-lg feature-icon-wrapper"
                    style={{
                      background: feature.highlight
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
                        color: feature.highlight
                          ? isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                          : isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                      }}
                    />
                  </div>
                  
                  <h4 
                    className="font-display text-lg font-medium mb-3 feature-title"
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

        {/* Compliance & Certifications */}
        <div ref={complianceRef} className="text-center">
          <h3 
            className="font-display text-2xl md:text-3xl font-medium mb-8 compliance-header"
            style={{
              fontSize: isMobile ? '22px' : '30px',
              lineHeight: isMobile ? '28px' : '36px',
              fontFamily: 'var(--font-display)',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontWeight: 500
            }}
          >
            Industry Compliance & Standards
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { name: 'SOC 2 Type II', icon: Shield },
              { name: 'ISO 27001', icon: CheckCircle },
              { name: 'GDPR Compliant', icon: Eye },
              { name: 'Maritime Certified', icon: Globe }
            ].map((cert, index) => {
              const IconComponent = cert.icon;
              
              return (
                <div
                  key={cert.name}
                  className="flex flex-col items-center compliance-cert"
                  style={{
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`
                  }}
                >
                  <div 
                    className="p-4 mb-3 rounded-xl cert-icon-wrapper"
                    style={{
                      background: isDarkMode 
                        ? 'rgba(200, 169, 81, 0.1)' 
                        : 'rgba(37, 99, 235, 0.08)',
                      border: `1px solid ${isDarkMode 
                        ? 'rgba(200, 169, 81, 0.2)' 
                        : 'rgba(37, 99, 235, 0.15)'}`
                    }}
                  >
                    <IconComponent 
                      className="w-8 h-8"
                      style={{
                        color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                      }}
                    />
                  </div>
                  
                  <span 
                    className="font-text text-sm font-medium cert-name"
                    style={{
                      fontSize: isMobile ? '12px' : '14px',
                      fontFamily: 'var(--font-text)',
                      color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                      fontWeight: 500,
                      textAlign: 'center'
                    }}
                  >
                    {cert.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedSecuritySection>
  );
}