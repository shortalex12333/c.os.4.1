/**
 * NAS Service for QNAP Cloud Integration
 * Handles document upload, search, and retrieval for yacht manuals
 */

import axios, { AxiosResponse } from 'axios';
import { getNASConfig, QNAP_CONFIG, QNAPCredentials } from '../config/qnapConfig';

export interface YachtDocument {
  id: string;
  filename: string;
  path: string;
  content: string;
  category: string;
  subcategory: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface DocumentSearchResult {
  documents: YachtDocument[];
  total: number;
  searchTime: number;
  source: 'nas' | 'cache' | 'offline';
}

class NASService {
  private config: QNAPCredentials;
  private authToken: string | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.config = getNASConfig();
  }

  /**
   * Authenticate with QNAP Cloud
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await axios.post(`${QNAP_CONFIG.baseUrl}/auth/login`, {
        email: this.config.credentials.email,
        password: this.config.credentials.password
      }, {
        timeout: QNAP_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.token) {
        this.authToken = response.data.token;
        this.isConnected = true;
        console.log('✅ QNAP Cloud authentication successful');
        return true;
      }
      
      throw new Error('No auth token received');
    } catch (error) {
      console.error('❌ QNAP Cloud authentication failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Upload fake yacht manual content to QNAP Cloud
   */
  async uploadDocument(path: string, filename: string, content: string): Promise<boolean> {
    if (!this.isConnected) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    try {
      const fullPath = `${this.config.credentials.space}/${path}/${filename}`;
      
      const response = await axios.post(`${QNAP_CONFIG.baseUrl}/files/upload`, {
        path: fullPath,
        content: content,
        overwrite: true
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: QNAP_CONFIG.timeout
      });

      console.log(`✅ Uploaded: ${filename} to ${path}`);
      return response.status === 200;
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error);
      return false;
    }
  }

  /**
   * Create folder structure in QNAP Cloud
   */
  async createFolderStructure(): Promise<boolean> {
    if (!this.isConnected) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    const folders = [
      'YACHT_AI_TEST',
      'YACHT_AI_TEST/01_BRIDGE/Navigation/Charts',
      'YACHT_AI_TEST/01_BRIDGE/Communications/Radio',
      'YACHT_AI_TEST/01_BRIDGE/Autopilot',
      'YACHT_AI_TEST/02_ENGINEERING/Main_Engines/Port_Engine',
      'YACHT_AI_TEST/02_ENGINEERING/Generators',
      'YACHT_AI_TEST/02_ENGINEERING/Fuel_System',
      'YACHT_AI_TEST/03_ELECTRICAL/Power_Distribution',
      'YACHT_AI_TEST/03_ELECTRICAL/Batteries',
      'YACHT_AI_TEST/04_HYDRAULICS/Steering',
      'YACHT_AI_TEST/04_HYDRAULICS/Stabilizers',
      'YACHT_AI_TEST/05_HVAC/Air_Conditioning',
      'YACHT_AI_TEST/06_WATER_SYSTEMS/Fresh_Water/Watermaker',
      'YACHT_AI_TEST/07_SAFETY_SYSTEMS/Fire_Detection',
      'YACHT_AI_TEST/08_GALLEY/Cooking_Equipment'
    ];

    try {
      for (const folder of folders) {
        const fullPath = `${this.config.credentials.space}/${folder}`;
        
        await axios.post(`${QNAP_CONFIG.baseUrl}/folders/create`, {
          path: fullPath
        }, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: QNAP_CONFIG.timeout
        });

        console.log(`📁 Created folder: ${folder}`);
      }

      console.log('✅ All folders created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create folder structure:', error);
      return false;
    }
  }

  /**
   * Search documents for yacht fault resolution
   */
  async searchDocuments(query: string, category?: string): Promise<DocumentSearchResult> {
    const startTime = Date.now();

    if (!this.isConnected) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        return {
          documents: [],
          total: 0,
          searchTime: Date.now() - startTime,
          source: 'offline'
        };
      }
    }

    try {
      const searchPath = category 
        ? `${this.config.credentials.space}/YACHT_AI_TEST/${category}`
        : `${this.config.credentials.space}/YACHT_AI_TEST`;

      const response = await axios.post(`${QNAP_CONFIG.baseUrl}/search`, {
        path: searchPath,
        query: query,
        recursive: true,
        fileTypes: ['pdf', 'txt', 'xlsx']
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: QNAP_CONFIG.timeout
      });

      const documents: YachtDocument[] = response.data.results.map((result: any) => ({
        id: result.id,
        filename: result.filename,
        path: result.path,
        content: result.content || '',
        category: this.extractCategory(result.path),
        subcategory: this.extractSubcategory(result.path),
        size: result.size || 0,
        created: new Date(result.created),
        modified: new Date(result.modified)
      }));

      return {
        documents,
        total: documents.length,
        searchTime: Date.now() - startTime,
        source: 'nas'
      };
    } catch (error) {
      console.error('❌ Document search failed:', error);
      return {
        documents: [],
        total: 0,
        searchTime: Date.now() - startTime,
        source: 'offline'
      };
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      service: this.config.service,
      location: this.config.location,
      authToken: !!this.authToken
    };
  }

  // Helper methods
  private extractCategory(path: string): string {
    const parts = path.split('/');
    const categoryPart = parts.find(part => part.match(/^\d{2}_/));
    return categoryPart?.replace(/^\d{2}_/, '') || 'Unknown';
  }

  private extractSubcategory(path: string): string {
    const parts = path.split('/');
    const categoryIndex = parts.findIndex(part => part.match(/^\d{2}_/));
    return categoryIndex >= 0 && categoryIndex < parts.length - 1 
      ? parts[categoryIndex + 1] 
      : 'General';
  }
}

export default new NASService();