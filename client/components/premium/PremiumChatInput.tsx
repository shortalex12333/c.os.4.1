import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  Mic, 
  MicOff,
  Smile,
  Zap,
  Command,
  Plus,
  X,
  Check,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PremiumChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  onFileUpload?: (files: FileList) => void;
  onVoiceToggle?: () => void;
  isVoiceActive?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

const PremiumChatInput: React.FC<PremiumChatInputProps> = ({
  value,
  onChange,
  onSend, 
  isLoading,
  placeholder = "Ask about yacht systems, diagnostics, or maintenance...",
  disabled = false,
  maxLength = 2000,
  onFileUpload,
  onVoiceToggle,
  isVoiceActive = false,
  suggestions = [],
  onSuggestionSelect
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputHeight, setInputHeight] = useState(48);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    onChange(textarea.value);
    
    // Auto-resize logic
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 120);
    textarea.style.height = `${newHeight}px`;
    setInputHeight(newHeight);
  }, [onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }

    // Command palette on Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSuggestions(!showSuggestions);
    }

    // Focus on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      textareaRef.current?.blur();
    }
  }, [value, onSend, isLoading, showSuggestions]);

  // Handle file uploads
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = Array.from(files);
      setAttachments(prev => [...prev, ...newAttachments]);
      
      if (onFileUpload) {
        onFileUpload(files);
      }
    }
  }, [onFileUpload]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  }, [onChange, onSuggestionSelect]);

  // Character count and status
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  // Quick suggestions for yacht operations
  const quickSuggestions = [
    "Check engine diagnostics",
    "Fuel system status report", 
    "Navigation equipment check",
    "Safety system inspection",
    "Maintenance schedule review",
    "Environmental compliance check"
  ];

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        className={cn(
          "relative premium-card p-6 m-0 rounded-none border-l-0 border-r-0 border-b-0",
          "bg-gradient-to-b from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5",
          "opacity-0 transition-opacity duration-700",
          (isFocused || isHovered) && "opacity-100"
        )} />

        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 space-y-2"
            >
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Attachments ({attachments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg px-3 py-2"
                  >
                    <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate max-w-32">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-blue-600 dark:text-blue-400 hover:text-red-500"
                      onClick={() => removeAttachment(index)}
                    >
                      <X size={12} />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Container */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Input Field with Premium Styling */}
            <div className={cn(
              "relative flex items-end gap-3 p-4 rounded-2xl transition-all duration-300",
              "glass border-2",
              isFocused 
                ? "border-blue-500/50 shadow-lg shadow-blue-500/10" 
                : "border-gray-200/50 dark:border-gray-700/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}>
              {/* Attachment Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mb-1 relative overflow-hidden group",
                      "text-gray-500 hover:text-blue-600 transition-colors"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                  >
                    <Paperclip size={18} />
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Attach files</p>
                </TooltipContent>
              </Tooltip>

              {/* Voice Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mb-1 relative overflow-hidden group",
                      isVoiceActive 
                        ? "text-red-500 bg-red-50 dark:bg-red-950/20" 
                        : "text-gray-500 hover:text-purple-600"
                    )}
                    onClick={onVoiceToggle}
                    disabled={disabled}
                  >
                    {isVoiceActive ? <MicOff size={18} /> : <Mic size={18} />}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg",
                      isVoiceActive ? "bg-red-500/10" : "bg-purple-500/10"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isVoiceActive ? 'Stop recording' : 'Voice input'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Text Input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  disabled={disabled || isLoading}
                  className={cn(
                    "min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent",
                    "text-base placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    "focus:ring-0 focus:outline-none p-0",
                    "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                  )}
                  style={{ height: `${inputHeight}px` }}
                  maxLength={maxLength}
                />
                
                {/* Placeholder Enhancement */}
                {!value && !isFocused && (
                  <div className="absolute inset-0 pointer-events-none flex items-start pt-2">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                      <Zap size={16} className="opacity-50" />
                      <span className="text-sm">{placeholder}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={onSend}
                  disabled={!value.trim() || isLoading || disabled || isOverLimit}
                  size="icon"
                  className={cn(
                    "min-w-[48px] min-h-[48px] rounded-xl",
                    "bg-gradient-to-r from-blue-600 to-indigo-600",
                    "hover:from-blue-700 hover:to-indigo-700",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Input Helper & Status Bar */}
            <div className="flex items-center justify-between mt-3 px-2">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1"
                      >
                        <Command size={12} />
                        <span>Quick Actions</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-4">
                        <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-white">
                          Quick Yacht Operations
                        </h4>
                        <div className="space-y-2">
                          {quickSuggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="w-full justify-start text-left h-auto p-2 text-sm"
                              onClick={() => handleSuggestionSelect(suggestion)}
                            >
                              <Zap size={14} className="mr-2 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{suggestion}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="hidden md:flex items-center gap-1">
                  <span>Press</span>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs font-mono">
                    ⌘K
                  </Badge>
                  <span>for commands</span>
                </div>
              </div>

              {/* Character Count */}
              <div className="flex items-center gap-2">
                {isVoiceActive && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium">Recording...</span>
                  </div>
                )}
                
                {characterCount > 0 && (
                  <span className={cn(
                    "text-xs font-mono",
                    isOverLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-gray-400"
                  )}>
                    {characterCount}/{maxLength}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Premium bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </motion.div>
    </TooltipProvider>
  );
};

export default PremiumChatInput;