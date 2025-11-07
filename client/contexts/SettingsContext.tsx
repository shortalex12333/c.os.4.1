/**
 * SettingsContext - Minimal local state management
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { startOutlookAuth, HandoverRange } from '../api/outlook';
import { useAuth } from './AuthContext';
import completeWebhookService from '../services/webhookServiceComplete';

export type Role = "crew" | "officer" | "admin";
export type Department = "Captain" | "Engineering" | "Deck" | "Interior" | "Galley" | "Bridge" | "Shore";
export type Appearance = "light" | "dark" | "system";

export interface SettingsContextValue {
  user: {
    id: string;
    email: string;           // you@yacht.com
    role: Role;              // read-only
    department: Department;  // read-only
    displayName: string;     // editable
  };

  prefs: {
    language: { code: string; autoDetect: boolean };
    appearance: Appearance;
  };

  connectors: {
    email: {
      provider: "outlook";
      mailbox: string;                 // equals user.email
      connectOrReauth: () => Promise<never>; // starts redirect
    };
  };

  nas: {
    scope: string;                     // read-only, admin-managed
  };

  handover: {
    range: HandoverRange;
    custom?: { from: string; to: string }; // ISO when range="custom"
    exportToOutlook: (p: {
      range: HandoverRange;
      custom?: { from: string; to: string };
    }) => Promise<{ messageId?: string }>;
  };

  update: {
    setDisplayName: (v: string) => Promise<void>;
    setLanguage: (v: { code: string; autoDetect: boolean }) => Promise<void>;
    setAppearance: (v: Appearance) => Promise<void>;
  };

  saving: boolean;
  lastError?: string;
  clearError: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [displayName, setDisplayNameState] = useState(user?.userName || 'User');
  const [language, setLanguageState] = useState({ code: 'en', autoDetect: true });
  const [appearance, setAppearanceState] = useState<Appearance>('light');
  const [handoverRange, setHandoverRange] = useState<HandoverRange>('30d');
  const [handoverCustom, setHandoverCustom] = useState<{ from: string; to: string }>();
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState<string>();

  const clearError = () => setLastError(undefined);

  const setDisplayName = async (v: string) => {
    if (v.length < 2 || v.length > 40 || !/^[a-zA-Z\s'-]+$/.test(v)) {
      throw new Error("Only letters, spaces, ' and – allowed (2-40 chars)");
    }
    setSaving(true);
    try {
      setDisplayNameState(v);
      // Auto-save locally - no network call needed
      setTimeout(() => setSaving(false), 500); // Simulate save
    } catch (error) {
      setSaving(false);
      throw error;
    }
  };

  const setLanguage = async (v: { code: string; autoDetect: boolean }) => {
    setSaving(true);
    try {
      setLanguageState(v);
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      setSaving(false);
      throw error;
    }
  };

  const setAppearance = async (v: Appearance) => {
    setSaving(true);
    try {
      setAppearanceState(v);
      setTimeout(() => setSaving(false), 500);
    } catch (error) {
      setSaving(false);
      throw error;
    }
  };

  const connectOrReauth = async (): Promise<never> => {
    if (!user?.userId) {
      throw new Error("User not logged in. Please log in first.");
    }
    return startOutlookAuth(user.userId);
  };

  const exportToOutlook = async (p: {
    range: HandoverRange;
    custom?: { from: string; to: string };
  }) => {
    if (p.range === 'custom' && !p.custom) {
      throw new Error("Custom range requires from/to dates");
    }
    if (p.custom && new Date(p.custom.from) > new Date(p.custom.to)) {
      throw new Error("From date must be before to date");
    }

    // Use the new webhook service instead of the old API
    const userData = user ? {
      email: user.email,
      userName: user.userName || displayName,
      userId: user.userId // Fixed: use user.userId instead of user.id
    } : undefined;

    const customStartDate = p.custom?.from;

    const response = await completeWebhookService.exportToOutlook(
      p.range,
      customStartDate,
      userData
    );

    if (!response.success) {
      throw new Error(response.error || 'Export failed');
    }

    return { messageId: response.data?.messageId };
  };

  const value: SettingsContextValue = {
    user: {
      id: user?.userId || 'user_1',
      email: user?.email || 'you@yacht.com',
      role: 'crew', // read-only
      department: 'Captain', // read-only
      displayName
    },
    prefs: {
      language,
      appearance
    },
    connectors: {
      email: {
        provider: 'outlook',
        mailbox: user?.email || 'you@yacht.com',
        connectOrReauth
      }
    },
    nas: {
      scope: '/02_engineering'
    },
    handover: {
      range: handoverRange,
      custom: handoverCustom,
      exportToOutlook
    },
    update: {
      setDisplayName,
      setLanguage,
      setAppearance
    },
    saving,
    lastError,
    clearError
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}