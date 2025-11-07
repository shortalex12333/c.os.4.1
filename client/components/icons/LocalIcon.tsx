/**
 * Local Icon System - LOCAL UX Implementation
 * Replaces external Lucide React icons with local SVG system
 * Optimized for performance and offline capability
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

// Icon definitions - Most commonly used icons from LOCAL UX sections
const iconPaths: Record<string, string | JSX.Element> = {
  // Navigation & UI
  'menu': 'M3 12h18M3 6h18M3 18h18',
  'x': 'M18 6L6 18M6 6l12 12',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M18 15l-6-6-6 6',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  
  // User & Account
  'user': 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'users': 'M17 21v-2a4 4 0 0 0-3-3.87M9 21v-2a4 4 0 0 1 3-3.87m0 0a4 4 0 0 1 8 0M6 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm12 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'eye': 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  'eye-off': 'M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20',
  
  // Business & Features
  'zap': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'target': 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'trophy': 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 9V7a6 6 0 1 1 12 0v2M6 9l1.5 8.5h9L18 9M12 17v4M8 21h8',
  'compass': 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  'crown': 'M2 19h20l-2-7-3 2-5-5-5 5-3-2-2 7zM12 5l1.5 3L16 7l-2 2h-4l-2-2 2.5 1L12 5z',
  
  // Security & Safety
  'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'lock': 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  'key': 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  
  // Technology & Data
  'database': 'M12 2C8 2 4 4 4 7v10c0 3 4 5 8 5s8-2 8-5V7c0-3-4-5-8-5zM4 12c0 3 4 5 8 5s8-2 8-5',
  'server': 'M5 2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM5 14h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM6 6h.01M6 18h.01',
  'hard-drive': 'M22 12H2l1.45-6.51A2 2 0 0 1 5.4 4h13.2a2 2 0 0 1 1.95 1.49L22 12zM2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6M6 16h.01M10 16h.01',
  'wifi': 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  'wifi-off': 'M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  'network': 'M8 18s0-2 0-6 4-6 4-6 4 2 4 6-4 6-4 6M12 12m-2 0a2 2 0 1 1 4 0a2 2 0 1 1-4 0M4 12m-2 0a2 2 0 1 1 4 0a2 2 0 1 1-4 0M20 12m-2 0a2 2 0 1 1 4 0a2 2 0 1 1-4 0',
  'router': 'M3 13v4h18v-4M5 7V4h14v3M9 10h6M7 19v1M17 19v1',
  
  // Communication & Content
  'phone': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  'calendar': 'M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18',
  'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  'search': 'M11 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM21 21l-4.35-4.35',
  
  // Status & Actions
  'check': 'M20 6L9 17l-5-5',
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  'clock': 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM12 6v6l4 2',
  'trending-up': 'M22 7l-8.5 8.5-5-5L1 18M16 7h6v6',
  'bar-chart-3': 'M3 3v18h18M7 16V9M12 16V6M17 16v-3',
  'award': 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  
  // Navigation & Devices
  'globe': 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  'smartphone': 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01',
  'monitor': 'M2 4h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 21h8',
  'cloud': 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  
  // Utility
  'loader-2': 'M21 12a9 9 0 1 1-6.219-8.56',
  'wind': 'M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M14.6 20.6A2 2 0 1 0 13 17H2',
  'settings': 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z'
};

/**
 * Local Icon Component - Replaces Lucide React icons
 */
export function LocalIcon({ 
  name, 
  size = 24, 
  className, 
  style,
  'aria-label': ariaLabel,
  ...props 
}: IconProps) {
  const path = iconPaths[name];
  
  if (!path) {
    console.warn(`LocalIcon: Icon "${name}" not found`);
    return null;
  }

  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('local-icon', className)}
      style={{ ...style }}
      aria-label={ariaLabel || name}
      role="img"
      {...props}
    >
      {typeof path === 'string' ? (
        path.includes('M') ? (
          <path d={path} />
        ) : path.includes('m') ? (
          path.split('M').filter(Boolean).map((segment, index) => (
            <path key={index} d={`M${segment}`} />
          ))
        ) : (
          path.split('M').filter(Boolean).map((segment, index) => (
            <polyline key={index} points={segment} />
          ))
        )
      ) : (
        path
      )}
    </svg>
  );
}

/**
 * Icon preloader for LCP optimization
 */
export function preloadCriticalIcons() {
  const criticalIcons = [
    'menu', 'x', 'chevron-down', 'user', 'search', 'check', 'arrow-right'
  ];
  
  // Preload critical icons by creating invisible SVGs
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.visibility = 'hidden';
  container.setAttribute('aria-hidden', 'true');
  
  criticalIcons.forEach(iconName => {
    const path = iconPaths[iconName];
    if (path) {
      const svg = document.createElement('svg');
      svg.innerHTML = typeof path === 'string' ? `<path d="${path}"/>` : '';
      container.appendChild(svg);
    }
  });
  
  document.body.appendChild(container);
  
  // Remove after preload
  setTimeout(() => {
    document.body.removeChild(container);
  }, 100);
}

// Auto-preload on module load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', preloadCriticalIcons);
}

export default LocalIcon;