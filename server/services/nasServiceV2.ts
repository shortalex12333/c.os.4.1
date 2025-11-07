/**
 * Enhanced NAS Service V2
 * Supports local simulator, QNAP Cloud, and production NAS
 */

import { nasConfigManager } from '../config/nasConfig';
import { telemetryService } from './telemetryService';

interface SearchResult {
  success: boolean;
  message: string;
  data: {
    query: string;
    category?: string;
    results: number;
    searchTime: number;
    source: 'local' | 'cloud' | 'production' | 'offline';
    documents: DocumentResult[];
  };
  maritime_data: {
    solutions: Solution[];
  };
}

interface DocumentResult {
  id: string;
  title: string;
  system: string;
  manufacturer: string;
  faultCode: string;
  description: string;
  path: string;
  relevance: number;
}

interface Solution {
  title: string;
  fault_code: string;
  system: string;
  manufacturer: string;
  troubleshooting_steps: string[];
  parts_required: string[];
  document_id: string;
  file_path: string;
}

interface NASStatus {
  connected: boolean;
  service: string;
  mode: string;
  authToken: boolean;
  endpoint?: string;
  host?: string;
  testFolder?: string;
  lastChecked: string;
  documentsAvailable?: number;
  recommendations?: string[];
}

class NASServiceV2 {
  private sessionId: string | null = null;
  private lastAuthTime: number = 0;
  private authValidDuration = 3600 * 1000; // 1 hour

  constructor() {
    console.log(`🔧 NAS Service V2 initialized in ${nasConfigManager.getCurrentMode()} mode`);
  }

