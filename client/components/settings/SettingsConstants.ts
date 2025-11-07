import { Settings as SettingsIcon, Plug, ArrowUpDown, User, HelpCircle } from 'lucide-react';

export type SettingsSection = 'general' | 'connectors' | 'handover' | 'account' | 'help-contact';

export const settingsMenuItems = [
  { id: 'general' as SettingsSection, label: 'General', icon: SettingsIcon },
  { id: 'connectors' as SettingsSection, label: 'Connectors', icon: Plug },
  { id: 'handover' as SettingsSection, label: 'Handover', icon: ArrowUpDown },
  { id: 'account' as SettingsSection, label: 'Account', icon: User },
  { id: 'help-contact' as SettingsSection, label: 'Help & Contact', icon: HelpCircle },
];

export const languageOptions = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese (Simplified)' }
];

export const appearanceOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

export const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'last-90-days', label: 'Last 90 days' },
  { value: 'last-year', label: 'Last year' },
  { value: 'all-time', label: 'All time' }
];

export const generationSourceOptions = [
  { value: 'outlook', label: 'Outlook' },
  { value: 'my-notes', label: 'My Notes' },
  { value: 'both', label: 'Both' }
];

export const accountScopeOptions = [
  { value: 'this-account', label: 'This account' },
  { value: 'entire-faults', label: 'Entire faults' }
];

export const messageTypeOptions = [
  { value: '', label: 'Select type...' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'issue', label: 'Technical Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'billing', label: 'Billing Question' }
];