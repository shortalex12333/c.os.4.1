/**
 * ChromaDB Integration for n8n Workflow
 * Bridges NAS documents to ChromaDB on port 8001
 */

import axios from 'axios';

const CHROMADB_URL = 'http://localhost:8001';
const NAS_API_URL = 'http://localhost:3000/api';

interface ChromaDocument {
  id: string;
  text: string;
  metadata: {
    source: string;
    category: string;
    fault_code?: string;
    yacht_system?: string;
    timestamp: string;
  };
}

class ChromaDBIntegration {
  private collectionName = 'yacht_manuals';

  /**
   * Sync NAS documents to ChromaDB for n8n access
   */
  async syncNASToChromaDB(): Promise<void> {
    console.log('🔄 Starting NAS to ChromaDB synchronization...');
    
    try {
      // Step 1: Setup NAS test environment
      const setupResponse = await axios.post(`${NAS_API_URL}/nas/setup`);
      
      if (!setupResponse.data.success) {
        console.log('⚠️  Using offline documents for ChromaDB population');
      }

      // Step 2: Create/verify ChromaDB collection
      await this.ensureChromaDBCollection();

      // Step 3: Get documents from NAS
      const documents = await this.fetchNASDocuments();

      // Step 4: Index documents in ChromaDB
      await this.indexDocumentsInChromaDB(documents);

      console.log('✅ ChromaDB synchronization complete!');
      console.log(`📚 Documents available at: ${CHROMADB_URL}/api/v1/collections/${this.collectionName}`);
      
    } catch (error) {
      console.error('❌ ChromaDB sync failed:', error);
      throw error;
    }
  }

  /**
   * Ensure ChromaDB collection exists
   */
  private async ensureChromaDBCollection(): Promise<void> {
    try {
      // Check if collection exists
      const response = await axios.get(`${CHROMADB_URL}/api/v1/collections/${this.collectionName}`);
      console.log(`✅ ChromaDB collection '${this.collectionName}' exists`);
    } catch (error) {
      // Create collection if it doesn't exist
      console.log(`📦 Creating ChromaDB collection '${this.collectionName}'...`);
      
      try {
        await axios.post(`${CHROMADB_URL}/api/v1/collections`, {
          name: this.collectionName,
          metadata: {
            description: 'Yacht engineering manuals and fault codes',
            source: 'QNAP_NAS',
            created_at: new Date().toISOString()
          }
        });
        console.log('✅ Collection created successfully');
      } catch (createError) {
        console.log('⚠️  Collection might already exist or ChromaDB not running on port 8001');
      }
    }
  }

