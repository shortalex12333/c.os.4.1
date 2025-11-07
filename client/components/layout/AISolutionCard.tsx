import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Copy, AlertTriangle, Info, CheckCircle, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveHandover, getOrCreateSessionId, type HandoverPayload } from '../../services/handoverService';
import { useAuth } from '../../contexts/AuthContext';
import { openDocument } from '../../services/documentJWTService';

interface SolutionSource {
  title: string;
  page?: number;
  revision?: string;
}

interface HandoverField {
  key: string;
  value: string;
}

interface Solution {
  id: string;
  title: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore?: number; // Percentage score for circle button color
  source: SolutionSource;
  steps: Array<{
    text: string;
    type?: 'warning' | 'tip' | 'normal';
    isBold?: boolean;
  }>;
  procedureLink?: string;
  // Document metadata
  display_name?: string;
  filename?: string;
  best_page?: number;
  // Handover fields - will come from backend
  handover_fields?: HandoverField[];
  // Document cascades for future JSON integration
  related_docs?: Array<{
    file_name: string;
    doc_link: string;
    page_number?: number;
    confidence?: number;
  }>;
  all_docs?: Array<{
    file_name: string;
    doc_link: string;
    page_number?: number;
    confidence?: number;
  }>;
  // Fields for HandoverModal compatibility
  links?: {
    document?: string;
    web?: string;
    desktop?: string;
  };
  doc_link?: string;
  sender?: {
    name: string;
    email: string;
  };
  received_date?: string;
  content_preview?: string;
  snippet?: string;
  handover_section?: {
    system?: string;
    fault_code?: string;
    symptoms?: string;
    actions_taken?: string;
    duration?: number;
    notes?: string;
    linked_doc?: string;
  };
}

interface AISolutionCardProps {
  solutions: Solution[];
  isMobile?: boolean;
  isDarkMode?: boolean;
  // Handover context
  yachtId?: string;
  conversationId?: string;
  queryText?: string;
  // Mode detection - controls visibility of "Ask AI" button
  mode?: 'search' | 'ai' | 'ai_enhanced';
  // Handover section - new unified handover data structure
  handover_section?: {
    enabled: boolean;
    error_state: boolean;
    role: string;
    fields: Array<{
      key: string;
      value: string;
      source: string;
      editable: boolean;
      confidence?: number;
      placeholder?: string;
      type?: string;
    }>;
    metadata: any;
  } | null;
  // Handover modal callback (same as SimpleSearchList)
  onHandover?: (solution: any) => void;
}

