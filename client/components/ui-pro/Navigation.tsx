import React, { forwardRef, useState } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'horizontal' | 'vertical' | 'sidebar';
  position?: 'top' | 'bottom' | 'left' | 'right';
  fixed?: boolean;
  collapsed?: boolean;
  collapsible?: boolean;
  brand?: React.ReactNode;
  children: React.ReactNode;
}

const Navigation = forwardRef<HTMLElement, NavigationProps>(({
  variant = 'horizontal',
  position = 'top',
  fixed = false,
  collapsed = false,
  collapsible = false,
  brand,
  children,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const { colors, foundations, animation, components } = siteDesignSystem;
  const themeColors = colors[theme];

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: themeColors.surface.primary,
    borderColor: themeColors.border.subtle,
    fontFamily: siteDesignSystem.typography.fontFamily.primary,
    zIndex: 100,
    transition: `all ${animation.duration.normal}ms ${animation.easing.easeOut}`
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'horizontal':
        return {
          ...baseStyles,
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          height: `${components.navigation.height}px`,
          padding: `0 ${foundations.grid.spacing.xl}px`,
          borderBottom: `1px solid ${themeColors.border.subtle}`,
          ...(fixed && {
            position: 'fixed',
            top: position === 'top' ? 0 : 'auto',
            bottom: position === 'bottom' ? 0 : 'auto',
            left: 0,
            right: 0
          })
        };

      case 'vertical':
        return {
          ...baseStyles,
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: isCollapsed ? '64px' : `${components.navigation.sidebarWidth}px`,
          minHeight: '100vh',
          padding: `${foundations.grid.spacing.lg}px 0`,
          borderRight: position === 'left' ? `1px solid ${themeColors.border.subtle}` : 'none',
          borderLeft: position === 'right' ? `1px solid ${themeColors.border.subtle}` : 'none',
          ...(fixed && {
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: position === 'left' ? 0 : 'auto',
            right: position === 'right' ? 0 : 'auto'
          })
        };

      case 'sidebar':
        return {
          ...baseStyles,
          flexDirection: 'column',
          alignItems: 'stretch',
          width: isCollapsed ? '64px' : `${components.navigation.sidebarWidth}px`,
          minHeight: '100vh',
          padding: 0,
          borderRight: `1px solid ${themeColors.border.subtle}`,
          boxShadow: theme === 'light' ? foundations.elevation.small : foundations.elevation.darkSmall,
          ...(fixed && {
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0
          })
        };

      default:
        return baseStyles;
    }
  };

  const brandStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${foundations.grid.spacing.md}px`,
    padding: variant === 'sidebar' 
      ? `${foundations.grid.spacing.lg}px ${foundations.grid.spacing.xl}px`
      : '0',
    fontSize: `${siteDesignSystem.typography.fontSize.lg}px`,
    fontWeight: 600,
    color: themeColors.text.primary,
    textDecoration: 'none',
    borderBottom: variant === 'sidebar' ? `1px solid ${themeColors.border.subtle}` : 'none',
    marginBottom: variant === 'sidebar' ? `${foundations.grid.spacing.md}px` : '0'
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: variant === 'horizontal' ? 'row' : 'column',
    alignItems: variant === 'horizontal' ? 'center' : 'stretch',
    gap: variant === 'horizontal' 
      ? `${foundations.grid.spacing.lg}px` 
      : `${foundations.grid.spacing.xs}px`,
    flex: 1,
    padding: variant === 'sidebar' ? `0 ${foundations.grid.spacing.md}px` : '0'
  };

  const collapseButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: variant === 'sidebar' ? `${foundations.grid.spacing.lg}px` : '50%',
    right: variant === 'sidebar' ? `${foundations.grid.spacing.md}px` : 'auto',
    transform: variant === 'sidebar' ? 'none' : 'translateY(-50%)',
    zIndex: 101
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav
      ref={ref}
      style={getVariantStyles()}
      className={`ui-pro-navigation ui-pro-navigation--${variant} ui-pro-navigation--${position} ${isCollapsed ? 'ui-pro-navigation--collapsed' : ''} ${className}`}
      {...props}
    >
      {brand && (
        <div style={brandStyles} className="ui-pro-navigation-brand">
          {brand}
        </div>
      )}

      {collapsible && (
        <Button
          variant="ghost"
          size="iconSm"
          onClick={handleToggleCollapse}
          style={collapseButtonStyles}
          className="ui-pro-navigation-toggle"
        >
          {isCollapsed ? '→' : '←'}
        </Button>
      )}

      <div style={contentStyles} className="ui-pro-navigation-content">
        {children}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

// Navigation Item component
interface NavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  active?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children: React.ReactNode;
}

export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(({
  href,
  active = false,
  icon,
  badge,
  disabled = false,
  children,
  className = '',
  onClick,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  const itemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${foundations.grid.spacing.md}px`,
    padding: `${foundations.grid.spacing.sm}px ${foundations.grid.spacing.md}px`,
    borderRadius: `${foundations.radius.sm}px`,
    fontSize: `${siteDesignSystem.typography.fontSize.base}px`,
    fontWeight: active ? 500 : 400,
    color: disabled 
      ? themeColors.text.disabled 
      : active 
        ? themeColors.text.link
        : themeColors.text.secondary,
    backgroundColor: active ? themeColors.surface.tertiary : 'transparent',
    border: active ? `1px solid ${themeColors.border.focus}20` : 'none',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    position: 'relative',
    width: '100%',
    minHeight: '40px'
  };

  const iconStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0
  };

  const badgeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    backgroundColor: themeColors.surface.accent,
    color: themeColors.text.inverse,
    fontSize: `${siteDesignSystem.typography.fontSize.xs}px`,
    fontWeight: 600,
    borderRadius: '10px',
    marginLeft: 'auto'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || active) return;
    
    const target = e.currentTarget;
    target.style.backgroundColor = themeColors.surface.secondary;
    target.style.color = themeColors.text.primary;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || active) return;
    
    const target = e.currentTarget;
    target.style.backgroundColor = 'transparent';
    target.style.color = themeColors.text.secondary;
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const Component = href ? 'a' : 'button';

  return (
    <Component
      ref={ref as any}
      href={href}
      style={itemStyles}
      className={`ui-pro-nav-item ${active ? 'ui-pro-nav-item--active' : ''} ${disabled ? 'ui-pro-nav-item--disabled' : ''} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={Component === 'button' ? disabled : undefined}
      {...props}
    >
      {icon && (
        <span style={iconStyles} className="ui-pro-nav-item-icon">
          {icon}
        </span>
      )}
      
      <span className="ui-pro-nav-item-text">
        {children}
      </span>
      
      {badge && (
        <span style={badgeStyles} className="ui-pro-nav-item-badge">
          {badge}
        </span>
      )}
    </Component>
  );
});

NavItem.displayName = 'NavItem';

// Navigation Group component
interface NavGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export const NavGroup = forwardRef<HTMLDivElement, NavGroupProps>(({
  title,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { colors, foundations, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  const groupStyles: React.CSSProperties = {
    width: '100%',
    marginBottom: `${foundations.grid.spacing.md}px`
  };

  const titleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${foundations.grid.spacing.sm}px ${foundations.grid.spacing.md}px`,
    fontSize: `${siteDesignSystem.typography.fontSize.sm}px`,
    fontWeight: 600,
    color: themeColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: collapsible ? 'pointer' : 'default',
    borderRadius: `${foundations.radius.sm}px`,
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${foundations.grid.spacing.xs}px`,
    overflow: 'hidden',
    maxHeight: isCollapsed ? '0' : '1000px',
    opacity: isCollapsed ? 0 : 1,
    transition: `all ${animation.duration.normal}ms ${animation.easing.easeOut}`
  };

  const toggleStyles: React.CSSProperties = {
    fontSize: '12px',
    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    transition: `transform ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleTitleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!collapsible) return;
    
    const target = e.currentTarget;
    target.style.backgroundColor = themeColors.surface.secondary;
  };

  const handleTitleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!collapsible) return;
    
    const target = e.currentTarget;
    target.style.backgroundColor = 'transparent';
  };

  return (
    <div
      ref={ref}
      style={groupStyles}
      className={`ui-pro-nav-group ${isCollapsed ? 'ui-pro-nav-group--collapsed' : ''} ${className}`}
      {...props}
    >
      {title && (
        <div
          style={titleStyles}
          className="ui-pro-nav-group-title"
          onClick={handleToggle}
          onMouseEnter={handleTitleHover}
          onMouseLeave={handleTitleLeave}
        >
          <span>{title}</span>
          {collapsible && (
            <span style={toggleStyles}>▼</span>
          )}
        </div>
      )}
      
      <div style={contentStyles} className="ui-pro-nav-group-content">
        {children}
      </div>
    </div>
  );
});

NavGroup.displayName = 'NavGroup';

// Breadcrumb Navigation
interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: string | React.ReactNode;
  children: React.ReactNode;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(({
  separator = '/',
  children,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations } = siteDesignSystem;
  const themeColors = colors[theme];

  const breadcrumbStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${foundations.grid.spacing.sm}px`,
    fontSize: `${siteDesignSystem.typography.fontSize.sm}px`,
    color: themeColors.text.secondary,
    fontFamily: siteDesignSystem.typography.fontFamily.primary
  };

  const separatorStyles: React.CSSProperties = {
    color: themeColors.text.tertiary,
    userSelect: 'none'
  };

  const items = React.Children.toArray(children);

  return (
    <nav
      ref={ref}
      style={breadcrumbStyles}
      className={`ui-pro-breadcrumb ${className}`}
      aria-label="Breadcrumb navigation"
      {...props}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item}
          {index < items.length - 1 && (
            <span style={separatorStyles} className="ui-pro-breadcrumb-separator">
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

export default Navigation;