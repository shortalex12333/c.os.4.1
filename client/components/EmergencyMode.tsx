import React, { useState, useEffect } from 'react';

interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  available: boolean;
}

interface CriticalSystem {
  name: string;
  status: 'operational' | 'warning' | 'critical';
  lastChecked: Date;
}

interface EmergencyModeProps {
  active: boolean;
  onExit: () => void;
}

export default function EmergencyMode({ active, onExit }: EmergencyModeProps) {
  const [criticalSystems] = useState<CriticalSystem[]>([
    { name: 'Main Engine', status: 'operational', lastChecked: new Date() },
    { name: 'Generator 1', status: 'warning', lastChecked: new Date() },
    { name: 'Generator 2', status: 'operational', lastChecked: new Date() },
    { name: 'Steering', status: 'operational', lastChecked: new Date() },
    { name: 'Fire Suppression', status: 'operational', lastChecked: new Date() },
    { name: 'Bilge Pumps', status: 'operational', lastChecked: new Date() }
  ]);
  
  const [contacts] = useState<EmergencyContact[]>([
    { name: 'CAT Marine Support', role: 'Engine Vendor', phone: '+1-309-675-1000', available: true },
    { name: 'MTU 24/7 Hotline', role: 'Generator Support', phone: '+49-7541-90-77777', available: true },
    { name: 'Port Engineer', role: 'Technical Manager', phone: '+33-6-1234-5678', available: false },
    { name: 'Class Surveyor', role: 'Classification', phone: '+44-20-7423-2000', available: true }
  ]);
  
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  // Keyboard shortcut to activate
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        // Emergency mode would be triggered here
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  if (!active) return null;
  
  const getStatusColor = (status: CriticalSystem['status']) => {
    switch (status) {
      case 'operational': return 'var(--c7-success)';
      case 'warning': return 'var(--c7-warning)';
      case 'critical': return 'var(--c7-danger)';
    }
  };
  
  const quickActions = [
    { id: 'shutdown', label: 'Emergency Shutdown', icon: '🛑', critical: true },
    { id: 'fireSuppress', label: 'Activate Fire Suppression', icon: '🔥', critical: true },
    { id: 'mayday', label: 'Send Mayday', icon: '📡', critical: true },
    { id: 'bilge', label: 'Start All Bilge Pumps', icon: '💧', critical: false },
    { id: 'generators', label: 'Start Backup Generator', icon: '⚡', critical: false },
    { id: 'anchor', label: 'Drop Anchor', icon: '⚓', critical: false }
  ];
  
  return (
    <div className="emergency-panel">
      {/* Header */}
      <div className="emergency-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--c7-danger)] rounded-full flex items-center justify-center text-white animate-pulse">
            ⚠️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--c7-danger)]">EMERGENCY MODE</h1>
            <p className="text-sm text-[var(--text-secondary)]">Quick access to critical systems</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg font-medium transition-colors"
        >
          Exit Emergency Mode
        </button>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Critical Systems Status */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold mb-4">Critical Systems</h2>
          <div className="space-y-2">
            {criticalSystems.map(system => (
              <button
                key={system.name}
                onClick={() => setSelectedSystem(system.name)}
                className={`w-full p-3 rounded-lg border transition-all ${
                  selectedSystem === system.name
                    ? 'border-[var(--c7-blue-primary)] bg-[var(--bg-secondary)]'
                    : 'border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{system.name}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(system.status) }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">
                      {system.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="emergency-actions">
            {quickActions.map(action => (
              <button
                key={action.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  action.critical
                    ? 'border-[var(--c7-danger)] hover:bg-red-500/10'
                    : 'border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Emergency Contacts */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold mb-4">Emergency Contacts</h2>
          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.name} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-medium text-sm">{contact.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{contact.role}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1 ${
                    contact.available ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                <a 
                  href={`tel:${contact.phone}`}
                  className="text-[var(--c7-blue-primary)] text-sm font-mono hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Query Bar */}
      <div className="mt-8 p-4 bg-[var(--bg-secondary)] rounded-lg">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the emergency situation..."
            className="flex-1 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg focus:outline-none focus:border-[var(--c7-danger)]"
            autoFocus
          />
          <button className="px-6 py-2 bg-[var(--c7-danger)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            Get Emergency Help
          </button>
        </div>
        
        {/* Quick Tips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded-full hover:bg-[var(--bg-primary)] transition-colors">
            Engine won't start
          </button>
          <button className="text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded-full hover:bg-[var(--bg-primary)] transition-colors">
            Fire in engine room
          </button>
          <button className="text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded-full hover:bg-[var(--bg-primary)] transition-colors">
            Loss of steering
          </button>
          <button className="text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded-full hover:bg-[var(--bg-primary)] transition-colors">
            Taking on water
          </button>
        </div>
      </div>
      
      {/* Offline Notice */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-[var(--c7-blue-primary)]">
          <strong>Offline Mode Active:</strong> All emergency procedures and documentation are available without internet connection.
        </p>
      </div>
    </div>
  );
}