import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SettingsSection, settingsMenuItems } from './settings/SettingsConstants';
import { SectionHeader, MobileSectionHeader } from './settings/SettingsComponents';
import { renderSectionContent } from './settings/SettingsSections';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  isChatMode?: boolean;
  appearance?: string;
  onAppearanceChange?: (appearance: string) => void;
}

export function Settings({ isOpen, onClose, isMobile = false, displayName, onDisplayNameChange, isChatMode = false, appearance = 'light', onAppearanceChange }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [language, setLanguage] = useState('en');
  const [exportFormat, setExportFormat] = useState('excel');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [accountScope, setAccountScope] = useState('this-account');
  const [messageType, setMessageType] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

  if (!isOpen) return null;

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Mobile Continuous Scroll Layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Premium Glassmorphism Overlay Background */}
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.35) 100%)',
            backdropFilter: 'blur(16px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.3)'
          }}
        />

        {/* Mobile Settings Modal - Full Screen with Premium Glassmorphism */}
        <div 
          className="relative w-full h-full overflow-hidden z-10"
          style={{
            background: isChatMode 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.18) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)',
            backdropFilter: isChatMode ? 'blur(40px) saturate(1.4)' : 'blur(48px) saturate(1.6)',
            WebkitBackdropFilter: isChatMode ? 'blur(40px) saturate(1.4)' : 'blur(48px) saturate(1.6)',
            border: isChatMode ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isChatMode
              ? 'inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.2)'
              : 'inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between"
            style={{
              padding: 'var(--spacing-4)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <h1 
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '500',
                color: '#1f2937',
                fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                margin: '0'
              }}
            >
              Settings
            </h1>
            <button
              onClick={onClose}
              style={{
                padding: 'var(--spacing-2)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Continuous Scroll Content with Premium Glassmorphism */}
          <div 
            className="flex-1 overflow-y-auto scrollbar-hidden"
            style={{
              padding: 'var(--spacing-4)',
              background: isChatMode 
                ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              backdropFilter: isChatMode ? 'blur(32px) saturate(1.4)' : 'blur(40px) saturate(1.5)',
              WebkitBackdropFilter: isChatMode ? 'blur(32px) saturate(1.4)' : 'blur(40px) saturate(1.5)',
              height: 'calc(100vh - 80px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {settingsMenuItems.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              
              return (
                <div key={section.id} style={{ marginBottom: 'var(--spacing-3)' }}>
                  {/* Section Header */}
                  <MobileSectionHeader
                    section={section}
                    isExpanded={isExpanded}
                    onToggle={() => toggleSection(section.id)}
                  />
                  
                  {/* Section Content - Expands Below */}
                  {isExpanded && (
                    <div 
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
                        backdropFilter: 'blur(24px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        padding: 'var(--spacing-4)',
                        marginBottom: 'var(--spacing-3)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                        animation: 'expandSection 0.3s ease-out'
                      }}
                    >
                      {renderSectionContent({
                        sectionId: section.id,
                        isMobile,
                        displayName,
                        onDisplayNameChange,
                        emailNotifications,
                        setEmailNotifications,
                        pushNotifications,
                        setPushNotifications,
                        language,
                        setLanguage,
                        appearance,
                        setAppearance: onAppearanceChange || (() => {}),
                        dateRange,
                        setDateRange,
                        accountScope,
                        setAccountScope,
                        messageType,
                        setMessageType,
                        messageContent,
                        setMessageContent
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Add CSS for smooth expansion animation */}
          <style>
            {`
              @keyframes expandSection {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Premium Glassmorphism Overlay Background */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        onClick={onClose}
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.35) 100%)',
          backdropFilter: 'blur(16px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.3)'
        }}
      />

      {/* Settings Modal with Maximum Strength Premium Glassmorphism */}
      <div 
        className="relative overflow-hidden z-10 h-[720px] max-h-[90vh] w-[800px] max-w-[90vw]"
        style={{
          background: isChatMode 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.25) 30%, rgba(255, 255, 255, 0.22) 70%, rgba(255, 255, 255, 0.18) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.12) 70%, rgba(255, 255, 255, 0.08) 100%)',
          backdropFilter: isChatMode ? 'blur(40px) saturate(1.4)' : 'blur(48px) saturate(1.6)',
          WebkitBackdropFilter: isChatMode ? 'blur(40px) saturate(1.4)' : 'blur(48px) saturate(1.6)',
          border: isChatMode ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '16px',
          boxShadow: isChatMode 
            ? '0 24px 80px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.2)'
            : '0 24px 80px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.15)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Premium Glassmorphism */}
        <div 
          className="flex items-center justify-between"
          style={{
            padding: 'var(--spacing-5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.15) 100%)',
            backdropFilter: 'blur(24px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <h1 
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: '500',
              color: '#1f2937',
              fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: '0'
            }}
          >
            Settings
          </h1>
          <button
            onClick={onClose}
            style={{
              padding: 'var(--spacing-2)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-full max-h-[calc(100%-80px)] overflow-hidden">
          {/* Left Sidebar with Premium Glassmorphism */}
          <div 
            className="w-56 overflow-y-auto scrollbar-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(249, 250, 251, 0.2) 50%, rgba(255, 255, 255, 0.12) 100%)',
              backdropFilter: 'blur(24px) saturate(1.25)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.25)',
              borderRight: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.2), 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-2" style={{ paddingLeft: 'var(--spacing-3)' }}>
              {settingsMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className="w-full flex items-center text-left transition-all duration-200"
                    style={{
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3)',
                      fontSize: '14px',
                      lineHeight: '20px',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.35) 100%)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isActive ? '#1f2937' : '#6b7280',
                      backdropFilter: isActive ? 'blur(16px) saturate(1.3)' : 'blur(8px) saturate(1.1)',
                      WebkitBackdropFilter: isActive ? 'blur(16px) saturate(1.3)' : 'blur(8px) saturate(1.1)',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: isActive 
                        ? '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.25) 100%)';
                        e.currentTarget.style.backdropFilter = 'blur(12px) saturate(1.2)';
                        e.currentTarget.style.WebkitBackdropFilter = 'blur(12px) saturate(1.2)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.backdropFilter = 'blur(8px) saturate(1.1)';
                        e.currentTarget.style.WebkitBackdropFilter = 'blur(8px) saturate(1.1)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = '#6b7280';
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content with Maximum Strength Premium Glassmorphism */}
          <div 
            className="flex-1 overflow-y-auto scrollbar-hidden min-h-0"
            style={{
              background: isChatMode 
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0.25) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.18) 50%, rgba(255, 255, 255, 0.12) 100%)',
              backdropFilter: isChatMode ? 'blur(32px) saturate(1.4)' : 'blur(40px) saturate(1.5)',
              WebkitBackdropFilter: isChatMode ? 'blur(32px) saturate(1.4)' : 'blur(40px) saturate(1.5)',
              border: isChatMode 
                ? '1px solid rgba(255, 255, 255, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.25)',
              borderRight: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              boxShadow: isChatMode
                ? 'inset 0 1px 0 rgba(255, 255, 255, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.06)'
                : 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.08)',
              position: 'relative'
            }}
          >
            <div 
              className="flex-1 overflow-y-auto scrollbar-hidden"
              style={{
                padding: 'var(--spacing-6)',
                maxWidth: '600px'
              }}
            >
              <SectionHeader 
                title={settingsMenuItems.find(item => item.id === activeSection)?.label || 'Settings'} 
                isMobile={isMobile}
              />
              {renderSectionContent({
                sectionId: activeSection,
                isMobile,
                displayName,
                onDisplayNameChange,
                emailNotifications,
                setEmailNotifications,
                pushNotifications,
                setPushNotifications,
                language,
                setLanguage,
                appearance,
                setAppearance: onAppearanceChange || (() => {}),
                dateRange,
                setDateRange,
                accountScope,
                setAccountScope,
                messageType,
                setMessageType,
                messageContent,
                setMessageContent
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}