import React from 'react';
import { Minimize2, X, ThumbsUp, ThumbsDown, Sparkles, BookOpen } from 'lucide-react';
import { designTokens } from '../../design-tokens';

interface AISource {
  doc_name: string;
  page?: number;
  relevance?: string;
}

interface AIResponseCardLightProps {
  answer: string;
  sources?: AISource[];
  modelUsed?: string;
  reasoning?: string;
  onMinimize?: () => void;
  onClose?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
}

export default function AIResponseCardLight({
  answer = "Based on the MTU 2000 Series Manual, to troubleshoot fuel pressure faults, you should first check the fuel filter for contamination or blockage. Remove and inspect the filter element for rust particles or debris. If contamination is found, replace the filter and investigate the fuel tank for corrosion. Next, verify the fuel pressure sensor connections and test the sensor output. The normal operating pressure should be between 3.5-4.5 bar at idle and 5.5-6.5 bar under load.",
  sources = [
    { doc_name: "MTU 2000 Series Manual", page: 247, relevance: "89%" },
    { doc_name: "Fuel System Diagnostics Guide", page: 34, relevance: "76%" }
  ],
  modelUsed = "qwen2.5:14b-instruct-q4_K_M",
  reasoning = "Selected 14B model based on query complexity",
  onMinimize,
  onClose,
  onHelpful,
  onNotHelpful
}: AIResponseCardLightProps) {

  // Extract model tier for display
  const modelTier = modelUsed?.includes('14b') ? '14B' : modelUsed?.includes('7b') ? '7B' : 'Unknown';

  return (
    <div className="w-full mx-auto" style={{ maxWidth: designTokens.dimensions.nasCard.expanded.width }}>
      <div
        className="relative flex flex-col"
        style={{
          width: designTokens.dimensions.nasCard.expanded.width,
          minHeight: designTokens.dimensions.nasCard.expanded.height,
          backgroundColor: designTokens.colors.light.cardBackground,
          border: `2px solid #7C3AED`,
          borderRadius: designTokens.borderRadius.card,
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)',
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

        {/* AI Analysis Badge */}
        <div className="flex items-center" style={{ gap: 12, marginBottom: 24 }}>
          <div
            className="flex items-center"
            style={{
              gap: 8,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              backgroundColor: '#F5F3FF',
              border: '1px solid #7C3AED',
              borderRadius: 8
            }}
          >
            <Sparkles size={20} style={{ color: '#7C3AED' }} />
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#7C3AED',
                letterSpacing: '0.5px'
              }}
            >
              AI Analysis
            </span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: '#616874',
              letterSpacing: '0.3px'
            }}
          >
            Model: {modelTier}
          </span>
        </div>

        {/* Answer Content */}
        <div
          style={{
            fontSize: 26,
            lineHeight: '38px',
            color: designTokens.colors.light.primaryText,
            marginBottom: 32,
            letterSpacing: '0.3px',
            maxWidth: 676
          }}
        >
          {answer}
        </div>

        {/* Sources Section */}
        {sources && sources.length > 0 && (
          <div
            style={{
              backgroundColor: '#F7F8F9',
              borderRadius: 13,
              padding: 24,
              marginBottom: 32
            }}
          >
            <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
              <BookOpen size={22} style={{ color: '#7C3AED' }} />
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#7C3AED',
                  letterSpacing: '0.5px'
                }}
              >
                Sources Referenced
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center"
                  style={{ gap: 12 }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: '#7C3AED',
                      borderRadius: '50%'
                    }}
                  />
                  <span
                    style={{
                      fontSize: 22,
                      lineHeight: '28px',
                      color: designTokens.colors.light.primaryText,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {source.doc_name}
                    {source.page && ` (Page ${source.page})`}
                    {source.relevance && (
                      <span style={{ color: '#616874', marginLeft: 8 }}>
                        • {source.relevance} relevant
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Info Footer */}
        {reasoning && (
          <div
            style={{
              fontSize: 18,
              color: '#616874',
              fontStyle: 'italic',
              marginBottom: 32,
              letterSpacing: '0.3px'
            }}
          >
            {reasoning}
          </div>
        )}

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
        </div>
      </div>
    </div>
  );
}
