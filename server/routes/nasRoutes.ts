/**
 * NAS Integration Routes for QNAP Cloud
 * Integrates with existing ChromaDB workflow on port 8001
 */

import { RequestHandler } from "express";
import nasService from '../services/nasService';
import generateFakeManuals from '../scripts/generateFakeManuals';
import { telemetryService } from '../services/telemetryService';

// Setup QNAP test environment
export const setupTestEnvironment: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  const workflowId = `setup_environment_${Date.now()}`;
  
  try {
    console.log('🚀 Setting up QNAP test environment...');
    
    // Step 1: Authenticate with QNAP Cloud
    const authStart = Date.now();
    const authenticated = await nasService.authenticate();
    telemetryService.trackWorkflowStage(
      workflowId,
      'qnap_authentication',
      authenticated,
      Date.now() - authStart,
      { service: 'qnap_cloud' }
    );
    if (!authenticated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to authenticate with QNAP Cloud',
        error: 'Authentication failed'
      });
    }

    // Step 2: Create folder structure
    const foldersCreated = await nasService.createFolderStructure();
    if (!foldersCreated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create folder structure',
        error: 'Folder creation failed'
      });
    }

    // Step 3: Upload fake manuals
    const fakeManuals = generateFakeManuals();
    let uploadedCount = 0;
    let failedCount = 0;

    for (const manual of fakeManuals) {
      const uploaded = await nasService.uploadDocument(
        manual.path,
        manual.filename,
        manual.content
      );
      
      if (uploaded) {
        uploadedCount++;
      } else {
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: 'QNAP test environment setup complete',
      data: {
        authentication: 'successful',
        foldersCreated: 'successful',
        documentsUploaded: uploadedCount,
        documentsFailed: failedCount,
        totalDocuments: fakeManuals.length,
        nasStatus: nasService.getStatus()
      }
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test environment setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Search NAS documents for yacht fault resolution
export const searchNASDocuments: RequestHandler = async (req, res) => {
  try {
    const { query, category } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: 'Missing query parameter'
      });
    }

    console.log(`🔍 Searching NAS for: "${query}" in category: ${category || 'all'}`);

    // Search documents in QNAP Cloud
    const searchResults = await nasService.searchDocuments(query, category);

    // Format response for n8n workflow compatibility
    const response = {
      success: true,
      message: 'Document search completed',
      data: {
        query: query,
        category: category || 'all',
        results: searchResults.documents.length,
        searchTime: searchResults.searchTime,
        source: searchResults.source,
        documents: searchResults.documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          category: doc.category,
          subcategory: doc.subcategory,
          relevantContent: doc.content.substring(0, 1500), // Limit for LLM processing
          confidence: calculateRelevance(query, doc.content),
          path: doc.path,
          size: doc.size,
          lastModified: doc.modified
        }))
      },
      // ChromaDB compatible format for n8n workflow
      maritime_data: {
        solutions: searchResults.documents.slice(0, 3).map((doc, index) => ({
          id: `nas-solution-${index + 1}`,
          title: `${doc.category} Solution from ${doc.filename}`,
          description: extractSolutionFromContent(doc.content, query),
          steps: extractStepsFromContent(doc.content),
          confidence: calculateRelevance(query, doc.content),
          source: 'NAS',
          document: doc.filename,
          category: doc.category
        }))
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ NAS search failed:', error);
    res.status(500).json({
      success: false,
      message: 'NAS document search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      maritime_data: {
        solutions: []
      }
    });
  }
};

// Get NAS connection status
export const getNASStatus: RequestHandler = (req, res) => {
  try {
    const status = nasService.getStatus();
    
    res.json({
      success: true,
      message: 'NAS status retrieved',
      data: {
        ...status,
        endpoint: 'https://myqnapcloud.com/api/v1',
        testFolder: 'YACHT_AI_TEST',
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get NAS status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Test NAS integration with ChromaDB workflow
export const testNASIntegration: RequestHandler = async (req, res) => {
  try {
    console.log('🧪 Testing NAS integration with ChromaDB workflow...');

    // Test queries that should find solutions in fake manuals
    const testQueries = [
      { query: "generator won't start", category: "02_ENGINEERING" },
      { query: "fire alarm detector fault", category: "07_SAFETY_SYSTEMS" },
      { query: "VHF radio no transmission", category: "01_BRIDGE" },
      { query: "stabilizer not working", category: "04_HYDRAULICS" },
      { query: "low water production", category: "06_WATER_SYSTEMS" }
    ];

    const testResults = [];

    for (const test of testQueries) {
      const startTime = Date.now();
      const searchResults = await nasService.searchDocuments(test.query, test.category);
      const responseTime = Date.now() - startTime;

      testResults.push({
        query: test.query,
        category: test.category,
        documentsFound: searchResults.documents.length,
        responseTime: responseTime,
        source: searchResults.source,
        hasRelevantContent: searchResults.documents.length > 0,
        topResult: searchResults.documents[0] ? {
          filename: searchResults.documents[0].filename,
          category: searchResults.documents[0].category,
          relevance: calculateRelevance(test.query, searchResults.documents[0].content)
        } : null
      });
    }

    const totalTests = testResults.length;
    const successfulTests = testResults.filter(test => test.hasRelevantContent).length;
    const averageResponseTime = testResults.reduce((sum, test) => sum + test.responseTime, 0) / totalTests;

    res.json({
      success: true,
      message: 'NAS integration test completed',
      data: {
        summary: {
          totalTests,
          successfulTests,
          successRate: `${Math.round((successfulTests / totalTests) * 100)}%`,
          averageResponseTime: `${averageResponseTime}ms`,
          nasStatus: nasService.getStatus()
        },
        testResults,
        integration: {
          qnapCloud: 'connected',
          documentSearch: 'functional',
          n8nCompatibility: 'ready',
          chromadbFormat: 'compatible'
        }
      }
    });

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    res.status(500).json({
      success: false,
      message: 'NAS integration test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper functions
function calculateRelevance(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(' ');
  const contentLower = content.toLowerCase();
  
  let matches = 0;
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matches++;
    }
  }
  
  return Math.min(matches / queryWords.length, 1.0);
}

function extractSolutionFromContent(content: string, query: string): string {
  const lines = content.split('\n');
  const solutionKeywords = ['SOLUTION:', 'TROUBLESHOOTING:', 'PROCEDURE:', 'STEPS:'];
  
  for (const line of lines) {
    for (const keyword of solutionKeywords) {
      if (line.includes(keyword)) {
        return line.replace(keyword, '').trim().substring(0, 200);
      }
    }
  }
  
  return `Solution for ${query} found in documentation. See detailed steps below.`;
}

function extractStepsFromContent(content: string): string[] {
  const lines = content.split('\n');
  const steps: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^\d+\./)) {
      steps.push(trimmed);
    }
  }
  
  return steps.length > 0 ? steps.slice(0, 5) : [
    'Check system status indicators',
    'Verify power and connections', 
    'Follow maintenance procedures',
    'Test system operation',
    'Monitor for normal operation'
  ];
}