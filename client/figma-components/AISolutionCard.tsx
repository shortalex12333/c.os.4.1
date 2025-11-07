import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Copy, AlertTriangle, Info, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare, Send, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SolutionSource {
  title: string;
  page?: number;
  revision?: string;
}

interface Solution {
  id: string;
  title: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore?: number; // Percentage score for circle button color
  source: SolutionSource;
  steps: Array<{
    text: string;
    type?: 'warning' | 'tip' | 'normal';
    isBold?: boolean;
  }>;
  procedureLink?: string;
  // Document cascades for future JSON integration
  related_docs?: Array<{
    file_name: string;
    doc_link: string;
    page_number?: number;
    confidence?: number;
  }>;
  all_docs?: Array<{
    file_name: string;
    doc_link: string;
    page_number?: number;
    confidence?: number;
  }>;
}

interface AISolutionCardProps {
  solutions: Solution[];
  isMobile?: boolean;
  isDarkMode?: boolean;
}

export function AISolutionCard({ solutions, isMobile = false, isDarkMode = false }: AISolutionCardProps) {
  // Default: All solutions collapsed on first receival
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(
    new Set() // Empty set - no solutions expanded initially
  );

  // Feedback form state for each solution
  const [feedbackExpanded, setFeedbackExpanded] = useState<Set<string>>(new Set());
  const [feedbackMessages, setFeedbackMessages] = useState<{ [key: string]: string }>({});
  // Button selection state for persistent highlighting
  const [helpfulSelections, setHelpfulSelections] = useState<{ [key: string]: boolean }>({});
  const [notHelpfulSelections, setNotHelpfulSelections] = useState<{ [key: string]: boolean }>({});

  // Detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleSolution = (solutionId: string) => {
    const newExpanded = new Set(expandedSolutions);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedSolutions(newExpanded);
  };

  const copyToClipboard = (solutionId: string) => {
    const solution = solutions.find(s => s.id === solutionId);
    if (solution) {
      const text = `${solution.title}\n\n${solution.steps.map(step => `• ${step.text}`).join('\n')}`;
      navigator.clipboard.writeText(text);
    }
  };

  const toggleFeedback = (solutionId: string) => {
    const newExpanded = new Set(feedbackExpanded);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setFeedbackExpanded(newExpanded);
  };

  const handleFeedbackSubmit = (solutionId: string) => {
    const message = feedbackMessages[solutionId]?.trim();
    if (!message) return;

    // Here you would send the feedback to your ML system
    console.log('Feedback submitted for solution:', solutionId, 'Message:', message);
    
    // Clear the feedback form
    setFeedbackMessages(prev => ({
      ...prev,
      [solutionId]: ''
    }));
    
    // Close the feedback form
    const newExpanded = new Set(feedbackExpanded);
    newExpanded.delete(solutionId);
    setFeedbackExpanded(newExpanded);
  };

  const updateFeedbackMessage = (solutionId: string, message: string) => {
    setFeedbackMessages(prev => ({
      ...prev,
      [solutionId]: message
    }));
  };

  // Truncate source title for mobile if >20 characters
  const truncateSourceTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  const getConfidenceBadgeStyle = (confidence: string) => {
    switch (confidence) {
      case 'low':
        return {
          background: 'var(--confidence-low-bg)',
          color: 'var(--confidence-low-text)',
          border: `1px solid var(--confidence-low-border)`,
          backdropFilter: 'var(--confidence-low-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-low-backdrop)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        };
      case 'medium':
        return {
          background: 'var(--confidence-medium-bg)',
          color: 'var(--confidence-medium-text)',
          border: `1px solid var(--confidence-medium-border)`,
          backdropFilter: 'var(--confidence-medium-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-medium-backdrop)',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        };
      case 'high':
        return {
          background: 'var(--confidence-high-bg)',
          color: 'var(--confidence-high-text)',
          border: `1px solid var(--confidence-high-border)`,
          backdropFilter: 'var(--confidence-high-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-high-backdrop)',
          boxShadow: '0 3px 12px rgba(0, 112, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        };
      default:
        return {
          background: 'var(--confidence-low-bg)',
          color: 'var(--confidence-low-text)',
          border: `1px solid var(--confidence-low-border)`,
          backdropFilter: 'var(--confidence-low-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-low-backdrop)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        };
    }
  };

  // Helper function to get confidence circle styles based on confidence percentage
  const getConfidenceCircleStyle = (confidenceScore: number) => {
    const baseStyle = {
      border: 'none',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    };

    // Determine color based on confidence percentage
    if (confidenceScore >= 85) {
      // Green for high confidence (85%+)
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        boxShadow: '0 3px 12px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    } else if (confidenceScore >= 67.5) {
      // Amber for medium confidence (67.5-85%)
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        boxShadow: '0 3px 12px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    } else {
      // Red for low confidence (<67.5%)
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        boxShadow: '0 3px 12px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    }
  };

  const getStepIcon = (type?: string) => {
    const iconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'; // 14px for mobile, 16px for desktop

    switch (type) {
      case 'warning':
        return <AlertTriangle className={`${iconSize} text-amber-500`} />;
      case 'tip':
        return <Info className={`${iconSize} text-blue-500`} />;
      default:
        return <CheckCircle className={`${iconSize} text-green-500`} />;
    }
  };

  // Document cascade state management
  const [expandedRelatedDocs, setExpandedRelatedDocs] = useState<Set<string>>(new Set());
  const [expandedAllDocs, setExpandedAllDocs] = useState<Set<string>>(new Set());

  const toggleRelatedDocs = (solutionId: string) => {
    const newExpanded = new Set(expandedRelatedDocs);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedRelatedDocs(newExpanded);
  };

  const toggleAllDocs = (solutionId: string) => {
    const newExpanded = new Set(expandedAllDocs);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedAllDocs(newExpanded);
  };

  // Shared expandable document list component
  const ExpandableDocList = ({
    label,
    docs,
    emptyMessage,
    isExpanded,
    onToggle,
    solutionId
  }: {
    label: string;
    docs: Array<{ file_name: string; doc_link: string; page_number?: number; confidence?: number }>;
    emptyMessage: string;
    isExpanded: boolean;
    onToggle: () => void;
    solutionId: string;
  }) => (
    <motion.div
      className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/30 p-2 sm:p-3 doc_cascade_container"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : 0.25,
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: [0.22, 0.61, 0.36, 1]
      }}
    >
      {/* Header Row */}
      <button
        className="flex w-full items-center justify-between text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 doc_cascade_header"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <span>
          {label}{" "}
          {docs.length > 0 && (
            <span className="text-gray-500 dark:text-gray-400 font-normal">({docs.length})</span>
          )}
        </span>
        <motion.div
          animate={{
            rotate: isExpanded ? 180 : 0
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.2,
            ease: [0.22, 0.61, 0.36, 1]
          }}
        >
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-3 space-y-2 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto doc_cascade_list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.2,
              ease: [0.22, 0.61, 0.36, 1]
            }}
            style={{ overflow: 'hidden' }}
          >
            {docs.length === 0 ? (
              <p className="text-xs italic text-gray-400 dark:text-gray-500 py-1">
                {emptyMessage}
              </p>
            ) : (
              docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.doc_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between truncate py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 doc_cascade_item"
                  title={`${doc.file_name}${doc.page_number ? ` (Page ${doc.page_number})` : ''}`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <span
                      className="text-gray-500 dark:text-gray-400 font-mono mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm"
                      style={{
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace'
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <span
                      className="flex-1 truncate text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
                      style={{
                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      {doc.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {doc.page_number && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        p.{doc.page_number}
                      </span>
                    )}
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </a>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Motion variants for reduced motion vs full motion
  const getMotionVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { height: 'auto', opacity: 1 },
        expanded: { height: 'auto', opacity: 1 }
      };
    }

    return {
      collapsed: {
        height: 'auto',
        opacity: 1
      },
      expanded: {
        height: 'auto',
        opacity: 1
      }
    };
  };

  // Content animation variants with precise timing - IDENTICAL to desktop
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
          duration: 0.2, // 200ms (180-220ms range) - IDENTICAL
          ease: [0.22, 0.61, 0.36, 1], // cubic-bezier(0.22,0.61,0.36,1) - IDENTICAL
          height: { duration: 0.18 },
          opacity: { duration: 0.15 }
        }
      },
      expanded: {
        opacity: 1,
        height: 'auto',
        y: 0,
        transition: {
          duration: 0.28, // 280ms (240-320ms range) - IDENTICAL
          ease: [0.22, 0.61, 0.36, 1], // cubic-bezier(0.22,0.61,0.36,1) - IDENTICAL
          height: { duration: 0.25 },
          opacity: { duration: 0.2, delay: 0.05 }
        }
      }
    };
  };

  // Chevron rotation variants - IDENTICAL timing
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
        transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] } // IDENTICAL
      },
      expanded: {
        rotate: 90,
        transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] } // IDENTICAL
      }
    };
  };

  // Staggered bullet list variants - IDENTICAL timing
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
          staggerChildren: 0.06, // 60ms delay between each - IDENTICAL
          delayChildren: 0.1 // Start after main content animation - IDENTICAL
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
          duration: 0.25, // IDENTICAL
          ease: [0.22, 0.61, 0.36, 1] // IDENTICAL
        }
      }
    };
  };

  return (
    // Binds to: response.solutions[]
    <div 
      className="w-full flex flex-col solutions_container"
      style={{ 
        padding: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)', // Mobile: 8px for more width, Desktop: 12px
        gap: isMobile ? 'var(--spacing-4)' : 'var(--spacing-5)' // Mobile: 16px, Desktop: 20px spacing
      }}
    >
      {solutions.map((solution, index) => {
        const isExpanded = expandedSolutions.has(solution.id);
        
        return (
          // Binds to: response.solutions[].id
          <motion.div
            key={solution.id}
            className={`
              border border-gray-200 dark:border-neutral-700 overflow-hidden solution_card
              ${isExpanded
                ? 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm'
                : 'bg-white dark:bg-neutral-900 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50'
              }
            `}
            style={{
              borderRadius: '8px', // Cards have 8px radius
            }}
            variants={getMotionVariants()}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
          >
            {/* Header Row - Always Visible with Mobile Responsive Styling */}
            <div 
              className="cursor-pointer transition-colors duration-200 solution_header"
              onClick={() => toggleSolution(solution.id)}
              style={{
                padding: isMobile ? (isExpanded ? '20px' : '16px') : '24px' // Mobile: Increased padding for wider cards
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Solution Title - Mobile Responsive Typography - Binds to: response.solutions[].title */}
                    <h3 
                      className="flex-1 min-w-0 solution_title_display"
                      style={{
                        fontSize: isMobile ? '17px' : '18px', // Mobile: Larger 17px, Desktop: 18px
                        lineHeight: isMobile ? '24px' : '26px', // Mobile: 24px, Desktop: 26px
                        fontWeight: '600',
                        color: isDarkMode ? '#f5f5f5' : '#1a1a1a',
                        fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        whiteSpace: isMobile ? 'nowrap' : 'normal', // Mobile: Force single line
                        overflow: isMobile ? 'hidden' : 'visible', // Mobile: Hide overflow
                        textOverflow: isMobile ? 'ellipsis' : 'clip' // Mobile: Show ellipsis for overflow
                      }}
                    >
                      {solution.title}
                    </h3>
                    
                    {/* Enhanced Glassmorphism Confidence Badge - Binds to: response.solutions[].confidence_score */}
                    <button 
                      className="rounded-full flex-shrink-0 confidence_circle_button transition-all duration-200 hover:scale-110 active:scale-95"
                      style={{
                        width: isMobile ? '24px' : '28px',
                        height: isMobile ? '24px' : '28px',
                        minWidth: isMobile ? '24px' : '28px',
                        minHeight: isMobile ? '24px' : '28px',
                        border: 'none',
                        cursor: 'pointer',
                        ...getConfidenceCircleStyle(solution.confidenceScore || 75) // Default to 75% if no score
                      }}
                      title={`${solution.confidenceScore || 75}% confidence`}
                      aria-label={`Confidence level: ${solution.confidenceScore || 75}%`}
                    >
                      {/* Circle button with dynamic color based on confidence percentage */}
                    </button>
                  </div>
                  
                  {/* Source Chip - Mobile Truncation - Binds to: response.solutions[].source_document */}
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md source_document_chip"
                    style={{
                      fontSize: '13px',
                      lineHeight: '18px',
                      color: '#6b7280',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {/* Binds to: response.solutions[].source_document.title */}
                    <span className="source_title_display">
                      {isMobile 
                        ? truncateSourceTitle(solution.source.title, 20) // Mobile: truncate at 20 chars
                        : solution.source.title // Desktop: full title
                      }
                      {/* Binds to: response.solutions[].source_document.page */}
                      {solution.source.page && <span className="source_page"> p.{solution.source.page}</span>}
                      {/* Binds to: response.solutions[].source_document.revision */}
                      {solution.source.revision && <span className="source_revision">, Rev {solution.source.revision}</span>}
                    </span>
                  </div>
                </div>

                {/* Animated Chevron Icon */}
                <div className="flex-shrink-0 expand_toggle">
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
                  className="solution_expanded_content"
                >
                  {/* Body - Rich Text with Steps and Mobile Responsive Bullet Indent - Binds to: response.solutions[].steps[] */}
                  <div 
                    className="border-t border-gray-100 solution_steps_container"
                    style={{
                      padding: isMobile ? '16px' : '24px', // Mobile: 16px, Desktop: 24px
                      paddingTop: isMobile ? '16px' : '24px'
                    }}
                  >
                    <motion.div 
                      className="space-y-4 solution_steps_list"
                      variants={getStepContainerVariants()}
                      initial="collapsed"
                      animate="expanded"
                    >
                      {/* Binds to: response.solutions[].steps[] */}
                      {solution.steps.map((step, stepIndex) => (
                        <motion.div 
                          key={stepIndex} 
                          className="flex items-start solution_step_item"
                          style={{
                            gap: isMobile ? '16px' : '12px' // Mobile: 16px indent, Desktop: 12px
                          }}
                          variants={getStepItemVariants()}
                        >
                          {/* Step Icon - Binds to: response.solutions[].steps[].type */}
                          <div className="flex-shrink-0 mt-0.5 step_icon">
                            {getStepIcon(step.type)}
                          </div>
                          
                          {/* Step Text - Binds to: response.solutions[].steps[].text */}
                          <div 
                            className={`${step.isBold ? 'font-semibold' : ''} step_text_content`}
                            style={{
                              fontSize: isMobile ? '15px' : '16px',
                              lineHeight: isMobile ? '22px' : '24px',
                              color: isDarkMode ? '#d1d5db' : '#374151',
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}
                          >
                            {step.text}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Footer Row - Mobile Responsive Layout */}
                  <motion.div 
                    className={`
                      border-t border-gray-100 solution_footer_actions
                      ${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'}
                    `}
                    style={{
                      padding: isMobile ? '16px' : '20px 24px'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      delay: prefersReducedMotion ? 0 : 0.15,
                      duration: prefersReducedMotion ? 0 : 0.2 
                    }}
                  >
                    {/* View Full Procedure Link - Binds to: response.solutions[].procedure_link */}
                    {solution.procedureLink && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(solution.procedureLink, '_blank', 'noopener,noreferrer');
                        }}
                        className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 procedure_link_button"
                        style={{
                          fontSize: isMobile ? '14px' : '15px',
                          lineHeight: isMobile ? '20px' : '22px',
                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        title={`Open: ${solution.procedureLink}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="group-hover:underline underline-offset-2">
                          View full procedure
                        </span>
                      </button>
                    )}

                    {/* Copy Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(solution.id);
                      }}
                      className={`
                        p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                        transition-all duration-200 hover:shadow-sm copy_solution_button
                        ${isMobile ? 'self-end' : ''}
                      `}
                      title="Copy solution"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </motion.div>

                  {/* Feedback Buttons Section - Enhanced with Persistent States - Binds to: metadata.user_feedback */}
                  <motion.div 
                    className="border-t border-gray-100 feedback_section"
                    style={{
                      padding: isMobile ? '16px' : '20px 24px'
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: prefersReducedMotion ? 0 : 0.2,
                      duration: prefersReducedMotion ? 0 : 0.25,
                      ease: [0.22, 0.61, 0.36, 1]
                    }}
                  >
                    <div 
                      className={`
                        flex gap-3 feedback_buttons_container
                        ${isMobile ? 'flex-col' : 'flex-row'}
                      `}
                    >
                      {/* Enhanced Helpful Button with Persistent State and Press Animation - Binds to: metadata.user_feedback.helpful */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHelpfulSelections(prev => ({
                            ...prev,
                            [solution.id]: !prev[solution.id]
                          }));
                          // Clear not helpful if helpful is selected
                          if (!helpfulSelections[solution.id]) {
                            setNotHelpfulSelections(prev => ({
                              ...prev,
                              [solution.id]: false
                            }));
                          }
                        }}
                        className={`group flex items-center justify-center gap-2 px-4 py-2 transition-all duration-150 helpful_button ${isMobile ? 'flex-1' : ''}`}
                        style={{
                          borderRadius: '8px',
                          background: helpfulSelections[solution.id] ? 'var(--button-helpful-bg)' : 'transparent',
                          backdropFilter: 'blur(16px) saturate(1.2)',
                          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                          border: helpfulSelections[solution.id] 
                            ? '1px solid var(--button-helpful-border)' 
                            : '1px solid rgba(34, 197, 94, 0.25)',
                          boxShadow: helpfulSelections[solution.id]
                            ? '0 4px 16px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                            : '0 2px 8px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                          fontSize: isMobile ? '13px' : '14px',
                          lineHeight: isMobile ? '18px' : '20px',
                          fontWeight: '500',
                          color: helpfulSelections[solution.id] ? 'var(--button-helpful-text)' : '#6b7280',
                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          transform: 'translateY(0px)',
                          cursor: 'pointer'
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        }}
                      >
                        <ThumbsUp 
                          className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} group-hover:scale-110 transition-transform duration-200`}
                          style={{ 
                            color: helpfulSelections[solution.id] ? 'var(--button-helpful-text)' : '#6b7280'
                          }}
                        />
                        <span>Helpful</span>
                      </button>

                      {/* Enhanced Not Helpful Button with Persistent State and Press Animation - Binds to: metadata.user_feedback.not_helpful */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotHelpfulSelections(prev => ({
                            ...prev,
                            [solution.id]: !prev[solution.id]
                          }));
                          // Clear helpful if not helpful is selected
                          if (!notHelpfulSelections[solution.id]) {
                            setHelpfulSelections(prev => ({
                              ...prev,
                              [solution.id]: false
                            }));
                          }
                        }}
                        className={`group flex items-center justify-center gap-2 px-4 py-2 transition-all duration-150 not_helpful_button ${isMobile ? 'flex-1' : ''}`}
                        style={{
                          borderRadius: '8px',
                          background: notHelpfulSelections[solution.id] ? 'var(--button-not-helpful-bg)' : 'transparent',
                          backdropFilter: 'blur(16px) saturate(1.2)',
                          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                          border: notHelpfulSelections[solution.id] 
                            ? '1px solid var(--button-not-helpful-border)' 
                            : '1px solid rgba(239, 68, 68, 0.25)',
                          boxShadow: notHelpfulSelections[solution.id]
                            ? '0 4px 16px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                            : '0 2px 8px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                          fontSize: isMobile ? '13px' : '14px',
                          lineHeight: isMobile ? '18px' : '20px',
                          fontWeight: '500',
                          color: notHelpfulSelections[solution.id] ? 'var(--button-not-helpful-text)' : '#6b7280',
                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          transform: 'translateY(0px)',
                          cursor: 'pointer'
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        }}
                      >
                        <ThumbsDown 
                          className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} group-hover:scale-110 transition-transform duration-200`}
                          style={{ 
                            color: notHelpfulSelections[solution.id] ? 'var(--button-not-helpful-text)' : '#6b7280'
                          }}
                        />
                        <span>Not Helpful</span>
                      </button>

                      {/* Leave Feedback Button - Neutral with Glassmorphism */}
                      <div className="flex items-center gap-2 feedback_controls">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFeedback(solution.id);
                          }}
                          className={`group flex items-center justify-center gap-2 px-4 py-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] leave_feedback_button ${isMobile ? 'flex-1' : ''}`}
                          style={{
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            backdropFilter: 'blur(16px) saturate(1.2)',
                            WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                            border: '1px solid rgba(107, 114, 128, 0.25)',
                            boxShadow: '0 4px 16px rgba(107, 114, 128, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            fontSize: isMobile ? '13px' : '14px',
                            lineHeight: isMobile ? '18px' : '20px',
                            fontWeight: '500',
                            color: '#6b7280',
                            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }}
                        >
                          <MessageSquare 
                            className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} group-hover:scale-110 transition-transform duration-200`}
                            style={{ color: '#6b7280' }}
                          />
                          <span>Leave Feedback</span>
                        </button>

                        {/* Send Button - Appears when feedback is expanded - Binds to: metadata.user_feedback.message */}
                        {feedbackExpanded.has(solution.id) && (
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedbackSubmit(solution.id);
                            }}
                            disabled={!feedbackMessages[solution.id]?.trim()}
                            className="group flex items-center justify-center p-2 transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed send_feedback_button"
                            style={{
                              borderRadius: '8px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              backdropFilter: 'blur(16px) saturate(1.2)',
                              WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
                          >
                            <Send 
                              className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} group-hover:scale-110 transition-transform duration-200`}
                              style={{ color: '#3b82f6' }}
                            />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Feedback Form - Expands when Leave Feedback is clicked - Binds to: metadata.user_feedback.message */}
                    <AnimatePresence>
                      {feedbackExpanded.has(solution.id) && (
                        <motion.div
                          className="mt-4 border-t border-gray-100 pt-4 feedback_form_container"
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ 
                            duration: prefersReducedMotion ? 0 : 0.25,
                            ease: [0.22, 0.61, 0.36, 1]
                          }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-3 px-1">
                            {/* Binds to: metadata.user_feedback.message */}
                            <textarea
                              id={`feedback-${solution.id}`}
                              value={feedbackMessages[solution.id] || ''}
                              onChange={(e) => updateFeedbackMessage(solution.id, e.target.value)}
                              placeholder="Tell us what could be improved or share your thoughts..."
                              className="w-full p-3 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 feedback_message_input"
                              style={{
                                fontSize: isMobile ? '15px' : '16px',
                                lineHeight: isMobile ? '22px' : '24px',
                                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                minHeight: isMobile ? '80px' : '100px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '8px'
                              }}
                              rows={isMobile ? 3 : 4}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="text-xs text-gray-500 feedback_disclaimer" style={{
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              This feedback is used to improve our machine learning models and solution accuracy.
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Parent Cascade: Other Related Documents */}
                  <motion.div
                    className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/30 p-2 sm:p-3 other_docs_container"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.25,
                      duration: prefersReducedMotion ? 0 : 0.2,
                      ease: [0.22, 0.61, 0.36, 1]
                    }}
                  >
                    {/* Header Row */}
                    <button
                      className="flex w-full items-center justify-between text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 other_docs_header"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRelatedDocs(solution.id);
                      }}
                      style={{
                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      <span>
                        Other related documents{" "}
                        {((solution.related_docs?.length || 0) > 0) && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            ({solution.related_docs?.length || 2})
                          </span>
                        )}
                      </span>
                      <motion.div
                        animate={{
                          rotate: expandedRelatedDocs.has(solution.id) ? 180 : 0
                        }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.2,
                          ease: [0.22, 0.61, 0.36, 1]
                        }}
                      >
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      </motion.div>
                    </button>

                    {/* Expanded Content - Contains both related docs and nested all docs */}
                    <AnimatePresence>
                      {expandedRelatedDocs.has(solution.id) && (
                        <motion.div
                          className="mt-3 space-y-3"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.2,
                            ease: [0.22, 0.61, 0.36, 1]
                          }}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Related Documents List */}
                          <div className="space-y-2 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto">
                            {(solution.related_docs?.length || 0) === 0 ? (
                              <p className="text-xs italic text-gray-400 dark:text-gray-500 py-1">
                                No other documents found
                              </p>
                            ) : (
                              (solution.related_docs || [
                                { file_name: "Engine Manual 3512B.pdf", doc_link: "#", page_number: 42, confidence: 0.75 },
                                { file_name: "Maintenance Log Q3-2024.pdf", doc_link: "#", page_number: 15, confidence: 0.68 }
                              ]).map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={doc.doc_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between truncate py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                  title={`${doc.file_name}${doc.page_number ? ` (Page ${doc.page_number})` : ''}`}
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    <span
                                      className="text-gray-500 dark:text-gray-400 font-mono mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm"
                                      style={{
                                        fontFamily: 'Menlo, Monaco, "Courier New", monospace'
                                      }}
                                    >
                                      {idx + 1}.
                                    </span>
                                    <span
                                      className="flex-1 truncate text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
                                      style={{
                                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                      }}
                                    >
                                      {doc.file_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                    {doc.page_number && (
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        p.{doc.page_number}
                                      </span>
                                    )}
                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                                  </div>
                                </a>
                              ))
                            )}
                          </div>

                          {/* Nested Cascade: All Documents Searched (Only if docs exist) */}
                          {((solution.all_docs && solution.all_docs.length > 0) || (!solution.all_docs && [
                            { file_name: "Engine Manual 3512B.pdf", doc_link: "#", page_number: 42 },
                            { file_name: "Maintenance Log Q3-2024.pdf", doc_link: "#", page_number: 15 },
                            { file_name: "Safety Procedures.pdf", doc_link: "#", page_number: 8 },
                            { file_name: "Technical Specifications.pdf", doc_link: "#", page_number: 23 },
                            { file_name: "Troubleshooting Guide.pdf", doc_link: "#", page_number: 67 }
                          ].length > 0)) && (
                            <div className="pl-2 sm:pl-3">
                              <motion.div
                                className="rounded-md border border-white/15 dark:border-white/8 bg-white/30 dark:bg-black/20 p-2"
                                initial={{ opacity: 0, y: 2 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: prefersReducedMotion ? 0 : 0.1,
                                  duration: prefersReducedMotion ? 0 : 0.15
                                }}
                              >
                                <button
                                  className="flex w-full items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAllDocs(solution.id);
                                  }}
                                  style={{
                                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                  }}
                                >
                                  <span>
                                    All documents searched ({solution.all_docs?.length || 5})
                                  </span>
                                  <motion.div
                                    animate={{
                                      rotate: expandedAllDocs.has(solution.id) ? 180 : 0
                                    }}
                                    transition={{
                                      duration: prefersReducedMotion ? 0 : 0.15,
                                      ease: [0.22, 0.61, 0.36, 1]
                                    }}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </motion.div>
                                </button>

                                {/* Nested All Docs List */}
                                <AnimatePresence>
                                  {expandedAllDocs.has(solution.id) && (
                                    <motion.div
                                      className="mt-2 space-y-1 max-h-24 sm:max-h-32 overflow-y-auto"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{
                                        duration: prefersReducedMotion ? 0 : 0.15,
                                        ease: [0.22, 0.61, 0.36, 1]
                                      }}
                                      style={{ overflow: 'hidden' }}
                                    >
                                      {(solution.all_docs || [
                                        { file_name: "Engine Manual 3512B.pdf", doc_link: "#", page_number: 42 },
                                        { file_name: "Maintenance Log Q3-2024.pdf", doc_link: "#", page_number: 15 },
                                        { file_name: "Safety Procedures.pdf", doc_link: "#", page_number: 8 },
                                        { file_name: "Technical Specifications.pdf", doc_link: "#", page_number: 23 },
                                        { file_name: "Troubleshooting Guide.pdf", doc_link: "#", page_number: 67 }
                                      ]).map((doc, idx) => (
                                        <a
                                          key={idx}
                                          href={doc.doc_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-between truncate py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                          title={`${doc.file_name}${doc.page_number ? ` (Page ${doc.page_number})` : ''}`}
                                        >
                                          <div className="flex items-center flex-1 min-w-0">
                                            <span
                                              className="text-gray-400 dark:text-gray-500 font-mono mr-1 sm:mr-2 flex-shrink-0 text-xs"
                                              style={{
                                                fontFamily: 'Menlo, Monaco, "Courier New", monospace'
                                              }}
                                            >
                                              {idx + 1}.
                                            </span>
                                            <span
                                              className="flex-1 truncate text-gray-500 dark:text-gray-400 text-xs"
                                              style={{
                                                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                              }}
                                            >
                                              {doc.file_name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            {doc.page_number && (
                                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                                p.{doc.page_number}
                                              </span>
                                            )}
                                            <FileText className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                          </div>
                                        </a>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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