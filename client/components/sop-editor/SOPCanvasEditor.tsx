/**
 * CelesteOS SOP Canvas Editor
 * ChatGPT-style interactive editing interface with cloud sync
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { SOPData, SOPEditorState } from './types/sop';
import { SOPStorage } from './utils/storage';
import { SOPApiClient } from './utils/api';
import { downloadSOP } from './utils/download';
import './styles/editor.css';

interface SOPCanvasEditorProps {
  initialSOP?: SOPData;
  onSave?: (sop: SOPData) => void;
  onError?: (error: string) => void;
}

export const SOPCanvasEditor: React.FC<SOPCanvasEditorProps> = ({
  initialSOP,
  onSave,
  onError,
}) => {
  const [state, setState] = useState<SOPEditorState>({
    sop: initialSOP || null,
    metadata: {
      lastSaved: new Date().toISOString(),
      lastSynced: null,
      isDirty: false,
      isOffline: !navigator.onLine,
    },
    isLoading: false,
    error: null,
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // TipTap Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your SOP here...',
      }),
    ],
    content: state.sop?.content_md || '',
    editorProps: {
      attributes: {
        class: 'ProseMirror',
      },
    },
    onUpdate: ({ editor }) => {
      handleContentChange(editor.getHTML());
    },
  });

  // Autosave on every keystroke (debounced)
  const handleContentChange = useCallback(
    (content: string) => {
      if (!state.sop) return;

      const updatedSOP: SOPData = {
        ...state.sop,
        content_md: content,
      };

      // Save to localStorage immediately
      try {
        SOPStorage.save(updatedSOP);

        setState((prev) => ({
          ...prev,
          sop: updatedSOP,
          metadata: {
            ...prev.metadata,
            lastSaved: new Date().toISOString(),
            isDirty: true,
          },
        }));

        onSave?.(updatedSOP);
      } catch (error) {
        console.error('Autosave failed:', error);
        showToast('Autosave failed', 'error');
      }
    },
    [state.sop, onSave]
  );

  // Cloud Sync
  const handleSync = async () => {
    if (!state.sop) {
      showToast('No SOP to sync', 'error');
      return;
    }

    setIsSyncing(true);
    showToast('Syncing to cloud...', 'success');

    try {
      const result = await SOPApiClient.syncToCloud(state.sop);

      if (result.success) {
        SOPStorage.markSynced(state.sop.sop_id);

        setState((prev) => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            lastSynced: new Date().toISOString(),
            isDirty: false,
          },
        }));

        showToast('✅ Synced to cloud successfully!', 'success');
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`❌ Sync failed: ${errorMessage}`, 'error');
      onError?.(errorMessage);

      setState((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          isOffline: true,
        },
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  // Save SOP (Download + Send to Database)
  const handleSave = async (downloadFormat: 'md' | 'html' | 'txt' = 'md') => {
    if (!state.sop) {
      showToast('No SOP to save', 'error');
      return;
    }

    setIsSaving(true);
    showToast('Saving SOP...', 'success');

    try {
      // 1. Download to user's browser
      downloadSOP(state.sop, downloadFormat);
      showToast(`📥 Downloaded as ${downloadFormat.toUpperCase()}`, 'success');

      // 2. Send to database via save-sop endpoint
      const result = await SOPApiClient.saveToDatabase(state.sop);

      if (result.success) {
        showToast('✅ SOP saved to database successfully!', 'success');
      } else {
        throw new Error(result.error || 'Database save failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`⚠️ Download succeeded but database save failed: ${errorMessage}`, 'error');
      onError?.(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Online/Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, isOffline: false },
      }));
      showToast('🌐 Back online!', 'success');

      // Auto-sync if dirty
      if (state.metadata.isDirty && state.sop) {
        setTimeout(() => handleSync(), 1000);
      }
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, isOffline: true },
      }));
      showToast('📡 Working offline', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.metadata.isDirty, state.sop]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!initialSOP && state.sop) {
      const metadata = SOPStorage.getMetadata(state.sop.sop_id);
      if (metadata) {
        setState((prev) => ({ ...prev, metadata }));
      }
    }
  }, [initialSOP, state.sop]);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format timestamp
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!state.sop) {
    return (
      <div className="celesteos-editor-container">
        <div className="celesteos-glass-card">
          <div className="celesteos-editor-header">
            <p style={{ color: 'var(--celesteos-text-muted)' }}>
              No SOP loaded. Please provide an SOP to edit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="celesteos-editor-container">
      <div className="celesteos-glass-card">
        {/* Header */}
        <div className="celesteos-editor-header">
          <div>
            <h1 className="celesteos-title">{state.sop.title}</h1>
            <div className="celesteos-metadata">
              <span>SOP ID: {state.sop.sop_id}</span>
              <span>•</span>
              <span>Yacht: {state.sop.yacht_id}</span>
            </div>
          </div>

          <div className="celesteos-status">
            <div
              className={`celesteos-status-dot ${
                isSyncing
                  ? 'celesteos-status-syncing'
                  : state.metadata.isOffline
                  ? 'celesteos-status-offline'
                  : 'celesteos-status-online'
              }`}
            />
            <span>
              {isSyncing
                ? 'Syncing...'
                : state.metadata.isOffline
                ? 'Offline'
                : 'Online'}
            </span>
          </div>
        </div>

        {/* Editor Content */}
        <div className="celesteos-editor-content">
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="celesteos-editor-footer">
          <div style={{ fontSize: '0.875rem', color: 'var(--celesteos-text-muted)' }}>
            <div>Last saved: {formatTime(state.metadata.lastSaved)}</div>
            <div>
              Last synced:{' '}
              {state.metadata.lastSynced ? formatTime(state.metadata.lastSynced) : 'Never'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="celesteos-btn celesteos-btn-primary"
              onClick={() => handleSave('md')}
              disabled={isSaving}
              style={{ background: '#10b981' }}
            >
              {isSaving ? (
                <>
                  <div className="celesteos-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 10v4H2v-4M8 12V2M8 12l-3-3M8 12l3-3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Save & Download
                </>
              )}
            </button>

            <button
              className="celesteos-btn celesteos-btn-primary"
              onClick={handleSync}
              disabled={isSyncing || !state.metadata.isDirty}
            >
              {isSyncing ? (
                <>
                  <div className="celesteos-spinner" />
                  Syncing...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.6 6.4L8 12L2.4 6.4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {state.metadata.isDirty ? 'Sync to Cloud' : 'Synced ✓'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`celesteos-toast celesteos-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SOPCanvasEditor;
