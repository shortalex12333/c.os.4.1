import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Mail, 
  Clock, 
  Menu,
  Search,
  Bell,
  Shield,
  Zap,
  Activity,
  Sun,
  Moon,
  Signal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface PremiumHeaderProps {
  conversationTitle?: string;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  onSettingsOpen: () => void;
  onEmailSearch: () => void;
  onDaySummary: () => void;
  isMobile?: boolean;
  connectionStatus?: 'online' | 'offline' | 'connecting';
  unreadNotifications?: number;
}

const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  conversationTitle = 'New Conversation',
  isDarkMode,
  setIsDarkMode,
  onSettingsOpen,
  onEmailSearch,
  onDaySummary,
  isMobile = false,
  connectionStatus = 'online',
  unreadNotifications = 0
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Connection status styling
  const getConnectionStyle = () => {
    switch (connectionStatus) {
      case 'online':
        return { color: 'bg-emerald-500', label: 'Systems Online', icon: Shield };
      case 'offline':
        return { color: 'bg-red-500', label: 'Systems Offline', icon: Signal };
      case 'connecting':
        return { color: 'bg-amber-500', label: 'Connecting...', icon: Activity };
      default:
        return { color: 'bg-gray-500', label: 'Unknown', icon: Signal };
    }
  };

  const connectionStyle = getConnectionStyle();
  const ConnectionIcon = connectionStyle.icon;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-50"
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
    >
      {/* Premium Glass Header */}
      <div className="premium-card m-0 rounded-none border-l-0 border-r-0 border-t-0">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Trigger */}
              {isMobile && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SidebarTrigger />
                </motion.div>
              )}

              {/* Logo & Title */}
              <motion.div 
                className="flex items-center gap-4"
                animate={{ x: isHeaderHovered ? 4 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Animated Logo */}
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
                  {connectionStatus === 'online' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                  )}
                </motion.div>

                <div className="space-y-1">
                  <motion.h1 
                    className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                    layoutId="conversation-title"
                  >
                    {conversationTitle}
                  </motion.h1>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {/* Connection Status */}
                    <div className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", connectionStyle.color)} />
                      <span className="font-medium">{connectionStyle.label}</span>
                    </div>
                    
                    {/* Current Time */}
                    <span className="font-mono">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Premium Action Buttons */}
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                {/* Email Search Button */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEmailSearch}
                    className="relative group overflow-hidden bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border-0 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-2 text-sm font-medium">
                      <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                      {!isMobile && (
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                          Email Search
                        </span>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>

                {/* Day Summary Button */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDaySummary}
                    className="relative group overflow-hidden bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-0 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-2 text-sm font-medium">
                      <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                      {!isMobile && (
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                          Day Summary
                        </span>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Notifications */}
              {unreadNotifications > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell size={18} className="text-gray-600 dark:text-gray-400" />
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Badge>
                  </Button>
                </motion.div>
              )}

              {/* Theme Toggle */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 dark:from-blue-500/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <AnimatePresence mode="wait">
                    {isDarkMode ? (
                      <motion.div
                        key="dark"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon size={18} className="text-blue-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="light"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun size={18} className="text-yellow-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Settings */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettingsOpen}
                  className="relative overflow-hidden group"
                >
                  <Settings size={18} className="text-gray-600 dark:text-gray-400 transition-transform duration-300 group-hover:rotate-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Premium bottom border with animated gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        
        {/* Hover effect overlay */}
        <AnimatePresence>
          {isHeaderHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default PremiumHeader;