import React, { forwardRef } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'iconSm' | 'iconLg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, components, animation } = siteDesignSystem;
  const themeColors = colors[theme];
  
  // Get button configuration
  const sizeConfig = components.button.size[size];
  const variantConfig = components.button.variant[variant]?.[theme];
  
  if (!variantConfig) {
    console.warn(`Button variant "${variant}" not found for theme "${theme}"`);
    return null;
  }

  const baseStyles: React.CSSProperties = {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: leftIcon || rightIcon ? '8px' : '0',
    width: fullWidth ? '100%' : (size.includes('icon') ? `${sizeConfig.width}px` : 'auto'),
    height: `${sizeConfig.height}px`,
    padding: size.includes('icon') ? '0' : `0 ${sizeConfig.paddingX}px`,
    
    // Typography
    fontSize: `${sizeConfig.fontSize}px`,
    fontWeight: 500,
    fontFamily: siteDesignSystem.typography.fontFamily.primary,
    lineHeight: 1,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    
    // Visual
    backgroundColor: variantConfig.background,
    color: variantConfig.color,
    border: variantConfig.border || 'none',
    borderRadius: `${siteDesignSystem.foundations.radius.sm}px`,
    outline: 'none',
    
    // Interaction
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    
    // Accessibility
    userSelect: 'none',
    WebkitUserSelect: 'none',
    
    // Focus states
    boxShadow: 'none',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const target = e.currentTarget;
    if (variantConfig.hover) {
      Object.assign(target.style, variantConfig.hover);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const target = e.currentTarget;
    target.style.backgroundColor = variantConfig.background;
    target.style.color = variantConfig.color;
    target.style.border = variantConfig.border || 'none';
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const target = e.currentTarget;
    target.style.boxShadow = `0 0 0 3px ${variant === 'primary' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.boxShadow = 'none';
  };

  return (
    <button
      ref={ref}
      style={baseStyles}
      className={`ui-pro-button ui-pro-button--${variant} ui-pro-button--${size} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {loading ? (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${variantConfig.color}`,
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'ui-pro-spin 1s linear infinite'
          }}
        />
      ) : (
        <>
          {leftIcon && (
            <span className="ui-pro-button__left-icon" style={{ display: 'flex' }}>
              {leftIcon}
            </span>
          )}
          {children && (
            <span className="ui-pro-button__text">
              {children}
            </span>
          )}
          {rightIcon && (
            <span className="ui-pro-button__right-icon" style={{ display: 'flex' }}>
              {rightIcon}
            </span>
          )}
        </>
      )}
      
      <style jsx global>{`
        @keyframes ui-pro-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .ui-pro-button {
          position: relative;
        }
        
        .ui-pro-button:active {
          transform: translateY(1px);
        }
        
        .ui-pro-button:disabled:active {
          transform: none;
        }
        
        /* Ripple effect for primary buttons */
        .ui-pro-button--primary:not(:disabled)::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        .ui-pro-button--primary:not(:disabled):active::before {
          opacity: 1;
        }
      `}</style>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;