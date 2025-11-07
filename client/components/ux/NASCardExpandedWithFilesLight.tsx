import React from 'react';
import { Minimize2, X, ThumbsUp, ThumbsDown, MessageSquare, FileText, Sparkles } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface FileAttachment {
  name: string;
  path?: string;
}

interface NASCardExpandedWithFilesLightProps {
  title?: string;
  description?: string;
  diagnosticsTitle?: string;
  diagnosticsItems?: string[];
  source?: string;
  files?: FileAttachment[];
  onMinimize?: () => void;
  onClose?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onLeaveFeedback?: () => void;
  onFileClick?: (file: FileAttachment) => void;
  onAskAI?: () => void;
}

export default function NASCardExpandedWithFilesLight({
  title = "Error Code E-047 -Fuel Pressure Fault",
  description = "Fuel pressure sensor fault detected on starboard main engine.",
  diagnosticsTitle = "Fuel System Diagnostics",
  diagnosticsItems = [
    "Remove and inspect filter for rust or blockage.",
    "Confirm filter integrity; replace if necessary.",
    "Inspect for coolant leaks (Shell WHG-X5, purple)"
  ],
  source = "MTU 2000 Series Manual, Page 247, Section 4.2",
  files = [
    { name: "/E/Engineers/Main_Engine/Genivs/Manual.pdf" },
    { name: "Source: Hansen's Handover, Page 4" },
    { name: "/E/Engineers/Main_Engine/Handover/..." },
    { name: "Source: Wartsilla Inspection, Page 27." }
  ],
  onMinimize,
  onClose,
  onHelpful,
  onNotHelpful,
  onLeaveFeedback,
  onFileClick,
  onAskAI
}: NASCardExpandedWithFilesLightProps) {
  return (
    <div className="w-full mx-auto" style={{ maxWidth: designTokens.dimensions.nasCard.withFiles.width }}>
      <div 
        className="relative flex flex-col"
        style={{
          width: designTokens.dimensions.nasCard.withFiles.width,
          height: designTokens.dimensions.nasCard.withFiles.height,
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

        {/* Diagnostics Section */}
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
            {diagnosticsTitle}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {diagnosticsItems.map((item, index) => (
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

        {/* Source Section */}
        <div style={{ marginBottom: 32 }}>
          <div className="flex items-center" style={{ gap: 16, marginBottom: 16 }}>
            <span 
              style={{
                fontSize: 26,
                lineHeight: '32.5px',
                color: designTokens.colors.light.primaryText,
                fontWeight: 500,
                letterSpacing: '0.75px'
              }}
            >
              Source:
            </span>
            <span 
              style={{
                fontSize: 26,
                lineHeight: '32.5px',
                color: '#616874',
                letterSpacing: '0.75px'
              }}
            >
              {source}
            </span>
          </div>
          
          {/* Files Section */}
          <div 
            className="relative"
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              padding: 16
            }}
          >
            <div style={{ paddingRight: 32 }}>
              {files.map((file, index) => (
                <div key={index} className="flex items-center" style={{ gap: 12, marginBottom: 8 }}>
                  <div 
                    className="flex items-center justify-center"
                    style={{ width: 16, height: 16 }}
                  >
                    <FileText size={14} style={{ color: '#616874' }} />
                  </div>
                  <button
                    onClick={() => onFileClick?.(file)}
                    className="text-left hover:opacity-70 transition-opacity truncate flex-1"
                    style={{
                      fontSize: 20,
                      lineHeight: '28px',
                      color: '#616874',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {file.name}
                  </button>
                </div>
              ))}
            </div>
            
            {/* Scroll indicator */}
            <div className="absolute" style={{ right: 16, top: 16 }}>
              <div 
                style={{
                  width: 16,
                  height: 96,
                  border: '2px solid #D0D1D5',
                  borderRadius: 8,
                  backgroundColor: 'white',
                  boxShadow: '0_2px_4px_0_rgba(0,0,0,0.04)',
                  padding: 4
                }}
              >
                <div 
                  style={{
                    width: '100%',
                    height: 32,
                    backgroundColor: 'rgba(63,67,80,0.24)',
                    borderRadius: 2
                  }}
                ></div>
              </div>
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

        {/* Ask AI Button */}
        <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${designTokens.colors.light.cardBorder}` }}>
          <button
            onClick={onAskAI}
            className="flex items-center hover:opacity-90 transition-all hover:shadow-lg"
            style={{
              gap: 12,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 14,
              paddingBottom: 14,
              border: '2px solid #7C3AED',
              backgroundColor: '#F5F3FF',
              borderRadius: 14,
              boxShadow: '0_4px_8px_0_rgba(124,58,237,0.15)'
            }}
          >
            <Sparkles size={32} style={{ color: '#7C3AED' }} />
            <span
              style={{
                fontSize: 28,
                lineHeight: '36.4px',
                color: '#7C3AED',
                fontWeight: 600,
                letterSpacing: '0.7px'
              }}
            >
              Ask AI?
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}