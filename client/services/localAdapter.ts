/**
 * Local Service Adapter
 * Converts full-stack API calls to local service calls
 */

import { getHostIP } from '../config/network';

export interface LocalServices {
  bge: string;      // BGE embeddings service
  oauth: string;    // OAuth service
  n8n: string;      // n8n workflow engine
  ollama: string;   // Ollama LLM service
}

/**
 * Get dynamic service URLs based on access method
 */
const getLocalServices = (): LocalServices => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const isExternal = hostname.includes('celeste7.ai');

  // When accessing via domain, use proxy paths through main URL
  if (isExternal) {
    const baseUrl = `${protocol}//${window.location.host}`;
    return {
      bge: `${baseUrl}/bge`,
      oauth: `${baseUrl}/oauth`,
      n8n: `${baseUrl}/webhook`, // n8n accessed via /webhook/* proxy
      ollama: `${baseUrl}/ollama`
    };
  }

  // Otherwise use direct localhost ports
  return {
    bge: 'http://localhost:8003',
    oauth: 'http://localhost:8004',
    n8n: 'http://localhost:5678',
    ollama: 'http://localhost:11434'
  };
};

const LOCAL_SERVICES: LocalServices = getLocalServices();

export type SearchType = 'yacht' | 'email' | 'local';

export class LocalServiceAdapter {
  /**
   * Main search function that routes to appropriate local service
   */
  async search(query: string, type: SearchType): Promise<any> {
    console.log(`[LocalAdapter] Search: ${query} (type: ${type})`);

    switch(type) {
      case 'yacht':
        return this.searchYacht(query);
      case 'email':
        return this.searchEmail(query);
      case 'local':
      default:
        return this.searchLocal(query);
    }
  }

  /**
   * Yacht documentation search using BGE embeddings
   */
  private async searchYacht(query: string): Promise<any> {
    try {
      const response = await fetch(`${LOCAL_SERVICES.bge}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type: 'yacht_docs' })
      });
      
      if (!response.ok) throw new Error('BGE service unavailable');
      return await response.json();
    } catch (error) {
      console.log('[LocalAdapter] BGE offline, using mock data');
      return this.getMockYachtData(query);
    }
  }

  /**
   * Email search using OAuth service
   */
  private async searchEmail(query: string): Promise<any> {
    try {
      const response = await fetch(`${LOCAL_SERVICES.oauth}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) throw new Error('OAuth service unavailable');
      return await response.json();
    } catch (error) {
      console.log('[LocalAdapter] OAuth offline, using mock data');
      return this.getMockEmailData(query);
    }
  }

  /**
   * Local LLM search using Ollama
   */
  private async searchLocal(query: string): Promise<any> {
    try {
      const response = await fetch(`${LOCAL_SERVICES.ollama}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2',
          prompt: query,
          stream: false
        })
      });
      
      if (!response.ok) throw new Error('Ollama service unavailable');
      const data = await response.json();
      return { response: data.response, source: 'local_llm' };
    } catch (error) {
      console.log('[LocalAdapter] Ollama offline, using fallback response');
      return this.getFallbackResponse(query);
    }
  }

  /**
   * Mock data for yacht documentation
   */
  private getMockYachtData(query: string) {
    return {
      results: [
        {
          title: 'Engine Maintenance Manual',
          content: 'Regular maintenance procedures for marine engines...',
          relevance: 0.95,
          source: 'mock_yacht_docs'
        },
        {
          title: 'Navigation System Guide',
          content: 'GPS and navigation system troubleshooting...',
          relevance: 0.87,
          source: 'mock_yacht_docs'
        }
      ],
      source: 'mock_data',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock data for email search
   */
  private getMockEmailData(query: string) {
    return {
      emails: [
        {
          subject: 'RE: Maintenance Schedule',
          from: 'chief@yacht.com',
          date: '2024-01-15',
          preview: 'The quarterly maintenance is scheduled for...',
          relevance: 0.92
        }
      ],
      source: 'mock_email',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fallback response when all services are offline
   */
  private getFallbackResponse(query: string) {
    return {
      response: `I understand you're asking about "${query}". Currently running in offline mode. Based on local knowledge, here's what I can tell you...`,
      confidence: 0.7,
      source: 'offline_fallback',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check service health
   */
  async checkServiceHealth(): Promise<{[key: string]: boolean}> {
    const health: {[key: string]: boolean} = {};
    
    for (const [name, url] of Object.entries(LOCAL_SERVICES)) {
      try {
        const response = await fetch(`${url}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        health[name] = response.ok;
      } catch {
        health[name] = false;
      }
    }
    
    return health;
  }
}

// Export singleton instance
export const localAdapter = new LocalServiceAdapter();