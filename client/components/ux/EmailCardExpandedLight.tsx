import React from 'react';
import { Minimize2, X, ThumbsUp, ThumbsDown, MessageSquare, User, Paperclip } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface EmailCardExpandedLightProps {
  title?: string;
  description?: string;
  summaryTitle?: string;
  summaryItems?: string[];
  senderName?: string;
  senderEmail?: string;
  date?: string;
  subject?: string;
  attachmentCount?: number;
  onMinimize?: () => void;
  onClose?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onLeaveFeedback?: () => void;
}

export default function EmailCardExpandedLight({
  title = "April Engine Thread - CAT Fault and Servicing Log",
  description = "Fuel pressure sensor fault detected on starboard main engine.",
  summaryTitle = "Summary of Parts Needed:",
  summaryItems = [
    "New Injectors needed (on two engines).",
    "New 32MM Flexible hose ordered (Arriving March 2026)",
    "Replacement Fridge for ECR (Arriving in Shipyard)"
  ],
  senderName = "John Smith",
  senderEmail = "john.smith@cat_engines.com",
  date = "April 24th 2023",
  subject = "CAT-321 Main Engine Overview",
  attachmentCount = 2,
  onMinimize,
  onClose,
  onHelpful,
  onNotHelpful,
  onLeaveFeedback
}: EmailCardExpandedLightProps) {
  return (
    <div className="w-full mx-auto" style={{ maxWidth: designTokens.dimensions.emailCard.expanded.width }}>
      <div 
        className="relative flex flex-col"
        style={{
          width: designTokens.dimensions.emailCard.expanded.width,
          height: designTokens.dimensions.emailCard.expanded.height,
          backgroundColor: designTokens.colors.light.cardBackground,
          border: `1px solid ${designTokens.colors.light.cardBorder}`,
          borderRadius: designTokens.borderRadius.card,
          boxShadow: designTokens.shadows.card,
          padding: designTokens.components.cards.padding
        }}
      >
        
        {/* Header Controls */}
        <div 
          className="absolute flex"
          style={{
            top: designTokens.components.cards.padding,
            right: designTokens.components.cards.padding,
            gap: designTokens.components.cards.controlGap
          }}
        >
          <button 
            onClick={onMinimize}
            className="hover:opacity-70 transition-opacity"
            style={{ color: designTokens.colors.light.controlIcons }}
          >
            <Minimize2 size={designTokens.components.cards.controlSize} strokeWidth={2} />
          </button>
          <button 
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: designTokens.colors.light.controlIcons }}
          >
            <X size={designTokens.components.cards.controlSizeLarge} strokeWidth={2} />
          </button>
        </div>

        {/* Main Title */}
        <h1 
          style={{
            fontSize: designTokens.typography.cardTitle.fontSize,
            lineHeight: `${designTokens.typography.cardTitle.lineHeight}px`,
            fontWeight: designTokens.typography.cardTitle.fontWeight,
            color: designTokens.colors.light.primaryText,
            marginBottom: designTokens.components.cards.titleMarginBottom,
            maxWidth: 676,
            paddingRight: 64
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p 
          style={{
            fontSize: 26,
            lineHeight: '26px',
            color: designTokens.colors.light.secondaryText,
            marginBottom: 48,
            letterSpacing: '0.25px'
          }}
        >
          {description}
        </p>

        {/* Summary Section */}
        <div 
          style={{
            backgroundColor: '#F7F8F9',
            borderRadius: 13,
            padding: 32,
            marginBottom: 32
          }}
        >
          <h2 
            style={{
              fontSize: 26,
              lineHeight: '26px',
              color: '#46A450',
              marginBottom: 24
            }}
          >
            {summaryTitle}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summaryItems.map((item, index) => (
              <p 
                key={index}
                style={{
                  fontSize: 26,
                  lineHeight: '26.5px',
                  color: designTokens.colors.light.primaryText,
                  letterSpacing: '1px'
                }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>

        {/* Email Sender Details */}
        <div style={{ marginBottom: 32 }}>
          <div 
            className="flex items-start"
            style={{ gap: 24, marginBottom: 24 }}
          >
            <div 
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: '#CDCDCD',
                borderRadius: '50%',
                width: designTokens.components.cards.avatarSize,
                height: designTokens.components.cards.avatarSize,
                padding: designTokens.components.cards.avatarPadding
              }}
            >
              <User size={40} style={{ color: 'white' }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h3 
                    className="truncate"
                    style={{
                      fontSize: 32,
                      lineHeight: '32.5px',
                      color: designTokens.colors.light.primaryText,
                      fontWeight: 500,
                      letterSpacing: '0.75px'
                    }}
                  >
                    {senderName}
                  </h3>
                  <p 
                    className="truncate"
                    style={{
                      fontSize: 24,
                      lineHeight: '32.5px',
                      color: designTokens.colors.light.secondaryText,
                      letterSpacing: '0.75px'
                    }}
                  >
                    {senderEmail}
                  </p>
                </div>
                <span 
                  className="flex-shrink-0"
                  style={{
                    fontSize: 20,
                    lineHeight: '32.5px',
                    color: designTokens.colors.light.secondaryText,
                    letterSpacing: '0.75px'
                  }}
                >
                  {date}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div className="flex items-center" style={{ gap: 16 }}>
              <span 
                style={{
                  fontSize: 26,
                  lineHeight: '32.5px',
                  color: designTokens.colors.light.primaryText,
                  fontWeight: 500,
                  letterSpacing: '0.75px'
                }}
              >
                Subject:
              </span>
              <span 
                style={{
                  fontSize: 26,
                  lineHeight: '32.5px',
                  color: '#616874',
                  letterSpacing: '0.75px'
                }}
              >
                {subject}
              </span>
            </div>
            
            {/* Attachments Count */}
            <div className="flex items-center" style={{ gap: 8 }}>
              <Paperclip size={18} style={{ color: '#616874' }} />
              <span 
                style={{
                  fontSize: 20,
                  color: '#616874',
                  letterSpacing: '0.5px'
                }}
              >
                {attachmentCount} Attachments
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Buttons */}
        <div className="flex" style={{ gap: 56 }}>
          <button 
            onClick={onHelpful}
            className="flex items-center hover:opacity-90 transition-opacity"
            style={{
              gap: 12,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
              border: `1px solid ${designTokens.colors.light.greenButton}`,
              backgroundColor: '#FEFFFF',
              borderRadius: 12,
              boxShadow: '0_4px_4px_0_rgba(0,0,0,0.06)'
            }}
          >
            <ThumbsUp size={36} style={{ color: designTokens.colors.light.primaryText }} />
            <span 
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: designTokens.colors.light.primaryText,
                letterSpacing: '0.7px'
              }}
            >
              Helpful
            </span>
          </button>

          <button 
            onClick={onNotHelpful}
            className="flex items-center hover:opacity-90 transition-opacity"
            style={{
              gap: 12,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
              border: `1px solid ${designTokens.colors.light.redButton}`,
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0_4px_4px_0_rgba(0,0,0,0.06)'
            }}
          >
            <ThumbsDown size={36} style={{ color: designTokens.colors.light.primaryText }} />
            <span 
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: designTokens.colors.light.primaryText,
                letterSpacing: '0.7px'
              }}
            >
              Not Helpful
            </span>
          </button>

          <button 
            onClick={onLeaveFeedback}
            className="flex items-center hover:opacity-90 transition-opacity"
            style={{
              gap: 12,
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 12,
              paddingBottom: 12,
              border: `1px solid ${designTokens.colors.light.cardBorder}`,
              backgroundColor: '#FFFEFF',
              borderRadius: 12,
              boxShadow: '0_4px_4px_0_rgba(0,0,0,0.06)'
            }}
          >
            <MessageSquare size={32} style={{ color: designTokens.colors.light.primaryText }} />
            <span 
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: designTokens.colors.light.primaryText,
                letterSpacing: '0.7px'
              }}
            >
              Leave Feedback
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}