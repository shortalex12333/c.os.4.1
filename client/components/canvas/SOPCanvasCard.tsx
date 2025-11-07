/**
 * SOP Canvas Card - Inline editable SOP card within chat
 * Appears as a special message card with read-only + edit modes
 */

import React, { useState, useEffect } from 'react';
import { Edit, Save, Download, Check, FileText, Copy } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '../ui/button';
import { SOPApiClient } from '../sop-editor/utils/api';
import { downloadSOP } from '../sop-editor/utils/download';
import type { SOPData } from '../sop-editor/types/sop';
import './SOPCanvasCard.css';

interface SOPCanvasCardProps {
  sopData: SOPData;
  onUpdate?: (sop: SOPData) => void;
}

export const SOPCanvasCard: React.FC<SOPCanvasCardProps> = ({
  sopData,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState(sopData.content_md);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: sopData.content_md || '',
    editable: isEditing,
    editorProps: {
      attributes: {
        class: 'sop-canvas-editor prose prose-sm max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditedContent(html);
      // Autosave to localStorage
      localStorage.setItem(`celeste_sop_draft_${sopData.sop_id}`, html);
    },
  });

  // Update editor editability when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Debug log on mount
  useEffect(() => {
    console.log('🎨 SOPCanvasCard mounted:', {
      sop_id: sopData.sop_id,
      title: sopData.title,
      content_preview: sopData.content_md?.substring(0, 150) + '...',
      content_length: sopData.content_md?.length,
      yacht_id: sopData.yacht_id,
      user_id: sopData.user_id
    });
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedSOP: SOPData = {
      ...sopData,
      content_md: editedContent,
    };

    try {
      // Save to cloud + download
      const result = await SOPApiClient.saveToDatabase(updatedSOP);

      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        onUpdate?.(updatedSOP);
        downloadSOP(updatedSOP, 'md');
        setIsEditing(false); // Exit edit mode after save
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    downloadSOP({ ...sopData, content_md: editedContent }, 'md');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
  };

  return (
    <div className="sop-canvas-card">
      {/* Header */}
      <div className="sop-canvas-header">
        <div className="sop-canvas-title">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{sopData.title}</h3>
            <p className="text-xs text-gray-500">SOP ID: {sopData.sop_id}</p>
          </div>
        </div>

        <div className="sop-canvas-actions">
          {!isEditing ? (
            <>
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="gap-1.5 text-xs bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>

              <Button
                onClick={() => setIsEditing(false)}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="sop-canvas-meta">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>Yacht: {sopData.yacht_id}</span>
          <span>•</span>
          <span>User: {sopData.user_id}</span>
        </div>

        {lastSaved && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Check className="w-3.5 h-3.5" />
            <span>Saved at {lastSaved}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sop-canvas-content">
        {isEditing ? (
          <EditorContent editor={editor} />
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sopData.content_md }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="sop-canvas-footer">
        <div className="text-xs text-gray-500">
          {isEditing ? (
            <span className="text-amber-600">✏️ Editing AI-generated SOP - changes autosaved</span>
          ) : (
            <span>📄 AI-generated SOP - click Edit to customize</span>
          )}
        </div>

        <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
      </div>
    </div>
  );
};

export default SOPCanvasCard;
