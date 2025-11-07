/**
 * Demo Section - LOCAL UX Implementation
 * Search/Source/Confidence/Offline tabs with manual page/section/rev display
 * Blueprint reference: demo-section-tabs
 */

import React, { useState } from 'react';
import { DemoSection as AnimatedDemoSection } from '../motion/AnimatedSection';
import { useReveal, revealPresets } from '../motion/useReveal';
import { localHouseConfig } from '../../config/localhouse';
import { cn } from '../../lib/utils';
import { Search, FileText, Target, Wifi, WifiOff, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface DemoSectionProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
}

type TabType = 'search' | 'source' | 'confidence' | 'offline';

interface TabConfig {
  id: TabType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface SearchResult {
  id: string;
  query: string;
  answer: string;
  source: {
    manual: string;
    page: number;
    section: string;
    revision: string;
  };
  confidence: 'high' | 'medium' | 'low';
  responseTime: string;
  isOffline?: boolean;
}

const tabs: TabConfig[] = [
  {
    id: 'search',
    title: 'Instant Search',
    description: 'Get answers in seconds',
    icon: Search
  },
  {
    id: 'source',
    title: 'Source Verified',
    description: 'Manual page references',
    icon: FileText
  },
  {
    id: 'confidence',
    title: 'Confidence Score',
    description: 'Reliability indicators',
    icon: Target
  },
  {
    id: 'offline',
    title: 'Offline Ready',
    description: 'Works without internet',
    icon: WifiOff
  }
];

const demoResults: Record<TabType, SearchResult> = {
  search: {
    id: 'search_demo',
    query: 'Error code E-047 on starboard main engine',
    answer: 'Error Code E-047 indicates an issue with the starboard engine cooling system. Check coolant levels in the expansion tank and inspect for leaks in the cooling system hoses.',
    source: {
      manual: 'Yacht Maintenance Manual',
      page: 47,
      section: 'Engine Cooling System',
      revision: '2024.1'
    },
    confidence: 'high',
    responseTime: '1.2s'
  },
  source: {
    id: 'source_demo',
    query: 'How to replace fuel filter?',
    answer: 'Shut off fuel supply valve. Remove the old filter by unscrewing the housing. Install new filter ensuring proper orientation of flow direction arrow. Reconnect and check for leaks.',
    source: {
      manual: 'Engine Maintenance Guide',
      page: 23,
      section: 'Fuel System Components',
      revision: '2023.3'
    },
    confidence: 'high',
    responseTime: '0.8s'
  },
  confidence: {
    id: 'confidence_demo',
    query: 'Generator won\'t start - troubleshooting steps?',
    answer: 'Check fuel level, battery connections, and oil level. Verify the generator breaker is in the OFF position. Press the start button for 10 seconds maximum.',
    source: {
      manual: 'Electrical Systems Manual',
      page: 156,
      section: 'Generator Operation',
      revision: '2024.2'
    },
    confidence: 'medium',
    responseTime: '2.1s'
  },
  offline: {
    id: 'offline_demo',
    query: 'Emergency bilge pump activation',
    answer: 'Locate the red emergency bilge pump switch on the main electrical panel. Flip switch to MANUAL position. Pump will run continuously until switched to AUTO or OFF.',
    source: {
      manual: 'Emergency Procedures',
      page: 12,
      section: 'Bilge System Emergency',
      revision: '2024.1'
    },
    confidence: 'high',
    responseTime: '0.6s',
    isOffline: true
  }
};

const getConfidenceColor = (confidence: string, isDarkMode: boolean) => {
  switch (confidence) {
    case 'high':
      return isDarkMode ? '#22c55e' : '#16a34a';
    case 'medium':
      return isDarkMode ? '#eab308' : '#ca8a04';
    case 'low':
      return isDarkMode ? '#f97316' : '#ea580c';
    default:
      return isDarkMode ? '#6b7280' : '#9ca3af';
  }
};

const getConfidenceIcon = (confidence: string) => {
  switch (confidence) {
    case 'high':
      return CheckCircle;
    case 'medium':
      return AlertTriangle;
    case 'low':
      return Clock;
    default:
      return AlertTriangle;
  }
};

export function DemoSection({ 
  isMobile = false, 
  isDarkMode = false 
}: DemoSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // Section reveal animations
  const { ref: headerRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.1,
      threshold: 0.2
    })
  });

  const { ref: tabsRef } = useReveal({
    ...revealPresets.cardStagger({
      delay: 0.3,
      threshold: 0.2,
      stagger: localHouseConfig.motion.stagger / 1000 // Convert ms to seconds for GSAP
    })
  });

  const { ref: contentRef } = useReveal({
    ...revealPresets.fadeUp({
      delay: 0.5,
      threshold: 0.2
    })
  });

  const currentResult = demoResults[activeTab];
  const ConfidenceIcon = getConfidenceIcon(currentResult.confidence);

  return (
    <AnimatedDemoSection
      className="relative py-16 md:py-24 demo-section"
      blueprintRef="demo-section-tabs"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <h2 
            className="font-display text-3xl md:text-5xl font-normal mb-4 demo-headline"
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
            See It In
            <br />
            <span 
              style={{
                color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
              }}
            >
              Action
            </span>
          </h2>
          <p 
            className="font-text text-lg md:text-xl max-w-3xl mx-auto demo-subtitle"
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
            Experience how CelesteOS transforms yacht troubleshooting with verified answers from your manuals
          </p>
        </div>

        {/* Tab Navigation */}
        <div ref={tabsRef} className="mb-8 md:mb-12">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl transition-all duration-300 demo-tab"
                  style={{
                    background: isActive 
                      ? isDarkMode 
                        ? 'linear-gradient(135deg, rgba(200, 169, 81, 0.15) 0%, rgba(15, 11, 18, 0.8) 100%)' 
                        : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)'
                      : isDarkMode 
                        ? 'rgba(15, 11, 18, 0.4)' 
                        : 'rgba(255, 255, 255, 0.6)',
                    border: `1px solid ${isActive 
                      ? isDarkMode 
                        ? 'rgba(200, 169, 81, 0.3)' 
                        : 'rgba(37, 99, 235, 0.2)'
                      : isDarkMode 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.06)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    animationDelay: `${index * localHouseConfig.motion.stagger}ms`,
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isActive 
                      ? isDarkMode 
                        ? '0 8px 32px rgba(200, 169, 81, 0.15)' 
                        : '0 8px 32px rgba(37, 99, 235, 0.12)'
                      : 'none'
                  }}
                >
                  <IconComponent 
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{
                      color: isActive 
                        ? isDarkMode 
                          ? 'var(--opulent-gold, #c8a951)' 
                          : '#2563eb'
                        : isDarkMode 
                          ? 'rgba(246, 247, 251, 0.7)' 
                          : '#6b7280'
                    }}
                  />
                  <div className="text-left">
                    <div 
                      className="font-medium"
                      style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontFamily: 'var(--font-display)',
                        color: isActive 
                          ? isDarkMode 
                            ? 'var(--opulent-gold, #c8a951)' 
                            : '#2563eb'
                          : isDarkMode 
                            ? 'var(--headline, #f6f7fb)' 
                            : '#1f2937',
                        fontWeight: 500
                      }}
                    >
                      {tab.title}
                    </div>
                    <div 
                      className="text-sm opacity-80"
                      style={{
                        fontSize: isMobile ? '12px' : '13px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode 
                          ? 'rgba(246, 247, 251, 0.6)' 
                          : '#6b7280'
                      }}
                    >
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Content */}
        <div ref={contentRef} className="max-w-4xl mx-auto">
          <div 
            className="p-6 md:p-8 rounded-2xl demo-content"
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(15, 11, 18, 0.8) 0%, rgba(37, 99, 235, 0.05) 100%)' 
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(37, 99, 235, 0.03) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            {/* Query */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <span 
                    className="text-white font-medium text-xs"
                    style={{
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    Q
                  </span>
                </div>
                <span 
                  className="font-text text-sm font-medium"
                  style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                  }}
                >
                  Your Question
                </span>
                {currentResult.isOffline && (
                  <div className="flex items-center gap-1">
                    <WifiOff className="w-4 h-4 text-green-500" />
                    <span 
                      className="text-xs font-medium text-green-500"
                      style={{
                        fontFamily: 'var(--font-text)'
                      }}
                    >
                      OFFLINE
                    </span>
                  </div>
                )}
              </div>
              <p 
                className="font-text"
                style={{
                  fontSize: isMobile ? '15px' : '16px',
                  lineHeight: isMobile ? '22px' : '24px',
                  fontFamily: 'var(--font-text)',
                  color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                  fontWeight: 400
                }}
              >
                "{currentResult.query}"
              </p>
            </div>

            {/* Answer */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span 
                  className="font-text text-sm font-medium"
                  style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontFamily: 'var(--font-text)',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                  }}
                >
                  CelesteOS Answer
                </span>
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-text)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    fontWeight: 600
                  }}
                >
                  {currentResult.responseTime}
                </span>
              </div>
              <p 
                className="font-text"
                style={{
                  fontSize: isMobile ? '15px' : '16px',
                  lineHeight: isMobile ? '22px' : '24px',
                  fontFamily: 'var(--font-text)',
                  color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                  fontWeight: 400
                }}
              >
                {currentResult.answer}
              </p>
            </div>

            {/* Source & Confidence Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Information */}
              <div 
                className="p-4 rounded-xl source-info"
                style={{
                  background: isDarkMode 
                    ? 'rgba(15, 11, 18, 0.6)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <FileText 
                    className="w-5 h-5"
                    style={{
                      color: isDarkMode ? 'var(--opulent-gold, #c8a951)' : '#2563eb'
                    }}
                  />
                  <span 
                    className="font-medium"
                    style={{
                      fontSize: isMobile ? '14px' : '15px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                      fontWeight: 500
                    }}
                  >
                    Source Verified
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span 
                      className="font-medium"
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                        fontWeight: 500
                      }}
                    >
                      Manual: 
                    </span>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                      }}
                    >
                      {currentResult.source.manual}
                    </span>
                  </div>
                  <div>
                    <span 
                      className="font-medium"
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                        fontWeight: 500
                      }}
                    >
                      Page {currentResult.source.page}, Section: 
                    </span>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                      }}
                    >
                      {currentResult.source.section}
                    </span>
                  </div>
                  <div>
                    <span 
                      className="font-medium"
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#374151',
                        fontWeight: 500
                      }}
                    >
                      Revision: 
                    </span>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-text)',
                        color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                      }}
                    >
                      {currentResult.source.revision}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Score */}
              <div 
                className="p-4 rounded-xl confidence-info"
                style={{
                  background: isDarkMode 
                    ? 'rgba(15, 11, 18, 0.6)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ConfidenceIcon 
                    className="w-5 h-5"
                    style={{
                      color: getConfidenceColor(currentResult.confidence, isDarkMode)
                    }}
                  />
                  <span 
                    className="font-medium"
                    style={{
                      fontSize: isMobile ? '14px' : '15px',
                      fontFamily: 'var(--font-display)',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                      fontWeight: 500
                    }}
                  >
                    Confidence Score
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div 
                      className="h-2 rounded-full overflow-hidden"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div 
                        className="h-full transition-all duration-500 confidence-bar"
                        style={{
                          width: currentResult.confidence === 'high' ? '90%' : currentResult.confidence === 'medium' ? '70%' : '50%',
                          background: getConfidenceColor(currentResult.confidence, isDarkMode)
                        }}
                      />
                    </div>
                  </div>
                  <span 
                    className="font-medium text-sm capitalize"
                    style={{
                      fontSize: '13px',
                      fontFamily: 'var(--font-text)',
                      color: getConfidenceColor(currentResult.confidence, isDarkMode),
                      fontWeight: 600
                    }}
                  >
                    {currentResult.confidence}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reduced motion fallbacks are in globals.localux.css */}
    </AnimatedDemoSection>
  );
}