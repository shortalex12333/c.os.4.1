import React from 'react';
import { CheckCircle } from 'lucide-react';
import { AISummary, formatConfidence } from '../utils/responseHelpers';

interface AISummaryBoxProps {
  data: AISummary | null;
  isDarkMode?: boolean;
  isMobile?: boolean;
}

/**
 * AI Summary Box - Displayed in AI mode only
 * Shows AI analysis with summary, findings, gaps, and recommendations
 * Supports both old format (summary) and new format (text)
 */
export function AISummaryBox({ data, isDarkMode = false, isMobile = false }: AISummaryBoxProps) {
  if (!data) return null;

  // Support both old format (summary) and new format (text)
  const summaryText = data.text || data.summary;
  if (!summaryText) return null;

  return (
    <div
      className="ai_summary_box mb-6 rounded-2xl overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.02) 100%)',
        border: isDarkMode
          ? '1px solid rgba(34, 197, 94, 0.2)'
          : '1px solid rgba(34, 197, 94, 0.15)',
        boxShadow: '0 4px 16px rgba(34, 197, 94, 0.1)'
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
          borderBottomColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'
        }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle
            className="flex-shrink-0"
            style={{
              color: isDarkMode ? '#4ade80' : '#16a34a',
              width: isMobile ? '20px' : '24px',
              height: isMobile ? '20px' : '24px'
            }}
          />
          <div className="flex-1">
            <h3
              className="font-semibold"
              style={{
                fontSize: isMobile ? '16px' : '18px',
                color: isDarkMode ? '#4ade80' : '#16a34a',
                fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              AI Analysis
            </h3>
          </div>
          {data.confidence !== undefined && (
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                color: isDarkMode ? '#4ade80' : '#16a34a'
              }}
            >
              {formatConfidence(data.confidence)} confidence
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Summary */}
        <div>
          <h4
            className="font-semibold mb-2"
            style={{
              fontSize: isMobile ? '14px' : '15px',
              color: isDarkMode ? '#e5e7eb' : '#374151',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            Summary
          </h4>
          <p
            className="leading-relaxed"
            style={{
              fontSize: isMobile ? '14px' : '15px',
              color: isDarkMode ? '#d1d5db' : '#4b5563',
              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {summaryText}
          </p>
        </div>

        {/* Key Findings */}
        {data.key_findings && (
          <div>
            <h4
              className="font-semibold mb-2"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Key Findings
            </h4>
            <p
              className="leading-relaxed"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#d1d5db' : '#4b5563',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {data.key_findings}
            </p>
          </div>
        )}

        {/* Gaps */}
        {data.gaps && (
          <div>
            <h4
              className="font-semibold mb-2"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Information Gaps
            </h4>
            <p
              className="leading-relaxed"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#d1d5db' : '#4b5563',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {data.gaps}
            </p>
          </div>
        )}

        {/* Recommendation */}
        {data.recommendation && (
          <div>
            <h4
              className="font-semibold mb-2"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Recommendation
            </h4>
            <p
              className="leading-relaxed"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#d1d5db' : '#4b5563',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {data.recommendation}
            </p>
          </div>
        )}

        {/* Sources Used */}
        {data.sources_used && data.sources_used.length > 0 && (
          <div>
            <h4
              className="font-semibold mb-2"
              style={{
                fontSize: isMobile ? '14px' : '15px',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Sources Referenced
            </h4>
            <ul className="space-y-2">
              {data.sources_used.map((source, idx) => (
                <li key={idx}>
                  <a
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline transition-colors"
                    style={{
                      fontSize: isMobile ? '13px' : '14px',
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    <span>📄 {source.doc}</span>
                    {source.page && <span>(Page {source.page})</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
