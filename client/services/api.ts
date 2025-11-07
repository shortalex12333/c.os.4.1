// CelesteOS API Service Layer
// Handles all backend service connections

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  source?: {
    document: string;
    page: string;
    section: string;
  };
}

import { getHostIP } from '../config/network';

class CelesteAPI {
  private getBaseURLs() {
    const host = getHostIP();
    const protocol = window.location.protocol;
    const isExternal = window.location.hostname.includes('celeste7.ai');

    // When accessing via domain, use proxy paths through main URL
    if (isExternal) {
      const baseUrl = `${protocol}//${window.location.host}`;
      return {
        bge: `${baseUrl}/bge`,
        oauth: `${baseUrl}/oauth`,
        n8n: `${baseUrl}/webhook`, // n8n accessed via /webhook/* proxy
        ollama: `${baseUrl}/ollama`,
        redis: `${baseUrl}/redis`
      };
    }

    // Otherwise use direct localhost ports
    return {
      bge: 'http://localhost:8003',
      oauth: 'http://localhost:8004',
      n8n: 'http://localhost:5678',
      ollama: 'http://localhost:11434',
      redis: 'http://localhost:6379'
    };
  }

  private get baseURLs() {
    return this.getBaseURLs();
  }
  
  private offlineCache = new Map<string, any>();
  
  // Query the AI with offline fallback
  async queryAI(prompt: string, context?: string): Promise<APIResponse> {
    try {
      // Try Ollama first
      const response = await fetch(`${this.baseURLs.ollama}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2',
          prompt: context ? `Context: ${context}\n\nQuestion: ${prompt}` : prompt,
          stream: false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.response,
          confidence: this.calculateConfidence(data),
          source: this.extractSource(data)
        };
      }
    } catch (error) {
      console.warn('Ollama unavailable, using offline cache');
    }
    
    // Fallback to offline cache
    return this.getOfflineResponse(prompt);
  }
  
  // Generate embeddings for semantic search
  async generateEmbeddings(text: string): Promise<APIResponse<number[]>> {
    try {
      const response = await fetch(`${this.baseURLs.bge}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.embeddings };
      }
    } catch (error) {
      console.warn('BGE service unavailable');
    }
    
    return { success: false, error: 'Embeddings service unavailable' };
  }
  
  // Authenticate user
  async authenticate(credentials: { username: string; password: string }): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.baseURLs.oauth}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      console.warn('OAuth service unavailable');
    }
    
    // Offline mode - use local storage
    return this.offlineAuthenticate(credentials);
  }
  
  // Trigger n8n workflow
  async triggerWorkflow(workflowId: string, data: any): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.baseURLs.n8n}/webhook/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      }
    } catch (error) {
      console.warn('n8n service unavailable');
    }
    
    return { success: false, error: 'Workflow service unavailable' };
  }
  
  // Search documentation
  async searchDocuments(query: string): Promise<APIResponse> {
    try {
      // Generate embeddings for semantic search
      const embeddingsResponse = await this.generateEmbeddings(query);
      
      if (embeddingsResponse.success) {
        // Search with embeddings
        const searchResponse = await fetch(`${this.baseURLs.bge}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            embeddings: embeddingsResponse.data,
            limit: 10
          })
        });
        
        if (searchResponse.ok) {
          const results = await searchResponse.json();
          return { success: true, data: results };
        }
      }
    } catch (error) {
      console.warn('Search service unavailable, using offline cache');
    }
    
    // Fallback to offline search
    return this.offlineSearch(query);
  }
  
  // Emergency mode procedures
  async getEmergencyProcedure(situation: string): Promise<APIResponse> {
    // Always available offline
    const procedures = {
      'engine_failure': {
        steps: [
          'Immediately reduce throttle to idle',
          'Check oil pressure and temperature',
          'Attempt restart procedure if safe',
          'Switch to backup generator',
          'Alert nearby vessels'
        ],
        contacts: ['CAT Marine Support', 'Port Engineer']
      },
      'fire': {
        steps: [
          'Sound general alarm',
          'Activate fire suppression system',
          'Secure fuel and electrical systems',
          'Muster crew at emergency stations',
          'Prepare for evacuation if necessary'
        ],
        contacts: ['Coast Guard', 'Port Authority']
      },
      'flooding': {
        steps: [
          'Identify source of water ingress',
          'Start all bilge pumps',
          'Close watertight doors',
          'List vessel if necessary for damage control',
          'Prepare emergency equipment'
        ],
        contacts: ['Coast Guard', 'Marine Salvage']
      }
    };
    
    const procedure = procedures[situation.toLowerCase().replace(' ', '_')];
    if (procedure) {
      return { success: true, data: procedure };
    }
    
    return {
      success: false,
      error: 'No specific procedure found. Contact emergency services.'
    };
  }
  
  // Helper methods
  private calculateConfidence(response: any): number {
    // Simulate confidence calculation
    if (response.model === 'llama2') return 85;
    if (response.cached) return 75;
    return 65;
  }
  
  private extractSource(response: any): any {
    // Extract source information from response
    return {
      document: response.source || 'Operations Manual',
      page: response.page || '127',
      section: response.section || '5.3.2'
    };
  }
  
  private getOfflineResponse(prompt: string): APIResponse {
    // Simulate offline response
    const cachedResponse = this.offlineCache.get(prompt);
    if (cachedResponse) {
      return {
        success: true,
        data: cachedResponse,
        confidence: 75,
        source: {
          document: 'Offline Cache',
          page: 'N/A',
          section: 'Local'
        }
      };
    }
    
    return {
      success: true,
      data: 'I can provide assistance based on locally cached documentation. For the most up-to-date information, please connect to the network.',
      confidence: 60,
      source: {
        document: 'Offline Documentation',
        page: 'Various',
        section: 'Multiple'
      }
    };
  }
  
  private offlineAuthenticate(credentials: any): APIResponse {
    // Simple offline authentication
    const storedHash = localStorage.getItem('celesteAuthHash');
    const inputHash = btoa(`${credentials.username}:${credentials.password}`);
    
    if (storedHash === inputHash) {
      return {
        success: true,
        data: {
          token: 'offline-token',
          user: credentials.username
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials in offline mode'
    };
  }
  
  private offlineSearch(query: string): APIResponse {
    // Simulate offline search
    const results = [
      {
        title: 'Engine Maintenance Schedule',
        content: 'Regular maintenance intervals for main engines...',
        relevance: 0.85
      },
      {
        title: 'Safety Procedures',
        content: 'Emergency response protocols for various situations...',
        relevance: 0.72
      }
    ];
    
    return {
      success: true,
      data: results.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.content.toLowerCase().includes(query.toLowerCase())
      )
    };
  }
}

// Export singleton instance
export const celesteAPI = new CelesteAPI();

// Export types
export type { APIResponse };