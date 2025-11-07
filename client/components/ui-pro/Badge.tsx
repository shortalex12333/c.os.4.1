import React, { forwardRef } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill' | 'square';
  dot?: boolean;
  pulse?: boolean;
  children?: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  dot = false,
  pulse = false,
  children,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations, typography, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: dot ? '0' : `${foundations.grid.spacing.xs}px ${foundations.grid.spacing.sm}px`,
      fontSize: typography.fontSize.xs,
      height: dot ? '8px' : '20px',
      minWidth: dot ? '8px' : '20px'
    },
    md: {
      padding: dot ? '0' : `${foundations.grid.spacing.sm}px ${foundations.grid.spacing.md}px`,
      fontSize: typography.fontSize.sm,
      height: dot ? '10px' : '24px',
      minWidth: dot ? '10px' : '24px'
    },
    lg: {
      padding: dot ? '0' : `${foundations.grid.spacing.sm}px ${foundations.grid.spacing.lg}px`,
      fontSize: typography.fontSize.base,
      height: dot ? '12px' : '28px',
      minWidth: dot ? '12px' : '28px'
    }
  };

  const config = sizeConfig[size];

  // Variant color configurations
  const variantConfig = {
    primary: {
      backgroundColor: themeColors.surface.accent,
      color: themeColors.text.inverse,
      border: `1px solid ${themeColors.surface.accent}`
    },
    secondary: {
      backgroundColor: themeColors.surface.secondary,
      color: themeColors.text.primary,
      border: `1px solid ${themeColors.border.subtle}`
    },
    success: {
      backgroundColor: theme === 'light' ? '#10b981' : '#059669',
      color: '#ffffff',
      border: `1px solid ${theme === 'light' ? '#10b981' : '#059669'}`
    },
    warning: {
      backgroundColor: theme === 'light' ? '#f59e0b' : '#d97706',
      color: '#ffffff',
      border: `1px solid ${theme === 'light' ? '#f59e0b' : '#d97706'}`
    },
    error: {
      backgroundColor: theme === 'light' ? '#ef4444' : '#dc2626',
      color: '#ffffff',
      border: `1px solid ${theme === 'light' ? '#ef4444' : '#dc2626'}`
    },
    info: {
      backgroundColor: theme === 'light' ? '#3b82f6' : '#2563eb',
      color: '#ffffff',
      border: `1px solid ${theme === 'light' ? '#3b82f6' : '#2563eb'}`
    },
    neutral: {
      backgroundColor: themeColors.surface.tertiary,
      color: themeColors.text.secondary,
      border: `1px solid ${themeColors.border.subtle}`
    }
  };

  const colors = variantConfig[variant];

  // Shape configurations
  const shapeConfig = {
    rounded: foundations.radius.sm,
    pill: 999,
    square: 0
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: config.padding,
    minWidth: config.minWidth,
    height: config.height,
    fontSize: `${config.fontSize}px`,
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    verticalAlign: 'middle',
    backgroundColor: colors.backgroundColor,
    color: colors.color,
    border: colors.border,
    borderRadius: `${shapeConfig[shape]}px`,
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    userSelect: 'none',
    ...(pulse && {
      animation: 'badge-pulse 2s infinite'
    })
  };

  return (
    <>
      <span
        ref={ref}
        style={baseStyles}
        className={`ui-pro-badge ui-pro-badge--${variant} ui-pro-badge--${size} ui-pro-badge--${shape} ${dot ? 'ui-pro-badge--dot' : ''} ${pulse ? 'ui-pro-badge--pulse' : ''} ${className}`}
        {...props}
      >
        {!dot && children}
      </span>
      
      <style jsx>{`
        @keyframes badge-pulse {
          0% {
            box-shadow: 0 0 0 0 ${colors.backgroundColor}66;
          }
          70% {
            box-shadow: 0 0 0 6px ${colors.backgroundColor}00;
          }
          100% {
            box-shadow: 0 0 0 0 ${colors.backgroundColor}00;
          }
        }
      `}</style>
    </>
  );
});

Badge.displayName = 'Badge';

// Notification Badge component for counts
interface NotificationBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
  children: React.ReactNode;
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  offset?: { x?: number; y?: number };
}

export const NotificationBadge = forwardRef<HTMLDivElement, NotificationBadgeProps>(({
  count,
  max = 99,
  showZero = false,
  children,
  placement = 'top-right',
  offset = {},
  variant = 'error',
  size = 'sm',
  pulse = false,
  className = '',
  ...props
}, ref) => {
  const shouldShow = count > 0 || (count === 0 && showZero);
  const displayCount = count > max ? `${max}+` : count.toString();

  const placementStyles = {
    'top-right': {
      top: `${offset.y || -8}px`,
      right: `${offset.x || -8}px`
    },
    'top-left': {
      top: `${offset.y || -8}px`,
      left: `${offset.x || -8}px`
    },
    'bottom-right': {
      bottom: `${offset.y || -8}px`,
      right: `${offset.x || -8}px`
    },
    'bottom-left': {
      bottom: `${offset.y || -8}px`,
      left: `${offset.x || -8}px`
    }
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block'
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    ...placementStyles[placement],
    transform: 'scale(1)',
    transformOrigin: 'center',
    transition: 'all 200ms ease-out'
  };

  return (
    <div
      ref={ref}
      style={containerStyles}
      className={`ui-pro-notification-badge ${className}`}
    >
      {children}
      {shouldShow && (
        <div style={badgeStyles} className="ui-pro-notification-badge-indicator">
          <Badge
            variant={variant}
            size={size}
            shape="pill"
            pulse={pulse}
            {...props}
          >
            {displayCount}
          </Badge>
        </div>
      )}
    </div>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

// Status Badge component
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'idle';
  showLabel?: boolean;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(({
  status,
  showLabel = true,
  size = 'md',
  ...props
}, ref) => {
  const statusConfig = {
    online: {
      variant: 'success' as const,
      label: 'Online',
      color: '#10b981'
    },
    offline: {
      variant: 'neutral' as const,
      label: 'Offline',
      color: '#6b7280'
    },
    away: {
      variant: 'warning' as const,
      label: 'Away',
      color: '#f59e0b'
    },
    busy: {
      variant: 'error' as const,
      label: 'Busy',
      color: '#ef4444'
    },
    idle: {
      variant: 'info' as const,
      label: 'Idle',
      color: '#3b82f6'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      size={size}
      {...props}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: 'currentColor',
          borderRadius: '50%',
          marginRight: showLabel ? '6px' : '0'
        }}
      />
      {showLabel && config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export default Badge;