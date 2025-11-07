/**
 * NAS Configuration Manager
 * Handles switching between local testing and cloud/production modes
 */

interface NASCredentials {
  service: string;
  endpoint?: string;
  host?: string;
  credentials: {
    email?: string;
    password?: string;
    username?: string;
    share?: string;
    space?: string;
  };
  location?: string;
}

interface LocalNASConfig {
  type: 'local';
  simulator_url: string;
  auth: {
    username: string;
    password: string;
  };
  documents_path: string;
}

interface CloudNASConfig {
  type: 'cloud';
  service: string;
  endpoint: string;
  credentials: {
    email: string;
    password: string;
    space: string;
  };
  location: string;
}

interface ProductionNASConfig {
  type: 'production';
  service: string;
  host: string;
  credentials: {
    username: string;
    password: string;
    share: string;
  };
}

type NASConfigType = LocalNASConfig | CloudNASConfig | ProductionNASConfig;

class NASConfigManager {
  private currentMode: 'local' | 'cloud' | 'production';

  constructor() {
    // Determine mode based on environment
    this.currentMode = this.determineMode();
    console.log(`🔧 NAS Config Mode: ${this.currentMode.toUpperCase()}`);
  }

  private determineMode(): 'local' | 'cloud' | 'production' {
    // Check environment variable first
    const nasMode = process.env.NAS_MODE?.toLowerCase();
    if (nasMode && ['local', 'cloud', 'production'].includes(nasMode)) {
      return nasMode as 'local' | 'cloud' | 'production';
    }

    // Check if local simulator is available
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return 'local';
    }

    // Check if we have production NAS credentials
    if (process.env.NAS_HOST && process.env.NAS_USERNAME) {
      return 'production';
    }

    // Default to cloud mode
    return 'cloud';
  }

  getConfig(): NASConfigType {
    switch (this.currentMode) {
      case 'local':
        return this.getLocalConfig();
      case 'cloud':
        return this.getCloudConfig();
      case 'production':
        return this.getProductionConfig();
      default:
        throw new Error(`Invalid NAS mode: ${this.currentMode}`);
    }
  }

  private getLocalConfig(): LocalNASConfig {
    return {
      type: 'local',
      simulator_url: process.env.NAS_SIMULATOR_URL || 'http://localhost:3001',
      auth: {
        username: process.env.NAS_TEST_USERNAME || 'engineer_readonly',
        password: process.env.NAS_TEST_PASSWORD || 'test123'
      },
      documents_path: process.env.TEST_DOCS_PATH || './test-yacht-docs'
    };
  }

  private getCloudConfig(): CloudNASConfig {
    return {
      type: 'cloud',
      service: 'QNAP_CLOUD_STORAGE',
      endpoint: process.env.QNAP_CLOUD_ENDPOINT || 'https://myqnapcloud.com/api/v1',
      credentials: {
        email: process.env.QNAP_EMAIL || 'shortalex@hotmail.co.uk',
        password: process.env.QNAP_PASSWORD || 'z9w4d@@b#/nQ$Gz',
        space: process.env.QNAP_SPACE || 'My space - eu-west-1'
      },
      location: process.env.QNAP_LOCATION || 'London,UK'
    };
  }

  private getProductionConfig(): ProductionNASConfig {
    return {
      type: 'production',
      service: 'QNAP_NAS',
      host: process.env.NAS_HOST || '192.168.1.100',
      credentials: {
        username: process.env.NAS_USERNAME || 'engineer_readonly',
        password: process.env.NAS_PASSWORD || 'yacht_specific_pass',
        share: process.env.NAS_SHARE || 'Engineering_Docs'
      }
    };
  }

  getCurrentMode(): string {
    return this.currentMode;
  }

  switchMode(mode: 'local' | 'cloud' | 'production'): void {
    this.currentMode = mode;
    console.log(`🔄 Switched NAS mode to: ${mode.toUpperCase()}`);
  }

  isLocalMode(): boolean {
    return this.currentMode === 'local';
  }

  isCloudMode(): boolean {
    return this.currentMode === 'cloud';
  }

  isProductionMode(): boolean {
    return this.currentMode === 'production';
  }

  /**
   * Get mode-specific connection info for debugging
   */
  getConnectionInfo(): any {
    const config = this.getConfig();
    
    switch (config.type) {
      case 'local':
        return {
          mode: 'local',
          simulator_url: config.simulator_url,
          username: config.auth.username,
          documents_available: '48 test documents',
          latency: '~500ms (simulated)',
          description: 'Local testing with realistic yacht technical documents'
        };
        
      case 'cloud':
        return {
          mode: 'cloud',
          service: config.service,
          endpoint: config.endpoint,
          location: config.location,
          space: config.credentials.space,
          description: 'QNAP Cloud Storage for MVP testing'
        };
        
      case 'production':
        return {
          mode: 'production',
          service: config.service,
          host: config.host,
          share: config.credentials.share,
          description: 'Physical QNAP NAS on yacht network'
        };
        
      default:
        return { error: 'Unknown configuration mode' };
    }
  }

  /**
   * Test connectivity for current mode
   */
  async testConnectivity(): Promise<{ success: boolean; message: string; details?: any }> {
    const config = this.getConfig();
    
    try {
      switch (config.type) {
        case 'local':
          // Test local simulator
          const response = await fetch(`${config.simulator_url}/api/health`);
          const data = await response.json();
          
          return {
            success: response.ok,
            message: response.ok ? 'Local NAS simulator is online' : 'Local NAS simulator is offline',
            details: data
          };
          
        case 'cloud':
          // Test QNAP Cloud (basic connectivity)
          try {
            const cloudResponse = await fetch(config.endpoint, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            return {
              success: cloudResponse.ok,
              message: cloudResponse.ok ? 'QNAP Cloud is reachable' : 'QNAP Cloud is unreachable',
              details: { status: cloudResponse.status }
            };
          } catch (error) {
            return {
              success: false,
              message: 'QNAP Cloud connectivity test failed',
              details: { error: error.message }
            };
          }
          
        case 'production':
          // Test production NAS (ping/basic connectivity)
          try {
            // In real deployment, this would test actual NAS connectivity
            // For now, simulate based on host reachability
            return {
              success: false,
              message: 'Production NAS connectivity not implemented in development',
              details: { host: config.host, note: 'Use local mode for testing' }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Production NAS test failed',
              details: { error: error.message }
            };
          }
          
        default:
          return {
            success: false,
            message: 'Unknown NAS configuration type'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connectivity test failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Get environment-specific recommendations
   */
  getRecommendations(): string[] {
    const config = this.getConfig();
    
    switch (config.type) {
      case 'local':
        return [
          'Perfect for development and testing',
          'Contains 48 realistic yacht technical documents',
          'Simulates network latency and real NAS behavior',
          'Switch to production mode for yacht deployment',
          'Use "npm run nas-simulator" to start local NAS'
        ];
        
      case 'cloud':
        return [
          'QNAP Cloud has limited API capabilities',
          'Consider using local mode for comprehensive testing',
          'Cloud mode best for simple file storage scenarios',
          'Real yachts typically use local NAS hardware',
          'Verify QNAP Cloud credentials are correct'
        ];
        
      case 'production':
        return [
          'Designed for physical QNAP/Synology NAS on yacht',
          'Requires local network connectivity',
          'Ensure NAS user has read access to Engineering_Docs share',
          'Test connectivity from yacht network first',
          'Have IT support available for initial setup'
        ];
        
      default:
        return ['Unknown configuration - check NAS settings'];
    }
  }
}

// Export singleton instance
export const nasConfigManager = new NASConfigManager();
export default NASConfigManager;