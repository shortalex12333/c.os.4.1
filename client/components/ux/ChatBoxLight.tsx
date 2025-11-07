import React from 'react';
import { Send, Paperclip, Image } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface ChatBoxLightProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  onYachtClick?: () => void;
  onEmailClick?: () => void;
  onWebClick?: () => void;
  onAttachClick?: () => void;
  onImageClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ChatBoxLight({
  placeholder = "How can I help you?",
  value = "",
  onChange,
  onSend,
  onYachtClick,
  onEmailClick,
  onWebClick,
  onAttachClick,
  onImageClick,
  isLoading = false,
  disabled = false
}: ChatBoxLightProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend?.();
    }
  };

  const { dimensions, colors, typography, borderRadius, shadows, components } = designTokens;
  const { chatBox } = dimensions;
  const { light } = colors;
  const { chatBox: chatConfig } = components;

  return (
    <div className="w-full" style={{ maxWidth: chatBox.width, margin: '0 auto' }}>
      {/* Main Chat Container - EXACT 561 × 174 from reference */}
      <div 
        style={{
          position: 'relative',
          width: chatBox.width,
          height: chatBox.height,
          backgroundColor: light.pageBackground,
          border: `1px solid ${light.cardBorder}`,
          borderRadius: borderRadius.chatBox,
          boxShadow: shadows.chatBox,
          padding: chatConfig.padding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        
        {/* Input Section */}
        <div style={{ flex: 1 }}>
          <textarea
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={3}
            style={{
              width: '100%',
              height: chatConfig.textareaHeight,
              padding: `${chatConfig.padding - 4}px ${chatConfig.padding}px`,
              fontSize: typography.chatPlaceholder.fontSize,
              lineHeight: `${typography.chatPlaceholder.lineHeight}px`,
              color: light.primaryText,
              backgroundColor: 'transparent',
              border: 'none',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              '::placeholder': {
                color: light.placeholderText
              }
            }}
            className="placeholder:text-[#9CA3AF]"
          />
        </div>

        {/* Action Row - EXACT from grid reference */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: chatConfig.buttonGap,
            marginTop: 8
          }}
        >
          {/* Left Side - Source Buttons - NO BACKGROUNDS per reference */}
          <div style={{ display: 'flex', alignItems: 'center', gap: chatConfig.buttonGap }}>
            
            {/* Yacht Button - CLEAN, no background */}
            <button
              onClick={onYachtClick}
              disabled={disabled || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: chatConfig.buttonHeight,
                padding: `${components.buttons.chatLight.padding.y}px ${components.buttons.chatLight.padding.x}px`,
                background: components.buttons.chatLight.background,
                border: components.buttons.chatLight.border,
                borderRadius: borderRadius.button,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
              className="hover:opacity-70"
            >
              <div 
                style={{
                  width: chatConfig.iconSize,
                  height: chatConfig.iconSize,
                  backgroundColor: light.secondaryText,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'white'
                }}
              >
                ⚓
              </div>
              <span 
                style={{
                  fontSize: typography.buttonText.fontSize,
                  fontWeight: typography.buttonText.fontWeight,
                  color: light.primaryText
                }}
              >
                Yacht
              </span>
            </button>

            {/* Email Button */}
            <button
              onClick={onEmailClick}
              disabled={disabled || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: chatConfig.buttonHeight,
                padding: `${components.buttons.chatLight.padding.y}px ${components.buttons.chatLight.padding.x}px`,
                background: components.buttons.chatLight.background,
                border: components.buttons.chatLight.border,
                borderRadius: borderRadius.button,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
              className="hover:opacity-70"
            >
              <svg 
                width={chatConfig.iconSize} 
                height={chatConfig.iconSize} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={light.secondaryText} 
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span 
                style={{
                  fontSize: typography.buttonText.fontSize,
                  fontWeight: typography.buttonText.fontWeight,
                  color: light.primaryText
                }}
              >
                Email
              </span>
            </button>

            {/* Web Button */}
            <button
              onClick={onWebClick}
              disabled={disabled || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: chatConfig.buttonHeight,
                padding: `${components.buttons.chatLight.padding.y}px ${components.buttons.chatLight.padding.x}px`,
                background: components.buttons.chatLight.background,
                border: components.buttons.chatLight.border,
                borderRadius: borderRadius.button,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
              className="hover:opacity-70"
            >
              <svg 
                width={chatConfig.iconSize} 
                height={chatConfig.iconSize} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={light.secondaryText} 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span 
                style={{
                  fontSize: typography.buttonText.fontSize,
                  fontWeight: typography.buttonText.fontWeight,
                  color: light.primaryText
                }}
              >
                Web
              </span>
            </button>

            {/* Attachment Button - Icon only */}
            <button
              onClick={onAttachClick}
              disabled={disabled || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: chatConfig.buttonHeight,
                height: chatConfig.buttonHeight,
                background: 'transparent',
                border: 'none',
                borderRadius: borderRadius.button,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
              className="hover:opacity-70"
            >
              <Paperclip size={chatConfig.iconSize} color={light.secondaryText} />
            </button>

            {/* Image Button - Icon only */}
            <button
              onClick={onImageClick}
              disabled={disabled || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: chatConfig.buttonHeight,
                height: chatConfig.buttonHeight,
                background: 'transparent',
                border: 'none',
                borderRadius: borderRadius.button,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
              className="hover:opacity-70"
            >
              <Image size={chatConfig.iconSize} color={light.secondaryText} />
            </button>
          </div>

          {/* Right Side - Send Button - EXACT blue from reference */}
          <button
            onClick={onSend}
            disabled={disabled || isLoading || !value.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: chatConfig.sendButtonWidth,
              height: chatConfig.buttonHeight,
              backgroundColor: light.blueButton,
              border: 'none',
              borderRadius: borderRadius.button,
              cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
              opacity: disabled || !value.trim() ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            className="hover:opacity-90"
          >
            {isLoading ? (
              <div 
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            ) : (
              <Send size={chatConfig.iconSize} color="white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}