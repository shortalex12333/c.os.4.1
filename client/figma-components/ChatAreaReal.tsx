import React, { useEffect } from 'react';
import { AISolutionCard } from './AISolutionCard';
import styles from '../components/chat/ChatSheet.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
  solutions?: Array<{
    id: string;
    title: string;
    confidence: number;
    content: string;
    source: string;
    type?: string;
    doc_link?: string;
    metadata?: any;
  }>;
}

interface ChatAreaRealProps {
  messages: Message[];
  isLoading: boolean;
  isMobile?: boolean;
  isDarkMode?: boolean;
}

export function ChatAreaReal({ 
  messages, 
  isLoading, 
  isMobile = false,
  isDarkMode = false 
}: ChatAreaRealProps) {
  
  useEffect(() => {
    console.info("%c[CHAT_MOUNT] ChatAreaReal", "color:#0A84FF");
  }, []);

  useEffect(() => {
    console.info("[CHAT_STATE]", { count: messages.length, hasMessages: messages.length > 0 });
  }, [messages.length]);
  
  return (
    <div data-debug="ChatAreaReal" id="chat-root-ChatAreaReal" className={isMobile ? "h-[100dvh] overflow-hidden flex flex-col" : "h-full w-full flex flex-col"}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6" style={{ scrollPaddingBottom: '160px' }}>
        {/* Frosted chat sheet - bounded, not full-screen */}
        <div className={`${styles.celChatSheet} ${isDarkMode ? styles.dark : ''} relative z-20 ${isMobile ? 'mx-2' : 'mx-auto'} w-full max-w-[1060px] mt-12 rounded-3xl backdrop-blur-[36px] backdrop-saturate-[160%] bg-gradient-to-b from-white/90 via-white/80 to-white/75 dark:bg-gradient-to-b dark:from-neutral-900 dark:via-neutral-950 dark:to-black border border-white/50 dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.6)] p-6`}>
          <div className="space-y-6">
          {messages.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Start a conversation
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Type a message below to begin
              </p>
            </div>
          ) : (
            // Messages list
            messages.map((message) => (
              <div key={message.id} className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {message.role === 'user' ? 'You' : 'CelesteOS'}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className={`prose prose-sm max-w-none ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {message.content}
                  </div>
                  
                  {/* Solution Cards - Only show for assistant messages with solutions */}
                  {message.role === 'assistant' && message.solutions && message.solutions.length > 0 && (
                    <div className="mt-4">
                      <AISolutionCard
                        solutions={message.solutions.map(sol => ({
                          id: sol.id,
                          title: sol.title,
                          confidence: sol.confidence >= 0.8 ? 'high' : sol.confidence >= 0.6 ? 'medium' : 'low',
                          confidenceScore: Math.round(sol.confidence * 100),
                          source: {
                            title: sol.source,
                            page: sol.metadata?.source_metadata?.document_index
                          },
                          steps: [{
                            text: sol.content,
                            type: 'normal'
                          }],
                          procedureLink: sol.doc_link,
                          // Map document arrays to solution-level data
                          related_docs: message.other_docs?.map(doc => ({
                            file_name: doc.title,
                            doc_link: doc.doc_link,
                            confidence: doc.confidence
                          })),
                          all_docs: message.all_docs?.map(doc => ({
                            file_name: doc.title,
                            doc_link: doc.doc_link,
                            confidence: doc.confidence
                          }))
                        }))}
                        isMobile={isMobile}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                  AI
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    CelesteOS
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}