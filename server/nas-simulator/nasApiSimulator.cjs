/**
 * NAS API Simulator
 * Mimics QNAP/Synology NAS APIs for realistic testing
 * Runs on port 3001 with network latency simulation
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

class NASApiSimulator {
  constructor() {
    this.app = express();
    this.port = 3001;
    this.testDocsPath = path.join(process.cwd(), 'test-yacht-docs');
    this.sessions = new Map(); // Active user sessions
    this.apiLatency = 500; // Simulate network latency
    this.documentIndex = null;
    this.isOnline = true;
    
    this.setupMiddleware();
    this.loadDocumentIndex();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Add artificial latency to all requests
    this.app.use((req, res, next) => {
      setTimeout(() => {
        next();
      }, Math.random() * this.apiLatency);
    });

    // Log all requests
    this.app.use((req, res, next) => {
      console.log(`[NAS API] ${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  loadDocumentIndex() {
    try {
      const indexPath = path.join(this.testDocsPath, 'document_index.json');
      if (fs.existsSync(indexPath)) {
        this.documentIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        console.log(`📚 Loaded document index: ${this.documentIndex.totalDocuments} documents`);
      } else {
        console.log('⚠️  Document index not found. Run generateYachtDocuments.cjs first');
      }
    } catch (error) {
      console.error('❌ Failed to load document index:', error);
    }
  }

  setupRoutes() {
    // System status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        data: {
          system: 'QNAP TS-464C2',
          firmware: '5.0.1.2234',
          model: 'TS-464C2',
          storage_used: '2.1TB',
          storage_total: '8.0TB',
          uptime: Math.floor(Math.random() * 8760), // Random hours
          temperature: Math.floor(Math.random() * 20) + 30, // 30-50°C
          online: this.isOnline,
          last_backup: new Date(Date.now() - Math.random() * 86400000).toISOString()
        }
      });
    });

    // Authentication endpoint
    this.app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      
      // Simulate authentication
      if (username === 'engineer_readonly' || username === 'shortalex@hotmail.co.uk') {
        const sessionId = `nas_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionData = {
          user: username,
          role: username.includes('@') ? 'admin' : 'readonly',
          loginTime: new Date().toISOString(),
          permissions: ['read_documents', 'search_files', 'download']
        };

        this.sessions.set(sessionId, sessionData);

        res.json({
          success: true,
          message: 'Authentication successful',
          data: {
            session_id: sessionId,
            user: username,
            role: sessionData.role,
            permissions: sessionData.permissions,
            expires_in: 3600 // 1 hour
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        });
      }
    });

    // File listing endpoint
    this.app.get('/api/files/list', this.requireAuth, (req, res) => {
      const { folder = '/', recursive = false } = req.query;
      
      try {
        const targetPath = folder === '/' ? this.testDocsPath : path.join(this.testDocsPath, folder);
        
        if (!fs.existsSync(targetPath)) {
          return res.status(404).json({
            success: false,
            message: 'Folder not found',
            error: 'FOLDER_NOT_FOUND'
          });
        }

        const files = this.listFiles(targetPath, recursive === 'true');
        
        res.json({
          success: true,
          message: `Listed ${files.length} items`,
          data: {
            folder,
            files,
            total: files.length,
            last_modified: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to list files',
          error: error.message
        });
      }
    });

    // File search endpoint
    this.app.post('/api/files/search', this.requireAuth, (req, res) => {
      const { query, category, system, manufacturer, fault_code } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      try {
        const results = this.searchDocuments(query, { category, system, manufacturer, fault_code });
        
        res.json({
          success: true,
          message: `Found ${results.length} matching documents`,
          data: {
            query,
            filters: { category, system, manufacturer, fault_code },
            results,
            total: results.length,
            search_time: Math.floor(Math.random() * 500) + 100 // 100-600ms
          },
          // n8n compatibility - include maritime_data format
          maritime_data: {
            solutions: results.map(doc => ({
              title: doc.title,
              fault_code: doc.faultCode,
              system: doc.system,
              manufacturer: doc.manufacturer,
              troubleshooting_steps: doc.troubleshootingSteps || [],
              parts_required: doc.partsRequired || [],
              document_id: doc.docId,
              file_path: doc.path
            }))
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Search failed',
          error: error.message
        });
      }
    });

    // File download endpoint
    this.app.get('/api/files/download/:fileId', this.requireAuth, (req, res) => {
      const { fileId } = req.params;
      
      try {
        // Find document by ID
        const document = this.documentIndex?.documents.find(doc => doc.docId === fileId);
        
        if (!document) {
          return res.status(404).json({
            success: false,
            message: 'Document not found',
            error: 'DOCUMENT_NOT_FOUND'
          });
        }

        const filePath = path.join(this.testDocsPath, document.path);
        
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            message: 'File not found on disk',
            error: 'FILE_NOT_FOUND'
          });
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${document.docId}.pdf"`);
        
        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Download failed',
          error: error.message
        });
      }
    });

    // File content endpoint (for text extraction)
    this.app.get('/api/files/content/:fileId', this.requireAuth, (req, res) => {
      const { fileId } = req.params;
      
      try {
        const document = this.documentIndex?.documents.find(doc => doc.docId === fileId);
        
        if (!document) {
          return res.status(404).json({
            success: false,
            message: 'Document not found'
          });
        }

        // Return structured content instead of raw PDF
        res.json({
          success: true,
          message: 'Document content retrieved',
          data: {
            document_id: document.docId,
            title: `${document.manufacturer} ${document.equipment} - ${document.faultDescription}`,
            system: document.system,
            manufacturer: document.manufacturer,
            equipment: document.equipment,
            fault_code: document.faultCode,
            fault_description: document.faultDescription,
            symptoms: document.symptoms,
            troubleshooting_steps: document.troubleshootingSteps,
            solutions: document.solutions,
            parts_required: document.partsRequired,
            keywords: document.keywords,
            content_type: 'structured',
            extracted_at: new Date().toISOString()
          }
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to extract content',
          error: error.message
        });
      }
    });

    // Storage usage endpoint
    this.app.get('/api/storage/usage', this.requireAuth, (req, res) => {
      const stats = this.calculateStorageStats();
      
      res.json({
        success: true,
        data: stats
      });
    });

    // Network test endpoint
    this.app.get('/api/network/test', (req, res) => {
      const networkDelay = Math.floor(Math.random() * 200) + 50;
      
      setTimeout(() => {
        res.json({
          success: true,
          message: 'Network test successful',
          data: {
            latency_ms: networkDelay,
            bandwidth_mbps: Math.floor(Math.random() * 50) + 10,
            packet_loss: Math.random() * 2, // 0-2%
            jitter_ms: Math.random() * 10,
            timestamp: new Date().toISOString()
          }
        });
      }, networkDelay);
    });

    // Simulate network outage
    this.app.post('/api/admin/simulate-outage', (req, res) => {
      const { duration = 30000 } = req.body; // Default 30 seconds
      
      this.isOnline = false;
      console.log(`🚨 Simulating network outage for ${duration}ms`);
      
      setTimeout(() => {
        this.isOnline = true;
        console.log('✅ Network connectivity restored');
      }, duration);

      res.json({
        success: true,
        message: `Network outage simulated for ${duration}ms`,
        data: {
          offline_until: new Date(Date.now() + duration).toISOString()
        }
      });
    });

    // Health check that respects outage simulation
    this.app.get('/api/health', (req, res) => {
      if (!this.isOnline) {
        return res.status(503).json({
          success: false,
          message: 'NAS is currently offline',
          error: 'NETWORK_UNREACHABLE'
        });
      }

      res.json({
        success: true,
        message: 'NAS is online and operational',
        data: {
          status: 'online',
          uptime: process.uptime(),
          documents: this.documentIndex?.totalDocuments || 0,
          sessions: this.sessions.size,
          memory_usage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  // Authentication middleware
  requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'];
    
    let isAuthenticated = false;
    
    // Check for session ID
    if (sessionId && this.sessions.has(sessionId)) {
      req.session = this.sessions.get(sessionId);
      isAuthenticated = true;
    }
    
    // Check for basic auth (fallback)
    if (!isAuthenticated && authHeader && authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString().split(':');
      if (credentials[0] === 'engineer_readonly' || credentials[0] === 'shortalex@hotmail.co.uk') {
        isAuthenticated = true;
        req.session = { user: credentials[0], role: 'readonly' };
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }

    next();
  };

  listFiles(dirPath, recursive = false) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        const relativePath = path.relative(this.testDocsPath, itemPath);
        
        if (stats.isDirectory()) {
          files.push({
            name: item,
            type: 'folder',
            path: relativePath,
            size: 0,
            modified: stats.mtime.toISOString(),
            items: recursive ? this.listFiles(itemPath, true) : undefined
          });
        } else {
          files.push({
            name: item,
            type: 'file',
            path: relativePath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            extension: path.extname(item),
            mime_type: this.getMimeType(item)
          });
        }
      }
    } catch (error) {
      console.error('Error listing files:', error);
    }
    
    return files;
  }

  searchDocuments(query, filters = {}) {
    if (!this.documentIndex) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(' ');
    const results = [];

    for (const doc of this.documentIndex.documents) {
      let score = 0;
      let matches = [];

      // Search in fault description
      if (doc.faultDescription && searchTerms.some(term => doc.faultDescription.toLowerCase().includes(term))) {
        score += 10;
        matches.push('fault_description');
      }

      // Search in keywords
      for (const keyword of doc.keywords || []) {
        if (searchTerms.some(term => keyword.toLowerCase().includes(term))) {
          score += 5;
          matches.push('keywords');
        }
      }

      // Search in system
      if (doc.system && searchTerms.some(term => doc.system.toLowerCase().includes(term))) {
        score += 8;
        matches.push('system');
      }

      // Search in manufacturer
      if (doc.manufacturer && searchTerms.some(term => doc.manufacturer.toLowerCase().includes(term))) {
        score += 6;
        matches.push('manufacturer');
      }

      // Search in equipment
      if (doc.equipment && searchTerms.some(term => doc.equipment.toLowerCase().includes(term))) {
        score += 7;
        matches.push('equipment');
      }

      // Apply filters
      if (filters.category && doc.path && !doc.path.includes(filters.category)) {
        score = 0;
      }
      
      if (filters.system && doc.system !== filters.system) {
        score = 0;
      }
      
      if (filters.manufacturer && doc.manufacturer !== filters.manufacturer) {
        score = 0;
      }
      
      if (filters.fault_code && doc.faultCode !== filters.fault_code) {
        score = 0;
      }

      if (score > 0) {
        results.push({
          ...doc,
          title: `${doc.manufacturer} ${doc.equipment} - ${doc.faultDescription}`,
          score,
          matches,
          relevance: Math.min(score / 10, 1.0),
          troubleshootingSteps: doc.troubleshooting,
          partsRequired: doc.partsRequired
        });
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Limit to top 20 results
  }

  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  calculateStorageStats() {
    try {
      const totalFiles = this.documentIndex?.totalDocuments || 0;
      const totalSize = this.getTotalDirectorySize(this.testDocsPath);
      
      return {
        total_documents: totalFiles,
        total_size_bytes: totalSize,
        total_size_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100,
        systems: Object.keys(this.documentIndex?.systems || {}),
        manufacturers: Object.keys(this.documentIndex?.manufacturers || {}),
        storage_utilization: Math.random() * 0.3 + 0.1, // 10-40% utilization
        available_space_gb: Math.floor(Math.random() * 1000) + 500 // 500-1500GB available
      };
    } catch (error) {
      return {
        total_documents: 0,
        total_size_bytes: 0,
        error: 'Unable to calculate storage stats'
      };
    }
  }

  getTotalDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            totalSize += this.getTotalDirectorySize(filePath);
          } else {
            totalSize += stats.size;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error);
    }
    
    return totalSize;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚢 NAS API Simulator running on port ${this.port}`);
      console.log(`📡 Simulating network latency: ${this.apiLatency}ms average`);
      console.log(`📚 Documents available: ${this.documentIndex?.totalDocuments || 'none'}`);
      console.log(`🔗 Base URL: http://localhost:${this.port}`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  POST /api/auth/login - Authenticate user');
      console.log('  GET  /api/files/list - List files and folders');
      console.log('  POST /api/files/search - Search documents');
      console.log('  GET  /api/files/download/:fileId - Download document');
      console.log('  GET  /api/files/content/:fileId - Get document content');
      console.log('  GET  /api/health - System health check');
      console.log('  GET  /api/status - NAS system status');
      console.log('');
    });
  }
}

// Run simulator if executed directly
if (require.main === module) {
  const simulator = new NASApiSimulator();
  simulator.start();
}

module.exports = NASApiSimulator;