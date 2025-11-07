import React from 'react';
import { Wifi, WifiOff, Zap } from 'lucide-react';

const ConnectionStatus = ({ isOnline, isConnected }) => {
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} className="text-red-500" />;
    if (!isConnected) return <Wifi size={16} className="text-yellow-500" />;
    return <Wifi size={16} className="text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isConnected) return 'Reconnecting...';
    return 'Connected';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600';
    if (!isConnected) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

const TokenCounter = React.memo(({ remaining, used, hourly, daily, monthly, isLoading }) => {
  // Show the most restrictive limit that's closest to being exceeded
  const getLimitInfo = () => {
    const limits = [];
    
    if (hourly) {
      limits.push({
        type: 'hourly',
        used: hourly.used,
        limit: hourly.limit,
        remaining: hourly.limit - hourly.used,
        resetTime: hourly.resetTime,
        percentUsed: (hourly.used / hourly.limit) * 100
      });
    }
    
    if (daily) {
      limits.push({
        type: 'daily',
        used: daily.used,
        limit: daily.limit,
        remaining: daily.limit - daily.used,
        resetTime: daily.resetTime,
        percentUsed: (daily.used / daily.limit) * 100
      });
    }
    
    if (monthly) {
      limits.push({
        type: 'monthly',
        used: monthly.used,
        limit: monthly.limit,
        remaining: monthly.limit - monthly.used,
        resetTime: monthly.resetTime,
        percentUsed: (monthly.used / monthly.limit) * 100
      });
    }
    
    // Return the limit with highest percentage used
    return limits.sort((a, b) => b.percentUsed - a.percentUsed)[0];
  };
  
  const limitInfo = getLimitInfo();
  
  return (
    <div className="text-sm text-gray-600 flex items-center gap-2">
      {isLoading && (
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
      {limitInfo ? (
        <div className="flex items-center gap-4">
          <span>
            {limitInfo.remaining.toLocaleString()} tokens remaining ({limitInfo.type})
          </span>
          {limitInfo.resetTime && (
            <span className="text-xs text-gray-500">
              Resets {limitInfo.resetTime}
            </span>
          )}
          {limitInfo.percentUsed > 80 && (
            <span className="text-xs text-amber-600 font-medium">
              {Math.round(limitInfo.percentUsed)}% used
            </span>
          )}
        </div>
      ) : (
        <span>
          {remaining?.toLocaleString() || 0} tokens remaining
        </span>
      )}
    </div>
  );
});

const Header = ({ tokenStats, isLoading, onClearChat, connectionStatus }) => {
  return (
    <div className="border-b border-gray-200 px-4 py-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-blue-500" />
            <h1 className="text-lg font-semibold text-gray-900">CelesteOS Chat</h1>
          </div>
          <ConnectionStatus {...connectionStatus} />
        </div>
        <button
          onClick={onClearChat}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Clear chat history"
        >
          Clear
        </button>
      </div>
      <TokenCounter 
        remaining={tokenStats.remaining} 
        used={tokenStats.used}
        hourly={tokenStats.hourly}
        daily={tokenStats.daily}
        monthly={tokenStats.monthly}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Header;