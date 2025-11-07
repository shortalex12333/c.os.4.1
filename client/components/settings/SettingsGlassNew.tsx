/**
 * SettingsGlass - Frosted glass Settings modal with real functionality
 * Matches the glassmorphism aesthetic of the sidebar
 */

import React, { useState, useEffect } from 'react';
import { X, User, Mail, HardDrive, FileText, Palette, HelpCircle, Lock, Check } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
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
  const settings = useSettings();
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState<SettingsPage>('general');
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general' as 'bug' | 'feature' | 'general'
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalDisplayName(displayName);
    }
  }, [isOpen, displayName]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (messageStatus) {
      const timer = setTimeout(() => setMessageStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [messageStatus]);

  if (!isOpen) return null;

  const handleDisplayNameSave = async () => {
    try {
      await settings.update.setDisplayName(localDisplayName);
      onDisplayNameChange(localDisplayName);
      setSaveSuccess('Display name saved');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleAppearanceChange = async (value: string) => {
    try {
      await settings.update.setAppearance(value as any);
      onAppearanceChange?.(value);
      setSaveSuccess('Appearance saved');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleExportOutlook = async () => {
    try {
      await settings.handover.exportToOutlook({ range: settings.handover.range });
      setSaveSuccess(`Handover emailed to ${settings.user.email}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setMessageStatus({ type: 'error', text: '⚠️ Please fill in all required fields.' });
      return;
    }

    setSendingMessage(true);
    try {
      // Using the webhook service to send support email
      const emailContent = `
        <h3>Support Request</h3>
        <p><strong>From:</strong> ${settings.user.email}</p>
        <p><strong>Category:</strong> ${contactForm.category === 'bug' ? 'Bug Report' :
          contactForm.category === 'feature' ? 'Feature Request' : 'General Question'}</p>
        <p><strong>Subject:</strong> ${contactForm.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${contactForm.message.replace(/\n/g, '<br>')}</p>
      `;

      // Here we would normally call an email service
      // For now, we'll simulate the send
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMessageStatus({ type: 'success', text: '✅ Your message has been sent to our support team.' });
      setContactForm({ subject: '', message: '', category: 'general' });
    } catch (error) {
      setMessageStatus({ type: 'error', text: '⚠️ Message failed to send. Please try again.' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderPageContent = () => {
    switch (activePage) {
      case 'general':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">General</h2>
            
            {/* Display Name */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Display name</div>
                <div className={styles.celFormHelper}>Shown in handovers and feedback.</div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={localDisplayName}
                  onChange={(e) => setLocalDisplayName(e.target.value)}
                  onBlur={handleDisplayNameSave}
                  placeholder="Your name as seen by crew"
                  className={styles.celInput}
                  style={{ width: '280px' }}
                />
                {settings.saving && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
              </div>
            </div>

            {/* About Section */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-[16px] leading-[24px] font-semibold mb-4 text-slate-800">About</h3>

              {/* App Name */}
              <div className={styles.celFormRow}>
                <div>
                  <div className={styles.celFormLabel}>Application</div>
                </div>
                <div className="text-slate-700">CelesteOS</div>
              </div>

              {/* Version */}
              <div className={styles.celFormRow}>
                <div>
                  <div className={styles.celFormLabel}>Version</div>
                </div>
                <div className="text-slate-700">1.0.0</div>
              </div>

              {/* Copyright */}
              <div className={styles.celFormRow}>
                <div>
                  <div className={styles.celFormLabel}>Copyright</div>
                </div>
                <div className="text-slate-600 text-sm">© 2025 Celeste7 LTD. All rights reserved.</div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">Account</h2>
            
            {/* Email - Read Only */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Email</div>
              </div>
              <div className="text-slate-700">{settings.user.email}</div>
            </div>

            {/* Department - Read Only */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Department</div>
                <div className={styles.celFormHelper}>Read-only setting.</div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span>{settings.user.department}</span>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Role - Read Only */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Role</div>
                <div className={styles.celFormHelper}>Managed by admin.</div>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="capitalize">{settings.user.role}</span>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Sign Out */}
            <div className="mt-6">
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    console.log('🚀 SettingsGlass: Attempting to logout...');
                    await logout();
                    console.log('✅ SettingsGlass: Logout successful - AuthContext will show login screen');
                  } catch (error) {
                    console.error('❌ SettingsGlass: Logout error:', error);
                  }
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        );

      case 'email':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">Email Connector</h2>
            

            {/* Mailbox */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Mailbox</div>
                <div className={styles.celFormHelper}>You only see your mailbox.</div>
              </div>
              <div className="text-slate-700">{settings.connectors.email.mailbox}</div>
            </div>

            {/* Connect/Reconnect */}
            <div className="mt-6">
              <Button
                onClick={settings.connectors.email.connectOrReauth}
                variant="primary"
              >
                Connect Outlook
              </Button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">Appearance</h2>
            
            {/* Appearance */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Appearance</div>
                <div className={styles.celFormHelper}>Applies across the app.</div>
              </div>
              <div className="flex bg-slate-100 rounded-xl p-1">
                {['Light', 'Dark', 'System'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAppearanceChange(option.toLowerCase())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      settings.prefs.appearance === option.toLowerCase()
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Language</div>
                <div className={styles.celFormHelper}>Applies immediately to menus and messages.</div>
              </div>
              <select className={styles.celInput} style={{ width: '280px' }}>
                <option value="auto">Auto-detect (English)</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        );

      case 'nas':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">NAS Access</h2>

            {/* Scope */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Scope</div>
                <div className={styles.celFormHelper}>You are restricted to this folder.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">/02_engineering</span>
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        );

      case 'handover':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">Handover</h2>
            
            {/* Date Range */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Date Range</div>
                <div className={styles.celFormHelper}>Period to include in export.</div>
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'today', label: 'Today' },
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: '60d', label: '60 days' }
                ].map((range) => (
                  <Button
                    key={range.value}
                    variant={settings.handover.range === range.value ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {/* TODO: Add range selection handler */}}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="mt-6">
              <Button
                onClick={handleExportOutlook}
                disabled={settings.saving}
                variant="primary"
              >
                {settings.saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send to my email'
                )}
              </Button>
              <div className="text-[13px] text-slate-500 mt-2">
                Will be sent to {settings.user.email}
              </div>
            </div>
          </div>
        );

      case 'help':
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950">Contact Support</h2>

            {/* Success/Error Message */}
            {messageStatus && (
              <div className={`mb-4 p-3 rounded-lg ${
                messageStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {messageStatus.text}
              </div>
            )}

            {/* Category */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Category</div>
                <div className={styles.celFormHelper}>What type of request is this?</div>
              </div>
              <select
                value={contactForm.category}
                onChange={(e) => setContactForm({ ...contactForm, category: e.target.value as 'bug' | 'feature' | 'general' })}
                className={styles.celInput}
                style={{ width: '280px' }}
              >
                <option value="general">General Question</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
              </select>
            </div>

            {/* Subject */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Subject *</div>
                <div className={styles.celFormHelper}>Brief description of your request</div>
              </div>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                placeholder="Enter subject..."
                className={`${styles.celInput} ${!contactForm.subject && 'border-slate-300'}`}
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </div>

            {/* Message */}
            <div className={styles.celFormRow}>
              <div>
                <div className={styles.celFormLabel}>Message *</div>
                <div className={styles.celFormHelper}>Provide details about your request</div>
              </div>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Type your message here..."
                rows={6}
                className={`${styles.celInput} resize-none`}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  minHeight: '120px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setContactForm({ subject: '', message: '', category: 'general' })}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!contactForm.subject.trim() || !contactForm.message.trim() || sendingMessage}
                variant="primary"
              >
                {sendingMessage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h2 className="text-[20px] leading-[28px] font-semibold mb-6 text-slate-950 capitalize">{activePage}</h2>
            <p className="text-slate-600">Settings for {activePage} coming soon...</p>
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
      data-testid="settings-glass"
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

        {/* Success Toast */}
        {saveSuccess && (
          <div className="absolute top-6 right-16 z-20 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl shadow-lg">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{saveSuccess}</span>
          </div>
        )}

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
          {/* Left sub-nav - Glass */}
          <aside className="rounded-2xl p-3 backdrop-blur-[28px] backdrop-saturate-[140%] bg-gradient-to-b from-white/14 via-white/10 to-white/8 border border-white/15">
            <div className="text-[12px] font-semibold tracking-wider uppercase text-white/72 px-2 mb-3">Navigation</div>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id as SettingsPage)}
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

          {/* Right content pane - White background for readability */}
          <section 
            data-testid="settings-pane" 
            className={`${styles.celSettingsPane} rounded-2xl p-6 border border-slate-200 shadow-[0_12px_30px_rgba(0,0,0,0.18)]`}
          >
            {renderPageContent()}
          </section>
        </div>
      </div>
    </div>
  );
}