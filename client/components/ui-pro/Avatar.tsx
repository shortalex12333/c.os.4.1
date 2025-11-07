import React, { useState, forwardRef } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  shape?: 'circle' | 'square' | 'rounded';
  status?: 'online' | 'offline' | 'away' | 'busy';
  bordered?: boolean;
  loading?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({
  src,
  alt,
  size = 'md',
  fallback,
  shape = 'circle',
  status,
  bordered = false,
  loading = false,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!src);
  
  const { colors, foundations, typography, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  // Size configurations
  const sizeConfig = {
    xs: { size: 24, fontSize: 10 },
    sm: { size: 32, fontSize: 12 },
    md: { size: 40, fontSize: 14 },
    lg: { size: 48, fontSize: 16 },
    xl: { size: 64, fontSize: 20 },
    '2xl': { size: 80, fontSize: 24 }
  };

  const config = sizeConfig[size];

  // Generate fallback text from name or alt
  const getFallbackText = () => {
    if (fallback) return fallback;
    if (alt) {
      return alt.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    return '?';
  };

  // Status indicator styles
  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#00d4aa';
      case 'away': return '#fbbf24';
      case 'busy': return '#ef4444';
      case 'offline': return '#6b7280';
      default: return 'transparent';
    }
  };

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${config.size}px`,
    height: `${config.size}px`,
    backgroundColor: themeColors.surface.secondary,
    border: bordered ? `2px solid ${themeColors.border.subtle}` : 'none',
    borderRadius: shape === 'circle' 
      ? '50%' 
      : shape === 'rounded' 
        ? `${foundations.radius.md}px` 
        : '0',
    overflow: 'hidden',
    flexShrink: 0,
    userSelect: 'none',
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    cursor: 'default'
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    transition: `opacity ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    opacity: imageLoading || imageError ? 0 : 1
  };

  const fallbackStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${config.fontSize}px`,
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    color: themeColors.text.primary,
    backgroundColor: themeColors.surface.accent,
    transition: `opacity ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    opacity: (!src || imageError || imageLoading) ? 1 : 0
  };

  const statusStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: `${Math.max(8, config.size * 0.25)}px`,
    height: `${Math.max(8, config.size * 0.25)}px`,
    backgroundColor: getStatusColor(),
    border: `2px solid ${themeColors.surface.primary}`,
    borderRadius: '50%',
    zIndex: 1
  };

  const skeletonStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(90deg, ${themeColors.surface.secondary} 25%, ${themeColors.surface.tertiary} 50%, ${themeColors.surface.secondary} 75%)`,
    backgroundSize: '400% 100%',
    animation: 'skeleton-loading 1.5s ease-in-out infinite',
    opacity: loading ? 1 : 0,
    transition: `opacity ${animation.duration.fast}ms ${animation.easing.easeOut}`
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div
      ref={ref}
      style={baseStyles}
      className={`ui-pro-avatar ui-pro-avatar--${size} ui-pro-avatar--${shape} ${className}`}
      {...props}
    >
      {/* Skeleton loader */}
      {(loading || imageLoading) && (
        <div style={skeletonStyles} className="ui-pro-avatar-skeleton" />
      )}

      {/* Image */}
      {src && !imageError && (
        <img
          src={src}
          alt={alt || 'Avatar'}
          style={imageStyles}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      )}

      {/* Fallback */}
      <div style={fallbackStyles} className="ui-pro-avatar-fallback">
        {getFallbackText()}
      </div>

      {/* Status indicator */}
      {status && (
        <div 
          style={statusStyles} 
          className={`ui-pro-avatar-status ui-pro-avatar-status--${status}`}
          aria-label={`Status: ${status}`}
        />
      )}

      <style jsx>{`
        @keyframes skeleton-loading {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: -100% 50%;
          }
        }
      `}</style>
    </div>
  );
});

Avatar.displayName = 'Avatar';

// Avatar Group component for displaying multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    fallback?: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
  shape?: AvatarProps['shape'];
  spacing?: 'tight' | 'normal' | 'loose';
  onMoreClick?: () => void;
  className?: string;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(({
  avatars,
  max = 3,
  size = 'md',
  shape = 'circle',
  spacing = 'normal',
  onMoreClick,
  className = ''
}, ref) => {
  const { theme } = useTheme();
  const { colors, foundations } = siteDesignSystem;
  const themeColors = colors[theme];

  const spacingMap = {
    tight: -8,
    normal: -4,
    loose: 0
  };

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  const groupStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row-reverse'
  };

  const avatarWrapperStyles = (index: number): React.CSSProperties => ({
    marginLeft: index === 0 ? '0' : `${spacingMap[spacing]}px`,
    position: 'relative',
    zIndex: visibleAvatars.length - index,
    border: `2px solid ${themeColors.surface.primary}`,
    borderRadius: shape === 'circle' ? '50%' : `${foundations.radius.md}px`,
    transition: `transform 200ms ease-out`,
    cursor: onMoreClick && index === visibleAvatars.length - 1 && remainingCount > 0 ? 'pointer' : 'default'
  });

  const moreCountStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.surface.secondary,
    color: themeColors.text.secondary,
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: shape === 'circle' ? '50%' : `${foundations.radius.md}px`,
    cursor: 'pointer'
  };

  const handleMoreClick = () => {
    if (onMoreClick) {
      onMoreClick();
    }
  };

  const handleAvatarHover = (e: React.MouseEvent<HTMLDivElement>, isEntering: boolean) => {
    const target = e.currentTarget;
    if (isEntering) {
      target.style.transform = 'scale(1.1)';
      target.style.zIndex = '999';
    } else {
      target.style.transform = 'scale(1)';
      target.style.zIndex = target.dataset.originalZIndex || '1';
    }
  };

  return (
    <div
      ref={ref}
      style={groupStyles}
      className={`ui-pro-avatar-group ${className}`}
    >
      {visibleAvatars.reverse().map((avatar, index) => (
        <div
          key={index}
          style={avatarWrapperStyles(index)}
          data-original-z-index={visibleAvatars.length - index}
          onMouseEnter={(e) => handleAvatarHover(e, true)}
          onMouseLeave={(e) => handleAvatarHover(e, false)}
        >
          <Avatar
            src={avatar.src}
            alt={avatar.alt}
            fallback={avatar.fallback}
            size={size}
            shape={shape}
            bordered={false}
          />
          
          {/* Show remaining count on last avatar */}
          {index === visibleAvatars.length - 1 && remainingCount > 0 && (
            <div
              style={moreCountStyles}
              onClick={handleMoreClick}
              className="ui-pro-avatar-more"
            >
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;