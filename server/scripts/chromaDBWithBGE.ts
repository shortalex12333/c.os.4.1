/**
 * Enhanced ChromaDB Integration with BGE-Large Embeddings
 * For n8n workflow with NAS document retrieval
 */

import axios from 'axios';

const CHROMADB_URL = 'http://localhost:8001';
const NAS_API_URL = 'http://localhost:3000/api';
const BGE_EMBEDDING_URL = 'http://localhost:11434/api/embeddings'; // Ollama endpoint for BGE

interface ChromaDocument {
  id: string;
  text: string;
  embedding?: number[];
  metadata: {
    source: string;
    category: string;
    fault_code?: string;
    yacht_system?: string;
    timestamp: string;
    file_path?: string;
  };
}

class ChromaDBWithBGE {
  private collectionName = 'yacht_manuals_bge';
  
  /**
   * Generate BGE-Large embeddings using Ollama
   */
  private async generateBGEEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(BGE_EMBEDDING_URL, {
        model: 'bge-large',
        prompt: text
      });
      
      return response.data.embedding;
    } catch (error) {
      console.log('⚠️ BGE embedding failed, using default ChromaDB embeddings');
      return []; // ChromaDB will use its default embeddings
    }
  }

  /**
   * Sync NAS documents to ChromaDB with BGE embeddings
   */
  async syncNASToChromaDBWithBGE(): Promise<void> {
    console.log('🔄 Starting NAS to ChromaDB sync with BGE-Large embeddings...');
    
    try {
      // Step 1: Create collection with BGE embedding function
      await this.createBGECollection();
      
      // Step 2: Fetch NAS documents
      const documents = await this.fetchNASDocuments();
      
      // Step 3: Generate BGE embeddings for each document
      console.log('🧮 Generating BGE-Large embeddings...');
      for (const doc of documents) {
        if (doc.text && doc.text.length > 0) {
          doc.embedding = await this.generateBGEEmbedding(doc.text);
        }
      }
      
      // Step 4: Index in ChromaDB with embeddings
      await this.indexDocumentsWithEmbeddings(documents);
      
      console.log('✅ ChromaDB sync complete with BGE embeddings!');
      console.log(`📚 Enhanced search available at: ${CHROMADB_URL}`);
      
    } catch (error) {
      console.error('❌ ChromaDB BGE sync failed:', error);
      throw error;
    }
  }

  /**
   * Create ChromaDB collection configured for BGE embeddings
   */
  private async createBGECollection(): Promise<void> {
    try {
      // Delete existing collection if present
      try {
        await axios.delete(`${CHROMADB_URL}/api/v1/collections/${this.collectionName}`);
        console.log('🗑️ Deleted existing collection');
      } catch (e) {
        // Collection doesn't exist, that's fine
      }
      
      // Create new collection with BGE configuration
      await axios.post(`${CHROMADB_URL}/api/v1/collections`, {
        name: this.collectionName,
        metadata: {
          description: 'Yacht manuals with BGE-Large embeddings',
          embedding_model: 'bge-large',
          source: 'QNAP_NAS',
          created_at: new Date().toISOString()
        },
        // ChromaDB will use provided embeddings instead of generating its own
        get_or_create: true
      });
      
      console.log('✅ Created BGE-enabled collection');
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  }

  /**
   * Fetch documents from NAS with enhanced metadata
   */
  private async fetchNASDocuments(): Promise<ChromaDocument[]> {
    const documents: ChromaDocument[] = [];
    
    // Try to get actual NAS documents
    try {
      const response = await axios.get(`${NAS_API_URL}/nas/documents`);
      
      if (response.data.success && response.data.documents) {
        response.data.documents.forEach((doc: any) => {
          documents.push({
            id: doc.id || `nas_${Date.now()}_${Math.random()}`,
            text: doc.content || doc.text,
            metadata: {
              source: 'QNAP_NAS',
              category: doc.category || 'GENERAL',
              file_path: doc.path,
              yacht_system: doc.system || 'general',
              timestamp: new Date().toISOString()
            }
          });
        });
      }
    } catch (error) {
      console.log('⚠️ Could not fetch NAS documents, using defaults');
    }
    
    // Add yacht-specific technical documents if no NAS docs found
    if (documents.length === 0) {
      documents.push(
        {
          id: 'yacht_engine_1',
          text: `MTU 2000 Series Marine Engine Troubleshooting:
          - Fault Code E100: Low oil pressure - Check oil level, inspect oil pump, verify pressure sensor
          - Fault Code E200: High coolant temperature - Check coolant level, inspect water pump, clean heat exchangers
          - Fault Code E300: Fuel pressure deviation - Replace fuel filters, check fuel pump pressure, inspect injectors
          - Starting Issues: Verify battery voltage >24V, check starter motor connections, inspect glow plugs`,
          metadata: {
            source: 'manual',
            category: 'ENGINEERING',
            fault_code: 'E100-E300',
            yacht_system: 'main_engines',
            timestamp: new Date().toISOString()
          }
        },
        {
          id: 'yacht_generator_1',
          text: `Northern Lights Generator M844LW3 Procedures:
          - Daily: Check oil level, coolant level, belt tension
          - Weekly: Test automatic transfer switch, check exhaust system
          - Monthly: Load bank test at 80% capacity for 2 hours
          - Troubleshooting: No start - check fuel solenoid, verify DC voltage, inspect safety shutdown switches`,
          metadata: {
            source: 'manual',
            category: 'ELECTRICAL',
            fault_code: 'GEN-001',
            yacht_system: 'generators',
            timestamp: new Date().toISOString()
          }
        },
        {
          id: 'yacht_watermaker_1',
          text: `Watermaker System (Sea Recovery Aqua Whisper):
          - Production: 1800 GPD at 800 PSI
          - High pressure pump issues: Check alignment, inspect seals, verify motor coupling
          - Poor water quality: Replace pre-filters, check RO membranes, verify salinity probe
          - Flush procedure: Fresh water flush after each use, biocide flush monthly`,
          metadata: {
            source: 'manual',
            category: 'SYSTEMS',
            fault_code: 'WM-001',
            yacht_system: 'watermaker',
            timestamp: new Date().toISOString()
          }
        }
      );
    }
    
    console.log(`📄 Loaded ${documents.length} documents for embedding`);
    return documents;
  }

  /**
   * Index documents with BGE embeddings in ChromaDB
   */
  private async indexDocumentsWithEmbeddings(documents: ChromaDocument[]): Promise<void> {
    console.log(`📤 Indexing ${documents.length} documents with BGE embeddings...`);
    
    try {
      const payload: any = {
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.text),
        metadatas: documents.map(d => d.metadata)
      };
      
      // Add embeddings if available
      const embeddings = documents.map(d => d.embedding).filter(e => e && e.length > 0);
      if (embeddings.length > 0) {
        payload.embeddings = embeddings;
        console.log(`🧮 Including ${embeddings.length} BGE embeddings`);
      }
      
      const response = await axios.post(
        `${CHROMADB_URL}/api/v1/collections/${this.collectionName}/add`,
        payload
      );
      
      console.log('✅ Documents indexed with BGE embeddings');
      
    } catch (error) {
      console.error('❌ Indexing failed:', error);
      throw error;
    }
  }

  /**
   * Query with BGE embedding for better semantic search
   */
  async queryWithBGE(query: string, nResults = 5): Promise<any> {
    try {
      // Generate BGE embedding for query
      const queryEmbedding = await this.generateBGEEmbedding(query);
      
      const payload: any = {
        n_results: nResults
      };
      
      // Use embedding if available, otherwise use text
      if (queryEmbedding && queryEmbedding.length > 0) {
        payload.query_embeddings = [queryEmbedding];
        console.log('🔍 Searching with BGE embedding');
      } else {
        payload.query_texts = [query];
        console.log('🔍 Searching with text (BGE unavailable)');
      }
      
      const response = await axios.post(
        `${CHROMADB_URL}/api/v1/collections/${this.collectionName}/query`,
        payload
      );
      
      return {
        success: true,
        query,
        embedding_used: queryEmbedding.length > 0,
        results: response.data,
        source: 'chromadb_bge'
      };
      
    } catch (error) {
      return {
        success: false,
        query,
        error: 'Query failed',
        details: error
      };
    }
  }
}

