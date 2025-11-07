// Premium Input Component
// Advanced input field with glassmorphism, animations, and accessibility

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePremiumContext } from './PremiumProvider';
import { useFallbackMode } from '../../hooks/useFallbackMode';
import { usePerformanceBudget } from '../../hooks/usePerformanceBudget';
import { useAccessibility } from '../../hooks/useAccessibility';
import { trackEvent } from '../../services/monitoringService';
import type { PremiumInputProps } from './types';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const inputVariants = {
  primary: {
    light: 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500/20',
    dark: 'bg-gray-800 border-gray-600 focus:border-blue-400 focus:ring-blue-400/20 text-white',
    glass: 'bg-white/10 border-white/20 focus:border-blue-400/50 focus:ring-blue-400/20 backdrop-blur-md text-white placeholder-white/70',
  },
  secondary: {
    light: 'bg-gray-50 border-gray-200 focus:border-gray-400 focus:ring-gray-400/20',
    dark: 'bg-gray-700 border-gray-600 focus:border-gray-400 focus:ring-gray-400/20 text-white',
    glass: 'bg-gray-500/10 border-gray-500/20 focus:border-gray-400/50 focus:ring-gray-400/20 backdrop-blur-md text-white placeholder-white/70',
  },
  accent: {
    light: 'bg-white border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20',
    dark: 'bg-gray-800 border-emerald-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white',
    glass: 'bg-emerald-500/10 border-emerald-500/20 focus:border-emerald-400/50 focus:ring-emerald-400/20 backdrop-blur-md text-white placeholder-white/70',
  },
  neutral: {
    light: 'bg-white border-gray-300 focus:border-gray-500 focus:ring-gray-500/20',
    dark: 'bg-gray-800 border-gray-600 focus:border-gray-400 focus:ring-gray-400/20 text-white',
    glass: 'bg-gray-500/10 border-gray-500/20 focus:border-gray-400/50 focus:ring-gray-400/20 backdrop-blur-md text-white placeholder-white/70',
  },
};

const sizeStyles = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-4 py-3 text-lg rounded-xl',
  xl: 'px-6 py-4 text-xl rounded-xl',
};

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(({
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  onChange,
  onFocus,
  onBlur,
  error,
  helperText,
  startAdornment,
  endAdornment,
  className,
  variant = 'primary',
  size = 'md',
  glassmorphism = false,
  enableAnimations = true,
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Premium context and hooks
  const { theme, animationsEnabled } = usePremiumContext();
  const { shouldUseGlassEffect } = useFallbackMode();
  const { shouldDisableAnimations } = usePerformanceBudget();
  const { announceToScreenReader, createKeyboardHandler } = useAccessibility();

  // Determine styling mode
  const glassMode = glassmorphism && shouldUseGlassEffect();
  const styleMode = glassMode ? 'glass' : theme;
  
  // Determine if effects should be enabled
  const effectsEnabled = enableAnimations && 
                        animationsEnabled && 
                        !shouldDisableAnimations;

  // Input type with password toggle
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Validation state
  const isValid = !error && internalValue.length > 0;
  const hasError = !!error;

  // Handle controlled/uncontrolled input
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Keyboard navigation for password toggle
  const handleKeyboard = createKeyboardHandler({
    'Escape': () => {
      if (inputRef.current) {
        inputRef.current.blur();
        trackEvent('premium_input_escaped', { type, variant, size });
      }
    },
  });

  // Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    if (onChange) {
      onChange(e);
    }
    
    trackEvent('premium_input_changed', { 
      type, 
      variant, 
      size,
      hasValue: newValue.length > 0,
      valueLength: newValue.length,
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    if (onFocus) {
      onFocus(e);
    }
    
    if (ariaLabel) {
      announceToScreenReader(`Focused on ${ariaLabel}`, 'polite');
    }
    
    trackEvent('premium_input_focused', { type, variant, size });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    if (onBlur) {
      onBlur(e);
    }
    
    trackEvent('premium_input_blurred', { 
      type, 
      variant, 
      size,
      hasValue: internalValue.length > 0,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    trackEvent('premium_input_password_toggled', { visible: !showPassword });
    announceToScreenReader(
      showPassword ? 'Password hidden' : 'Password visible',
      'assertive'
    );
  };

  // Animation variants
  const containerVariants = effectsEnabled ? {
    rest: { scale: 1 },
    focus: { 
      scale: 1.01,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  } : {};

  const labelVariants = effectsEnabled ? {
    rest: { 
      y: 0, 
      scale: 1,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    focus: { 
      y: -20, 
      scale: 0.85,
      color: hasError ? '#EF4444' : '#3B82F6',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  } : {};

  // Input classes
  const inputClasses = cn(
    // Base styles
    'premium-input w-full border transition-all duration-200 focus:outline-none focus:ring-2',
    
    // Size styles
    sizeStyles[size],
    
    // Variant styles
    inputVariants[variant][styleMode],
    
    // State styles
    disabled && 'opacity-50 cursor-not-allowed',
    readOnly && 'bg-gray-50 dark:bg-gray-700',
    hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
    isValid && !hasError && 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
    
    // Glass effect
    glassMode && 'backdrop-blur-md',
    
    // Adornment padding
    startAdornment && 'pl-10',
    (endAdornment || type === 'password') && 'pr-10',
    
    className
  );

  const containerClasses = cn(
    'premium-input-container relative',
    disabled && 'pointer-events-none'
  );

  const MotionContainer = effectsEnabled ? motion.div : 'div';
  const motionProps = effectsEnabled ? {
    variants: containerVariants,
    initial: 'rest',
    animate: isFocused ? 'focus' : 'rest',
  } : {};

  const inputElement = (
    <input
      ref={ref || inputRef}
      type={inputType}
      value={value !== undefined ? value : internalValue}
      defaultValue={value === undefined ? defaultValue : undefined}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      className={inputClasses}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyboard}
      aria-label={ariaLabel}
      aria-invalid={hasError}
      aria-describedby={
        error ? `${testId}-error` : 
        helperText ? `${testId}-helper` : 
        undefined
      }
      data-testid={testId}
      data-premium-input="true"
      data-variant={variant}
      data-size={size}
      data-glass={glassMode}
      data-focused={isFocused}
      data-has-error={hasError}
      data-has-value={internalValue.length > 0}
      {...props}
    />
  );

  return (
    <MotionContainer className={containerClasses} {...motionProps}>
      {/* Start Adornment */}
      {startAdornment && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10">
          {startAdornment}
        </div>
      )}
      
      {/* Input Field */}
      {inputElement}
      
      {/* End Adornment / Password Toggle */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 z-10">
        {/* Validation Icon */}
        {effectsEnabled && (
          <AnimatePresence>
            {isValid && !hasError && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </motion.div>
            )}
            {hasError && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        
        {/* Custom End Adornment */}
        {endAdornment && (
          <div className="text-gray-400 dark:text-gray-500">
            {endAdornment}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id={`${testId}-error`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-sm text-red-500 flex items-center space-x-1"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Helper Text */}
      {helperText && !error && (
        <div
          id={`${testId}-helper`}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </div>
      )}
      
      {/* Character Count */}
      {maxLength && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-right">
          {internalValue.length}/{maxLength}
        </div>
      )}
    </MotionContainer>
  );
});

PremiumInput.displayName = 'PremiumInput';

export default PremiumInput;