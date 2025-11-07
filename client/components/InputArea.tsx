import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Ship, Mail, Search, ChevronDown, Settings, Layers } from 'lucide-react';

interface InputAreaProps {
  onStartChat: (searchType?: SearchType) => void;
  isMobile?: boolean;
  isDarkMode?: boolean;
  currentSearchType?: SearchType;
}

type SearchType = 'yacht' | 'email' | 'email-yacht';

export function InputArea({ onStartChat, isMobile = false, isDarkMode = false, currentSearchType = 'yacht' }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState<SearchType>(currentSearchType);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  // Synchronize with parent component's search type
  useEffect(() => {
    setSelectedSearchType(currentSearchType);
  }, [currentSearchType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onStartChat(selectedSearchType);
      setMessage(''); // Clear input after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSearchTypeSelect = (type: SearchType) => {
    setSelectedSearchType(type);
    if (isMobile) {
      setIsMobileControlsOpen(false);
    }
  };

  const handleAttachment = () => {
    // Handle attachment logic here
    if (isMobile) {
      setIsMobileControlsOpen(false);
    }
  };

  const searchTypes = [
    {
      id: 'yacht' as SearchType,
      icon: Ship,
      title: 'Yacht Search',
      description: 'Search yacht maintenance and operations',
      placeholder: 'Ask anything...'
    },
    {
      id: 'email' as SearchType,
      icon: Mail,
      title: 'Email Search',
      description: 'Search through email communications',
      placeholder: 'Ask me anything about email communications or correspondence...'
    },
    {
      id: 'email-yacht' as SearchType,
      icon: Layers,
      title: 'Email + Yacht',
      description: 'Search both for holistic view',
      placeholder: 'Ask me anything across both email and yacht systems...'
    }
  ];

  const getCurrentPlaceholder = () => {
    const currentType = searchTypes.find(type => type.id === selectedSearchType);
    return currentType?.placeholder || 'Ask me anything...';
  };

  const getCurrentSearchType = () => {
    return searchTypes.find(type => type.id === selectedSearchType);
  };

  return (
    <div 
      className="flex flex-col query_input_container"
      style={{
        maxWidth: isMobile ? '390px' : '760px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px'
      }}
    >
      {/* Search Type Indicator */}
      <div className="flex items-center justify-center mb-2">
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all duration-200 search_type_indicator"
          style={{
            backgroundColor: isDarkMode 
              ? 'rgba(246, 247, 251, 0.08)' 
              : 'rgba(24, 24, 24, 0.06)',
            color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#6b7280',
            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
          }}
        >
          {(() => {
            const currentType = searchTypes.find(type => type.id === selectedSearchType);
            const IconComponent = currentType?.icon || Ship;
            return (
              <>
                <IconComponent className="w-3 h-3" />
                <span>{currentType?.title || 'Yacht Search'}</span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Input Form - Binds to: metadata.user_query */}
      <form onSubmit={handleSubmit} className="relative user_query_form">
        <div 
          className="flex items-center gap-3 p-4 border rounded-lg shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:border-transparent query_input_wrapper"
          style={{
            borderRadius: isMobile ? '16px' : '20px',
            minHeight: '56px',
            boxShadow: isDarkMode 
              ? '0 4px 12px rgba(0, 0, 0, 0.25)' 
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            background: isDarkMode 
              ? 'rgba(15, 11, 18, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.12)' 
              : 'rgba(0, 0, 0, 0.1)',
            focusWithin: {
              '--tw-ring-color': isDarkMode 
                ? 'rgba(200, 169, 81, 0.35)' 
                : 'rgba(0, 112, 255, 0.35)'
            }
          }}
        >
          {/* Desktop: Full Control Layout */}
          {!isMobile && (
            <>
              {/* Search Type Selector Icons */}
              <div className="flex items-center gap-1 search_type_selector">
                {searchTypes.map((searchType) => {
                  const IconComponent = searchType.icon;
                  const isSelected = selectedSearchType === searchType.id;
                  
                  return (
                    <button
                      key={searchType.id}
                      type="button"
                      onClick={() => handleSearchTypeSelect(searchType.id)}
                      className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 search_type_button"
                      style={{
                        width: '36px',
                        height: '36px',
                        color: isSelected 
                          ? isDarkMode 
                            ? 'var(--opulent-gold, #c8a951)' 
                            : '#181818' 
                          : isDarkMode 
                            ? 'rgba(246, 247, 251, 0.7)' 
                            : '#6b7280',
                        backgroundColor: isSelected 
                          ? isDarkMode 
                            ? 'rgba(200, 169, 81, 0.12)' 
                            : 'rgba(24, 24, 24, 0.08)' 
                          : 'transparent',
                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        borderRadius: 'var(--spacing-2)'
                      }}
                      title={searchType.title}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = isDarkMode ? '#f6f7fb' : '#374151';
                          e.currentTarget.style.backgroundColor = isDarkMode 
                            ? 'rgba(246, 247, 251, 0.08)' 
                            : 'rgba(107, 114, 128, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = isDarkMode 
                            ? 'rgba(246, 247, 251, 0.7)' 
                            : '#6b7280';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <IconComponent 
                        className="w-4 h-4" 
                        style={{
                          strokeWidth: isSelected ? '2.5' : '2'
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Separator */}
              <div 
                className="w-px search_separator" 
                style={{ 
                  height: '20px',
                  margin: '0 var(--spacing-1)',
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.12)' 
                    : 'rgba(0, 0, 0, 0.1)'
                }} 
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={handleAttachment}
                className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 attachment_button"
                style={{
                  width: '36px',
                  height: '36px',
                  color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                  borderRadius: 'var(--spacing-2)'
                }}
                title="Attach file"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isDarkMode ? '#f6f7fb' : '#374151';
                  e.currentTarget.style.backgroundColor = isDarkMode 
                    ? 'rgba(246, 247, 251, 0.08)' 
                    : 'rgba(107, 114, 128, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Mobile: Collapsed Folder System */}
          {isMobile && (
            <div className="relative mobile_controls_container">
              <button
                type="button"
                onClick={() => setIsMobileControlsOpen(!isMobileControlsOpen)}
                className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 mobile_controls_button"
                style={{
                  width: '36px',
                  height: '36px',
                  color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
                  backgroundColor: isMobileControlsOpen 
                    ? isDarkMode 
                      ? 'rgba(246, 247, 251, 0.12)' 
                      : 'rgba(24, 24, 24, 0.08)'
                    : 'transparent',
                  borderRadius: 'var(--spacing-2)'
                }}
                title="Chat controls"
              >
                <Settings 
                  className={`w-4 h-4 transition-transform duration-200 ${isMobileControlsOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {/* Mobile Controls Dropdown */}
              {isMobileControlsOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40 mobile_controls_backdrop"
                    onClick={() => setIsMobileControlsOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div 
                    className="absolute bottom-full left-0 mb-2 rounded-xl shadow-lg border backdrop-blur-lg z-50 mobile_controls_dropdown"
                    style={{
                      backgroundColor: isDarkMode 
                        ? 'rgba(15, 11, 18, 1.0)' 
                        : 'rgba(255, 255, 255, 1.0)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                      boxShadow: isDarkMode 
                        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' 
                        : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                      minWidth: '280px',
                      maxWidth: '320px'
                    }}
                  >

                    {/* Search Type Options */}
                    <div className="py-2 mobile_search_options">
                      <div 
                        className="px-4 py-2 text-xs font-medium"
                        style={{
                          color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#9ca3af',
                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      >
                        Search Type
                      </div>
                      {searchTypes.map((searchType) => {
                        const IconComponent = searchType.icon;
                        const isSelected = selectedSearchType === searchType.id;
                        
                        return (
                          <button
                            key={searchType.id}
                            onClick={() => handleSearchTypeSelect(searchType.id)}
                            className="flex items-center w-full px-4 py-3 transition-all duration-200 mobile_search_option"
                            style={{
                              backgroundColor: isSelected 
                                ? isDarkMode 
                                  ? 'rgba(200, 169, 81, 0.12)' 
                                  : 'rgba(0, 112, 255, 0.08)'
                                : 'transparent',
                              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = isDarkMode 
                                  ? 'rgba(246, 247, 251, 0.06)' 
                                  : 'rgba(0, 0, 0, 0.03)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              } else {
                                e.currentTarget.style.backgroundColor = isDarkMode 
                                  ? 'rgba(200, 169, 81, 0.12)' 
                                  : 'rgba(0, 112, 255, 0.08)';
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <IconComponent 
                                className="w-5 h-5" 
                                style={{
                                  color: isSelected 
                                    ? isDarkMode 
                                      ? 'var(--opulent-gold, #c8a951)' 
                                      : '#2563eb'
                                    : isDarkMode 
                                      ? 'rgba(246, 247, 251, 0.7)' 
                                      : '#6b7280'
                                }}
                              />
                              <div className="flex flex-col items-start flex-1">
                                <div 
                                  className="font-medium"
                                  style={{
                                    fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    lineHeight: '20px',
                                    color: isSelected 
                                      ? isDarkMode 
                                        ? 'var(--opulent-gold, #c8a951)' 
                                        : '#2563eb'
                                      : 'inherit'
                                  }}
                                >
                                  {searchType.title}
                                </div>
                                <div 
                                  className="text-sm"
                                  style={{
                                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    fontSize: '13px',
                                    lineHeight: '18px',
                                    color: isDarkMode 
                                      ? 'rgba(246, 247, 251, 0.65)' 
                                      : '#6b7280',
                                    marginTop: '2px'
                                  }}
                                >
                                  {searchType.description}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Additional Controls */}
                    <div className="py-2 border-t mobile_additional_controls"
                      style={{
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      <div 
                        className="px-4 py-2 text-xs font-medium"
                        style={{
                          color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#9ca3af',
                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                      >
                        Actions
                      </div>
                      
                      {/* Attachment Button */}
                      <button
                        onClick={handleAttachment}
                        className="flex items-center w-full px-4 py-3 transition-all duration-200 mobile_attachment_button"
                        style={{
                          backgroundColor: 'transparent',
                          color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode 
                            ? 'rgba(246, 247, 251, 0.06)' 
                            : 'rgba(0, 0, 0, 0.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Paperclip className="w-5 h-5" style={{
                            color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                          }} />
                          <div 
                            className="font-medium"
                            style={{
                              fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: '15px',
                              fontWeight: 500,
                              lineHeight: '20px'
                            }}
                          >
                            Attach File
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Text Input - Binds to: metadata.user_query */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getCurrentPlaceholder()}
            className={`flex-1 resize-none bg-transparent border-none outline-none user_query_input ${
              isDarkMode ? 'placeholder:text-white/55' : 'placeholder:text-gray-500'
            }`}
            style={{
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
              fontSize: isMobile ? '16px' : '16px',
              lineHeight: isMobile ? '22px' : '24px',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              minHeight: '24px',
              maxHeight: '120px'
            }}
            rows={1}
          />

          {/* Send Button - Binds to: metadata.query_submission */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="flex items-center justify-center p-2 rounded-lg text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed query_submit_button"
            style={{
              width: '36px',
              height: '36px',
              opacity: message.trim() ? 1 : 0.5,
              backgroundColor: message.trim() 
                ? isDarkMode 
                  ? 'var(--opulent-gold, #c8a951)' 
                  : '#2563eb'
                : isDarkMode 
                  ? 'rgba(200, 169, 81, 0.3)' 
                  : 'rgba(107, 114, 128, 0.3)',
              borderRadius: 'var(--spacing-2)'
            }}
            title="Send message"
            onMouseEnter={(e) => {
              if (message.trim()) {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? '#e0c46e' 
                  : '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (message.trim()) {
                e.currentTarget.style.backgroundColor = isDarkMode 
                  ? 'var(--opulent-gold, #c8a951)' 
                  : '#2563eb';
              }
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}