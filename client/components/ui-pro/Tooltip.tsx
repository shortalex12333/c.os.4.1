import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: number;
}

export default function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 500,
  disabled = false,
  className = '',
  maxWidth = 320
}: TooltipProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const { colors, foundations, typography, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));

    setPosition({ x, y });
  };

  const showTooltip = () => {
    if (disabled || !content) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(calculatePosition);
      
      const handleScroll = () => {
        calculatePosition();
      };

      const handleResize = () => {
        calculatePosition();
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipStyles: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    maxWidth: `${maxWidth}px`,
    padding: `${foundations.grid.spacing.sm}px ${foundations.grid.spacing.md}px`,
    backgroundColor: themeColors.surface.primary,
    color: themeColors.text.primary,
    fontSize: `${typography.fontSize.sm}px`,
    fontFamily: typography.fontFamily.primary,
    lineHeight: 1.4,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: `${foundations.radius.sm}px`,
    boxShadow: theme === 'light' ? foundations.elevation.medium : foundations.elevation.darkMedium,
    zIndex: 1000,
    pointerEvents: 'none',
    wordBreak: 'break-word',
    opacity: isVisible ? 1 : 0,
    transform: `scale(${isVisible ? 1 : 0.95})`,
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const arrowStyles: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid'
  };

  const getArrowStyles = () => {
    const arrowSize = 6;
    const borderColor = themeColors.border.subtle;
    const bgColor = themeColors.surface.primary;

    switch (placement) {
      case 'top':
        return {
          ...arrowStyles,
          bottom: -arrowSize,
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderTopColor: borderColor,
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          '::after': {
            content: '""',
            position: 'absolute',
            bottom: '1px',
            left: -arrowSize + 1,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderTopColor: bgColor,
            borderWidth: `${arrowSize - 1}px ${arrowSize - 1}px 0 ${arrowSize - 1}px`,
            borderStyle: 'solid'
          }
        };
      case 'bottom':
        return {
          ...arrowStyles,
          top: -arrowSize,
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: 'transparent',
          borderBottomColor: borderColor,
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`
        };
      case 'left':
        return {
          ...arrowStyles,
          right: -arrowSize,
          top: '50%',
          marginTop: -arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: 'transparent',
          borderLeftColor: borderColor,
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`
        };
      case 'right':
        return {
          ...arrowStyles,
          left: -arrowSize,
          top: '50%',
          marginTop: -arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          borderRightColor: borderColor,
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`
        };
      default:
        return arrowStyles;
    }
  };

  const tooltip = isVisible && (
    <div
      ref={tooltipRef}
      style={tooltipStyles}
      className={`ui-pro-tooltip ui-pro-tooltip--${placement} ${className}`}
      role="tooltip"
    >
      {content}
      <div style={getArrowStyles()} className="ui-pro-tooltip-arrow" />
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(tooltip, document.body)}
    </>
  );
}

// Rich Tooltip with title and description
interface RichTooltipProps extends Omit<TooltipProps, 'content'> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function RichTooltip({
  title,
  description,
  icon,
  actions,
  children,
  className = '',
  maxWidth = 400,
  ...props
}: RichTooltipProps) {
  const { theme } = useTheme();
  const { colors, foundations, typography } = siteDesignSystem;
  const themeColors = colors[theme];

  const content = (
    <div className="ui-pro-rich-tooltip">
      {icon && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${foundations.grid.spacing.sm}px`,
          marginBottom: description ? `${foundations.grid.spacing.sm}px` : '0'
        }}>
          <span style={{ color: themeColors.text.secondary }}>{icon}</span>
          <div style={{
            fontSize: `${typography.fontSize.base}px`,
            fontWeight: typography.fontWeight.semibold,
            color: themeColors.text.primary
          }}>
            {title}
          </div>
        </div>
      )}
      
      {!icon && (
        <div style={{
          fontSize: `${typography.fontSize.base}px`,
          fontWeight: typography.fontWeight.semibold,
          color: themeColors.text.primary,
          marginBottom: description ? `${foundations.grid.spacing.sm}px` : '0'
        }}>
          {title}
        </div>
      )}
      
      {description && (
        <div style={{
          fontSize: `${typography.fontSize.sm}px`,
          color: themeColors.text.secondary,
          lineHeight: 1.5,
          marginBottom: actions ? `${foundations.grid.spacing.md}px` : '0'
        }}>
          {description}
        </div>
      )}
      
      {actions && (
        <div style={{
          display: 'flex',
          gap: `${foundations.grid.spacing.sm}px`,
          justifyContent: 'flex-end'
        }}>
          {actions}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      content={content}
      maxWidth={maxWidth}
      className={`ui-pro-rich-tooltip-wrapper ${className}`}
      {...props}
    >
      {children}
    </Tooltip>
  );
}