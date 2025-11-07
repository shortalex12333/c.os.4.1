import React, { useEffect, useState, useRef } from 'react';
import { AISolutionCard } from './AISolutionCard';
import { AISummaryBox } from '../AISummaryBox';
import { SimpleSearchList } from '../SimpleSearchList';
import { HandoverModal } from '../HandoverModal';
import { SOPCanvasCard } from '../canvas/SOPCanvasCard';
import { ThumbsUp, ThumbsDown, Send, Upload, FileText, X } from 'lucide-react';
import { MainHeader } from './MainHeader';
import styles from '../chat/ChatSheet.module.css';
import { AISummary } from '../../utils/responseHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { saveHandover } from '../../services/handoverService';

interface Chunk {
  file_name: string;
  file_location: string;
  page_number: number;
  content: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
  // Response mode - controls UI variant
  mode?: 'search' | 'ai';
  // AI summary - only present in AI mode
  ai_summary?: AISummary | null;
  solutions?: Array<{
    id: string;
    title: string;
    confidence: number;
    content: string;
    source: string;
    type?: string;
    doc_link?: string;
    metadata?: any;
  }>;
  // Retrieved chunks for Ask AI functionality
  chunks?: Chunk[];
  // Original user query (for context in follow-ups)
  original_query?: string;
  search_strategy?: 'NAS' | 'email' | 'web';
}

interface ChatAreaRealProps {
  messages: Message[];
  isLoading: boolean;
  isMobile?: boolean;
  isDarkMode?: boolean;
  currentSearchType?: 'yacht' | 'email' | 'sop';
  onFilesUpload?: (files: File[]) => void;
  uploadedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  sopWebhookError?: {messageId: string, query: string, files: File[]} | null;
  onSopRetryLocal?: () => void;
}

