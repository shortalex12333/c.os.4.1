import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, Trash2, Loader2 } from 'lucide-react';
import { getHandovers } from '../services/handoverService';

interface EntityPair {
  key: string;
  value: string;
}

interface HandoverEntry {
  handover_id: string;
  user_id: string;
  yacht_id: string;
  document_source?: 'nas' | 'email' | 'manual';
  document_name?: string;
  document_path?: string;
  document_page?: number;
  entity_0?: EntityPair;
  entity_1?: EntityPair;
  entity_2?: EntityPair;
  entity_3?: EntityPair;
  entity_4?: EntityPair;
  entity_5?: EntityPair;
  notes?: string;
  status?: 'draft' | 'completed' | 'archived';
  created_at: string;
  completed_at?: string;
}

interface ViewHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  yachtId: string;
  isDarkMode?: boolean;
  onEdit?: (entry: HandoverEntry) => void;
  onDelete?: (handoverId: string) => void;
}

export function ViewHandoverModal({
  isOpen,
  onClose,
  userId,
  yachtId,
  isDarkMode = false,
  onEdit,
  onDelete
}: ViewHandoverModalProps) {
  const [entries, setEntries] = useState<HandoverEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'completed' | 'archived'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchHandovers();
    }
  }, [isOpen, selectedStatus]);

  const fetchHandovers = async () => {
    setLoading(true);
    setError(null);

    try {
      // userId is no longer needed - service will get it from session
      const response = await getHandovers(
        undefined, // userId fetched from session
        yachtId,
        selectedStatus === 'all' ? undefined : selectedStatus
      );

      if (response.success && response.data) {
        setEntries(response.data);
      } else {
        setError(response.error || 'Failed to fetch handovers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (handoverId: string) => {
    if (!window.confirm('Are you sure you want to delete this handover entry?')) {
      return;
    }

    if (onDelete) {
      onDelete(handoverId);
      // Refresh the list after delete
      await fetchHandovers();
    }
  };

  const handleEdit = (entry: HandoverEntry) => {
    if (onEdit) {
      onEdit(entry);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${
        isDarkMode ? 'bg-neutral-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
          <div>
            <h2 className="text-2xl font-semibold">View My Handover</h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your handover entries
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-neutral-800 bg-neutral-800/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex gap-2">
              {['all', 'draft', 'completed', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status as any)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                      ? 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              Error: {error}
            </div>
          ) : entries.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No handover entries found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
                    <th className="text-left p-3 text-sm font-medium">Source</th>
                    <th className="text-left p-3 text-sm font-medium">Entities</th>
                    <th className="text-left p-3 text-sm font-medium">Notes</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Created</th>
                    <th className="text-right p-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    // Extract all entity pairs
                    const entities = [
                      entry.entity_0,
                      entry.entity_1,
                      entry.entity_2,
                      entry.entity_3,
                      entry.entity_4,
                      entry.entity_5
                    ].filter(Boolean) as EntityPair[];

                    return (
                      <tr
                        key={entry.handover_id}
                        className={`border-b ${isDarkMode ? 'border-neutral-800 hover:bg-neutral-800/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                      >
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.document_source === 'nas'
                              ? 'bg-blue-100 text-blue-700'
                              : entry.document_source === 'email'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {entry.document_source || 'manual'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {entities.map((entity, idx) => (
                              <div
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                  isDarkMode ? 'bg-neutral-800' : 'bg-gray-100'
                                }`}
                              >
                                <span className="font-medium">{entity.key}:</span>
                                <span>{entity.value}</span>
                              </div>
                            ))}
                            {entities.length === 0 && <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="p-3 text-sm max-w-xs truncate">
                          {entry.notes || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : entry.status === 'archived'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {entry.status || 'draft'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode ? 'hover:bg-neutral-700' : 'hover:bg-gray-200'
                              }`}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.handover_id)}
                              className="p-2 rounded-lg transition-colors hover:bg-red-100 text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center p-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total entries: {entries.length}
          </div>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-neutral-700 text-gray-300 hover:bg-neutral-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
