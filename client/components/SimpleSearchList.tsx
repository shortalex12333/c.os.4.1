import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { openDocument } from '../services/documentJWTService';

interface Solution {
  // Universal fields (both emails and documents)
  id: string;
  display_name?: string;
  match_ratio?: number;
  relevance_score?: number;
  confidence?: number;
  content_preview?: string;
  snippet?: string;
  links?: {
    document?: string;
    web?: string;        // Email web link
    desktop?: string;    // Email desktop protocol
  };
  doc_link?: string;

  // Document-specific fields
  filename?: string;
  title?: string;
  best_page?: number;
  all_pages?: number[];

  // Email-specific fields
  subject?: string;
  sender?: {
    name: string;
    email: string;
  };
  received_date?: string;
  receivedDateTime?: string;
  has_attachments?: boolean;
  hasAttachments?: boolean;
  entity_boost?: number;
  entity_coverage?: number;
  search_type?: string; // "lexical" or "attachment_rescued"

  // Metadata
  metadata?: {
    matched_entities?: Array<{
      term: string;
      type: string;
      weight: number;
      contribution: number;
    }>;
    importance?: string;
    is_read?: boolean;
    categories?: string[];
    conversation_id?: string;
  };
}

interface SimpleSearchListProps {
  solutions: Solution[];
  isDarkMode?: boolean;
  isMobile?: boolean;
  onHandover?: (solution: Solution) => void;
}

/**
 * SimpleSearchList - Minimalist search results display for search_mode
 *
 * Confidence-based cascade:
 * - >= 0.6: Expanded format (show content, buttons)
 * - < 0.6: Collapsed in "More results" dropdown
 */
