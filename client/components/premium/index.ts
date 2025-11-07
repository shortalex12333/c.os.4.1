// Premium Component Library - Phase 3 Architecture Refactoring
// Centralized component exports with enhanced premium features

// Core premium components (only existing ones)
export { default as PremiumErrorBoundary } from './PremiumErrorBoundary';
export { default as PremiumSolutionCard } from './PremiumSolutionCard';
export { default as PremiumChatInput } from './PremiumChatInput';
export { default as PremiumHeader } from './PremiumHeader';
export { default as PremiumSidebar } from './PremiumSidebar';
export { default as PremiumMaritimeAnalysis } from './PremiumMaritimeAnalysis';

// Enhanced premium component base
export { withPremiumFeatures } from './withPremiumFeatures';
export { PremiumProvider, usePremiumContext } from './PremiumProvider';

// Premium animation components (only existing ones)
export { PremiumMotionDiv, PremiumAnimatePresence } from './PremiumAnimations';
export { default as PremiumGlassCard } from './PremiumGlassCard';

// Premium form components (only existing ones)
export { default as PremiumInput } from './PremiumInput';
export { default as PremiumButton } from './PremiumButton';

// Component types
export type {
  PremiumComponentProps,
  PremiumAnimationProps,
  PremiumStyleProps,
  PremiumAccessibilityProps,
  PremiumPerformanceProps
} from './types';