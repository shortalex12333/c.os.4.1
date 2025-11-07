/**
 * Canvas Mode - ChatGPT-style separate panel for SOP editing
 * Shows SOP in read-only mode with "Edit" button to enable editing
 */

import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Download, Cloud, FileText, Check } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '../ui/button';
import { SOPApiClient } from '../sop-editor/utils/api';
import { downloadSOP } from '../sop-editor/utils/download';
import type { SOPData } from '../sop-editor/types/sop';

interface CanvasModeProps {
  isOpen: boolean;
  onClose: () => void;
  sopData: SOPData | null;
  onUpdate?: (sop: SOPData) => void;
}

export const CanvasMode: React.FC<CanvasModeProps> = ({
  isOpen,
  onClose,
  sopData,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  // TipTap editor for edit mode
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: sopData?.content_md || '',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      setEditedContent(editor.getHTML());
      // Autosave to localStorage
      if (sopData) {
        localStorage.setItem(`celeste_sop_draft_${sopData.sop_id}`, editor.getHTML());
      }
    },
  });

  // Update editor content when sopData changes
  useEffect(() => {
    if (editor && sopData?.content_md) {
      editor.commands.setContent(sopData.content_md);
      setEditedContent(sopData.content_md);
    }
  }, [sopData, editor]);

  // Update editor editability when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!sopData) return;

    setIsSaving(true);
    const updatedSOP: SOPData = {
      ...sopData,
      content_md: editedContent || sopData.content_md,
    };

    try {
      // Save to cloud
      const result = await SOPApiClient.saveToDatabase(updatedSOP);

      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        onUpdate?.(updatedSOP);

        // Also download
        downloadSOP(updatedSOP, 'md');
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (sopData) {
      const currentContent = editedContent || sopData.content_md;
      downloadSOP({ ...sopData, content_md: currentContent }, 'md');
    }
  };

  if (!isOpen || !sopData) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full lg:w-2/3 xl:w-1/2 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{sopData.title}</h2>
            <p className="text-sm text-gray-500">SOP ID: {sopData.sop_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Download
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-600">
          <span>Yacht: {sopData.yacht_id}</span>
          <span>•</span>
          <span>User: {sopData.user_id}</span>
        </div>

        {lastSaved && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            <span>Saved at {lastSaved}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-white">
        {isEditing ? (
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div
            className="max-w-4xl mx-auto prose prose-lg"
            dangerouslySetInnerHTML={{ __html: sopData.content_md }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {isEditing ? (
            <span className="text-amber-600">✏️ Editing mode - changes autosaved to localStorage</span>
          ) : (
            <span>📄 Read-only mode - click Edit to make changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {isEditing ? 'Autosaving...' : 'Ready'}
          </span>
          <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
        </div>
      </div>
    </div>
  );
};

export default CanvasMode;
