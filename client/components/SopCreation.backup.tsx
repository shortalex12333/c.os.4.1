/**
 * SOP Creation Component
 * Allows users to generate Standard Operating Procedures using AI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Send, Save, Cloud, Download, Loader2, X, AlertCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import sopService, { SopGenerationResponse } from '../services/sopService';
import manualUploadService from '../services/manualUploadService';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';

export const SopCreation: React.FC = () => {
  const { user, session } = useAuth();

  // Input state
  const [prompt, setPrompt] = useState('');
  const [useDocs, setUseDocs] = useState(true);
  const [yachtId, setYachtId] = useState('default_yacht'); // TODO: Get from user profile or vessel context

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSop, setGeneratedSop] = useState<SopGenerationResponse | null>(null);
  const [editedContent, setEditedContent] = useState('');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // File upload state
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (editedContent && generatedSop) {
      const draftKey = `sop_draft_${generatedSop.sop_id}`;
      const draft = {
        sop_id: generatedSop.sop_id,
        title: generatedSop.title,
        content: editedContent,
        timestamp: Date.now()
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [editedContent, generatedSop]);

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a procedure description');
      return;
    }

    if (!user || !session?.access_token) {
      toast.error('Please log in to generate SOPs');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await sopService.generateSop({
        query: prompt,
        use_docs: useDocs,
        yacht_id: yachtId,
        user: {
          id: user.id,
          email: user.email,
          role: user.role || 'engineer',
          yacht_id: yachtId
        },
        jwt: session.access_token
      });

      setGeneratedSop(response);
      setEditedContent(response.content_md);
      toast.success('SOP generated successfully!');
    } catch (error) {
      console.error('SOP generation error:', error);
      toast.error('Failed to generate SOP. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save to NAS
  const handleSaveToNas = async () => {
    if (!generatedSop || !user || !session?.access_token) {
      toast.error('Cannot save: missing data or authentication');
      return;
    }

    setIsSaving(true);

    try {
      await sopService.saveSop({
        sop_id: generatedSop.sop_id,
        action: 'save',
        target: 'nas',
        content_md: editedContent,
        title: generatedSop.title,
        user: {
          id: user.id,
          email: user.email
        },
        jwt: session.access_token
      });

      toast.success('SOP saved to NAS successfully!');
    } catch (error) {
      console.error('Save to NAS error:', error);
      toast.error('Failed to save to NAS');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save to Cloud
  const handleSaveToCloud = async () => {
    if (!generatedSop || !user || !session?.access_token) {
      toast.error('Cannot save: missing data or authentication');
      return;
    }

    setIsSaving(true);

    try {
      await sopService.saveSop({
        sop_id: generatedSop.sop_id,
        action: 'save',
        target: 'cloud',
        content_md: editedContent,
        title: generatedSop.title,
        user: {
          id: user.id,
          email: user.email
        },
        jwt: session.access_token
      });

      toast.success('SOP saved to Cloud successfully!');
    } catch (error) {
      console.error('Save to Cloud error:', error);
      toast.error('Failed to save to Cloud');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!generatedSop || !user || !session?.access_token) {
      toast.error('Cannot download: missing data or authentication');
      return;
    }

    setIsDownloading(true);

    try {
      const pdfBlob = await sopService.generatePdf({
        sop_id: generatedSop.sop_id,
        content_md: editedContent,
        title: generatedSop.title,
        user: {
          id: user.id,
          email: user.email
        },
        jwt: session.access_token
      });

      const filename = `${generatedSop.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      sopService.downloadPdf(pdfBlob, filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle clear/reset
  const handleClear = () => {
    setGeneratedSop(null);
    setEditedContent('');
    setPrompt('');
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error('Please log in to upload manuals');
      return;
    }

    setIsUploading(true);

    try {
      const file = files[0];

      const response = await manualUploadService.uploadFile(
        file,
        yachtId,
        user.id
      );

      toast.success(`${response.file_name} uploaded! ${response.chunks_processed} chunks embedded.`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload manual. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [user, yachtId]);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SOP Creation</h1>
            <p className="text-sm text-white/70">Generate procedures from your vessel manuals</p>
          </div>
        </div>

        {generatedSop && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* File Upload Section */}
        {!generatedSop && (
          <Card className="p-4 bg-white/5 backdrop-blur-sm border-white/10">
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="w-full flex items-center justify-between text-white/90 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Upload Manual Documents</span>
                <span className="text-xs text-white/50">(Optional - improves SOP accuracy)</span>
              </div>
              {showUploadSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showUploadSection && (
              <div className="mt-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                    ${isDragging
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-white/20 hover:border-white/40 bg-white/5'
                    }
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  <input
                    type="file"
                    id="manual-upload"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="manual-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                        <p className="text-white/70">Processing and embedding manual...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-white/40" />
                        <div>
                          <p className="text-white/80 font-medium">Drop files here or click to browse</p>
                          <p className="text-xs text-white/50 mt-1">Supports: PDF, TXT, DOC, DOCX</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Input Section */}
        {!generatedSop && (
          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Describe the procedure you want to create
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'SOP for main engine lube oil change' or 'Emergency generator startup procedure'"
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-docs"
                  checked={useDocs}
                  onCheckedChange={(checked) => setUseDocs(checked as boolean)}
                  disabled={isGenerating}
                  className="border-white/30 data-[state=checked]:bg-blue-500"
                />
                <label
                  htmlFor="use-docs"
                  className="text-sm text-white/80 cursor-pointer select-none"
                >
                  Use vessel manuals & previous SOPs for context
                </label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating SOP...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate SOP
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Output Section */}
        {generatedSop && (
          <>
            {/* Title and Sources */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">{generatedSop.title}</h2>

              {generatedSop.sources && generatedSop.sources.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">Sources Used:</p>
                    <ul className="text-xs text-blue-200/80 space-y-1">
                      {generatedSop.sources.map((source, idx) => (
                        <li key={idx}>{source}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Editor */}
            <Card className="flex-1 flex flex-col p-6 bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500"
                placeholder="SOP content will appear here..."
              />
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSaveToNas}
                disabled={isSaving || !editedContent}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save to NAS
              </Button>

              <Button
                onClick={handleSaveToCloud}
                disabled={isSaving || !editedContent}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 mr-2" />
                )}
                Save to Cloud
              </Button>

              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading || !editedContent}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SopCreation;
