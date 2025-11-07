import React, { useEffect } from 'react';
import { AISolutionCard } from './AISolutionCard';
import { MainHeader } from './MainHeader';

interface ChatAreaProps {
  isChatMode: boolean;
  isMobile?: boolean;
  displayName: string;
  isDarkMode?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export function ChatArea({ isChatMode, isMobile = false, displayName, isDarkMode = false, selectedModel = 'air', onModelChange }: ChatAreaProps) {
  
  useEffect(() => {
    console.info("%c[CHAT_MOUNT] ChatArea", "color:#FF6B35");
  }, []);
  // Time-based greeting function
  const getTimeBasedGreeting = () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      
      // Morning: 5:00 AM - 11:59 AM (5-11)
      if (hour >= 5 && hour < 12) {
        return 'Morning';
      }
      // Afternoon: 12:00 PM - 4:59 PM (12-16)  
      else if (hour >= 12 && hour < 17) {
        return 'Afternoon';
      }
      // Evening: 5:00 PM - 4:59 AM (17-4)
      else {
        return 'Evening';
      }
    } catch (error) {
      // Fallback when time cannot be fetched
      console.warn('Unable to fetch current time, using default greeting:', error);
      return 'Hello';
    }
  };
  // Mock solution data - In production, this would come from webhook response
  const mockSolutions = [
    {
      id: "solution_1",
      title: "Check Engine Coolant System",
      confidence: "high" as const,
      source: {
        title: "Yacht Maintenance Manual",
        page: 47,
        revision: "2024.1"
      },
      steps: [
        {
          text: "Turn off the engine and allow it to cool completely before inspection.",
          type: "warning" as const,
          isBold: true
        },
        {
          text: "Locate the coolant reservoir tank near the engine compartment.",
          type: "normal" as const
        },
        {
          text: "Check coolant level against the MIN/MAX markers on the tank.",
          type: "tip" as const
        },
        {
          text: "If coolant is below MIN level, add marine-grade coolant mixture.",
          type: "normal" as const
        },
        {
          text: "Monitor for leaks around hoses and connections.",
          type: "tip" as const
        }
      ],
      procedureLink: "https://manual.yacht.com/engine/coolant"
    },
    {
      id: "solution_2", 
      title: "Inspect Fuel System Components",
      confidence: "medium" as const,
      source: {
        title: "Engine Diagnostic Guide",
        page: 23
      },
      steps: [
        {
          text: "Check fuel filter for contamination or clogging.",
          type: "normal" as const
        },
        {
          text: "Inspect fuel lines for cracks or wear.",
          type: "warning" as const
        },
        {
          text: "Test fuel pump pressure using marine fuel pressure gauge.",
          type: "normal" as const
        }
      ]
    }
  ];

  if (!isChatMode) {
    return (
      <div className="flex h-full flex-col">
        {/* Main Header with CelesteOS branding */}
        <MainHeader 
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          isChatMode={false}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Main Header with CelesteOS branding and Model Selector */}
      <MainHeader 
        isMobile={isMobile}
        isDarkMode={isDarkMode}
        isChatMode={true}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
      
      {/* Chat Messages Container */}
      <div className="chat-container">
        <div className="chat-messages-area">
          <div className="chat-content-wrapper">
        <div 
          className="flex-1 space-y-6 messages_timeline pb-6"
        >
          {/* Chat Messages Container */}
          <div className="space-y-6">
            {/* User Message - Binds to: metadata.user_query */}
            <div className="flex gap-3 user_message_container">
              {/* Binds to: metadata.user_id */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0 user_avatar_display">
                <span 
                  className="text-white font-medium text-[10px] leading-[10px]"
                  style={{
                    fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  {displayName
                    .split(' ')
                    .map(name => name[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {/* Binds to: metadata.user_id */}
                <div 
                  className="mb-1 user_label_display text-sm leading-5"
                  style={{
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                  }}
                >
                  You
                </div>
                <div>
                  {/* Binds to: metadata.user_query */}
                  <div 
                    className="user_query_display text-[15px] md:text-base leading-relaxed"
                    style={{
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937'
                    }}
                  >
                    I'm getting Error Code E-047 on the starboard main engine. What should I do?
                  </div>
                </div>
              </div>
            </div>

            {/* AI Response Container - Binds to: response.message, response.timestamp */}
            <div className="flex gap-3 ai_response_container">
              {/* Binds to: response.system_info.assistant_avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0 ai_avatar_display">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                {/* Binds to: response.system_info.assistant_name */}
                <div 
                  className="mb-1 assistant_label_display text-sm leading-5"
                  style={{
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                  }}
                >
                  CelesteOS
                </div>
                
                {/* Main AI Response Content */}
                <div>
                  {/* Binds to: response.message */}
                  <div 
                    className="mb-4 ai_response_message text-[15px] md:text-base leading-relaxed"
                    style={{
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937'
                    }}
                  >
                    Error Code E-047 indicates an issue with the starboard engine cooling system. 
                    I've found detailed troubleshooting procedures from your yacht's maintenance manual. 
                    Here are the recommended solutions:
                  </div>

                  {/* AI Solution Cards - Binds to: response.solution_steps, response.confidence_score */}
                  <div className="ai_solutions_container">
                    {/* Binds to: response.solutions[], response.confidence_score */}
                    <AISolutionCard 
                      solutions={mockSolutions} 
                      isMobile={isMobile}
                    />
                  </div>

                  {/* Response Footer with Confidence & Processing Time */}

                </div>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}