import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import completeWebhookService from '../../services/webhookServiceComplete';
import { SettingsSection } from './SettingsConstants';
import { 
  AppleSettingsRow, 
  SwitchRow, 
  FormGroup, 
  UnifiedTextarea 
} from './SettingsComponents';
import {
  languageOptions,
  appearanceOptions,
  dateRangeOptions,
  generationSourceOptions,
  accountScopeOptions,
  messageTypeOptions
} from './SettingsConstants';
import { darkTheme } from '../../styles/darkModeTheme';

interface SectionContentProps {
  sectionId: SettingsSection;
  isMobile: boolean;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  pushNotifications: boolean;
  setPushNotifications: (value: boolean) => void;
  language: string;
  setLanguage: (value: string) => void;
  appearance: string;
  setAppearance: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  generationSource: string;
  setGenerationSource: (value: string) => void;
  accountScope: string;
  setAccountScope: (value: string) => void;
  messageType: string;
  setMessageType: (value: string) => void;
  messageContent: string;
  setMessageContent: (value: string) => void;
  userEmail: string;
  setUserEmail: (value: string) => void;
  isDarkMode?: boolean;
  logout?: () => Promise<void>;
}

export const renderSectionContent = ({
  sectionId,
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
  setAppearance,
  dateRange,
  setDateRange,
  generationSource,
  setGenerationSource,
  accountScope,
  setAccountScope,
  messageType,
  setMessageType,
  messageContent,
  setMessageContent,
  userEmail,
  setUserEmail,
  isDarkMode = false,
  logout
}: SectionContentProps) => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const getLanguageLabel = (value: string) => {
    const option = languageOptions.find(opt => opt.value === value);
    return option ? option.label : 'English';
  };

  const getAppearanceLabel = (value: string) => {
    const option = appearanceOptions.find(opt => opt.value === value);
    return option ? option.label : 'Light';
  };

  const getDateRangeLabel = (value: string) => {
    const option = dateRangeOptions.find(opt => opt.value === value);
    return option ? option.label : 'Last 30 days';
  };

  const getGenerationSourceLabel = (value: string) => {
    const option = generationSourceOptions.find(opt => opt.value === value);
    return option ? option.label : 'Both';
  };

  const getAccountScopeLabel = (value: string) => {
    const option = accountScopeOptions.find(opt => opt.value === value);
    return option ? option.label : 'This account';
  };

  const getMessageTypeLabel = (value: string) => {
    if (value === '') return 'Select type...';
    if (value === 'issue' && isMobile) return 'Tech Issue';
    const option = messageTypeOptions.find(opt => opt.value === value);
    return option ? option.label : 'Select type...';
  };

  switch (sectionId) {
    case 'general':
      return (
        <>
          {/* Premium Settings List */}
          <div 
            style={{
              background: isDarkMode ? '#292929' : '#ffffff',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '0 24px 32px 24px',
              padding: '16px !important',
              boxShadow: 'none'
            }}
          >
            <AppleSettingsRow
              label="Display Name"
              value={displayName}
              isEditable={true}
              onChange={onDisplayNameChange}
              placeholder="Enter your display name"
              isMobile={isMobile}
               isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Department"
              value="Captain"
              isEditable={false}
              isMobile={isMobile}
               isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Language"
              value={getLanguageLabel(language)}
              isEditable={true}
              onChange={setLanguage}
              type="select"
              options={languageOptions}
              isMobile={isMobile}
               isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Appearance"
              value={appearance}
              isEditable={true}
              onChange={setAppearance}
              type="select"
              options={appearanceOptions}
              isMobile={isMobile}
               isDarkMode={isDarkMode}
            />
          </div>


        </>
      );

    case 'connectors':
      return (
        <>
          {/* Premium Settings List for Connectors */}
          <div 
            style={{
              background: isDarkMode ? '#292929' : '#ffffff',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '0 24px 32px 24px',
              padding: '16px !important',
              boxShadow: 'none'
            }}
          >
            <AppleSettingsRow
              label="Microsoft Outlook"
              value="Connected"
              isEditable={false}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label={isMobile ? "Email" : "Email Address"}
              value={isMobile ? "john@company.com" : "john.doe@company.com"}
              isEditable={false}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Organization"
              value="Acme Corporation"
              isEditable={false}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Last Synced"
              value={isMobile ? "Jan 15, 2:45 PM" : "January 15, 2024 at 2:45 PM"}
              isEditable={false}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Premium Action Buttons */}
          <div 
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px'
            }}
          >
            <button
              style={{
                width: '120px',
                height: '48px',
                padding: '0 20px',
                fontSize: '15px',
                lineHeight: '20px',
                fontWeight: '500',
                textTransform: 'uppercase',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: isDarkMode ? '#343434' : '#f8f8f8',
                color: isDarkMode ? '#939293' : '#8a8a8a',
                border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: `all ${isDarkMode ? darkTheme.effects.microDelay : '240ms'} cubic-bezier(0.22, 0.61, 0.36, 1)`,
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none',
                backdropFilter: isDarkMode ? 'none' : 'blur(8px)',
                WebkitBackdropFilter: isDarkMode ? 'none' : 'blur(8px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? darkTheme.buttons.secondary.backgroundHover : 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.color = isDarkMode ? darkTheme.text.primary : '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? darkTheme.buttons.secondary.background : 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.color = isDarkMode ? darkTheme.buttons.secondary.text : '#6b7280';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Disconnect
            </button>
            <button
              onClick={() => {
                // CelesteOS Modern OAuth - use local implementation
                alert('OAuth integration ready - please configure Microsoft credentials in webhook service');
              }}
              style={{
                width: '120px',
                height: '48px',
                padding: '0 20px',
                fontSize: '15px',
                lineHeight: '20px',
                fontWeight: '500',
                textTransform: 'uppercase',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: '#0078fa',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.23, 1, 0.32, 1)',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0078fa';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0078fa';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Reconnect
            </button>
          </div>
        </>
      );

    case 'handover':
      return (
        <>
          {/* Date Range Button Selector */}
          <div
            style={{
              background: isDarkMode ? '#292929' : '#ffffff',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '0 24px 16px 24px',
              padding: '16px !important',
              boxShadow: 'none'
            }}
          >
            <div style={{
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '500',
              color: isDarkMode ? '#f8fafc' : '#111827',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Date Range
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {dateRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    border: dateRange === option.value
                      ? 'none'
                      : `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
                    background: dateRange === option.value
                      ? '#0078fa'
                      : isDarkMode ? '#1a202c' : '#f7fafc',
                    color: dateRange === option.value
                      ? '#ffffff'
                      : isDarkMode ? '#94a3b8' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (dateRange !== option.value) {
                      e.currentTarget.style.background = isDarkMode ? '#2d3748' : '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (dateRange !== option.value) {
                      e.currentTarget.style.background = isDarkMode ? '#1a202c' : '#f7fafc';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Source */}
          <div
            style={{
              background: isDarkMode ? '#292929' : '#ffffff',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '0 24px 32px 24px',
              padding: '16px !important',
              boxShadow: 'none'
            }}
          >
            <AppleSettingsRow
              label="Generation Source"
              value={generationSource}
              isEditable={true}
              onChange={setGenerationSource}
              type="select"
              options={generationSourceOptions}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
          </div>

          <div 
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              fontWeight: '500',
              color: isDarkMode ? '#939293' : '#8a8a8a',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: '0 24px 32px 24px'
            }}
          >
            Export the work you've done, or what's happened across your team.
          </div>

          {/* Premium Export Button */}
          <button
            disabled={isExporting}
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();

              if (isExporting) return;

              try {
                setIsExporting(true);
                console.log('🚀 Starting export to Outlook...');
                console.log('📅 Selected date range:', dateRange);
                console.log('📍 Selected generation source:', generationSource);

                // Calculate the actual date based on selected range
                let exportRange: 'today' | '7d' | '30d' | '60d' | 'custom' = 'custom';
                let customDate: string | undefined;

                const today = new Date();
                let startDate = new Date();

                switch(dateRange) {
                  case 'today':
                    exportRange = 'today';
                    console.log('📊 Export range: Today');
                    break;
                  case 'last-7-days':
                    exportRange = '7d';
                    console.log('📊 Export range: Last 7 days');
                    break;
                  case 'last-30-days':
                    exportRange = '30d';
                    console.log('📊 Export range: Last 30 days');
                    break;
                  case 'last-90-days':
                    // Use custom with 90 days calculation
                    exportRange = 'custom';
                    startDate.setDate(today.getDate() - 90);
                    customDate = startDate.toISOString().split('T')[0];
                    console.log('📊 Export range: Last 90 days (custom):', customDate);
                    break;
                  case 'last-year':
                    exportRange = 'custom';
                    startDate.setFullYear(today.getFullYear() - 1);
                    customDate = startDate.toISOString().split('T')[0];
                    console.log('📊 Export range: Last year (custom):', customDate);
                    break;
                  case 'all-time':
                    // Set to 5 years ago as a reasonable "all time" default
                    exportRange = 'custom';
                    startDate.setFullYear(today.getFullYear() - 5);
                    customDate = startDate.toISOString().split('T')[0];
                    console.log('📊 Export range: All time (custom):', customDate);
                    break;
                  default:
                    exportRange = '30d'; // Default fallback
                    console.log('⚠️ Unknown date range, using default: 30d');
                }

                // Use authenticated user data
                const userData = user ? {
                  email: user.email,
                  userName: user.userName || displayName,
                  userId: user.id
                } : undefined;

                console.log('📤 Sending export request:', {
                  exportRange,
                  customDate,
                  generationSource,
                  userData
                });

                const response = await completeWebhookService.exportToOutlook(
                  exportRange,
                  customDate,
                  userData,
                  generationSource
                );

                console.log('📥 Export response:', response);

                if (response.success) {
                  alert('Export request sent successfully! Your report will be delivered to your email shortly.');
                } else {
                  throw new Error(response.error || 'Export request failed');
                }

              } catch (error: any) {
                console.error('❌ Export to Outlook failed:', error);
                alert('Export failed. Please check your connection and try again.');
              } finally {
                setIsExporting(false);
              }
            }}
            style={{
              width: '194px',
              height: '48px',
              padding: '0 20px',
              fontSize: '15px',
              lineHeight: '20px',
              fontWeight: '600',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              background: '#0078fa',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.23, 1, 0.32, 1)',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: 'none',
              transform: 'translateY(0)',
              margin: '0 auto',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#004aff';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#004aff';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isExporting ? 'Sending...' : 'Send to my email'}
          </button>
        </>
      );

    case 'account':
      return (
        <>
          <div 
            style={{
              background: isDarkMode ? '#292929' : '#ffffff',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '0 24px 32px 24px',
              padding: '16px !important',
              boxShadow: 'none'
            }}
          >
            <AppleSettingsRow
              label={isMobile ? "Email" : "Email Address"}
              value={isMobile ? "john@company.com" : "john.doe@company.com"}
              isEditable={false}
              isMobile={isMobile}
                isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Account Type"
              value="Yacht"
              isEditable={false}
              isMobile={isMobile}
                isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Member Since"
              value={isMobile ? "Mar 15, 2023" : "March 15, 2023"}
              isEditable={false}
              isMobile={isMobile}
                isDarkMode={isDarkMode}
            />
          </div>

          {/* Logout Button - CelesteOS Brand Style */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={async () => {
              try {
                console.log('🚀 Attempting to logout...');

                if (logout) {
                  // Use proper Supabase logout - AuthContext will handle UI transition
                  await logout();
                  console.log('✅ Supabase logout successful - AuthContext will show login screen');
                } else {
                  // Fallback to manual logout for backward compatibility
                  console.log('⚠️ No logout function provided, using fallback');
                  localStorage.removeItem('ms_user_id');
                  localStorage.removeItem('user_id');
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userData');
                  localStorage.removeItem('celesteos_user');
                  localStorage.removeItem('celesteos_access_token');
                  localStorage.removeItem('celesteos_refresh_token');
                  localStorage.removeItem('hasSeenIntro');
                  localStorage.removeItem('hasCompletedTutorial');
                  localStorage.removeItem('appearance');
                  sessionStorage.clear();
                  // Only reload if we're doing fallback logout
                  window.location.reload();
                }
              } catch (error) {
                console.error('❌ Logout error:', error);
                // Clear everything and reload as fallback
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }
            }}
            style={{
              width: '120px',
              height: '48px',
              padding: '0 20px',
              fontSize: '15px',
              lineHeight: '20px',
              fontWeight: '600',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              background: '#0078fa',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.23, 1, 0.32, 1)',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: 'none',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#004aff';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#004aff';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Logout
          </button>
          </div>
        </>
      );

    case 'help-contact':
      return (
        <>
          {/* Enterprise Microcopy */}
          <div style={{
            marginBottom: '32px',
            padding: '16px 20px',
            background: isDarkMode ? darkTheme.backgrounds.tertiary : 'rgba(255, 255, 255, 0.6)',
            border: `1px solid ${isDarkMode ? darkTheme.modal.border : 'rgba(255, 255, 255, 0.3)'}`,
            borderRadius: '4px',
            backdropFilter: isDarkMode ? 'none' : 'blur(16px) saturate(1.1)',
            WebkitBackdropFilter: isDarkMode ? 'none' : 'blur(16px) saturate(1.1)'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: isDarkMode ? '#ffffff' : '#0f0f0f',
              fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>We're here to help</h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '20px',
              color: isDarkMode ? '#939293' : '#8a8a8a',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>Replies usually within 24h. Urgent? Email support@celesteos.io</p>
          </div>

          {/* Contact Form */}
          <div 
            style={{
              background: isDarkMode ? '#292929' : '#ffffff',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: `1px solid ${isDarkMode ? '#343434' : '#e7e7e7'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '0 24px 32px 24px',
              padding: '16px !important',
              boxShadow: 'none'
            }}
          >
            <AppleSettingsRow
              label="Message Type"
              value={getMessageTypeLabel(messageType)}
              isEditable={true}
              onChange={setMessageType}
              type="select"
              options={messageTypeOptions}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
            
            <AppleSettingsRow
              label="Your Email"
              value={isMobile ? "john@company.com" : (typeof displayName === 'string' ? displayName.toLowerCase().replace(' ', '.') + '@company.com' : 'user@company.com')}
              isEditable={true}
              onChange={() => {}}
              placeholder="your@email.com"
              isMobile={isMobile}
              isDarkMode={isDarkMode}
            />
          </div>

          <FormGroup 
            label="Message"
            description="Please describe your feedback or issue in detail."
            isDarkMode={isDarkMode}
          >
            <UnifiedTextarea
              placeholder="Please describe your feedback or issue in detail..."
              rows={6}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              isDarkMode={isDarkMode}
            />
          </FormGroup>

          {/* Premium CTA Button */}
          {(() => {
            const hasContent = messageContent.trim();
            const hasType = messageType;
            const isFullyEnabled = hasContent && hasType;
            const isPartiallyEnabled = hasContent && !hasType;
            const isDisabled = !hasContent;
            
            return (
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    if (isDisabled) return;
                    if (isPartiallyEnabled) {
                      alert('Please select a message type first');
                      return;
                    }

                    try {
                      console.log('🚀 Attempting to send help-contact request via CelesteOS webhook');
                      
                      const response = await completeWebhookService.sendTextChat(
                        `Support Request - ${messageType}: ${messageContent}`,
                        'email'
                      );
                      
                      if (response.success) {
                        alert('Message sent successfully! We will get back to you soon.');
                        setMessageContent('');
                        setMessageType('');
                      } else {
                        throw new Error('Message send failed');
                      }
                    } catch (error) {
                      console.error('❌ Failed to send via webhook:', error);
                      
                      // Fallback to mailto
                      const mailtoLink = `mailto:support@celesteos.io?subject=${encodeURIComponent(messageType)}&body=${encodeURIComponent(messageContent)}`;
                      window.location.href = mailtoLink;
                    }
                  }}
                  style={{
                    width: '168px',
                    height: '48px',
                    padding: '0 20px',
                    fontSize: '15px',
                    lineHeight: '20px',
                    fontWeight: '600',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    background: isFullyEnabled 
                      ? (isDarkMode ? '#0078fa' : '#0078fa')
                      : isPartiallyEnabled
                      ? (isDarkMode ? '#003ad1' : '#9ca3af')
                      : (isDarkMode ? darkTheme.buttons.disabled.background : 'rgba(255, 255, 255, 0.6)'),
                    color: isFullyEnabled 
                      ? (isDarkMode ? darkTheme.buttons.primary.text : '#ffffff')
                      : isPartiallyEnabled
                      ? '#ffffff'
                      : (isDarkMode ? darkTheme.buttons.disabled.text : '#9ca3af'),
                    border: isFullyEnabled || isPartiallyEnabled 
                      ? 'none'
                      : `1px solid ${isDarkMode ? darkTheme.buttons.disabled.border : 'rgba(255, 255, 255, 0.3)'}`,
                    borderRadius: '4px',
                    cursor: isFullyEnabled || isPartiallyEnabled ? 'pointer' : 'not-allowed',
                    transition: `all ${isDarkMode ? darkTheme.effects.microDelay : '240ms'} cubic-bezier(0.22, 0.61, 0.36, 1)`,
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: 'none',
                    transform: 'scale(1)',
                    backdropFilter: (isFullyEnabled || isPartiallyEnabled) ? 'none' : (isDarkMode ? 'none' : 'blur(8px)'),
                    WebkitBackdropFilter: (isFullyEnabled || isPartiallyEnabled) ? 'none' : (isDarkMode ? 'none' : 'blur(8px)')
                  }}
                  onMouseEnter={(e) => {
                    if (isFullyEnabled) {
                      e.currentTarget.style.background = isDarkMode 
                        ? darkTheme.buttons.primary.backgroundHover 
                        : '#0078fa';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = isDarkMode ? darkTheme.buttons.primary.scale : 'scale(1.03)';
                    } else if (isPartiallyEnabled) {
                      e.currentTarget.style.background = isDarkMode 
                        ? '#003ad1' 
                        : '#6b7280';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isFullyEnabled) {
                      e.currentTarget.style.background = isDarkMode 
                        ? darkTheme.buttons.primary.background 
                        : '#0078fa';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'scale(1)';
                    } else if (isPartiallyEnabled) {
                      e.currentTarget.style.background = isDarkMode 
                        ? '#003ad1' 
                        : '#9ca3af';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  onFocus={(e) => {
                    if (isFullyEnabled) {
                      e.currentTarget.style.boxShadow = 'none';
                    } else if (isPartiallyEnabled) {
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  onBlur={(e) => {
                    if (isFullyEnabled) {
                      e.currentTarget.style.boxShadow = 'none';
                    } else if (isPartiallyEnabled) {
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  Send Message
                </button>
              </div>
            );
          })()}
        </>
      );

    default:
      return (
        <div 
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
            color: isDarkMode ? darkTheme.text.secondary : '#6b7280',
            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          Settings for this section will be available soon.
        </div>
      );
  }
};