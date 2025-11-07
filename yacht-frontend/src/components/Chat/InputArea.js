import React, { useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

const InputArea = ({ 
  value, 
  onChange, 
  onSend, 
  isLoading, 
  disabled,
  placeholder = "Type your message... (Enter to send, Shift+Enter for new line)"
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const handleInputChange = useCallback((e) => {
    const textarea = e.target;
    
    // Reset height to calculate new height
    textarea.style.height = 'auto';
    
    // Set new height with max of 4 lines (96px)
    const newHeight = Math.min(textarea.scrollHeight, 96);
    textarea.style.height = `${newHeight}px`;
    
    onChange(e);
  }, [onChange]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  // Focus management
  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const isMobile = window.innerWidth < 640;

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 placeholder-gray-400"
              style={{ 
                fontSize: isMobile ? '14px' : '15px',
                lineHeight: '1.6',
                minHeight: '48px',
                maxHeight: '96px'
              }}
              rows={1}
              aria-label="Type your message"
              data-testid="message-input"
            />
            
            {/* Character count for very long messages */}
            {value.length > 800 && (
              <div className="absolute bottom-1 right-12 text-xs text-gray-400 bg-white px-1">
                {value.length}/2000
              </div>
            )}
          </div>
          
          <button
            onClick={onSend}
            disabled={!value.trim() || isLoading || disabled}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
            style={{
              minWidth: isMobile ? '44px' : '48px',
              minHeight: isMobile ? '44px' : '48px'
            }}
            aria-label={isLoading ? 'Sending message...' : 'Send message'}
            data-testid="send-button"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={isMobile ? 16 : 18} />
            )}
          </button>
        </div>
        
        {/* Input hints */}
        <div className="mt-2 text-xs text-gray-400 text-center">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default InputArea;