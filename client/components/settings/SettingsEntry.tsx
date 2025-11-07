/**
 * Settings Entry - Feature flag wrapper
 * Switches between legacy Settings and new SettingsGlass
 */

import React from 'react';
import { Settings } from '../../figma-components/Settings';
import { SettingsGlass } from './SettingsGlassNew';

interface SettingsEntryProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  isChatMode?: boolean;
  appearance?: string;
  onAppearanceChange?: (appearance: string) => void;
}

export default function SettingsEntry(props: SettingsEntryProps) {
  // Feature flag - can be controlled via environment variable
  const USE_SETTINGS_GLASS = import.meta.env.VITE_SETTINGS_GLASS === '1' || false;

  if (USE_SETTINGS_GLASS) {
    return <SettingsGlass {...props} />;
  }

  return <Settings {...props} />;
}