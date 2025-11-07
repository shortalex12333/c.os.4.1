/**
 * Fixed Chat Interface Component
 * Properly integrates with n8n webhook using correct payload format
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Check } from 'lucide-react';
import { useWebhookChat, SearchStrategy } from '../hooks/useWebhookChat';

interface ChatInterfaceFixedProps {
  userId: string;
  userName: string;
  userEmail: string;
  defaultSearchStrategy?: SearchStrategy;
}

export function ChatInterfaceFixed({
  userId,
  userName,
  userEmail,
  defaultSearchStrategy = 'yacht'
}: ChatInterfaceFixedProps) {
  const [input, setInput] = useState('');
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>(defaultSearchStrategy);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    testConnection
  } = useWebhookChat({ userId, userName, userEmail });

  // Test connection on mount
  useEffect(() => {
    testConnection().then(connected => {
      if (connected) {
        console.log('✅ Webhook connection successful');
      } else {
        console.error('❌ Webhook connection failed');
      }
    });
  }, [testConnection]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message, searchStrategy);
  };

  const searchStrategies: { value: SearchStrategy; label: string; description: string }[] = [
    { value: 'yacht', label: 'Yacht Docs', description: 'Search yacht documentation' },
    { value: 'email', label: 'Email', description: 'Search email history' }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              CelesteOS Chat
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connected as {userName}
            </p>
          </div>
          
          {/* Search Strategy Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Search:
            </label>
            <select
              value={searchStrategy}
              onChange={(e) => setSearchStrategy(e.target.value as SearchStrategy)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {searchStrategies.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Connection Status */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Welcome to CelesteOS</p>
            <p className="text-sm">
              Ask me about yacht maintenance, search emails, or get help with any maritime topic.
            </p>
            <p className="text-xs mt-4 text-gray-400 dark:text-gray-500">
              Using {searchStrategies.find(s => s.value === searchStrategy)?.description}
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.role === 'user' ? 'You' : 'CelesteOS'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Show metadata for assistant messages */}
                {message.role === 'assistant' && message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {message.metadata.confidence && (
                      <div className="text-xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    {message.metadata.sources && message.metadata.sources.length > 0 && (
                      <div className="text-xs mt-1">
                        Sources: {message.metadata.sources.join(', ')}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                CelesteOS is thinking...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${searchStrategy === 'yacht' ? 'yacht maintenance' :
                        searchStrategy === 'email' ? 'your emails' : 'anything'}...`}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-2 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setInput('Check engine status')}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Check engine status
          </button>
          <button
            type="button"
            onClick={() => setInput('Show recent maintenance alerts')}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Recent alerts
          </button>
          <button
            type="button"
            onClick={() => setInput('Search emails about fuel system')}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Fuel emails
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded
                       hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors ml-auto"
            >
              Clear chat
            </button>
          )}
        </div>
      </form>
    </div>
  );
}