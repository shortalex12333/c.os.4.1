import React from 'react';
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
        
        {/* Welcome State Content */}
        <div className="flex h-full items-center justify-center welcome_state_container">
          <div className="text-center max-w-2xl px-6">
            {/* Greeting Header */}
            <h2 
              className="mb-4 welcome_greeting_header"
              style={{
                fontSize: isMobile ? '24px' : '28px',
                lineHeight: isMobile ? '30px' : '34px',
                fontWeight: 400,
                color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '0.38px',
                marginBottom: isMobile ? '16px' : '20px'
              }}
            >
              {getTimeBasedGreeting()}, {displayName}
            </h2>
            
            {/* Binds to: response.system_info.welcome_message */}
            <p 
              className="mb-8 welcome_message_display"
              style={{ 
                fontSize: isMobile ? '16px' : '18px',
                lineHeight: isMobile ? '24px' : '28px',
                color: isDarkMode ? 'rgba(246, 247, 251, 0.8)' : '#6b7280',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.32px'
              }}
            >
              Welcome, you are using our latest models (2025), select your search intent, and type below
            </p>
          </div>
        </div>
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
      <div 
        className="flex flex-col h-full flex-1 chat_messages_container"
        style={{
          maxWidth: isMobile ? '390px' : '760px',
          margin: '0 auto',
          padding: isMobile ? '16px' : '24px'
        }}
      >
        <div 
          className="flex-1 space-y-6 messages_timeline"
          style={{
            paddingBottom: '24px'
          }}
        >
          {/* Chat Messages Container */}
          <div className="space-y-6">
            {/* User Message - Binds to: metadata.user_query */}
            <div className="flex gap-3 user_message_container">
              {/* Binds to: metadata.user_id */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0 user_avatar_display">
                <span 
                  className="text-white font-medium"
                  style={{
                    fontSize: '10px',
                    lineHeight: '10px',
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
                  className="mb-1 user_label_display"
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280'
                  }}
                >
                  You
                </div>
                <div>
                  {/* Binds to: metadata.user_query */}
                  <div 
                    className="user_query_display"
                    style={{
                      fontSize: isMobile ? '15px' : '16px', // Mobile: 15px
                      lineHeight: isMobile ? '22px' : '24px', // Mobile: 22px
                      letterSpacing: '-0.32px',
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
                  className="mb-1 assistant_label_display"
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
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
                    className="mb-4 ai_response_message"
                    style={{
                      fontSize: isMobile ? '15px' : '16px',
                      lineHeight: isMobile ? '22px' : '24px',
                      letterSpacing: '-0.32px',
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
  );
}