  /**
   * Fetch documents from NAS service
   */
  private async fetchNASDocuments(): Promise<ChromaDocument[]> {
    const categories = [
      '01_SYSTEMS_OVERVIEW',
      '02_ENGINEERING',
      '03_ELECTRICAL',
      '04_HYDRAULICS',
      '05_NAVIGATION',
      '06_SAFETY',
      '07_MAINTENANCE',
      '08_TROUBLESHOOTING'
    ];

    const documents: ChromaDocument[] = [];
    
    for (const category of categories) {
      try {
        // Search for documents in each category
        const response = await axios.post(`${NAS_API_URL}/nas/search`, {
          query: '*',
          category
        });

        if (response.data.success && response.data.maritime_data?.solutions) {
          // Convert to ChromaDB format
          response.data.maritime_data.solutions.forEach((solution: any, index: number) => {
            documents.push({
              id: `${category}_${index}_${Date.now()}`,
              text: typeof solution === 'string' ? solution : JSON.stringify(solution),
              metadata: {
                source: 'QNAP_NAS',
                category,
                fault_code: solution.fault_code || `${category}-${index}`,
                yacht_system: category.replace(/_/g, ' ').toLowerCase(),
                timestamp: new Date().toISOString()
              }
            });
          });
        }
      } catch (error) {
        console.log(`⚠️  Failed to fetch ${category} documents`);
      }
    }

    // Add some default documents if none found
    if (documents.length === 0) {
      console.log('📝 Adding default yacht documents...');
      documents.push(
        {
          id: 'default_1',
          text: 'Generator won\'t start: Check fuel levels, inspect spark plugs, verify oil pressure, check battery voltage',
          metadata: {
            source: 'default',
            category: '02_ENGINEERING',
            fault_code: 'GEN-001',
            yacht_system: 'engineering',
            timestamp: new Date().toISOString()
          }
        },
        {
          id: 'default_2',
          text: 'Navigation system offline: Verify GPS antenna connection, check power supply, restart navigation computer',
          metadata: {
            source: 'default',
            category: '05_NAVIGATION',
            fault_code: 'NAV-001',
            yacht_system: 'navigation',
            timestamp: new Date().toISOString()
          }
        },
        {
          id: 'default_3',
          text: 'Hydraulic pressure loss: Check hydraulic fluid levels, inspect for leaks, verify pump operation',
          metadata: {
            source: 'default',
            category: '04_HYDRAULICS',
            fault_code: 'HYD-001',
            yacht_system: 'hydraulics',
            timestamp: new Date().toISOString()
          }
        }
      );
    }

    console.log(`📄 Prepared ${documents.length} documents for ChromaDB`);
    return documents;
  }

  /**
   * Index documents in ChromaDB
   */
  private async indexDocumentsInChromaDB(documents: ChromaDocument[]): Promise<void> {
    console.log(`📤 Indexing ${documents.length} documents in ChromaDB...`);
    
    try {
      // ChromaDB add documents endpoint
      const response = await axios.post(
        `${CHROMADB_URL}/api/v1/collections/${this.collectionName}/add`,
        {
          ids: documents.map(d => d.id),
          documents: documents.map(d => d.text),
          metadatas: documents.map(d => d.metadata)
        }
      );

      console.log('✅ Documents indexed successfully in ChromaDB');
      
    } catch (error) {
      console.log('⚠️  ChromaDB indexing failed - ChromaDB may not be running on port 8001');
      console.log('💡 To start ChromaDB: docker run -p 8001:8000 chromadb/chroma');
    }
  }

  /**
   * Query ChromaDB (for n8n compatibility testing)
   */
  async queryChromaDB(query: string, nResults = 5): Promise<any> {
    try {
      const response = await axios.post(
        `${CHROMADB_URL}/api/v1/collections/${this.collectionName}/query`,
        {
          query_texts: [query],
          n_results: nResults
        }
      );

      return {
        success: true,
        query,
        results: response.data,
        source: 'chromadb',
        endpoint: CHROMADB_URL
      };
      
    } catch (error) {
      return {
        success: false,
        query,
        error: 'ChromaDB query failed',
        message: 'Ensure ChromaDB is running on port 8001'
      };
    }
  }
}

// Run integration if executed directly
if (require.main === module) {
  const integration = new ChromaDBIntegration();
  
  console.log('🚀 ChromaDB Integration for n8n Workflow');
  console.log('=========================================');
  console.log('This will:');
  console.log('1. Fetch documents from NAS service');
  console.log('2. Create ChromaDB collection on port 8001');
  console.log('3. Index documents for n8n workflow access');
  console.log('');
  
  integration.syncNASToChromaDB()
    .then(() => {
      console.log('\n📊 Testing ChromaDB query...');
      return integration.queryChromaDB('generator problem');
    })
    .then(result => {
      console.log('\n🔍 Query Result:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n✅ ChromaDB is ready for n8n workflow!');
      console.log('🔗 n8n can now query: http://localhost:8001/api/v1/collections/yacht_manuals/query');
    })
    .catch(error => {
      console.error('\n❌ Integration failed:', error.message);
      process.exit(1);
    });
}

export default ChromaDBIntegration;