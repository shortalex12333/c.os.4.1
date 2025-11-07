import React from 'react';

interface BackgroundSystemProps {
  isDarkMode: boolean;
  isChatMode: boolean; // kept for API compatibility
  isLoggedIn: boolean;
}

export const BackgroundSystem: React.FC<BackgroundSystemProps> = ({ isDarkMode }) => {
  // Use prop-driven dark detection for reliability; fall back to DOM check.
  const domDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : domDark;
  const src = isDark ? "/DAKR MODE BACKGROUND.png" : "/background.png";
  const style: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundImage: `url("${src}")`,
  };

  return <div data-testid="hero-bg" style={style} />;
};
