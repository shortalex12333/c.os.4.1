import React from 'react';
import { Maximize2, X, ChevronDown } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface NASCardCollapsedDarkProps {
  title?: string;
  source?: string;
  onExpand?: () => void;
  onClose?: () => void;
  onSourceDropdown?: () => void;
}

export default function NASCardCollapsedDark({
  title = "Error Code E-047 -Fuel...",
  source = "MTU 2000 Series Manual, Page 247, Section 4.2",
  onExpand,
  onClose,
  onSourceDropdown
}: NASCardCollapsedDarkProps) {
  const { dimensions, colors, typography, borderRadius, shadows, components } = designTokens;
  const { nasCard } = dimensions;
  const { dark } = colors;
  const { cards: cardConfig } = components;

  return (
    <div className="w-full" style={{ maxWidth: nasCard.collapsed.width, margin: '0 auto' }}>
      {/* NAS Solution Card Container - Dark Mode - EXACT 904 × 175 */}
      <div 
        style={{
          position: 'relative',
          width: nasCard.collapsed.width,
          height: nasCard.collapsed.height,
          backgroundColor: dark.cardBackground, // Dark gray #1F1F1F
          border: `1px solid ${dark.cardBorder}`,
          borderRadius: borderRadius.card, // 26px large radius
          boxShadow: shadows.cardDark, // Darker shadow
          padding: cardConfig.padding, // 24px
          display: 'flex',
          alignItems: 'center',
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
            gap: 8 // Smaller gap for NAS cards
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
            <Maximize2 size={cardConfig.controlSize} color={dark.controlIcons} strokeWidth={2} />
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

        {/* Main Content Area */}
        <div 
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            paddingRight: 80, // Space for controls
            flex: 1
          }}
        >
          {/* Error Code Title */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
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

          {/* Source Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span 
              style={{
                fontSize: typography.labelLarge.fontSize,
                lineHeight: `${typography.labelLarge.lineHeight}px`,
                fontWeight: typography.labelLarge.fontWeight,
                color: dark.primaryText, // White text
                letterSpacing: '0.5px'
              }}
            >
              Source:
            </span>
            <span 
              style={{
                fontSize: typography.labelLarge.fontSize,
                lineHeight: `${typography.labelLarge.lineHeight}px`,
                fontWeight: typography.labelLarge.fontWeight,
                color: dark.secondaryText, // Light gray
                letterSpacing: '0.5px',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {source}
            </span>
            <button 
              onClick={onSourceDropdown}
              style={{
                width: 20,
                height: 20,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transform: 'rotate(-90deg)', // Rotated chevron
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronDown size={20} color={dark.dropdownIcon} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}