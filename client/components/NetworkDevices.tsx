import React, { useState, useEffect } from 'react';

interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'tablet' | 'phone' | 'desktop';
  status: 'online' | 'offline' | 'syncing';
  lastSeen: Date;
  user?: string;
}

interface NetworkDevicesProps {
  show: boolean;
  onClose: () => void;
}

export default function NetworkDevices({ show, onClose }: NetworkDevicesProps) {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Bridge Laptop',
      type: 'laptop',
      status: 'online',
      lastSeen: new Date(),
      user: 'Captain'
    },
    {
      id: '2',
      name: 'Engineering iPad',
      type: 'tablet',
      status: 'online',
      lastSeen: new Date(),
      user: 'Chief Engineer'
    },
    {
      id: '3',
      name: 'Crew Station',
      type: 'desktop',
      status: 'syncing',
      lastSeen: new Date(Date.now() - 5 * 60000),
      user: '1st Engineer'
    },
    {
      id: '4',
      name: 'Mobile Device',
      type: 'phone',
      status: 'offline',
      lastSeen: new Date(Date.now() - 30 * 60000),
      user: 'ETO'
    }
  ]);
  
  const [discovering, setDiscovering] = useState(false);
  
  // Simulate device discovery
  const discoverDevices = () => {
    setDiscovering(true);
    setTimeout(() => {
      setDiscovering(false);
      // Could add new devices here
    }, 2000);
  };
  
  // Format last seen time
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'laptop': return '💻';
      case 'tablet': return '📱';
      case 'phone': return '📲';
      case 'desktop': return '🖥️';
    }
  };
  
  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'online': return 'var(--c7-success)';
      case 'syncing': return 'var(--c7-warning)';
      case 'offline': return 'var(--text-muted)';
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="network-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Network Devices</h3>
          <p className="text-xs text-[var(--text-muted)]">Same network access</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* Network Info */}
      <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Network:</span>
          <span className="font-mono">Yacht_Network_5G</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-[var(--text-muted)]">Local IP:</span>
          <span className="font-mono">192.168.1.10</span>
        </div>
      </div>
      
      {/* Device List */}
      <div className="device-list">
        {devices.map(device => (
          <div key={device.id} className="device-item">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getDeviceIcon(device.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{device.name}</span>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(device.status) }}
                  />
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {device.user} • {formatLastSeen(device.lastSeen)}
                </div>
              </div>
              {device.status === 'syncing' && (
                <div className="text-xs text-[var(--c7-warning)]">
                  Syncing...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Discovery Button */}
      <button
        onClick={discoverDevices}
        disabled={discovering}
        className="w-full mt-4 py-2 px-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {discovering ? 'Discovering...' : 'Discover Devices'}
      </button>
      
      {/* Info */}
      <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
        <p className="text-xs text-[var(--text-muted)]">
          <strong>Offline Access:</strong> All devices on this network can access CelesteOS without internet connection.
        </p>
      </div>
    </div>
  );
}