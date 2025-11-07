/**
 * SettingsGlass - Frosted glass Settings modal
 * Matches the glassmorphism aesthetic of the sidebar
 */

import React, { useState, useEffect } from 'react';
import { X, User, Mail, HardDrive, FileText, Palette, HelpCircle, Lock } from 'lucide-react';
import styles from './SettingsGlass.module.css';

interface SettingsGlassProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  appearance?: string;
  onAppearanceChange?: (appearance: string) => void;
}

type SettingsPage = 'general' | 'account' | 'email' | 'nas' | 'handover' | 'appearance' | 'help';

const navigationItems = [
  { id: 'general', label: 'General', icon: User },
  { id: 'account', label: 'Account', icon: User },
  { id: 'email', label: 'Email Connector', icon: Mail },
  { id: 'nas', label: 'NAS Access', icon: HardDrive },
  { id: 'handover', label: 'Handover', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export function SettingsGlass({
  isOpen,
  onClose,
  displayName,
  onDisplayNameChange,
  appearance = 'light',
  onAppearanceChange
}: SettingsGlassProps) {
  const [activePage, setActivePage] = useState<SettingsPage>('general');
  const [localDisplayName, setLocalDisplayName] = useState(displayName);

  useEffect(() => {
    if (isOpen) {
      setLocalDisplayName(displayName);
    }
  }, [isOpen, displayName]);

  if (!isOpen) return null;

  const handleDisplayNameSave = () => {
    onDisplayNameChange(localDisplayName);
    // Show save toast (would be handled by global toast system)
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderPageContent = () => {
    console.log('🔧 Settings page debug:', { activePage, type: typeof activePage });
    switch (activePage) {
      case 'general':
        return (
          <div>
            <h2 className="text-[18px] leading-[26px] font-semibold mb-6">General</h2>
            
            {/* Display Name */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Display name</div>
                <div className={styles.celFormHelper}>Shown in handovers and feedback.</div>
              </div>
              <input
                type="text"
                value={localDisplayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                onBlur={handleDisplayNameSave}
                placeholder="Your name as seen by crew"
                className={styles.celInput}
                style={{ width: '280px' }}
              />
            </div>

            {/* Department */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Department</div>
                <div className={styles.celFormHelper}>Sets default projects & notifications.</div>
              </div>
              <select className={styles.celInput} style={{ width: '280px' }}>
                <option value="captain">Captain</option>
                <option value="engineering">Engineering</option>
                <option value="deck">Deck</option>
                <option value="interior">Interior</option>
                <option value="galley">Galley</option>
                <option value="bridge">Bridge</option>
                <option value="shore">Shore</option>
              </select>
            </div>

            {/* Role */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Role</div>
                <div className={styles.celFormHelper}>Managed by admin.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70">Crew</span>
                <User className="w-4 h-4 text-white/50" />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <h2 className="text-[18px] leading-[26px] font-semibold mb-6">Appearance</h2>
            
            {/* Appearance */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Appearance</div>
                <div className={styles.celFormHelper}>Applies across the app.</div>
              </div>
              <div className="flex bg-white/10 rounded-xl p-1">
                {['Light', 'Dark', 'System'].map((option) => (
                  <button
                    key={option}
                    onClick={() => onAppearanceChange?.(option.toLowerCase())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      appearance === option.toLowerCase()
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white/90'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'nas':
        return (
          <div>
            <h2 className="text-[18px] leading-[26px] font-semibold mb-6">NAS Access</h2>

            {/* Scope */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Scope</div>
                <div className={styles.celFormHelper}>You are restricted to this folder.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70">/02_engineering</span>
                <Lock className="w-4 h-4 text-white/50" />
              </div>
            </div>
          </div>
        );

      case 'handover':
        return (
          <div>
            <h2 className="text-[18px] leading-[26px] font-semibold mb-6">Handover</h2>

            {/* Date Range */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Date Range</div>
              </div>
              <div className="flex gap-2">
                {['Today', '7 days', '30 days', 'Custom'].map((range) => (
                  <button
                    key={range}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-all duration-200"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-6 flex justify-center">
              <button className="px-6 py-3 bg-blue-500/80 hover:bg-blue-500 rounded-xl font-medium transition-all duration-200">
                Send to my email
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h2 className="text-[18px] leading-[26px] font-semibold mb-6">{activePage}</h2>
            <p className="text-white/70">Content for {activePage} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 grid place-items-center p-6 bg-black/40"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={`${styles.celSettingsModal} w-[960px] max-w-[96vw] rounded-3xl relative backdrop-blur-[28px] backdrop-saturate-[140%] bg-gradient-to-b from-white/16 via-white/12 to-white/10 border border-white/20 shadow-[0_24px_48px_rgba(0,0,0,0.28)] p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner scrim + noise for readability */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-black/10 to-black/6" />
        <div 
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-20"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '200px' 
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <h1 className="text-[20px] leading-[28px] font-semibold text-white/95">Settings</h1>
          <button 
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/60 text-white/90 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body - Two pane layout */}
        <div className="relative z-10 grid grid-cols-[240px_1fr] gap-4">
          {/* Left sub-nav */}
          <aside className="rounded-2xl p-3 backdrop-blur-[28px] backdrop-saturate-[140%] bg-gradient-to-b from-white/14 via-white/10 to-white/8 border border-white/15">
            <div className="text-[12px] font-semibold tracking-wider uppercase text-white/70 px-2 mb-3">Navigation</div>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      console.log('🔧 Nav clicked:', item.id);
                      setActivePage(item.id as SettingsPage);
                    }}
                    data-active={activePage === item.id}
                    className={styles.celNavItem}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[15px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right content pane */}
          <section className="rounded-2xl p-6 border border-white/15 bg-gradient-to-b from-white/14 via-white/10 to-white/8 backdrop-blur-[28px] backdrop-saturate-[140%]">
            {renderPageContent()}
          </section>
        </div>
      </div>
    </div>
  );
}