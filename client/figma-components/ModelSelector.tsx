import React, { useState } from 'react';
import { ChevronDown, Zap, Target, Wind, Check } from 'lucide-react';

interface ModelType {
  id: 'power' | 'reach' | 'air';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  isPremium?: boolean;
}

interface ModelSelectorProps {
  isMobile?: boolean;
  isDarkMode?: boolean;
  onModelChange?: (modelId: string) => void;
}

const models: ModelType[] = [
  {
    id: 'power',
    name: 'Power',
    description: 'Our most advanced model',
    icon: Zap,
    isPremium: false
  },
  {
    id: 'reach',
    name: 'Reach',
    description: 'Get more thorough answers',
    icon: Target,
    isPremium: false
  },
  {
    id: 'air',
    name: 'Air',
    description: 'Fastest model, for simple tasks',
    icon: Wind,
    isPremium: false
  }
];

export function ModelSelector({ isMobile = false, isDarkMode = false, onModelChange }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<string>('power');
  const [isOpen, setIsOpen] = useState(false);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsOpen(false);
    onModelChange?.(modelId);
  };

  const selectedModelData = models.find(m => m.id === selectedModel);
  const SelectedIcon = selectedModelData?.icon || Zap;

  return (
    <div className="relative model_selector_container">
      {/* Model Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 model_selector_button"
        style={{
          backgroundColor: isDarkMode 
            ? 'rgba(246, 247, 251, 0.08)' 
            : 'rgba(0, 0, 0, 0.04)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937',
          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: isMobile ? '14px' : '15px',
          minWidth: isMobile ? '140px' : '160px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode 
            ? 'rgba(246, 247, 251, 0.12)' 
            : 'rgba(0, 0, 0, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode 
            ? 'rgba(246, 247, 251, 0.08)' 
            : 'rgba(0, 0, 0, 0.04)';
        }}
      >
        <SelectedIcon className="w-4 h-4" />
        <span className="flex-1 text-left">{selectedModelData?.name}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 model_selector_backdrop"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div 
            className="absolute top-full left-0 mt-2 rounded-xl shadow-lg border backdrop-blur-lg z-50 model_selector_dropdown"
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
                      color: isDarkMode ? 'var(--headline, #f6f7fb)' : '#1f2937'
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
      )}
    </div>
  );
}