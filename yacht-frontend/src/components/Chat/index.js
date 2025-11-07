import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { WEBHOOK_URLS } from '../../config/webhookConfig';

import ErrorBoundary from './ErrorBoundary';
import Header from './Header';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';

// Typing Indicator Component
const TypingIndicator = React.memo(() => (
  <div className="flex justify-start mb-4" data-testid="typing-indicator">
    <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl mr-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
));

// Error Message Component
const ErrorMessage = React.memo(({ error, onRetry, onDismiss }) => (
  <div className="flex justify-center mb-4">
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 max-w-md">
      <AlertCircle size={16} />
      <span className="flex-1 text-sm">
        {error.includes('rate limit') || error.includes('slow down') 
          ? 'Please slow down - you\'re sending messages too quickly'
          : error.includes('network') || error.includes('fetch')
          ? 'Network error - please check your connection'
          : error
        }
      </span>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-700 hover:text-red-900 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            aria-label="Retry message"
          >
            <RefreshCw size={14} />
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-red-700 hover:text-red-900 transition-colors text-lg leading-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  </div>
));

// Empty State Component
const EmptyState = React.memo(() => (
  <div className="text-center py-12">
    <div className="text-gray-400 mb-4">
      <Zap size={48} className="mx-auto mb-4" />
    </div>
    <h2 className="text-xl font-medium text-gray-900 mb-2">Welcome to CelesteOS</h2>
    <p className="text-gray-600 max-w-md mx-auto">
      Start a conversation by typing a message below. I'm here to help with sales, marketing, strategy, and more.
    </p>
  </div>
));

