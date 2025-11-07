/**
 * Ask AI Dialog Component
 * Prompt dialog that appears when user clicks "Ask AI?" button
 * Allows user to add more context/details to their query
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AskAIDialogProps {
  isOpen: boolean;
  originalQuery: string;
  onClose: () => void;
  onSubmit: (additionalContext: string) => void;
  isLoading?: boolean;
}

export default function AskAIDialog({
  isOpen,
  originalQuery,
  onClose,
  onSubmit,
  isLoading = false
}: AskAIDialogProps) {
  const { theme } = useTheme();
  const [additionalContext, setAdditionalContext] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Handle submit
  const handleSubmit = () => {
    if (additionalContext.trim() && !isLoading) {
      onSubmit(additionalContext.trim());
      setAdditionalContext(''); // Clear after submit
    }
  };

  // Handle Enter key (Shift+Enter for new line, Enter to submit)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            w-full max-w-2xl pointer-events-auto
            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            border rounded-2xl shadow-2xl
            transform transition-all duration-300 ease-out
          `}
          style={{
            maxHeight: '80vh',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between px-6 py-4 border-b
            ${isDark ? 'border-gray-700' : 'border-gray-200'}
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg
                ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}
              `}>
                <Sparkles className={`
                  w-5 h-5
                  ${isDark ? 'text-purple-400' : 'text-purple-600'}
                `} />
              </div>
              <div>
                <h2 className={`
                  text-xl font-semibold
                  ${isDark ? 'text-gray-100' : 'text-gray-900'}
                `}>
                  Ask AI for More Details
                </h2>
                <p className={`
                  text-sm
                  ${isDark ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  Add more context to get a better answer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`
                p-2 rounded-lg transition-colors
                ${isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Original Query Display */}
          <div className="px-6 pt-4">
            <label className={`
              block text-sm font-medium mb-2
              ${isDark ? 'text-gray-300' : 'text-gray-700'}
            `}>
              Original Query:
            </label>
            <div className={`
              p-3 rounded-lg text-sm
              ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'}
            `}>
              "{originalQuery}"
            </div>
          </div>

          {/* Additional Context Input */}
          <div className="px-6 py-4">
            <label className={`
              block text-sm font-medium mb-2
              ${isDark ? 'text-gray-300' : 'text-gray-700'}
            `}>
              Additional Details:
            </label>
            <textarea
              ref={textareaRef}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., 'I need step-by-step instructions' or 'Focus on safety procedures' or 'What parts do I need?'"
              className={`
                w-full px-4 py-3 rounded-lg resize-none
                focus:outline-none focus:ring-2
                transition-colors
                ${isDark
                  ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-purple-500/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500/30'
                }
                border
              `}
              rows={4}
              disabled={isLoading}
            />
            <p className={`
              text-xs mt-2
              ${isDark ? 'text-gray-500' : 'text-gray-500'}
            `}>
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>

          {/* Footer Actions */}
          <div className={`
            flex items-center justify-between px-6 py-4 border-t
            ${isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}
          `}>
            <button
              onClick={onClose}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-200'
                }
              `}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!additionalContext.trim() || isLoading}
              className={`
                px-6 py-2 rounded-lg font-medium
                flex items-center gap-2
                transition-all duration-200
                ${!additionalContext.trim() || isLoading
                  ? isDark
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDark
                    ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Asking AI...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ask AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
