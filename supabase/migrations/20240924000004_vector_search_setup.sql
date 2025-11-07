-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents search table with vector embeddings
CREATE TABLE IF NOT EXISTS documents_search (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    doc_type VARCHAR(100),
    doc_name VARCHAR(500),
    content TEXT,
    search_vector vector(1536), -- OpenAI embedding dimensions
    metadata JSONB DEFAULT '{}',
    source_url VARCHAR(1000),
    manufacturer_id VARCHAR(50),
    CONSTRAINT fk_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturer_profiles(manufacturer_id)
);

-- FAQ knowledge base with vector embeddings
CREATE TABLE IF NOT EXISTS faq_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    vector_embedding vector(1536),
    confidence_score DECIMAL(5,4),
    metadata JSONB DEFAULT '{}'
);

-- Yacht emails with embeddings for semantic search
CREATE TABLE IF NOT EXISTS yacht_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subject TEXT,
    content TEXT,
    email_type VARCHAR(50),
    email_embedding vector(1536),
    equipment_mentioned TEXT[],
    part_numbers_mentioned TEXT[],
    sender_domain VARCHAR(100),
    metadata JSONB DEFAULT '{}'
);

-- Verified parts database
CREATE TABLE IF NOT EXISTS verified_parts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    part_number VARCHAR(100) NOT NULL,
    part_name VARCHAR(300),
    manufacturer_id VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    specifications JSONB DEFAULT '{}',
    availability_status VARCHAR(50) DEFAULT 'unknown',
    CONSTRAINT fk_verified_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturer_profiles(manufacturer_id)
);

-- Fault codes for equipment diagnosis
CREATE TABLE IF NOT EXISTS fault_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fault_code VARCHAR(50) NOT NULL,
    equipment_type VARCHAR(100),
    manufacturer_id VARCHAR(50),
    description TEXT,
    troubleshooting_steps TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    CONSTRAINT fk_fault_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturer_profiles(manufacturer_id)
);

-- Episodic memory for AI conversations
CREATE TABLE IF NOT EXISTS episodic_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    conversation_context TEXT,
    key_insights TEXT,
    equipment_discussed TEXT[],
    resolution_provided BOOLEAN DEFAULT FALSE,
    session_id TEXT
);

-- Conversation history with search analytics
CREATE TABLE IF NOT EXISTS conversation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    response_text TEXT,
    search_strategy VARCHAR(50),
    detected_equipment TEXT[],
    detected_parts TEXT[],
    confidence_score DECIMAL(5,4),
    processing_time_ms INTEGER,
    sources JSONB DEFAULT '[]',
    session_id TEXT
);

-- Vector search indexes using IVFFLAT for performance
CREATE INDEX IF NOT EXISTS idx_documents_search_vector
ON documents_search USING ivfflat (search_vector vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_faq_knowledge_vector
ON faq_knowledge USING ivfflat (vector_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_yacht_emails_vector
ON yacht_emails USING ivfflat (email_embedding vector_cosine_ops)
WITH (lists = 100);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_documents_search_doc_type ON documents_search(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_search_manufacturer ON documents_search(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_faq_knowledge_category ON faq_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_yacht_emails_type ON yacht_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_verified_parts_number ON verified_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_verified_parts_manufacturer ON verified_parts(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_fault_codes_equipment ON fault_codes(equipment_type);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user ON conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_strategy ON conversation_history(search_strategy);

-- Enable RLS on all vector tables
ALTER TABLE documents_search ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodic_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access to knowledge bases
CREATE POLICY "Public read access" ON documents_search FOR SELECT USING (true);
CREATE POLICY "Public read access" ON faq_knowledge FOR SELECT USING (true);
CREATE POLICY "Public read access" ON yacht_emails FOR SELECT USING (true);
CREATE POLICY "Public read access" ON verified_parts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON fault_codes FOR SELECT USING (true);

-- User-specific policies for personal data
CREATE POLICY "Users can access own conversations" ON conversation_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access own memories" ON episodic_memory
FOR SELECT USING (auth.uid() = user_id);

-- Service role policies for data management
CREATE POLICY "Service role can manage all data" ON documents_search
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON faq_knowledge
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON yacht_emails
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON verified_parts
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON fault_codes
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON conversation_history
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON episodic_memory
FOR ALL USING (current_setting('role') = 'service_role');