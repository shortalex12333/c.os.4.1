import React from 'react';
import { Minimize2, X, ThumbsUp, ThumbsDown, MessageSquare, User } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface Attachment {
  name: string;
  size?: string;
}

interface EmailCardWithAttachmentsDarkProps {
  title?: string;
  description?: string;
  summaryTitle?: string;
  summaryItems?: string[];
  senderName?: string;
  senderEmail?: string;
  date?: string;
  subject?: string;
  attachments?: Attachment[];
  onMinimize?: () => void;
  onClose?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onLeaveFeedback?: () => void;
  onAttachmentClick?: (attachment: Attachment) => void;
}

export default function EmailCardWithAttachmentsDark({
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
  attachments = [
    { name: "Manual_Version_3.2.pdf" },
    { name: "Engine_221.png" },
    { name: "Screenshot_23.05.2023.15:07:23.heic" },
    { name: "Engineer_notes.docx" }
  ],
  onMinimize,
  onClose,
  onHelpful,
  onNotHelpful,
  onLeaveFeedback,
  onAttachmentClick
}: EmailCardWithAttachmentsDarkProps) {
  return (
    <div className="w-full mx-auto" style={{ maxWidth: designTokens.dimensions.emailCard.withAttachments.width }}>
      <div 
        className="relative flex flex-col"
        style={{
          width: designTokens.dimensions.emailCard.withAttachments.width,
          height: designTokens.dimensions.emailCard.withAttachments.height,
          backgroundColor: designTokens.colors.dark.cardBackground,
          border: `1px solid ${designTokens.colors.dark.cardBorder}`,
          borderRadius: designTokens.borderRadius.card,
          boxShadow: designTokens.shadows.cardDark,
          padding: 47
        }}
      >
        
        {/* Header Controls */}
        <div 
          className="absolute flex"
          style={{
            top: 47,
            right: 47,
            gap: designTokens.components.cards.controlGap
          }}
        >
          <button 
            onClick={onMinimize}
            className="hover:opacity-70 transition-opacity"
            style={{ color: designTokens.colors.dark.controlIcons }}
          >
            <Minimize2 size={designTokens.components.cards.controlSize} strokeWidth={2} />
          </button>
          <button 
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: designTokens.colors.dark.controlIcons }}
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
            color: designTokens.colors.dark.primaryText,
            marginBottom: 32,
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
            color: designTokens.colors.dark.secondaryText,
            marginBottom: 48,
            letterSpacing: '0.25px'
          }}
        >
          {description}
        </p>

        {/* Summary Section */}
        <div 
          style={{
            backgroundColor: designTokens.colors.dark.cardBackground,
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
                  color: designTokens.colors.dark.primaryText,
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
                backgroundColor: '#5A5A5A',
                borderRadius: '50%',
                width: 75,
                height: 75,
                padding: 12
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
                      color: designTokens.colors.dark.primaryText,
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
                      color: designTokens.colors.dark.secondaryText,
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
                    color: designTokens.colors.dark.secondaryText,
                    letterSpacing: '0.75px'
                  }}
                >
                  {date}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: 16, marginBottom: 24 }}>
            <span 
              style={{
                fontSize: 26,
                lineHeight: '32.5px',
                color: designTokens.colors.dark.primaryText,
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
                color: designTokens.colors.dark.secondaryText,
                letterSpacing: '0.75px'
              }}
            >
              {subject}
            </span>
          </div>
        </div>

        {/* Attachments Section */}
        <div 
          className="relative"
          style={{
            marginBottom: 32,
            backgroundColor: designTokens.colors.dark.cardBackground,
            borderRadius: 8,
            padding: 16,
            border: `1px solid ${designTokens.colors.dark.cardBorder}`
          }}
        >
          <div style={{ paddingRight: 32 }}>
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, color: designTokens.colors.dark.secondaryText }}>⌕</span>
                <button
                  onClick={() => onAttachmentClick?.(attachment)}
                  className="text-left hover:opacity-70 transition-opacity truncate flex-1"
                  style={{
                    fontSize: 26,
                    lineHeight: '32.5px',
                    color: designTokens.colors.dark.secondaryText,
                    letterSpacing: '0.75px'
                  }}
                >
                  {attachment.name}
                </button>
              </div>
            ))}
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute" style={{ right: 16, top: 16 }}>
            <div 
              style={{
                width: 16,
                height: 128,
                border: '2px solid #555555',
                borderRadius: 8,
                backgroundColor: designTokens.colors.dark.cardBackground,
                boxShadow: '0_4px_4px_0_rgba(0,0,0,0.2)',
                padding: 4
              }}
            >
              <div 
                style={{
                  width: '100%',
                  height: 32,
                  backgroundColor: 'rgba(176,176,176,0.3)',
                  borderRadius: 2
                }}
              ></div>
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
              border: `1px solid ${designTokens.colors.dark.greenButton}`,
              backgroundColor: designTokens.colors.dark.cardBackground,
              borderRadius: 12,
              boxShadow: '0_4px_4px_0_rgba(0,0,0,0.15)'
            }}
          >
            <ThumbsUp size={36} style={{ color: designTokens.colors.dark.primaryText }} />
            <span 
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: designTokens.colors.dark.primaryText,
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
              border: `1px solid ${designTokens.colors.dark.redButton}`,
              backgroundColor: designTokens.colors.dark.cardBackground,
              borderRadius: 12,
              boxShadow: '0_4px_4px_0_rgba(0,0,0,0.15)'
            }}
          >
            <ThumbsDown size={36} style={{ color: designTokens.colors.dark.primaryText }} />
            <span 
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: designTokens.colors.dark.primaryText,
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
              border: `1px solid ${designTokens.colors.dark.cardBorder}`,
              backgroundColor: designTokens.colors.dark.cardBackground,
              borderRadius: 12,
              boxShadow: '0_4px_4px_0_rgba(0,0,0,0.15)'
            }}
          >
            <MessageSquare size={32} style={{ color: designTokens.colors.dark.primaryText }} />
            <span 
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: designTokens.colors.dark.primaryText,
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