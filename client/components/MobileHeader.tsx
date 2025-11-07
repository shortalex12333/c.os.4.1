import React from 'react';
import { Menu, X } from 'lucide-react';
const logoImage = '/Logo.png';

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  
  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile menu toggle clicked', { isMobileMenuOpen });
    onToggleMobileMenu();
  };
  const headerStyles = {
    height: '64px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(24px) saturate(1.25)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.25)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
  };

  const buttonStyles = {
    width: '40px',
    height: '40px',
    minWidth: '44px', // Ensure minimum touch target size
    minHeight: '44px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: '#242424',
    cursor: 'pointer',
    touchAction: 'manipulation', // Improve touch responsiveness
    WebkitTapHighlightColor: 'transparent' // Remove iOS tap highlight
  };

  const platformStyles = {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  };

  const textStyles = {
    fontSize: '18px',
    lineHeight: '26px',
    fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '400',
    letterSpacing: '0.01em'
  };

  const celesteStyles = {
    color: '#1a1a1a',
    fontWeight: 'inherit'
  };

  const osGradientStyles = {
    background: 'linear-gradient(115deg, #61afd9 0%, #81c8e4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 'inherit',
    display: 'inline-block'
  };

  const handleButtonInteraction = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>, scale: string) => {
    e.currentTarget.style.transform = `scale(${scale})`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between transition-all duration-300" style={headerStyles}>
      {/* Menu Button */}
      <button
        onClick={handleToggleClick}
        className="flex items-center justify-center rounded-lg transition-all duration-200 mobile_menu_toggle"
        style={buttonStyles}
        onMouseDown={(e) => handleButtonInteraction(e, '0.95')}
        onMouseUp={(e) => handleButtonInteraction(e, '1')}
        onMouseLeave={(e) => handleButtonInteraction(e, '1')}
        onTouchStart={(e) => handleButtonInteraction(e, '0.95')}
        onTouchEnd={(e) => handleButtonInteraction(e, '1')}
        type="button"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>
      
      {/* Platform Logo Display */}
      <div className="flex items-center justify-center platform_name_display">
        <img 
          src={logoImage} 
          alt="CelesteOS Logo" 
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Right side spacer for balance */}
      <div style={{ width: '40px' }} />
    </div>
  );
};