import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { saveHandover, type EntityPair } from '../services/handoverService';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface CustomHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  yachtId?: string;
  isDarkMode?: boolean;
}

export function CustomHandoverModal({
  isOpen,
  onClose,
  userId,
  yachtId,
  isDarkMode = false
}: CustomHandoverModalProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>([
    { id: '1', key: '', value: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addPair = () => {
    setPairs([...pairs, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const removePair = (id: string) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter(pair => pair.id !== id));
    }
  };

  const updatePair = (id: string, field: 'key' | 'value', newValue: string) => {
    setPairs(pairs.map(pair =>
      pair.id === id ? { ...pair, [field]: newValue } : pair
    ));
  };

  const handleSave = async () => {
    // Validate that at least one pair has both key and value
    const validPairs = pairs.filter(pair => pair.key.trim() && pair.value.trim());

    if (validPairs.length === 0) {
      setError('Please add at least one key-value pair');
      return;
    }

    if (validPairs.length > 6) {
      setError('Maximum 6 key-value pairs allowed');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Convert pairs to entity_0 through entity_5 format
      const payload: any = {
        yacht_id: yachtId || 'default', // user_id will be fetched from session
        document_source: 'manual',
        status: 'draft'
      };

      // Map pairs to entity_0, entity_1, etc.
      validPairs.forEach((pair, index) => {
        payload[`entity_${index}`] = {
          key: pair.key,
          value: pair.value
        };
      });

      console.log('📤 Saving custom handover to Supabase:', payload);

      // Save to Supabase (user_id will be fetched from authenticated session)
      const response = await saveHandover(payload);

      if (response.success) {
        console.log('✅ Custom handover saved successfully');
        // Reset form
        setPairs([{ id: '1', key: '', value: '' }]);
        onClose();
      } else {
        setError(response.error || 'Failed to save handover');
      }
    } catch (err) {
      console.error('❌ Error saving handover:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-neutral-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
          <div>
            <h2 className="text-2xl font-semibold">Add to Handover</h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Add custom key-value pairs for your handover entry
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

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          {pairs.map((pair, index) => (
            <div key={pair.id} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Key {index + 1}
                  </label>
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                    placeholder="e.g., equipment, system, fault_code"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Value {index + 1}
                  </label>
                  <textarea
                    value={pair.value}
                    onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                    placeholder="e.g., main engine, hydraulics, HYD-42"
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-neutral-800 border-neutral-700 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              {pairs.length > 1 && (
                <button
                  onClick={() => removePair(pair.id)}
                  className={`mt-6 p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-red-900/20 text-red-400'
                      : 'hover:bg-red-50 text-red-600'
                  }`}
                  title="Remove this pair"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addPair}
            className={`w-full py-2 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center gap-2 ${
              isDarkMode
                ? 'border-neutral-700 text-gray-400 hover:bg-neutral-800 hover:border-neutral-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Another Pair
          </button>

          {/* Examples */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Example Pairs:
            </h4>
            <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div><span className="font-mono">equipment:</span> "main engine"</div>
              <div><span className="font-mono">system:</span> "hydraulics"</div>
              <div><span className="font-mono">fault_code:</span> "HYD-42"</div>
              <div><span className="font-mono">symptoms:</span> "Low pressure on starboard side"</div>
              <div><span className="font-mono">actions_taken:</span> "Replaced filter and checked valves"</div>
            </div>
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
            {isSaving ? 'Submitting...' : 'Add to Handover'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
