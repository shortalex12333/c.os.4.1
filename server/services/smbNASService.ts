/**
 * SMB/CIFS NAS Service
 * Connects to Docker SMB share simulating yacht NAS
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { telemetryService } from './telemetryService';

const execAsync = promisify(exec);

interface SMBConfig {
  host: string;
  port: number;
  share: string;
  username: string;
  password: string;
  domain?: string;
  mountPoint: string;
}

interface SearchResult {
  success: boolean;
  message: string;
  data: {
    query: string;
    category?: string;
    results: number;
    searchTime: number;
    source: 'smb' | 'offline';
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
  size: number;
  modified: string;
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

class SMBNASService {
  private config: SMBConfig;
  private isConnected: boolean = false;
  private lastConnectionAttempt: number = 0;
  private connectionRetryDelay: number = 30000; // 30 seconds
  private documentIndex: any = null;

  constructor() {
    this.config = {
      host: process.env.NAS_HOST || 'localhost',
      port: parseInt(process.env.NAS_PORT || '445'),
      share: process.env.NAS_SHARE || 'YachtDocs',
      username: process.env.NAS_USERNAME || 'yacht_ai',
      password: process.env.NAS_PASSWORD || 'password123',
      domain: process.env.NAS_DOMAIN || 'WORKGROUP',
      mountPoint: process.env.NAS_MOUNT_POINT || '/tmp/yacht-nas'
    };

    console.log(`🔧 SMB NAS Service configured for ${this.config.host}:${this.config.port}/${this.config.share}`);
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Ensure mount point exists
      if (!existsSync(this.config.mountPoint)) {
        mkdirSync(this.config.mountPoint, { recursive: true });
      }

      // Load document index if available
      await this.loadDocumentIndex();
      
      // Test connection
      const connected = await this.testConnection();
      
      // If SMB connection fails, use local fallback
      if (!connected) {
        console.log('🔄 SMB connection failed, using local document fallback');
        await this.loadLocalDocumentFallback();
      }
    } catch (error) {
      console.error('SMB NAS initialization failed:', error);
      // Try local fallback as last resort
      await this.loadLocalDocumentFallback();
    }
  }

  /**
   * Load documents from local test directory when SMB is unavailable
   */
  private async loadLocalDocumentFallback(): Promise<void> {
    try {
      const localDocsPath = join(process.cwd(), 'test-yacht-docs');
      const indexPath = join(localDocsPath, 'document_index.json');
      
      if (existsSync(indexPath)) {
        const indexData = JSON.parse(readFileSync(indexPath, 'utf8'));
        this.documentIndex = indexData;
        console.log(`📚 Loaded document index: ${indexData.totalDocuments} documents`);
        console.log('📂 Using local document fallback from test-yacht-docs');
        
        // Mark as "connected" to local fallback
        this.isConnected = true;
      } else {
        console.log('⚠️  No local document fallback available');
      }
    } catch (error) {
      console.error('Failed to load local document fallback:', error);
    }
  }

  /**
   * Test SMB connection
   */
  async testConnection(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Use smbclient to test connection
      const testCommand = this.buildSMBCommand('', 'ls');
      const { stdout, stderr } = await execAsync(testCommand);
      
      if (stderr && stderr.includes('NT_STATUS')) {
        throw new Error(`SMB connection failed: ${stderr}`);
      }

      this.isConnected = true;
      this.lastConnectionAttempt = Date.now();
      
      console.log('✅ SMB NAS connection successful');
      
      // Track telemetry
      telemetryService.trackNASConnectivity(true, Date.now() - startTime);
      
      return true;
    } catch (error) {
      this.isConnected = false;
      this.lastConnectionAttempt = Date.now();
      
      console.log(`❌ SMB NAS connection failed: ${error.message}`);
      
      // Track telemetry
      telemetryService.trackNASConnectivity(false, Date.now() - startTime, error.message);
      
      return false;
    }
  }

  /**
   * Mount SMB share (alternative to smbclient)
   */
  async mountShare(): Promise<boolean> {
    if (process.platform !== 'darwin' && process.platform !== 'linux') {
      console.log('⚠️  SMB mounting only supported on macOS/Linux');
      return false;
    }

    try {
      const mountCommand = process.platform === 'darwin' 
        ? `mount -t smbfs //${this.config.username}:${this.config.password}@${this.config.host}/${this.config.share} ${this.config.mountPoint}`
        : `sudo mount -t cifs //${this.config.host}/${this.config.share} ${this.config.mountPoint} -o username=${this.config.username},password=${this.config.password},uid=$(id -u),gid=$(id -g)`;

      await execAsync(mountCommand);
      console.log(`✅ SMB share mounted at ${this.config.mountPoint}`);
      this.isConnected = true;
      return true;
    } catch (error) {
      console.log(`❌ Failed to mount SMB share: ${error.message}`);
      console.log('💡 Falling back to smbclient for file operations');
      return false;
    }
  }

  /**
   * Upload yacht documents to SMB share
   */
  async uploadYachtDocuments(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // First, copy our test documents to a temporary location for upload
      const sourceDocsPath = join(process.cwd(), 'test-yacht-docs');
      
      if (!existsSync(sourceDocsPath)) {
        throw new Error('Test yacht documents not found. Run generateYachtDocuments.cjs first.');
      }

      // Create folder structure on SMB share
      await this.createRemoteFolderStructure();

      // Upload documents
      const uploadCount = await this.uploadDocumentsRecursively(sourceDocsPath, '');
      
      console.log(`✅ Uploaded ${uploadCount} documents to SMB share`);
      
      // Track telemetry
      telemetryService.trackWorkflowStage(
        'document_upload',
        'smb_upload',
        true,
        Date.now() - startTime,
        { documents_uploaded: uploadCount }
      );

      return true;
    } catch (error) {
      console.error('Failed to upload documents:', error);
      
      // Track telemetry
      telemetryService.trackWorkflowStage(
        'document_upload',
        'smb_upload',
        false,
        Date.now() - startTime,
        {},
        error.message
      );

      return false;
    }
  }

  /**
   * Search documents on SMB share
   */
  async searchDocuments(query: string, category?: string): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Try to connect if not connected
      if (!this.isConnected) {
        console.log('🔄 Attempting SMB connection...');
        await this.testConnection();
      }

      // Search using document index (works with or without SMB connection)
      let results: DocumentResult[] = [];
      
      if (this.documentIndex) {
        console.log(`🔍 Searching document index for: "${query}"`);
        results = this.searchDocumentIndex(query, category);
      } else if (this.isConnected) {
        // Only try file listing if SMB is connected
        results = await this.searchByFileList(query, category);
      } else {
        // No index and no connection
        throw new Error('No document index available and SMB NAS is not connected');
      }

      const searchTime = Date.now() - startTime;

      // Track telemetry
      telemetryService.trackDocumentSearch(query, results.length, 0.8, searchTime, 'smb');

      return {
        success: true,
        message: `Found ${results.length} matching documents`,
        data: {
          query,
          category,
          results: results.length,
          searchTime,
          source: this.isConnected ? 'smb' : 'index',
          documents: results
        },
        maritime_data: {
          solutions: this.formatMaritimeData(results)
        }
      };
    } catch (error) {
      const searchTime = Date.now() - startTime;
      
      // Track telemetry
      telemetryService.trackDocumentSearch(query, 0, 0, searchTime, 'error');

      return {
        success: false,
        message: `Search failed: ${error.message}`,
        data: {
          query,
          category,  
          results: 0,
          searchTime,
          source: 'offline',
          documents: []
        },
        maritime_data: {
          solutions: []
        }
      };
    }
  }

  /**
   * Get NAS status
   */
  async getStatus(): Promise<any> {
    const connectionTest = await this.testConnection();
    
    return {
      connected: this.isConnected,
      service: 'SMB_NAS',
      host: this.config.host,
      port: this.config.port,
      share: this.config.share,
      mountPoint: this.config.mountPoint,
      lastChecked: new Date().toISOString(),
      lastConnectionAttempt: new Date(this.lastConnectionAttempt).toISOString(),
      documentsAvailable: this.documentIndex?.totalDocuments || 'unknown',
      connectionType: 'SMB/CIFS'
    };
  }

  /**
   * Download document from SMB share
   */
  async downloadDocument(documentPath: string): Promise<Buffer | null> {
    try {
      if (!this.isConnected) {
        await this.testConnection();
      }

      const command = this.buildSMBCommand(documentPath, 'get');
      const tempFile = `/tmp/yacht_doc_${Date.now()}.pdf`;
      
      await execAsync(`${command} ${tempFile}`);
      
      if (existsSync(tempFile)) {
        const buffer = readFileSync(tempFile);
        // Clean up temp file
        await execAsync(`rm ${tempFile}`);
        return buffer;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to download document:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private buildSMBCommand(path: string, operation: string): string {
    const baseCommand = `smbclient //${this.config.host}/${this.config.share} ${this.config.password} -U ${this.config.username}`;
    
    switch (operation) {
      case 'ls':
        return `${baseCommand} -c "ls"`;
      case 'get':
        return `${baseCommand} -c "get ${path}"`;
      case 'put':
        return `${baseCommand} -c "put ${path}"`;
      case 'mkdir':
        return `${baseCommand} -c "mkdir ${path}"`;
      default:
        return baseCommand;
    }
  }

  private async createRemoteFolderStructure(): Promise<void> {
    const folders = [
      '01_BRIDGE',
      '02_ENGINE_ROOM', 
      '03_ELECTRICAL',
      '04_HYDRAULICS',
      '05_HVAC',
      '06_WATER_SYSTEMS',
      '07_SAFETY',
      '08_DECK',
      '09_AUTOMATION',
      '10_MAINTENANCE'
    ];

    for (const folder of folders) {
      try {
        const command = this.buildSMBCommand(folder, 'mkdir');
        await execAsync(command);
      } catch (error) {
        // Folder might already exist, continue
      }
    }
  }

  private async uploadDocumentsRecursively(localPath: string, remotePath: string): Promise<number> {
    let uploadCount = 0;
    
    try {
      const items = readdirSync(localPath);
      
      for (const item of items) {
        const localItemPath = join(localPath, item);
        const remoteItemPath = remotePath ? `${remotePath}/${item}` : item;
        const stat = statSync(localItemPath);
        
        if (stat.isDirectory()) {
          // Create remote directory
          try {
            const command = this.buildSMBCommand(remoteItemPath, 'mkdir');
            await execAsync(command);
          } catch (error) {
            // Directory might exist
          }
          
          // Recursively upload contents
          uploadCount += await this.uploadDocumentsRecursively(localItemPath, remoteItemPath);
        } else if (stat.isFile()) {
          // Upload file
          try {
            const command = `smbclient //${this.config.host}/${this.config.share} ${this.config.password} -U ${this.config.username} -c "put ${localItemPath} ${remoteItemPath}"`;
            await execAsync(command);
            uploadCount++;
          } catch (error) {
            console.log(`⚠️  Failed to upload ${item}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in recursive upload:', error);
    }
    
    return uploadCount;
  }

  private async loadDocumentIndex(): Promise<void> {
    try {
      const indexPath = join(process.cwd(), 'test-yacht-docs', 'document_index.json');
      if (existsSync(indexPath)) {
        this.documentIndex = JSON.parse(readFileSync(indexPath, 'utf8'));
        console.log(`📚 Loaded document index: ${this.documentIndex.totalDocuments} documents`);
      }
    } catch (error) {
      console.log('⚠️  Could not load document index');
    }
  }

  private searchDocumentIndex(query: string, category?: string): DocumentResult[] {
    if (!this.documentIndex) return [];

    const searchTerms = query.toLowerCase().split(' ');
    const results: DocumentResult[] = [];

    for (const doc of this.documentIndex.documents) {
      let score = 0;

      // Search logic for yacht documents
      if (doc.title && searchTerms.some(term => doc.title.toLowerCase().includes(term))) {
        score += 10;
      }

      if (doc.description && searchTerms.some(term => doc.description.toLowerCase().includes(term))) {
        score += 8;
      }

      if (doc.tags && Array.isArray(doc.tags)) {
        for (const tag of doc.tags) {
          if (searchTerms.some(term => tag.toLowerCase().includes(term))) {
            score += 6;
          }
        }
      }

      if (doc.equipment && searchTerms.some(term => doc.equipment.toLowerCase().includes(term))) {
        score += 7;
      }

      if (doc.category && searchTerms.some(term => doc.category.toLowerCase().includes(term))) {
        score += 5;
      }

      if (doc.searchTerms && Array.isArray(doc.searchTerms)) {
        for (const searchTerm of doc.searchTerms) {
          if (searchTerms.some(term => searchTerm.toLowerCase().includes(term))) {
            score += 4;
          }
        }
      }

      // Apply category filter
      if (category && doc.path && !doc.path.includes(category)) {
        score = 0;
      }

      if (score > 0) {
        results.push({
          id: doc.id,
          title: doc.title,
          system: doc.category || 'Unknown',
          manufacturer: doc.equipment || 'Unknown',
          faultCode: doc.serialNumber || 'N/A',
          description: doc.description,
          path: doc.path,
          size: doc.fileSize || 1024 * 50,
          modified: doc.lastModified || new Date().toISOString(),
          relevance: Math.min(score / 10, 1.0)
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
  }

  private async searchByFileList(query: string, category?: string): Promise<DocumentResult[]> {
    // Fallback method: list files and search by filename
    try {
      const command = this.buildSMBCommand('', 'ls');
      const { stdout } = await execAsync(command);
      
      const files = stdout.split('\n')
        .filter(line => line.includes('.pdf'))
        .map(line => line.trim())
        .filter(filename => filename.toLowerCase().includes(query.toLowerCase()));

      return files.slice(0, 10).map((filename, index) => ({
        id: `smb_${index}`,
        title: filename.replace('.pdf', '').replace(/_/g, ' '),
        system: category || 'Unknown',
        manufacturer: 'Unknown',
        faultCode: `SMB-${index}`,
        description: `Document found by filename search: ${filename}`,
        path: filename,
        size: 1024 * 50,
        modified: new Date().toISOString(),
        relevance: 0.7
      }));
    } catch (error) {
      console.error('File list search failed:', error);
      return [];
    }
  }

  private formatMaritimeData(documents: DocumentResult[]): Solution[] {
    return documents.map(doc => ({
      title: doc.title,
      fault_code: doc.faultCode,
      system: doc.system,
      manufacturer: doc.manufacturer,
      troubleshooting_steps: [
        'Check system status and alarms',
        'Verify component operation',
        'Inspect for physical damage',
        'Test electrical connections',
        'Consult manufacturer documentation'
      ],
      parts_required: [
        `${doc.manufacturer} Service Kit`,
        'Replacement filters',
        'Electrical components as needed'
      ],
      document_id: doc.id,
      file_path: doc.path
    }));
  }
}

export const smbNASService = new SMBNASService();
export default SMBNASService;