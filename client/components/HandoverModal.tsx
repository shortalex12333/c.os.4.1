import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EmailData {
  id: string;
  display_name?: string;
  sender?: {
    name: string;
    email: string;
  };
  received_date?: string;
  content_preview?: string;
  links?: {
    document?: string;
  };
  metadata?: any;
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

interface HandoverModalProps {
  emailData: EmailData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (handoverData: any) => Promise<void>;
  isDarkMode?: boolean;
}

export function HandoverModal({
  emailData,
  isOpen,
  onClose,
  onSave,
  isDarkMode = false
}: HandoverModalProps) {
  const [formData, setFormData] = useState({
    // For documents: Use handover_section if available
    // For emails: Extract from sender.name
    system: emailData.handover_section?.system || emailData.sender?.name || emailData.display_name || '',
    fault_code: emailData.handover_section?.fault_code || '',
    symptoms: emailData.handover_section?.symptoms || emailData.content_preview || '',
    actions_taken: emailData.handover_section?.actions_taken || '',
    duration_minutes: emailData.handover_section?.duration?.toString() || '',
    notes: emailData.handover_section?.notes || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to save handover:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-neutral-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}">
          <h2 className="text-2xl font-semibold">Add to Handover</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata Section */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-neutral-800 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className="text-sm font-medium mb-3 opacity-70">Email Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-medium opacity-70 min-w-[100px]">Subject:</span>
              <span>{emailData.display_name || '(No subject)'}</span>
            </div>
            {emailData.sender && (
              <div className="flex gap-2">
                <span className="font-medium opacity-70 min-w-[100px]">From:</span>
                <span>{emailData.sender.name} ({emailData.sender.email})</span>
              </div>
            )}
            {emailData.received_date && (
              <div className="flex gap-2">
                <span className="font-medium opacity-70 min-w-[100px]">Received:</span>
                <span>{new Date(emailData.received_date).toLocaleString()}</span>
              </div>
            )}
            {emailData.links?.document && (
              <div className="flex gap-2">
                <span className="font-medium opacity-70 min-w-[100px]">Link:</span>
                <a
                  href={emailData.links.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline truncate max-w-md"
                >
                  Open in Outlook
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Handover Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* System */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              System
            </label>
            <input
              type="text"
              value={formData.system}
              onChange={(e) => setFormData({ ...formData, system: e.target.value })}
              placeholder="e.g., Hydraulics, Main Engine"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Fault Code */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Fault Code
            </label>
            <input
              type="text"
              value={formData.fault_code}
              onChange={(e) => setFormData({ ...formData, fault_code: e.target.value })}
              placeholder="e.g., HYD-42, ENG-103"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Symptoms
            </label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="Describe the symptoms..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Actions Taken */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Actions Taken
            </label>
            <textarea
              value={formData.actions_taken}
              onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
              placeholder="Describe actions taken..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Duration */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="e.g., 45"
              min="0"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-neutral-700 text-gray-300 hover:bg-neutral-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Add to Handover'}
          </button>
        </div>
      </div>
    </div>
  );
}
