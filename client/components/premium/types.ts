// Premium Component Library Types
// Comprehensive type definitions for the premium component system

import { ReactNode, CSSProperties } from 'react';
import { MotionProps } from 'framer-motion';

// Base Premium Component Props
export interface PremiumComponentProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
  id?: string;
}

// Animation Configuration
export interface PremiumAnimationProps {
  enableAnimations?: boolean;
  reducedMotion?: boolean;
  animationComplexity?: 'low' | 'medium' | 'high';
  customAnimations?: Partial<MotionProps>;
  fallbackStyles?: CSSProperties;
}

// Visual Style Configuration
export interface PremiumStyleProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  glassmorphism?: boolean;
  gradient?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  theme?: 'light' | 'dark' | 'auto';
}

// Accessibility Configuration
export interface PremiumAccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  role?: string;
  tabIndex?: number;
  focusable?: boolean;
  screenReaderText?: string;
  keyboardShortcuts?: Record<string, () => void>;
}

// Performance Configuration
export interface PremiumPerformanceProps {
  lazy?: boolean;
  priority?: 'low' | 'normal' | 'high';
  virtualization?: boolean;
  memoization?: boolean;
  preload?: boolean;
  performanceBudget?: {
    maxRenderTime?: number;
    maxMemoryUsage?: number;
  };
}

// Complete Premium Component Interface
export interface PremiumBaseProps extends 
  PremiumComponentProps,
  PremiumAnimationProps,
  PremiumStyleProps,
  PremiumAccessibilityProps,
  PremiumPerformanceProps {
  
  // Error handling
  onError?: (error: Error, errorInfo: any) => void;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  
  // Performance monitoring
  onPerformanceMetric?: (metric: {
    name: string;
    value: number;
    timestamp: number;
  }) => void;
  
  // User interaction tracking
  onInteraction?: (event: {
    type: string;
    target: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }) => void;
}

// Specific Component Props
export interface PremiumButtonProps extends PremiumBaseProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  target?: string;
  fullWidth?: boolean;
}

export interface PremiumInputProps extends PremiumBaseProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

export interface PremiumCardProps extends PremiumBaseProps {
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
}

export interface PremiumModalProps extends Omit<PremiumBaseProps, 'size'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  backdrop?: 'blur' | 'dark' | 'transparent';
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  preventScroll?: boolean;
}

export interface PremiumTableProps extends PremiumBaseProps {
  columns: Array<{
    key: string;
    title: string;
    dataIndex: string;
    render?: (value: any, record: any, index: number) => ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    width?: number | string;
  }>;
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRowKeys: string[] | number[];
    onChange: (selectedRowKeys: string[] | number[], selectedRows: any[]) => void;
  };
  expandable?: {
    expandedRowRender: (record: any, index: number) => ReactNode;
    expandedRowKeys?: string[] | number[];
    onExpand?: (expanded: boolean, record: any) => void;
  };
}

export interface PremiumChartProps extends PremiumBaseProps {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'donut';
  data: any[];
  xKey?: string;
  yKey?: string;
  colorKey?: string;
  title?: string;
  subtitle?: string;
  legend?: boolean;
  grid?: boolean;
  tooltip?: boolean;
  zoom?: boolean;
  brush?: boolean;
  responsive?: boolean;
  colors?: string[];
  height?: number;
  width?: number;
}

// Higher-Order Component Props
export interface WithPremiumFeaturesOptions {
  errorBoundary?: boolean;
  performance?: boolean;
  accessibility?: boolean;
  analytics?: boolean;
  animations?: boolean;
  responsive?: boolean;
}

// Context Types
export interface PremiumContextValue {
  // Theme and styling
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Animation preferences
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  reducedMotion: boolean;
  
  // Accessibility settings
  accessibilityMode: boolean;
  setAccessibilityMode: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  largeText: boolean;
  setLargeText: (enabled: boolean) => void;
  
  // Performance settings
  performanceMode: boolean;
  setPerformanceMode: (enabled: boolean) => void;
  
  // Error handling
  reportError: (error: Error, context?: string) => void;
  
  // Analytics
  trackEvent: (event: string, properties?: Record<string, any>) => void;
}

// Store Integration Types
export interface PremiumStoreState {
  ui: {
    theme: 'light' | 'dark';
    animationsEnabled: boolean;
    reducedMotion: boolean;
    glassmorphismEnabled: boolean;
    highContrast: boolean;
    largeText: boolean;
  };
  performance: {
    performanceMode: boolean;
    currentFPS: number;
    memoryUsage: number;
    activeAnimations: number;
  };
  accessibility: {
    screenReaderEnabled: boolean;
    keyboardNavigationEnabled: boolean;
    focusIndicatorsEnabled: boolean;
  };
  errors: Array<{
    id: string;
    message: string;
    timestamp: number;
    component?: string;
    resolved: boolean;
  }>;
}

// Event Types
export interface PremiumInteractionEvent {
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'keyboard';
  component: string;
  element?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PremiumPerformanceEvent {
  type: 'render' | 'interaction' | 'navigation' | 'error';
  duration: number;
  component: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Utility Types
export type PremiumSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type PremiumVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'error';
export type PremiumTheme = 'light' | 'dark' | 'auto';
export type PremiumAnimation = 'none' | 'fade' | 'slide' | 'scale' | 'bounce' | 'spring';
export type PremiumShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type PremiumRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';