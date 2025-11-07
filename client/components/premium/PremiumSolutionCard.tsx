import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import PremiumErrorBoundary from './PremiumErrorBoundary';
import { useAnimationCleanup } from '../../hooks/useAnimationCleanup';
import { useFallbackMode, withFallbackAnimation } from '../../hooks/useFallbackMode';
import { usePerformanceBudget } from '../../hooks/usePerformanceBudget';
import { useAccessibility, useAriaAttributes, useKeyboardNavigation } from '../../hooks/useAccessibility';
import { trackEvent, recordMetric } from '../../services/monitoringService';
import { 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Shield,
  Sparkles,
  Activity,
  Cpu,
  Waves
} from 'lucide-react';

interface Solution {
  solution_id: string;
  title: string;
  confidence_percentage: number;
  steps: string[];
  document_locations: string[];
}

interface PremiumSolutionCardProps {
  solution: Solution;
  index: number;
  onFeedback?: (solutionId: string, worked: boolean) => void;
}

const PremiumSolutionCard: React.FC<PremiumSolutionCardProps> = ({
  solution,
  index,
  onFeedback
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Performance and fallback hooks
  const { registerAnimation, unregisterAnimation, shouldDisableAnimations } = usePerformanceBudget();
  const { shouldAnimateComponent, shouldUseGlassEffect } = useFallbackMode();
  const { registerEventListener, cleanup } = useAnimationCleanup();
  const { announceToScreenReader } = useAccessibility();
  const { createKeyboardHandler } = useKeyboardNavigation();
  
  // Determine if animations should be enabled
  const animationsEnabled = shouldAnimateComponent('PremiumSolutionCard') && !shouldDisableAnimations;
  
  // Spring animations (conditional)
  const x = useSpring(0, { stiffness: animationsEnabled ? 300 : 0, damping: 30 });
  const y = useSpring(0, { stiffness: animationsEnabled ? 300 : 0, damping: 30 });
  const rotateX = useTransform(y, [-100, 100], animationsEnabled ? [10, -10] : [0, 0]);
  const rotateY = useTransform(x, [-100, 100], animationsEnabled ? [-10, 10] : [0, 0]);

  // 3D card effect on mouse move (with cleanup)
  useEffect(() => {
    if (!animationsEnabled) return;
    
    registerAnimation(`solution-card-${solution.solution_id}`);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      x.set((e.clientX - centerX) / 5);
      y.set((e.clientY - centerY) / 5);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    const card = cardRef.current;
    if (card) {
      registerEventListener(card, 'mousemove', handleMouseMove);
      registerEventListener(card, 'mouseleave', handleMouseLeave);
    }

    return () => {
      unregisterAnimation(`solution-card-${solution.solution_id}`);
      cleanup();
    };
  }, [x, y, animationsEnabled, registerAnimation, unregisterAnimation, registerEventListener, cleanup, solution.solution_id]);

  // Confidence color and icon
  const getConfidenceDetails = () => {
    if (solution.confidence_percentage >= 90) {
      return { 
        color: 'from-emerald-500 to-green-600', 
        bgColor: 'from-emerald-500/10 to-green-600/10',
        icon: Shield,
        label: 'Verified Solution'
      };
    } else if (solution.confidence_percentage >= 70) {
      return { 
        color: 'from-blue-500 to-indigo-600', 
        bgColor: 'from-blue-500/10 to-indigo-600/10',
        icon: CheckCircle2,
        label: 'Recommended'
      };
    } else {
      return { 
        color: 'from-amber-500 to-orange-600', 
        bgColor: 'from-amber-500/10 to-orange-600/10',
        icon: Activity,
        label: 'Alternative'
      };
    }
  };

  const confidence = getConfidenceDetails();
  const ConfidenceIcon = confidence.icon;

  // Accessibility attributes
  const cardAriaProps = useAriaAttributes(
    'article',
    `Solution: ${solution.title}`,
    undefined,
    isExpanded,
    undefined,
    undefined
  );

  // Keyboard navigation
  const handleKeyboard = createKeyboardHandler({
    'Enter': () => {
      setIsExpanded(!isExpanded);
      trackEvent('solution_card_keyboard_toggle', { solutionId: solution.solution_id, expanded: !isExpanded });
    },
    'Space': (e) => {
      e.preventDefault();
      setIsExpanded(!isExpanded);
      trackEvent('solution_card_keyboard_toggle', { solutionId: solution.solution_id, expanded: !isExpanded });
    },
  });

  // Track interactions
  useEffect(() => {
    if (isExpanded) {
      trackEvent('solution_card_expanded', { 
        solutionId: solution.solution_id,
        confidence: solution.confidence_percentage 
      });
      announceToScreenReader(`Solution details expanded: ${solution.title}`);
      recordMetric('solution_card_expand_time', performance.now());
    }
  }, [isExpanded, solution.solution_id, solution.confidence_percentage, solution.title, announceToScreenReader]);

  // Animation props with fallback
  const animationProps = withFallbackAnimation(
    animationsEnabled,
    {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition: { 
        delay: index * 0.1, 
        type: "spring", 
        stiffness: 100, 
        damping: 20 
      },
      style: { rotateX, rotateY, transformStyle: 'preserve-3d' as const }
    },
    {
      style: { transformStyle: 'flat' as const }
    }
  );

  return (
    <PremiumErrorBoundary
      onError={(error) => {
        console.error('PremiumSolutionCard error:', error);
        unregisterAnimation(`solution-card-${solution.solution_id}`);
      }}
    >
      <motion.div
        ref={cardRef}
        {...animationProps}
        {...cardAriaProps}
        className="relative group"
        tabIndex={0}
        onKeyDown={handleKeyboard}
        role="button"
      >
      <div 
        className={cn(
          "premium-card p-8 cursor-pointer",
          "bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90",
          "border border-gray-200/20 dark:border-gray-700/20",
          isExpanded && "ring-2 ring-blue-500/30",
          "focus-within:ring-2 focus-within:ring-blue-500/50"
        )}
        onClick={() => {
          setIsExpanded(!isExpanded);
          trackEvent('solution_card_clicked', { solutionId: solution.solution_id, expanded: !isExpanded });
        }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br rounded-[20px]",
            confidence.bgColor
          )} />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl bg-gradient-to-br shadow-lg",
                confidence.color
              )}>
                <ConfidenceIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {confidence.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  System Manual Reference
                </p>
              </div>
            </div>
            
            {/* Confidence Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
              className={cn(
                "px-4 py-2 rounded-full font-bold text-sm text-white shadow-lg bg-gradient-to-r",
                confidence.color
              )}
            >
              {solution.confidence_percentage}%
            </motion.div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
              {solution.title}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              {solution.steps[0] || "Advanced diagnostic solution from technical documentation"}
            </p>
          </div>

          {/* Premium Code Block */}
          <motion.div 
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black p-6 shadow-inner"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10" />
            
            {/* Animated circuit pattern */}
            <div className="absolute inset-0 opacity-10">
              <Cpu className="absolute top-4 right-4 h-8 w-8 text-blue-400" />
              <Waves className="absolute bottom-4 left-4 h-8 w-8 text-purple-400" />
            </div>

            <div className="relative space-y-3 font-mono">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Diagnostic Output</span>
              </div>
              <div className="text-emerald-400">
                // Fuel System Diagnostics
              </div>
              <div className="text-gray-100">
                Page 247, Section 4.2
              </div>
              <div className="text-blue-400 text-sm">
                → Recommended Action: {solution.title}
              </div>
            </div>
          </motion.div>

          {/* Expand Indicator */}
          <motion.div 
            className="flex items-center justify-center pt-2"
            animate={{ x: isExpanded ? 5 : 0 }}
          >
            <ChevronRight 
              className={cn(
                "h-5 w-5 text-gray-400 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </motion.div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 space-y-6 border-t border-gray-200/20 dark:border-gray-700/20 pt-8"
            >
              {/* Steps */}
              {solution.steps.length > 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Implementation Steps
                  </h4>
                  <div className="space-y-3">
                    {solution.steps.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 pt-1">
                          {step}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {solution.document_locations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Reference Documents
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {solution.document_locations.map((doc, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="premium-button flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl text-left hover:shadow-lg"
                      >
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {doc.split('/').pop()}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {!feedbackSubmitted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Was this solution helpful?
                  </h4>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackSubmitted(true);
                        onFeedback?.(solution.solution_id, true);
                      }}
                      className="premium-button flex-1 flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Yes, it worked
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackSubmitted(true);
                        onFeedback?.(solution.solution_id, false);
                      }}
                      className="premium-button flex-1 flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:shadow-lg"
                    >
                      <XCircle className="h-5 w-5" />
                      No, it didn't work
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </PremiumErrorBoundary>
  );
};

export default PremiumSolutionCard;