export function ChatAreaReal({
  messages,
  isLoading,
  isMobile = false,
  isDarkMode = false,
  currentSearchType = 'yacht',
  onFilesUpload,
  uploadedFiles = [],
  onRemoveFile,
  sopWebhookError,
  onSopRetryLocal
}: ChatAreaRealProps) {

  // Get user context for handover
  const { user } = useAuth();

  // Handover modal state
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [selectedEmailForHandover, setSelectedEmailForHandover] = useState<any>(null);

  // Thumbs feedback state
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [feedbackSelections, setFeedbackSelections] = useState<{ [key: string]: 'up' | 'down' | null }>({});

  // File upload state for SOP mode
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File size limits (based on 85k token target, ~200 page max)
  const MAX_FILE_SIZE_MB = 50; // Text PDF: ~100-200 pages, Scanned: ~30-50 pages
  const MAX_TOTAL_SIZE_MB = 150; // Enough for multiple manuals
  const MAX_FILES = 10;

  // Validate file uploads
  const validateFiles = (newFiles: File[]): { valid: boolean; error?: string } => {
    // Check file count
    const totalFiles = uploadedFiles.length + newFiles.length;
    if (totalFiles > MAX_FILES) {
      return {
        valid: false,
        error: `Maximum ${MAX_FILES} files allowed. You selected ${totalFiles} files.`
      };
    }

    // Check individual file sizes
    for (const file of newFiles) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return {
          valid: false,
          error: `"${file.name}" is ${fileSizeMB.toFixed(1)}MB. Maximum ${MAX_FILE_SIZE_MB}MB per file.`
        };
      }
    }

    // Check total size
    const currentTotalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const newTotalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
    const totalSizeMB = (currentTotalSize + newTotalSize) / (1024 * 1024);

    if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
      return {
        valid: false,
        error: `Total upload size ${totalSizeMB.toFixed(1)}MB exceeds ${MAX_TOTAL_SIZE_MB}MB limit.`
      };
    }

    return { valid: true };
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validation = validateFiles(files);
      if (validation.valid) {
        setUploadError(null);
        if (onFilesUpload) {
          onFilesUpload(files);
        }
      } else {
        setUploadError(validation.error || 'Upload failed');
        setTimeout(() => setUploadError(null), 5000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validation = validateFiles(fileArray);

      if (validation.valid) {
        setUploadError(null);
        if (onFilesUpload) {
          onFilesUpload(fileArray);
        }
      } else {
        setUploadError(validation.error || 'Upload failed');
        setTimeout(() => setUploadError(null), 5000);
      }
    }
    // Reset input
    e.target.value = '';
  };

  // Bridge Clarify state
  const [showCustomClarify, setShowCustomClarify] = useState<string | null>(null); // Stores message ID for custom mode
  const [customClarifyQuery, setCustomClarifyQuery] = useState('');
  const [clarifyLoading, setClarifyLoading] = useState<string | null>(null); // Tracks which message is being clarified
  const [clarifyResponse, setClarifyResponse] = useState<{ [key: string]: string }>({});

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]); // Scroll when messages change or loading state changes

  useEffect(() => {
    console.info("%c[CHAT_MOUNT] ChatAreaReal", "color:#0A84FF");
  }, []);

  useEffect(() => {
    console.info("[CHAT_STATE]", { count: messages.length, hasMessages: messages.length > 0 });
  }, [messages.length]);

  const handleThumbsFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedbackSelections(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }));
    console.log('Thumbs feedback:', { messageId, type });
  };

  // Extract chunks from nested ui_payload structure (fallback)
  const extractChunksFromMessage = (message: any): Chunk[] => {
    // Try direct chunks first
    if (message.chunks && message.chunks.length > 0) {
      return message.chunks;
    }

    // Fallback: Extract from ui_payload structure in the actual response data
    // The backend sends data in this format (from screenshot):
    // [{ ui_payload: { primary_documents, other_documents } }]
    const chunks: Chunk[] = [];

    // Try to find ui_payload in the message or in solutions array
    let uiPayload = (message as any).ui_payload;

    // Sometimes the entire response array is stored - check first element
    if (Array.isArray(message) && message[0]?.ui_payload) {
      uiPayload = message[0].ui_payload;
    }

    if (uiPayload) {
      // Extract from primary_documents
      const primaryDocs = uiPayload.primary_documents || uiPayload.primary_docs || [];
      primaryDocs.forEach((doc: any) => {
        if (doc.chunks) {
          doc.chunks.forEach((chunk: any) => {
            chunks.push({
              file_name: chunk.display_name || doc.display_name || 'Unknown',
              file_location: chunk.document_path || doc.document_path || '',
              page_number: chunk.page_number || 0,
              content: chunk.text || chunk.content || chunk.raw_text || ''
            });
          });
        }
      });

      // Extract from other_documents
      const otherDocs = uiPayload.other_documents || uiPayload.other_docs || [];
      otherDocs.forEach((doc: any) => {
        if (doc.chunks) {
          doc.chunks.forEach((chunk: any) => {
            chunks.push({
              file_name: chunk.display_name || doc.display_name || 'Unknown',
              file_location: chunk.document_path || doc.document_path || '',
              page_number: chunk.page_number || 0,
              content: chunk.text || chunk.content || chunk.raw_text || ''
            });
          });
        }
      });
    }

    return chunks;
  };

  // Handle Bridge Clarify - supports both auto and custom modes
  const handleClarify = async (messageId: string, mode: 'auto' | 'custom' = 'auto') => {
    // Prevent multiple simultaneous clarifications
    if (clarifyLoading) return;

    // For custom mode, require query text
    if (mode === 'custom' && !customClarifyQuery.trim()) return;

    // Find the message to get chunks and context
    const message = messages.find(m => m.id === messageId);
    if (!message) {
      console.error('Message not found');
      return;
    }

    // Extract chunks with fallback
    const chunks = extractChunksFromMessage(message);

    if (chunks.length === 0) {
      console.error('No chunks available for Clarify. Message:', message);
      setClarifyResponse(prev => ({
        ...prev,
        [messageId]: 'No document context available. Clarify works only on results that include retrieved documents. Try running a new search for your question.'
      }));
      return;
    }

    console.log(`📦 Extracted ${chunks.length} chunks from message:`, chunks);

    setClarifyLoading(messageId);

    try {
      // Get auth token
      const authToken = localStorage.getItem('auth_token') || user?.userId;

      // Get original query from ui_payload if available
      let originalQuery = message.original_query || message.content;
      const uiPayload = (message as any).ui_payload || (Array.isArray(message) && message[0]?.ui_payload);
      if (uiPayload && uiPayload.query_text) {
        originalQuery = uiPayload.query_text;
      }

      // Determine follow-up query based on mode
      const followUpQuery = mode === 'auto'
        ? 'clarify_previous_result'
        : customClarifyQuery.trim();

      // Prepare payload
      const payload = {
        mode: mode === 'auto' ? 'auto_clarify' : 'custom_clarify',
        follow_up_query: followUpQuery,
        original_query: originalQuery,
        conversation_id: messageId,
        retrieved_chunks: chunks,
        context_source: 'last_chunks',
        search_strategy: message.search_strategy || 'NAS',
        timestamp: new Date().toISOString(),
        auth_token: authToken
      };

      console.log('🚀 [Bridge Clarify] Sending request:', payload);

      // Call the ask-ai endpoint (Tier 1: Clarify)
      const askAiUrl = window.location.hostname.includes('celeste7.ai') || window.location.hostname.includes('vercel.app')
        ? 'https://api.celeste7.ai/webhook/ask-ai'
        : 'http://localhost:5678/webhook/ask-ai';

      const response = await fetch(askAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [Bridge Clarify] Response received:', data);

      // Handle array response structure: [{ success: true, ai_response: {...} }]
      const responseData = Array.isArray(data) ? data[0] : data;

      // Extract answer from nested structure
      let answerText = 'No answer provided';
      if (responseData?.ai_response?.answer) {
        answerText = responseData.ai_response.answer;
      } else if (responseData?.answer) {
        answerText = responseData.answer;
      } else if (responseData?.message) {
        answerText = responseData.message;
      }

      // Store the response with metadata
      setClarifyResponse(prev => ({
        ...prev,
        [messageId]: answerText
      }));

      // Clear custom input if used
      if (mode === 'custom') {
        setCustomClarifyQuery('');
        setShowCustomClarify(null);
      }
    } catch (error) {
      console.error('❌ [Bridge Clarify] Error:', error);
      setClarifyResponse(prev => ({
        ...prev,
        [messageId]: `Unable to clarify: ${error instanceof Error ? error.message : 'Connection failed. Please try again.'}`
      }));
    } finally {
      setClarifyLoading(null);
    }
  };

  const handleCustomClarifyKeyDown = (e: React.KeyboardEvent, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleClarify(messageId, 'custom');
    }
  };

  // Open handover modal with selected solution
  const handleHandover = (solution: any) => {
    if (!user?.userId) {
      alert('Please log in to add items to handover');
      return;
    }

    setSelectedEmailForHandover(solution);
    setHandoverModalOpen(true);
  };

  // Save handover data from modal form
  const handleModalSave = async (formData: any) => {
    if (!user?.userId || !selectedEmailForHandover) return;

    try {
      const result = await saveHandover({
        user_id: user.userId,
        yacht_id: user.yachtId || 'default',
        solution_id: selectedEmailForHandover.id,
        document_name: selectedEmailForHandover.display_name || selectedEmailForHandover.subject || selectedEmailForHandover.filename,
        document_path: selectedEmailForHandover.links?.document || selectedEmailForHandover.doc_link,
        system_affected: formData.system,
        fault_code: formData.fault_code,
        symptoms: formData.symptoms,
        actions_taken: formData.actions_taken,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        status: 'draft'
      });

      if (result.success) {
        alert('✅ Added to handover successfully!');
        setHandoverModalOpen(false);
        setSelectedEmailForHandover(null);
      } else {
        alert(`Failed to add to handover: ${result.error}`);
      }
    } catch (error) {
      console.error('Handover error:', error);
      alert('Failed to add to handover. Please try again.');
    }
  };

  return (
    <>
      {/* Hide scrollbar CSS */}
      <style>{`
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        data-debug="ChatAreaReal"
        id="chat-root-ChatAreaReal"
        className={isMobile ? "h-[100dvh] overflow-hidden flex flex-col" : "h-full w-full flex flex-col"}
        onDragOver={currentSearchType === 'sop' ? handleDragOver : undefined}
        onDragLeave={currentSearchType === 'sop' ? handleDragLeave : undefined}
        onDrop={currentSearchType === 'sop' ? handleDrop : undefined}
      >
        {/* Global drag overlay for SOP mode - shows when dragging files anywhere */}
        {currentSearchType === 'sop' && isDragging && messages.length > 0 && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-blue-500 bg-white/90 dark:bg-gray-900/90"
              style={{
                maxWidth: '400px'
              }}
            >
              <Upload className="w-16 h-16 text-blue-600 dark:text-blue-400" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Drop files to upload
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Release to add documents to this conversation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Header - Static CelesteOS BRIDGE branding */}
        <MainHeader
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          isChatMode={true}
        />

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 hidden-scrollbar"
        style={{
          scrollPaddingBottom: '160px',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          WebkitOverflowScrolling: 'touch' // iOS momentum scrolling
        }}
      >
        {/* Upload Error Message - Clean like ChatGPT */}
        {uploadError && (
          <div className={`${isMobile ? 'mx-2' : 'mx-auto'} w-full max-w-[1060px] mb-4 animate-in fade-in slide-in-from-top-2 duration-300`}>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {uploadError}
                </p>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Uploaded Files Preview - Only in SOP mode */}
        {currentSearchType === 'sop' && uploadedFiles.length > 0 && (
          <div className={`${isMobile ? 'mx-2' : 'mx-auto'} w-full max-w-[1060px] mb-4`}>
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Uploaded Files ({uploadedFiles.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl group hover:shadow-md transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {onRemoveFile && (
                      <button
                        onClick={() => onRemoveFile(index)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove file"
                      >
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Frosted chat sheet - bounded, not full-screen */}
        <div className={`${styles.celChatSheet} ${isDarkMode ? styles.dark : ''} relative z-20 ${isMobile ? 'mx-2' : 'mx-auto'} w-full max-w-[1060px] mt-4 rounded-3xl backdrop-blur-[36px] backdrop-saturate-[160%] bg-gradient-to-b from-white/90 via-white/80 to-white/75 dark:bg-gradient-to-b dark:from-neutral-900 dark:via-neutral-950 dark:to-black border border-white/50 dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.6)] p-6`}>
          <div className="space-y-6">
          {messages.length === 0 ? (
            currentSearchType === 'sop' ? (
              // SOP Upload Interface
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative text-center py-24 px-8 cursor-pointer
                    transition-all duration-200 ease-in-out
                    rounded-2xl border-2 border-dashed
                    ${isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-[1.02]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'} transition-colors`}>
                      {isDragging ? (
                        <Upload className={`w-12 h-12 text-blue-600 dark:text-blue-400`} />
                      ) : (
                        <FileText className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {isDragging ? 'Drop your manuals here' : 'Upload manuals'}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Drag and drop files here, or click to browse
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Supports PDF, DOC, DOCX, TXT files
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Regular empty state
              <div className="text-center py-12">
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Start a conversation
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Type a message below to begin
                </p>
              </div>
            )
          ) : (
            // Messages list
            messages.map((message) => (
              <div key={message.id} className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>
                </div>
                
                {/* Message Content */}
                <div
                  className="flex-1 space-y-2"
                  onMouseEnter={() => !isMobile && message.role === 'assistant' && setHoveredMessage(message.id)}
                  onMouseLeave={() => !isMobile && setHoveredMessage(null)}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {message.role === 'user' ? 'You' : 'CelesteOS'}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Show SOP Canvas Card if this is an SOP message */}
                  {(message as any).ui_payload?.sop_id ? (
                    <SOPCanvasCard
                      sopData={{
                        sop_id: (message as any).ui_payload.sop_id,
                        title: (message as any).ui_payload.title || 'Standard Operating Procedure',
                        content_md: message.content, // AI-generated SOP (editable)
                        yacht_id: user?.yacht_id || 'default_yacht',
                        user_id: user?.userId || 'default_user',
                        timestamp: message.timestamp
                      }}
                      onUpdate={(updatedSOP) => {
                        console.log('✅ SOP Canvas updated:', {
                          sop_id: updatedSOP.sop_id,
                          title: updatedSOP.title,
                          content_length: updatedSOP.content_md?.length || 0,
                          content_preview: updatedSOP.content_md?.substring(0, 100) + '...'
                        });
                      }}
                    />
                  ) : (
                    <>
                      {/* Hide message text in search mode when solutions are present */}
                      {!(message.mode === 'search' && message.solutions && message.solutions.length > 0) && (
                        <div className={`prose prose-sm max-w-none ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {message.content}
                        </div>
                      )}
                    </>
                  )}

                  {/* Display Clarification Response - Moved up before solutions */}
                  {message.role === 'assistant' && clarifyResponse[message.id] && (
                        <div
                          className="ask_ai_response mt-4 rounded-lg overflow-hidden"
                          style={{
                            backgroundColor: 'rgba(0, 112, 255, 0.05)',
                            borderLeft: '3px solid #2563eb'
                          }}
                        >
                          {/* Response Header */}
                          <div
                            className="px-4 py-2 text-xs font-medium border-b"
                            style={{
                              backgroundColor: 'rgba(37, 99, 235, 0.1)',
                              borderBottomColor: 'rgba(37, 99, 235, 0.15)',
                              color: '#2563eb'
                            }}
                          >
                            ⚡ Clarified from current results
                          </div>
                          {/* Response Content */}
                          <div
                            className="p-4"
                            style={{
                              color: isDarkMode ? '#f6f7fb' : '#1f2937',
                              fontSize: '15px',
                              lineHeight: '24px',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {clarifyResponse[message.id]}
                          </div>
                        </div>
                  )}

                  {/* Custom Clarify Input - Optional for power users - Moved up before solutions */}
                  {message.role === 'assistant' && showCustomClarify === message.id && (
                    <div className="custom_clarify_input_container mt-3">
                      <div
                        className="flex items-center gap-3 p-4 border rounded-lg"
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(15, 11, 18, 0.95)'
                            : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          borderColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.1)',
                          boxShadow: isDarkMode
                            ? '0 4px 12px rgba(0, 0, 0, 0.25)'
                            : '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <input
                          type="text"
                          value={customClarifyQuery}
                          onChange={(e) => setCustomClarifyQuery(e.target.value)}
                          onKeyDown={(e) => handleCustomClarifyKeyDown(e, message.id)}
                          placeholder="e.g. 'Explain step 3' or 'What does vent mean?'"
                          disabled={clarifyLoading === message.id}
                          autoFocus
                          className="flex-1 bg-transparent border-none outline-none text-base"
                          style={{
                            color: isDarkMode ? '#f6f7fb' : '#1f2937'
                          }}
                        />
                        <button
                          onClick={() => handleClarify(message.id, 'custom')}
                          disabled={!customClarifyQuery.trim() || clarifyLoading === message.id}
                          className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: (customClarifyQuery.trim() && clarifyLoading !== message.id)
                              ? '#2563eb'
                              : 'rgba(107, 114, 128, 0.3)'
                          }}
                        >
                          {clarifyLoading === message.id ? (
                            <div
                              className="animate-spin rounded-full border-2 border-white border-t-transparent"
                              style={{ width: '16px', height: '16px' }}
                            />
                          ) : (
                            <Send className="w-5 h-5 text-white" />
                          )}
                        </button>
                      </div>
                      {/* Scope helper text */}
                      <div
                        className="mt-2 text-xs"
                        style={{
                          color: 'rgba(37, 99, 235, 0.7)',
                          fontStyle: 'italic'
                        }}
                      >
                        ✎ Custom clarification - still uses current results only
                      </div>
                    </div>
                  )}


                  {/* ========================================
                      AI SUMMARY MODE DISPLAY (ux_display: 'ai_summary')
                      ======================================== */}
                  {message.role === 'assistant' && message.mode !== 'search' && (
                    <>
                      {/* AI Summary Box - Only in AI mode */}
                      {message.show_ai_summary === true && message.ai_summary && (
                        <div className="mt-4">
                          <AISummaryBox
                            data={message.ai_summary}
                            isDarkMode={isDarkMode}
                            isMobile={isMobile}
                          />
                        </div>
                      )}

                      {/* AI Solution Cards - Full expanded card view */}
                      {message.solutions && message.solutions.length > 0 && (
                        <div className="mt-4">
                          <AISolutionCard
                            solutions={message.solutions.map((sol, idx) => ({
                              id: sol.sol_id || sol.search_sol_id || sol.id || `sol_${idx}`,
                              title: sol.display_name || sol.filename || sol.title || 'Document',
                              confidence: (sol.match_ratio || sol.relevance_score || sol.confidence || 0) >= 0.8 ? 'high' : (sol.match_ratio || sol.relevance_score || sol.confidence || 0) >= 0.6 ? 'medium' : 'low',
                              confidenceScore: Math.round((sol.match_ratio || sol.relevance_score || sol.confidence || 0) * 100),
                              source: {
                                title: sol.display_name || sol.filename || sol.source?.title || 'Document',
                                page: sol.best_page || sol.source?.page
                              },
                              steps: [{
                                // FIXED: Added sol.text as fallback (nas_processor.js uses 'text' field)
                                text: sol.content_preview || sol.snippet || sol.text || sol.content || '',
                                type: 'normal'
                              }],
                              procedureLink: sol.links?.document || sol.doc_link,
                              related_docs: message.other_docs?.map(doc => ({
                                file_name: doc.display_name || doc.filename || doc.title,
                                doc_link: doc.links?.document || doc.doc_link,
                                confidence: doc.match_ratio || doc.relevance_score || doc.confidence
                              })),
                              all_docs: message.all_docs?.map(doc => ({
                                file_name: doc.display_name || doc.filename || doc.title,
                                doc_link: doc.links?.document || doc.doc_link,
                                confidence: doc.match_ratio || doc.relevance_score || doc.confidence
                              })),
                              // Pass original solution data for handover modal
                              display_name: sol.display_name,
                              filename: sol.filename,
                              links: sol.links,
                              doc_link: sol.doc_link,
                              sender: sol.sender,
                              received_date: sol.received_date,
                              content_preview: sol.content_preview,
                              snippet: sol.snippet,
                              handover_section: sol.handover_section
                            }))}
                            isMobile={isMobile}
                            isDarkMode={isDarkMode}
                            mode={message.mode}
                            handover_section={message.handover_section}
                            conversationId={message.id}
                            queryText={message.content}
                            yachtId={undefined}
                            onHandover={handleHandover}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* ========================================
                      SEARCH MODE DISPLAY (ux_display: 'search_mode')
                      Simple minimalist list with confidence-based filtering
                      ======================================== */}
                  {message.role === 'assistant' && message.mode === 'search' && message.solutions && message.solutions.length > 0 && (
                    <div className="mt-4">
                      <SimpleSearchList
                        solutions={message.solutions.map((sol, idx) => ({
                          // Email IDs vs Document IDs
                          id: sol.id || sol.sol_id || sol.search_sol_id || `sol_${idx}`,

                          // Email uses display_name (subject), documents use filename/title
                          display_name: sol.display_name || sol.subject || sol.filename || sol.title,
                          filename: sol.filename, // Documents only
                          title: sol.title,

                          // Pages (documents only)
                          best_page: sol.best_page,
                          all_pages: sol.all_pages || sol.matching_pages,

                          // Confidence scoring (different field names)
                          match_ratio: sol.match_ratio || sol.relevance_score || sol.confidence,
                          relevance_score: sol.relevance_score,
                          confidence: sol.confidence,

                          // Content preview - FIXED: Added sol.text as fallback (nas_processor.js uses 'text' field)
                          content_preview: sol.content_preview || sol.snippet || sol.text,
                          snippet: sol.snippet || sol.text,
                          text: sol.text,  // Preserve original text field

                          // Links (email has {document, web, desktop}, docs have doc_link)
                          links: sol.links || {},
                          doc_link: sol.doc_link || sol.links?.document,

                          // Email-specific fields (optional)
                          sender: sol.sender,
                          received_date: sol.received_date || sol.receivedDateTime,
                          has_attachments: sol.hasAttachments || sol.has_attachments,
                          entity_boost: sol.entity_boost,
                          entity_coverage: sol.entity_coverage,
                          search_type: sol.search_type,

                          // Metadata
                          metadata: sol.metadata
                        }))}
                        onHandover={handleHandover}
                        isDarkMode={isDarkMode}
                        isMobile={isMobile}
                      />
                    </div>
                  )}

                  {/* Thumbs Feedback & Clarify Buttons - Moved to bottom after solutions */}
                  {message.role === 'assistant' && (
                    <div
                      className={`flex items-center gap-2 mt-4 transition-opacity duration-200 thumbs_feedback_container ${
                        isMobile || hoveredMessage === message.id || feedbackSelections[message.id]
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    >
                      <button
                        onClick={() => handleThumbsFeedback(message.id, 'up')}
                        className="group thumbs_up_button transition-all duration-200 hover:scale-110 active:scale-95"
                        style={{
                          width: isMobile ? '40px' : '32px',
                          height: isMobile ? '40px' : '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          background: feedbackSelections[message.id] === 'up'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'transparent',
                          border: feedbackSelections[message.id] === 'up'
                            ? '1px solid rgba(34, 197, 94, 0.3)'
                            : '1px solid transparent',
                          cursor: 'pointer'
                        }}
                        title="Helpful"
                        aria-label="Mark as helpful"
                      >
                        <ThumbsUp
                          className={isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'}
                          style={{
                            color: feedbackSelections[message.id] === 'up'
                              ? isDarkMode ? '#4ade80' : '#16a34a'
                              : isDarkMode ? '#6b7280' : '#9ca3af',
                            strokeWidth: feedbackSelections[message.id] === 'up' ? 2.5 : 2
                          }}
                        />
                      </button>

                      <button
                        onClick={() => handleThumbsFeedback(message.id, 'down')}
                        className="group thumbs_down_button transition-all duration-200 hover:scale-110 active:scale-95"
                        style={{
                          width: isMobile ? '40px' : '32px',
                          height: isMobile ? '40px' : '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          background: feedbackSelections[message.id] === 'down'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'transparent',
                          border: feedbackSelections[message.id] === 'down'
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid transparent',
                          cursor: 'pointer'
                        }}
                        title="Not helpful"
                        aria-label="Mark as not helpful"
                      >
                        <ThumbsDown
                          className={isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'}
                          style={{
                            color: feedbackSelections[message.id] === 'down'
                              ? isDarkMode ? '#f87171' : '#dc2626'
                              : isDarkMode ? '#6b7280' : '#9ca3af',
                            strokeWidth: feedbackSelections[message.id] === 'down' ? 2.5 : 2
                          }}
                        />
                      </button>

                      {/* Bridge Clarify - Hidden in SOP mode */}
                      {currentSearchType !== 'sop' && (
                        <>
                          {/* Bridge Clarify - Auto Mode (one-click) */}
                          <button
                            onClick={() => handleClarify(message.id, 'auto')}
                            disabled={clarifyLoading === message.id}
                            className="group clarify_button flex items-center gap-1.5 px-3 py-1.5 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              borderRadius: '6px',
                              backgroundColor: 'rgba(0, 112, 255, 0.08)',
                              border: '1px solid rgba(0, 112, 255, 0.25)',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#2563eb',
                              cursor: clarifyLoading === message.id ? 'not-allowed' : 'pointer'
                            }}
                            title="Instant interpretation of current results"
                            aria-label="Clarify this section"
                          >
                            {clarifyLoading === message.id ? (
                              <div
                                className="animate-spin rounded-full border-2 border-current border-t-transparent"
                                style={{ width: '14px', height: '14px' }}
                              />
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            )}
                            <span>Clarify</span>
                          </button>

                          {/* Custom Clarify Toggle (power users) */}
                          <button
                            onClick={() => setShowCustomClarify(showCustomClarify === message.id ? null : message.id)}
                            disabled={clarifyLoading === message.id}
                            className="group custom_clarify_toggle p-1.5 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              borderRadius: '4px',
                              backgroundColor: showCustomClarify === message.id
                                ? 'rgba(0, 112, 255, 0.08)'
                                : 'transparent',
                              border: showCustomClarify === message.id
                                ? '1px solid rgba(0, 112, 255, 0.25)'
                                : '1px solid transparent',
                              color: '#2563eb',
                              cursor: clarifyLoading === message.id ? 'not-allowed' : 'pointer'
                            }}
                            title="Custom clarification"
                            aria-label="Add specific follow-up question"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* SOP Webhook Retry Button - Show when cloud endpoint fails */}
          {sopWebhookError && onSopRetryLocal && (
            <div className={`${isMobile ? 'mx-2' : 'mx-auto'} w-full max-w-[1060px] mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Cloud service unavailable
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      Would you like to try using your local n8n instance instead?
                    </p>
                    <button
                      onClick={onSopRetryLocal}
                      disabled={isLoading}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try Local Server (localhost:5678)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                  AI
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    CelesteOS
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor - invisible div at bottom for auto-scroll */}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>
        </div>
      </div>
    </div>

    {/* Handover Modal */}
    {selectedEmailForHandover && (
      <HandoverModal
        emailData={selectedEmailForHandover}
        isOpen={handoverModalOpen}
        onClose={() => {
          setHandoverModalOpen(false);
          setSelectedEmailForHandover(null);
        }}
        onSave={handleModalSave}
        isDarkMode={isDarkMode}
      />
    )}
    </>
  );
}