export function AISolutionCard({
  solutions,
  isMobile = false,
  isDarkMode = false,
  yachtId,
  conversationId,
  queryText,
  mode = 'search', // Default to search mode for backward compatibility
  handover_section = null, // New unified handover section
  onHandover // Handover modal callback
}: AISolutionCardProps) {
  // Auth context
  const { user } = useAuth();

  // Session tracking
  const [sessionId] = useState(() => getOrCreateSessionId());

  // Default: All solutions collapsed on first receival
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(
    new Set() // Empty set - no solutions expanded initially
  );

  // Handover form state
  const [expandedHandoverForms, setExpandedHandoverForms] = useState<Set<string>>(new Set());
  const [handoverFieldEdits, setHandoverFieldEdits] = useState<{
    [solutionId: string]: { [fieldKey: string]: string }
  }>({});
  const [handoverOriginalValues, setHandoverOriginalValues] = useState<{
    [solutionId: string]: { [fieldKey: string]: string }
  }>({});

  // Track saving state per field
  const [savingFields, setSavingFields] = useState<{
    [key: string]: boolean
  }>({});

  // Track saved handover IDs and editing state
  const [savedHandoverIds, setSavedHandoverIds] = useState<{
    [solutionId: string]: string // handover_id from Supabase
  }>({});
  const [editingHandovers, setEditingHandovers] = useState<Set<string>>(new Set());

  // Track hover state for edit buttons
  const [hoveredEditButtons, setHoveredEditButtons] = useState<Set<string>>(new Set());

  // Ask AI modal state
  const [askAIModalOpen, setAskAIModalOpen] = useState(false);
  const [askAIMessage, setAskAIMessage] = useState('');
  const [askAISolutionId, setAskAISolutionId] = useState<string | null>(null);
  const [sendingAskAI, setSendingAskAI] = useState(false);

  // Detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Helper function to get handover fields from either new or old structure
  const getHandoverFields = (solution: Solution): HandoverField[] => {
    // Priority 1: Use new handover_section if available
    if (handover_section?.enabled && handover_section.fields) {
      return handover_section.fields.map(field => ({
        key: field.key,
        value: field.value
      }));
    }

    // Priority 2: Fall back to solution's handover_fields (old structure)
    if (solution.handover_fields) {
      return solution.handover_fields;
    }

    // Priority 3: Return empty array
    return [];
  };

  // Check if handover is enabled
  const isHandoverEnabled = (): boolean => {
    // If new handover_section exists, check its enabled flag
    if (handover_section) {
      return handover_section.enabled;
    }

    // Otherwise, check if any solution has handover_fields
    return solutions.some(sol => sol.handover_fields && sol.handover_fields.length > 0);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleSolution = (solutionId: string) => {
    const newExpanded = new Set(expandedSolutions);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedSolutions(newExpanded);
  };

  const copyToClipboard = (solutionId: string) => {
    const solution = solutions.find(s => s.id === solutionId);
    if (solution) {
      const text = `${solution.title}\n\n${solution.steps.map(step => `• ${step.text}`).join('\n')}`;
      navigator.clipboard.writeText(text);
    }
  };

  const handleAddToHandover = (itemId: string) => {
    // Check if it's a document ID (format: solutionId_doc_idx) or main solution
    const isDocument = itemId.includes('_doc_');
    let actualSolutionId = itemId;
    let parentSolutionId: string | undefined;

    if (isDocument) {
      // Extract parent solution ID from doc ID
      parentSolutionId = itemId.split('_doc_')[0];
      actualSolutionId = itemId; // Keep full ID for tracking
    }

    // Find the parent solution to get handover fields
    const solution = parentSolutionId
      ? solutions.find(s => s.id === parentSolutionId)
      : solutions.find(s => s.id === itemId);

    // Toggle handover form expansion
    const newExpanded = new Set(expandedHandoverForms);
    if (newExpanded.has(actualSolutionId)) {
      newExpanded.delete(actualSolutionId);
    } else {
      newExpanded.add(actualSolutionId);

      // Initialize field values if not already set
      if (!handoverOriginalValues[actualSolutionId] && solution) {
        const handoverFields = getHandoverFields(solution);
        if (handoverFields.length > 0) {
          const originalValues: { [key: string]: string } = {};
          const editValues: { [key: string]: string } = {};

          handoverFields.forEach(field => {
            originalValues[field.key] = field.value;
            editValues[field.key] = field.value;
          });

        setHandoverOriginalValues(prev => ({
          ...prev,
          [actualSolutionId]: originalValues
        }));

        setHandoverFieldEdits(prev => ({
          ...prev,
          [actualSolutionId]: editValues
        }));
        }
      }
    }

    setExpandedHandoverForms(newExpanded);
  };

  const handleAskAI = (solutionId: string) => {
    // Open modal and set solution context
    setAskAISolutionId(solutionId);
    setAskAIMessage('');
    setAskAIModalOpen(true);
  };

  const sendAskAIRequest = async () => {
    if (!askAISolutionId || !askAIMessage.trim()) return;

    // Find the solution
    const solution = solutions.find(s => s.id === askAISolutionId);
    if (!solution) return;

    setSendingAskAI(true);

    // Prepare payload for ask-ai-sol webhook with user's message + document context
    const payload = {
      action: 'ask-ai-sol',
      userId: user?.userId || `user_${Date.now()}`,
      userName: user?.userName || 'User',
      message: askAIMessage.trim(), // User's additional information
      sessionId: sessionId,
      conversationId: conversationId || `conversation_${Date.now()}`,
      timestamp: new Date().toISOString(),
      // Document context - the document this Ask AI is attached to
      document: {
        id: solution.id,
        title: solution.title,
        display_name: solution.display_name || solution.filename || solution.source?.title,
        confidence: solution.confidence,
        confidenceScore: solution.confidenceScore,
        source: solution.source,
        steps: solution.steps,
        procedureLink: solution.procedureLink,
        best_page: solution.best_page
      },
      context: {
        queryText: queryText,
        yachtId: yachtId
      },
      source: 'celesteos_modern_local_ux',
      webhookUrl: `${window.location.origin}/webhook/ask-ai-sol`,
      executionMode: 'production'
    };

    try {
      console.log('📤 Sending Ask AI request with user message:', payload);

      const response = await fetch(`${window.location.origin}/webhook/ask-ai-sol`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log('✅ Ask AI response:', responseText);
        // Close modal on success
        setAskAIModalOpen(false);
        setAskAIMessage('');
        setAskAISolutionId(null);
        // TODO: Handle response - maybe show in modal or expand section
      } else {
        console.error('❌ Ask AI failed:', response.status, responseText);
        alert(`Ask AI failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Ask AI error:', error);
      alert('Failed to send Ask AI request. Please try again.');
    } finally {
      setSendingAskAI(false);
    }
  };

  const handleFieldEdit = (solutionId: string, fieldKey: string, value: string) => {
    setHandoverFieldEdits(prev => ({
      ...prev,
      [solutionId]: {
        ...(prev[solutionId] || {}),
        [fieldKey]: value
      }
    }));
  };

  const handleEditHandover = (itemId: string) => {
    setEditingHandovers(prev => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      return newSet;
    });
  };

  const handleFieldSave = async (itemId: string, fieldKey: string) => {
    // Extract parent solution ID if this is a document (format: solutionId_doc_idx)
    const isDocument = itemId.includes('_doc_');
    const parentSolutionId = isDocument ? itemId.split('_doc_')[0] : itemId;

    const value = handoverFieldEdits[itemId]?.[fieldKey] || '';
    const fieldId = `${itemId}-${fieldKey}`;

    // Set saving state
    setSavingFields(prev => ({ ...prev, [fieldId]: true }));

    try {
      // Find the parent solution to get handover_fields
      const solution = solutions.find(s => s.id === parentSolutionId);
      const handoverFields = solution ? getHandoverFields(solution) : [];

      // Build data object from all current field values
      const fieldData: { [key: string]: any } = {};
      handoverFields.forEach((field) => {
        const currentValue = handoverFieldEdits[itemId]?.[field.key] ?? field.value;
        fieldData[field.key] = currentValue;
      });

      // Get document info if this is a document save
      const docInfo = isDocument ? getDocumentInfo(parentSolutionId, itemId) : null;

      // Prepare handover payload with ORIGINAL schema
      const payload: HandoverPayload = {
        user_id: user?.userId || '',
        yacht_id: yachtId || 'default_yacht',
        solution_id: parentSolutionId,
        document_name: docInfo?.file_name || solution?.title || 'Unknown Document',
        document_path: docInfo?.doc_link || solution?.procedureLink || '',
        document_page: docInfo?.page_number || solution?.source?.page || null,
        system_affected: fieldData['system'] || fieldData['system_affected'] || null,
        fault_code: fieldData['fault_code'] || null,
        symptoms: fieldData['symptoms'] || null,
        actions_taken: fieldData['actions_taken'] || null,
        duration_minutes: fieldData['duration'] ? parseInt(fieldData['duration']) : null,
        notes: fieldData['notes'] || null,
        status: 'draft'
      };

      // Save to Supabase - UPSERT will update if exists
      const result = await saveHandover(payload);

      if (result.success) {
        const handoverId = result.data?.[0]?.handover_id;
        console.log('✅ Handover saved to Supabase:', {
          handover_id: handoverId,
          solution_id: parentSolutionId,
          item_id: itemId,
          user_id: user?.userId,
          yacht_id: yachtId
        });

        // Store handover_id for future updates
        if (handoverId) {
          setSavedHandoverIds(prev => ({
            ...prev,
            [itemId]: handoverId
          }));
        }

        // Update original values to match current (marks as saved)
        const handoverFields = solution ? getHandoverFields(solution) : [];
        const allOriginalValues: { [key: string]: string } = {};
        handoverFields.forEach((field) => {
          allOriginalValues[field.key] = handoverFieldEdits[itemId]?.[field.key] ?? field.value;
        });

        setHandoverOriginalValues(prev => ({
          ...prev,
          [itemId]: allOriginalValues
        }));

        // Exit editing mode
        setEditingHandovers(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        console.error('❌ Failed to save handover:', result.error);
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving handover:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      // Clear saving state
      setSavingFields(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Helper function to get document info from solution's related_docs
  const getDocumentInfo = (solutionId: string, itemId: string): { file_name: string; doc_link: string; page_number?: number } | null => {
    const solution = solutions.find(s => s.id === solutionId);
    if (!solution) return null;

    const docIndex = parseInt(itemId.split('_doc_')[1]);
    const doc = solution.related_docs?.[docIndex];

    return doc || null;
  };

  // Truncate source title for mobile if >20 characters
  const truncateSourceTitle = (title: string | undefined | null, maxLength: number = 20) => {
    if (!title) return 'Document';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  const getConfidenceBadgeStyle = (confidence: string) => {
    switch (confidence) {
      case 'low':
        return {
          background: 'var(--confidence-low-bg)',
          color: 'var(--confidence-low-text)',
          border: `1px solid var(--confidence-low-border)`,
          backdropFilter: 'var(--confidence-low-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-low-backdrop)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        };
      case 'medium':
        return {
          background: 'var(--confidence-medium-bg)',
          color: 'var(--confidence-medium-text)',
          border: `1px solid var(--confidence-medium-border)`,
          backdropFilter: 'var(--confidence-medium-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-medium-backdrop)',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        };
      case 'high':
        return {
          background: 'var(--confidence-high-bg)',
          color: 'var(--confidence-high-text)',
          border: `1px solid var(--confidence-high-border)`,
          backdropFilter: 'var(--confidence-high-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-high-backdrop)',
          boxShadow: '0 3px 12px rgba(0, 112, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        };
      default:
        return {
          background: 'var(--confidence-low-bg)',
          color: 'var(--confidence-low-text)',
          border: `1px solid var(--confidence-low-border)`,
          backdropFilter: 'var(--confidence-low-backdrop)',
          WebkitBackdropFilter: 'var(--confidence-low-backdrop)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        };
    }
  };

  // Helper function to get confidence circle styles based on confidence percentage
  const getConfidenceCircleStyle = (confidenceScore: number) => {
    const baseStyle = {
      border: 'none',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    };

    // Determine color based on confidence percentage
    if (confidenceScore >= 85) {
      // Green for high confidence (85%+)
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        boxShadow: '0 3px 12px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    } else if (confidenceScore >= 67.5) {
      // Amber for medium confidence (67.5-85%)
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        boxShadow: '0 3px 12px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    } else {
      // Red for low confidence (<67.5%)
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        boxShadow: '0 3px 12px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      };
    }
  };

  const getStepIcon = (type?: string) => {
    const iconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'; // 14px for mobile, 16px for desktop

    switch (type) {
      case 'warning':
        return <AlertTriangle className={`${iconSize} text-amber-500`} />;
      case 'tip':
        return <Info className={`${iconSize} text-blue-500`} />;
      default:
        return <CheckCircle className={`${iconSize} text-green-500`} />;
    }
  };

  // Document cascade state management
  const [expandedRelatedDocs, setExpandedRelatedDocs] = useState<Set<string>>(new Set());
  const [expandedAllDocs, setExpandedAllDocs] = useState<Set<string>>(new Set());

  const toggleRelatedDocs = (solutionId: string) => {
    const newExpanded = new Set(expandedRelatedDocs);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedRelatedDocs(newExpanded);
  };

  const toggleAllDocs = (solutionId: string) => {
    const newExpanded = new Set(expandedAllDocs);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedAllDocs(newExpanded);
  };

  // Shared expandable document list component
  const ExpandableDocList = ({
    label,
    docs,
    emptyMessage,
    isExpanded,
    onToggle,
    solutionId
  }: {
    label: string;
    docs: Array<{ file_name: string; doc_link: string; page_number?: number; confidence?: number }>;
    emptyMessage: string;
    isExpanded: boolean;
    onToggle: () => void;
    solutionId: string;
  }) => (
    <motion.div
      className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/30 p-2 sm:p-3 doc_cascade_container"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : 0.25,
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: [0.22, 0.61, 0.36, 1]
      }}
    >
      {/* Header Row */}
      <button
        className="flex w-full items-center justify-between text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 doc_cascade_header"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <span>
          {label}{" "}
          {docs.length > 0 && (
            <span className="text-gray-500 dark:text-gray-400 font-normal">({docs.length})</span>
          )}
        </span>
        <motion.div
          animate={{
            rotate: isExpanded ? 180 : 0
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.2,
            ease: [0.22, 0.61, 0.36, 1]
          }}
        >
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-3 space-y-2 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto doc_cascade_list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.2,
              ease: [0.22, 0.61, 0.36, 1]
            }}
            style={{ overflow: 'hidden' }}
          >
            {docs.length === 0 ? (
              <p className="text-xs italic text-gray-400 dark:text-gray-500 py-1">
                {emptyMessage}
              </p>
            ) : (
              docs.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    try {
                      await openDocument(doc.doc_link, user?.userId || 'unknown', user?.role || 'chief_engineer');
                    } catch (error) {
                      console.error('Failed to open document:', error);
                    }
                  }}
                  className="flex items-center justify-between truncate py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 doc_cascade_item w-full text-left"
                  title={`${doc.file_name}${doc.page_number ? ` (Page ${doc.page_number})` : ''}`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <span
                      className="text-gray-500 dark:text-gray-400 font-mono mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm"
                      style={{
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace'
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <span
                      className="flex-1 truncate text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
                      style={{
                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      {doc.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {doc.page_number && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        p.{doc.page_number}
                      </span>
                    )}
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Motion variants for reduced motion vs full motion
  const getMotionVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { height: 'auto', opacity: 1 },
        expanded: { height: 'auto', opacity: 1 }
      };
    }

    return {
      collapsed: {
        height: 'auto',
        opacity: 1
      },
      expanded: {
        height: 'auto',
        opacity: 1
      }
    };
  };

  // Content animation variants with precise timing - IDENTICAL to desktop
  const getContentVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { 
          opacity: 1,
          height: 0,
          y: 0,
          transition: { duration: 0 }
        },
        expanded: { 
          opacity: 1,
          height: 'auto',
          y: 0,
          transition: { duration: 0 }
        }
      };
    }

    return {
      collapsed: {
        opacity: 0,
        height: 0,
        y: -4,
        transition: {
          duration: 0.2, // 200ms (180-220ms range) - IDENTICAL
          ease: [0.22, 0.61, 0.36, 1], // cubic-bezier(0.22,0.61,0.36,1) - IDENTICAL
          height: { duration: 0.18 },
          opacity: { duration: 0.15 }
        }
      },
      expanded: {
        opacity: 1,
        height: 'auto',
        y: 0,
        transition: {
          duration: 0.28, // 280ms (240-320ms range) - IDENTICAL
          ease: [0.22, 0.61, 0.36, 1], // cubic-bezier(0.22,0.61,0.36,1) - IDENTICAL
          height: { duration: 0.25 },
          opacity: { duration: 0.2, delay: 0.05 }
        }
      }
    };
  };

  // Chevron rotation variants - IDENTICAL timing
  const getChevronVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { rotate: 0 },
        expanded: { rotate: 90 }
      };
    }

    return {
      collapsed: {
        rotate: 0,
        transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] } // IDENTICAL
      },
      expanded: {
        rotate: 90,
        transition: { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] } // IDENTICAL
      }
    };
  };

  // Staggered bullet list variants - IDENTICAL timing
  const getStepContainerVariants = () => {
    if (prefersReducedMotion) {
      return {
        expanded: {
          transition: { staggerChildren: 0 }
        }
      };
    }

    return {
      expanded: {
        transition: {
          staggerChildren: 0.06, // 60ms delay between each - IDENTICAL
          delayChildren: 0.1 // Start after main content animation - IDENTICAL
        }
      }
    };
  };

  const getStepItemVariants = () => {
    if (prefersReducedMotion) {
      return {
        collapsed: { opacity: 1, y: 0 },
        expanded: { opacity: 1, y: 0 }
      };
    }

    return {
      collapsed: {
        opacity: 0,
        y: 8
      },
      expanded: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.25, // IDENTICAL
          ease: [0.22, 0.61, 0.36, 1] // IDENTICAL
        }
      }
    };
  };

  return (
    // Binds to: response.solutions[]
    <div 
      className="w-full flex flex-col solutions_container"
      style={{ 
        padding: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)', // Mobile: 8px for more width, Desktop: 12px
        gap: isMobile ? 'var(--spacing-4)' : 'var(--spacing-5)' // Mobile: 16px, Desktop: 20px spacing
      }}
    >
      {solutions.map((solution, index) => {
        const isExpanded = expandedSolutions.has(solution.id);
        
        return (
          // Binds to: response.solutions[].id
          <motion.div
            key={solution.id}
            className={`
              border border-gray-200 dark:border-neutral-700 overflow-hidden solution_card
              ${isExpanded
                ? 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm'
                : 'bg-white dark:bg-neutral-900 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50'
              }
            `}
            style={{
              borderRadius: '8px', // Cards have 8px radius
            }}
            variants={getMotionVariants()}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
          >
            {/* Header Row - Always Visible with Mobile Responsive Styling */}
            <div 
              className="cursor-pointer transition-colors duration-200 solution_header"
              onClick={() => toggleSolution(solution.id)}
              style={{
                padding: isMobile ? (isExpanded ? '20px' : '16px') : '24px' // Mobile: Increased padding for wider cards
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Solution Title - Mobile Responsive Typography - Binds to: response.solutions[].title */}
                    <h3 
                      className="flex-1 min-w-0 solution_title_display"
                      style={{
                        fontSize: isMobile ? '17px' : '18px', // Mobile: Larger 17px, Desktop: 18px
                        lineHeight: isMobile ? '24px' : '26px', // Mobile: 24px, Desktop: 26px
                        fontWeight: '600',
                        color: isDarkMode ? '#f5f5f5' : '#1a1a1a',
                        fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        whiteSpace: isMobile ? 'nowrap' : 'normal', // Mobile: Force single line
                        overflow: isMobile ? 'hidden' : 'visible', // Mobile: Hide overflow
                        textOverflow: isMobile ? 'ellipsis' : 'clip' // Mobile: Show ellipsis for overflow
                      }}
                    >
                      {solution.title}
                    </h3>
                    
                    {/* Enhanced Glassmorphism Confidence Badge - Binds to: response.solutions[].confidence_score */}
                    <button 
                      className="rounded-full flex-shrink-0 confidence_circle_button transition-all duration-200 hover:scale-110 active:scale-95"
                      style={{
                        width: isMobile ? '24px' : '28px',
                        height: isMobile ? '24px' : '28px',
                        minWidth: isMobile ? '24px' : '28px',
                        minHeight: isMobile ? '24px' : '28px',
                        border: 'none',
                        cursor: 'pointer',
                        ...getConfidenceCircleStyle(solution.confidenceScore || 75) // Default to 75% if no score
                      }}
                      title={`${solution.confidenceScore || 75}% confidence`}
                      aria-label={`Confidence level: ${solution.confidenceScore || 75}%`}
                    >
                      {/* Circle button with dynamic color based on confidence percentage */}
                    </button>
                  </div>
                  
                  {/* Source Chip - Mobile Truncation - Binds to: response.solutions[].source_document */}
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md source_document_chip"
                    style={{
                      fontSize: '13px',
                      lineHeight: '18px',
                      color: '#6b7280',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {/* Binds to: response.solutions[].display_name or filename */}
                    <span className="source_title_display">
                      {isMobile
                        ? truncateSourceTitle(solution.display_name || solution.filename || solution.source?.title || 'Document', 20) // Mobile: truncate at 20 chars
                        : (solution.display_name || solution.filename || solution.source?.title || 'Document') // Desktop: full title
                      }
                      {/* Binds to: response.solutions[].best_page */}
                      {solution.best_page && <span className="source_page"> p.{solution.best_page}</span>}
                      {/* Binds to: response.solutions[].source_document.revision */}
                      {solution.source?.revision && <span className="source_revision">, Rev {solution.source.revision}</span>}
                    </span>
                  </div>
                </div>

                {/* Animated Chevron Icon */}
                <div className="flex-shrink-0 expand_toggle">
                  <motion.div
                    variants={getChevronVariants()}
                    initial="collapsed"
                    animate={isExpanded ? "expanded" : "collapsed"}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Animated Expanded Content */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key={`content-${solution.id}`}
                  variants={getContentVariants()}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  style={{ overflow: 'hidden' }}
                  className="solution_expanded_content"
                >
                  {/* Body - Rich Text with Steps and Mobile Responsive Bullet Indent - Binds to: response.solutions[].steps[] */}
                  <div 
                    className="border-t border-gray-100 solution_steps_container"
                    style={{
                      padding: isMobile ? '16px' : '24px', // Mobile: 16px, Desktop: 24px
                      paddingTop: isMobile ? '16px' : '24px'
                    }}
                  >
                    <motion.div 
                      className="space-y-4 solution_steps_list"
                      variants={getStepContainerVariants()}
                      initial="collapsed"
                      animate="expanded"
                    >
                      {/* Binds to: response.solutions[].steps[] */}
                      {solution.steps.map((step, stepIndex) => (
                        <motion.div 
                          key={stepIndex} 
                          className="flex items-start solution_step_item"
                          style={{
                            gap: isMobile ? '16px' : '12px' // Mobile: 16px indent, Desktop: 12px
                          }}
                          variants={getStepItemVariants()}
                        >
                          {/* Step Icon - Binds to: response.solutions[].steps[].type */}
                          <div className="flex-shrink-0 mt-0.5 step_icon">
                            {getStepIcon(step.type)}
                          </div>
                          
                          {/* Step Text - Binds to: response.solutions[].steps[].text */}
                          <div 
                            className={`${step.isBold ? 'font-semibold' : ''} step_text_content`}
                            style={{
                              fontSize: isMobile ? '15px' : '16px',
                              lineHeight: isMobile ? '22px' : '24px',
                              color: isDarkMode ? '#d1d5db' : '#374151',
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}
                          >
                            {step.text}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Footer Row - Mobile Responsive Layout */}
                  <motion.div 
                    className={`
                      border-t border-gray-100 solution_footer_actions
                      ${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'}
                    `}
                    style={{
                      padding: isMobile ? '16px' : '20px 24px'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      delay: prefersReducedMotion ? 0 : 0.15,
                      duration: prefersReducedMotion ? 0 : 0.2 
                    }}
                  >
                    {/* View Full Procedure Link - Binds to: response.solutions[].procedure_link */}
                    {solution.procedureLink && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await openDocument(solution.procedureLink, user?.userId || 'unknown', user?.role || 'chief_engineer');
                          } catch (error) {
                            console.error('Failed to open procedure:', error);
                          }
                        }}
                        className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 procedure_link_button"
                        style={{
                          fontSize: isMobile ? '14px' : '15px',
                          lineHeight: isMobile ? '20px' : '22px',
                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        title={`Open: ${solution.procedureLink}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="group-hover:underline underline-offset-2">
                          View full procedure
                        </span>
                      </button>
                    )}

                    {/* Copy Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(solution.id);
                      }}
                      className={`
                        p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                        transition-all duration-200 hover:shadow-sm copy_solution_button
                        ${isMobile ? 'self-end' : ''}
                      `}
                      title="Copy solution"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </motion.div>

                  {/* Action Buttons - Add to Handover & Ask AI */}
                  <motion.div
                    className="border-t border-gray-100 dark:border-neutral-700 handover_section"
                    style={{
                      padding: isMobile ? '16px' : '20px 24px'
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.2,
                      duration: prefersReducedMotion ? 0 : 0.25,
                      ease: [0.22, 0.61, 0.36, 1]
                    }}
                  >
                    <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', flexDirection: isMobile ? 'column' : 'row' }}>
                      {/* Ask AI Button - Only show in search mode */}
                      {mode === 'search' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskAI(solution.id);
                          }}
                          className="group ask_ai_button transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                          style={{
                            flex: isMobile ? 'none' : '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            padding: isMobile ? '16px 24px' : '18px 32px',
                            borderRadius: '16px',
                            background: isDarkMode
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(255, 255, 255, 0.95)',
                            border: isDarkMode
                              ? '1px solid rgba(255, 255, 255, 0.2)'
                              : '1px solid rgba(0, 0, 0, 0.1)',
                            boxShadow: isDarkMode
                              ? '0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'
                              : '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
                            fontSize: isMobile ? '17px' : '19px',
                            lineHeight: isMobile ? '24px' : '28px',
                            fontWeight: '600',
                            color: isDarkMode ? '#ffffff' : '#1f2937',
                            fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            cursor: 'pointer',
                            letterSpacing: '0.01em'
                          }}
                        >
                          <span>Ask AI</span>
                        </button>
                      )}

                      {/* Add to Handover / Edit Button - Blue Gradient - Always visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use modal if onHandover provided, otherwise fallback to inline form
                          if (onHandover) {
                            onHandover(solution);
                          } else {
                            handleAddToHandover(solution.id);
                          }
                        }}
                        onMouseEnter={() => {
                          if (savedHandoverIds[solution.id]) {
                            setHoveredEditButtons(prev => new Set(prev).add(solution.id));
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredEditButtons(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(solution.id);
                            return newSet;
                          });
                        }}
                        className="group add_to_handover_button transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          flex: mode === 'ai' ? 'none' : (isMobile ? 'none' : '1'),
                          width: mode === 'ai' ? '100%' : 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          padding: isMobile ? '16px 24px' : '18px 32px',
                          borderRadius: '16px',
                          background: savedHandoverIds[solution.id]
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          border: 'none',
                          boxShadow: savedHandoverIds[solution.id]
                            ? '0 4px 16px rgba(34, 197, 94, 0.25), 0 2px 4px rgba(0, 0, 0, 0.05)'
                            : '0 4px 16px rgba(37, 99, 235, 0.25), 0 2px 4px rgba(0, 0, 0, 0.05)',
                          fontSize: isMobile ? '17px' : '19px',
                          lineHeight: isMobile ? '24px' : '28px',
                          fontWeight: '600',
                          color: '#ffffff',
                          fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          cursor: 'pointer',
                          letterSpacing: '0.01em'
                        }}
                      >
                        {savedHandoverIds[solution.id] ? (
                          hoveredEditButtons.has(solution.id) ? (
                            <span>Edit?</span>
                          ) : (
                            <Check className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} style={{ strokeWidth: 2.5 }} />
                          )
                        ) : (
                          <span>Add to Handover</span>
                        )}
                      </button>
                    </div>

                    {/* Handover Form - Expandable Section */}
                    <AnimatePresence>
                      {expandedHandoverForms.has(solution.id) && getHandoverFields(solution).length > 0 && (
                        <motion.div
                          className="mt-4 handover_form_container"
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.3,
                            ease: [0.22, 0.61, 0.36, 1]
                          }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            className="rounded-2xl handover_fields_wrapper"
                            style={{
                              background: isDarkMode
                                ? 'rgba(30, 30, 35, 0.4)'
                                : 'rgba(248, 250, 252, 0.8)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              padding: isMobile ? '16px' : '20px',
                              maxWidth: '100%',
                              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <div className="space-y-4">
                              {getHandoverFields(solution).map((field, idx) => {
                                const currentValue = handoverFieldEdits[solution.id]?.[field.key] ?? field.value;
                                const originalValue = handoverOriginalValues[solution.id]?.[field.key] ?? field.value;
                                const isSaved = currentValue === originalValue;
                                const fieldId = `${solution.id}-${field.key}`;
                                const isSaving = savingFields[fieldId] || false;

                                return (
                                  <div
                                    key={idx}
                                    className="handover_field_row flex items-center gap-3"
                                  >
                                    {/* Field Label */}
                                    <label
                                      className="handover_field_label flex-shrink-0"
                                      style={{
                                        width: isMobile ? '100px' : '140px',
                                        fontSize: isMobile ? '15px' : '16px',
                                        lineHeight: isMobile ? '22px' : '24px',
                                        fontWeight: '600',
                                        color: isDarkMode ? '#cbd5e1' : '#475569',
                                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                      }}
                                    >
                                      {field.key}
                                    </label>

                                    {/* Field Input */}
                                    <input
                                      type="text"
                                      value={currentValue}
                                      onChange={(e) => handleFieldEdit(solution.id, field.key, e.target.value)}
                                      placeholder="Add details…"
                                      className="flex-1 handover_field_input transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                                      style={{
                                        padding: isMobile ? '12px 16px' : '14px 18px',
                                        fontSize: isMobile ? '15px' : '16px',
                                        lineHeight: isMobile ? '22px' : '24px',
                                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                                        borderRadius: '12px',
                                        color: isDarkMode ? '#f1f5f9' : '#1e293b'
                                      }}
                                    />

                                    {/* Save/Checkmark Button */}
                                    <button
                                      onClick={() => handleFieldSave(solution.id, field.key)}
                                      disabled={isSaving}
                                      className="group handover_save_button transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                      style={{
                                        width: isMobile ? '44px' : '48px',
                                        height: isMobile ? '44px' : '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '12px',
                                        background: isSaved
                                          ? (isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)')
                                          : isSaving
                                          ? (isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(191, 219, 254, 0.8)')
                                          : (isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#e2e8f0'),
                                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                                        cursor: isSaving ? 'wait' : 'pointer',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                                      }}
                                      title={isSaving ? "Saving..." : isSaved ? "Saved to Supabase" : "Save to Supabase"}
                                      aria-label="Save field"
                                    >
                                      {isSaving ? (
                                        <div
                                          className="animate-spin rounded-full border-2 border-current border-t-transparent"
                                          style={{
                                            width: isMobile ? '20px' : '24px',
                                            height: isMobile ? '20px' : '24px',
                                            color: isDarkMode ? '#60a5fa' : '#3b82f6'
                                          }}
                                        />
                                      ) : (
                                        <Check
                                          className={isMobile ? 'w-5 h-5' : 'w-6 h-6'}
                                          style={{
                                            color: isSaved
                                              ? (isDarkMode ? '#64748b' : '#94a3b8')
                                              : (isDarkMode ? '#cbd5e1' : '#475569'),
                                            strokeWidth: 2.5
                                          }}
                                        />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Document Handover Forms - Render for each document's "+ Handover" button */}
                    {getHandoverFields(solution).length > 0 && Array.from(expandedHandoverForms).filter(itemId =>
                      itemId.startsWith(solution.id + '_doc_')
                    ).map(docItemId => {
                      const docIndex = docItemId.split('_doc_')[1];
                      const doc = solution.related_docs?.[parseInt(docIndex)];

                      return (
                        <AnimatePresence key={docItemId}>
                          <motion.div
                            className="mt-4 handover_form_container"
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{
                              duration: prefersReducedMotion ? 0 : 0.3,
                              ease: [0.22, 0.61, 0.36, 1]
                            }}
                            style={{ overflow: 'hidden' }}
                          >
                            {/* Document Title Header */}
                            <div
                              className="mb-2 px-2"
                              style={{
                                fontSize: isMobile ? '13px' : '14px',
                                color: isDarkMode ? '#94a3b8' : '#64748b',
                                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                fontWeight: '500'
                              }}
                            >
                              📄 {doc?.file_name || `Document ${parseInt(docIndex) + 1}`}
                            </div>

                            <div
                              className="rounded-2xl handover_fields_wrapper"
                              style={{
                                background: isDarkMode
                                  ? 'rgba(30, 30, 35, 0.4)'
                                  : 'rgba(248, 250, 252, 0.8)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                padding: isMobile ? '16px' : '20px',
                                maxWidth: '100%',
                                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
                              }}
                            >
                              <div className="space-y-4">
                                {getHandoverFields(solution).map((field, idx) => {
                                  const currentValue = handoverFieldEdits[docItemId]?.[field.key] ?? field.value;
                                  const originalValue = handoverOriginalValues[docItemId]?.[field.key] ?? field.value;
                                  const isSaved = currentValue === originalValue;
                                  const fieldId = `${docItemId}-${field.key}`;
                                  const isSaving = savingFields[fieldId] || false;

                                  return (
                                    <div
                                      key={idx}
                                      className="handover_field_row flex items-center gap-3"
                                    >
                                      {/* Field Label */}
                                      <label
                                        className="handover_field_label flex-shrink-0"
                                        style={{
                                          width: isMobile ? '100px' : '140px',
                                          fontSize: isMobile ? '15px' : '16px',
                                          lineHeight: isMobile ? '22px' : '24px',
                                          fontWeight: '600',
                                          color: isDarkMode ? '#cbd5e1' : '#475569',
                                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                        }}
                                      >
                                        {field.key}
                                      </label>

                                      {/* Field Input */}
                                      <input
                                        type="text"
                                        value={currentValue}
                                        onChange={(e) => handleFieldEdit(docItemId, field.key, e.target.value)}
                                        placeholder="Add details…"
                                        className="flex-1 handover_field_input transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                                        style={{
                                          padding: isMobile ? '12px 16px' : '14px 18px',
                                          fontSize: isMobile ? '15px' : '16px',
                                          lineHeight: isMobile ? '22px' : '24px',
                                          fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                          background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                                          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                                          borderRadius: '12px',
                                          color: isDarkMode ? '#f1f5f9' : '#1e293b'
                                        }}
                                      />

                                      {/* Save/Checkmark Button */}
                                      <button
                                        onClick={() => handleFieldSave(docItemId, field.key)}
                                        disabled={isSaving}
                                        className="group handover_save_button transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                          width: isMobile ? '44px' : '48px',
                                          height: isMobile ? '44px' : '48px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '12px',
                                          background: isSaved
                                            ? (isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)')
                                            : isSaving
                                            ? (isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(191, 219, 254, 0.8)')
                                            : (isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#e2e8f0'),
                                          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                                          cursor: isSaving ? 'wait' : 'pointer',
                                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                                        }}
                                        title={isSaving ? 'Saving...' : isSaved ? 'Saved to Supabase' : 'Save to Supabase'}
                                      >
                                        {isSaving ? (
                                          <div
                                            className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
                                            style={{
                                              width: isMobile ? '18px' : '20px',
                                              height: isMobile ? '18px' : '20px'
                                            }}
                                          />
                                        ) : (
                                          <Check
                                            className="w-5 h-5"
                                            style={{
                                              color: isSaved
                                                ? (isDarkMode ? '#94a3b8' : '#94a3b8')
                                                : (isDarkMode ? '#e2e8f0' : '#334155')
                                            }}
                                          />
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      );
                    })}
                  </motion.div>

                  {/* Parent Cascade: Other Related Documents */}
                  <motion.div
                    className="mt-2 sm:mt-3 rounded-lg sm:rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/30 p-2 sm:p-3 other_docs_container"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.25,
                      duration: prefersReducedMotion ? 0 : 0.2,
                      ease: [0.22, 0.61, 0.36, 1]
                    }}
                  >
                    {/* Header Row */}
                    <button
                      className="flex w-full items-center justify-between text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 other_docs_header"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRelatedDocs(solution.id);
                      }}
                      style={{
                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      <span>
                        Other related documents{" "}
                        {((solution.related_docs?.length || 0) > 0) && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            ({solution.related_docs?.length || 2})
                          </span>
                        )}
                      </span>
                      <motion.div
                        animate={{
                          rotate: expandedRelatedDocs.has(solution.id) ? 180 : 0
                        }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.2,
                          ease: [0.22, 0.61, 0.36, 1]
                        }}
                      >
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      </motion.div>
                    </button>

                    {/* Expanded Content - Contains both related docs and nested all docs */}
                    <AnimatePresence>
                      {expandedRelatedDocs.has(solution.id) && (
                        <motion.div
                          className="mt-3 space-y-3"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.2,
                            ease: [0.22, 0.61, 0.36, 1]
                          }}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Related Documents List */}
                          <div className="space-y-2 max-h-32 sm:max-h-40 lg:max-h-48 overflow-y-auto">
                            {(solution.related_docs?.length || 0) === 0 ? (
                              <p className="text-xs italic text-gray-400 dark:text-gray-500 py-1">
                                No other documents found
                              </p>
                            ) : (
                              (solution.related_docs || [
                                { file_name: "Engine Manual 3512B.pdf", doc_link: "#", page_number: 42, confidence: 0.75 },
                                { file_name: "Maintenance Log Q3-2024.pdf", doc_link: "#", page_number: 15, confidence: 0.68 }
                              ]).map((doc, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-1 gap-2"
                                >
                                  {/* Document Link */}
                                  <button
                                    onClick={async () => {
                                      try {
                                        await openDocument(doc.doc_link, user?.userId || 'unknown', user?.role || 'chief_engineer');
                                      } catch (error) {
                                        console.error('Failed to open document:', error);
                                      }
                                    }}
                                    className="flex items-center flex-1 min-w-0 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left"
                                    title={`${doc.file_name}${doc.page_number ? ` (Page ${doc.page_number})` : ''}`}
                                  >
                                    <span
                                      className="text-gray-500 dark:text-gray-400 font-mono mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm"
                                      style={{
                                        fontFamily: 'Menlo, Monaco, "Courier New", monospace'
                                      }}
                                    >
                                      {idx + 1}.
                                    </span>
                                    <span
                                      className="flex-1 truncate text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
                                      style={{
                                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                      }}
                                    >
                                      {doc.file_name}
                                    </span>
                                    {doc.page_number && (
                                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                                        p.{doc.page_number}
                                      </span>
                                    )}
                                  </button>

                                  {/* Add to Handover Button for this Doc */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAddToHandover(solution.id + '_doc_' + idx);
                                    }}
                                    className="flex-shrink-0 px-2 py-1 text-xs rounded-md transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
                                    style={{
                                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                                      border: '1px solid rgba(59, 130, 246, 0.2)',
                                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                      fontWeight: '500'
                                    }}
                                    title="Add this document to handover"
                                  >
                                    + Handover
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Nested Cascade: All Documents Searched (Only if docs exist) */}
                          {((solution.all_docs && solution.all_docs.length > 0) || (!solution.all_docs && [
                            { file_name: "Engine Manual 3512B.pdf", doc_link: "#", page_number: 42 },
                            { file_name: "Maintenance Log Q3-2024.pdf", doc_link: "#", page_number: 15 },
                            { file_name: "Safety Procedures.pdf", doc_link: "#", page_number: 8 },
                            { file_name: "Technical Specifications.pdf", doc_link: "#", page_number: 23 },
                            { file_name: "Troubleshooting Guide.pdf", doc_link: "#", page_number: 67 }
                          ].length > 0)) && (
                            <div className="pl-2 sm:pl-3">
                              <motion.div
                                className="rounded-md border border-white/15 dark:border-white/8 bg-white/30 dark:bg-black/20 p-2"
                                initial={{ opacity: 0, y: 2 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: prefersReducedMotion ? 0 : 0.1,
                                  duration: prefersReducedMotion ? 0 : 0.15
                                }}
                              >
                                <button
                                  className="flex w-full items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAllDocs(solution.id);
                                  }}
                                  style={{
                                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                  }}
                                >
                                  <span>
                                    All documents searched ({solution.all_docs?.length || 5})
                                  </span>
                                  <motion.div
                                    animate={{
                                      rotate: expandedAllDocs.has(solution.id) ? 180 : 0
                                    }}
                                    transition={{
                                      duration: prefersReducedMotion ? 0 : 0.15,
                                      ease: [0.22, 0.61, 0.36, 1]
                                    }}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </motion.div>
                                </button>

                                {/* Nested All Docs List */}
                                <AnimatePresence>
                                  {expandedAllDocs.has(solution.id) && (
                                    <motion.div
                                      className="mt-2 space-y-1 max-h-24 sm:max-h-32 overflow-y-auto"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{
                                        duration: prefersReducedMotion ? 0 : 0.15,
                                        ease: [0.22, 0.61, 0.36, 1]
                                      }}
                                      style={{ overflow: 'hidden' }}
                                    >
                                      {(solution.all_docs || [
                                        { file_name: "Engine Manual 3512B.pdf", doc_link: "#", page_number: 42 },
                                        { file_name: "Maintenance Log Q3-2024.pdf", doc_link: "#", page_number: 15 },
                                        { file_name: "Safety Procedures.pdf", doc_link: "#", page_number: 8 },
                                        { file_name: "Technical Specifications.pdf", doc_link: "#", page_number: 23 },
                                        { file_name: "Troubleshooting Guide.pdf", doc_link: "#", page_number: 67 }
                                      ]).map((doc, idx) => (
                                        <button
                                          key={idx}
                                          onClick={async () => {
                                            try {
                                              await openDocument(doc.doc_link, user?.userId || 'unknown', user?.role || 'chief_engineer');
                                            } catch (error) {
                                              console.error('Failed to open document:', error);
                                            }
                                          }}
                                          className="flex items-center justify-between truncate py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 w-full text-left"
                                          title={`${doc.file_name}${doc.page_number ? ` (Page ${doc.page_number})` : ''}`}
                                        >
                                          <div className="flex items-center flex-1 min-w-0">
                                            <span
                                              className="text-gray-400 dark:text-gray-500 font-mono mr-1 sm:mr-2 flex-shrink-0 text-xs"
                                              style={{
                                                fontFamily: 'Menlo, Monaco, "Courier New", monospace'
                                              }}
                                            >
                                              {idx + 1}.
                                            </span>
                                            <span
                                              className="flex-1 truncate text-gray-500 dark:text-gray-400 text-xs"
                                              style={{
                                                fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                              }}
                                            >
                                              {doc.file_name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            {doc.page_number && (
                                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                                p.{doc.page_number}
                                              </span>
                                            )}
                                            <FileText className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                          </div>
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Ask AI Modal */}
      <AnimatePresence>
        {askAIModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setAskAIModalOpen(false);
                setAskAIMessage('');
                setAskAISolutionId(null);
              }}
            >
              {/* Modal Content */}
              <motion.div
                className="ask_ai_modal"
                style={{
                  maxWidth: isMobile ? '90%' : '540px',
                  width: '100%',
                  background: isDarkMode
                    ? 'rgba(30, 30, 35, 0.95)'
                    : 'rgba(255, 255, 255, 0.98)',
                  border: isDarkMode
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '24px',
                  padding: isMobile ? '24px' : '32px',
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.2,
                  ease: [0.22, 0.61, 0.36, 1]
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: isMobile ? '20px' : '24px',
                      lineHeight: isMobile ? '28px' : '32px',
                      fontWeight: '600',
                      color: isDarkMode ? '#f5f5f5' : '#1a1a1a',
                      fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      marginBottom: '8px'
                    }}
                  >
                    Ask AI
                  </h3>
                  <p
                    style={{
                      fontSize: isMobile ? '14px' : '15px',
                      lineHeight: isMobile ? '20px' : '22px',
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    Add more information to help me understand your question better
                  </p>
                </div>

                {/* Textarea */}
                <textarea
                  value={askAIMessage}
                  onChange={(e) => setAskAIMessage(e.target.value)}
                  placeholder="Type your additional information here..."
                  autoFocus
                  style={{
                    width: '100%',
                    minHeight: isMobile ? '120px' : '140px',
                    padding: isMobile ? '14px 16px' : '16px 18px',
                    fontSize: isMobile ? '15px' : '16px',
                    lineHeight: isMobile ? '22px' : '24px',
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#ffffff',
                    border: isDarkMode
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '16px',
                    color: isDarkMode ? '#f1f5f9' : '#1e293b',
                    resize: 'vertical',
                    outline: 'none',
                    marginBottom: '24px'
                  }}
                  className="focus:ring-2 focus:ring-blue-400/40 transition-all duration-200"
                />

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    flexDirection: isMobile ? 'column' : 'row'
                  }}
                >
                  <button
                    onClick={() => {
                      setAskAIModalOpen(false);
                      setAskAIMessage('');
                      setAskAISolutionId(null);
                    }}
                    disabled={sendingAskAI}
                    style={{
                      padding: isMobile ? '14px 24px' : '12px 24px',
                      fontSize: isMobile ? '16px' : '15px',
                      lineHeight: isMobile ? '22px' : '20px',
                      fontWeight: '600',
                      fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: isDarkMode ? '#cbd5e1' : '#475569',
                      background: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: sendingAskAI ? 'not-allowed' : 'pointer',
                      opacity: sendingAskAI ? 0.5 : 1,
                      order: isMobile ? 2 : 1
                    }}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={sendAskAIRequest}
                    disabled={sendingAskAI || !askAIMessage.trim()}
                    style={{
                      padding: isMobile ? '14px 32px' : '12px 32px',
                      fontSize: isMobile ? '16px' : '15px',
                      lineHeight: isMobile ? '22px' : '20px',
                      fontWeight: '600',
                      fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      color: '#ffffff',
                      background: sendingAskAI || !askAIMessage.trim()
                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(191, 219, 254, 0.8)')
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: sendingAskAI || !askAIMessage.trim() ? 'not-allowed' : 'pointer',
                      opacity: sendingAskAI || !askAIMessage.trim() ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      order: isMobile ? 1 : 2
                    }}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {sendingAskAI ? (
                      <>
                        <div
                          className="animate-spin rounded-full border-2 border-white border-t-transparent"
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send to AI</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}