import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Service {
  name: string;
  url: string;
  port: number;
  status: 'online' | 'offline' | 'connecting';
  lastCheck: Date;
}

interface CelesteContextType {
  // Services
  services: Service[];
  checkServiceHealth: (service: Service) => Promise<void>;
  
  // Offline Mode
  isOffline: boolean;
  setOffline: (offline: boolean) => void;
  
  // Confidence Scoring
  lastConfidenceScore: number;
  setConfidenceScore: (score: number) => void;
  
  // Theme
  darkMode: boolean;
  toggleTheme: () => void;
  
  // Emergency Mode
  emergencyMode: boolean;
  setEmergencyMode: (active: boolean) => void;
  
  // Network Devices
  deviceCount: number;
  refreshDevices: () => void;
  
  // Fleet Insights
  fleetInsightsEnabled: boolean;
  toggleFleetInsights: () => void;
}

const CelesteContext = createContext<CelesteContextType | undefined>(undefined);

export function CelesteProvider({ children }: { children: ReactNode }) {
  // Services state
  const [services, setServices] = useState<Service[]>([
    { name: 'BGE Embeddings', url: 'http://localhost', port: 8003, status: 'connecting', lastCheck: new Date() },
    { name: 'OAuth Server', url: 'http://localhost', port: 8004, status: 'connecting', lastCheck: new Date() },
    { name: 'n8n Workflows', url: 'http://localhost', port: 5678, status: 'connecting', lastCheck: new Date() },
    { name: 'Ollama AI', url: 'http://localhost', port: 11434, status: 'connecting', lastCheck: new Date() },
    { name: 'Redis Cache', url: 'http://localhost', port: 6379, status: 'connecting', lastCheck: new Date() }
  ]);
  
  // Other states
  const [isOffline, setIsOffline] = useState(false);
  const [lastConfidenceScore, setLastConfidenceScore] = useState(85);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('celesteDarkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [deviceCount, setDeviceCount] = useState(4);
  const [fleetInsightsEnabled, setFleetInsightsEnabled] = useState(true);
  
  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('celesteDarkMode', darkMode.toString());
  }, [darkMode]);
  
  // Check service health
  const checkServiceHealth = async (service: Service) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${service.url}:${service.port}/health`, {
        signal: controller.signal,
        mode: 'no-cors' // For local services
      });
      
      clearTimeout(timeoutId);
      
      // Update service status
      setServices(prev => prev.map(s => 
        s.name === service.name 
          ? { ...s, status: 'online', lastCheck: new Date() }
          : s
      ));
    } catch (error) {
      // Service is offline
      setServices(prev => prev.map(s => 
        s.name === service.name 
          ? { ...s, status: 'offline', lastCheck: new Date() }
          : s
      ));
    }
  };
  
  // Check all services periodically
  useEffect(() => {
    const checkAllServices = () => {
      services.forEach(service => {
        checkServiceHealth(service);
      });
    };
    
    // Initial check
    checkAllServices();
    
    // Check every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Detect offline mode
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Refresh network devices
  const refreshDevices = () => {
    // Simulate device discovery
    setTimeout(() => {
      setDeviceCount(Math.floor(Math.random() * 3) + 3);
    }, 1000);
  };
  
  // Context value
  const value: CelesteContextType = {
    services,
    checkServiceHealth,
    isOffline,
    setOffline: setIsOffline,
    lastConfidenceScore,
    setConfidenceScore: setLastConfidenceScore,
    darkMode,
    toggleTheme: () => setDarkMode(prev => !prev),
    emergencyMode,
    setEmergencyMode,
    deviceCount,
    refreshDevices,
    fleetInsightsEnabled,
    toggleFleetInsights: () => setFleetInsightsEnabled(prev => !prev)
  };
  
  return (
    <CelesteContext.Provider value={value}>
      {children}
    </CelesteContext.Provider>
  );
}

export function useCeleste() {
  const context = useContext(CelesteContext);
  if (!context) {
    throw new Error('useCeleste must be used within CelesteProvider');
  }
  return context;
}