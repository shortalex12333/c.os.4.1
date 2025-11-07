import React, { useState } from 'react';
import { ChevronDown, Zap, Target, Wind, Check } from 'lucide-react';

interface ModelType {
  id: 'power' | 'reach' | 'air';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface MainHeaderProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
  isChatMode?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

const models: ModelType[] = [
  {
    id: 'power',
    name: 'Power',
    description: 'Our most advanced model',
    icon: Zap
  },
  {
    id: 'reach',
    name: 'Reach',
    description: 'Get more thorough answers',
    icon: Target
  },
  {
    id: 'air',
    name: 'Air',
    description: 'Fastest model, for simple tasks',
    icon: Wind
  }
];

export function MainHeader({ isMobile = false, isDarkMode = false, isChatMode = false, selectedModel = 'air', onModelChange }: MainHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleModelSelect = (modelId: string) => {
    setIsDropdownOpen(false);
    onModelChange?.(modelId);
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div 
      className="flex items-center px-6 py-4 main_header_container"
      style={{
        padding: isMobile ? '12px 16px' : '16px 24px',
        minHeight: isMobile ? '60px' : '72px',
        background: 'transparent', // Make transparent
        justifyContent: isMobile ? 'center' : 'space-between'
      }}
    >
      {/* CelesteOS Branding with Model Selector */}
      <div className="relative celeste_branding_dropdown">
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 transition-all duration-200 celeste_title_button"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            {/* CelesteOS Text */}
            <h1 
              className="celeste_title"
              style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 400,
                lineHeight: isMobile ? '24px' : '28px',
                fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                margin: 0
              }}
            >
              Celeste
              <span 
                className="celeste_os_suffix"
                style={{
                  color: isDarkMode 
                    ? 'var(--opulent-gold, #c8a951)' 
                    : '#2563eb',
                  fontWeight: 500
                }}
              >
                OS
              </span>
            </h1>

            {/* Dropdown Chevron */}
            <ChevronDown 
              className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              style={{
                width: isMobile ? '16px' : '18px',
                height: isMobile ? '16px' : '18px',
                color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#6b7280',
                marginLeft: '4px'
              }}
            />
          </button>
          
          {/* Model Type Subheader */}
          <div 
            className="model_type_subheader"
            style={{
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 500,
              lineHeight: isMobile ? '12px' : '14px',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: isDarkMode 
                ? 'rgba(246, 247, 251, 0.65)' 
                : 'rgba(31, 41, 55, 0.6)',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              marginTop: isMobile ? '2px' : '4px'
            }}
          >
            {selectedModel.toUpperCase()}
          </div>
        </div>

        {/* Model Selector Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 model_selector_backdrop"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown Content */}
            <>
              {/* Mobile Blur Backdrop */}
              {isMobile && (
                <div 
                  className="fixed inset-0 z-40 mobile_blur_backdrop"
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    backgroundColor: isDarkMode 
                      ? 'rgba(0, 0, 0, 0.2)' 
                      : 'rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                />
              )}
              
              <div 
                className={`absolute top-full mt-2 rounded-xl shadow-lg border backdrop-blur-lg z-50 model_selector_dropdown ${
                  isMobile ? 'left-1/2 -translate-x-1/2' : 'left-0'
                }`}
                style={{
                  backgroundColor: isDarkMode 
                    ? 'rgba(15, 11, 18, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                  minWidth: isMobile ? '280px' : '320px',
                  maxWidth: isMobile ? '320px' : '380px'
                }}
              >
              {/* Header */}
              <div 
                className="px-4 py-3 border-b model_selector_header"
                style={{
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937'
                }}
              >
                <div 
                  className="text-sm font-medium"
                  style={{
                    fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: isMobile ? '14px' : '15px',
                    fontWeight: 500
                  }}
                >
                  Select Model
                </div>
              </div>

              {/* Model Options */}
              <div className="py-2 model_selector_options">
                {models.map((model) => {
                  const IconComponent = model.icon;
                  const isSelected = selectedModel === model.id;
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className="flex items-center w-full px-4 py-3 transition-all duration-200 model_option_button"
                      style={{
                        backgroundColor: isSelected 
                          ? isDarkMode 
                            ? 'rgba(200, 169, 81, 0.12)' 
                            : 'rgba(0, 112, 255, 0.08)'
                          : 'transparent',
                        color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = isDarkMode 
                            ? 'rgba(246, 247, 251, 0.06)' 
                            : 'rgba(0, 0, 0, 0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        } else {
                          e.currentTarget.style.backgroundColor = isDarkMode 
                            ? 'rgba(200, 169, 81, 0.12)' 
                            : 'rgba(0, 112, 255, 0.08)';
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{
                            color: isSelected 
                              ? isDarkMode 
                                ? 'var(--opulent-gold, #c8a951)' 
                                : '#2563eb'
                              : isDarkMode 
                                ? 'rgba(246, 247, 251, 0.7)' 
                                : '#6b7280'
                          }}
                        />
                        <div className="flex flex-col items-start flex-1">
                          <div 
                            className="font-medium"
                            style={{
                              fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: isMobile ? '15px' : '16px',
                              fontWeight: 500,
                              lineHeight: '20px',
                              color: isSelected 
                                ? isDarkMode 
                                  ? 'var(--opulent-gold, #c8a951)' 
                                  : '#2563eb'
                                : 'inherit'
                            }}
                          >
                            {model.name}
                          </div>
                          <div 
                            className="text-sm"
                            style={{
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: isMobile ? '13px' : '14px',
                              lineHeight: '18px',
                              color: isDarkMode 
                                ? 'rgba(246, 247, 251, 0.65)' 
                                : '#6b7280',
                              marginTop: '2px'
                            }}
                          >
                            {model.description}
                          </div>
                        </div>
                      </div>
                      
                      {/* Selection Check */}
                      {isSelected && (
                        <Check 
                          className="w-4 h-4 ml-2" 
                          style={{
                            color: isDarkMode 
                              ? 'var(--opulent-gold, #c8a951)' 
                              : '#2563eb'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            </>
          </>
        )}
      </div>

      {/* Current Model Display (Only in Chat Mode and Desktop) */}
      {isChatMode && selectedModelData && !isMobile && (
        <div 
          className="flex items-center gap-2 current_model_display"
          style={{
            color: isDarkMode ? 'rgba(246, 247, 251, 0.7)' : '#6b7280',
            fontSize: isMobile ? '13px' : '14px',
            fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <selectedModelData.icon className="w-4 h-4" />
          <span>{selectedModelData.name}</span>
        </div>
      )}
    </div>
  );
}