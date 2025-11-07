import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Globe, 
  Mic, 
  Search, 
  Sparkles, 
  Database, 
  Mail,
  CheckCircle,
  Plus
} from 'lucide-react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

// Import professional components
import { Button, Input, Card, CardHeader, CardBody, Typography, Heading, Text } from '../ui-pro';
import { ChatAnimation, StaggeredLazyLoad, TypingIndicator } from '../animations/LazyLoad';

// Import existing services and types
import { type EmailStatus } from '../../services/emailIntegration';
import { type UserData } from '../auth/LoginScreen';
import SearchResults from '../SearchResults';

// Types
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  cascadeResults?: any;
}

interface ChatInterfaceProps {
  currentUser: UserData;
  emailStatus: EmailStatus | null;
  onSendMessage: (message: string, searchStrategy: string) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
  emailSearchEnabled: boolean;
  yachtSearchEnabled: boolean;
  onToggleChange: (toggle: string, value: boolean) => void;
}

export default function ChatInterface({
  currentUser,
  emailStatus,
  onSendMessage,
  messages,
  isLoading,
  emailSearchEnabled,
  yachtSearchEnabled,
  onToggleChange
}: ChatInterfaceProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { colors, foundations, typography, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  // Auto scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');

    // Determine search strategy - only yacht or email
    let searchStrategy = 'yacht'; // Default to yacht
    if (emailSearchEnabled) {
      searchStrategy = 'email';
    } else if (yachtSearchEnabled) {
      searchStrategy = 'yacht';
    }

    await onSendMessage(text, searchStrategy);
  }, [inputValue, isLoading, onSendMessage, emailSearchEnabled, yachtSearchEnabled]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  // Professional input styles
  const inputContainerStyles: React.CSSProperties = {
    position: 'relative',
    maxWidth: '768px',
    margin: '0 auto',
    backgroundColor: themeColors.surface.primary,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: `${foundations.radius.xl}px`,
    padding: `${foundations.grid.spacing.md}px`,
    boxShadow: theme === 'light' ? foundations.elevation.medium : foundations.elevation.darkMedium,
    transition: `all ${animation.duration.normal}ms ${animation.easing.easeOut}`
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '60px',
    maxHeight: '200px',
    padding: '0',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: `${typography.fontSize.base}px`,
    fontFamily: typography.fontFamily.primary,
    color: themeColors.text.primary,
    lineHeight: 1.5
  };

  // Search strategy indicator
  const getSearchStrategyText = () => {
    if (emailSearchEnabled) {
      return "📧 Searching emails";
    } else if (yachtSearchEnabled) {
      return "⛵ Searching yacht documentation";
    } else {
      return "⛵ Yacht search ready";
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: themeColors.surface.primary,
        fontFamily: typography.fontFamily.primary
      }}
    >
      {messages.length === 0 ? (
        // Welcome Screen
        <div 
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${foundations.grid.spacing.xl}px`,
            paddingBottom: `${foundations.grid.spacing.xxl}px`
          }}
        >
          <ChatAnimation type="newChat">
            <div style={{ textAlign: 'center', marginBottom: `${foundations.grid.spacing.xl}px` }}>
              <Heading level={1} style={{ marginBottom: `${foundations.grid.spacing.lg}px` }}>
                What can I help with?
              </Heading>
              <Text color="secondary">
                Ask me anything about your vessel, documentation, or maritime operations
              </Text>
            </div>
          </ChatAnimation>

          {/* Input Area */}
          <div style={{ width: '100%', maxWidth: '768px', marginBottom: `${foundations.grid.spacing.lg}px` }}>
            <div style={inputContainerStyles}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Celeste..."
                disabled={isLoading}
                style={textareaStyles}
                rows={1}
              />
              
              {/* Input Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: `${foundations.grid.spacing.sm}px`
              }}>
                <div style={{ display: 'flex', gap: `${foundations.grid.spacing.sm}px` }}>
                  <Button variant="ghost" size="iconSm">
                    <Paperclip size={18} />
                  </Button>
                  <Button variant="ghost" size="iconSm">
                    <Globe size={18} />
                  </Button>
                  <Button variant="ghost" size="iconSm">
                    <Mic size={18} />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  variant="primary"
                  size="iconSm"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Strategy Toggles */}
          <Card variant="outlined" style={{ maxWidth: '768px', width: '100%' }}>
            <CardBody>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: `${foundations.grid.spacing.sm}px`,
                justifyContent: 'center',
                marginBottom: `${foundations.grid.spacing.md}px`
              }}>
                {/* Email Toggle */}
                {emailStatus?.email_connected ? (
                  <Button
                    variant={emailSearchEnabled ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onToggleChange('email', !emailSearchEnabled)}
                    leftIcon={<Search size={14} />}
                    rightIcon={<CheckCircle size={12} />}
                  >
                    Email
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => currentUser && window.open('/connect-email', '_blank')}
                    leftIcon={<Mail size={14} />}
                  >
                    Connect Email
                  </Button>
                )}

                {/* Yacht Toggle */}
                <Button
                  variant={yachtSearchEnabled ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onToggleChange('yacht', !yachtSearchEnabled)}
                  leftIcon={<Database size={14} />}
                >
                  Yacht
                </Button>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <Text color="tertiary" style={{ fontSize: `${typography.fontSize.sm}px` }}>
                  {getSearchStrategyText()}
                </Text>
              </div>
            </CardBody>
          </Card>

          <div style={{
            position: 'absolute',
            bottom: `${foundations.grid.spacing.lg}px`,
            textAlign: 'center'
          }}>
            <Text color="quaternary" style={{ fontSize: `${typography.fontSize.xs}px` }}>
              CelesteOS can make mistakes. Verify critical information.
            </Text>
          </div>
        </div>
      ) : (
        // Chat View
        <>
          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: `${foundations.grid.spacing.xl}px`,
              paddingBottom: '200px'
            }}
          >
            <div style={{ maxWidth: '768px', margin: '0 auto' }}>
              <StaggeredLazyLoad staggerDelay={100}>
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    style={{ marginBottom: `${foundations.grid.spacing.lg}px` }}
                  >
                    {message.isUser ? (
                      // User Message
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Card
                          variant="filled"
                          style={{
                            maxWidth: '80%',
                            backgroundColor: themeColors.surface.accent,
                            marginLeft: 'auto'
                          }}
                        >
                          <CardBody>
                            <Text color="inverse" style={{ whiteSpace: 'pre-wrap' }}>
                              {message.text}
                            </Text>
                          </CardBody>
                        </Card>
                      </div>
                    ) : (
                      // AI Response
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ maxWidth: '95%', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: `${foundations.grid.spacing.md}px` }}>
                            {/* Avatar */}
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: themeColors.surface.accent,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '4px'
                            }}>
                              <Text color="inverse" weight="bold" style={{ fontSize: '14px' }}>
                                C
                              </Text>
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <Card variant="outlined" style={{ marginBottom: `${foundations.grid.spacing.md}px` }}>
                                <CardBody>
                                  <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {message.text}
                                  </Text>
                                </CardBody>
                              </Card>
                              
                              {/* Cascade Results */}
                              {message.cascadeResults && (
                                <ChatAnimation type="card" delay={200}>
                                  <SearchResults
                                    query={message.cascadeResults.query}
                                    searchType={message.cascadeResults.type}
                                    results={message.cascadeResults.results}
                                  />
                                </ChatAnimation>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </StaggeredLazyLoad>
              
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: `${foundations.grid.spacing.md}px` }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: themeColors.surface.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '4px'
                    }}>
                      <Text color="inverse" weight="bold" style={{ fontSize: '14px' }}>
                        C
                      </Text>
                    </div>
                    
                    <Card variant="outlined">
                      <CardBody>
                        <TypingIndicator />
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed Input Area */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(to top, ${themeColors.surface.primary}, ${themeColors.surface.primary}e6, transparent)`,
            padding: `${foundations.grid.spacing.xl}px`
          }}>
            <div style={{ maxWidth: '768px', margin: '0 auto' }}>
              <div style={inputContainerStyles}>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Celeste..."
                  disabled={isLoading}
                  style={textareaStyles}
                  rows={1}
                />
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: `${foundations.grid.spacing.sm}px`
                }}>
                  <div style={{ display: 'flex', gap: `${foundations.grid.spacing.sm}px` }}>
                    <Button variant="ghost" size="iconSm">
                      <Paperclip size={18} />
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    variant="primary"
                    size="iconSm"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
              
              {/* Search Strategy Indicator */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: `${foundations.grid.spacing.xs}px`,
                justifyContent: 'center',
                marginTop: `${foundations.grid.spacing.sm}px`
              }}>
                {emailStatus?.email_connected && (
                  <Button
                    variant={emailSearchEnabled ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onToggleChange('email', !emailSearchEnabled)}
                    leftIcon={<Search size={12} />}
                  >
                    Email
                  </Button>
                )}

                <Button
                  variant={yachtSearchEnabled ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onToggleChange('yacht', !yachtSearchEnabled)}
                  leftIcon={<Database size={12} />}
                >
                  Yacht
                </Button>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: `${foundations.grid.spacing.xs}px` }}>
                <Text color="quaternary" style={{ fontSize: `${typography.fontSize.xs}px` }}>
                  {getSearchStrategyText()}
                </Text>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}