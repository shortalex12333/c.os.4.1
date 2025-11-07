import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Settings, User, ChevronLeft, ChevronRight, Folder, ChevronDown, ChevronRight as ChevronRightSmall, MoreHorizontal, Ship, Mail, Search, Edit3, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
const brainLogo = '/Logo.png';

interface SidebarProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  onMobileMenuClose: () => void;
  displayName: string;
  isChatMode: boolean;
  isDarkMode?: boolean;
  onSearchTypeChange?: (searchType: 'yacht' | 'email') => void;
  selectedSearchType?: 'yacht' | 'email';
}

export function Sidebar({ 
  onNewChat, 
  onOpenSettings, 
  isMobile = false, 
  isCollapsed = false, 
  onToggleCollapse,
  onMobileMenuClose,
  displayName,
  isChatMode,
  isDarkMode = false,
  onSearchTypeChange,
  selectedSearchType = 'yacht'
}: SidebarProps) {
  const [searchType, setSearchType] = useState<'chat' | 'yacht' | 'email'>('chat');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');

  // Mock chat history - Binds to: response.chat_history[]
  const mockChatHistory = [
    {
      id: 'chat_1',
      title: 'Engine Error E-047 Troubleshooting',
      timestamp: '2024-01-15T14:30:00Z',
      folder: 'Engine Issues'
    },
    {
      id: 'chat_2', 
      title: 'Navigation System Calibration',
      timestamp: '2024-01-14T09:15:00Z',
      folder: 'Navigation'
    },
    {
      id: 'chat_3',
      title: 'Safety Equipment Checklist',
      timestamp: '2024-01-13T16:45:00Z',
      folder: 'Safety'
    }
  ];

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) {
      onMobileMenuClose();
    }
  };

  const handleSearchTypeSelect = (type: 'yacht' | 'email') => {
    setSearchType(type);
    if (onSearchTypeChange) {
      onSearchTypeChange(type);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const startEditingChat = (chatId: string, currentName: string) => {
    setEditingChat(chatId);
    setEditingChatName(currentName);
  };

  const saveEditingChat = () => {
    // Here you would update the chat name
    console.log('Updating chat name to:', editingChatName);
    setEditingChat(null);
    setEditingChatName('');
  };

  const cancelEditingChat = () => {
    setEditingChat(null);
    setEditingChatName('');
  };

  // Determine sidebar background and styling based on chat mode and theme
  const getSidebarStyles = () => {
    if (isDarkMode) {
      if (isChatMode) {
        // Dark chat mode: Royal plum with glassmorphism
        return {
          background: 'linear-gradient(180deg, rgba(20, 12, 24, 0.95) 0%, rgba(15, 11, 18, 0.9) 50%, rgba(20, 12, 24, 0.95) 100%)',
          backdropFilter: 'blur(16px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.15)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '6px 0 24px rgba(0, 0, 0, 0.25), 2px 0 8px rgba(0, 0, 0, 0.15), inset -1px 0 0 rgba(255, 255, 255, 0.06)'
        };
      } else {
        // Dark homepage: Glassmorphism to show royal plum gradient background
        return {
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(24px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.25)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        };
      }
    } else {
      if (isChatMode) {
        // Light chat mode: Enhanced glassmorphism with light grey/white gradient and subtle shadow
        return {
          background: 'linear-gradient(180deg, rgba(248, 249, 251, 0.95) 0%, rgba(243, 244, 246, 0.9) 50%, rgba(249, 250, 251, 0.95) 100%)',
          backdropFilter: 'blur(16px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.15)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '6px 0 24px rgba(0, 0, 0, 0.12), 2px 0 8px rgba(0, 0, 0, 0.06), inset -1px 0 0 rgba(255, 255, 255, 0.3)'
        };
      } else {
        // Light homepage: Glassmorphism to show blue gradient background
        return {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.25)',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        };
      }
    }
  };

  return (
    // Binds to: metadata.user_id, response.chat_history[], response.system_info.navigation
    <aside 
      className="relative h-full flex flex-col transition-all duration-300 sidebar_navigation"
      style={{
        width: '100%',
        ...getSidebarStyles()
      }}
    >
      {/* Header Section */}
      <div 
        className="flex flex-col sidebar_header"
        style={{ 
          padding: isMobile ? '20px 16px 16px' : isCollapsed ? '20px 12px 16px' : '20px 16px 16px'
        }}
      >
        {/* Collapse Toggle - Desktop Only */}
        {!isCollapsed && !isMobile && (
          <div className="flex justify-between items-center mb-4 sidebar_header_actions">
            {/* Logo - Desktop Only */}
            {!isMobile && (
              <div className="flex items-center">
                <ImageWithFallback
                  src={brainLogo}
                  alt="CelesteOS Brain Logo"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain'
                  }}
                  className="brain_logo_display"
                />
              </div>
            )}
            
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 sidebar_collapse_toggle"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="space-y-2 action_buttons_section">
          {/* New Chat Button - Binds to: metadata.new_chat_action */}
          <button
            onClick={handleNewChat}
            className={`flex items-center gap-3 w-full transition-all duration-200 new_chat_button ${isMobile ? 'p-2.5' : 'p-3'}`}
            style={{
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: isMobile ? '15px' : '14px',
              fontWeight: '500',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#374151'
            }}
            onMouseEnter={(e) => {
              if (isDarkMode) {
                e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)';
              } else {
                e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && "New chat"}
          </button>

          {/* Search Type Buttons - Binds to: metadata.search_type */}
          {!isCollapsed && (
            <div className="space-y-1 search_type_buttons">
              {/* Yacht Search Button - Binds to: metadata.search_type.yacht */}
              <button
                onClick={() => handleSearchTypeSelect('yacht')}
                className={`flex items-center gap-3 w-full p-3 transition-all duration-200 yacht_search_button`}
                style={{
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#374151'
                }}
                onMouseEnter={(e) => {
                  if (isDarkMode) {
                    e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)';
                  } else {
                    e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Ship 
                  className="w-4 h-4" 
                  style={{ 
                    color: selectedSearchType === 'yacht' 
                      ? isDarkMode 
                        ? 'var(--opulent-gold, #c8a951)' 
                        : '#181818' 
                      : undefined 
                  }} 
                />
                {!isCollapsed && "Yacht Search"}
              </button>

              {/* Email Search Button - Binds to: metadata.search_type.email */}
              <button
                onClick={() => handleSearchTypeSelect('email')}
                className={`flex items-center gap-3 w-full p-3 transition-all duration-200 email_search_button`}
                style={{
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#374151'
                }}
                onMouseEnter={(e) => {
                  if (isDarkMode) {
                    e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)';
                  } else {
                    e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Mail 
                  className="w-4 h-4" 
                  style={{ 
                    color: selectedSearchType === 'email' 
                      ? isDarkMode 
                        ? 'var(--opulent-gold, #c8a951)' 
                        : '#181818' 
                      : undefined 
                  }} 
                />
                {!isCollapsed && "Email Search"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat History Section - Binds to: response.chat_history[] */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden chat_history_container">
        {!isCollapsed && (
          <div 
            className="space-y-1 chat_history_list"
            style={{ padding: '0 16px' }}
          >
            {/* Chat History Header */}
            <div 
              className="flex items-center justify-between px-2 py-2 text-sm chat_history_header"
              style={{
                fontSize: '12px',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: isDarkMode ? 'rgba(246, 247, 251, 0.6)' : '#6b7280'
              }}
            >
              <span>Recent Conversations</span>
              {/* Binds to: response.chat_history.length */}
              <span className="chat_count_display">{mockChatHistory.length}</span>
            </div>

            {/* Chat History Items - Binds to: response.chat_history[] */}
            {mockChatHistory.map((chat, index) => (
              <div key={chat.id} className="relative group chat_history_item">
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100/50 transition-colors duration-200">
                  {/* Chat Icon */}
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  
                  {/* Chat Content */}
                  <div className="flex-1 min-w-0">
                    {editingChat === chat.id ? (
                      /* Edit Chat Name - Binds to: metadata.chat_rename */
                      <div className="flex items-center gap-1 chat_name_editor">
                        <input
                          type="text"
                          value={editingChatName}
                          onChange={(e) => setEditingChatName(e.target.value)}
                          className="flex-1 px-1 py-0.5 text-sm bg-white border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 chat_name_input"
                          style={{
                            fontSize: '13px',
                            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingChat();
                            if (e.key === 'Escape') cancelEditingChat();
                          }}
                        />
                        <button
                          onClick={saveEditingChat}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditingChat}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* Chat Title Display - Binds to: response.chat_history[].title */
                      <div className="chat_title_display">
                        <div 
                          className="text-sm truncate chat_title_text"
                          style={{
                            fontSize: '13px',
                            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#374151'
                          }}
                        >
                          {chat.title}
                        </div>
                        {/* Binds to: response.chat_history[].timestamp */}
                        <div 
                          className="text-xs chat_timestamp"
                          style={{
                            fontSize: '11px',
                            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            color: isDarkMode ? 'rgba(246, 247, 251, 0.5)' : '#9ca3af'
                          }}
                        >
                          {new Date(chat.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Actions */}
                  {editingChat !== chat.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all duration-200 chat_actions_trigger">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 chat_actions_menu">
                        <DropdownMenuItem
                          onClick={() => startEditingChat(chat.id, chat.title)}
                          className="text-sm rename_chat_action"
                        >
                          <Edit3 className="w-3 h-3 mr-2" />
                          Rename
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Section - Binds to: metadata.user_id, response.system_info.user_profile */}
      <div 
        className="border-t border-gray-200 sidebar_footer"
        style={{
          padding: isMobile ? '16px' : '16px',
          borderColor: isDarkMode 
            ? 'rgba(255, 255, 255, 0.08)' 
            : isChatMode 
              ? 'rgba(0, 0, 0, 0.08)' 
              : 'rgba(255, 255, 255, 0.12)'
        }}
      >
        {!isCollapsed ? (
          <div className="flex items-center justify-between user_profile_section">
            {/* User Profile - Binds to: metadata.user_id */}
            <div className="flex items-center gap-3 flex-1 min-w-0 user_profile_display">
              {/* Binds to: metadata.user_profile.avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0 user_avatar">
                <span 
                  className="text-white font-medium"
                  style={{
                    fontSize: '10px',
                    lineHeight: '10px',
                    fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  {displayName
                    .split(' ')
                    .map(name => name[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              
              {/* Binds to: metadata.user_profile.display_name */}
              <span 
                className="text-sm font-medium truncate user_display_name"
                style={{
                  fontSize: '14px',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#374151'
                }}
              >
                {displayName}
              </span>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => {
                onOpenSettings();
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 settings_button"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Collapsed Footer */
          <div className="flex flex-col items-center gap-2 collapsed_footer">
            {/* Binds to: metadata.user_profile.avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm user_avatar_collapsed">
              <span 
                className="text-white font-medium"
                style={{
                  fontSize: '10px',
                  lineHeight: '10px',
                  fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {displayName
                  .split(' ')
                  .map(name => name[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            
            <button
              onClick={() => {
                onOpenSettings();
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 settings_button_collapsed"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}