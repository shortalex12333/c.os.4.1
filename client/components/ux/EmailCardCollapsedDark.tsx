import React from 'react';
import { Minimize2, X, User } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface EmailCardCollapsedDarkProps {
  title?: string;
  senderName?: string;
  senderEmail?: string;
  date?: string;
  subject?: string;
  onExpand?: () => void;
  onClose?: () => void;
}

export default function EmailCardCollapsedDark({
  title = "April Engine Thread - CAT Fault and Servicing Log",
  senderName = "John Smith",
  senderEmail = "john.smith@cat_engines.com",
  date = "April 24th 2023",
  subject = "CAT-321 Main Engine Overview",
  onExpand,
  onClose
}: EmailCardCollapsedDarkProps) {
  const { dimensions, colors, typography, borderRadius, shadows, components } = designTokens;
  const { emailCard } = dimensions;
  const { dark } = colors;
  const { cards: cardConfig } = components;

  return (
    <div className="w-full" style={{ maxWidth: emailCard.collapsed.width, margin: '0 auto' }}>
      {/* Email Card Container - Dark Mode - EXACT 904 × 175 */}
      <div 
        style={{
          position: 'relative',
          width: emailCard.collapsed.width,
          height: emailCard.collapsed.height,
          backgroundColor: dark.cardBackground, // Dark gray #1F1F1F
          border: `1px solid ${dark.cardBorder}`,
          borderRadius: borderRadius.card, // 26px large radius
          boxShadow: shadows.cardDark, // Darker shadow for dark mode
          padding: cardConfig.padding, // 24px
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        
        {/* Header Controls - Top Right */}
        <div 
          style={{
            position: 'absolute',
            top: cardConfig.padding,
            right: cardConfig.padding,
            display: 'flex',
            gap: cardConfig.controlGap
          }}
        >
          <button 
            onClick={onExpand}
            style={{
              width: cardConfig.controlSize,
              height: cardConfig.controlSize,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              opacity: 1,
              transition: 'opacity 0.2s'
            }}
            className="hover:opacity-70"
          >
            <svg 
              width={cardConfig.controlSize} 
              height={cardConfig.controlSize} 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <path 
                d="M9.77778 22V19.7778H5.78889L10.7889 14.7778L9.22222 13.2111L4.22222 18.2111V14.2222H2V22H9.77778ZM14.7778 10.7889L19.7778 5.78889V9.77778H22V2H14.2222V4.22222H18.2111L13.2111 9.22222L14.7778 10.7889Z" 
                fill={dark.controlIcons}
              />
            </svg>
          </button>
          <button 
            onClick={onClose}
            style={{
              width: cardConfig.controlSizeLarge,
              height: cardConfig.controlSizeLarge,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              opacity: 1,
              transition: 'opacity 0.2s'
            }}
            className="hover:opacity-70"
          >
            <X size={cardConfig.controlSizeLarge} color={dark.controlIcons} strokeWidth={2} />
          </button>
        </div>

        {/* Email Title */}
        <div 
          style={{ 
            paddingRight: 80, // Space for controls
            marginBottom: cardConfig.titleMarginBottom
          }}
        >
          <h1 
            style={{
              fontSize: typography.cardTitle.fontSize,
              lineHeight: `${typography.cardTitle.lineHeight}px`,
              fontWeight: typography.cardTitle.fontWeight,
              color: dark.primaryText, // White text
              margin: 0,
              fontFamily: 'inherit'
            }}
          >
            {title}
          </h1>
        </div>

        {/* Email Sender Details - Collapsed View */}
        <div style={{ display: 'flex', alignItems: 'start', gap: cardConfig.controlSize }}>
          <div 
            style={{
              backgroundColor: '#5A5A5A', // Dark mode avatar background
              borderRadius: '50%',
              padding: cardConfig.avatarPadding,
              width: cardConfig.avatarSize,
              height: cardConfig.avatarSize,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <User size={30} color="white" />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start',
                marginBottom: 12
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h3 
                  style={{
                    fontSize: typography.bodyLarge.fontSize,
                    lineHeight: `${typography.bodyLarge.lineHeight}px`,
                    fontWeight: typography.label.fontWeight, // Medium weight
                    color: dark.primaryText, // White text
                    letterSpacing: '0.5px',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {senderName}
                </h3>
                <p 
                  style={{
                    fontSize: typography.bodyLarge.fontSize,
                    lineHeight: `${typography.bodyLarge.lineHeight}px`,
                    color: dark.secondaryText, // Light gray
                    letterSpacing: '0.5px',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {senderEmail}
                </p>
              </div>
              <span 
                style={{
                  fontSize: typography.bodyMedium.fontSize,
                  lineHeight: `${typography.bodyMedium.lineHeight}px`,
                  color: dark.secondaryText, // Light gray
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                  marginLeft: 16
                }}
              >
                {date}
              </span>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span 
                  style={{
                    fontSize: typography.bodyLarge.fontSize,
                    lineHeight: `${typography.bodyLarge.lineHeight}px`,
                    fontWeight: typography.label.fontWeight, // Medium weight
                    color: dark.primaryText, // White text
                    letterSpacing: '0.5px'
                  }}
                >
                  Subject:
                </span>
                <span 
                  style={{
                    fontSize: typography.bodyLarge.fontSize,
                    lineHeight: `${typography.bodyLarge.lineHeight}px`,
                    color: dark.secondaryText, // Light gray
                    letterSpacing: '0.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {subject}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}