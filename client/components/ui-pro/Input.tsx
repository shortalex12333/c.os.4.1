import React, { forwardRef, useState } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  inputSize = 'md',
  fullWidth = true,
  className = '',
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const { colors, components, typography, foundations, animation } = siteDesignSystem;
  const themeColors = colors[theme];
  const inputConfig = components.input.variant[variant][theme];
  const sizeConfig = components.input.height[inputSize];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.xs}px`,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: typography.fontFamily.primary
  };

  const labelStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.sm}px`,
    fontWeight: typography.fontWeight.medium,
    lineHeight: `${typography.lineHeight.sm}px`,
    color: error ? themeColors.text.error : themeColors.text.secondary,
    marginBottom: `${foundations.grid.spacing.xs}px`,
    transition: `color ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const inputContainerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  };

  const inputStyles: React.CSSProperties = {
    // Layout
    width: '100%',
    height: `${sizeConfig}px`,
    padding: leftIcon || rightIcon 
      ? `0 ${components.input.padding.x + (rightIcon ? 32 : 0)}px 0 ${components.input.padding.x + (leftIcon ? 32 : 0)}px`
      : `0 ${components.input.padding.x}px`,
    
    // Typography
    fontSize: `${components.input.fontSize}px`,
    fontFamily: typography.fontFamily.primary,
    lineHeight: 1.5,
    
    // Visual
    backgroundColor: isFocused ? inputConfig.focus?.background || inputConfig.background : inputConfig.background,
    color: inputConfig.color,
    border: `1px solid ${
      error 
        ? themeColors.border.error 
        : isFocused 
          ? inputConfig.focus?.border || themeColors.border.focus
          : inputConfig.border
    }`,
    borderRadius: `${components.input.borderRadius}px`,
    outline: 'none',
    
    // Interaction
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    
    // Placeholder
    '::placeholder': {
      color: inputConfig.placeholder,
      opacity: 1
    } as any
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    color: isFocused ? themeColors.controls.iconActive : themeColors.controls.icon,
    transition: `color ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    pointerEvents: 'none'
  };

  const leftIconStyles: React.CSSProperties = {
    ...iconStyles,
    left: `${foundations.grid.spacing.md}px`
  };

  const rightIconStyles: React.CSSProperties = {
    ...iconStyles,
    right: `${foundations.grid.spacing.md}px`
  };

  const hintStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.xs}px`,
    lineHeight: `${typography.lineHeight.xs}px`,
    color: error ? themeColors.text.error : themeColors.text.tertiary,
    marginTop: `${foundations.grid.spacing.xs}px`
  };

  const focusRingStyles: React.CSSProperties = {
    position: 'absolute',
    inset: '-2px',
    borderRadius: `${components.input.borderRadius + 2}px`,
    boxShadow: isFocused ? inputConfig.focus?.shadow || `0 0 0 3px ${themeColors.border.focus}20` : 'none',
    transition: `box-shadow ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    pointerEvents: 'none'
  };

  return (
    <div style={containerStyles} className={`ui-pro-input-container ${className}`}>
      {label && (
        <label style={labelStyles} className="ui-pro-input-label">
          {label}
        </label>
      )}
      
      <div style={inputContainerStyles} className="ui-pro-input-wrapper">
        <div style={focusRingStyles} className="ui-pro-input-focus-ring" />
        
        {leftIcon && (
          <div style={leftIconStyles} className="ui-pro-input-left-icon">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          style={inputStyles}
          className={`ui-pro-input ui-pro-input--${variant} ui-pro-input--${inputSize}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && (
          <div style={rightIconStyles} className="ui-pro-input-right-icon">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(hint || error) && (
        <div style={hintStyles} className={`ui-pro-input-hint ${error ? 'ui-pro-input-hint--error' : ''}`}>
          {error || hint}
        </div>
      )}
      
      <style jsx>{`
        .ui-pro-input-container {
          position: relative;
        }
        
        .ui-pro-input-wrapper {
          position: relative;
        }
        
        .ui-pro-input::placeholder {
          color: ${inputConfig.placeholder};
          opacity: 1;
        }
        
        .ui-pro-input::-webkit-input-placeholder {
          color: ${inputConfig.placeholder};
        }
        
        .ui-pro-input::-moz-placeholder {
          color: ${inputConfig.placeholder};
          opacity: 1;
        }
        
        .ui-pro-input:-ms-input-placeholder {
          color: ${inputConfig.placeholder};
        }
        
        .ui-pro-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .ui-pro-input:hover:not(:disabled):not(:focus) {
          border-color: ${themeColors.border.interactive};
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;