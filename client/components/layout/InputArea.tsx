import React, { useState, useEffect, useRef } from 'react';
import { Ship, Mail, Paperclip, Send, MoreHorizontal, FileText, Upload, X } from 'lucide-react';

type SearchType = 'yacht' | 'email' | 'sop';

interface InputAreaProps {
  onStartChat?: (searchType: SearchType, message?: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  isMobile?: boolean;
  isDarkMode?: boolean;
  currentSearchType?: SearchType;
}

export function InputArea({
  onStartChat,
  value,
  onChange,
  onSend,
  isLoading = false,
  placeholder = 'Ask anything...',
  selectedModel,
  onModelChange,
  isMobile = false,
  isDarkMode = false,
  currentSearchType = 'yacht'
}: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState<SearchType>(currentSearchType);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(40); // Starting height
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputValue = value !== undefined ? value : message;

  // Auto-resize function
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // Reset height to get accurate scrollHeight
    textarea.style.height = '40px';

    // Calculate new height based on content
    const scrollHeight = textarea.scrollHeight;

    // Device-specific max heights
    const maxHeight = isMobile ? 160 : window.innerWidth < 1024 ? 200 : 240;

    const newHeight = Math.min(scrollHeight, maxHeight);
    setTextareaHeight(newHeight);
  };

  const handleInputChange = (newValue: string, textarea?: HTMLTextAreaElement) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setMessage(newValue);
    }

    // Auto-resize after text change
    if (textarea) {
      setTimeout(() => adjustTextareaHeight(textarea), 0);
    }
  };

  useEffect(() => {
    setSelectedSearchType(currentSearchType);
  }, [currentSearchType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      if (onSend && typeof onSend === 'function') {
        onSend(inputValue, uploadedFiles.length > 0 ? uploadedFiles : undefined);
      } else if (onStartChat && typeof onStartChat === 'function') {
        onStartChat(selectedSearchType, inputValue);
      }

      if (value === undefined && !onSend) {
        setMessage('');
      }
      // Clear uploaded files after sending
      setUploadedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const searchTypes = [
    {
      id: 'yacht' as SearchType,
      icon: Ship,
      title: 'Yacht Search',
      description: 'Search yacht maintenance and operations',
      placeholder: 'Ask anything...'
    },
    {
      id: 'email' as SearchType,
      icon: Mail,
      title: 'Email Search',
      description: 'Search emails and communications',
      placeholder: 'Search emails...'
    },
    {
      id: 'sop' as SearchType,
      icon: FileText,
      title: 'SOP Creation',
      description: 'Generate procedures from manuals',
      placeholder: 'Describe the procedure...'
    }
  ];

  const getCurrentPlaceholder = () => {
    const currentType = searchTypes.find(type => type.id === selectedSearchType);
    return placeholder || currentType?.placeholder || 'Ask anything...';
  };

  return (
    <div className="w-full px-4 sm:max-w-[800px] sm:px-6 lg:max-w-[960px] lg:px-8 mx-auto pb-3">
      <div
        className="backdrop-blur-[20px] backdrop-saturate-[140%] bg-gradient-to-b from-white/85 to-white/70 dark:from-black/60 dark:to-black/50 border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-3xl transition-all duration-200"
        style={{
          minHeight: isMobile ? '56px' : '64px'
        }}
      >
        {/* Search Type Indicator */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all duration-200"
            style={{
              backgroundColor: isDarkMode
                ? 'rgba(246, 247, 251, 0.08)'
                : 'rgba(24, 24, 24, 0.06)',
              color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#6b7280',
              fontFamily: 'var(--font-eloquia-text), system-ui',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
            }}
          >
            {(() => {
              const currentType = searchTypes.find(type => type.id === selectedSearchType);
              const IconComponent = currentType?.icon || Ship;
              return (
                <>
                  <IconComponent className="w-3 h-3" />
                  <span>{currentType?.title || 'Yacht Search'}</span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-4 px-4 pb-4">
          {/* Left Action Icon */}
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
            {/* File Preview - Only for SOP mode */}
            {selectedSearchType === 'sop' && uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-white/5 rounded-full text-sm"
                  >
                    <Upload className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={inputValue}
              onChange={(e) => {
                handleInputChange(e.target.value, e.target);
              }}
              onKeyDown={handleKeyDown}
              onInput={(e) => {
                adjustTextareaHeight(e.target as HTMLTextAreaElement);
              }}
              placeholder={getCurrentPlaceholder()}
              className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder:text-black/50 dark:placeholder:text-white/50 text-gray-900 dark:text-white overflow-hidden transition-[height] duration-200 ease-in-out"
              style={{
                fontSize: '16px',
                fontFamily: 'var(--font-eloquia-text), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                height: `${textareaHeight}px`,
                minHeight: '40px',
                maxHeight: isMobile ? '160px' : window.innerWidth < 1024 ? '200px' : '240px'
              }}
              rows={1}
            />
          </div>

          {/* File Upload Button - Only for SOP mode */}
          {selectedSearchType === 'sop' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200"
                aria-label="Upload documents"
                title="Upload documents"
              >
                <Upload className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 rounded-full transition-all duration-200 flex items-center justify-center ${
              isMobile ? 'w-10 h-10' : 'w-12 h-12'
            } ${
              inputValue.trim() && !isLoading
                ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
            title="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}