export function SimpleSearchList({
  solutions,
  isDarkMode = false,
  isMobile = false,
  onHandover
}: SimpleSearchListProps) {
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showMoreResults, setShowMoreResults] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);

  // Confidence thresholds
  const HIGH_CONFIDENCE = 0.6;    // 60%
  const MEDIUM_CONFIDENCE = 0.4;  // 40%

  // Helper: Get confidence score with fallback chain
  const getConfidence = (sol: Solution): number => {
    return sol.match_ratio ?? sol.relevance_score ?? sol.confidence ?? 0;
  };

  // Helper: Get confidence indicator (colored dot)
  const getConfidenceIndicator = (confidence: number): { color: string; emoji: string } => {
    if (confidence >= HIGH_CONFIDENCE) {
      return { color: 'text-green-500', emoji: '🟢' };
    } else if (confidence >= MEDIUM_CONFIDENCE) {
      return { color: 'text-yellow-500', emoji: '🟡' };
    } else {
      return { color: 'text-red-500', emoji: '🔴' };
    }
  };

  // Cascading display: Position-based (NOT confidence-based filtering)
  // This ensures all results are shown in sorted order
  const primary = solutions.slice(0, 5);      // Top 5: Always visible
  const other = solutions.slice(5, 10);       // Positions 6-10: "More results"
  const all = solutions.slice(10, 15);        // Positions 11-15: "All documents"
  const hidden = solutions.slice(15);         // Overflow (not shown)

  // Toggle item expansion
  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get document title
  const getTitle = (sol: Solution): string => {
    return sol.display_name || sol.filename || sol.title || 'Document';
  };

  // Get page display text (short format for header)
  const getPageShort = (sol: Solution): string | null => {
    if (sol.best_page) {
      return `p.${sol.best_page}`;
    }
    if (sol.all_pages && sol.all_pages.length > 0) {
      return `p.${sol.all_pages[0]}`;
    }
    return null;
  };

  // Get document link
  const getDocLink = (sol: Solution): string | null => {
    return sol.links?.document || sol.doc_link || null;
  };

  // Get content preview - MORE AGGRESSIVE TRUNCATION
  const getContent = (sol: Solution): string | null => {
    // FIXED: Added sol.text as fallback (nas_processor.js uses 'text' field)
    const content = sol.content_preview || sol.snippet || (sol as any).text || null;
    if (!content) return null;

    // Much more aggressive truncation for cleaner UI
    // Only show first 120 characters (about 2 lines)
    if (content.length > 120) {
      return content.substring(0, 120) + '...';
    }
    return content;
  };

  // Empty state
  if (solutions.length === 0) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <p className="text-lg">No documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: Search count */}
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Searched {solutions.length} document{solutions.length !== 1 ? 's' : ''}.
      </div>

      {/* PRIMARY RESULTS - Always Visible (Top 5) */}
      {primary.length > 0 && (
        <div className="space-y-3">
          {primary.map((solution) => {
            const isExpanded = expandedItems.has(solution.id);
            const title = getTitle(solution);
            const pageShort = getPageShort(solution);
            const content = getContent(solution);
            const docLink = getDocLink(solution);
            const confidence = getConfidence(solution);
            const indicator = getConfidenceIndicator(confidence);

            return (
              <div
                key={solution.id}
                className={`rounded-lg border ${
                  isDarkMode
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-white border-gray-200'
                } overflow-hidden`}
              >
                {/* Header - Always visible */}
                <button
                  onClick={() => toggleItem(solution.id)}
                  className={`w-full px-4 py-2 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
                    isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 text-left">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {title}
                    </span>
                  </div>
                </button>

                {/* Expanded Content - COMPACT SPACING */}
                {isExpanded && (
                  <div className={`px-4 pb-2 pt-3 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
                    {/* Content Preview + Page Links Combined */}
                    <div className={`text-sm`}>
                      {content && (
                        <div className={`leading-snug mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {content}
                        </div>
                      )}

                      {/* Page Links - Inline and compact */}
                      {solution.all_pages && solution.all_pages.length > 0 && docLink && (
                        <div className={`inline ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="text-xs font-semibold">Pages: </span>
                        {solution.all_pages.map((page, idx) => (
                          <span key={page}>
                            <button
                              className="text-blue-500 hover:text-blue-600 underline text-xs font-semibold mx-0.5 cursor-pointer border-none bg-transparent p-0"
                              onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();

                                // Comprehensive list of PDF page navigation formats
                                // Ordered by likelihood of success
                                const pageFormats = [
                                  `${docLink}#page=${page}`,                      // Standard PDF anchor (most common)
                                  `${docLink}?page=${page}`,                      // Query parameter (server-side)
                                  `${docLink}?page=${page}#page=${page}`,         // Combined query + hash
                                  `${docLink}#p=${page}`,                         // Short anchor format
                                  `${docLink}#view=FitH&page=${page}`,            // Adobe with FitH view
                                  `${docLink}#view=Fit&page=${page}`,             // Adobe with Fit view
                                  `${docLink}#nameddest=page${page}`,             // Adobe named destination
                                  `${docLink}#zoom=100&page=${page}`,             // With zoom level
                                  `${docLink}#pagemode=bookmarks&page=${page}`,   // With bookmarks visible
                                  `${docLink}#view=Fit&pagemode=none&page=${page}`, // Open action
                                  `${docLink}#toolbar=0&page=${page}`,            // Hide toolbar
                                  `${docLink}#navpanes=0&page=${page}`,           // Hide nav panes
                                ];

                                console.log(`Attempting to open document to page ${page}`);

                                // Try primary format first
                                const primaryFormat = pageFormats[0];
                                console.log(`Primary format: ${primaryFormat}`);
                                const newWindow = window.open(primaryFormat, '_blank');

                                // If window opened, attempt multiple navigation strategies
                                if (newWindow) {
                                  // Strategy 1: Wait for load event
                                  newWindow.onload = () => {
                                    console.log('PDF window loaded, attempting navigation...');

                                    // Try multiple navigation attempts with delays
                                    const navigationAttempts = [
                                      { delay: 500, method: 'hash' },
                                      { delay: 1000, method: 'pdfjs' },
                                      { delay: 1500, method: 'replace' },
                                      { delay: 2000, method: 'fallback' }
                                    ];

                                    navigationAttempts.forEach(({ delay, method }) => {
                                      setTimeout(() => {
                                        try {
                                          switch (method) {
                                            case 'hash':
                                              // Method 1: Direct hash change
                                              newWindow.location.hash = `page=${page}`;
                                              console.log(`Attempted hash navigation: #page=${page}`);
                                              break;

                                            case 'pdfjs':
                                              // Method 2: PDF.js API if available
                                              if (newWindow.PDFViewerApplication) {
                                                newWindow.PDFViewerApplication.page = page;
                                                console.log(`PDF.js navigation successful to page ${page}`);
                                              } else if (newWindow.PDFView) {
                                                newWindow.PDFView.page = page;
                                                console.log(`PDFView navigation to page ${page}`);
                                              }
                                              break;

                                            case 'replace':
                                              // Method 3: Try alternative formats
                                              if (!newWindow.PDFViewerApplication) {
                                                // Try query parameter format as fallback
                                                newWindow.location.replace(`${docLink}?page=${page}`);
                                                console.log(`Replaced with query parameter format`);
                                              }
                                              break;

                                            case 'fallback':
                                              // Method 4: Final fallback - try all formats
                                              if (!newWindow.PDFViewerApplication && !newWindow.closed) {
                                                // Try each format until one works
                                                for (let i = 1; i < Math.min(5, pageFormats.length); i++) {
                                                  try {
                                                    newWindow.location.href = pageFormats[i];
                                                    console.log(`Fallback format ${i}: ${pageFormats[i]}`);
                                                    break;
                                                  } catch (e) {
                                                    continue;
                                                  }
                                                }
                                              }
                                              break;
                                          }
                                        } catch (e) {
                                          console.log(`Navigation attempt failed (${method}):`, e.message);
                                        }
                                      }, delay);
                                    });
                                  };

                                  // Strategy 2: Immediate attempt (don't wait for load)
                                  setTimeout(() => {
                                    try {
                                      newWindow.location.hash = `page=${page}`;
                                    } catch (e) {
                                      console.log('Immediate navigation failed:', e.message);
                                    }
                                  }, 100);
                                } else {
                                  console.error('Failed to open PDF window - check popup blocker');
                                }
                              }}
                            >
                              {page}
                            </button>
                            {idx < solution.all_pages.length - 1 && <span className="font-semibold text-xs">, </span>}
                          </span>
                        ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Compact spacing */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {docLink && (
                        <button
                          onClick={async () => {
                            try {
                              // Check if this is an external URL (email) or local document
                              if (docLink.startsWith('http://') || docLink.startsWith('https://')) {
                                // External URL (email) - open directly
                                window.open(docLink, '_blank', 'noopener,noreferrer');
                              } else {
                                // Local document - use JWT authentication
                                await openDocument(docLink, user?.userId || 'unknown', user?.role || 'chief_engineer');
                              }
                            } catch (error) {
                              console.error('Failed to open document:', error);
                              alert('Failed to open document. Please try again.');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border transition-colors inline-flex items-center gap-2 text-sm ${
                            isDarkMode
                              ? 'border-neutral-700 text-gray-200 hover:bg-neutral-800'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>Open document</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {onHandover && (
                        <button
                          onClick={() => onHandover(solution)}
                          className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            isDarkMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          Add to Handover
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MORE RESULTS - Cascading Dropdown (Other + All) */}
      {(other.length > 0 || all.length > 0) && (
        <div className="mt-4">
          <button
            onClick={() => setShowMoreResults(!showMoreResults)}
            className={`flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors font-medium`}
          >
            <span>More results</span>
            {showMoreResults ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {showMoreResults && (
            <div className={`mt-3 space-y-2 pl-4 border-l-2 ${
              isDarkMode ? 'border-neutral-700' : 'border-gray-200'
            }`}>
              {/* OTHER RESULTS (Positions 6-10) - Simple list */}
              {other.map((solution) => {
                const title = getTitle(solution);
                const pageShort = getPageShort(solution);
                const docLink = getDocLink(solution);
                const confidence = getConfidence(solution);
                const indicator = getConfidenceIndicator(confidence);

                return (
                  <div
                    key={solution.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {title}
                      </span>
                      {pageShort && (
                        <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {pageShort}
                        </span>
                      )}
                    </div>
                    {docLink && (
                      <button
                        onClick={async () => {
                          try {
                            if (docLink.startsWith('http://') || docLink.startsWith('https://')) {
                              window.open(docLink, '_blank', 'noopener,noreferrer');
                            } else {
                              await openDocument(docLink, user?.userId || 'unknown', user?.role || 'chief_engineer');
                            }
                          } catch (error) {
                            console.error('Failed to open document:', error);
                            alert('Failed to open document. Please try again.');
                          }
                        }}
                        className="text-blue-500 hover:text-blue-600 text-sm font-medium ml-4"
                      >
                        Open
                      </button>
                    )}
                  </div>
                );
              })}

              {/* ALL DOCUMENTS (Positions 11-15) - Nested Dropdown */}
              {all.length > 0 && (
                <div className="mt-2 pt-2">
                  <button
                    onClick={() => setShowAllDocuments(!showAllDocuments)}
                    className={`flex items-center gap-2 text-sm ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                    } transition-colors`}
                  >
                    <span>All documents</span>
                    {showAllDocuments ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {showAllDocuments && (
                    <div className={`mt-2 space-y-2 pl-4 border-l ${
                      isDarkMode ? 'border-neutral-800' : 'border-gray-300'
                    }`}>
                      {all.map((solution) => {
                        const title = getTitle(solution);
                        const pageShort = getPageShort(solution);
                        const docLink = getDocLink(solution);
                        const confidence = getConfidence(solution);
                        const indicator = getConfidenceIndicator(confidence);

                        return (
                          <div
                            key={solution.id}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {title}
                              </span>
                              {pageShort && (
                                <span className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                                  {pageShort}
                                </span>
                              )}
                            </div>
                            {docLink && (
                              <button
                                onClick={async () => {
                                  try {
                                    if (docLink.startsWith('http://') || docLink.startsWith('https://')) {
                                      window.open(docLink, '_blank', 'noopener,noreferrer');
                                    } else {
                                      await openDocument(docLink, user?.userId || 'unknown', user?.role || 'chief_engineer');
                                    }
                                  } catch (error) {
                                    console.error('Failed to open document:', error);
                                    alert('Failed to open document. Please try again.');
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-600 text-xs font-medium ml-4"
                              >
                                Open
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
