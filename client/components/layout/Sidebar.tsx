import React, { useState, useRef, useEffect } from 'react';
import styles from './SidebarGlass.module.css';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { Plus, MessageSquare, Settings, User, ChevronLeft, ChevronRight, Folder, ChevronDown, ChevronRight as ChevronRightSmall, MoreHorizontal, Ship, Mail, Search, Edit3, Check, X, FolderPlus, ClipboardList, Eye, Trash2, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { chatService, type ChatSessionSummary } from '../../services/chatService';
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getFolderTemplatesForRole, detectUserRole } from '../../constants/folderTemplates';
import { useAuth } from '../../contexts/AuthContext';
import { ViewHandoverModal } from '../ViewHandoverModal';
import { CustomHandoverModal } from '../CustomHandoverModal';
import { deleteHandover } from '../../services/handoverService';
// Use local logo instead of figma:asset
const brainLogo = '/Logo.png';

// Draggable Chat Item Component for @dnd-kit
interface DraggableChatItemProps {
  chat: ChatSessionSummary;
  currentSessionId: string | null;
  editingChat: string | null;
  editingChatName: string;
  chatsByFolder: Record<string, ChatSessionSummary[]>;
  isDragging?: boolean;
  onChatSelect?: (sessionId: string) => void;
  onEditStart: (chatId: string, currentName: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditNameChange: (name: string) => void;
  onMoveToFolder: (chatId: string, targetFolder: string) => void;
  onArchive: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
}

function DraggableChatItem({
  chat,
  currentSessionId,
  editingChat,
  editingChatName,
  chatsByFolder,
  isDragging,
  onChatSelect,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditNameChange,
  onMoveToFolder,
  onArchive,
  onDelete,
  isMobile,
  onMobileMenuClose
}: DraggableChatItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: chat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group chat_history_item ${
        isSortableDragging ? 'bg-white/10' : ''
      }`}
    >
      <div
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer ${
          currentSessionId === chat.id ? 'bg-white/20' : ''
        }`}
        onClick={() => {
          if (onChatSelect) {
            onChatSelect(chat.id);
            if (isMobile && onMobileMenuClose) {
              onMobileMenuClose();
            }
          }
        }}
      >
        <MessageSquare className="w-4 h-4 text-white/88 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {editingChat === chat.id ? (
            <div className="flex items-center gap-1 chat_name_editor" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editingChatName}
                onChange={(e) => onEditNameChange(e.target.value)}
                className="flex-1 px-1 py-0.5 text-sm bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 chat_name_input text-white placeholder-white/60"
                style={{
                  fontSize: '13px',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave();
                  if (e.key === 'Escape') onEditCancel();
                }}
              />
              <button
                onClick={onEditSave}
                className="p-0.5 text-white/90 hover:bg-white/10 rounded"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={onEditCancel}
                className="p-0.5 text-white/90 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-sm truncate" style={{
              fontSize: '13px',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: '#ffffff'
            }}>
              {chat.title}
            </div>
          )}
        </div>

        {/* Chat Actions Menu */}
        {editingChat !== chat.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 p-1 text-white/60 hover:text-white/80 rounded transition-all duration-200 chat_actions_trigger"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 chat_actions_menu">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEditStart(chat.id, chat.title);
                }}
                className="text-sm rename_chat_action"
              >
                <Edit3 className="w-3 h-3 mr-2" />
                Rename
              </DropdownMenuItem>

              {/* Move to Folder Submenu */}
              {Object.keys(chatsByFolder).length > 0 && (
                <DropdownMenuItem
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm relative group/submenu"
                >
                  <FolderPlus className="w-3 h-3 mr-2" />
                  <span>Move to Folder</span>
                  <ChevronRight className="w-3 h-3 ml-auto" />

                  {/* Submenu */}
                  <div className="absolute left-full top-0 ml-1 hidden group-hover/submenu:block z-50">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[120px]">
                      {Object.keys(chatsByFolder).map(targetFolder => (
                        <button
                          key={targetFolder}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(chat.id, targetFolder);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          {targetFolder}
                        </button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(chat.id);
                }}
                className="text-sm archive_chat_action"
              >
                <Folder className="w-3 h-3 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
                className="text-sm delete_chat_action text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Droppable Folder Container for @dnd-kit
interface DroppableFolderProps {
  folderId: string;
  children: React.ReactNode;
  isOver?: boolean;
}

function DroppableFolder({ folderId, children }: DroppableFolderProps) {
  const { setNodeRef, isOver } = useDroppable({ id: folderId });

  return (
    <div
      ref={setNodeRef}
      className={`ml-4 space-y-1 min-h-[20px] rounded p-1 ${
        isOver ? 'bg-white/5' : ''
      }`}
    >
      {children}
    </div>
  );
}

interface SidebarProps {
  onNewChat: (searchStrategy?: 'nas' | 'yacht' | 'email') => void;
  onOpenSettings: () => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  onMobileMenuClose: () => void;
  displayName: string;
  isChatMode: boolean;
  isDarkMode?: boolean;
  onSearchTypeChange?: (searchType: 'yacht' | 'email' | 'sop') => void;
  selectedSearchType?: 'yacht' | 'email' | 'sop';
  // Mobile drawer props
  isDrawerOpen?: boolean;
  // Chat selection props
  onChatSelect?: (sessionId: string) => void;
  currentSessionId?: string | null;
  // SOP Creation props
  onShowSopCreation?: () => void;
  currentView?: 'chat' | 'sop' | null;
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
  selectedSearchType = 'yacht',
  isDrawerOpen = false,
  onChatSelect,
  currentSessionId,
  onShowSopCreation,
  currentView = null
}: SidebarProps) {
  // Body scroll lock for mobile drawer
  useBodyScrollLock(isMobile && isDrawerOpen);

  // Focus trap for mobile drawer
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobile || !isDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onMobileMenuClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element in drawer
    const drawer = drawerRef.current;
    if (drawer) {
      const focusable = drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      focusable?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile, isDrawerOpen, onMobileMenuClose]);
  const [searchType, setSearchType] = useState<'chat' | 'yacht' | 'email'>('chat');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['General', 'Equipment Issues', 'Navigation & Weather', 'Engine Systems', 'Guest Services']));
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [chatsByFolder, setChatsByFolder] = useState<Record<string, ChatSessionSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [userFolders, setUserFolders] = useState<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { user } = useAuth();
  const [showViewHandover, setShowViewHandover] = useState(false);
  const [showAddHandover, setShowAddHandover] = useState(false);

  // Setup drag sensors for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      const sessions = await chatService.getChatSessions();
      const grouped = await chatService.getChatSessionsByFolder();
      const folders = await chatService.getUserFolders();

      setChatSessions(sessions);
      setChatsByFolder(grouped);
      setUserFolders(folders);

      // Initialize folders for new users
      if (folders.length === 0 && user?.email) {
        const userRole = detectUserRole(user.email);
        const templates = getFolderTemplatesForRole(userRole);

        // Create a few initial chats in template folders to demonstrate the feature
        for (const folderName of templates.slice(0, 2)) { // Just first 2 folders
          try {
            await chatService.createChatSession(`Welcome to ${folderName}`, 'yacht', folderName);
          } catch (error) {
            console.warn('Failed to create template folder:', error);
          }
        }

        // Reload after creating templates - only once
        await loadChatSessions();
        return;
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      // Fallback to empty state instead of crashing
      setChatSessions([]);
      setChatsByFolder({});
      setUserFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // Folder management functions
  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      // Create a welcome chat in the new folder
      await chatService.createChatSession(`Welcome to ${newFolderName}`, 'yacht', newFolderName.trim());
      await loadChatSessions();
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const chatId = active.id as string;

    // Determine the target container (folder)
    // If dropped on a droppable container, use over.id
    // If dropped on a sortable item, use the item's container
    let targetContainerId: string | null = null;

    if (over.data.current?.sortable?.containerId) {
      // Dropped on a sortable item - use its container
      targetContainerId = over.data.current.sortable.containerId as string;
    } else {
      // Dropped directly on a droppable container
      targetContainerId = over.id as string;
    }

    // Get the source container
    const sourceContainerId = active.data.current?.sortable?.containerId as string;

    // If dropped in same folder, do nothing
    if (sourceContainerId === targetContainerId) return;

    // Convert 'unfoldered' to null for the database
    const targetFolder = targetContainerId === 'unfoldered' ? null : targetContainerId;

    try {
      await chatService.moveChatToFolder(chatId, targetFolder);
      await loadChatSessions();
    } catch (error) {
      console.error('Failed to move chat to folder:', error);
    }
  };

  const handleNewChat = async (searchStrategy: 'nas' | 'yacht' | 'email' = 'nas') => {
    // Create new chat session in database
    const newSession = await chatService.createChatSession(
      'New Chat',
      searchStrategy === 'nas' ? 'yacht' : searchStrategy // Map 'nas' to 'yacht' for now
    );

    if (newSession) {
      // Reload sessions to show the new one
      await loadChatSessions();
    }
    onNewChat(searchStrategy);
    if (isMobile) {
      onMobileMenuClose();
    }
  };

  const handleSearchTypeSelect = (type: 'yacht' | 'email') => {
    // Update search type first
    setSearchType(type);
    if (onSearchTypeChange) {
      onSearchTypeChange(type);
    }

    // Then create new chat instance with specific search strategy
    handleNewChat(type);
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

  const saveEditingChat = async () => {
    if (editingChat && editingChatName.trim()) {
      const success = await chatService.updateSessionTitle(editingChat, editingChatName.trim());
      if (success) {
        await loadChatSessions(); // Reload to show updated title
      }
    }
    setEditingChat(null);
    setEditingChatName('');
  };

  const cancelEditingChat = () => {
    setEditingChat(null);
    setEditingChatName('');
  };

  const deleteChat = async (chatId: string) => {
    console.log('🗑️  Sidebar: Deleting chat with ID:', chatId);
    const success = await chatService.deleteSession(chatId);
    console.log('🗑️  Sidebar: Delete result:', success);

    if (success) {
      console.log('✅ Sidebar: Delete successful, reloading chat sessions...');
      await loadChatSessions(); // Reload to remove deleted chat
      console.log('✅ Sidebar: Chat sessions reloaded');
    } else {
      console.error('❌ Sidebar: Failed to delete chat');
    }
  };

  const archiveChat = async (chatId: string) => {
    try {
      const success = await chatService.archiveSession(chatId);
      if (success) {
        await loadChatSessions(); // Reload to remove archived chat from view
      }
    } catch (error) {
      console.error('Failed to archive chat:', error);
    }
  };

  const moveToFolder = async (chatId: string, targetFolder: string) => {
    try {
      await chatService.moveChatToFolder(chatId, targetFolder === 'none' ? null : targetFolder);
      await loadChatSessions();
    } catch (error) {
      console.error('Failed to move chat to folder:', error);
    }
  };

  // Folder management functions
  const startEditingFolder = (folderName: string) => {
    setEditingFolder(folderName);
    setEditingFolderName(folderName);
  };

  const saveEditingFolder = async () => {
    if (editingFolder && editingFolderName.trim() && editingFolderName !== editingFolder) {
      const success = await chatService.renameFolder(editingFolder, editingFolderName.trim());
      if (success) {
        await loadChatSessions();
      }
    }
    setEditingFolder(null);
    setEditingFolderName('');
  };

  const cancelEditingFolder = () => {
    setEditingFolder(null);
    setEditingFolderName('');
  };

  const deleteFolder = async (folderName: string) => {
    // Confirm deletion
    if (!window.confirm(`Delete folder "${folderName}" and all its conversations?`)) {
      return;
    }

    try {
      const success = await chatService.deleteFolderChats(folderName);
      if (success) {
        await loadChatSessions();
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleDeleteHandover = async (handoverId: string) => {
    const response = await deleteHandover(handoverId);
    if (!response.success) {
      console.error('Failed to delete handover:', response.error);
    }
  };

  // Determine sidebar background and styling based on chat mode and theme
  const getSidebarStyles = () => {
    console.log('Sidebar state:', { isDarkMode, isChatMode });
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
        // Light homepage: Precise glassmorphism with gradient and scrim
        return {
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.12) 60%, rgba(255, 255, 255, 0.10) 100%) !important',
          backdropFilter: 'blur(28px) saturate(1.4) !important',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4) !important',
          borderRight: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.28)',
          borderRadius: '0 20px 20px 0',
          position: 'relative'
        };
      }
    }
  };

  // Mobile drawer with scrim
  if (isMobile) {
    return (
      <React.Fragment>
        {/* Scrim */}
        <div
          id="drawer-scrim"
          className={`fixed inset-0 z-30 bg-black/30 transition-opacity duration-200 ${
            isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onMobileMenuClose}
        />

        {/* Mobile Drawer */}
        <aside
          ref={drawerRef}
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`${styles.celSidebar} fixed left-0 top-0 z-40 flex h-[100dvh] w-[80vw] max-w-[320px] flex-col rounded-r-2xl backdrop-blur-[18px] bg-white/10 dark:bg-neutral-900/80 border-r border-white/12 dark:border-white/10 px-4 py-4 transition-transform duration-200 ease-out overflow-hidden ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-[-100%]'
          }`}
        >
      {/* Luminance scrim for readability */}
      <div className="pointer-events-none absolute inset-0 rounded-r-2xl bg-gradient-to-b from-black/10 to-black/6" />
      
      {/* Noise overlay for frosted glass texture */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-r-2xl opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px'
        }}
      />
      
      {/* Content wrapper */}
      <div className="relative flex flex-col h-full overflow-hidden" style={{ zIndex: 3 }}>
        {/* Header Section */}
      <div
        className="flex flex-col flex-shrink-0 sidebar_header"
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
              className="p-1.5 rounded-lg text-white hover:text-white hover:bg-white/10 transition-all duration-200 sidebar_collapse_toggle"
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
              fontWeight: '600',
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
                  fontWeight: '600',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff'
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
                      ? '#0A84FF' 
                      : 'rgba(255, 255, 255, 0.88)' 
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
                  fontWeight: '600',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff'
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
                      ? '#0A84FF'
                      : 'rgba(255, 255, 255, 0.88)'
                  }}
                />
                {!isCollapsed && "Email Search"}
              </button>

              {/* SOP Creation Button - UPDATED */}
              {console.log('🔍🔍🔍 SOP BUTTON RENDERING NOW, onShowSopCreation:', typeof onShowSopCreation)}
              <button
                onClick={() => {
                  console.log('✅ SOP Creation button clicked!');
                  if (onShowSopCreation) {
                    onShowSopCreation();
                    if (isMobile && onMobileMenuClose) {
                      onMobileMenuClose();
                    }
                  }
                }}
                className={`flex items-center gap-3 w-full p-3 transition-all duration-200 sop_creation_button`}
                style={{
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff'
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
                <FileText
                  className="w-4 h-4"
                  style={{
                    color: currentView === 'sop'
                      ? '#0A84FF'
                      : 'rgba(255, 255, 255, 0.88)'
                  }}
                />
                {!isCollapsed && "SOP Creation"}
              </button>

            </div>
          )}
        </div>
      </div>

      {/* Chat History Section - Binds to: response.chat_history[] */}
      <div className="flex-1 min-h-0 overflow-hidden chat_history_container">
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
                color: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <span>Recent Conversations</span>
              {/* Binds to: response.chat_history.length */}
              <span className="chat_count_display">{chatSessions.length}</span>
            </div>

            {/* Chat History Items - Binds to: response.chat_history[] */}
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/30"></div>
              </div>
            )}

            {/* Chat History Items - Now using real data */}
            {!loading && chatSessions.map((chat, index) => (
              <div key={chat.id} className="relative group chat_history_item">
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer ${
                    currentSessionId === chat.id ? 'bg-white/20' : ''
                  }`}
                  onClick={() => {
                    if (onChatSelect) {
                      onChatSelect(chat.id);
                      if (isMobile) {
                        onMobileMenuClose();
                      }
                    }
                  }}>
                  {/* Chat Icon */}
                  <MessageSquare className="w-4 h-4 text-white/88 flex-shrink-0" />
                  
                  {/* Chat Content */}
                  <div className="flex-1 min-w-0">
                    {editingChat === chat.id ? (
                      /* Edit Chat Name - Binds to: metadata.chat_rename */
                      <div className="flex items-center gap-1 chat_name_editor">
                        <input
                          type="text"
                          value={editingChatName}
                          onChange={(e) => setEditingChatName(e.target.value)}
                          className="flex-1 px-1 py-0.5 text-sm bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 chat_name_input text-white placeholder-white/60"
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
                          className="p-0.5 text-white/90 hover:bg-white/10 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditingChat}
                          className="p-0.5 text-white/90 hover:bg-white/10 rounded"
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
                            color: '#ffffff'
                          }}
                        >
                          {chat.title}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Actions */}
                  {editingChat !== chat.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/60 hover:text-white/80 rounded transition-all duration-200 chat_actions_trigger"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 chat_actions_menu">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingChat(chat.id, chat.title);
                          }}
                          className="text-sm rename_chat_action"
                        >
                          <Edit3 className="w-3 h-3 mr-2" />
                          Rename
                        </DropdownMenuItem>

                        {/* Move to Folder Submenu */}
                        {Object.keys(chatsByFolder).length > 0 && (
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm relative group/submenu"
                          >
                            <FolderPlus className="w-3 h-3 mr-2" />
                            <span>Move to Folder</span>
                            <ChevronRight className="w-3 h-3 ml-auto" />

                            {/* Submenu */}
                            <div className="absolute left-full top-0 ml-1 hidden group-hover/submenu:block z-50">
                              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[120px]">
                                {Object.keys(chatsByFolder).map(targetFolder => (
                                  <button
                                    key={targetFolder}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveToFolder(chat.id, targetFolder);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                  >
                                    {targetFolder}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveChat(chat.id);
                          }}
                          className="text-sm archive_chat_action"
                        >
                          <Folder className="w-3 h-3 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="text-sm delete_chat_action text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3 mr-2" />
                          Delete
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
        className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-700 sidebar_footer"
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
                  {(displayName || 'User')
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
                  color: '#ffffff'
                }}
              >
                {displayName}
              </span>
            </div>

            {/* View My Handover Button */}
            <button
              onClick={() => {
                setShowViewHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 view_handover_button"
              title="View My Handover"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Add to Handover Button */}
            <button
              onClick={() => {
                setShowAddHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 add_handover_button"
              title="Add to Handover"
            >
              <ClipboardList className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                onOpenSettings();
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 settings_button"
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
                {(displayName || 'User')
                  .split(' ')
                  .map(name => name[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>

            {/* View My Handover Button (Collapsed) */}
            <button
              onClick={() => {
                setShowViewHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 view_handover_button_collapsed"
              title="View My Handover"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Add to Handover Button (Collapsed) */}
            <button
              onClick={() => {
                setShowAddHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 add_handover_button_collapsed"
              title="Add to Handover"
            >
              <ClipboardList className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onOpenSettings();
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 settings_button_collapsed"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
        </div>
        </div> {/* Close content wrapper */}
        </aside>

        {/* Handover Modals - Rendered outside sidebar */}
        <ViewHandoverModal
          isOpen={showViewHandover}
          onClose={() => setShowViewHandover(false)}
          userId={user?.userId || user?.user_id || 'guest'}
          yachtId="default"
          isDarkMode={isDarkMode}
          onDelete={handleDeleteHandover}
        />

        <CustomHandoverModal
          isOpen={showAddHandover}
          onClose={() => setShowAddHandover(false)}
          userId={user?.userId || user?.user_id || 'guest'}
          yachtId="default"
          isDarkMode={isDarkMode}
        />
      </React.Fragment>
    );
  }

  // Desktop/Wide iPad (≥lg): collapsible rail
  return (
    <>
    <aside
      aria-label="Navigation"
      aria-expanded={!isCollapsed}
      className={`${styles.celSidebar} hidden lg:block h-screen sticky top-0 z-20 flex flex-col transition-all duration-200 ${
        isCollapsed
          ? 'w-0 opacity-0 pointer-events-none'
          : 'w-[280px] rounded-r-2xl backdrop-blur-[28px] backdrop-saturate-[140%] bg-gradient-to-b from-white/16 via-white/12 to-white/10 dark:from-neutral-800/20 dark:via-neutral-900/30 dark:to-neutral-950/40 border-r border-white/20 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.28)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.6)] px-4 py-4'
      }`}
      style={{
        zIndex: 20
      }}
    >
      {/* Luminance scrim for readability */}
      <div className="pointer-events-none absolute inset-0 rounded-r-2xl bg-gradient-to-b from-black/10 to-black/6" />

      {/* Noise overlay for frosted glass texture */}
      <div
        className="pointer-events-none absolute inset-0 rounded-r-2xl opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px'
        }}
      />

      {/* Content wrapper */}
      <div className="relative flex flex-col h-full overflow-hidden" style={{ zIndex: 3 }}>
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
              className="p-1.5 rounded-lg text-white hover:text-white hover:bg-white/10 transition-all duration-200 sidebar_collapse_toggle"
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
              fontWeight: '600',
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
                  fontWeight: '600',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff'
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
                      ? '#0A84FF'
                      : 'rgba(255, 255, 255, 0.88)'
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
                  fontWeight: '600',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff'
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
                      ? '#0A84FF'
                      : 'rgba(255, 255, 255, 0.88)'
                  }}
                />
                {!isCollapsed && "Email Search"}
              </button>

              {/* SOP Creation Button - Desktop */}
              <button
                onClick={() => {
                  console.log('✅ SOP Creation button clicked (desktop)');
                  if (onShowSopCreation) {
                    onShowSopCreation();
                  }
                }}
                className={`flex items-center gap-3 w-full p-3 transition-all duration-200 sop_creation_button`}
                style={{
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff'
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
                <FileText
                  className="w-4 h-4"
                  style={{
                    color: currentView === 'sop'
                      ? '#0A84FF'
                      : 'rgba(255, 255, 255, 0.88)'
                  }}
                />
                {!isCollapsed && "SOP Creation"}
              </button>

            </div>
          )}
        </div>
      </div>

      {/* Chat History Section with Folders */}
      <div className="flex-1 min-h-0 overflow-hidden chat_history_container">
        {!isCollapsed && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-1 chat_history_list" style={{ padding: '0 16px' }}>
              {/* Chat History Header */}
              <div className="flex items-center justify-between px-2 py-2 text-sm chat_history_header"
                style={{
                  fontSize: '12px',
                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <span>Conversations</span>
                <div className="flex items-center gap-2">
                  <span className="chat_count_display">{chatSessions.length}</span>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Create Folder"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Create Folder Input */}
              {showCreateFolder && (
                <div className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      className="flex-1 px-2 py-1 text-sm bg-white/20 border border-white/30 rounded focus:outline-none text-white placeholder-white/60"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') createFolder();
                        if (e.key === 'Escape') { setShowCreateFolder(false); setNewFolderName(''); }
                      }}
                    />
                    <button onClick={createFolder} className="p-1 text-white/90 hover:bg-white/10 rounded">
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                      className="p-1 text-white/90 hover:bg-white/10 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/30"></div>
                </div>
              )}

              {/* Folders and Chats */}
              {!loading && (
                <div className="space-y-2">
                  {/* Render each folder */}
                  {Object.entries(chatsByFolder).map(([folderName, chats]) => (
                    <div key={folderName} className="folder-section">
                      {/* Folder Header */}
                      <div className="relative group folder-header">
                        <div
                          className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-white/5 rounded"
                          onClick={(e) => {
                            // Don't toggle if editing or clicking menu
                            if (editingFolder === folderName) {
                              e.stopPropagation();
                              return;
                            }
                            toggleFolder(folderName);
                          }}
                        >
                          {expandedFolders.has(folderName) ? (
                            <ChevronDown className="w-3 h-3 text-white/60 flex-shrink-0" />
                          ) : (
                            <ChevronRightSmall className="w-3 h-3 text-white/60 flex-shrink-0" />
                          )}
                          <Folder className="w-4 h-4 text-white/60 flex-shrink-0" />

                          {/* Folder Name or Edit Input */}
                          {editingFolder === folderName ? (
                            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                className="flex-1 px-1 py-0.5 text-sm bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/60"
                                style={{
                                  fontSize: '13px',
                                  fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  fontWeight: '600'
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingFolder();
                                  if (e.key === 'Escape') cancelEditingFolder();
                                }}
                              />
                              <button
                                onClick={saveEditingFolder}
                                className="p-0.5 text-white/90 hover:bg-white/10 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelEditingFolder}
                                className="p-0.5 text-white/90 hover:bg-white/10 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-white/80 flex-1" style={{
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontWeight: '600'
                            }}>
                              {folderName}
                            </span>
                          )}

                          <span className="text-xs text-white/50">{chats.length}</span>

                          {/* Folder Actions Menu - Only show for non-General folders */}
                          {folderName !== 'General' && editingFolder !== folderName && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="opacity-0 group-hover:opacity-100 p-1 text-white/60 hover:text-white/80 rounded transition-all duration-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="w-3 h-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingFolder(folderName);
                                  }}
                                  className="text-sm"
                                >
                                  <Edit3 className="w-3 h-3 mr-2" />
                                  Rename Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFolder(folderName);
                                  }}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* Folder Contents */}
                      {expandedFolders.has(folderName) && (
                        <DroppableFolder folderId={folderName}>
                          <SortableContext items={chats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {chats.map((chat) => (
                              <DraggableChatItem
                                key={chat.id}
                                chat={chat}
                                currentSessionId={currentSessionId}
                                editingChat={editingChat}
                                editingChatName={editingChatName}
                                chatsByFolder={chatsByFolder}
                                onChatSelect={onChatSelect}
                                onEditStart={startEditingChat}
                                onEditSave={saveEditingChat}
                                onEditCancel={cancelEditingChat}
                                onEditNameChange={setEditingChatName}
                                onMoveToFolder={moveToFolder}
                                onArchive={archiveChat}
                                onDelete={deleteChat}
                                isMobile={isMobile}
                                onMobileMenuClose={onMobileMenuClose}
                              />
                            ))}
                          </SortableContext>
                        </DroppableFolder>
                      )}
                    </div>
                  ))}

                  {/* Unfoldered Chats */}
                  {chatsByFolder.General && (
                    <div>
                      <div className="text-xs text-white/50 px-2 py-1">Unorganized</div>
                      <DroppableFolder folderId="unfoldered">
                        <SortableContext items={chatsByFolder.General.map(c => c.id)} strategy={verticalListSortingStrategy}>
                          {chatsByFolder.General.map((chat) => (
                            <DraggableChatItem
                              key={chat.id}
                              chat={chat}
                              currentSessionId={currentSessionId}
                              editingChat={editingChat}
                              editingChatName={editingChatName}
                              chatsByFolder={chatsByFolder}
                              onChatSelect={onChatSelect}
                              onEditStart={startEditingChat}
                              onEditSave={saveEditingChat}
                              onEditCancel={cancelEditingChat}
                              onEditNameChange={setEditingChatName}
                              onMoveToFolder={moveToFolder}
                              onArchive={archiveChat}
                              onDelete={deleteChat}
                              isMobile={isMobile}
                              onMobileMenuClose={onMobileMenuClose}
                            />
                          ))}
                        </SortableContext>
                      </DroppableFolder>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DndContext>
        )}
      </div>

      {/* Footer Section - Binds to: metadata.user_id, response.system_info.user_profile */}
      <div
        className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-700 sidebar_footer"
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
                  {(displayName || 'User')
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
                  color: '#ffffff'
                }}
              >
                {displayName}
              </span>
            </div>

            {/* View My Handover Button */}
            <button
              onClick={() => {
                setShowViewHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 view_handover_button"
              title="View My Handover"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Add to Handover Button */}
            <button
              onClick={() => {
                setShowAddHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 add_handover_button"
              title="Add to Handover"
            >
              <ClipboardList className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                onOpenSettings();
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 settings_button"
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
                {(displayName || 'User')
                  .split(' ')
                  .map(name => name[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>

            {/* View My Handover Button (Collapsed) */}
            <button
              onClick={() => {
                setShowViewHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 view_handover_button_collapsed"
              title="View My Handover"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Add to Handover Button (Collapsed) */}
            <button
              onClick={() => {
                setShowAddHandover(true);
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 add_handover_button_collapsed"
              title="Add to Handover"
            >
              <ClipboardList className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onOpenSettings();
                if (isMobile) onMobileMenuClose();
              }}
              className="p-2 rounded-lg text-white/88 hover:text-white hover:bg-white/10 transition-all duration-200 settings_button_collapsed"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop Rail Collapse Button */}
        <div className="mt-4 flex justify-center">
          <button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className="hidden lg:flex w-9 h-9 items-center justify-center rounded-full backdrop-blur-[20px] backdrop-saturate-[140%] bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 hover:shadow-md hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-200 ease-in-out"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={`w-4 h-4 text-white transition-transform duration-200 ease-in-out ${
                isCollapsed ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
        </div>
      </div>
      </div>
    </aside>

    {/* Handover Modals - Rendered outside sidebar */}
    <ViewHandoverModal
      isOpen={showViewHandover}
      onClose={() => setShowViewHandover(false)}
      userId={user?.userId || user?.user_id || 'guest'}
      yachtId="default"
      isDarkMode={isDarkMode}
      onDelete={handleDeleteHandover}
    />

    <CustomHandoverModal
      isOpen={showAddHandover}
      onClose={() => setShowAddHandover(false)}
      userId={user?.userId || user?.user_id || 'guest'}
      yachtId="default"
      isDarkMode={isDarkMode}
    />
    </>
  );
}