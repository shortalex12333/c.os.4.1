import React from 'react';
import { useVisualViewportBottom } from '../../hooks/useVisualViewportBottom';
import styles from './ChatComposer.module.css';

interface ChatComposerProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  isMobile?: boolean;
  isDarkMode?: boolean;
  // For start chat mode
  onStartChat?: (searchType: 'yacht' | 'email', firstMessage?: string) => void;
  currentSearchType?: 'yacht' | 'email';
}

export function ChatComposer({
  value = '',
  onChange,
  onSend,
  isLoading = false,
  placeholder = 'Message CelesteOS...',
  selectedModel,
  onModelChange,
  isMobile = false,
  isDarkMode = false,
  onStartChat,
  currentSearchType = 'yacht'
}: ChatComposerProps) {
  const kb = useVisualViewportBottom();
  const extraOffset = isMobile ? 16 : 12;
  const bottom = `calc(env(safe-area-inset-bottom, 0px) + ${kb}px + ${extraOffset}px)`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSend && value.trim()) {
      onSend(value.trim());
    } else if (onStartChat && value.trim()) {
      onStartChat(currentSearchType, value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      data-testid="composer"
      className={`${styles.composer} fixed left-0 right-0 z-20 px-4 sm:px-6 lg:px-8 pb-4 pointer-events-none`}
      style={{ bottom }}
    >
      {/* Premium Composer Container - Responsive Width */}
      <div className={`${styles.composerGlass} pointer-events-auto w-full max-w-full sm:max-w-[800px] lg:max-w-[960px] mx-auto rounded-3xl backdrop-blur-[20px] backdrop-saturate-[140%] bg-gradient-to-b from-white/85 to-white/70 dark:from-black/60 dark:to-black/50 border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-200`}
        style={{
          minHeight: isMobile ? '52px' : '64px'
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-4 p-3 sm:p-4">
          {/* Left Action Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200"
              aria-label="Search mode"
              title="Search mode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Input Field */}
          <div className="flex-1 min-w-0">
            <textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className={`${styles.composerInput} w-full min-h-[40px] max-h-[120px] px-4 py-3 bg-transparent border-none outline-none resize-none text-base leading-relaxed ${
                isDarkMode
                  ? 'text-white placeholder:text-white/50'
                  : 'text-gray-900 placeholder:text-black/50'
              }`}
              style={{
                fontSize: '16px', // Prevent iOS zoom
                fontFamily: 'var(--font-eloquia-text), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={`${styles.sendButton} flex-shrink-0 rounded-full transition-all duration-200 flex items-center justify-center ${
              isMobile ? 'w-10 h-10' : 'w-12 h-12'
            } ${
              value.trim() && !isLoading
                ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
            title="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