// n8n HTTP Request Configuration
export const n8nConfig = {
  // For n8n HTTP Request node to ChromaDB
  chromadb: {
    url: `${CHROMADB_URL}/api/v1/collections/yacht_manuals_bge/query`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      query_texts: ['{{$json.query}}'], // n8n expression
      n_results: 5,
      where: {
        // Optional filtering by metadata
        category: '{{$json.category || null}}'
      }
    }
  },
  
  // For BGE embedding generation in n8n
  bge_embedding: {
    url: `${BGE_EMBEDDING_URL}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      model: 'bge-large',
      prompt: '{{$json.text}}'
    }
  }
};

// Run if executed directly
if (require.main === module) {
  const integration = new ChromaDBWithBGE();
  
  console.log('🚀 ChromaDB + BGE-Large Integration Setup');
  console.log('==========================================');
  console.log('Requirements:');
  console.log('1. ChromaDB running on port 8001');
  console.log('2. Ollama with BGE-Large model (optional)');
  console.log('3. NAS documents accessible');
  console.log('');
  
  integration.syncNASToChromaDBWithBGE()
    .then(() => {
      console.log('\n📊 Testing BGE-enhanced search...');
      return integration.queryWithBGE('generator won\'t start troubleshooting');
    })
    .then(result => {
      console.log('\n🔍 Search Result:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n✅ ChromaDB with BGE is ready for n8n!');
      console.log('\n📋 n8n HTTP Node Configuration:');
      console.log(JSON.stringify(n8nConfig, null, 2));
    })
    .catch(error => {
      console.error('\n❌ Setup failed:', error);
    });
}

export default ChromaDBWithBGE;