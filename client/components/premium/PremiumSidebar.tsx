import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  PlusCircle,
  MessageSquare,
  Search,
  Archive,
  Star,
  Trash2,
  Edit,
  MoreVertical,
  History,
  Anchor,
  HelpCircle,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  Shield
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

interface Conversation {
  id: string;
  chatId: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: any[];
  category?: string;
  isArchived?: boolean;
  isPinned?: boolean;
}

interface User {
  id: string;
  name: string;
  displayName?: string;
  avatar?: string;
  email?: string;
  role?: string;
}

interface PremiumSidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onConversationRename: (id: string, newTitle: string) => void;
  onConversationArchive: (id: string) => void;
  onConversationDelete: (id: string) => void;
  onSettingsOpen: () => void;
  isCollapsed?: boolean;
  isDarkMode: boolean;
}

const PremiumSidebar: React.FC<PremiumSidebarProps> = ({
  conversations,
  activeConversation,
  user,
  searchQuery,
  onSearchChange,
  onConversationSelect,
  onNewConversation,
  onConversationRename,
  onConversationArchive,
  onConversationDelete,
  onSettingsOpen,
  isCollapsed = false,
  isDarkMode
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'starred' | 'recent'>('all');

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (conv.isArchived) return false;
    if (searchQuery && !conv.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterBy === 'starred' && !conv.isPinned) return false;
    if (filterBy === 'recent') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return conv.timestamp > oneWeekAgo;
    }
    return true;
  });

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      thisWeek: [] as Conversation[],
      older: [] as Conversation[]
    };

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.timestamp);
      if (convDate.toDateString() === today.toDateString()) {
        groups.today.push(conv);
      } else if (convDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(conv);
      } else if (convDate > thisWeek) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  }, [filteredConversations]);

  const handleConversationSelect = (conversation: Conversation) => {
    onConversationSelect(conversation);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'maritime': return Anchor;
      case 'technical': return Shield;
      default: return MessageSquare;
    }
  };

  const ConversationGroup = ({ title, conversations, delay = 0 }: { 
    title: string; 
    conversations: Conversation[];
    delay?: number;
  }) => {
    if (conversations.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1 }}
        className="space-y-1"
      >
        {!isCollapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {title}
            </p>
          </div>
        )}
        
        <div className="space-y-1">
          {conversations.map((conv, index) => {
            const CategoryIcon = getCategoryIcon(conv.category);
            const isActive = activeConversation?.id === conv.id;
            
            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (delay + index) * 0.05 }}
                className="relative group"
              >
                <Button
                  variant="ghost"
                  onClick={() => handleConversationSelect(conv)}
                  className={cn(
                    "w-full justify-start rounded-xl p-3 h-auto transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 shadow-lg"
                      : "hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon */}
                    <div className={cn(
                      "p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                    )}>
                      <CategoryIcon size={16} />
                    </div>

                    {/* Content */}
                    {!isCollapsed && (
                      <div className="min-w-0 flex-1 text-left">
                        <p className={cn(
                          "font-medium text-sm truncate mb-1",
                          isActive
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          {conv.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.lastMessage || 'No messages'}
                        </p>
                      </div>
                    )}

                    {/* Status indicators */}
                    {!isCollapsed && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {new Date(conv.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {conv.isPinned && (
                          <Star size={12} className="text-yellow-500 fill-current" />
                        )}
                      </div>
                    )}
                  </div>
                </Button>

                {/* Context Menu */}
                {!isCollapsed && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const newTitle = prompt('Enter new conversation title:', conv.title);
                        if (newTitle && newTitle.trim() !== conv.title) {
                          onConversationRename(conv.id, newTitle.trim());
                        }
                      }}>
                        <Edit size={14} className="mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onConversationArchive(conv.id)}>
                        <Archive size={14} className="mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this conversation?')) {
                            onConversationDelete(conv.id);
                          }
                        }}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      className={cn(
        "h-full flex flex-col bg-gradient-to-b from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50",
        "backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-700/20",
        "transition-all duration-300 ease-out",
        isCollapsed ? "w-16" : "w-80"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {/* Header */}
      <div className="p-4 space-y-4">
        {/* Logo & Title */}
        <motion.div 
          className="flex items-center gap-3"
          animate={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1, rotateY: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg">
              <div className="h-full w-full rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center">
                <img 
                  src={isDarkMode ? "/logo_w.png" : "/Logo.png"} 
                  alt="CelesteOS" 
                  className="h-6 w-6 object-contain"
                />
              </div>
            </div>
            {/* Connection indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
          </motion.div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="font-bold text-lg">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Celeste
                  </span>
                  <span className="text-gray-900 dark:text-white">OS</span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Yacht Engineering Intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* New Chat Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onNewConversation}
            className={cn(
              "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300",
              "rounded-xl",
              isCollapsed ? "p-3" : "justify-start gap-2 p-3"
            )}
          >
            <PlusCircle size={18} />
            {!isCollapsed && <span>New Chat</span>}
          </Button>
        </motion.div>

        {/* Search Bar */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                searchFocused ? "text-blue-500" : "text-gray-400"
              )} />
              <Input
                placeholder="Search conversations..."
                className={cn(
                  "pl-10 rounded-xl border-gray-200/50 dark:border-gray-700/50",
                  "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                  "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  "transition-all duration-200"
                )}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tabs */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-1"
            >
              {[
                { key: 'all', label: 'All', icon: MessageSquare },
                { key: 'starred', label: 'Starred', icon: Star },
                { key: 'recent', label: 'Recent', icon: Clock }
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={filterBy === filter.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterBy(filter.key as any)}
                  className={cn(
                    "flex-1 rounded-lg text-xs",
                    filterBy === filter.key
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  <filter.icon size={12} className="mr-1" />
                  {filter.label}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="opacity-50" />

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          <ConversationGroup title="Today" conversations={groupedConversations.today} delay={0} />
          <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} delay={1} />
          <ConversationGroup title="This Week" conversations={groupedConversations.thisWeek} delay={2} />
          <ConversationGroup title="Older" conversations={groupedConversations.older} delay={3} />
          
          {filteredConversations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              {!isCollapsed && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/20 dark:border-gray-700/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full rounded-xl transition-all duration-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                isCollapsed ? "p-3" : "justify-start p-3"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 text-left flex-1 overflow-hidden"
                  >
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.role || 'Crew Member'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!isCollapsed && (
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              )}
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon size={14} className="mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSettingsOpen}>
              <Settings size={14} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle size={14} className="mr-2" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut size={14} className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default PremiumSidebar;