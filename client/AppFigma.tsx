import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/layout/ChatArea';
import { ChatAreaReal } from './components/layout/ChatAreaReal';
import { InputArea } from './components/layout/InputArea';
import { ChatComposer } from './components/chat/ChatComposer';
import SettingsEntry from './components/settings/SettingsEntry';
import { Login } from './components/auth/Login';
import { DesktopMobileComparison } from './figma-components/DesktopMobileComparison';
import { BackgroundSystem } from './figma-components/BackgroundSystem';
import { MobileHeader } from './components/layout/MobileHeader';
import { getSidebarWidth, checkIsMobile, checkComparisonMode } from './components/layout/appUtils';
import { SopCreation } from './components/SopCreation';
// DISABLED: figma-compiled.css was constraining to mobile widths
// import './figma-compiled.css';
import './styles/responsive-layout.css';
import './styles/app-layout.css';
import { useAuth } from './contexts/AuthContext';
// Updated webhook service with ai_bypass logic
import completeWebhookService from './services/webhookServiceComplete';
import { createSunSweepOverlay } from './utils/sunSweep';
import { flags } from './utils/featureFlags';
import { chatService } from './services/chatService';

type SearchType = 'yacht' | 'email' | 'sop';

interface DocSummary {
  title: string;
  doc_link: string;
  confidence: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;

  // Response mode - controls UI variant
  mode?: 'ai' | 'search' | 'ai_enhanced';

  // Workflow control flag for AI summary display
  show_ai_summary?: boolean;

  // AI summary - new structure supports both formats
  ai_summary?: {
    text: string;
    confidence: number;
    enabled: boolean;
  } | null;

  // Handover section - new field for engineering handover data
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

  // Solutions array
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
  other_docs?: DocSummary[];
  all_docs?: DocSummary[];
  query_id?: string;
  conversation_id?: string;
  search_type?: string;
  // Full ui_payload for Ask AI functionality
  ui_payload?: any;
  original_query?: string;
  search_strategy?: 'NAS' | 'email' | 'web';
}