// Main Chat Component
const ChatComponent = ({ 
  user, 
  apiEndpoint = WEBHOOK_URLS.TEXT_CHAT_FAST,
  maxMessages = 200
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryMessage, setRetryMessage] = useState(null);
  const [tokenStats, setTokenStats] = useState({ remaining: 0, used: 0 });
  
  // Streaming animation state
  const [streamingIntervals, setStreamingIntervals] = useState(new Map());
  
  // Connection monitoring
  const [connectionStatus, setConnectionStatus] = useState({ 
    isOnline: navigator.onLine,
    isConnected: true,
    lastPing: Date.now()
  });
  
  // Refs for cleanup and auto-scroll
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const debounceRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Word-by-word streaming function - FIXED IMPLEMENTATION  
  const streamMessage = useCallback((fullText, messageId) => {
    console.log('🎬 Chat streamMessage called:', { fullText, messageId }); // DEBUG
    
    // Clear any existing interval for this message
    if (streamingIntervals.has(messageId)) {
      clearInterval(streamingIntervals.get(messageId));
      streamingIntervals.delete(messageId);
    }

    if (!fullText || !messageId) {
      console.error('❌ Chat streamMessage: Missing required parameters', { fullText, messageId });
      return;
    }

    const words = fullText.split(' ');
    let currentIndex = 0;
    
    console.log('📝 Chat starting stream with', words.length, 'words'); // DEBUG
    
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        const currentText = words.slice(0, currentIndex + 1).join(' ');
        console.log(`📝 Chat Word ${currentIndex + 1}/${words.length}:`, currentText); // DEBUG
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                text: currentText,
                isStreaming: true
              }
            : msg
        ));
        currentIndex++;
      } else {
        console.log('✅ Chat streaming complete for message:', messageId); // DEBUG
        
        // Streaming complete
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isStreaming: false }
            : msg
        ));
        clearInterval(interval);
        setStreamingIntervals(prev => {
          const newMap = new Map(prev);
          newMap.delete(messageId);
          return newMap;
        });
      }
    }, 40); // 40ms delay between words

    setStreamingIntervals(prev => new Map(prev).set(messageId, interval));
  }, [streamingIntervals]);

  // Clear all streaming intervals
  const clearAllStreaming = useCallback(() => {
    streamingIntervals.forEach(interval => clearInterval(interval));
    setStreamingIntervals(new Map());
  }, [streamingIntervals]);

  // Clear streaming when component unmounts
  useEffect(() => {
    return () => {
      clearAllStreaming();
    };
  }, [clearAllStreaming]);
  
  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setConnectionStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setConnectionStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Initialize session and chat IDs
  useEffect(() => {
    // Generate chat ID if not exists
    if (!sessionStorage.getItem('celesteos_chat_id')) {
      sessionStorage.setItem('celesteos_chat_id', `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    
    // Generate session ID if not exists  
    if (!sessionStorage.getItem('celesteos_session_id')) {
      sessionStorage.setItem('celesteos_session_id', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);
  
  // Load conversation from sessionStorage
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('celesteos_chat_messages');
    const savedTokens = sessionStorage.getItem('celesteos_token_stats');
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Limit loaded messages to prevent performance issues
        setMessages(parsed.slice(-maxMessages));
      } catch (e) {
        console.warn('Failed to load saved messages:', e);
      }
    }
    
    if (savedTokens) {
      try {
        setTokenStats(JSON.parse(savedTokens));
      } catch (e) {
        console.warn('Failed to load token stats:', e);
      }
    }
  }, [maxMessages]);
  
  // Save conversation to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      // Only save recent messages to prevent storage bloat
      const messagesToSave = messages.slice(-maxMessages);
      sessionStorage.setItem('celesteos_chat_messages', JSON.stringify(messagesToSave));
    }
  }, [messages, maxMessages]);
  
  useEffect(() => {
    sessionStorage.setItem('celesteos_token_stats', JSON.stringify(tokenStats));
  }, [tokenStats]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    // Use RAF to ensure DOM is updated
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, isLoading, scrollToBottom]);
  
  // Send message function
  const sendMessage = useCallback(async (messageText = inputValue, isRetry = false) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    // Clear any existing streaming
    clearAllStreaming();

    setIsLoading(true);
    setError(null);
    setRetryMessage(null);
    
    const userMessage = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date()
    };
    
    if (!isRetry) {
      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        // Limit messages to prevent performance issues
        return newMessages.slice(-maxMessages);
      });
      setInputValue('');
    }
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || user.displayName,
          message: text,
          chatId: `chat_${user.id}_${Date.now()}`,
          sessionId: `session_${user.id}`,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.response) {
        // STOP pulsing animation immediately  
        setIsLoading(false);
        
        console.log('🔍 Chat Component Webhook Response:', data); // DEBUG
        
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          text: '', // Start with empty text for streaming
          isUser: false,
          timestamp: new Date(data.timestamp || Date.now()),
          category: data.metadata?.category,
          confidence: data.metadata?.confidence,
          responseTime: data.metadata?.responseTime,
          stage: data.metadata?.stage,
          requestId: data.requestId,
          fadeIn: true,
          isStreaming: true
        };
        
        setMessages(prev => {
          const newMessages = [...prev, aiMessage];
          return newMessages.slice(-maxMessages);
        });
        
        console.log('🔍 AI Response Text:', data.response); // DEBUG
        
        // Start word-by-word streaming AFTER UI update
        setTimeout(() => {
          console.log('🚀 Starting streaming animation'); // DEBUG
          streamMessage(data.response, aiMessageId);
        }, 100);
        
        // Update token stats with new format
        if (data.metadata?.tokensUsed !== undefined || data.metadata?.tokensRemaining !== undefined) {
          setTokenStats(prev => ({
            remaining: data.metadata?.tokensRemaining || prev.remaining,
            used: (prev.used || 0) + (data.metadata?.tokensUsed || 0)
          }));
        }
        
        // Save to localStorage periodically
        saveToLocalStorage([...messages, userMessage, { ...aiMessage, text: data.response }]);
        
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Send message error:', error);
      
      // Add error message without streaming
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: 'Failed to send message. Please try again.',
        isUser: false,
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setRetryMessage(text);
      setError(error.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, user, apiEndpoint, maxMessages, messages, saveToLocalStorage, streamMessage, clearAllStreaming]);
  
  // Handle input changes with debouncing
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
    
    // Debounce to prevent spam (could be used for typing indicators)
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Could add typing indicator logic here
    }, 300);
  }, []);
  
  // Clear chat function
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setRetryMessage(null);
    setInputValue('');
    sessionStorage.removeItem('celesteos_chat_messages');
    
    // Announce to screen readers
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Chat cleared');
      utterance.volume = 0;
      speechSynthesis.speak(utterance);
    }
  }, []);
  
  // Retry failed message
  const retryFailedMessage = useCallback(() => {
    if (retryMessage) {
      sendMessage(retryMessage, true);
    }
  }, [retryMessage, sendMessage]);
  
  // Memoized messages list for performance
  const messagesList = useMemo(() => {
    return messages.map((msg) => (
      <MessageBubble
        key={msg.id}
        message={msg.text}
        isUser={msg.isUser}
        category={msg.category}
        confidence={msg.confidence}
        responseTime={msg.responseTime}
        stage={msg.stage}
        fadeIn={msg.fadeIn}
        timestamp={msg.timestamp}
      />
    ));
  }, [messages]);
  
  return (
    <ErrorBoundary>
      <div 
        className="flex flex-col h-screen bg-white"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
        data-testid="chat-component"
      >
        <Header
          tokenStats={tokenStats}
          isLoading={isLoading}
          onClearChat={clearChat}
          connectionStatus={connectionStatus}
        />
        
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && <EmptyState />}
            
            {messagesList}
            
            {isLoading && <TypingIndicator />}
            
            {error && (
              <ErrorMessage
                error={error}
                onRetry={retryMessage ? retryFailedMessage : null}
                onDismiss={() => setError(null)}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <InputArea
          value={inputValue}
          onChange={handleInputChange}
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!connectionStatus.isOnline}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ChatComponent;