  /**
   * Authenticate with current NAS configuration
   */
  async authenticate(): Promise<boolean> {
    const config = nasConfigManager.getConfig();
    const startTime = Date.now();

    try {
      switch (config.type) {
        case 'local':
          return await this.authenticateLocal(config);
        case 'cloud':
          return await this.authenticateCloud(config);
        case 'production':
          return await this.authenticateProduction(config);
        default:
          return false;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      telemetryService.trackWorkflowStage(
        'nas_authentication',
        'auth_attempt',
        false,
        responseTime,
        { mode: config.type },
        error.message
      );
      console.error('Authentication failed:', error);
      return false;
    }
  }

  private async authenticateLocal(config: any): Promise<boolean> {
    try {
      const response = await fetch(`${config.simulator_url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: config.auth.username,
          password: config.auth.password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.sessionId = data.data.session_id;
        this.lastAuthTime = Date.now();
        console.log('✅ Local NAS authentication successful');
        return true;
      } else {
        console.log('❌ Local NAS authentication failed:', data.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Local NAS simulator not available');
      return false;
    }
  }

  private async authenticateCloud(config: any): Promise<boolean> {
    // QNAP Cloud authentication is complex and not well documented
    // For now, simulate authentication
    console.log('⚠️  QNAP Cloud authentication not fully implemented');
    console.log('💡 Using local mode is recommended for testing');
    
    // Simulate delayed response
    await new Promise(resolve => setTimeout(resolve, 1000));
    return false;
  }

  private async authenticateProduction(config: any): Promise<boolean> {
    console.log('⚠️  Production NAS authentication requires physical NAS');
    console.log('💡 Use local mode for development testing');
    return false;
  }

  /**
   * Search for documents
   */
  async searchDocuments(query: string, category?: string): Promise<SearchResult> {
    const config = nasConfigManager.getConfig();
    const startTime = Date.now();
    
    try {
      // Ensure we're authenticated
      if (!await this.isAuthenticated()) {
        console.log('🔐 Re-authenticating with NAS...');
        await this.authenticate();
      }

      switch (config.type) {
        case 'local':
          return await this.searchLocal(query, category, startTime);
        case 'cloud':
          return await this.searchCloud(query, category, startTime);
        case 'production':
          return await this.searchProduction(query, category, startTime);
        default:
          throw new Error('Invalid NAS configuration');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Search failed:', error);
      
      // Track failed search
      telemetryService.trackDocumentSearch(query, 0, 0, responseTime, 'error');
      
      return {
        success: false,
        message: `Search failed: ${error.message}`,
        data: {
          query,
          category,
          results: 0,
          searchTime: responseTime,
          source: 'offline',
          documents: []
        },
        maritime_data: {
          solutions: []
        }
      };
    }
  }

  private async searchLocal(query: string, category?: string, startTime: number): Promise<SearchResult> {
    const config = nasConfigManager.getConfig();
    
    try {
      const searchPayload: any = { query };
      if (category) searchPayload.category = category;

      const response = await fetch(`${config.simulator_url}/api/files/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId || ''
        },
        body: JSON.stringify(searchPayload)
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (data.success) {
        // Track successful search
        telemetryService.trackDocumentSearch(
          query,
          data.data.results.length,
          0.8, // Assume good relevance for local results
          responseTime,
          'local'
        );

        return {
          success: true,
          message: data.message,
          data: {
            query,
            category,
            results: data.data.results.length,
            searchTime: responseTime,
            source: 'local',
            documents: data.data.results.map(this.formatDocumentResult)
          },
          maritime_data: data.maritime_data
        };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw new Error(`Local search failed: ${error.message}`);
    }
  }

  private async searchCloud(query: string, category?: string, startTime: number): Promise<SearchResult> {
    // QNAP Cloud search not implemented
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: false,
      message: 'QNAP Cloud search not implemented - use local mode',
      data: {
        query,
        category,
        results: 0,
        searchTime: Date.now() - startTime,
        source: 'cloud',
        documents: []
      },
      maritime_data: {
        solutions: []
      }
    };
  }

  private async searchProduction(query: string, category?: string, startTime: number): Promise<SearchResult> {
    // Production NAS search not available in development
    return {
      success: false,
      message: 'Production NAS not available - use local mode for testing',
      data: {
        query,
        category,
        results: 0,
        searchTime: Date.now() - startTime,
        source: 'production',
        documents: []
      },
      maritime_data: {
        solutions: []
      }
    };
  }

  /**
   * Get NAS status
   */
  async getStatus(): Promise<NASStatus> {
    const config = nasConfigManager.getConfig();
    const connectionInfo = nasConfigManager.getConnectionInfo();
    const connectivity = await nasConfigManager.testConnectivity();
    
    const status: NASStatus = {
      connected: connectivity.success,
      service: config.type === 'local' ? 'LOCAL_SIMULATOR' : 
               config.type === 'cloud' ? 'QNAP_CLOUD_STORAGE' : 'QNAP_NAS',
      mode: config.type,
      authToken: this.sessionId !== null,
      lastChecked: new Date().toISOString(),
      recommendations: nasConfigManager.getRecommendations()
    };

    // Add mode-specific details
    switch (config.type) {
      case 'local':
        status.endpoint = config.simulator_url;
        status.testFolder = 'test-yacht-docs';
        status.documentsAvailable = 48;
        break;
      case 'cloud':
        status.endpoint = config.endpoint;
        break;
      case 'production':
        status.host = config.host;
        break;
    }

    return status;
  }

  /**
   * Test NAS integration with comprehensive checks
   */
  async testIntegration(): Promise<any> {
    const startTime = Date.now();
    const results = {
      summary: {
        totalTests: 5,
        successfulTests: 0,
        successRate: '0%',
        averageResponseTime: '0ms',
        mode: nasConfigManager.getCurrentMode(),
        nasStatus: await this.getStatus()
      },
      tests: {
        connectivity: { success: false, responseTime: 0, message: '' },
        authentication: { success: false, responseTime: 0, message: '' },
        search: { success: false, responseTime: 0, message: '', resultsFound: 0 },
        documentRetrieval: { success: false, responseTime: 0, message: '' },
        integration: { success: false, responseTime: 0, message: '' }
      }
    };

    // Test 1: Connectivity
    try {
      const connectStart = Date.now();
      const connectivity = await nasConfigManager.testConnectivity();
      results.tests.connectivity = {
        success: connectivity.success,
        responseTime: Date.now() - connectStart,
        message: connectivity.message
      };
      if (connectivity.success) results.summary.successfulTests++;
    } catch (error) {
      results.tests.connectivity.message = error.message;
    }

    // Test 2: Authentication
    try {
      const authStart = Date.now();
      const authenticated = await this.authenticate();
      results.tests.authentication = {
        success: authenticated,
        responseTime: Date.now() - authStart,
        message: authenticated ? 'Authentication successful' : 'Authentication failed'
      };
      if (authenticated) results.summary.successfulTests++;
    } catch (error) {
      results.tests.authentication.message = error.message;
    }

    // Test 3: Search
    try {
      const searchStart = Date.now();
      const searchResult = await this.searchDocuments('generator fault', '02_ENGINE_ROOM');
      results.tests.search = {
        success: searchResult.success,
        responseTime: Date.now() - searchStart,
        message: searchResult.message,
        resultsFound: searchResult.data.results
      };
      if (searchResult.success) results.summary.successfulTests++;
    } catch (error) {
      results.tests.search.message = error.message;
    }

    // Test 4: Document Retrieval (if local mode)
    if (nasConfigManager.isLocalMode()) {
      try {
        const retrievalStart = Date.now();
        const config = nasConfigManager.getConfig();
        const response = await fetch(`${config.simulator_url}/api/files/list?folder=/`, {
          headers: { 'X-Session-Id': this.sessionId || '' }
        });
        const data = await response.json();
        
        results.tests.documentRetrieval = {
          success: data.success,
          responseTime: Date.now() - retrievalStart,
          message: data.success ? `Found ${data.data.files.length} folders` : data.message
        };
        if (data.success) results.summary.successfulTests++;
      } catch (error) {
        results.tests.documentRetrieval.message = error.message;
      }
    } else {
      results.tests.documentRetrieval = {
        success: false,
        responseTime: 0,
        message: 'Document retrieval only available in local mode'
      };
    }

    // Test 5: Integration (n8n compatibility)
    try {
      const integrationStart = Date.now();
      const searchResult = await this.searchDocuments('CAT engine', 'Main_Engines');
      const hasMaritimeData = searchResult.maritime_data && searchResult.maritime_data.solutions;
      
      results.tests.integration = {
        success: hasMaritimeData,
        responseTime: Date.now() - integrationStart,
        message: hasMaritimeData ? 'n8n compatible format confirmed' : 'maritime_data format missing'
      };
      if (hasMaritimeData) results.summary.successfulTests++;
    } catch (error) {
      results.tests.integration.message = error.message;
    }

    // Calculate summary
    results.summary.successRate = `${Math.round((results.summary.successfulTests / results.summary.totalTests) * 100)}%`;
    
    const avgResponseTime = Object.values(results.tests)
      .filter(test => test.success)
      .reduce((sum, test) => sum + test.responseTime, 0) / (results.summary.successfulTests || 1);
    results.summary.averageResponseTime = `${Math.round(avgResponseTime)}ms`;

    // Track integration test
    telemetryService.trackWorkflowStage(
      'nas_integration_test',
      'full_integration_test',
      results.summary.successfulTests >= 3,
      Date.now() - startTime,
      {
        mode: nasConfigManager.getCurrentMode(),
        success_rate: results.summary.successRate,
        tests_passed: results.summary.successfulTests
      }
    );

    return results;
  }

  /**
   * Private helper methods
   */
  private async isAuthenticated(): Promise<boolean> {
    if (!this.sessionId) return false;
    
    // Check if auth is still valid
    const timeSinceAuth = Date.now() - this.lastAuthTime;
    return timeSinceAuth < this.authValidDuration;
  }

  private formatDocumentResult(result: any): DocumentResult {
    return {
      id: result.docId,
      title: result.title,
      system: result.system,
      manufacturer: result.manufacturer,
      faultCode: result.faultCode,
      description: result.faultDescription,
      path: result.path,
      relevance: result.relevance || 0.8
    };
  }
}

export const nasServiceV2 = new NASServiceV2();
export default NASServiceV2;