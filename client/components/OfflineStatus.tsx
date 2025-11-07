import React, { useState, useEffect } from 'react';

interface OfflineStatusProps {
  isOffline: boolean;
  showDetails?: boolean;
}

export default function OfflineStatus({ isOffline, showDetails = false }: OfflineStatusProps) {
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [cacheSize, setCacheSize] = useState<string>('2.3GB');
  const [documentCount, setDocumentCount] = useState<number>(1247);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Simulate sync when coming online
  useEffect(() => {
    if (!isOffline && syncProgress < 100) {
      setIsSyncing(true);
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            setIsSyncing(false);
            setLastSync(new Date());
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isOffline]);
  
  // Reset sync progress when going offline
  useEffect(() => {
    if (isOffline) {
      setSyncProgress(0);
      setIsSyncing(false);
    }
  }, [isOffline]);
  
  // Format last sync time
  const formatLastSync = () => {
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };
  
  const getStatusColor = () => {
    if (isSyncing) return '#FFA500'; // Orange for syncing
    if (isOffline) return '#00A4FF'; // Blue for offline (brand secondary blue)
    return '#00D084'; // Green for online
  };
  
  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (isOffline) return 'Offline Mode';
    return 'Connected';
  };
  
  return (
    <div className="offline-indicator">
      {/* Status Light */}
      <div 
        className="status-light" 
        style={{ backgroundColor: getStatusColor() }}
      />
      
      {/* Status Text */}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {/* Sync Progress (if syncing) */}
      {isSyncing && (
        <div className="ml-2 text-xs text-[var(--text-muted)]">
          {syncProgress}%
        </div>
      )}
      
      {/* Details Toggle */}
      {showDetails && (
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="ml-2 text-xs text-[var(--accent-primary)] hover:underline"
        >
          {detailsOpen ? 'Hide' : 'Details'}
        </button>
      )}
      
      {/* Detailed Status Panel */}
      {detailsOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-lg z-50">
          <h4 className="font-semibold text-sm mb-3">Connection Status</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Mode:</span>
              <span className="font-medium">{isOffline ? 'Offline' : 'Online'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Last Sync:</span>
              <span className="font-medium">{formatLastSync()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Local Cache:</span>
              <span className="font-medium">{cacheSize}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Documents:</span>
              <span className="font-medium">{documentCount.toLocaleString()} available</span>
            </div>
            
            {isSyncing && (
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--text-muted)]">Sync Progress:</span>
                  <span className="font-medium">{syncProgress}%</span>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${syncProgress}%`,
                      backgroundColor: 'var(--c7-blue-primary)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Offline Capabilities */}
          {isOffline && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <h5 className="font-medium text-xs mb-2 text-[var(--text-muted)]">AVAILABLE OFFLINE</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-500">✓</span>
                  <span>Full documentation access</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-500">✓</span>
                  <span>AI responses</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-500">✓</span>
                  <span>Historical queries</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-500">⚠</span>
                  <span>Fleet insights (limited)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}