import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Copy, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Figma Component Library: AI Answer Card
 * 
 * Variants:
 * - State: expanded | collapsed
 * - Confidence: low | medium | high
 * - Mode: desktop | mobile  
 * - Motion: default | reduced-motion
 */

interface SolutionSource {
  title: string;
  page?: number;
  revision?: string;
}

interface Solution {
  id: string;
  title: string;
  confidence: 'low' | 'medium' | 'high';
  source: SolutionSource;
  steps: Array<{
    text: string;
    type?: 'warning' | 'tip' | 'normal';
    isBold?: boolean;
  }>;
  procedureLink?: string;
}

interface AISolutionCardLibraryProps {
  solutions: Solution[];
  // Figma Component Library Variants
  variant?: {
    state?: 'expanded' | 'collapsed';
    confidence?: 'low' | 'medium' | 'high'; 
    mode?: 'desktop' | 'mobile';
    motion?: 'default' | 'reduced-motion';
  };
  // Override individual solution states
  expandedSolutions?: Set<string>;
  onToggleSolution?: (solutionId: string) => void;
}

export function AISolutionCardLibrary({ 
  solutions, 
  variant = {}, 
  expandedSolutions: controlledExpanded,
  onToggleSolution
}: AISolutionCardLibraryProps) {
  // Extract variant properties with defaults - Cards collapsed on first receival
  const {
    state = 'collapsed', // Changed from 'expanded' to 'collapsed' as default
    confidence = 'high',
    mode = 'desktop', 
    motion = 'default'
  } = variant;

  const isMobile = mode === 'mobile';
  const prefersReducedMotion = motion === 'reduced-motion';

  // Internal state management - All cards collapsed initially
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    new Set() // Empty set - no solutions expanded on first receival
  );

  // Use controlled state if provided, otherwise internal state
  const expandedSolutions = controlledExpanded || internalExpanded;

  // Override with variant state if specified
  useEffect(() => {
    if (state === 'expanded' && !controlledExpanded) {
      setInternalExpanded(new Set(solutions.map(s => s.id)));
    } else if (state === 'collapsed' && !controlledExpanded) {
      setInternalExpanded(new Set());
    }
  }, [state, solutions, controlledExpanded]);

  const toggleSolution = (solutionId: string) => {
    if (onToggleSolution) {
      onToggleSolution(solutionId);
    } else {
      const newExpanded = new Set(internalExpanded);
      if (newExpanded.has(solutionId)) {
        newExpanded.delete(solutionId);
      } else {
        newExpanded.add(solutionId);
      }
      setInternalExpanded(newExpanded);
    }
  };

  const copyToClipboard = (solutionId: string) => {
    const solution = solutions.find(s => s.id === solutionId);
    if (solution) {
      const text = `${solution.title}\n\n${solution.steps.map(step => `• ${step.text}`).join('\n')}`;
      navigator.clipboard.writeText(text);
    }
  };

  // Design Token Functions
  const getDesignTokens = () => ({
    // Spacing - 4px Grid System
    spacing: {
      xs: '4px',    // --spacing-1
      sm: '8px',    // --spacing-2  
      md: '12px',   // --spacing-3
      lg: '16px',   // --spacing-4
      xl: '20px',   // --spacing-5
      xxl: '24px',  // --spacing-6
    },
    // Radius
    radius: {
      sm: '12px',   // --ai-card-radius-sm
      lg: '16px',   // --ai-card-radius-lg
    },
    // Shadow
    shadow: {
      e1: '0 8px 20px rgba(0, 0, 0, 0.08)', // --ai-card-shadow-e1
    },
    // Colors
    colors: {
      white: '#FFFFFF',                    // --ai-card-color-white
      border: 'rgba(0, 0, 0, 0.05)',     // --ai-card-border
      blueStart: '#0070FF',               // --ai-card-blue-start
      blueEnd: '#00A4FF',                 // --ai-card-blue-end
    }
  });

  const tokens = getDesignTokens();

  // Truncate source title for mobile if >20 characters
  const truncateSourceTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  const getConfidenceBadgeStyles = (badgeConfidence: 'low' | 'medium' | 'high') => {
    switch (badgeConfidence) {
      case 'low':
        return {
          backgroundColor: 'var(--confidence-low-bg)',
          color: 'var(--confidence-low-text)',
          border: '1px solid var(--confidence-low-border)'
        };
      case 'medium':
        return {
          backgroundColor: 'var(--confidence-medium-bg)',
          color: 'var(--confidence-medium-text)',
          border: '1px solid var(--confidence-medium-border)'
        };
      case 'high':
        return {
          background: 'var(--confidence-high-bg)',
          color: 'var(--confidence-high-text)',
          border: '1px solid var(--confidence-high-border)'
        };
      default:
        return {
          backgroundColor: 'var(--confidence-low-bg)',
          color: 'var(--confidence-low-text)',
          border: '1px solid var(--confidence-low-border)'
        };
    }
  };

  const getStepIcon = (type?: string) => {
    const iconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4';
    
    switch (type) {
      case 'warning':
        return <AlertTriangle className={`${iconSize} text-amber-500`} />;
      case 'tip':
        return <Info className={`${iconSize} text-blue-500`} />;
      default:
        return <CheckCircle className={`${iconSize} text-green-500`} />;
    }
  };

  // Motion variants with design token integration
  const getContentVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { 
          opacity: 1,
          height: 0,
          y: 0,
          transition: { duration: 0 }
        },
        expanded: { 
          opacity: 1,
          height: 'auto',
          y: 0,
          transition: { duration: 0 }
        }
      };
    }

    return {
      collapsed: {
        opacity: 0,
        height: 0,
        y: -4,
        transition: {
          duration: 0.2, // 200ms (180-220ms range)
          ease: [0.22, 0.61, 0.36, 1],
          height: { duration: 0.18 },
          opacity: { duration: 0.15 }
        }
      },
      expanded: {
        opacity: 1,
        height: 'auto',
        y: 0,
        transition: {
          duration: 0.28, // 280ms (240-320ms range)
          ease: [0.22, 0.61, 0.36, 1],
          height: { duration: 0.25 },
          opacity: { duration: 0.2, delay: 0.05 }
        }
      }
    };
  };

  const getChevronVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { rotate: 0 },
        expanded: { rotate: 90 }
      };
    }

    return {
      collapsed: {
        rotate: 0,
        transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }
      },
      expanded: {
        rotate: 90,
        transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }
      }
    };
  };

  const getStepContainerVariants = () => {
    if (prefersReducedMotion) {
      return {
        expanded: {
          transition: { staggerChildren: 0 }
        }
      };
    }

    return {
      expanded: {
        transition: {
          staggerChildren: 0.06, // 60ms delay
          delayChildren: 0.1
        }
      }
    };
  };

  const getStepItemVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { opacity: 1, y: 0 },
        expanded: { opacity: 1, y: 0 }
      };
    }

    return {
      collapsed: {
        opacity: 0,
        y: 8
      },
      expanded: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.25,
          ease: [0.22, 0.61, 0.36, 1]
        }
      }
    };
  };

  // Typography with design tokens
  const getTypographyStyles = () => ({
    title: {
      fontSize: isMobile ? '16px' : '18px',
      lineHeight: isMobile ? '24px' : '26px',
      fontWeight: '600',
      color: '#1a1a1a',
      fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    badge: {
      fontSize: isMobile ? '11px' : '12px',
      lineHeight: isMobile ? '14px' : '16px',
      fontWeight: '500',
      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    body: {
      fontSize: isMobile ? '15px' : '16px',
      lineHeight: isMobile ? '22px' : '24px',
      color: '#374151',
      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    button: {
      fontSize: isMobile ? '14px' : '15px',
      lineHeight: isMobile ? '20px' : '22px',
      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  });

  const typography = getTypographyStyles();

  return (
    <div 
      className="w-full space-y-0"
      style={{ padding: tokens.spacing.md }} // 12px container padding
    >
      {solutions.map((solution, index) => {
        const isExpanded = expandedSolutions.has(solution.id);
        
        return (
          <motion.div
            key={solution.id}
            className={`
              border overflow-hidden
              ${index === 0 ? '' : 'border-t-0'}
              ${isExpanded ? 'bg-white/95 backdrop-blur-sm' : 'bg-white hover:bg-gray-50/50'}
            `}
            style={{
              borderRadius: '0px', // All cards have 0px radius
              // Glassmorphism effect - Semi-transparent background
              backgroundColor: isExpanded 
                ? 'rgba(255, 255, 255, 0.85)' // Expanded: More transparent for depth
                : 'rgba(255, 255, 255, 0.75)', // Collapsed: Subtle transparency
              // Enhanced backdrop blur for glassmorphism
              backdropFilter: isExpanded 
                ? 'blur(16px) saturate(1.1)' // Expanded: Strong blur with saturation
                : 'blur(8px) saturate(1.05)', // Collapsed: Subtle blur
              // Multi-layered shadow system for depth
              boxShadow: isExpanded 
                ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)' // Expanded: Complex shadow with inset highlight
                : '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.15)', // Collapsed: Subtle glass shadow
              // Translucent borders for glassmorphism
              border: isExpanded
                ? '1px solid rgba(255, 255, 255, 0.25)' // Expanded: More prominent glass border
                : '1px solid rgba(255, 255, 255, 0.18)', // Collapsed: Subtle glass border
              // Additional glass effect properties
              WebkitBackdropFilter: isExpanded ? 'blur(16px) saturate(1.1)' : 'blur(8px) saturate(1.05)', // Safari support
            }}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
          >
            {/* Header Row - Design Token Based Spacing */}
            <div 
              className="cursor-pointer transition-colors duration-200"
              onClick={() => toggleSolution(solution.id)}
              style={{
                padding: isMobile 
                  ? (isExpanded ? tokens.spacing.lg : tokens.spacing.md) // Mobile: 16px expanded, 12px collapsed
                  : tokens.spacing.xxl // Desktop: 24px
              }}
            >
              <div className="flex items-start justify-between" style={{ gap: tokens.spacing.lg }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start mb-3" style={{ gap: tokens.spacing.md }}>
                    {/* Solution Title - Eloquia Display Typography */}
                    <h3 
                      className="flex-1 min-w-0"
                      style={typography.title}
                    >
                      {solution.title}
                    </h3>
                    
                    {/* Confidence Badge - Design Token Colors */}
                    <div 
                      className="px-3 py-1 rounded-full flex-shrink-0"
                      style={{
                        ...typography.badge,
                        ...getConfidenceBadgeStyles(solution.confidence)
                      }}
                    >
                      {solution.confidence.charAt(0).toUpperCase() + solution.confidence.slice(1)} Confidence
                    </div>
                  </div>
                  
                  {/* Source Chip - Mobile Truncation */}
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md"
                    style={{
                      fontSize: '13px',
                      lineHeight: '18px',
                      color: '#6b7280',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      {isMobile 
                        ? truncateSourceTitle(solution.source.title, 20)
                        : solution.source.title
                      }
                      {solution.source.page && ` p.${solution.source.page}`}
                      {solution.source.revision && `, Rev ${solution.source.revision}`}
                    </span>
                  </div>
                </div>

                {/* Animated Chevron Icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    variants={getChevronVariants()}
                    initial="collapsed"
                    animate={isExpanded ? "expanded" : "collapsed"}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Animated Expanded Content */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key={`content-${solution.id}`}
                  variants={getContentVariants()}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  style={{ overflow: 'hidden' }}
                >
                  {/* Body - 4px Grid Spacing System */}
                  <div 
                    className="border-t border-gray-100"
                    style={{
                      padding: isMobile ? tokens.spacing.lg : tokens.spacing.xxl,
                      paddingTop: isMobile ? tokens.spacing.lg : tokens.spacing.xxl
                    }}
                  >
                    <motion.div 
                      className="space-y-4"
                      variants={getStepContainerVariants()}
                      initial="collapsed"
                      animate="expanded"
                    >
                      {solution.steps.map((step, stepIndex) => (
                        <motion.div 
                          key={stepIndex} 
                          className="flex items-start"
                          style={{
                            gap: isMobile ? tokens.spacing.lg : tokens.spacing.md // Mobile: 16px, Desktop: 12px
                          }}
                          variants={getStepItemVariants()}
                        >
                          {/* Step Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {getStepIcon(step.type)}
                          </div>
                          
                          {/* Step Text - Eloquia Text Typography */}
                          <div 
                            className={step.isBold ? 'font-semibold' : ''}
                            style={typography.body}
                          >
                            {step.text}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Footer Row - Design Token Spacing */}
                  <motion.div 
                    className={`
                      border-t border-gray-100 
                      ${isMobile ? 'flex flex-col' : 'flex items-center justify-between'}
                    `}
                    style={{
                      padding: isMobile ? tokens.spacing.lg : `${tokens.spacing.xl} ${tokens.spacing.xxl}`,
                      gap: isMobile ? tokens.spacing.md : '0'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      delay: prefersReducedMotion ? 0 : 0.15,
                      duration: prefersReducedMotion ? 0 : 0.2 
                    }}
                  >
                    {/* View Full Procedure Link */}
                    <button 
                      className="group flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      style={{
                        ...typography.button,
                        gap: tokens.spacing.sm
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="group-hover:underline underline-offset-2">
                        View full procedure
                      </span>
                    </button>

                    {/* Copy Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(solution.id);
                      }}
                      className={`
                        rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                        transition-all duration-200 hover:shadow-sm
                        ${isMobile ? 'self-end' : ''}
                      `}
                      style={{
                        padding: tokens.spacing.sm
                      }}
                      title="Copy solution"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// Component Library Variants Export for Figma
export const AISolutionCardVariants = {
  // State variants
  Expanded: (props: Omit<AISolutionCardLibraryProps, 'variant'>) => 
    <AISolutionCardLibrary {...props} variant={{ state: 'expanded' }} />,
  
  Collapsed: (props: Omit<AISolutionCardLibraryProps, 'variant'>) => 
    <AISolutionCardLibrary {...props} variant={{ state: 'collapsed' }} />,

  // Confidence variants  
  LowConfidence: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ confidence: 'low' }} />,
    
  MediumConfidence: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ confidence: 'medium' }} />,
    
  HighConfidence: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ confidence: 'high' }} />,

  // Mode variants
  Desktop: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ mode: 'desktop' }} />,
    
  Mobile: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ mode: 'mobile' }} />,

  // Motion variants
  DefaultMotion: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ motion: 'default' }} />,
    
  ReducedMotion: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ motion: 'reduced-motion' }} />,

  // Combined variants
  MobileHighConfidenceExpanded: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ 
      mode: 'mobile', 
      confidence: 'high', 
      state: 'expanded' 
    }} />,
    
  DesktopLowConfidenceCollapsed: (props: Omit<AISolutionCardLibraryProps, 'variant'>) =>
    <AISolutionCardLibrary {...props} variant={{ 
      mode: 'desktop', 
      confidence: 'low', 
      state: 'collapsed' 
    }} />
};