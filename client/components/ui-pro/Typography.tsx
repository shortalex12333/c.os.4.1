import React, { forwardRef } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

type TypographyVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'subtitle1' | 'subtitle2'
  | 'body1' | 'body2'
  | 'caption' | 'overline'
  | 'display' | 'hero';

type TypographyColor = 
  | 'primary' | 'secondary' | 'tertiary' | 'quaternary'
  | 'inverse' | 'link' | 'error' | 'success' | 'warning';

type TypographyWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

type TypographyAlign = 'left' | 'center' | 'right' | 'justify';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  color?: TypographyColor;
  weight?: TypographyWeight;
  align?: TypographyAlign;
  component?: keyof JSX.IntrinsicElements;
  truncate?: boolean;
  italic?: boolean;
  underline?: boolean;
  noMargin?: boolean;
  children?: React.ReactNode;
}

const Typography = forwardRef<HTMLElement, TypographyProps>(({
  variant = 'body1',
  color = 'primary',
  weight,
  align = 'left',
  component,
  truncate = false,
  italic = false,
  underline = false,
  noMargin = false,
  className = '',
  children,
  style = {},
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { typography, colors } = siteDesignSystem;
  const themeColors = colors[theme];

  // Define variant configurations
  const variantConfig = {
    // Display variants
    hero: {
      element: 'h1',
      fontSize: typography.fontSize['6xl'],
      lineHeight: typography.lineHeight['6xl'],
      fontWeight: typography.fontWeight.black,
      letterSpacing: '-0.02em',
      margin: '0 0 32px 0'
    },
    display: {
      element: 'h1',
      fontSize: typography.fontSize['5xl'],
      lineHeight: typography.lineHeight['5xl'],
      fontWeight: typography.fontWeight.bold,
      letterSpacing: '-0.01em',
      margin: '0 0 24px 0'
    },
    
    // Heading variants
    h1: {
      element: 'h1',
      fontSize: typography.fontSize['4xl'],
      lineHeight: typography.lineHeight['4xl'],
      fontWeight: typography.fontWeight.bold,
      letterSpacing: '-0.01em',
      margin: '0 0 24px 0'
    },
    h2: {
      element: 'h2',
      fontSize: typography.fontSize['3xl'],
      lineHeight: typography.lineHeight['3xl'],
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: '0',
      margin: '0 0 20px 0'
    },
    h3: {
      element: 'h3',
      fontSize: typography.fontSize['2xl'],
      lineHeight: typography.lineHeight['2xl'],
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: '0',
      margin: '0 0 16px 0'
    },
    h4: {
      element: 'h4',
      fontSize: typography.fontSize.xl,
      lineHeight: typography.lineHeight.xl,
      fontWeight: typography.fontWeight.medium,
      letterSpacing: '0',
      margin: '0 0 12px 0'
    },
    h5: {
      element: 'h5',
      fontSize: typography.fontSize.lg,
      lineHeight: typography.lineHeight.lg,
      fontWeight: typography.fontWeight.medium,
      letterSpacing: '0',
      margin: '0 0 8px 0'
    },
    h6: {
      element: 'h6',
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.base,
      fontWeight: typography.fontWeight.medium,
      letterSpacing: '0',
      margin: '0 0 8px 0'
    },
    
    // Subtitle variants
    subtitle1: {
      element: 'p',
      fontSize: typography.fontSize.lg,
      lineHeight: typography.lineHeight.lg,
      fontWeight: typography.fontWeight.normal,
      letterSpacing: '0',
      margin: '0 0 16px 0'
    },
    subtitle2: {
      element: 'p',
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.base,
      fontWeight: typography.fontWeight.medium,
      letterSpacing: '0',
      margin: '0 0 12px 0'
    },
    
    // Body variants
    body1: {
      element: 'p',
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.base,
      fontWeight: typography.fontWeight.normal,
      letterSpacing: '0',
      margin: '0 0 16px 0'
    },
    body2: {
      element: 'p',
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.sm,
      fontWeight: typography.fontWeight.normal,
      letterSpacing: '0',
      margin: '0 0 12px 0'
    },
    
    // Utility variants
    caption: {
      element: 'span',
      fontSize: typography.fontSize.xs,
      lineHeight: typography.lineHeight.xs,
      fontWeight: typography.fontWeight.normal,
      letterSpacing: '0.025em',
      margin: '0'
    },
    overline: {
      element: 'span',
      fontSize: typography.fontSize.xs,
      lineHeight: typography.lineHeight.xs,
      fontWeight: typography.fontWeight.medium,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      margin: '0'
    }
  } as const;

  const config = variantConfig[variant];
  const Component = component || config.element;

  // Color mapping
  const colorMap: Record<TypographyColor, string> = {
    primary: themeColors.text.primary,
    secondary: themeColors.text.secondary,
    tertiary: themeColors.text.tertiary,
    quaternary: themeColors.text.quaternary,
    inverse: themeColors.text.inverse,
    link: themeColors.text.link,
    error: themeColors.text.error,
    success: themeColors.text.success,
    warning: themeColors.text.warning
  };

  const combinedStyles: React.CSSProperties = {
    // Base styles
    fontFamily: typography.fontFamily.primary,
    fontSize: `${config.fontSize}px`,
    lineHeight: `${config.lineHeight}px`,
    fontWeight: weight ? typography.fontWeight[weight] : config.fontWeight,
    letterSpacing: config.letterSpacing || '0',
    textAlign: align,
    color: colorMap[color],
    margin: noMargin ? '0' : config.margin,
    textTransform: (config as any).textTransform || 'none',
    
    // Conditional styles
    fontStyle: italic ? 'italic' : 'normal',
    textDecoration: underline ? 'underline' : 'none',
    
    // Truncation
    ...(truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }),
    
    // User provided styles
    ...style
  };

  return (
    <Component
      ref={ref as any}
      style={combinedStyles}
      className={`ui-pro-typography ui-pro-typography--${variant} ui-pro-typography--${color} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

Typography.displayName = 'Typography';

// Convenience components for common use cases
export const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }>(({
  level = 1,
  ...props
}, ref) => {
  const variant = `h${level}` as TypographyVariant;
  return <Typography ref={ref as any} variant={variant} {...props} />;
});

Heading.displayName = 'Heading';

export const Text = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'> & { size?: 'sm' | 'md' | 'lg' }>(({
  size = 'md',
  ...props
}, ref) => {
  const variantMap = {
    sm: 'body2',
    md: 'body1',
    lg: 'subtitle1'
  } as const;
  
  return <Typography ref={ref as any} variant={variantMap[size]} {...props} />;
});

Text.displayName = 'Text';

export const Caption = forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(({
  color = 'tertiary',
  ...props
}, ref) => {
  return <Typography ref={ref as any} variant="caption" color={color} {...props} />;
});

Caption.displayName = 'Caption';

export const Link = forwardRef<HTMLAnchorElement, Omit<TypographyProps, 'variant' | 'component' | 'color'> & {
  href?: string;
  external?: boolean;
}>(({
  external = false,
  href,
  children,
  ...props
}, ref) => {
  const linkProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {};

  return (
    <Typography
      ref={ref as any}
      component="a"
      variant="body1"
      color="link"
      href={href}
      style={{
        cursor: 'pointer',
        transition: 'color 150ms ease',
        ':hover': {
          color: siteDesignSystem.colors[useTheme().theme].text.linkHover
        }
      }}
      {...linkProps}
      {...props}
    >
      {children}
    </Typography>
  );
});

Link.displayName = 'Link';

// Code component for inline code
export const Code = forwardRef<HTMLElement, Omit<TypographyProps, 'variant' | 'component'>>(({
  className = '',
  children,
  style = {},
  ...props
}, ref) => {
  const { theme } = useTheme();
  const { colors, typography, foundations } = siteDesignSystem;
  const themeColors = colors[theme];

  const codeStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.mono,
    fontSize: '0.875em',
    backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
    color: themeColors.text.primary,
    padding: '2px 6px',
    borderRadius: `${foundations.radius.sm}px`,
    border: `1px solid ${themeColors.border.secondary}`,
    ...style
  };

  return (
    <code
      ref={ref as any}
      style={codeStyles}
      className={`ui-pro-code ${className}`}
      {...props}
    >
      {children}
    </code>
  );
});

Code.displayName = 'Code';

export default Typography;