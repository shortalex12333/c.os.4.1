/**
 * SMB NAS Routes for Docker/Real NAS Integration
 * Replaces the simulator with actual SMB/CIFS connectivity
 */

import { RequestHandler } from "express";
import { smbNASService } from '../services/smbNASService';
import { telemetryService } from '../services/telemetryService';

// Setup SMB NAS environment
export const setupSMBEnvironment: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  const workflowId = `setup_smb_${Date.now()}`;
  
  try {
    console.log('🚀 Setting up SMB NAS environment...');
    
    // Step 1: Test SMB connection
    const connectionStart = Date.now();
    const connected = await smbNASService.testConnection();
    telemetryService.trackWorkflowStage(
      workflowId,
      'smb_connection_test',
      connected,
      Date.now() - connectionStart,
      { service: 'smb_nas' }
    );

    if (!connected) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to SMB NAS',
        error: 'SMB connection failed',
        data: {
          host: process.env.NAS_HOST || 'localhost',
          port: process.env.NAS_PORT || '445',
          share: process.env.NAS_SHARE || 'YachtDocs',
          suggestion: 'Run ./scripts/setup-yacht-nas.sh to start Docker NAS'
        }
      });
    }

    // Step 2: Upload yacht documents (if not already present)
    const uploadStart = Date.now();
    const uploaded = await smbNASService.uploadYachtDocuments();
    telemetryService.trackWorkflowStage(
      workflowId,
      'document_upload',
      uploaded,
      Date.now() - uploadStart,
      { service: 'smb_nas' }
    );

    // Step 3: Get NAS status
    const status = await smbNASService.getStatus();

    const totalTime = Date.now() - startTime;
    
    // Track overall setup
    telemetryService.trackWorkflowStage(
      workflowId,
      'smb_setup_complete',
      connected && uploaded,
      totalTime,
      { 
        connected,
        documents_uploaded: uploaded,
        nas_service: 'smb'
      }
    );

    res.json({
      success: true,
      message: 'SMB NAS environment setup completed',
      data: {
        connected,
        documentsUploaded: uploaded,
        nasStatus: status,
        setupTime: totalTime,
        workflowId
      }
    });

  } catch (error) {
    console.error('SMB setup error:', error);
    
    // Track failure
    telemetryService.trackWorkflowStage(
      workflowId,
      'smb_setup_failed',
      false,
      Date.now() - startTime,
      {},
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'SMB NAS setup failed',
      error: error.message,
      suggestions: [
        'Check if Docker yacht-nas container is running',
        'Run: docker ps | grep yacht-nas',
        'Start NAS: ./scripts/setup-yacht-nas.sh',
        'Check SMB credentials in environment variables'
      ]
    });
  }
};

// Search SMB NAS documents
export const searchSMBDocuments: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  const { query, category } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  try {
    console.log(`🔍 Searching SMB NAS for: "${query}" in category: ${category || 'all'}`);
    
    const searchResult = await smbNASService.searchDocuments(query, category);
    const responseTime = Date.now() - startTime;

    // Add response metadata  
    searchResult.data.searchTime = responseTime;

    res.json(searchResult);

  } catch (error) {
    console.error('SMB search error:', error);
    
    const responseTime = Date.now() - startTime;
    
    // Track failed search
    telemetryService.trackDocumentSearch(query, 0, 0, responseTime, 'error');

    res.status(500).json({
      success: false,
      message: 'SMB document search failed',
      error: error.message,
      data: {
        query,
        category,
        results: 0,
        searchTime: responseTime,
        source: 'error',
        documents: []
      },
      maritime_data: {
        solutions: []
      }
    });
  }
};

// Get SMB NAS status
export const getSMBStatus: RequestHandler = async (req, res) => {
  try {
    const status = await smbNASService.getStatus();
    
    res.json({
      success: true,
      message: 'SMB NAS status retrieved',
      data: status
    });

  } catch (error) {
    console.error('SMB status error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get SMB NAS status',
      error: error.message
    });
  }
};

