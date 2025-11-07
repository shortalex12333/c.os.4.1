import React, { forwardRef } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'filled' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  children?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  radius = 'xl',
  hover = false,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, animation, components } = siteDesignSystem;
  const themeColors = colors[theme];
  
  const paddingMap = {
    none: 0,
    sm: components.card.padding.sm,
    md: components.card.padding.md,
    lg: components.card.padding.lg
  };

  const radiusMap = {
    none: foundations.radius.none,
    sm: foundations.radius.sm,
    md: foundations.radius.md,
    lg: foundations.radius.lg,
    xl: foundations.radius.xl
  };

  const getVariantStyles = () => {
    const baseCard = components.card.variant.default[theme];
    
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          border: `${components.card.borderWidth}px solid ${baseCard.border}`,
          boxShadow: 'none'
        };
        
      case 'filled':
        return {
          backgroundColor: themeColors.surface.secondary,
          border: 'none',
          boxShadow: 'none'
        };
        
      case 'elevated':
        return {
          backgroundColor: baseCard.background,
          border: `${components.card.borderWidth}px solid ${baseCard.border}`,
          boxShadow: theme === 'light' ? foundations.elevation.large : foundations.elevation.darkLarge
        };
        
      case 'interactive':
        return {
          backgroundColor: baseCard.background,
          border: `${components.card.borderWidth}px solid ${baseCard.border}`,
          boxShadow: baseCard.shadow,
          cursor: 'pointer'
        };
        
      default:
        return {
          backgroundColor: baseCard.background,
          border: `${components.card.borderWidth}px solid ${baseCard.border}`,
          boxShadow: baseCard.shadow
        };
    }
  };

  const variantStyles = getVariantStyles();
  
  const baseStyles: React.CSSProperties = {
    // Layout
    position: 'relative',
    display: 'block',
    width: '100%',
    minHeight: 'auto',
    padding: `${paddingMap[padding]}px`,
    
    // Visual
    ...variantStyles,
    borderRadius: `${radiusMap[radius]}px`,
    
    // Interaction
    transition: `all ${animation.duration.normal}ms ${animation.easing.easeOut}`,
    overflow: 'hidden',
    
    // Typography inheritance
    fontFamily: 'inherit',
    color: 'inherit'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover && variant !== 'interactive') return;
    
    const target = e.currentTarget;
    
    if (variant === 'interactive') {
      target.style.transform = 'translateY(-2px)';
      target.style.boxShadow = theme === 'light' 
        ? foundations.elevation.xlarge 
        : foundations.elevation.darkLarge;
    } else if (hover) {
      target.style.transform = 'translateY(-1px)';
      target.style.boxShadow = theme === 'light'
        ? foundations.elevation.medium
        : foundations.elevation.darkMedium;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover && variant !== 'interactive') return;
    
    const target = e.currentTarget;
    target.style.transform = 'translateY(0)';
    target.style.boxShadow = variantStyles.boxShadow as string;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      // Add click effect
      const target = e.currentTarget;
      target.style.transform = 'translateY(0)';
      setTimeout(() => {
        target.style.transform = hover || variant === 'interactive' ? 'translateY(-2px)' : 'translateY(0)';
      }, 100);
      
      onClick(e);
    }
  };

  return (
    <div
      ref={ref}
      style={baseStyles}
      className={`ui-pro-card ui-pro-card--${variant} ui-pro-card--padding-${padding} ui-pro-card--radius-${radius} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {children}
      
      <style jsx>{`
        .ui-pro-card {
          /* Ensure smooth transitions */
          will-change: transform, box-shadow;
        }
        
        .ui-pro-card--interactive {
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .ui-pro-card--interactive:active {
          transform: translateY(0px) !important;
        }
        
        /* Focus styles for accessibility */
        .ui-pro-card--interactive:focus {
          outline: none;
          box-shadow: ${variantStyles.boxShadow}, 0 0 0 3px ${themeColors.border.focus}40;
        }
        
        /* Subtle animation for content */
        .ui-pro-card > * {
          transition: opacity ${animation.duration.fast}ms ${animation.easing.easeOut};
        }
      `}</style>
    </div>
  );
});

Card.displayName = 'Card';

// Card Header component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  title,
  subtitle,
  action,
  className = '',
  children,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, typography, foundations } = siteDesignSystem;
  const themeColors = colors[theme];

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: `${foundations.grid.spacing.lg}px`,
    fontFamily: typography.fontFamily.primary
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0
  };

  const titleStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize['2xl']}px`,
    lineHeight: `${typography.lineHeight['2xl']}px`,
    fontWeight: typography.fontWeight.semibold,
    color: themeColors.text.primary,
    margin: 0,
    marginBottom: subtitle ? `${foundations.grid.spacing.xs}px` : 0
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: `${typography.fontSize.base}px`,
    lineHeight: `${typography.lineHeight.base}px`,
    color: themeColors.text.secondary,
    margin: 0
  };

  const actionStyles: React.CSSProperties = {
    marginLeft: `${foundations.grid.spacing.md}px`,
    flexShrink: 0
  };

  return (
    <div
      ref={ref}
      style={headerStyles}
      className={`ui-pro-card-header ${className}`}
      {...props}
    >
      <div style={contentStyles} className="ui-pro-card-header-content">
        {title && (
          <h3 style={titleStyles} className="ui-pro-card-title">
            {title}
          </h3>
        )}
        {subtitle && (
          <p style={subtitleStyles} className="ui-pro-card-subtitle">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      
      {action && (
        <div style={actionStyles} className="ui-pro-card-action">
          {action}
        </div>
      )}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// Card Body component
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(({
  className = '',
  children,
  ...props
}, ref) => {
  const bodyStyles: React.CSSProperties = {
    flex: 1,
    width: '100%'
  };

  return (
    <div
      ref={ref}
      style={bodyStyles}
      className={`ui-pro-card-body ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardBody.displayName = 'CardBody';

// Card Footer component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  align = 'right',
  className = '',
  children,
  ...props
}, ref) => {
  const { foundations } = siteDesignSystem;

  const alignmentMap = {
    left: 'flex-start',
    center: 'center', 
    right: 'flex-end',
    between: 'space-between'
  };

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: alignmentMap[align],
    gap: `${foundations.grid.spacing.md}px`,
    marginTop: `${foundations.grid.spacing.lg}px`,
    paddingTop: `${foundations.grid.spacing.md}px`,
    borderTop: `1px solid ${foundations.grid.spacing.xs}px`
  };

  return (
    <div
      ref={ref}
      style={footerStyles}
      className={`ui-pro-card-footer ui-pro-card-footer--${align} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export default Card;