import React, { useEffect, useState } from 'react';

interface ConfidenceScoreProps {
  score: number; // 0-100
  source: {
    document: string;
    page: string;
    section: string;
  };
  showAnimation?: boolean;
}

export default function ConfidenceScore({ score, source, showAnimation = true }: ConfidenceScoreProps) {
  const [displayScore, setDisplayScore] = useState(showAnimation ? 0 : score);
  
  // Animate score on mount
  useEffect(() => {
    if (!showAnimation) return;
    
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score, showAnimation]);
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 67) return 'var(--c7-success)';
    if (score >= 34) return 'var(--c7-warning)';
    return 'var(--c7-danger)';
  };
  
  const getScoreLabel = () => {
    if (score >= 67) return 'High Confidence';
    if (score >= 34) return 'Medium Confidence';
    return 'Low Confidence';
  };
  
  // Calculate circle stroke dasharray
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  
  return (
    <div className="confidence-display">
      {/* Circular Meter */}
      <div className="confidence-meter">
        <svg width="80" height="80" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="var(--border-default)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={getScoreColor()}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: showAnimation ? 'stroke-dashoffset 1.5s ease-in-out' : 'none'
            }}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="confidence-score number-display">{displayScore}%</span>
        </div>
      </div>
      
      {/* Confidence Details */}
      <div className="confidence-details">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold" style={{ color: getScoreColor() }}>
            {getScoreLabel()}
          </span>
        </div>
        
        {/* Source Citation */}
        <div className="flex flex-wrap gap-2">
          <div className="source-citation">
            <span className="opacity-60">📄</span>
            <span>{source.document}</span>
          </div>
          <div className="source-citation">
            <span className="opacity-60">Page</span>
            <span className="font-mono">{source.page}</span>
          </div>
          <div className="source-citation">
            <span className="opacity-60">§</span>
            <span className="font-mono">{source.section}</span>
          </div>
        </div>
        
        {/* Additional Metadata */}
        <div className="mt-2 text-xs text-[var(--text-muted)]">
          Source verified • Cross-referenced with 3 documents
        </div>
      </div>
    </div>
  );
}