// Test SMB NAS integration
export const testSMBIntegration: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Running SMB NAS integration tests...');
    
    const results = {
      summary: {
        totalTests: 4,
        successfulTests: 0,
        successRate: '0%',
        averageResponseTime: '0ms',
        nasType: 'SMB/CIFS'
      },
      tests: {
        connection: { success: false, responseTime: 0, message: '' },
        status: { success: false, responseTime: 0, message: '' },
        search: { success: false, responseTime: 0, message: '', resultsFound: 0 },
        integration: { success: false, responseTime: 0, message: '' }
      }
    };

    // Test 1: Connection
    const connStart = Date.now();
    try {
      const connected = await smbNASService.testConnection();
      results.tests.connection = {
        success: connected,
        responseTime: Date.now() - connStart,
        message: connected ? 'SMB connection successful' : 'SMB connection failed'
      };
      if (connected) results.summary.successfulTests++;
    } catch (error) {
      results.tests.connection.message = error.message;
    }

    // Test 2: Status check
    const statusStart = Date.now();
    try {
      const status = await smbNASService.getStatus();
      results.tests.status = {
        success: !!status,
        responseTime: Date.now() - statusStart,
        message: status ? `NAS status retrieved: ${status.connected ? 'connected' : 'disconnected'}` : 'Status check failed'
      };
      if (status) results.summary.successfulTests++;
    } catch (error) {
      results.tests.status.message = error.message;
    }

    // Test 3: Document search
    const searchStart = Date.now();
    try {
      const searchResult = await smbNASService.searchDocuments('generator', '02_ENGINE_ROOM');
      results.tests.search = {
        success: searchResult.success,
        responseTime: Date.now() - searchStart,
        message: searchResult.success ? 
          `Search successful: ${searchResult.data.results} results found` : 
          searchResult.message,
        resultsFound: searchResult.data.results
      };
      if (searchResult.success) results.summary.successfulTests++;
    } catch (error) {
      results.tests.search.message = error.message;
    }

    // Test 4: n8n integration format
    const integrationStart = Date.now();
    try {
      const integrationTest = await smbNASService.searchDocuments('engine fault');
      const hasMaritimeData = integrationTest.maritime_data && 
                             Array.isArray(integrationTest.maritime_data.solutions);
      
      results.tests.integration = {
        success: hasMaritimeData,
        responseTime: Date.now() - integrationStart,
        message: hasMaritimeData ? 
          'n8n maritime_data format confirmed' : 
          'maritime_data format missing or invalid'
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

    const overallSuccess = results.summary.successfulTests >= 3;
    
    // Track integration test
    telemetryService.trackWorkflowStage(
      'smb_integration_test',
      'full_integration_test',
      overallSuccess,
      Date.now() - startTime,
      {
        service: 'smb_nas',
        success_rate: results.summary.successRate,
        tests_passed: results.summary.successfulTests
      }
    );

    res.json({
      success: overallSuccess,
      message: `SMB integration test completed: ${results.summary.successRate} success rate`,
      data: results
    });

  } catch (error) {
    console.error('SMB integration test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'SMB integration test failed',
      error: error.message
    });
  }
};

// Download document from SMB share
export const downloadSMBDocument: RequestHandler = async (req, res) => {
  const { documentId } = req.params;
  
  try {
    console.log(`📥 Downloading document: ${documentId}`);
    
    // For now, return document metadata
    // In a full implementation, this would stream the actual PDF
    res.json({
      success: true,
      message: 'Document download prepared',
      data: {
        documentId,
        downloadUrl: `/api/smb/files/${documentId}`,
        contentType: 'application/pdf',
        note: 'Full PDF streaming implementation pending'
      }
    });

  } catch (error) {
    console.error('SMB download error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Document download failed',
      error: error.message
    });
  }
};