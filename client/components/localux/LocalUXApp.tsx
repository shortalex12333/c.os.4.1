import React from 'react';
import { localHouseConfig, isLocalHouse, debugLog } from '../../config/localhouse';

// Import the main CelesteOS App with LOCAL UX enhancements
import CelesteOSApp from '../../AppFigma';

/**
 * LOCAL UX App Component - Enhanced CelesteOS with LOCAL UX Features
 * Wraps existing CelesteOS chat interface with LOCAL UX styling and animations
 * Serves at https://studio.local with full offline capability
 */
export default function LocalUXApp() {
  debugLog('LocalUXApp initializing', { isLocalHouse, config: localHouseConfig });

  debugLog('Rendering LocalUXApp - Enhanced Chat Interface', { 
    localHouseEnabled: isLocalHouse,
    config: localHouseConfig 
  });

  // Return the main CelesteOS app with LOCAL UX class wrapper for enhanced styling
  return (
    <div className="local-ux-enhanced">
      <CelesteOSApp />
    </div>
  );
}