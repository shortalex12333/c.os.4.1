import React, { useState } from 'react';
import { 
  Menu, 
  Plus, 
  MessageSquare, 
  Sparkles, 
  Settings,
  User,
  ChevronRight,
  X,
  MoreHorizontal,
  Trash2,
  Edit3
} from 'lucide-react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

// Import professional components
import { Button, Navigation, NavItem, NavGroup, Typography, Text } from '../ui-pro';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onShowSettings: () => void;
  currentUser?: { display_name?: string } | null;
}

export default function ChatSidebar({
  conversations,
  activeConversationId,
  collapsed,
  onToggleCollapsed,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onShowSettings,
  currentUser
}: ChatSidebarProps) {
  const { theme } = useTheme();
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  
  const { colors, foundations, typography, animation } = siteDesignSystem;
  const themeColors = colors[theme];

  // Group conversations by time period
  const groupConversations = (convs: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      thisWeek: [] as Conversation[],
      thisMonth: [] as Conversation[],
      older: [] as Conversation[]
    };

    convs.forEach(conv => {
      if (conv.timestamp >= today) {
        groups.today.push(conv);
      } else if (conv.timestamp >= yesterday) {
        groups.yesterday.push(conv);
      } else if (conv.timestamp >= weekAgo) {
        groups.thisWeek.push(conv);
      } else if (conv.timestamp >= monthAgo) {
        groups.thisMonth.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const conversationGroups = groupConversations(conversations);

  const handleStartEditing = (conversation: Conversation) => {
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleFinishEditing = () => {
    if (editingConversationId && editingTitle.trim()) {
      onRenameConversation(editingConversationId, editingTitle.trim());
    }
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleCancelEditing = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  const sidebarStyles: React.CSSProperties = {
    width: collapsed ? '64px' : '280px',
    height: '100vh',
    backgroundColor: themeColors.surface.secondary,
    borderRight: `1px solid ${themeColors.border.subtle}`,
    display: 'flex',
    flexDirection: 'column',
    transition: `width ${animation.duration.normal}ms ${animation.easing.easeOut}`,
    overflow: 'hidden'
  };

  const headerStyles: React.CSSProperties = {
    padding: `${foundations.grid.spacing.lg}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    flexShrink: 0
  };

  const brandStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${foundations.grid.spacing.md}px`,
    padding: `${foundations.grid.spacing.sm}px`,
    borderRadius: `${foundations.radius.md}px`,
    backgroundColor: 'transparent',
    transition: `background-color ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    cursor: 'pointer'
  };

  const logoStyles: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#00d4aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const conversationItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${foundations.grid.spacing.sm}px ${foundations.grid.spacing.md}px`,
    borderRadius: `${foundations.radius.sm}px`,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: `all ${animation.duration.fast}ms ${animation.easing.easeOut}`,
    position: 'relative',
    textAlign: 'left'
  };

  const getConversationItemStyles = (conversationId: string) => ({
    ...conversationItemStyles,
    backgroundColor: activeConversationId === conversationId 
      ? themeColors.surface.tertiary 
      : hoveredConversationId === conversationId 
        ? themeColors.surface.secondary 
        : 'transparent',
    borderLeft: activeConversationId === conversationId 
      ? `3px solid ${themeColors.border.focus}` 
      : '3px solid transparent'
  });

  const renderConversationGroup = (title: string, conversations: Conversation[]) => {
    if (conversations.length === 0) return null;

    return (
      <NavGroup 
        key={title}
        title={!collapsed ? title : undefined}
        collapsible={!collapsed}
        defaultCollapsed={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${foundations.grid.spacing.xs}px` }}>
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredConversationId(conversation.id)}
              onMouseLeave={() => setHoveredConversationId(null)}
            >
              {editingConversationId === conversation.id ? (
                <div style={{ padding: `${foundations.grid.spacing.sm}px` }}>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleFinishEditing}
                    onKeyDown={handleKeyDown}
                    style={{
                      width: '100%',
                      padding: `${foundations.grid.spacing.xs}px ${foundations.grid.spacing.sm}px`,
                      backgroundColor: themeColors.surface.primary,
                      border: `1px solid ${themeColors.border.focus}`,
                      borderRadius: `${foundations.radius.sm}px`,
                      color: themeColors.text.primary,
                      fontSize: `${typography.fontSize.sm}px`,
                      outline: 'none'
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  style={getConversationItemStyles(conversation.id)}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0,
                    display: collapsed ? 'none' : 'block'
                  }}>
                    <Text 
                      truncate 
                      color={activeConversationId === conversation.id ? 'primary' : 'secondary'}
                      style={{ 
                        fontSize: `${typography.fontSize.sm}px`,
                        fontWeight: activeConversationId === conversation.id ? 500 : 400
                      }}
                    >
                      {conversation.title}
                    </Text>
                  </div>
                  
                  {!collapsed && hoveredConversationId === conversation.id && (
                    <div style={{
                      position: 'absolute',
                      right: `${foundations.grid.spacing.sm}px`,
                      display: 'flex',
                      gap: `${foundations.grid.spacing.xs}px`,
                      backgroundColor: themeColors.surface.primary,
                      borderRadius: `${foundations.radius.sm}px`,
                      padding: `${foundations.grid.spacing.xs}px`,
                      boxShadow: theme === 'light' ? foundations.elevation.small : foundations.elevation.darkSmall
                    }}>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing(conversation);
                        }}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                  
                  {collapsed && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: activeConversationId === conversation.id 
                        ? themeColors.surface.accent 
                        : themeColors.text.quaternary
                    }} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </NavGroup>
    );
  };

  return (
    <div style={sidebarStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: !collapsed ? `${foundations.grid.spacing.md}px` : '0'
        }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
          >
            <Menu size={20} />
          </Button>
          
          {!collapsed && (
            <div 
              style={brandStyles}
              onClick={() => window.location.reload()}
            >
              <div style={logoStyles}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
              </div>
              <Typography variant="subtitle2" color="primary" noMargin>
                CelesteOS
              </Typography>
              <ChevronRight size={14} className="text-gray-400 ml-auto" />
            </div>
          )}
        </div>

        {/* New Chat Button */}
        {!collapsed && (
          <Button
            onClick={onNewChat}
            variant="outlined"
            fullWidth
            leftIcon={<Plus size={16} />}
          >
            New Chat
          </Button>
        )}
      </div>

      {/* Navigation */}
      {!collapsed && (
        <div style={{ padding: `0 ${foundations.grid.spacing.lg}px` }}>
          <NavGroup>
            <NavItem icon={<MessageSquare size={16} />} active>
              CelesteOS
            </NavItem>
            <NavItem icon={<div style={{ width: '16px', height: '16px', backgroundColor: '#00d4aa', borderRadius: '50%' }} />}>
              Maritime AI
            </NavItem>
            <NavItem icon={<Sparkles size={16} />}>
              Explore Tools
            </NavItem>
          </NavGroup>
        </div>
      )}

      {/* Conversations */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: `${foundations.grid.spacing.md}px ${foundations.grid.spacing.lg}px` 
      }}>
        {!collapsed && (
          <>
            {renderConversationGroup('Today', conversationGroups.today)}
            {renderConversationGroup('Yesterday', conversationGroups.yesterday)}
            {renderConversationGroup('Previous 7 days', conversationGroups.thisWeek)}
            {renderConversationGroup('Previous 30 days', conversationGroups.thisMonth)}
            {renderConversationGroup('Older', conversationGroups.older)}
          </>
        )}
        
        {collapsed && conversations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${foundations.grid.spacing.xs}px` }}>
            {conversations.slice(0, 10).map((conversation) => (
              <button
                key={conversation.id}
                style={getConversationItemStyles(conversation.id)}
                onClick={() => onSelectConversation(conversation.id)}
                title={conversation.title}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: activeConversationId === conversation.id 
                    ? themeColors.surface.accent 
                    : themeColors.text.quaternary
                }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: `${foundations.grid.spacing.lg}px`,
        borderTop: `1px solid ${themeColors.border.subtle}`,
        flexShrink: 0
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${foundations.grid.spacing.sm}px` }}>
            {/* Upgrade Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${foundations.grid.spacing.md}px`,
              padding: `${foundations.grid.spacing.sm}px`,
              backgroundColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: `${foundations.radius.md}px`,
              cursor: 'pointer'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>★</span>
              </div>
              <div style={{ flex: 1 }}>
                <Typography variant="caption" color="primary" weight="medium" noMargin>
                  Upgrade plan
                </Typography>
                <Typography variant="caption" color="tertiary" noMargin style={{ fontSize: '11px' }}>
                  More access to the best models
                </Typography>
              </div>
            </div>

            {/* User Profile */}
            <Button
              variant="ghost"
              onClick={onShowSettings}
              style={{
                justifyContent: 'flex-start',
                gap: `${foundations.grid.spacing.md}px`,
                padding: `${foundations.grid.spacing.sm}px`
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: themeColors.surface.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={12} />
              </div>
              <Text truncate>
                {currentUser?.display_name || 'Chief Engineer'}
              </Text>
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${foundations.grid.spacing.sm}px`, alignItems: 'center' }}>
            <Button variant="ghost" size="icon">
              <Sparkles size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onShowSettings}>
              <User size={20} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}