export default function App() {
  // Use Supabase authentication
  const { user, isLoading, isAuthenticated, session } = useAuth();
  // console.log('App initialized with authentication:', { user: user?.email, isAuthenticated });
  const [isChatMode, setIsChatMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Unified sidebar state: <lg = drawer, ≥lg = collapsible rail
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // <lg: off-canvas drawer
  const [isRailCollapsed, setIsRailCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cel.sidebar.collapsed") ?? "false");
    } catch {
      return false;
    }
  }); // ≥lg: collapsible rail
  const [showComparison, setShowComparison] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.userName || 'User');
  const [appearance, setAppearanceState] = useState('light');

  // Enhanced appearance setter with animation
  const setAppearance = async (newAppearance: string) => {
    if (newAppearance === appearance) return; // No change needed

    console.log('🎨 AppFigma Theme Change:', {
      from: appearance,
      to: newAppearance,
      flagEnabled: flags.FX_SUN_SWEEP
    });

    if (flags.FX_SUN_SWEEP && (newAppearance === 'light' || newAppearance === 'dark')) {
      // Start animation with theme switch callback
      const switchTheme = () => {
        console.log('🔄 Switching theme in AppFigma');
        setAppearanceState(newAppearance);

        // Apply to document immediately
        if (newAppearance === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };

      console.log('🌅 Starting sun sweep for', newAppearance);
      await createSunSweepOverlay(newAppearance as 'light' | 'dark', switchTheme);
      console.log('✅ Sun sweep complete');
    } else {
      // No animation - immediate switch
      setAppearanceState(newAppearance);
      if (newAppearance === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  const [currentSearchType, setCurrentSearchType] = useState<SearchType>('yacht');
  const [selectedModel, setSelectedModel] = useState<string>('air');

  // Generate UUIDs for database compatibility
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Chat state for real messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [conversationId, setConversationId] = useState(generateUUID());
  const [sessionId, setSessionId] = useState(generateUUID());
  const [currentSearchStrategy, setCurrentSearchStrategy] = useState<'nas' | 'yacht' | 'email' | 'sop'>('nas');

  // SOP webhook fallback state
  const [sopWebhookError, setSopWebhookError] = useState<{messageId: string, query: string, files: File[]} | null>(null);

  // Chat session management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);

  // View management (chat vs SOP creation)
  const [currentView, setCurrentView] = useState<'chat' | 'sop' | null>(null);

  // File upload state for SOP mode
  const [sopUploadedFiles, setSopUploadedFiles] = useState<File[]>([]);

  // Update display name when user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.userName || user.email || 'User');
      console.log('User authenticated:', user.email);
    }
  }, [user]);

  // Persist rail collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("cel.sidebar.collapsed", JSON.stringify(isRailCollapsed));
  }, [isRailCollapsed]);

  // Check if device is mobile and close drawer on viewport change
  useEffect(() => {
    const handleResize = () => {
      const mobile = checkIsMobile();
      console.log('[AppFigma] Mobile check - isMobile:', mobile);
      setIsMobile(mobile);

      // Close drawer when viewport grows from <lg → ≥lg
      if (!mobile && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDrawerOpen]);

  // Check for comparison mode from URL hash
  useEffect(() => {
    const handleHashChange = () => setShowComparison(checkComparisonMode());
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close drawer when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsDrawerOpen(false);
    }
  }, [isMobile]);

  // Apply chat mode class to body for clean white workspace
  useEffect(() => {
    if (isAuthenticated && isChatMode) {
      document.body.classList.add('chat-mode');
    } else {
      document.body.classList.remove('chat-mode');
    }
    return () => document.body.classList.remove('chat-mode');
  }, [isAuthenticated, isChatMode]);

  const handleLogin = async (username: string, password: string) => {
    // Login is now handled by the AuthContext and Supabase
    // This callback is mainly for UI feedback
    console.log('Login attempt for:', username);
    // The AuthContext will handle the actual authentication
    // and the component will re-render when user state changes
  };

  const handleStartChat = async (searchType?: SearchType, firstMessage?: string) => {
    if (searchType) {
      setCurrentSearchType(searchType);
      console.log('Starting chat with search type:', searchType);
    }

    if (isMobile) {
      setIsDrawerOpen(false);
    }

    // Set chat mode and clear messages immediately
    setIsChatMode(true);
    setMessages([]);
    setCurrentInput(''); // Clear input

    // If there's a first message, send it directly to webhook
    if (firstMessage && firstMessage.trim()) {
      console.log('Sending first message directly:', firstMessage);
      await handleSendMessage(firstMessage);
    }
  };
  
  // Handle sending messages
  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!text.trim() || isLoadingMessage) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput(''); // Clear input after adding message
    setIsLoadingMessage(true);

    // Save user message to database
    await chatService.addMessage(
      sessionId,
      'user',
      text
    );

    try {
      // Handle SOP Creation separately
      if (currentSearchType === 'sop') {
        // Use provided files or files from upload area
        const filesToSend = files || sopUploadedFiles;
        console.log('🧾 Sending SOP creation request:', text, 'Files:', filesToSend.length);

        let sopResponse;
        let sopData;
        const primaryEndpoint = import.meta.env.VITE_WEBHOOK_BASE_URL
          ? `${import.meta.env.VITE_WEBHOOK_BASE_URL}/sop-creation`
          : 'https://api.celeste7.ai/webhook/sop-creation';
        const fallbackEndpoint = primaryEndpoint;

        try {
          // Try primary endpoint first
          console.log('📡 Trying primary endpoint:', primaryEndpoint);

          // If files are provided, use FormData, otherwise use JSON
          if (filesToSend && filesToSend.length > 0) {
            const formData = new FormData();
            formData.append('query', text);
            formData.append('use_docs', 'true');
            formData.append('user', JSON.stringify({
              id: user?.userId || `user_${Date.now()}`,
              email: user?.email || 'user@example.com',
              role: 'engineer'
            }));
            formData.append('jwt', session?.access_token || '');

            // Append all files
            filesToSend.forEach((file, index) => {
              formData.append(`files`, file);
            });

            sopResponse = await fetch(primaryEndpoint, {
              method: 'POST',
              body: formData
            });
          } else {
            // No files - use JSON
            sopResponse = await fetch(primaryEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: text,
                use_docs: true,
                user: {
                  id: user?.userId || `user_${Date.now()}`,
                  email: user?.email || 'user@example.com',
                  role: 'engineer'
                },
                jwt: session?.access_token || ''
              })
            });
          }

          if (!sopResponse.ok) {
            throw new Error(`Primary endpoint failed: ${sopResponse.status}`);
          }

          sopData = await sopResponse.json();
          console.log('✅ SOP created via primary endpoint:', sopData);
          setSopWebhookError(null); // Clear any previous errors

        } catch (primaryError) {
          console.warn('⚠️ Primary endpoint failed, showing retry option:', primaryError);

          // Store error state for retry button
          setSopWebhookError({
            messageId: userMessage.id,
            query: text,
            files: filesToSend
          });

          // Show error message with retry button
          const errorMessage: Message = {
            id: `msg_error_${Date.now()}`,
            role: 'assistant',
            content: `Unable to connect to cloud SOP service (${primaryEndpoint}). The service may be temporarily unavailable.`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoadingMessage(false);
          return;
        }

        // Format SOP response as chat message with full SOP data
        // IMPORTANT: content_md is the AI-generated SOP (what should be editable)
        // original_query is the user's short query (for title display)
        const aiMessage: Message = {
          id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: sopData.content_md || sopData.content_markdown || 'SOP created successfully.',
          timestamp: new Date().toISOString(),
          mode: 'ai_enhanced',
          show_ai_summary: false,
          solutions: sopData.sources ? sopData.sources.map((source: string, idx: number) => ({
            id: `source_${idx}`,
            title: source,
            confidence: 0.9,
            content: '',
            source: source,
            type: 'document'
          })) : [],
          ui_payload: {
            sop_id: sopData.sop_id || `sop_${Date.now()}`,
            title: sopData.original_query || text || 'Standard Operating Procedure',
            yacht_id: sopData.yacht_id || user?.yacht_id || 'default_yacht',
            user_id: sopData.user_id || user?.userId || 'default_user',
            content_md: sopData.content_md || sopData.content_markdown, // AI REPLY - this is what gets edited
            timestamp: new Date().toISOString()
          }
        };

        setMessages(prev => [...prev, aiMessage]);

        // Save to database
        await chatService.addMessage(
          sessionId,
          'assistant',
          aiMessage.content,
          aiMessage.solutions || [],
          { ui_payload: aiMessage.ui_payload }
        );

        // Clear uploaded files after successful send
        setSopUploadedFiles([]);

        setIsLoadingMessage(false);
        return;
      }

      // Map search type to strategy for regular chat
      const strategyMap = {
        'yacht': 'yacht',
        'email': 'email',
        'nas': 'yacht' // NAS defaults to yacht strategy
      };

      console.log('Sending message via webhook:', text, 'strategy:', currentSearchStrategy, 'conversation:', conversationId);
      const response = await completeWebhookService.sendTextChat(
        text,
        strategyMap[currentSearchType] as any,
        {
          email: user?.email || 'user@example.com',
          userName: user?.userName || displayName || 'User',
          userId: user?.userId || `user_${Date.now()}`, // Fixed: use userId instead of id
          conversationId: conversationId,
          sessionId: sessionId,
          selectedModel: selectedModel
        }
      );
      
      // Parse n8n response (ui_payload format)
      const responseData = response.data || {};
      const uiPayload = responseData.ui_payload || {};
      const webhookPayload = responseData.webhook_payload || {};

      console.log('📦 Full webhook response:', responseData);
      console.log('📦 UI Payload:', uiPayload);
      console.log('📦 Primary solution:', uiPayload.primary_solution);
      console.log('📦 Other solutions count:', uiPayload.other_solutions?.length);
      console.log('📦 Direct solutions:', uiPayload.solutions);

      // Build solutions array from multiple possible fields
      const solutions = [];

      // Priority 1: Email RAG v4.0 structure (primary_findings, other_emails, all_emails)
      if (uiPayload.primary_findings && Array.isArray(uiPayload.primary_findings)) {
        solutions.push(...uiPayload.primary_findings);

        // Add other_emails (positions 6-10 from solution_emails)
        if (uiPayload.other_emails && Array.isArray(uiPayload.other_emails)) {
          solutions.push(...uiPayload.other_emails);
        }

        // Add all_emails (lower confidence results)
        if (uiPayload.all_emails && Array.isArray(uiPayload.all_emails)) {
          solutions.push(...uiPayload.all_emails);
        }
      }
      // Priority 2: Document RAG structure (primary_documents, other_documents, all_documents)
      else if (uiPayload.primary_documents && Array.isArray(uiPayload.primary_documents)) {
        // Extract chunks from primary_documents
        uiPayload.primary_documents.forEach(doc => {
          if (doc.chunks && Array.isArray(doc.chunks)) {
            solutions.push(...doc.chunks);
          }
        });

        // Extract chunks from other_documents (positions 6-10)
        if (uiPayload.other_documents && Array.isArray(uiPayload.other_documents)) {
          uiPayload.other_documents.forEach(doc => {
            if (doc.chunks && Array.isArray(doc.chunks)) {
              solutions.push(...doc.chunks);
            }
          });
        }

        // Extract chunks from all_documents (positions 11-15, lower confidence)
        if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
          uiPayload.all_documents.forEach(doc => {
            if (doc.chunks && Array.isArray(doc.chunks)) {
              solutions.push(...doc.chunks);
            }
          });
        }
      }
      // Fallback: Legacy all_documents structure (pre-transform)
      else if (uiPayload.all_documents && Array.isArray(uiPayload.all_documents)) {
        // Sort documents by confidence (high to low) BEFORE extracting chunks
        const sortedDocuments = [...uiPayload.all_documents].sort((a, b) => {
          const aScore = a.match_ratio || a.relevance_score || a.confidence || 0;
          const bScore = b.match_ratio || b.relevance_score || b.confidence || 0;
          return bScore - aScore; // High to low
        });

        // Extract chunks from sorted documents
        sortedDocuments.forEach(doc => {
          if (doc.chunks && Array.isArray(doc.chunks)) {
            solutions.push(...doc.chunks);
          } else {
            // If no chunks array, push the document itself (backward compatibility)
            solutions.push(doc);
          }
        });
        console.log('📊 Documents sorted by confidence:', sortedDocuments.length);
      }
      // Priority 3: Generic solutions array
      else if (uiPayload.solutions && Array.isArray(uiPayload.solutions)) {
        solutions.push(...uiPayload.solutions);
      }
      // Priority 4: Legacy primary + other structure
      else {
        if (uiPayload.primary_solution) {
          solutions.push(uiPayload.primary_solution);
        }
        if (uiPayload.other_solutions && Array.isArray(uiPayload.other_solutions)) {
          solutions.push(...uiPayload.other_solutions);
        }
      }

      console.log('✅ Total solutions captured:', solutions.length);
      console.log('✅ Solution sources:', {
        email_rag: {
          primary_findings: uiPayload.primary_findings?.length || 0,
          other_emails: uiPayload.other_emails?.length || 0,
          all_emails: uiPayload.all_emails?.length || 0
        },
        document_rag: {
          primary_documents: uiPayload.primary_documents?.length || 0,
          other_documents: uiPayload.other_documents?.length || 0,
          all_documents: uiPayload.all_documents?.length || 0,
          solutions: uiPayload.solutions?.length || 0,
          primary_solution: uiPayload.primary_solution ? 1 : 0,
          other_solutions: uiPayload.other_solutions?.length || 0
        }
      });

      /* ========================================
         MODE DETECTION - Controls UI Display
         ========================================
         The n8n workflow sends 'ux_display' field to control which UI variant to show:

         1. ux_display: 'ai_summary'
            → Shows AI Summary Box + Full Solution Cards
            → mode: 'ai_enhanced', show_ai_summary: true

         2. ux_display: 'search_mode'
            → Shows Simple Search Results List (no AI summary)
            → mode: 'search', show_ai_summary: false

         Fallback: If ux_display not provided, uses legacy fields
      */
      const uxDisplay = responseData.ux_display || uiPayload.ux_display;
      console.log('🎨 UX Display Mode:', uxDisplay);

      let mode: 'search' | 'ai' | 'ai_enhanced';
      let showAiSummary: boolean;

      if (uxDisplay === 'search_mode') {
        // SEARCH MODE: Simple list, no AI summary
        mode = 'search';
        showAiSummary = false;
        console.log('✅ Displaying SEARCH MODE (simple list, no AI summary)');
      } else if (uxDisplay === 'ai_summary') {
        // AI SUMMARY MODE: Full cards with AI summary box
        mode = 'ai_enhanced';
        showAiSummary = true;
        console.log('✅ Displaying AI SUMMARY MODE (with summary box + full cards)');
      } else {
        // Fallback: use old logic if ux_display not provided
        mode = uiPayload.mode || 'search';
        showAiSummary = uiPayload.show_ai_summary || false;
        console.log('⚠️ No ux_display found, using fallback mode:', mode);
      }

      const aiMessage: Message = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: uiPayload.query_text || uiPayload.query || responseData.response || 'I received your message. The workflow is currently under maintenance.',
        timestamp: new Date().toISOString(),
        mode: mode,
        show_ai_summary: showAiSummary,
        ai_summary: showAiSummary ? (uiPayload.ai_summary || null) : null, // Don't include AI summary for AIR model
        handover_section: uiPayload.handover_section || null,
        solutions: solutions.length > 0 ? solutions : (responseData.solutions || []),
        other_docs: uiPayload.additional_documents || uiPayload.other_documents || responseData.other_docs || [],
        all_docs: responseData.all_docs || [],
        query_id: uiPayload.query_id || responseData.query_id,
        conversation_id: uiPayload.conversation_id || responseData.conversation_id,
        search_type: responseData.search_type,
        // Add full ui_payload for Ask AI functionality
        ui_payload: uiPayload,
        original_query: responseData.original_query || text,
        search_strategy: responseData.search_strategy || 'NAS'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      await chatService.addMessage(
        sessionId,
        'assistant',
        aiMessage.content,
        aiMessage.solutions || [],
        {
          mode: aiMessage.mode,
          show_ai_summary: aiMessage.show_ai_summary,
          ai_summary: aiMessage.ai_summary,
          handover_section: aiMessage.handover_section,
          other_docs: aiMessage.other_docs,
          all_docs: aiMessage.all_docs,
          query_id: aiMessage.query_id,
          conversation_id: aiMessage.conversation_id,
          search_type: aiMessage.search_type,
          ui_payload: aiMessage.ui_payload,
          original_query: aiMessage.original_query,
          search_strategy: aiMessage.search_strategy
        }
      );

    } catch (error) {
      console.error('Message send error:', error);
      const errorMessage: Message = {
        id: `msg_error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting. Please ensure n8n is running and the workflow is active.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    console.log('Model changed to:', modelId);
  };

  // Handle chat session selection
  const handleChatSelect = async (sessionId: string) => {
    console.log('🔄 Loading chat session:', sessionId);
    setIsLoadingChatHistory(true);
    setCurrentSessionId(sessionId);

    try {
      // Load messages from the selected session
      const chatMessages = await chatService.getChatMessages(sessionId);

      // Convert database messages to UI format
      const formattedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        mode: msg.metadata?.mode as ('search' | 'ai' | 'ai_enhanced') | undefined,
        show_ai_summary: msg.metadata?.show_ai_summary,
        ai_summary: msg.metadata?.ai_summary,
        handover_section: msg.metadata?.handover_section,
        solutions: msg.sources || [],
        other_docs: msg.metadata?.other_docs || [],
        all_docs: msg.metadata?.all_docs || [],
        query_id: msg.metadata?.query_id,
        conversation_id: msg.metadata?.conversation_id,
        search_type: msg.metadata?.search_type,
        ui_payload: msg.metadata?.ui_payload,
        original_query: msg.metadata?.original_query,
        search_strategy: msg.metadata?.search_strategy
      }));

      setMessages(formattedMessages);
      setIsChatMode(formattedMessages.length > 0);
      setSessionId(sessionId);
      setCurrentSessionId(sessionId);

      console.log(`✅ Loaded ${formattedMessages.length} messages from session`);
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  const handleNewChat = async (searchStrategy: 'nas' | 'yacht' | 'email' | 'sop' = 'nas') => {
    // Create new conversation instance with fresh UUIDs
    const newConversationId = generateUUID();
    const newSessionId = generateUUID();

    setConversationId(newConversationId);
    setSessionId(newSessionId);
    setCurrentSearchStrategy(searchStrategy);

    // Set search strategy based on selection
    const strategyMap: Record<string, SearchType> = {
      'nas': 'yacht', // Default to yacht for NAS
      'yacht': 'yacht',
      'email': 'email',
      'sop': 'sop'
    };

    setCurrentSearchType(strategyMap[searchStrategy]);
    console.log('Creating new chat with strategy:', searchStrategy, '-> search type:', strategyMap[searchStrategy], 'conversation:', newConversationId);

    // Reset all chat state for fresh instance
    setIsChatMode(true); // Switch to chat mode immediately
    setMessages([]); // Clear previous messages
    setCurrentInput(''); // Reset input
    setCurrentView(null); // Reset view state
    setSopUploadedFiles([]); // Clear uploaded files

    // Close mobile drawer if open
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  const handleFilesUpload = (files: File[]) => {
    console.log('📎 Files uploaded:', files.length);
    setSopUploadedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveUploadedFile = (index: number) => {
    setSopUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Retry SOP creation with local endpoint
  const handleSopRetryLocal = async () => {
    if (!sopWebhookError) return;

    const { query, files } = sopWebhookError;
    setIsLoadingMessage(true);
    setSopWebhookError(null); // Clear error state

    const fallbackEndpoint = import.meta.env.VITE_WEBHOOK_BASE_URL
      ? `${import.meta.env.VITE_WEBHOOK_BASE_URL}/sop-creation`
      : 'https://api.celeste7.ai/webhook/sop-creation';
    console.log('🔄 Retrying with endpoint:', fallbackEndpoint);

    try {
      let sopResponse;

      // If files are provided, use FormData, otherwise use JSON
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('query', query);
        formData.append('use_docs', 'true');
        formData.append('user', JSON.stringify({
          id: user?.userId || `user_${Date.now()}`,
          email: user?.email || 'user@example.com',
          role: 'engineer'
        }));
        formData.append('jwt', session?.access_token || '');

        // Append all files
        files.forEach((file, index) => {
          formData.append(`files`, file);
        });

        sopResponse = await fetch(fallbackEndpoint, {
          method: 'POST',
          body: formData
        });
      } else {
        // No files - use JSON
        sopResponse = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            use_docs: true,
            user: {
              id: user?.userId || `user_${Date.now()}`,
              email: user?.email || 'user@example.com',
              role: 'engineer'
            },
            jwt: session?.access_token || ''
          })
        });
      }

      if (!sopResponse.ok) {
        throw new Error(`Local endpoint failed: ${sopResponse.status}`);
      }

      const sopData = await sopResponse.json();
      console.log('✅ SOP created via local endpoint:', sopData);

      // Format SOP response as chat message
      const aiMessage: Message = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: sopData.content_md || sopData.content_markdown || 'SOP created successfully.',
        timestamp: new Date().toISOString(),
        mode: 'ai_enhanced',
        show_ai_summary: false,
        solutions: sopData.sources ? sopData.sources.map((source: string, idx: number) => ({
          id: `source_${idx}`,
          title: source,
          confidence: 0.9,
          content: '',
          source: source,
          type: 'document'
        })) : [],
        ui_payload: {
          sop_id: sopData.sop_id || `sop_${Date.now()}`,
          title: sopData.original_query || query || 'Standard Operating Procedure',
          yacht_id: sopData.yacht_id || user?.yacht_id || 'default_yacht',
          user_id: sopData.user_id || user?.userId || 'default_user',
          content_md: sopData.content_md || sopData.content_markdown,
          timestamp: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to database
      await chatService.addMessage(
        sessionId,
        'assistant',
        aiMessage.content,
        aiMessage.solutions || [],
        { ui_payload: aiMessage.ui_payload }
      );

      // Clear uploaded files
      setSopUploadedFiles([]);

    } catch (error) {
      console.error('❌ Local endpoint also failed:', error);
      const errorMessage: Message = {
        id: `msg_error_${Date.now()}`,
        role: 'assistant',
        content: `Local SOP service (${fallbackEndpoint}) is also unavailable. Please ensure n8n is running on port 5678.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };
  const handleCloseSettings = () => setIsSettingsOpen(false);

  const handleShowSopCreation = () => {
    // Work like yacht/email search - start new chat with SOP strategy
    handleNewChat('sop');
  };

  const handleMainContentClick = () => {
    // Hide sidebar when clicking main content area on mobile (homepage only)
    if (isMobile && isDrawerOpen && !isChatMode) {
      setIsDrawerOpen(false);
    }
  };

  const isDarkMode = appearance === 'dark';

  if (showComparison) {
    return <DesktopMobileComparison />;
  }


  return (
    <div
      className={`app-container flex w-full flex-col relative overflow-hidden chat-mode-transition ${isDarkMode ? 'dark' : ''}`}
      style={{
        height: isMobile ? '100dvh' : '100vh',
        paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined
      }}
    >
      {/* Background System - ensure it's behind everything */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <BackgroundSystem 
          isDarkMode={isDarkMode}
          isChatMode={isChatMode}
          isLoggedIn={isAuthenticated}
        />
      </div>

      {/* Show Login Page if not authenticated */}
      {/* console.log('Render check - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading) */}
      {isLoading ? (
        <div className="relative z-10 h-full w-full flex items-center justify-center">
          <div>Loading...</div>
        </div>
      ) : !isAuthenticated ? (
        <div className="relative z-10 h-full w-full">
          {/* console.log('Rendering Login component') */}
          <Login onLogin={handleLogin} isMobile={isMobile} />
        </div>
      ) : (
        <>
          {/* Settings Modal */}
          <SettingsEntry 
            isOpen={isSettingsOpen} 
            onClose={handleCloseSettings} 
            isMobile={isMobile}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            isChatMode={isChatMode}
            appearance={appearance}
            onAppearanceChange={setAppearance}
          />

          <div className="relative flex h-full w-full flex-1 transition-colors z-10">
            {/* Mobile Header */}
            {isMobile && (
              <MobileHeader
                isMobileMenuOpen={isDrawerOpen}
                onToggleMobileMenu={() => setIsDrawerOpen(true)}
              />
            )}

            <div className="relative flex h-full w-full flex-row overflow-hidden">
              {/* Sidebar - Mobile: Always render for drawer, Desktop: Only when expanded */}
              {isMobile ? (
                <div
                  className={`fixed left-0 z-[55] h-full transition-all duration-300 ease-out ${
                    isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                  } ${getSidebarWidth(isMobile, isRailCollapsed)} shrink-0 overflow-hidden sidebar_container top-0`}
                  style={{
                    background: 'transparent !important',
                    '--sidebar-bg': 'transparent'
                  } as React.CSSProperties}
                >
                  <Sidebar
                    onNewChat={handleNewChat}
                    onOpenSettings={handleOpenSettings}
                    isMobile={isMobile}
                    isCollapsed={isRailCollapsed}
                    onToggleCollapse={() => setIsRailCollapsed(prev => !prev)}
                    onMobileMenuClose={() => setIsDrawerOpen(false)}
                    displayName={displayName}
                    isChatMode={isChatMode}
                    isDarkMode={isDarkMode}
                    onSearchTypeChange={setCurrentSearchType}
                    selectedSearchType={currentSearchType}
                    isDrawerOpen={isDrawerOpen}
                    onChatSelect={handleChatSelect}
                    currentSessionId={currentSessionId}
                    onShowSopCreation={handleShowSopCreation}
                    currentView={currentView}
                  />
                </div>
              ) : !isRailCollapsed ? (
                <Sidebar
                  onNewChat={handleNewChat}
                  onOpenSettings={handleOpenSettings}
                  isMobile={isMobile}
                  isCollapsed={isRailCollapsed}
                  onToggleCollapse={() => setIsRailCollapsed(prev => !prev)}
                  onMobileMenuClose={() => setIsDrawerOpen(false)}
                  displayName={displayName}
                  isChatMode={isChatMode}
                  isDarkMode={isDarkMode}
                  onSearchTypeChange={setCurrentSearchType}
                  selectedSearchType={currentSearchType}
                  isDrawerOpen={isDrawerOpen}
                  onChatSelect={handleChatSelect}
                  currentSessionId={currentSessionId}
                  onShowSopCreation={handleShowSopCreation}
                  currentView={currentView}
                />
              ) : null}

              {/* Expand Button - Positioned below header, aligned with sidebar items */}
              {!isMobile && isRailCollapsed && (
                <button
                  onClick={() => setIsRailCollapsed(false)}
                  className="fixed left-2 top-16 z-30 w-9 h-9 items-center justify-center rounded-full backdrop-blur-[20px] backdrop-saturate-[140%] bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 hover:shadow-md hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-200 ease-in-out hidden lg:flex"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4 text-white transition-transform duration-200 ease-in-out" />
                </button>
              )}
              
              {/* Main content area */}
              {/* Main content area */}
              <div 
                className={`
                  relative flex h-full flex-1 flex-col transition-all duration-300 main_content_container
                  ${isMobile ? 'w-full min-w-0' : 'max-w-full'}
                `}
                onClick={handleMainContentClick}
              >
                <main className={`
                  relative h-full w-full flex-1 overflow-auto scrollbar-hidden chat_interface
                  ${isMobile ? 'pt-[64px]' : ''}
                `}>
                  <div className="h-full w-full">
                    <div className="flex h-full flex-col focus-visible:outline-0 overflow-hidden">
                      <div className="flex-1 overflow-auto scrollbar-hidden">
                        {isChatMode ? (
                          <ChatAreaReal
                            messages={messages}
                            isLoading={isLoadingMessage}
                            isMobile={isMobile}
                            isDarkMode={isDarkMode}
                            selectedModel={selectedModel}
                            onModelChange={handleModelChange}
                            currentSearchType={currentSearchType}
                            onFilesUpload={handleFilesUpload}
                            uploadedFiles={sopUploadedFiles}
                            onRemoveFile={handleRemoveUploadedFile}
                            sopWebhookError={sopWebhookError}
                            onSopRetryLocal={handleSopRetryLocal}
                          />
                        ) : (
                          <ChatArea
                            isChatMode={false}
                            isMobile={isMobile}
                            displayName={displayName || 'Chief'}
                            isDarkMode={isDarkMode}
                            selectedModel={selectedModel}
                            onModelChange={handleModelChange}
                          />
                        )}
                      </div>
                      {/* Input Area - Desktop only, Mobile uses fixed ChatComposer */}
                      {!isMobile && (
                        <div className="flex-shrink-0">
                          {isChatMode ? (
                            <InputArea
                              value={currentInput}
                              onChange={setCurrentInput}
                              onSend={handleSendMessage}
                              isLoading={isLoadingMessage}
                              placeholder="Message CelesteOS..."
                              selectedModel={selectedModel}
                              onModelChange={handleModelChange}
                              isMobile={isMobile}
                              isDarkMode={isDarkMode}
                              currentSearchType={currentSearchType}
                            />
                          ) : (
                            <InputArea
                              onStartChat={handleStartChat}
                              isMobile={isMobile}
                              isDarkMode={isDarkMode}
                              currentSearchType={currentSearchType}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>

          {/* Mobile ChatComposer - Fixed positioned */}
          {isMobile && (
            <ChatComposer
              value={currentInput}
              onChange={setCurrentInput}
              onSend={isChatMode ? handleSendMessage : undefined}
              onStartChat={!isChatMode ? handleStartChat : undefined}
              isLoading={isLoadingMessage}
              placeholder={isChatMode ? "Message CelesteOS..." : "Start your search..."}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
              currentSearchType={currentSearchType}
            />
          )}

        </>
      )}
    </div>
  );
}