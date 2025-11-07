import React, { useState } from 'react';

interface FleetSolution {
  id: string;
  problem: string;
  solution: string;
  vesselType: string;
  upvotes: number;
  verified: boolean;
  dateShared: Date;
}

interface FleetInsightsProps {
  show: boolean;
  onClose: () => void;
}

export default function FleetInsights({ show, onClose }: FleetInsightsProps) {
  const [anonymityLevel, setAnonymityLevel] = useState<'full' | 'vessel-type' | 'fleet'>('vessel-type');
  const [sharingEnabled, setSharingEnabled] = useState(true);
  
  const [solutions] = useState<FleetSolution[]>([
    {
      id: '1',
      problem: 'Generator overheating at 80% load',
      solution: 'Check seawater cooling pump impeller. Common issue on CAT C32 after 2000 hours.',
      vesselType: '70-80m Motor Yacht',
      upvotes: 47,
      verified: true,
      dateShared: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      problem: 'Hydraulic steering intermittent response',
      solution: 'Air in system. Bleed procedure: Start at helm pump, work to rudder actuators.',
      vesselType: '60-70m Motor Yacht',
      upvotes: 32,
      verified: true,
      dateShared: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      problem: 'HVAC compressor cycling frequently',
      solution: 'Low refrigerant charge. Check for leaks at service valves first.',
      vesselType: '50-60m Motor Yacht',
      upvotes: 28,
      verified: false,
      dateShared: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ]);
  
  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Fleet Insights</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Anonymous knowledge sharing across the fleet
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Privacy Settings */}
        <div className="p-6 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--c7-blue-primary)] flex items-center justify-center text-white">
                🔒
              </div>
              <div>
                <h3 className="font-medium text-sm">Privacy Settings</h3>
                <p className="text-xs text-[var(--text-muted)]">Your contributions are always anonymous</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm">Share my solutions</span>
              <input
                type="checkbox"
                checked={sharingEnabled}
                onChange={(e) => setSharingEnabled(e.target.checked)}
                className="w-4 h-4"
              />
            </label>
          </div>
          
          {/* Anonymity Level */}
          <div className="flex gap-2">
            <button
              onClick={() => setAnonymityLevel('full')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                anonymityLevel === 'full'
                  ? 'bg-[var(--c7-blue-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              Full Anonymous
            </button>
            <button
              onClick={() => setAnonymityLevel('vessel-type')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                anonymityLevel === 'vessel-type'
                  ? 'bg-[var(--c7-blue-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              Share Vessel Type
            </button>
            <button
              onClick={() => setAnonymityLevel('fleet')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                anonymityLevel === 'fleet'
                  ? 'bg-[var(--c7-blue-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              Fleet Only
            </button>
          </div>
        </div>
        
        {/* Solutions List */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          <div className="space-y-4">
            {solutions.map(solution => (
              <div key={solution.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {solution.verified && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded font-medium">
                        Verified
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      {solution.vesselType}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      • {formatDate(solution.dateShared)}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-2">{solution.problem}</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{solution.solution}</p>
                
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--c7-blue-primary)] transition-colors">
                    <span>👍</span>
                    <span>{solution.upvotes}</span>
                  </button>
                  <button className="text-xs text-[var(--text-muted)] hover:text-[var(--c7-blue-primary)] transition-colors">
                    Apply Solution
                  </button>
                  <button className="text-xs text-[var(--text-muted)] hover:text-[var(--c7-blue-primary)] transition-colors">
                    Similar Issues
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats Footer */}
        <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border-default)]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-[var(--c7-blue-primary)]">2,847</div>
              <div className="text-xs text-[var(--text-muted)]">Solutions Shared</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[var(--c7-success)]">89%</div>
              <div className="text-xs text-[var(--text-muted)]">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[var(--c7-warning)]">147</div>
              <div className="text-xs text-[var(--text-muted)]">Vessels Connected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}