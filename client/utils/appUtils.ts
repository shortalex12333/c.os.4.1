// App utility functions and constants

export const getSidebarWidth = (isMobile: boolean, isSidebarCollapsed: boolean): string => {
  if (isMobile) {
    return isSidebarCollapsed ? 'w-[72px]' : 'w-[320px]';
  }
  return isSidebarCollapsed ? 'w-[60px]' : 'w-64';
};

export const getMobileOverlayStyles = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode 
    ? 'rgba(15, 11, 18, 0.8)'  // Dark royal plum overlay
    : 'rgba(0, 0, 0, 0.4)',     // Lighter overlay for light mode
  backdropFilter: 'blur(12px) saturate(0.9)',
  WebkitBackdropFilter: 'blur(12px) saturate(0.9)',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  width: '100vw',
  height: '100vh'
});

// Legacy export for backward compatibility - uses light mode defaults
export const mobileOverlayStyles = {
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(12px) saturate(0.9)',
  WebkitBackdropFilter: 'blur(12px) saturate(0.9)',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  width: '100vw',
  height: '100vh'
};

export const checkIsMobile = (): boolean => {
  return window.innerWidth < 768;
};

export const checkComparisonMode = (): boolean => {
  return window.location.hash === '#comparison';
};