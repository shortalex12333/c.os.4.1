/**
 * Network Configuration for CelesteOS
 * Handles localhost vs network IP resolution for mobile/desktop compatibility
 */

// Get the yacht ID from subdomain (e.g., "h3" from "h3.celeste7.ai")
export const getYachtId = (): string => {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const hostname = window.location.hostname;

  // Check if accessing via celeste7.ai subdomain
  const match = hostname.match(/^([^.]+)\.celeste7\.ai$/);
  if (match) {
    return match[1]; // Returns "h3" from "h3.celeste7.ai"
  }

  // Default yacht ID for development
  return 'default';
};

// Get the host IP dynamically based on current window location
export const getHostIP = (): string => {
  if (typeof window === 'undefined') {
    return 'localhost';
  }

  // If accessing via IP (mobile), return the same IP
  // If accessing via localhost (desktop), return localhost
  const hostname = window.location.hostname;

  // If hostname is an IP address, we're on mobile/network access
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return hostname;
  }

  // If accessing via celeste7.ai domain, use public IP
  if (hostname.includes('celeste7.ai')) {
    return '98.58.226.220'; // Public IP for external access
  }

  // Otherwise, use localhost (desktop access)
  return 'localhost';
};

// Network configuration for different services
export const NetworkConfig = {
  // n8n webhook server
  n8n: {
    host: getHostIP(),
    port: 5678,
    getBaseUrl: () => `http://${getHostIP()}:5678`
  },
  
  // Ollama LLM server
  ollama: {
    host: getHostIP(),
    port: 11434,
    getBaseUrl: () => `http://${getHostIP()}:11434`
  },
  
  // Email OAuth server
  emailAuth: {
    host: getHostIP(),
    port: 8003,
    getBaseUrl: () => `http://${getHostIP()}:8003`
  },
  
  // Main CelesteOS server
  main: {
    host: getHostIP(),
    port: 8080,
    getBaseUrl: () => `http://${getHostIP()}:8080`
  },
  
  // Email callback server
  emailCallback: {
    host: getHostIP(), 
    port: 8082,
    getBaseUrl: () => `http://${getHostIP()}:8082`
  },
  
  // Supabase integration
  supabase: {
    host: getHostIP(),
    port: 8001,
    getBaseUrl: () => `http://${getHostIP()}:8001`
  }
};

// Debug logging for network configuration
export const debugNetworkConfig = () => {
  console.log('🌐 CelesteOS Network Configuration:', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    hostIP: getHostIP(),
    n8n: NetworkConfig.n8n.getBaseUrl(),
    ollama: NetworkConfig.ollama.getBaseUrl(),
    emailAuth: NetworkConfig.emailAuth.getBaseUrl(),
    main: NetworkConfig.main.getBaseUrl()
  });
};