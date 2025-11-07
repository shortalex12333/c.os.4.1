-- Create the schedule_calls table for storing call scheduling requests
CREATE TABLE IF NOT EXISTS schedule_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) DEFAULT '',
    email VARCHAR(255) NOT NULL,
    yacht_length INTEGER,
    time VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    chat_queries_count INTEGER DEFAULT 0,
    faq_queries_count INTEGER DEFAULT 0,
    topics JSONB DEFAULT '[]'::jsonb,
    
    -- Additional useful fields for analytics
    phone VARCHAR(50),
    yacht_size VARCHAR(100),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timezone VARCHAR(100),
    session_id TEXT,
    source VARCHAR(100) DEFAULT 'schedule-call-modal',
    
    -- Indexes for common queries
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedule_calls_email ON schedule_calls(email);
CREATE INDEX IF NOT EXISTS idx_schedule_calls_created_at ON schedule_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_calls_date ON schedule_calls(date);
CREATE INDEX IF NOT EXISTS idx_schedule_calls_user_id ON schedule_calls(user_id);

-- Create a GIN index for JSONB topics column for efficient searching
CREATE INDEX IF NOT EXISTS idx_schedule_calls_topics_gin ON schedule_calls USING GIN (topics);

-- Enable Row Level Security
ALTER TABLE schedule_calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow service accounts and admins to read/write all data
CREATE POLICY "Service accounts can manage schedule_calls" ON schedule_calls
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- Allow authenticated users to read only their own records
CREATE POLICY "Users can view own schedule_calls" ON schedule_calls
    FOR SELECT USING (
        auth.uid() = user_id OR
        current_setting('role') = 'service_role'
    );

-- Grant necessary permissions
GRANT ALL ON schedule_calls TO service_role;
GRANT SELECT ON schedule_calls TO authenticated;

-- Create a CORRECTED view for analytics
CREATE OR REPLACE VIEW schedule_calls_analytics AS
WITH monthly_aggregates AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_requests,
        AVG(chat_queries_count) as avg_chat_queries,
        AVG(faq_queries_count) as avg_faq_queries,
        COUNT(DISTINCT email) as unique_users,
        ARRAY_AGG(DISTINCT yacht_size) FILTER (WHERE yacht_size IS NOT NULL) as yacht_sizes
    FROM schedule_calls
    GROUP BY DATE_TRUNC('month', created_at)
),
monthly_topics AS (
    SELECT 
        DATE_TRUNC('month', sc.created_at) as month,
        ARRAY_AGG(DISTINCT topic->>'question' ORDER BY topic->>'question') as top_topics
    FROM schedule_calls sc
    CROSS JOIN LATERAL jsonb_array_elements(sc.topics) AS topic
    GROUP BY DATE_TRUNC('month', sc.created_at)
)
SELECT 
    ma.month,
    ma.total_requests,
    ma.avg_chat_queries,
    ma.avg_faq_queries,
    ma.unique_users,
    ma.yacht_sizes,
    COALESCE(mt.top_topics[1:10], ARRAY[]::text[]) as top_topics
FROM monthly_aggregates ma
LEFT JOIN monthly_topics mt ON ma.month = mt.month
ORDER BY ma.month DESC;

-- Grant access to the analytics view
GRANT SELECT ON schedule_calls_analytics TO authenticated;
GRANT ALL ON schedule_calls_analytics TO service_role;

-- Create a function to extract engagement insights
CREATE OR REPLACE FUNCTION get_user_engagement_insights(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'avg_chat_queries', AVG(chat_queries_count),
        'avg_faq_queries', AVG(faq_queries_count),
        'total_topics', SUM(jsonb_array_length(topics)),
        'unique_topics', (
            SELECT COUNT(DISTINCT topic->>'question')
            FROM schedule_calls sc
            CROSS JOIN jsonb_array_elements(sc.topics) AS topic
            WHERE sc.email = user_email
        ),
        'preferred_times', ARRAY_AGG(DISTINCT time),
        'yacht_sizes', ARRAY_AGG(DISTINCT yacht_size) FILTER (WHERE yacht_size IS NOT NULL),
        'last_request', MAX(created_at)
    ) INTO result
    FROM schedule_calls 
    WHERE email = user_email;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_engagement_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_engagement_insights TO service_role;

-- Additional helpful views and functions

-- View to see recent schedule requests
CREATE OR REPLACE VIEW recent_schedule_requests AS
SELECT 
    id,
    created_at,
    firstName || ' ' || lastName as full_name,
    email,
    phone,
    yacht_size,
    date,
    time,
    timezone,
    chat_queries_count,
    faq_queries_count,
    jsonb_array_length(topics) as topics_count
FROM schedule_calls
ORDER BY created_at DESC
LIMIT 100;

GRANT SELECT ON recent_schedule_requests TO authenticated;
GRANT ALL ON recent_schedule_requests TO service_role;

-- View for today's schedules
CREATE OR REPLACE VIEW todays_schedules AS
SELECT 
    id,
    firstName || ' ' || lastName as full_name,
    email,
    phone,
    time,
    yacht_size,
    chat_queries_count + faq_queries_count as total_interactions
FROM schedule_calls
WHERE date = CURRENT_DATE
ORDER BY time;

GRANT SELECT ON todays_schedules TO authenticated;
GRANT ALL ON todays_schedules TO service_role;

-- Function to get top discussed topics
CREATE OR REPLACE FUNCTION get_top_topics(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(topic TEXT, frequency BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        topic->>'question' as topic,
        COUNT(*) as frequency
    FROM schedule_calls
    CROSS JOIN jsonb_array_elements(topics) AS topic
    WHERE topic->>'question' IS NOT NULL
    GROUP BY topic->>'question'
    ORDER BY COUNT(*) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_top_topics TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_topics TO service_role;

-- Function to get engagement metrics for a date range
CREATE OR REPLACE FUNCTION get_engagement_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start', start_date,
            'end', end_date
        ),
        'total_requests', COUNT(*),
        'unique_users', COUNT(DISTINCT email),
        'avg_chat_queries', ROUND(AVG(chat_queries_count)::numeric, 2),
        'avg_faq_queries', ROUND(AVG(faq_queries_count)::numeric, 2),
        'total_interactions', SUM(chat_queries_count + faq_queries_count),
        'most_common_time', (
            SELECT time 
            FROM schedule_calls 
            WHERE date BETWEEN start_date AND end_date
            GROUP BY time 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'yacht_size_distribution', (
            SELECT jsonb_object_agg(yacht_size, count)
            FROM (
                SELECT yacht_size, COUNT(*) as count
                FROM schedule_calls
                WHERE date BETWEEN start_date AND end_date
                AND yacht_size IS NOT NULL
                GROUP BY yacht_size
            ) yacht_stats
        ),
        'daily_average', ROUND(
            COUNT(*)::numeric / NULLIF((end_date - start_date + 1), 0), 
            2
        )
    ) INTO result
    FROM schedule_calls
    WHERE date BETWEEN start_date AND end_date;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_engagement_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_metrics TO service_role;

-- Sample test queries (commented out for safety)
/*
-- Test insert
INSERT INTO schedule_calls (
    firstName, lastName, email, yacht_length, time, date, 
    chat_queries_count, faq_queries_count, topics,
    phone, yacht_size, timezone, source
) VALUES (
    'John', 'Doe', 'john.doe@example.com', 85, '2:30 PM', '2024-02-15',
    5, 3, '[{"question": "How does CelesteOS work?", "timestamp": "2024-01-15T10:30:00Z"}]'::jsonb,
    '+1-555-123-4567', '80-120 ft', 'America/New_York', 'schedule-call-modal'
);

-- Test select
SELECT * FROM schedule_calls WHERE email = 'john.doe@example.com';

-- Test analytics view
SELECT * FROM schedule_calls_analytics;

-- Test recent requests view
SELECT * FROM recent_schedule_requests;

-- Test today's schedules
SELECT * FROM todays_schedules;

-- Test engagement insights function
SELECT get_user_engagement_insights('john.doe@example.com');

-- Test top topics function
SELECT * FROM get_top_topics(10);

-- Test engagement metrics function
SELECT get_engagement_metrics('2024-01-01'::date, '2024-01-31'::date);
*/
-- MANUFACTURER INTELLIGENCE SYSTEM - SUPABASE SCHEMA
-- This creates a comprehensive manufacturer documentation system

-- Main manufacturer profiles table
CREATE TABLE IF NOT EXISTS manufacturer_profiles (
    manufacturer_id VARCHAR(50) PRIMARY KEY,
    manufacturer_name VARCHAR(200) NOT NULL,
    full_name VARCHAR(500),
    headquarters VARCHAR(200),
    marine_division VARCHAR(200),
    website VARCHAR(500),
    support_portal VARCHAR(500),
    emergency_hotline VARCHAR(50),
    service_network TEXT,
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Manufacturer documents table with URLs
CREATE TABLE IF NOT EXISTS manufacturer_documents (
    document_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    document_type VARCHAR(100), -- 'catalog', 'manual', 'bulletin', 'warranty', etc.
    document_name VARCHAR(500),
    document_url VARCHAR(1000),
    document_language VARCHAR(10) DEFAULT 'en',
    file_type VARCHAR(20), -- 'pdf', 'web', 'api', etc.
    file_size_mb DECIMAL(10,2),
    version VARCHAR(50),
    release_date DATE,
    is_public BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Manufacturer API endpoints
CREATE TABLE IF NOT EXISTS manufacturer_apis (
    api_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    api_name VARCHAR(200),
    api_endpoint VARCHAR(500),
    api_version VARCHAR(20),
    auth_required BOOLEAN DEFAULT FALSE,
    auth_type VARCHAR(50), -- 'bearer', 'api_key', 'oauth2', etc.
    rate_limit VARCHAR(50),
    documentation_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Part-to-manufacturer linkage with document references
CREATE TABLE IF NOT EXISTS part_documentation (
    link_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    part_number VARCHAR(100),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    document_id UUID REFERENCES manufacturer_documents(document_id),
    page_reference VARCHAR(50), -- Specific page or section in document
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    auto_generated BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Service bulletins and technical alerts
CREATE TABLE IF NOT EXISTS service_bulletins (
    bulletin_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    bulletin_number VARCHAR(100),
    title VARCHAR(500),
    description TEXT,
    severity VARCHAR(20), -- 'critical', 'important', 'informational'
    affected_parts JSONB DEFAULT '[]', -- Array of part numbers
    document_url VARCHAR(1000),
    issue_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Manufacturer contact information
CREATE TABLE IF NOT EXISTS manufacturer_contacts (
    contact_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    contact_type VARCHAR(50), -- 'technical', 'sales', 'emergency', 'parts'
    region VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(200),
    hours_of_operation VARCHAR(200),
    languages JSONB DEFAULT '["English"]',
    is_24_7 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_manufacturer_name ON manufacturer_profiles(manufacturer_name);
CREATE INDEX idx_document_type ON manufacturer_documents(document_type);
CREATE INDEX idx_document_manufacturer ON manufacturer_documents(manufacturer_id);
CREATE INDEX idx_part_documentation ON part_documentation(part_number);
CREATE INDEX idx_bulletin_severity ON service_bulletins(severity);
CREATE INDEX idx_bulletin_date ON service_bulletins(issue_date DESC);

-- Create views for easy access
CREATE VIEW manufacturer_document_summary AS
SELECT 
    mp.manufacturer_name,
    COUNT(DISTINCT md.document_id) as total_documents,
    COUNT(DISTINCT CASE WHEN md.document_type = 'catalog' THEN md.document_id END) as catalogs,
    COUNT(DISTINCT CASE WHEN md.document_type = 'manual' THEN md.document_id END) as manuals,
    COUNT(DISTINCT CASE WHEN md.document_type = 'bulletin' THEN md.document_id END) as bulletins,
    MAX(md.created_at) as last_document_added
FROM manufacturer_profiles mp
LEFT JOIN manufacturer_documents md ON mp.manufacturer_id = md.manufacturer_id
GROUP BY mp.manufacturer_name;

-- Function to get relevant documents for a part
CREATE OR REPLACE FUNCTION get_part_documents(p_part_number VARCHAR)
RETURNS TABLE (
    manufacturer_name VARCHAR,
    document_type VARCHAR,
    document_name VARCHAR,
    document_url VARCHAR,
    page_reference VARCHAR,
    relevance_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.manufacturer_name,
        md.document_type,
        md.document_name,
        md.document_url,
        pd.page_reference,
        pd.relevance_score
    FROM part_documentation pd
    JOIN manufacturer_profiles mp ON pd.manufacturer_id = mp.manufacturer_id
    JOIN manufacturer_documents md ON pd.document_id = md.document_id
    WHERE pd.part_number = p_part_number
    ORDER BY pd.relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (if using Supabase Auth)
ALTER TABLE manufacturer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_apis ENABLE ROW LEVEL SECURITY;

-- Public read access for manufacturer data
CREATE POLICY "Public read access" ON manufacturer_profiles
    FOR SELECT USING (true);

CREATE POLICY "Public read access" ON manufacturer_documents
    FOR SELECT USING (is_public = true);
-- Supabase Schema for Microsoft Email Integration
-- Run this in your Supabase SQL editor

-- Create user_email_tokens table
CREATE TABLE user_email_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    email_address TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type TEXT DEFAULT 'Bearer' NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['Mail.Read', 'User.Read'] NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_email_tokens_user_id ON user_email_tokens(user_id);
CREATE INDEX idx_user_email_tokens_expires_at ON user_email_tokens(expires_at);
CREATE INDEX idx_user_email_tokens_email ON user_email_tokens(email_address);

-- Create RLS policies for security
ALTER TABLE user_email_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can access their own email tokens" ON user_email_tokens
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- Policy: Service role can access all tokens (for backend operations)
CREATE POLICY "Service role can access all email tokens" ON user_email_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_email_tokens_updated_at
    BEFORE UPDATE ON user_email_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for webhook data (without sensitive tokens)
CREATE VIEW user_email_status AS
SELECT 
    user_id,
    email_address,
    CASE 
        WHEN expires_at > NOW() THEN true 
        ELSE false 
    END as email_connected,
    expires_at,
    display_name,
    created_at,
    updated_at
FROM user_email_tokens;

-- Grant permissions to authenticated users
GRANT SELECT ON user_email_status TO authenticated;
GRANT ALL ON user_email_tokens TO service_role;-- Enable pgvector extension for AI embeddings
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
FOR ALL USING (current_setting('role') = 'service_role');-- Missing Yacht-Specific Tables
-- Based on patterns like "query_history_yacht" and other "_yacht" tables

-- Query history specifically for yacht-related searches
CREATE TABLE IF NOT EXISTS query_history_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    yacht_type VARCHAR(100),
    yacht_size VARCHAR(50),
    yacht_length INTEGER,
    yacht_manufacturer VARCHAR(100),
    search_context VARCHAR(100), -- 'maintenance', 'parts', 'troubleshooting'
    results_found INTEGER DEFAULT 0,
    query_success BOOLEAN DEFAULT FALSE,
    response_time_ms INTEGER,
    session_id TEXT,
    equipment_context TEXT[],
    part_numbers_found TEXT[],
    confidence_score DECIMAL(5,4)
);

-- Yacht specifications and profiles database
CREATE TABLE IF NOT EXISTS yacht_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    yacht_name VARCHAR(300),
    yacht_model VARCHAR(200),
    yacht_manufacturer VARCHAR(150),
    yacht_year INTEGER,
    yacht_length_ft INTEGER,
    yacht_beam_ft DECIMAL(5,2),
    yacht_type VARCHAR(100), -- 'motor', 'sailing', 'catamaran', 'super'
    hull_material VARCHAR(50),
    engine_details JSONB DEFAULT '{}',
    equipment_list JSONB DEFAULT '[]',
    owner_id UUID REFERENCES auth.users(id),
    registration_number VARCHAR(100),
    home_port VARCHAR(200),
    insurance_details JSONB DEFAULT '{}',
    service_history JSONB DEFAULT '[]'
);

-- Yacht maintenance records
CREATE TABLE IF NOT EXISTS yacht_maintenance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    yacht_id UUID REFERENCES yacht_profiles(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100), -- 'routine', 'repair', 'inspection', 'upgrade'
    description TEXT,
    parts_used JSONB DEFAULT '[]',
    cost_usd DECIMAL(10,2),
    service_provider VARCHAR(200),
    next_service_date DATE,
    maintenance_category VARCHAR(100), -- 'engine', 'electrical', 'plumbing', 'hull'
    technician_notes TEXT,
    photos_urls TEXT[],
    warranty_period_months INTEGER
);

-- Yacht equipment inventory
CREATE TABLE IF NOT EXISTS yacht_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    yacht_id UUID REFERENCES yacht_profiles(id),
    equipment_name VARCHAR(300) NOT NULL,
    equipment_type VARCHAR(100), -- 'navigation', 'engine', 'electrical', 'safety'
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    model_number VARCHAR(150),
    serial_number VARCHAR(150),
    installation_date DATE,
    warranty_expiry DATE,
    last_service_date DATE,
    service_interval_hours INTEGER,
    operating_hours DECIMAL(10,2) DEFAULT 0,
    condition_status VARCHAR(50) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor', 'needs_service'
    specifications JSONB DEFAULT '{}',
    manual_url VARCHAR(500),
    notes TEXT
);

-- Yacht service history with detailed tracking
CREATE TABLE IF NOT EXISTS yacht_service_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    yacht_id UUID REFERENCES yacht_profiles(id),
    equipment_id UUID REFERENCES yacht_equipment(id),
    service_date DATE NOT NULL,
    service_type VARCHAR(100), -- 'preventive', 'corrective', 'emergency', 'upgrade'
    service_provider VARCHAR(200),
    technician_name VARCHAR(150),
    problem_description TEXT,
    work_performed TEXT,
    parts_replaced JSONB DEFAULT '[]',
    labor_hours DECIMAL(5,2),
    parts_cost_usd DECIMAL(10,2),
    labor_cost_usd DECIMAL(10,2),
    total_cost_usd DECIMAL(10,2),
    warranty_details TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    photos_urls TEXT[],
    documents_urls TEXT[]
);

-- Yacht parts inventory and compatibility
CREATE TABLE IF NOT EXISTS yacht_parts_compatibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    part_number VARCHAR(100) NOT NULL,
    part_name VARCHAR(300),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    compatible_yacht_models TEXT[],
    compatible_engines TEXT[],
    equipment_type VARCHAR(100),
    category VARCHAR(100), -- 'engine', 'electrical', 'plumbing', 'navigation', 'safety'
    subcategory VARCHAR(100),
    oem_equivalent_parts TEXT[],
    aftermarket_alternatives TEXT[],
    price_range_usd VARCHAR(50),
    availability_status VARCHAR(50) DEFAULT 'unknown',
    supplier_info JSONB DEFAULT '{}',
    technical_specs JSONB DEFAULT '{}',
    installation_notes TEXT,
    compatibility_notes TEXT
);

-- Yacht analytics and usage patterns
CREATE TABLE IF NOT EXISTS yacht_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    yacht_id UUID REFERENCES yacht_profiles(id),
    analytics_date DATE NOT NULL,
    engine_hours DECIMAL(10,2),
    distance_traveled_nm DECIMAL(10,2), -- nautical miles
    fuel_consumption_gallons DECIMAL(10,2),
    average_speed_knots DECIMAL(5,2),
    max_speed_knots DECIMAL(5,2),
    weather_conditions VARCHAR(100),
    sea_state VARCHAR(50),
    route_taken TEXT,
    ports_visited TEXT[],
    crew_count INTEGER,
    guest_count INTEGER,
    maintenance_alerts JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    gps_track JSONB DEFAULT '{}' -- could store GPS coordinates
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_query_history_yacht_user ON query_history_yacht(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_yacht_date ON query_history_yacht(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_history_yacht_type ON query_history_yacht(yacht_type);
CREATE INDEX IF NOT EXISTS idx_query_history_yacht_context ON query_history_yacht(search_context);

CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner ON yacht_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_manufacturer ON yacht_profiles(yacht_manufacturer);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_type ON yacht_profiles(yacht_type);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_length ON yacht_profiles(yacht_length_ft);

CREATE INDEX IF NOT EXISTS idx_yacht_maintenance_yacht ON yacht_maintenance(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_maintenance_date ON yacht_maintenance(maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_yacht_maintenance_type ON yacht_maintenance(maintenance_type);

CREATE INDEX IF NOT EXISTS idx_yacht_equipment_yacht ON yacht_equipment(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_equipment_type ON yacht_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_yacht_equipment_manufacturer ON yacht_equipment(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_yacht_equipment_condition ON yacht_equipment(condition_status);

CREATE INDEX IF NOT EXISTS idx_yacht_service_yacht ON yacht_service_history(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_service_equipment ON yacht_service_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_yacht_service_date ON yacht_service_history(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_yacht_service_provider ON yacht_service_history(service_provider);

CREATE INDEX IF NOT EXISTS idx_yacht_parts_part_number ON yacht_parts_compatibility(part_number);
CREATE INDEX IF NOT EXISTS idx_yacht_parts_manufacturer ON yacht_parts_compatibility(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_yacht_parts_category ON yacht_parts_compatibility(category);
CREATE INDEX IF NOT EXISTS idx_yacht_parts_equipment_type ON yacht_parts_compatibility(equipment_type);

CREATE INDEX IF NOT EXISTS idx_yacht_analytics_yacht ON yacht_analytics(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_analytics_date ON yacht_analytics(analytics_date DESC);

-- JSONB GIN indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_engine_gin ON yacht_profiles USING GIN (engine_details);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_equipment_gin ON yacht_profiles USING GIN (equipment_list);
CREATE INDEX IF NOT EXISTS idx_yacht_maintenance_parts_gin ON yacht_maintenance USING GIN (parts_used);
CREATE INDEX IF NOT EXISTS idx_yacht_equipment_specs_gin ON yacht_equipment USING GIN (specifications);
CREATE INDEX IF NOT EXISTS idx_yacht_service_parts_gin ON yacht_service_history USING GIN (parts_replaced);
CREATE INDEX IF NOT EXISTS idx_yacht_parts_specs_gin ON yacht_parts_compatibility USING GIN (technical_specs);
CREATE INDEX IF NOT EXISTS idx_yacht_analytics_metrics_gin ON yacht_analytics USING GIN (performance_metrics);

-- Enable RLS on all yacht tables
ALTER TABLE query_history_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_parts_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yacht tables

-- Query history policies
CREATE POLICY "Users can access own yacht query history" ON query_history_yacht
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all yacht queries" ON query_history_yacht
FOR ALL USING (current_setting('role') = 'service_role');

-- Yacht profiles policies
CREATE POLICY "Users can access own yacht profiles" ON yacht_profiles
FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Public read access to yacht profiles" ON yacht_profiles
FOR SELECT USING (true); -- Allow browsing yacht profiles publicly

CREATE POLICY "Service role can manage yacht profiles" ON yacht_profiles
FOR ALL USING (current_setting('role') = 'service_role');

-- Yacht maintenance policies
CREATE POLICY "Yacht owners can access maintenance records" ON yacht_maintenance
FOR ALL USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage yacht maintenance" ON yacht_maintenance
FOR ALL USING (current_setting('role') = 'service_role');

-- Yacht equipment policies
CREATE POLICY "Yacht owners can access equipment records" ON yacht_equipment
FOR ALL USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage yacht equipment" ON yacht_equipment
FOR ALL USING (current_setting('role') = 'service_role');

-- Yacht service history policies
CREATE POLICY "Yacht owners can access service history" ON yacht_service_history
FOR ALL USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage yacht service history" ON yacht_service_history
FOR ALL USING (current_setting('role') = 'service_role');

-- Parts compatibility - public read access for research
CREATE POLICY "Public read access to yacht parts compatibility" ON yacht_parts_compatibility
FOR SELECT USING (true);

CREATE POLICY "Service role can manage yacht parts compatibility" ON yacht_parts_compatibility
FOR ALL USING (current_setting('role') = 'service_role');

-- Yacht analytics policies
CREATE POLICY "Yacht owners can access analytics" ON yacht_analytics
FOR ALL USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage yacht analytics" ON yacht_analytics
FOR ALL USING (current_setting('role') = 'service_role');

-- Create some useful views for yacht management
CREATE VIEW yacht_maintenance_summary AS
SELECT
    yp.yacht_name,
    yp.yacht_manufacturer,
    yp.yacht_model,
    COUNT(ym.id) as total_maintenance_records,
    MAX(ym.maintenance_date) as last_maintenance,
    SUM(ym.cost_usd) as total_maintenance_cost,
    AVG(ym.cost_usd) as average_maintenance_cost,
    COUNT(CASE WHEN ym.maintenance_type = 'repair' THEN 1 END) as repair_count,
    COUNT(CASE WHEN ym.maintenance_type = 'routine' THEN 1 END) as routine_count
FROM yacht_profiles yp
LEFT JOIN yacht_maintenance ym ON yp.id = ym.yacht_id
GROUP BY yp.id, yp.yacht_name, yp.yacht_manufacturer, yp.yacht_model;

CREATE VIEW yacht_equipment_health AS
SELECT
    yp.yacht_name,
    ye.equipment_name,
    ye.equipment_type,
    ye.condition_status,
    ye.last_service_date,
    CASE
        WHEN ye.service_interval_hours IS NOT NULL AND ye.operating_hours IS NOT NULL
        THEN (ye.service_interval_hours - (ye.operating_hours % ye.service_interval_hours))
        ELSE NULL
    END as hours_until_next_service,
    ye.warranty_expiry,
    CASE
        WHEN ye.warranty_expiry > NOW() THEN true
        ELSE false
    END as warranty_active
FROM yacht_profiles yp
JOIN yacht_equipment ye ON yp.id = ye.yacht_id;-- Additional Views for Comprehensive Marine/Yacht Analytics
-- These create read-only virtual tables with the "eye" icon in Supabase Studio

-- Comprehensive parts inventory with manufacturer details
CREATE VIEW parts_inventory_view AS
SELECT
    vp.part_number,
    vp.part_name,
    vp.category,
    vp.availability_status,
    mp.manufacturer_name,
    mp.website,
    mp.support_portal,
    vp.specifications,
    COUNT(ypc.id) as yacht_compatibility_count,
    ARRAY_AGG(DISTINCT ypc.compatible_yacht_models) FILTER (WHERE ypc.compatible_yacht_models IS NOT NULL) as compatible_models
FROM verified_parts vp
LEFT JOIN manufacturer_profiles mp ON vp.manufacturer_id = mp.manufacturer_id
LEFT JOIN yacht_parts_compatibility ypc ON vp.part_number = ypc.part_number
GROUP BY vp.id, vp.part_number, vp.part_name, vp.category, vp.availability_status,
         mp.manufacturer_name, mp.website, mp.support_portal, vp.specifications;

-- Equipment status dashboard
CREATE VIEW equipment_status_dashboard AS
SELECT
    ye.equipment_type,
    ye.condition_status,
    COUNT(*) as equipment_count,
    AVG(ye.operating_hours) as avg_operating_hours,
    COUNT(CASE WHEN ye.warranty_expiry > NOW() THEN 1 END) as under_warranty_count,
    COUNT(CASE WHEN ye.last_service_date < NOW() - INTERVAL '6 months' THEN 1 END) as needs_service_count,
    mp.manufacturer_name,
    STRING_AGG(DISTINCT yp.yacht_type, ', ') as yacht_types
FROM yacht_equipment ye
LEFT JOIN yacht_profiles yp ON ye.yacht_id = yp.id
LEFT JOIN manufacturer_profiles mp ON ye.manufacturer_id = mp.manufacturer_id
GROUP BY ye.equipment_type, ye.condition_status, mp.manufacturer_name;

-- Search query analytics
CREATE VIEW search_analytics_view AS
SELECT
    DATE_TRUNC('day', created_at) as query_date,
    search_context,
    yacht_type,
    yacht_size,
    COUNT(*) as total_queries,
    COUNT(CASE WHEN query_success = true THEN 1 END) as successful_queries,
    AVG(response_time_ms) as avg_response_time,
    AVG(confidence_score) as avg_confidence,
    AVG(results_found) as avg_results_found,
    COUNT(DISTINCT user_id) as unique_users
FROM query_history_yacht
GROUP BY DATE_TRUNC('day', created_at), search_context, yacht_type, yacht_size;

-- Maintenance cost trends
CREATE VIEW maintenance_cost_trends AS
SELECT
    DATE_TRUNC('month', maintenance_date) as maintenance_month,
    maintenance_type,
    maintenance_category,
    COUNT(*) as maintenance_count,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as average_cost,
    MIN(cost_usd) as min_cost,
    MAX(cost_usd) as max_cost,
    STRING_AGG(DISTINCT service_provider, ', ') as service_providers
FROM yacht_maintenance
WHERE cost_usd IS NOT NULL
GROUP BY DATE_TRUNC('month', maintenance_date), maintenance_type, maintenance_category;

-- Service provider performance
CREATE VIEW service_provider_performance AS
SELECT
    ysh.service_provider,
    COUNT(*) as total_services,
    AVG(ysh.customer_satisfaction) as avg_satisfaction,
    AVG(ysh.total_cost_usd) as avg_cost,
    AVG(ysh.labor_hours) as avg_labor_hours,
    COUNT(CASE WHEN ysh.follow_up_required = true THEN 1 END) as follow_ups_required,
    STRING_AGG(DISTINCT ye.equipment_type, ', ') as equipment_types_serviced,
    MAX(ysh.service_date) as last_service_date
FROM yacht_service_history ysh
LEFT JOIN yacht_equipment ye ON ysh.equipment_id = ye.id
WHERE ysh.service_provider IS NOT NULL
GROUP BY ysh.service_provider;

-- Fleet analytics (for multiple yacht owners)
CREATE VIEW fleet_analytics_view AS
SELECT
    yp.owner_id,
    COUNT(yp.id) as yacht_count,
    STRING_AGG(DISTINCT yp.yacht_type, ', ') as yacht_types,
    AVG(yp.yacht_length_ft) as avg_length,
    SUM(ya.fuel_consumption_gallons) as total_fuel_consumed,
    SUM(ya.distance_traveled_nm) as total_distance,
    AVG(ya.average_speed_knots) as fleet_avg_speed,
    SUM(ym.cost_usd) as total_maintenance_cost,
    COUNT(ye.id) as total_equipment_pieces,
    COUNT(CASE WHEN ye.condition_status = 'needs_service' THEN 1 END) as equipment_needing_service
FROM yacht_profiles yp
LEFT JOIN yacht_analytics ya ON yp.id = ya.yacht_id
LEFT JOIN yacht_maintenance ym ON yp.id = ym.yacht_id
LEFT JOIN yacht_equipment ye ON yp.id = ye.yacht_id
WHERE yp.owner_id IS NOT NULL
GROUP BY yp.owner_id;

-- Document accessibility summary
CREATE VIEW document_accessibility_summary AS
SELECT
    md.document_type,
    mp.manufacturer_name,
    COUNT(*) as total_documents,
    COUNT(CASE WHEN md.is_public = true THEN 1 END) as public_documents,
    COUNT(CASE WHEN md.requires_auth = true THEN 1 END) as auth_required_documents,
    STRING_AGG(DISTINCT md.document_language, ', ') as available_languages,
    STRING_AGG(DISTINCT md.file_type, ', ') as file_types,
    AVG(md.file_size_mb) as avg_file_size_mb
FROM manufacturer_documents md
JOIN manufacturer_profiles mp ON md.manufacturer_id = mp.manufacturer_id
GROUP BY md.document_type, mp.manufacturer_name;

-- FAQ effectiveness metrics
CREATE VIEW faq_effectiveness_view AS
SELECT
    category,
    COUNT(*) as total_faqs,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence,
    COUNT(CASE WHEN confidence_score > 0.8 THEN 1 END) as high_confidence_faqs,
    COUNT(CASE WHEN confidence_score < 0.5 THEN 1 END) as low_confidence_faqs
FROM faq_knowledge
WHERE confidence_score IS NOT NULL
GROUP BY category;

-- Fault code frequency analysis
CREATE VIEW fault_code_analysis AS
SELECT
    fc.equipment_type,
    fc.fault_code,
    fc.severity,
    COUNT(*) as occurrence_count,
    mp.manufacturer_name,
    fc.description,
    LENGTH(fc.troubleshooting_steps) as troubleshooting_guide_length,
    CASE
        WHEN fc.severity = 'critical' THEN 1
        WHEN fc.severity = 'high' THEN 2
        WHEN fc.severity = 'medium' THEN 3
        WHEN fc.severity = 'low' THEN 4
        ELSE 5
    END as severity_priority
FROM fault_codes fc
LEFT JOIN manufacturer_profiles mp ON fc.manufacturer_id = mp.manufacturer_id
GROUP BY fc.equipment_type, fc.fault_code, fc.severity, mp.manufacturer_name,
         fc.description, fc.troubleshooting_steps
ORDER BY occurrence_count DESC, severity_priority ASC;

-- Email engagement metrics
CREATE VIEW email_engagement_metrics AS
SELECT
    email_type,
    COUNT(*) as total_emails,
    AVG(ARRAY_LENGTH(equipment_mentioned, 1)) as avg_equipment_mentions,
    AVG(ARRAY_LENGTH(part_numbers_mentioned, 1)) as avg_part_mentions,
    STRING_AGG(DISTINCT sender_domain, ', ') as sender_domains,
    COUNT(CASE WHEN email_embedding IS NOT NULL THEN 1 END) as indexed_emails,
    COUNT(CASE WHEN email_embedding IS NULL THEN 1 END) as unindexed_emails
FROM yacht_emails
GROUP BY email_type;

-- Conversation effectiveness tracking
CREATE VIEW conversation_effectiveness AS
SELECT
    search_strategy,
    COUNT(*) as total_conversations,
    AVG(confidence_score) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(CASE WHEN confidence_score > 0.7 THEN 1 END) as high_confidence_responses,
    COUNT(DISTINCT user_id) as unique_users,
    STRING_AGG(DISTINCT detected_equipment[1], ', ') as common_equipment_types,
    AVG(ARRAY_LENGTH(detected_parts, 1)) as avg_parts_per_query
FROM conversation_history
WHERE confidence_score IS NOT NULL
GROUP BY search_strategy;

-- User engagement patterns
CREATE VIEW user_engagement_patterns AS
SELECT
    u.id as user_id,
    COUNT(qhy.id) as yacht_queries,
    COUNT(ch.id) as total_conversations,
    COUNT(sc.id) as scheduled_calls,
    MAX(qhy.created_at) as last_yacht_query,
    MAX(ch.created_at) as last_conversation,
    MAX(sc.created_at) as last_call_request,
    STRING_AGG(DISTINCT qhy.search_context, ', ') as query_contexts,
    COUNT(yp.id) as owned_yachts
FROM auth.users u
LEFT JOIN query_history_yacht qhy ON u.id = qhy.user_id
LEFT JOIN conversation_history ch ON u.id = ch.user_id
LEFT JOIN schedule_calls sc ON u.id = sc.user_id
LEFT JOIN yacht_profiles yp ON u.id = yp.owner_id
GROUP BY u.id;

-- System health overview
CREATE VIEW system_health_overview AS
SELECT
    'Tables' as metric_type,
    'Total Records' as metric_name,
    (
        (SELECT COUNT(*) FROM schedule_calls) +
        (SELECT COUNT(*) FROM manufacturer_profiles) +
        (SELECT COUNT(*) FROM verified_parts) +
        (SELECT COUNT(*) FROM documents_search) +
        (SELECT COUNT(*) FROM yacht_profiles) +
        (SELECT COUNT(*) FROM yacht_equipment)
    ) as metric_value
UNION ALL
SELECT
    'Search Performance',
    'Avg Query Response Time (ms)',
    AVG(response_time_ms)::bigint
FROM query_history_yacht
WHERE response_time_ms IS NOT NULL
UNION ALL
SELECT
    'Data Quality',
    'Vector Indexed Documents',
    COUNT(*)
FROM documents_search
WHERE search_vector IS NOT NULL
UNION ALL
SELECT
    'User Activity',
    'Active Users (30 days)',
    COUNT(DISTINCT user_id)
FROM conversation_history
WHERE created_at > NOW() - INTERVAL '30 days';-- Analytics and Intelligence Tables for Marine/Yacht Management Platform
-- These tables support advanced analytics, AI insights, and business intelligence

-- Memory episodic cases for AI case tracking
CREATE TABLE IF NOT EXISTS memory_episodic_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    case_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    case_type VARCHAR(100), -- 'troubleshooting', 'maintenance', 'parts_inquiry'
    case_description TEXT,
    equipment_involved TEXT[],
    parts_involved TEXT[],
    resolution_status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    resolution_summary TEXT,
    ai_confidence_score DECIMAL(5,4),
    similar_cases_ids TEXT[],
    lessons_learned TEXT,
    case_priority INTEGER DEFAULT 3, -- 1=high, 5=low
    assigned_expert VARCHAR(200),
    resolution_time_hours DECIMAL(10,2),
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5)
);

-- Email effectiveness tracking for yacht communications
CREATE TABLE IF NOT EXISTS email_effectiveness_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_campaign_id VARCHAR(100),
    yacht_type VARCHAR(100),
    recipient_segment VARCHAR(100), -- 'owner', 'captain', 'technician', 'dealer'
    subject_line TEXT,
    content_type VARCHAR(50), -- 'maintenance_reminder', 'parts_alert', 'service_bulletin'
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,4),
    open_rate DECIMAL(5,4),
    click_rate DECIMAL(5,4),
    response_rate DECIMAL(5,4),
    conversion_rate DECIMAL(5,4),
    optimal_send_time TIME,
    seasonal_effectiveness JSONB DEFAULT '{}'
);

-- Sender reputation tracking for yacht communications
CREATE TABLE IF NOT EXISTS sender_reputation_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_domain VARCHAR(200),
    sender_email VARCHAR(300),
    sender_type VARCHAR(100), -- 'manufacturer', 'dealer', 'service_provider', 'parts_supplier'
    reputation_score DECIMAL(5,4), -- 0.0000 to 1.0000
    total_emails_sent INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    spam_complaints INTEGER DEFAULT 0,
    authentication_status VARCHAR(50), -- 'valid', 'suspicious', 'blacklisted'
    dkim_valid BOOLEAN DEFAULT FALSE,
    spf_valid BOOLEAN DEFAULT FALSE,
    dmarc_valid BOOLEAN DEFAULT FALSE,
    response_quality_score DECIMAL(5,4),
    technical_accuracy_score DECIMAL(5,4),
    customer_feedback_score DECIMAL(5,4),
    last_reputation_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yacht service analytics aggregated data
CREATE TABLE IF NOT EXISTS yacht_service_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_date DATE NOT NULL,
    yacht_type VARCHAR(100),
    service_category VARCHAR(100), -- 'engine', 'electrical', 'plumbing', 'navigation'
    total_service_requests INTEGER DEFAULT 0,
    average_response_time_hours DECIMAL(10,2),
    average_resolution_time_hours DECIMAL(10,2),
    first_call_resolution_rate DECIMAL(5,4),
    customer_satisfaction_avg DECIMAL(3,2),
    total_service_cost_usd DECIMAL(15,2),
    parts_cost_percentage DECIMAL(5,4),
    labor_cost_percentage DECIMAL(5,4),
    emergency_service_percentage DECIMAL(5,4),
    repeat_service_rate DECIMAL(5,4),
    seasonal_demand_pattern JSONB DEFAULT '{}',
    geographic_distribution JSONB DEFAULT '{}'
);

-- Parts efficiency tracking
CREATE TABLE IF NOT EXISTS yacht_parts_efficiency (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    part_number VARCHAR(100),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    part_category VARCHAR(100),
    installation_success_rate DECIMAL(5,4),
    average_lifespan_hours DECIMAL(15,2),
    failure_rate DECIMAL(5,4),
    warranty_claim_rate DECIMAL(5,4),
    customer_satisfaction_avg DECIMAL(3,2),
    price_performance_ratio DECIMAL(10,4),
    availability_score DECIMAL(5,4), -- how often in stock
    shipping_reliability_score DECIMAL(5,4),
    quality_consistency_score DECIMAL(5,4),
    total_installations INTEGER DEFAULT 0,
    total_failures INTEGER DEFAULT 0,
    total_replacements INTEGER DEFAULT 0,
    cost_per_operating_hour DECIMAL(10,4)
);

-- Manufacturer response time tracking
CREATE TABLE IF NOT EXISTS manufacturer_response_time (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    inquiry_type VARCHAR(100), -- 'technical_support', 'parts_inquiry', 'warranty_claim'
    inquiry_urgency VARCHAR(50), -- 'emergency', 'urgent', 'normal', 'low'
    first_response_time_minutes INTEGER,
    resolution_time_hours DECIMAL(10,2),
    response_quality_score DECIMAL(5,4), -- 1-5 rating
    inquiry_channel VARCHAR(50), -- 'phone', 'email', 'portal', 'chat'
    business_hours BOOLEAN DEFAULT TRUE,
    escalation_required BOOLEAN DEFAULT FALSE,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    seasonal_factor DECIMAL(3,2), -- adjustment for busy seasons
    response_completeness_score DECIMAL(5,4)
);

-- Parts availability trends
CREATE TABLE IF NOT EXISTS parts_availability_trends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trend_date DATE NOT NULL,
    part_number VARCHAR(100),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    part_category VARCHAR(100),
    availability_status VARCHAR(50), -- 'in_stock', 'low_stock', 'backorder', 'discontinued'
    stock_level INTEGER,
    lead_time_days INTEGER,
    price_usd DECIMAL(12,2),
    demand_forecast INTEGER,
    seasonal_availability_pattern JSONB DEFAULT '{}',
    supply_chain_reliability_score DECIMAL(5,4),
    alternative_parts_available INTEGER DEFAULT 0,
    market_demand_score DECIMAL(5,4),
    inventory_turnover_rate DECIMAL(5,4)
);

-- Service cost analysis
CREATE TABLE IF NOT EXISTS service_cost_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_date DATE NOT NULL,
    yacht_type VARCHAR(100),
    yacht_size_category VARCHAR(50), -- 'small', 'medium', 'large', 'super'
    service_type VARCHAR(100),
    average_cost_usd DECIMAL(12,2),
    median_cost_usd DECIMAL(12,2),
    cost_variance DECIMAL(12,2),
    labor_cost_avg DECIMAL(12,2),
    parts_cost_avg DECIMAL(12,2),
    overhead_cost_avg DECIMAL(12,2),
    geographic_cost_factor DECIMAL(5,4), -- regional pricing differences
    seasonal_cost_factor DECIMAL(5,4),
    cost_per_foot DECIMAL(8,2), -- cost relative to yacht length
    market_rate_comparison DECIMAL(5,4), -- vs market average
    cost_efficiency_score DECIMAL(5,4)
);

-- Equipment failure patterns
CREATE TABLE IF NOT EXISTS equipment_failure_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    equipment_type VARCHAR(100),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    failure_mode VARCHAR(200), -- specific type of failure
    failure_frequency INTEGER DEFAULT 0, -- occurrences per time period
    average_mtbf_hours DECIMAL(15,2), -- Mean Time Between Failures
    seasonal_pattern JSONB DEFAULT '{}',
    operating_conditions_impact JSONB DEFAULT '{}', -- saltwater, temperature, etc.
    maintenance_correlation JSONB DEFAULT '{}', -- correlation with maintenance schedule
    age_correlation DECIMAL(5,4), -- correlation with equipment age
    usage_correlation DECIMAL(5,4), -- correlation with usage intensity
    environmental_factors TEXT[],
    preventive_measures TEXT[],
    early_warning_indicators TEXT[],
    repair_complexity_score INTEGER DEFAULT 3, -- 1=simple, 5=complex
    average_repair_cost DECIMAL(12,2)
);

-- Customer satisfaction metrics
CREATE TABLE IF NOT EXISTS customer_satisfaction_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    survey_date DATE NOT NULL,
    customer_id UUID,
    yacht_id UUID REFERENCES yacht_profiles(id),
    service_category VARCHAR(100),
    service_provider VARCHAR(200),
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    technical_expertise_rating INTEGER CHECK (technical_expertise_rating >= 1 AND technical_expertise_rating <= 5),
    response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
    would_recommend BOOLEAN,
    feedback_text TEXT,
    improvement_suggestions TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    survey_channel VARCHAR(50), -- 'email', 'phone', 'web', 'app'
    response_completeness_score DECIMAL(5,4)
);

-- Search optimization data
CREATE TABLE IF NOT EXISTS search_optimization_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_query TEXT NOT NULL,
    search_context VARCHAR(100), -- 'parts', 'troubleshooting', 'maintenance'
    query_category VARCHAR(100),
    search_results_count INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4),
    average_result_relevance DECIMAL(5,4),
    user_satisfaction_score DECIMAL(5,4),
    search_refinements_count INTEGER DEFAULT 0,
    zero_results_rate DECIMAL(5,4),
    query_performance_ms INTEGER,
    popular_refinements TEXT[],
    successful_query_patterns TEXT[],
    failed_query_patterns TEXT[],
    semantic_understanding_score DECIMAL(5,4),
    auto_complete_usage_rate DECIMAL(5,4)
);

-- Conversation insights from AI interactions
CREATE TABLE IF NOT EXISTS conversation_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversation_id VARCHAR(100),
    user_id UUID REFERENCES auth.users(id),
    conversation_type VARCHAR(100), -- 'troubleshooting', 'parts_inquiry', 'general_help'
    total_messages INTEGER DEFAULT 0,
    conversation_duration_minutes INTEGER,
    resolution_achieved BOOLEAN DEFAULT FALSE,
    satisfaction_score DECIMAL(5,4),
    complexity_score DECIMAL(5,4), -- how complex the issue was
    ai_confidence_avg DECIMAL(5,4),
    human_handoff_required BOOLEAN DEFAULT FALSE,
    knowledge_gaps_identified TEXT[],
    successful_recommendations TEXT[],
    conversation_topics TEXT[],
    sentiment_progression JSONB DEFAULT '{}', -- sentiment over time
    follow_up_actions TEXT[],
    learning_opportunities TEXT[]
);

-- Predictive maintenance alerts
CREATE TABLE IF NOT EXISTS predictive_maintenance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alert_id VARCHAR(100) UNIQUE,
    yacht_id UUID REFERENCES yacht_profiles(id),
    equipment_id UUID REFERENCES yacht_equipment(id),
    alert_type VARCHAR(100), -- 'overdue_service', 'usage_threshold', 'performance_degradation'
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    predicted_failure_date DATE,
    confidence_level DECIMAL(5,4),
    maintenance_recommendation TEXT,
    estimated_cost_usd DECIMAL(12,2),
    potential_downtime_hours INTEGER,
    risk_assessment TEXT,
    data_sources TEXT[], -- what data triggered this alert
    alert_status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'scheduled', 'completed'
    acknowledged_by VARCHAR(200),
    scheduled_date DATE,
    actual_service_date DATE,
    prediction_accuracy DECIMAL(5,4) -- filled after service
);

-- Supply chain intelligence
CREATE TABLE IF NOT EXISTS supply_chain_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    intelligence_date DATE NOT NULL,
    supplier_name VARCHAR(200),
    supplier_type VARCHAR(100), -- 'manufacturer', 'distributor', 'retailer'
    product_category VARCHAR(100),
    supply_reliability_score DECIMAL(5,4),
    pricing_competitiveness DECIMAL(5,4),
    quality_consistency_score DECIMAL(5,4),
    shipping_performance_score DECIMAL(5,4),
    inventory_levels_score DECIMAL(5,4),
    market_share_percentage DECIMAL(5,4),
    geographic_coverage TEXT[],
    certifications TEXT[],
    risk_factors TEXT[],
    competitive_advantages TEXT[],
    partnership_opportunities TEXT[],
    market_trends_impact JSONB DEFAULT '{}',
    seasonal_performance_patterns JSONB DEFAULT '{}'
);

-- Warranty claim tracking
CREATE TABLE IF NOT EXISTS warranty_claim_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_id VARCHAR(100) UNIQUE,
    yacht_id UUID REFERENCES yacht_profiles(id),
    part_number VARCHAR(100),
    manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    claim_date DATE NOT NULL,
    failure_date DATE,
    purchase_date DATE,
    warranty_expiry_date DATE,
    claim_status VARCHAR(50), -- 'submitted', 'under_review', 'approved', 'denied', 'completed'
    claim_amount_usd DECIMAL(12,2),
    approved_amount_usd DECIMAL(12,2),
    failure_description TEXT,
    root_cause_analysis TEXT,
    manufacturer_response TEXT,
    resolution_time_days INTEGER,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    claim_category VARCHAR(100), -- 'manufacturing_defect', 'premature_failure', 'installation_issue'
    documentation_urls TEXT[],
    follow_up_required BOOLEAN DEFAULT FALSE
);

-- Technical documentation usage analytics
CREATE TABLE IF NOT EXISTS technical_documentation_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    document_id UUID REFERENCES manufacturer_documents(document_id),
    user_id UUID REFERENCES auth.users(id),
    access_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_duration_minutes INTEGER,
    page_views INTEGER DEFAULT 1,
    download_count INTEGER DEFAULT 0,
    bookmark_added BOOLEAN DEFAULT FALSE,
    usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    search_query_leading TEXT,
    user_type VARCHAR(50), -- 'owner', 'technician', 'dealer', 'manufacturer'
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    geographic_region VARCHAR(100),
    language_preference VARCHAR(10),
    content_completion_rate DECIMAL(5,4), -- how much was viewed
    subsequent_actions TEXT[] -- what user did after viewing
);

-- Service provider rankings
CREATE TABLE IF NOT EXISTS service_provider_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ranking_date DATE NOT NULL,
    service_provider VARCHAR(200),
    geographic_region VARCHAR(100),
    service_categories TEXT[],
    overall_rating DECIMAL(3,2),
    technical_expertise_score DECIMAL(3,2),
    customer_service_score DECIMAL(3,2),
    pricing_competitiveness DECIMAL(3,2),
    response_time_score DECIMAL(3,2),
    quality_consistency_score DECIMAL(3,2),
    total_jobs_completed INTEGER DEFAULT 0,
    repeat_customer_rate DECIMAL(5,4),
    warranty_claim_rate DECIMAL(5,4),
    average_job_value_usd DECIMAL(12,2),
    certifications TEXT[],
    specializations TEXT[],
    years_in_business INTEGER,
    fleet_size INTEGER, -- number of service vehicles/boats
    market_reputation_score DECIMAL(5,4)
);

-- Parts cross reference system
CREATE TABLE IF NOT EXISTS parts_cross_reference (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    primary_part_number VARCHAR(100),
    alternative_part_number VARCHAR(100),
    primary_manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    alternative_manufacturer_id VARCHAR(50) REFERENCES manufacturer_profiles(manufacturer_id),
    compatibility_type VARCHAR(50), -- 'direct_replacement', 'compatible', 'upgrade', 'downgrade'
    compatibility_confidence DECIMAL(5,4),
    price_difference_percentage DECIMAL(6,2),
    quality_comparison VARCHAR(50), -- 'equivalent', 'better', 'lower'
    installation_notes TEXT,
    performance_impact TEXT,
    warranty_implications TEXT,
    verified_by VARCHAR(200),
    verification_date DATE,
    usage_count INTEGER DEFAULT 0, -- how often this cross-reference is used
    success_rate DECIMAL(5,4), -- success rate of substitutions
    customer_feedback_avg DECIMAL(3,2)
);

-- Maintenance schedule optimization
CREATE TABLE IF NOT EXISTS maintenance_schedule_optimization (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    yacht_id UUID REFERENCES yacht_profiles(id),
    optimization_date DATE NOT NULL,
    current_schedule JSONB DEFAULT '{}',
    optimized_schedule JSONB DEFAULT '{}',
    cost_savings_projected DECIMAL(12,2),
    downtime_reduction_hours INTEGER,
    efficiency_improvement_percentage DECIMAL(5,4),
    optimization_factors JSONB DEFAULT '{}', -- usage patterns, seasonal factors, etc.
    implementation_status VARCHAR(50) DEFAULT 'recommended', -- 'recommended', 'approved', 'implemented'
    actual_cost_savings DECIMAL(12,2),
    actual_efficiency_gain DECIMAL(5,4),
    optimization_accuracy DECIMAL(5,4), -- how accurate the predictions were
    user_acceptance_rate DECIMAL(5,4),
    feedback_incorporated TEXT[]
);

-- Equipment lifecycle tracking
CREATE TABLE IF NOT EXISTS equipment_lifecycle_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    equipment_id UUID REFERENCES yacht_equipment(id),
    lifecycle_stage VARCHAR(50), -- 'new', 'breaking_in', 'optimal', 'aging', 'end_of_life'
    stage_start_date DATE,
    estimated_remaining_life_months INTEGER,
    performance_degradation_rate DECIMAL(5,4),
    maintenance_cost_trend DECIMAL(5,4), -- increasing/decreasing
    failure_risk_score DECIMAL(5,4),
    replacement_urgency VARCHAR(50), -- 'immediate', 'urgent', 'planned', 'future'
    total_operating_hours DECIMAL(15,2),
    cycles_completed INTEGER,
    environmental_stress_score DECIMAL(5,4),
    usage_intensity_score DECIMAL(5,4),
    maintenance_quality_score DECIMAL(5,4),
    upgrade_opportunities TEXT[],
    disposal_considerations TEXT[]
);

-- Cost benefit analysis
CREATE TABLE IF NOT EXISTS cost_benefit_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(100), -- 'upgrade', 'replacement', 'service_plan', 'preventive_maintenance'
    yacht_id UUID REFERENCES yacht_profiles(id),
    equipment_id UUID REFERENCES yacht_equipment(id),
    current_cost_annual DECIMAL(15,2),
    proposed_cost_initial DECIMAL(15,2),
    proposed_cost_annual DECIMAL(15,2),
    projected_savings_annual DECIMAL(15,2),
    payback_period_months INTEGER,
    roi_percentage DECIMAL(6,2),
    net_present_value DECIMAL(15,2),
    risk_factors TEXT[],
    qualitative_benefits TEXT[],
    implementation_complexity_score INTEGER DEFAULT 3, -- 1=simple, 5=complex
    recommendation VARCHAR(50), -- 'strongly_recommend', 'recommend', 'neutral', 'not_recommend'
    decision_status VARCHAR(50), -- 'pending', 'approved', 'rejected', 'deferred'
    actual_results_tracking JSONB DEFAULT '{}'
);

-- Performance benchmarking
CREATE TABLE IF NOT EXISTS performance_benchmarking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    benchmark_date DATE NOT NULL,
    yacht_id UUID REFERENCES yacht_profiles(id),
    benchmark_category VARCHAR(100), -- 'fuel_efficiency', 'maintenance_cost', 'reliability'
    metric_name VARCHAR(200),
    actual_value DECIMAL(15,4),
    peer_group_average DECIMAL(15,4),
    industry_average DECIMAL(15,4),
    best_in_class_value DECIMAL(15,4),
    percentile_ranking INTEGER, -- 1-100
    performance_trend VARCHAR(50), -- 'improving', 'stable', 'declining'
    benchmark_source VARCHAR(200),
    comparison_basis TEXT, -- how the benchmark was calculated
    improvement_opportunities TEXT[],
    target_value DECIMAL(15,4),
    action_plan TEXT[],
    measurement_confidence DECIMAL(5,4)
);

-- Quality assurance metrics
CREATE TABLE IF NOT EXISTS quality_assurance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessment_date DATE NOT NULL,
    assessment_type VARCHAR(100), -- 'service_quality', 'parts_quality', 'documentation_quality'
    subject_id VARCHAR(100), -- could be service provider, part number, etc.
    subject_type VARCHAR(100), -- 'service_provider', 'manufacturer', 'part', 'process'
    quality_score DECIMAL(5,4), -- 0.0000 to 1.0000
    defect_rate DECIMAL(5,4),
    compliance_score DECIMAL(5,4),
    customer_complaints INTEGER DEFAULT 0,
    corrective_actions_required INTEGER DEFAULT 0,
    continuous_improvement_score DECIMAL(5,4),
    certification_status VARCHAR(50),
    audit_findings TEXT[],
    quality_trends JSONB DEFAULT '{}',
    best_practices TEXT[],
    areas_for_improvement TEXT[],
    quality_costs_impact DECIMAL(12,2),
    stakeholder_confidence DECIMAL(5,4)
);

-- Training effectiveness metrics
CREATE TABLE IF NOT EXISTS training_effectiveness (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    training_date DATE NOT NULL,
    training_program VARCHAR(200),
    training_category VARCHAR(100), -- 'technical', 'safety', 'customer_service', 'product_knowledge'
    participant_id VARCHAR(100),
    participant_role VARCHAR(100), -- 'technician', 'service_advisor', 'parts_specialist'
    pre_training_score DECIMAL(5,2),
    post_training_score DECIMAL(5,2),
    improvement_percentage DECIMAL(6,2),
    skill_retention_30_days DECIMAL(5,2),
    skill_retention_90_days DECIMAL(5,2),
    practical_application_score DECIMAL(5,2),
    training_satisfaction INTEGER CHECK (training_satisfaction >= 1 AND training_satisfaction <= 5),
    training_relevance INTEGER CHECK (training_relevance >= 1 AND training_relevance <= 5),
    behavioral_change_observed BOOLEAN DEFAULT FALSE,
    performance_impact_measured BOOLEAN DEFAULT FALSE,
    certification_achieved BOOLEAN DEFAULT FALSE,
    follow_up_training_needed BOOLEAN DEFAULT FALSE,
    trainer_effectiveness_score DECIMAL(5,4)
);

-- Create comprehensive indexes for all new tables
CREATE INDEX IF NOT EXISTS idx_memory_episodic_cases_user ON memory_episodic_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_episodic_cases_status ON memory_episodic_cases(resolution_status);
CREATE INDEX IF NOT EXISTS idx_memory_episodic_cases_type ON memory_episodic_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_memory_episodic_cases_priority ON memory_episodic_cases(case_priority);

CREATE INDEX IF NOT EXISTS idx_email_effectiveness_yacht_type ON email_effectiveness_yacht(yacht_type);
CREATE INDEX IF NOT EXISTS idx_email_effectiveness_segment ON email_effectiveness_yacht(recipient_segment);
CREATE INDEX IF NOT EXISTS idx_email_effectiveness_content ON email_effectiveness_yacht(content_type);

CREATE INDEX IF NOT EXISTS idx_sender_reputation_domain ON sender_reputation_yacht(sender_domain);
CREATE INDEX IF NOT EXISTS idx_sender_reputation_type ON sender_reputation_yacht(sender_type);
CREATE INDEX IF NOT EXISTS idx_sender_reputation_score ON sender_reputation_yacht(reputation_score DESC);

CREATE INDEX IF NOT EXISTS idx_yacht_service_analytics_date ON yacht_service_analytics(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_yacht_service_analytics_type ON yacht_service_analytics(yacht_type);
CREATE INDEX IF NOT EXISTS idx_yacht_service_analytics_category ON yacht_service_analytics(service_category);

CREATE INDEX IF NOT EXISTS idx_yacht_parts_efficiency_part ON yacht_parts_efficiency(part_number);
CREATE INDEX IF NOT EXISTS idx_yacht_parts_efficiency_manufacturer ON yacht_parts_efficiency(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_yacht_parts_efficiency_category ON yacht_parts_efficiency(part_category);

CREATE INDEX IF NOT EXISTS idx_manufacturer_response_manufacturer ON manufacturer_response_time(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_response_type ON manufacturer_response_time(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_manufacturer_response_urgency ON manufacturer_response_time(inquiry_urgency);

CREATE INDEX IF NOT EXISTS idx_parts_availability_trends_date ON parts_availability_trends(trend_date DESC);
CREATE INDEX IF NOT EXISTS idx_parts_availability_trends_part ON parts_availability_trends(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_availability_trends_status ON parts_availability_trends(availability_status);

CREATE INDEX IF NOT EXISTS idx_service_cost_analysis_date ON service_cost_analysis(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_cost_analysis_yacht_type ON service_cost_analysis(yacht_type);
CREATE INDEX IF NOT EXISTS idx_service_cost_analysis_size ON service_cost_analysis(yacht_size_category);

CREATE INDEX IF NOT EXISTS idx_equipment_failure_patterns_type ON equipment_failure_patterns(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_failure_patterns_manufacturer ON equipment_failure_patterns(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_failure_patterns_mode ON equipment_failure_patterns(failure_mode);

CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_date ON customer_satisfaction_metrics(survey_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_yacht ON customer_satisfaction_metrics(yacht_id);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_category ON customer_satisfaction_metrics(service_category);

CREATE INDEX IF NOT EXISTS idx_search_optimization_query ON search_optimization_data(search_query);
CREATE INDEX IF NOT EXISTS idx_search_optimization_context ON search_optimization_data(search_context);
CREATE INDEX IF NOT EXISTS idx_search_optimization_category ON search_optimization_data(query_category);

CREATE INDEX IF NOT EXISTS idx_conversation_insights_user ON conversation_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_insights_type ON conversation_insights(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversation_insights_satisfaction ON conversation_insights(satisfaction_score DESC);

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_yacht ON predictive_maintenance_alerts(yacht_id);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_equipment ON predictive_maintenance_alerts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_severity ON predictive_maintenance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_status ON predictive_maintenance_alerts(alert_status);

CREATE INDEX IF NOT EXISTS idx_supply_chain_intelligence_date ON supply_chain_intelligence(intelligence_date DESC);
CREATE INDEX IF NOT EXISTS idx_supply_chain_intelligence_supplier ON supply_chain_intelligence(supplier_name);
CREATE INDEX IF NOT EXISTS idx_supply_chain_intelligence_type ON supply_chain_intelligence(supplier_type);

CREATE INDEX IF NOT EXISTS idx_warranty_claim_tracking_claim ON warranty_claim_tracking(claim_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claim_tracking_yacht ON warranty_claim_tracking(yacht_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claim_tracking_manufacturer ON warranty_claim_tracking(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claim_tracking_status ON warranty_claim_tracking(claim_status);

CREATE INDEX IF NOT EXISTS idx_technical_documentation_usage_doc ON technical_documentation_usage(document_id);
CREATE INDEX IF NOT EXISTS idx_technical_documentation_usage_user ON technical_documentation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_technical_documentation_usage_date ON technical_documentation_usage(access_date DESC);

CREATE INDEX IF NOT EXISTS idx_service_provider_rankings_provider ON service_provider_rankings(service_provider);
CREATE INDEX IF NOT EXISTS idx_service_provider_rankings_region ON service_provider_rankings(geographic_region);
CREATE INDEX IF NOT EXISTS idx_service_provider_rankings_rating ON service_provider_rankings(overall_rating DESC);

CREATE INDEX IF NOT EXISTS idx_parts_cross_reference_primary ON parts_cross_reference(primary_part_number);
CREATE INDEX IF NOT EXISTS idx_parts_cross_reference_alternative ON parts_cross_reference(alternative_part_number);
CREATE INDEX IF NOT EXISTS idx_parts_cross_reference_type ON parts_cross_reference(compatibility_type);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_optimization_yacht ON maintenance_schedule_optimization(yacht_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_optimization_date ON maintenance_schedule_optimization(optimization_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_optimization_status ON maintenance_schedule_optimization(implementation_status);

CREATE INDEX IF NOT EXISTS idx_equipment_lifecycle_tracking_equipment ON equipment_lifecycle_tracking(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_lifecycle_tracking_stage ON equipment_lifecycle_tracking(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_equipment_lifecycle_tracking_urgency ON equipment_lifecycle_tracking(replacement_urgency);

CREATE INDEX IF NOT EXISTS idx_cost_benefit_analysis_yacht ON cost_benefit_analysis(yacht_id);
CREATE INDEX IF NOT EXISTS idx_cost_benefit_analysis_equipment ON cost_benefit_analysis(equipment_id);
CREATE INDEX IF NOT EXISTS idx_cost_benefit_analysis_type ON cost_benefit_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_cost_benefit_analysis_decision ON cost_benefit_analysis(decision_status);

CREATE INDEX IF NOT EXISTS idx_performance_benchmarking_yacht ON performance_benchmarking(yacht_id);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarking_category ON performance_benchmarking(benchmark_category);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarking_date ON performance_benchmarking(benchmark_date DESC);

CREATE INDEX IF NOT EXISTS idx_quality_assurance_metrics_date ON quality_assurance_metrics(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_quality_assurance_metrics_type ON quality_assurance_metrics(assessment_type);
CREATE INDEX IF NOT EXISTS idx_quality_assurance_metrics_subject ON quality_assurance_metrics(subject_id);

CREATE INDEX IF NOT EXISTS idx_training_effectiveness_program ON training_effectiveness(training_program);
CREATE INDEX IF NOT EXISTS idx_training_effectiveness_category ON training_effectiveness(training_category);
CREATE INDEX IF NOT EXISTS idx_training_effectiveness_date ON training_effectiveness(training_date DESC);

-- Enable RLS on all new tables
ALTER TABLE memory_episodic_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_effectiveness_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE sender_reputation_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_parts_efficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_response_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_availability_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_cost_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_failure_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_satisfaction_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_optimization_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_maintenance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claim_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_documentation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_cross_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedule_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_lifecycle_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_benefit_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarking ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assurance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_effectiveness ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics tables (mostly read-only with service role management)

-- Public read access for analytics and benchmarking data
CREATE POLICY "Public read access" ON yacht_service_analytics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON yacht_parts_efficiency FOR SELECT USING (true);
CREATE POLICY "Public read access" ON manufacturer_response_time FOR SELECT USING (true);
CREATE POLICY "Public read access" ON parts_availability_trends FOR SELECT USING (true);
CREATE POLICY "Public read access" ON service_cost_analysis FOR SELECT USING (true);
CREATE POLICY "Public read access" ON equipment_failure_patterns FOR SELECT USING (true);
CREATE POLICY "Public read access" ON search_optimization_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON supply_chain_intelligence FOR SELECT USING (true);
CREATE POLICY "Public read access" ON service_provider_rankings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON parts_cross_reference FOR SELECT USING (true);
CREATE POLICY "Public read access" ON performance_benchmarking FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quality_assurance_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON training_effectiveness FOR SELECT USING (true);

-- User-specific access for personal data
CREATE POLICY "Users can access own episodic cases" ON memory_episodic_cases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access own satisfaction metrics" ON customer_satisfaction_metrics
FOR SELECT USING (customer_id::text = auth.uid()::text);

CREATE POLICY "Users can access own conversation insights" ON conversation_insights
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access own yacht maintenance alerts" ON predictive_maintenance_alerts
FOR SELECT USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can access own documentation usage" ON technical_documentation_usage
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can access own yacht warranty claims" ON warranty_claim_tracking
FOR SELECT USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can access own maintenance optimization" ON maintenance_schedule_optimization
FOR SELECT USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can access own equipment lifecycle" ON equipment_lifecycle_tracking
FOR SELECT USING (
    equipment_id IN (
        SELECT ye.id FROM yacht_equipment ye
        JOIN yacht_profiles yp ON ye.yacht_id = yp.id
        WHERE yp.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can access own cost benefit analysis" ON cost_benefit_analysis
FOR SELECT USING (
    yacht_id IN (
        SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
);

-- Service role policies for data management
CREATE POLICY "Service role can manage all data" ON memory_episodic_cases
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON email_effectiveness_yacht
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON sender_reputation_yacht
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON yacht_service_analytics
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON yacht_parts_efficiency
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON manufacturer_response_time
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON parts_availability_trends
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON service_cost_analysis
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON equipment_failure_patterns
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON customer_satisfaction_metrics
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON search_optimization_data
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON conversation_insights
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON predictive_maintenance_alerts
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON supply_chain_intelligence
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON warranty_claim_tracking
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON technical_documentation_usage
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON service_provider_rankings
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON parts_cross_reference
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON maintenance_schedule_optimization
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON equipment_lifecycle_tracking
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON cost_benefit_analysis
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON performance_benchmarking
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON quality_assurance_metrics
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all data" ON training_effectiveness
FOR ALL USING (current_setting('role') = 'service_role');-- Critical Yacht Management Tables
-- This migration creates the essential yacht-specific tables

-- ============================================
-- 1. USER MICROSOFT TOKENS (CRITICAL FOR EMAIL AUTH)
-- ============================================
CREATE TABLE IF NOT EXISTS user_microsoft_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    microsoft_user_id TEXT,
    original_email TEXT,
    microsoft_email TEXT,
    display_name TEXT,
    microsoft_access_token TEXT NOT NULL,
    microsoft_refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    scopes TEXT[] DEFAULT ARRAY['Mail.Read', 'User.Read'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. DOCUMENT_YACHT - Main yacht documents table
-- ============================================
CREATE TABLE IF NOT EXISTS document_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_name TEXT NOT NULL,
    document_path TEXT NOT NULL,
    document_type TEXT,
    file_hash TEXT,
    file_size_mb NUMERIC(10,2),
    last_modified TIMESTAMP WITH TIME ZONE,
    times_accessed INTEGER DEFAULT 0,
    times_helpful INTEGER DEFAULT 0,
    times_not_helpful INTEGER DEFAULT 0,
    confidence_level NUMERIC(5,4),
    equipment_covered JSONB DEFAULT '[]',
    first_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_embeddings JSONB DEFAULT '{}',
    fault_resolution_map JSONB DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    yacht_id TEXT,
    solutions_tried JSONB DEFAULT '[]',
    document_name_tokens INTEGER,
    equipment_covered_tokens INTEGER,
    fault_resolution_map_tokens INTEGER,
    solutions_tried_tokens INTEGER,
    patterns JSONB DEFAULT '{}',
    total_uses INTEGER DEFAULT 0,
    successful_uses INTEGER DEFAULT 0,
    effectiveness_score NUMERIC(5,4),
    department VARCHAR(100),
    pattern_matches JSONB DEFAULT '{}',
    equipment_specialization JSONB DEFAULT '{}',
    fault_code_matches JSONB DEFAULT '{}',
    last_pattern_update TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. DOCUMENT_EFFECTIVENESS_YACHT - Document effectiveness metrics
-- ============================================
CREATE TABLE IF NOT EXISTS document_effectiveness_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES document_yacht(id) ON DELETE CASCADE,
    yacht_id TEXT,
    query_id UUID,
    user_id UUID REFERENCES auth.users(id),
    was_helpful BOOLEAN,
    relevance_score NUMERIC(5,4),
    time_to_resolution_minutes INTEGER,
    feedback_text TEXT,
    equipment_type TEXT,
    problem_category TEXT,
    resolution_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. EMAIL_CONTACTS_YACHT - Yacht email contacts
-- ============================================
CREATE TABLE IF NOT EXISTS email_contacts_yacht (
    contact_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    yacht_id TEXT NOT NULL,
    vendor VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    specialization VARCHAR(100),
    response_time_hours INTEGER,
    reliability_score NUMERIC(5,4),
    last_contacted TIMESTAMP WITH TIME ZONE,
    times_contacted INTEGER DEFAULT 0,
    successful_resolutions INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- ============================================
-- 5. FAULT_YACHT - Main fault table for yachts
-- ============================================
CREATE TABLE IF NOT EXISTS fault_yacht (
    fault_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    yacht_id TEXT NOT NULL,
    equipment_type VARCHAR(100),
    equipment_brand VARCHAR(100),
    equipment_model VARCHAR(100),
    fault_code VARCHAR(50),
    fault_description TEXT,
    symptoms TEXT[],
    severity_level VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    detected_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_date TIMESTAMP WITH TIME ZONE,
    resolution_status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'deferred'
    resolution_id UUID,
    technician_notes TEXT,
    root_cause TEXT,
    preventive_measures TEXT,
    downtime_hours NUMERIC(10,2),
    repair_cost_usd NUMERIC(12,2),
    parts_replaced JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- ============================================
-- 6. FAULT_RESOLUTIONS_YACHT - Fault resolution tracking
-- ============================================
CREATE TABLE IF NOT EXISTS fault_resolutions_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fault_id UUID REFERENCES fault_yacht(fault_id) ON DELETE CASCADE,
    resolution_id UUID,
    yacht_id TEXT NOT NULL,
    resolution_method TEXT,
    success_rate NUMERIC(5,4),
    time_to_resolve_hours NUMERIC(10,2),
    parts_used JSONB DEFAULT '[]',
    tools_required TEXT[],
    skill_level_required VARCHAR(50), -- 'basic', 'intermediate', 'advanced', 'expert'
    verified_by VARCHAR(255),
    verification_date TIMESTAMP WITH TIME ZONE,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. RESOLUTION_YACHT - Resolution tracking
-- ============================================
CREATE TABLE IF NOT EXISTS resolution_yacht (
    resolution_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    yacht_id TEXT NOT NULL,
    resolution_title VARCHAR(500),
    resolution_description TEXT,
    resolution_steps JSONB DEFAULT '[]',
    equipment_type VARCHAR(100),
    applicable_models TEXT[],
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    average_time_minutes INTEGER,
    difficulty_level VARCHAR(50),
    required_expertise TEXT[],
    safety_warnings TEXT[],
    tools_required TEXT[],
    parts_required JSONB DEFAULT '[]',
    estimated_cost_range VARCHAR(100),
    created_by VARCHAR(255),
    approved_by VARCHAR(255),
    approval_date TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. RESOLUTIONS_YACHT - Multiple resolutions repository
-- ============================================
CREATE TABLE IF NOT EXISTS resolutions_yacht (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    yacht_id TEXT,
    query_id UUID,
    fault_id UUID REFERENCES fault_yacht(fault_id),
    resolution_type VARCHAR(100), -- 'technical', 'workaround', 'temporary', 'permanent'
    resolution_source VARCHAR(100), -- 'manual', 'ai_suggested', 'expert_provided', 'community'
    resolution_content TEXT NOT NULL,
    resolution_metadata JSONB DEFAULT '{}',
    confidence_score NUMERIC(5,4),
    implementation_time_hours NUMERIC(10,2),
    cost_estimate NUMERIC(12,2),
    effectiveness_rating NUMERIC(3,2),
    user_feedback TEXT,
    times_used INTEGER DEFAULT 0,
    times_successful INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    related_documents UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 9. USERS_YACHT - Yacht-specific user data
-- ============================================
CREATE TABLE IF NOT EXISTS users_yacht (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    yacht_id TEXT NOT NULL,
    role VARCHAR(50), -- 'owner', 'captain', 'engineer', 'crew', 'guest'
    permissions JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    expertise_areas TEXT[],
    certification_level VARCHAR(50),
    years_experience INTEGER,
    primary_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    last_active TIMESTAMP WITH TIME ZONE,
    total_queries INTEGER DEFAULT 0,
    successful_resolutions INTEGER DEFAULT 0,
    contribution_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- user_microsoft_tokens indexes
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_user_id ON user_microsoft_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_email ON user_microsoft_tokens(microsoft_email);
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_expires ON user_microsoft_tokens(token_expires_at);

-- document_yacht indexes
CREATE INDEX IF NOT EXISTS idx_document_yacht_name ON document_yacht(document_name);
CREATE INDEX IF NOT EXISTS idx_document_yacht_yacht_id ON document_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_document_yacht_department ON document_yacht(department);
CREATE INDEX IF NOT EXISTS idx_document_yacht_effectiveness ON document_yacht(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_document_yacht_equipment_gin ON document_yacht USING GIN (equipment_covered);
CREATE INDEX IF NOT EXISTS idx_document_yacht_patterns_gin ON document_yacht USING GIN (patterns);

-- document_effectiveness_yacht indexes
CREATE INDEX IF NOT EXISTS idx_doc_effectiveness_yacht_document ON document_effectiveness_yacht(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_effectiveness_yacht_yacht ON document_effectiveness_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_doc_effectiveness_yacht_helpful ON document_effectiveness_yacht(was_helpful);

-- email_contacts_yacht indexes
CREATE INDEX IF NOT EXISTS idx_email_contacts_yacht_yacht ON email_contacts_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_yacht_email ON email_contacts_yacht(email);
CREATE INDEX IF NOT EXISTS idx_email_contacts_yacht_vendor ON email_contacts_yacht(vendor);
CREATE INDEX IF NOT EXISTS idx_email_contacts_yacht_reliability ON email_contacts_yacht(reliability_score DESC);

-- fault_yacht indexes
CREATE INDEX IF NOT EXISTS idx_fault_yacht_yacht ON fault_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_fault_yacht_status ON fault_yacht(resolution_status);
CREATE INDEX IF NOT EXISTS idx_fault_yacht_severity ON fault_yacht(severity_level);
CREATE INDEX IF NOT EXISTS idx_fault_yacht_equipment ON fault_yacht(equipment_type);
CREATE INDEX IF NOT EXISTS idx_fault_yacht_code ON fault_yacht(fault_code);
CREATE INDEX IF NOT EXISTS idx_fault_yacht_detected ON fault_yacht(detected_date DESC);

-- fault_resolutions_yacht indexes
CREATE INDEX IF NOT EXISTS idx_fault_resolutions_yacht_fault ON fault_resolutions_yacht(fault_id);
CREATE INDEX IF NOT EXISTS idx_fault_resolutions_yacht_yacht ON fault_resolutions_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_fault_resolutions_yacht_success ON fault_resolutions_yacht(success_rate DESC);

-- resolution_yacht indexes
CREATE INDEX IF NOT EXISTS idx_resolution_yacht_yacht ON resolution_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_resolution_yacht_equipment ON resolution_yacht(equipment_type);
CREATE INDEX IF NOT EXISTS idx_resolution_yacht_verified ON resolution_yacht(is_verified);
CREATE INDEX IF NOT EXISTS idx_resolution_yacht_success ON resolution_yacht(success_count DESC);

-- resolutions_yacht indexes
CREATE INDEX IF NOT EXISTS idx_resolutions_yacht_yacht ON resolutions_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_yacht_fault ON resolutions_yacht(fault_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_yacht_type ON resolutions_yacht(resolution_type);
CREATE INDEX IF NOT EXISTS idx_resolutions_yacht_confidence ON resolutions_yacht(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_resolutions_yacht_effectiveness ON resolutions_yacht(effectiveness_rating DESC);

-- users_yacht indexes
CREATE INDEX IF NOT EXISTS idx_users_yacht_yacht ON users_yacht(yacht_id);
CREATE INDEX IF NOT EXISTS idx_users_yacht_role ON users_yacht(role);
CREATE INDEX IF NOT EXISTS idx_users_yacht_active ON users_yacht(last_active DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_microsoft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_effectiveness_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_resolutions_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions_yacht ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_yacht ENABLE ROW LEVEL SECURITY;

-- user_microsoft_tokens policies
CREATE POLICY "Users can access own microsoft tokens" ON user_microsoft_tokens
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage microsoft tokens" ON user_microsoft_tokens
    FOR ALL USING (current_setting('role') = 'service_role');

-- document_yacht policies
CREATE POLICY "Users can access yacht documents" ON document_yacht
    FOR SELECT USING (
        auth.uid() = user_id OR
        yacht_id IN (SELECT yacht_id FROM users_yacht WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own documents" ON document_yacht
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all documents" ON document_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- document_effectiveness_yacht policies
CREATE POLICY "Users can view document effectiveness" ON document_effectiveness_yacht
    FOR SELECT USING (
        auth.uid() = user_id OR
        yacht_id IN (SELECT yacht_id FROM users_yacht WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can add effectiveness feedback" ON document_effectiveness_yacht
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage effectiveness" ON document_effectiveness_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- email_contacts_yacht policies
CREATE POLICY "Users can access yacht contacts" ON email_contacts_yacht
    FOR SELECT USING (
        auth.uid() = user_id OR
        yacht_id IN (SELECT yacht_id FROM users_yacht WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own contacts" ON email_contacts_yacht
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all contacts" ON email_contacts_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- fault_yacht policies
CREATE POLICY "Users can view yacht faults" ON fault_yacht
    FOR SELECT USING (
        auth.uid() = user_id OR
        yacht_id IN (SELECT yacht_id FROM users_yacht WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can report faults" ON fault_yacht
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own faults" ON fault_yacht
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all faults" ON fault_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- fault_resolutions_yacht policies
CREATE POLICY "Public read access to fault resolutions" ON fault_resolutions_yacht
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage fault resolutions" ON fault_resolutions_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- resolution_yacht policies
CREATE POLICY "Public read access to resolutions" ON resolution_yacht
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage resolutions" ON resolution_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- resolutions_yacht policies
CREATE POLICY "Public read access to resolutions repository" ON resolutions_yacht
    FOR SELECT USING (true);

CREATE POLICY "Users can add resolutions" ON resolutions_yacht
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Service role can manage all resolutions" ON resolutions_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- users_yacht policies
CREATE POLICY "Users can view own yacht profile" ON users_yacht
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own yacht profile" ON users_yacht
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all user profiles" ON users_yacht
    FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_user_microsoft_tokens_updated_at
    BEFORE UPDATE ON user_microsoft_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_yacht_updated_at
    BEFORE UPDATE ON document_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_effectiveness_yacht_updated_at
    BEFORE UPDATE ON document_effectiveness_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_contacts_yacht_updated_at
    BEFORE UPDATE ON email_contacts_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fault_yacht_updated_at
    BEFORE UPDATE ON fault_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fault_resolutions_yacht_updated_at
    BEFORE UPDATE ON fault_resolutions_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resolution_yacht_updated_at
    BEFORE UPDATE ON resolution_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resolutions_yacht_updated_at
    BEFORE UPDATE ON resolutions_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_yacht_updated_at
    BEFORE UPDATE ON users_yacht
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();-- Drop all tables that don't end in _yacht (except fault_codes, user_email_tokens, user_microsoft_tokens)
-- This migration removes 60 tables to keep only yacht-specific tables and critical auth tables

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS faq_effectiveness_view CASCADE;
DROP VIEW IF EXISTS fleet_analytics_view CASCADE;
DROP VIEW IF EXISTS system_health_overview CASCADE;
DROP VIEW IF EXISTS parts_inventory_view CASCADE;
DROP VIEW IF EXISTS manufacturer_document_summary CASCADE;
DROP VIEW IF EXISTS service_provider_performance CASCADE;
DROP VIEW IF EXISTS search_analytics_view CASCADE;
DROP VIEW IF EXISTS document_accessibility_summary CASCADE;
DROP VIEW IF EXISTS equipment_status_dashboard CASCADE;
DROP VIEW IF EXISTS yacht_maintenance_summary CASCADE;
DROP VIEW IF EXISTS maintenance_cost_trends CASCADE;
DROP VIEW IF EXISTS email_engagement_metrics CASCADE;
DROP VIEW IF EXISTS user_engagement_patterns CASCADE;
DROP VIEW IF EXISTS yacht_equipment_health CASCADE;

-- Drop tables (skip views that were already dropped above)
DROP TABLE IF EXISTS yacht_maintenance CASCADE;
DROP TABLE IF EXISTS manufacturer_contacts CASCADE;
DROP TABLE IF EXISTS part_documentation CASCADE;
DROP TABLE IF EXISTS memory_episodic_cases CASCADE;
DROP TABLE IF EXISTS search_optimization_data CASCADE;
DROP TABLE IF EXISTS supply_chain_intelligence CASCADE;
DROP TABLE IF EXISTS yacht_parts_compatibility CASCADE;
DROP TABLE IF EXISTS training_effectiveness CASCADE;
DROP TABLE IF EXISTS yacht_service_history CASCADE;
DROP TABLE IF EXISTS conversation_history CASCADE;
DROP TABLE IF EXISTS quality_assurance_metrics CASCADE;
DROP TABLE IF EXISTS yacht_service_analytics CASCADE;
DROP TABLE IF EXISTS faq_knowledge CASCADE;
DROP TABLE IF EXISTS equipment_lifecycle_tracking CASCADE;
DROP TABLE IF EXISTS service_cost_analysis CASCADE;
DROP TABLE IF EXISTS service_provider_rankings CASCADE;
DROP TABLE IF EXISTS predictive_maintenance_alerts CASCADE;
DROP TABLE IF EXISTS yacht_analytics CASCADE;
DROP TABLE IF EXISTS documents_search CASCADE;
DROP TABLE IF EXISTS episodic_memory CASCADE;
DROP TABLE IF EXISTS parts_cross_reference CASCADE;
DROP TABLE IF EXISTS cost_benefit_analysis CASCADE;
DROP TABLE IF EXISTS warranty_claim_tracking CASCADE;
DROP TABLE IF EXISTS manufacturer_response_time CASCADE;
DROP TABLE IF EXISTS conversation_insights CASCADE;
DROP TABLE IF EXISTS verified_parts CASCADE;
DROP TABLE IF EXISTS manufacturer_documents CASCADE;
DROP TABLE IF EXISTS performance_benchmarking CASCADE;
DROP TABLE IF EXISTS yacht_emails CASCADE;
DROP TABLE IF EXISTS schedule_calls CASCADE;
DROP TABLE IF EXISTS yacht_parts_efficiency CASCADE;
DROP TABLE IF EXISTS equipment_failure_patterns CASCADE;
DROP TABLE IF EXISTS yacht_equipment CASCADE;
DROP TABLE IF EXISTS maintenance_schedule_optimization CASCADE;
DROP TABLE IF EXISTS manufacturer_apis CASCADE;
DROP TABLE IF EXISTS manufacturer_profiles CASCADE;
DROP TABLE IF EXISTS yacht_profiles CASCADE;
DROP TABLE IF EXISTS fault_code_analysis CASCADE;
DROP TABLE IF EXISTS parts_availability_trends CASCADE;
DROP TABLE IF EXISTS technical_documentation_usage CASCADE;
DROP TABLE IF EXISTS customer_satisfaction_metrics CASCADE;
DROP TABLE IF EXISTS service_bulletins CASCADE;

-- Tables that will remain after this migration:
-- 1. All tables ending in _yacht
-- 2. fault_codes
-- 3. user_email_tokens
-- 4. user_microsoft_tokens-- Drop the user_email_status view
DROP VIEW IF EXISTS user_email_status CASCADE;-- Remove redundant and unnecessary indexes from empty tables
-- Keep only: Primary keys, unique constraints, and essential foreign keys

-- document_yacht: Remove all non-PK indexes (6 indexes)
DROP INDEX IF EXISTS idx_document_yacht_department;
DROP INDEX IF EXISTS idx_document_yacht_effectiveness;
DROP INDEX IF EXISTS idx_document_yacht_equipment_gin;
DROP INDEX IF EXISTS idx_document_yacht_name;
DROP INDEX IF EXISTS idx_document_yacht_patterns_gin;
DROP INDEX IF EXISTS idx_document_yacht_yacht_id;

-- fault_yacht: Remove all non-PK indexes (6 indexes)
DROP INDEX IF EXISTS idx_fault_yacht_code;
DROP INDEX IF EXISTS idx_fault_yacht_detected;
DROP INDEX IF EXISTS idx_fault_yacht_equipment;
DROP INDEX IF EXISTS idx_fault_yacht_severity;
DROP INDEX IF EXISTS idx_fault_yacht_status;
DROP INDEX IF EXISTS idx_fault_yacht_yacht;

-- document_effectiveness_yacht: Remove all non-PK indexes (3 indexes)
DROP INDEX IF EXISTS idx_doc_effectiveness_yacht_document;
DROP INDEX IF EXISTS idx_doc_effectiveness_yacht_helpful;
DROP INDEX IF EXISTS idx_doc_effectiveness_yacht_yacht;

-- email_contacts_yacht: Remove all non-PK indexes (4 indexes)
DROP INDEX IF EXISTS idx_email_contacts_yacht_email;
DROP INDEX IF EXISTS idx_email_contacts_yacht_reliability;
DROP INDEX IF EXISTS idx_email_contacts_yacht_vendor;
DROP INDEX IF EXISTS idx_email_contacts_yacht_yacht;

-- email_effectiveness_yacht: Remove all non-PK indexes (3 indexes)
DROP INDEX IF EXISTS idx_email_effectiveness_content;
DROP INDEX IF EXISTS idx_email_effectiveness_segment;
DROP INDEX IF EXISTS idx_email_effectiveness_yacht_type;

-- fault_resolutions_yacht: Remove all non-PK indexes (3 indexes)
DROP INDEX IF EXISTS idx_fault_resolutions_yacht_fault;
DROP INDEX IF EXISTS idx_fault_resolutions_yacht_success;
DROP INDEX IF EXISTS idx_fault_resolutions_yacht_yacht;

-- query_history_yacht: Remove all non-PK indexes (4 indexes)
DROP INDEX IF EXISTS idx_query_history_yacht_context;
DROP INDEX IF EXISTS idx_query_history_yacht_date;
DROP INDEX IF EXISTS idx_query_history_yacht_type;
DROP INDEX IF EXISTS idx_query_history_yacht_user;

-- resolution_yacht: Remove all non-PK indexes (4 indexes)
DROP INDEX IF EXISTS idx_resolution_yacht_equipment;
DROP INDEX IF EXISTS idx_resolution_yacht_success;
DROP INDEX IF EXISTS idx_resolution_yacht_verified;
DROP INDEX IF EXISTS idx_resolution_yacht_yacht;

-- resolutions_yacht: Remove all non-PK indexes (5 indexes)
DROP INDEX IF EXISTS idx_resolutions_yacht_confidence;
DROP INDEX IF EXISTS idx_resolutions_yacht_effectiveness;
DROP INDEX IF EXISTS idx_resolutions_yacht_fault;
DROP INDEX IF EXISTS idx_resolutions_yacht_type;
DROP INDEX IF EXISTS idx_resolutions_yacht_yacht;

-- sender_reputation_yacht: Remove all non-PK indexes (3 indexes)
DROP INDEX IF EXISTS idx_sender_reputation_domain;
DROP INDEX IF EXISTS idx_sender_reputation_score;
DROP INDEX IF EXISTS idx_sender_reputation_type;

-- users_yacht: Remove all non-PK indexes (3 indexes)
DROP INDEX IF EXISTS idx_users_yacht_active;
DROP INDEX IF EXISTS idx_users_yacht_role;
DROP INDEX IF EXISTS idx_users_yacht_yacht;

-- user_email_tokens: Remove duplicate index (keep unique constraint)
DROP INDEX IF EXISTS idx_user_email_tokens_user_id;
DROP INDEX IF EXISTS idx_user_email_tokens_email;
DROP INDEX IF EXISTS idx_user_email_tokens_expires_at;

-- user_microsoft_tokens: Remove duplicate index (keep unique constraint)
DROP INDEX IF EXISTS idx_user_microsoft_tokens_user_id;
DROP INDEX IF EXISTS idx_user_microsoft_tokens_email;
DROP INDEX IF EXISTS idx_user_microsoft_tokens_expires;

-- fault_codes: Keep the single equipment index (it's reasonable)

-- Summary: Removing 54 redundant indexes
-- Keeping: 14 primary keys + 2 unique constraints + 1 useful index = 17 total-- Temporarily disable RLS for testing
-- This should be reverted in production

-- Disable RLS on user_microsoft_tokens table
ALTER TABLE user_microsoft_tokens DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role for testing
GRANT SELECT, INSERT, UPDATE, DELETE ON user_microsoft_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_microsoft_tokens TO authenticated;

-- Comment explaining this is temporary
COMMENT ON TABLE user_microsoft_tokens IS 'RLS DISABLED FOR TESTING - RE-ENABLE IN PRODUCTION';-- Chat Persistence Tables for CelesteOS
-- Created: 2025-09-29
-- Purpose: Enable persistent chat history for yacht crew

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    folder TEXT DEFAULT NULL,
    yacht_id TEXT DEFAULT NULL,
    search_type TEXT CHECK (search_type IN ('yacht', 'email', 'nas')) DEFAULT 'yacht',
    session_metadata JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_index INTEGER NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    tokens_used INTEGER DEFAULT NULL,
    confidence_score FLOAT DEFAULT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_yacht_id ON chat_sessions(yacht_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder ON chat_sessions(folder);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_index ON chat_messages(session_id, message_index);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_chat_sessions_metadata_gin ON chat_sessions USING GIN (session_metadata);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sources_gin ON chat_messages USING GIN (sources);
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin ON chat_messages USING GIN (metadata);

-- Create function to update message count
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_sessions
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_sessions
        SET message_count = GREATEST(message_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain message count
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_message_count();

-- Create function to update session updated_at on message insert/update
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session timestamp updates
CREATE TRIGGER trigger_update_session_timestamp
    AFTER INSERT OR UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all chat sessions
CREATE POLICY "Service role can manage all chat sessions" ON chat_sessions
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from own sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in own sessions" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in own sessions" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Service role can manage all messages
CREATE POLICY "Service role can manage all messages" ON chat_messages
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- Create view for chat session summaries
CREATE OR REPLACE VIEW chat_session_summaries AS
SELECT
    cs.id,
    cs.user_id,
    cs.title,
    cs.created_at,
    cs.updated_at,
    cs.folder,
    cs.yacht_id,
    cs.search_type,
    cs.message_count,
    cs.is_archived,
    -- Get first user message as preview
    (SELECT content FROM chat_messages cm
     WHERE cm.session_id = cs.id AND cm.role = 'user'
     ORDER BY cm.message_index ASC
     LIMIT 1) as first_message_preview,
    -- Get last message timestamp
    (SELECT timestamp FROM chat_messages cm
     WHERE cm.session_id = cs.id
     ORDER BY cm.timestamp DESC
     LIMIT 1) as last_message_at
FROM chat_sessions cs
ORDER BY cs.updated_at DESC;

-- Grant necessary permissions
GRANT ALL ON chat_sessions TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT SELECT ON chat_session_summaries TO authenticated;

-- Comment on tables
COMMENT ON TABLE chat_sessions IS 'Stores chat session metadata for CelesteOS yacht system';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON VIEW chat_session_summaries IS 'Provides summary view of chat sessions with message previews';

-- Sample data will be created when users first log in and create chats
-- No need to insert test data here as it requires existing users-- Add email column to users_yacht for direct querying
ALTER TABLE public.users_yacht ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_yacht_email ON public.users_yacht(email);

-- Update existing records to populate email from auth.users
UPDATE public.users_yacht
SET email = au.email
FROM auth.users au
WHERE users_yacht.user_id = au.id;-- Force disable all RLS policies and RLS itself
-- Disable RLS on all tables in public schema (excluding views)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable RLS on all tables in public schema (BASE TABLE only, not views)
    FOR r IN SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.table_name);
        RAISE NOTICE 'Disabled RLS on public.%', r.table_name;
    END LOOP;
END $$;

-- Grant full permissions to anon role on all tables (excluding views)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO anon', r.table_name);
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO authenticated', r.table_name);
        RAISE NOTICE 'Granted all privileges on public.% to anon and authenticated', r.table_name;
    END LOOP;
END $$;-- Drop legacy query_history_yacht table
-- Created: 2025-10-01
-- Purpose: Remove query_history_yacht, use chat_messages going forward

-- Drop views that depend on query_history_yacht
DROP VIEW IF EXISTS yacht_query_insights CASCADE;
DROP VIEW IF EXISTS user_yacht_activity CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_query_user_date;
DROP INDEX IF EXISTS idx_query_yacht_id;
DROP INDEX IF EXISTS idx_query_history_yacht_user;
DROP INDEX IF EXISTS idx_query_history_yacht_date;
DROP INDEX IF EXISTS idx_query_history_yacht_type;
DROP INDEX IF EXISTS idx_query_history_yacht_context;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can access own yacht query history" ON query_history_yacht;
DROP POLICY IF EXISTS "Service role can access all yacht queries" ON query_history_yacht;
DROP POLICY IF EXISTS "anon_all_query_history_yacht" ON query_history_yacht;

-- Drop the table
DROP TABLE IF EXISTS query_history_yacht CASCADE;

-- Verify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Dropped query_history_yacht - using chat_messages for all chat data';
END $$;
-- Drop all views that reference query_history_yacht
-- Created: 2025-10-01
-- Purpose: Remove remaining references to deleted query_history_yacht table

-- Drop views in correct order (dependencies first)
DROP VIEW IF EXISTS search_analytics_view CASCADE;
DROP VIEW IF EXISTS user_yacht_activity CASCADE;
DROP VIEW IF EXISTS system_health_overview CASCADE;

-- Verify no remaining references
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE view_definition LIKE '%query_history_yacht%'
      AND table_schema = 'public';

    IF view_count > 0 THEN
        RAISE WARNING 'Still found % views referencing query_history_yacht', view_count;
    ELSE
        RAISE NOTICE '✅ All query_history_yacht view references removed';
    END IF;
END $$;
-- Add soft delete support for chat sessions
-- Created: 2025-10-02
-- Purpose: Allow users to "delete" chats without permanently removing them

-- Add deleted column to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Create index for filtering non-deleted sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_deleted ON chat_sessions(deleted) WHERE deleted = FALSE;

-- Drop existing view before recreating with new column
DROP VIEW IF EXISTS chat_session_summaries;

-- Recreate the chat_session_summaries view to include deleted column
CREATE VIEW chat_session_summaries AS
SELECT
    cs.id,
    cs.user_id,
    cs.title,
    cs.created_at,
    cs.updated_at,
    cs.folder,
    cs.yacht_id,
    cs.search_type,
    cs.message_count,
    cs.is_archived,
    cs.deleted,
    -- Get first user message as preview
    (SELECT content FROM chat_messages cm
     WHERE cm.session_id = cs.id AND cm.role = 'user'
     ORDER BY cm.message_index ASC
     LIMIT 1) as first_message_preview,
    -- Get last message timestamp
    (SELECT timestamp FROM chat_messages cm
     WHERE cm.session_id = cs.id
     ORDER BY cm.timestamp DESC
     LIMIT 1) as last_message_at
FROM chat_sessions cs
WHERE cs.deleted = FALSE -- Only show non-deleted chats
ORDER BY cs.updated_at DESC;

-- Comment on column
COMMENT ON COLUMN chat_sessions.deleted IS 'Soft delete flag - allows users to delete chats without permanently removing data';
-- Restore handover_yacht table with original schema
-- From: /Users/celeste7/Downloads/Supabase Snippet SQL Query (3).csv

CREATE TABLE IF NOT EXISTS public.handover_yacht (
    handover_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    yacht_id TEXT NOT NULL,
    solution_id UUID NOT NULL,
    document_name TEXT,
    document_path TEXT,
    document_page NUMERIC,
    system_affected TEXT,
    fault_code TEXT,
    symptoms JSONB,
    actions_taken JSONB,
    duration_minutes INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_handover_user_yacht ON public.handover_yacht(user_id, yacht_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handover_solution ON public.handover_yacht(solution_id);
CREATE INDEX IF NOT EXISTS idx_handover_status ON public.handover_yacht(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_handover_yacht_updated_at
    BEFORE UPDATE ON public.handover_yacht
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE public.handover_yacht TO anon;
GRANT ALL ON TABLE public.handover_yacht TO authenticated;
GRANT ALL ON TABLE public.handover_yacht TO service_role;

COMMENT ON TABLE public.handover_yacht IS 'Shift handover notes - users annotate search results for next shift';
-- Add unique constraint for UPSERT logic
-- Ensures one handover per user + solution + yacht combination

ALTER TABLE public.handover_yacht
ADD CONSTRAINT handover_yacht_user_solution_yacht_key
UNIQUE (user_id, solution_id, yacht_id);

COMMENT ON CONSTRAINT handover_yacht_user_solution_yacht_key ON public.handover_yacht
IS 'Ensures UPSERT works: one handover per user + solution + yacht';
-- Drop tables NOT in CSV schema
-- CSV tables: chat_messages, chat_session_summaries, chat_sessions, document_yacht,
--             emails_yacht, fault_yacht, handover_yacht, resolution_yacht,
--             user_microsoft_tokens, users_yacht

-- Drop tables not in CSV
DROP TABLE IF EXISTS public.document_effectiveness_yacht CASCADE;
DROP TABLE IF EXISTS public.email_effectiveness_yacht CASCADE;
DROP TABLE IF EXISTS public.fault_codes CASCADE;
DROP TABLE IF EXISTS public.fault_resolutions_yacht CASCADE;
DROP TABLE IF EXISTS public.resolutions_yacht CASCADE;
DROP TABLE IF EXISTS public.sender_reputation_yacht CASCADE;
DROP TABLE IF EXISTS public.user_email_tokens CASCADE;

-- Note: email_contacts_yacht might be emails_yacht from CSV - keeping it
-- If it needs to be renamed, we can do that separately

COMMENT ON DATABASE postgres IS 'Cleaned up - only tables from CSV schema remain';
-- Rename email_contacts_yacht to emails_yacht to match CSV schema

ALTER TABLE IF EXISTS public.email_contacts_yacht RENAME TO emails_yacht;

COMMENT ON TABLE public.emails_yacht IS 'Email contacts for yacht - renamed from email_contacts_yacht to match CSV schema';
-- Enable Row Level Security on ALL tables - DEFENSIVE VERSION
-- Date: October 14, 2025
-- Purpose: CRITICAL SECURITY FIX - Enable RLS with proper policies

-- Helper function to safely create policy
CREATE OR REPLACE FUNCTION create_policy_if_table_exists(
    table_name text,
    policy_name text,
    policy_sql text
) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
        EXECUTE policy_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all existing tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Users table
SELECT create_policy_if_table_exists(
    'users_yacht',
    'Users can read own data',
    'CREATE POLICY "Users can read own data" ON public.users_yacht FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'users_yacht',
    'Users can update own data',
    'CREATE POLICY "Users can update own data" ON public.users_yacht FOR UPDATE USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'users_yacht',
    'Service role full access users',
    'CREATE POLICY "Service role full access users" ON public.users_yacht FOR ALL TO service_role USING (true)'
);

-- Emails table
SELECT create_policy_if_table_exists(
    'emails_yacht',
    'Users can read own contacts',
    'CREATE POLICY "Users can read own contacts" ON public.emails_yacht FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'emails_yacht',
    'Users can manage own contacts',
    'CREATE POLICY "Users can manage own contacts" ON public.emails_yacht FOR ALL USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'emails_yacht',
    'Service role full access contacts',
    'CREATE POLICY "Service role full access contacts" ON public.emails_yacht FOR ALL TO service_role USING (true)'
);

-- Chat messages
SELECT create_policy_if_table_exists(
    'chat_messages',
    'Users can read own messages',
    'CREATE POLICY "Users can read own messages" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid()))'
);

SELECT create_policy_if_table_exists(
    'chat_messages',
    'Service role full access messages',
    'CREATE POLICY "Service role full access messages" ON public.chat_messages FOR ALL TO service_role USING (true)'
);

-- Chat sessions
SELECT create_policy_if_table_exists(
    'chat_sessions',
    'Users can read own sessions',
    'CREATE POLICY "Users can read own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'chat_sessions',
    'Users can manage own sessions',
    'CREATE POLICY "Users can manage own sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'chat_sessions',
    'Service role full access sessions',
    'CREATE POLICY "Service role full access sessions" ON public.chat_sessions FOR ALL TO service_role USING (true)'
);

-- Documents
SELECT create_policy_if_table_exists(
    'document_yacht',
    'Users can read own documents',
    'CREATE POLICY "Users can read own documents" ON public.document_yacht FOR SELECT USING (auth.uid() = user_id)'
);

SELECT create_policy_if_table_exists(
    'document_yacht',
    'Service role full access documents',
    'CREATE POLICY "Service role full access documents" ON public.document_yacht FOR ALL TO service_role USING (true)'
);

-- Fault codes (public read)
SELECT create_policy_if_table_exists(
    'fault_codes',
    'Anyone can read fault codes',
    'CREATE POLICY "Anyone can read fault codes" ON public.fault_codes FOR SELECT TO authenticated USING (true)'
);

SELECT create_policy_if_table_exists(
    'fault_codes',
    'Service role full access fault codes',
    'CREATE POLICY "Service role full access fault codes" ON public.fault_codes FOR ALL TO service_role USING (true)'
);

-- Service role full access for all other tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Service role full access ' || r.tablename, r.tablename);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true)', 'Service role full access ' || r.tablename, r.tablename);
    END LOOP;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS create_policy_if_table_exists;
-- Restore October 13 Schema
-- This migration brings the database from Oct 11 state to Oct 13 state
-- Date: October 14, 2025

-- ============================================
-- 1. ADD MISSING COLUMN TO chat_messages
-- ============================================
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS yacht_id TEXT;

-- ============================================
-- 2. ADD MISSING COLUMNS TO document_yacht
-- ============================================
ALTER TABLE document_yacht
ADD COLUMN IF NOT EXISTS helpful_count INTEGER,
ADD COLUMN IF NOT EXISTS chunk_id TEXT,
ADD COLUMN IF NOT EXISTS chunk_text TEXT,
ADD COLUMN IF NOT EXISTS chunk_index INTEGER,
ADD COLUMN IF NOT EXISTS page_num INTEGER,
ADD COLUMN IF NOT EXISTS entities_found JSONB,
ADD COLUMN IF NOT EXISTS entity_weights JSONB,
ADD COLUMN IF NOT EXISTS query TEXT,
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS score NUMERIC,
ADD COLUMN IF NOT EXISTS chunk_metadata JSONB,
ADD COLUMN IF NOT EXISTS is_chunk BOOLEAN;

-- ============================================
-- 3. REMOVE EXTRA COLUMNS FROM emails_yacht
-- ============================================
ALTER TABLE emails_yacht
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS response_time_hours,
DROP COLUMN IF EXISTS reliability_score,
DROP COLUMN IF EXISTS last_contacted,
DROP COLUMN IF EXISTS times_contacted,
DROP COLUMN IF EXISTS successful_resolutions;

-- ============================================
-- 4. ADD MISSING COLUMNS TO user_microsoft_tokens
-- ============================================
ALTER TABLE user_microsoft_tokens
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_secret TEXT,
ADD COLUMN IF NOT EXISTS yacht_id TEXT;

-- ============================================
-- 5. REMOVE EXTRA COLUMNS FROM users_yacht
-- ============================================
ALTER TABLE users_yacht
DROP COLUMN IF EXISTS preferences,
DROP COLUMN IF EXISTS expertise_areas,
DROP COLUMN IF EXISTS certification_level,
DROP COLUMN IF EXISTS years_experience,
DROP COLUMN IF EXISTS primary_language,
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS last_active,
DROP COLUMN IF EXISTS successful_resolutions,
DROP COLUMN IF EXISTS contribution_score;

-- ============================================
-- 6. CREATE INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for chat_messages.yacht_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_yacht_id ON chat_messages(yacht_id);

-- Index for document_yacht new columns
CREATE INDEX IF NOT EXISTS idx_document_yacht_session_id ON document_yacht(session_id);
CREATE INDEX IF NOT EXISTS idx_document_yacht_chunk_id ON document_yacht(chunk_id);
CREATE INDEX IF NOT EXISTS idx_document_yacht_is_chunk ON document_yacht(is_chunk);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_document_yacht_entities_found_gin ON document_yacht USING GIN (entities_found);
CREATE INDEX IF NOT EXISTS idx_document_yacht_entity_weights_gin ON document_yacht USING GIN (entity_weights);
CREATE INDEX IF NOT EXISTS idx_document_yacht_chunk_metadata_gin ON document_yacht USING GIN (chunk_metadata);

-- Index for user_microsoft_tokens.yacht_id
CREATE INDEX IF NOT EXISTS idx_user_microsoft_tokens_yacht_id ON user_microsoft_tokens(yacht_id);

-- ============================================
-- VERIFICATION QUERIES (commented out)
-- ============================================

/*
-- Verify chat_messages columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Verify document_yacht columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'document_yacht'
ORDER BY ordinal_position;

-- Verify emails_yacht columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emails_yacht'
ORDER BY ordinal_position;

-- Verify user_microsoft_tokens columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_microsoft_tokens'
ORDER BY ordinal_position;

-- Verify users_yacht columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users_yacht'
ORDER BY ordinal_position;
*/
-- Remove extra columns from document_yacht to match Oct 13 schema exactly
-- Date: October 14, 2025

ALTER TABLE document_yacht
DROP COLUMN IF EXISTS confidence_level,
DROP COLUMN IF EXISTS context_embeddings,
DROP COLUMN IF EXISTS document_name_tokens,
DROP COLUMN IF EXISTS equipment_covered_tokens,
DROP COLUMN IF EXISTS equipment_specialization,
DROP COLUMN IF EXISTS fault_resolution_map,
DROP COLUMN IF EXISTS fault_resolution_map_tokens,
DROP COLUMN IF EXISTS file_hash,
DROP COLUMN IF EXISTS file_size_mb,
DROP COLUMN IF EXISTS first_accessed,
DROP COLUMN IF EXISTS last_modified,
DROP COLUMN IF EXISTS last_pattern_update,
DROP COLUMN IF EXISTS pattern_matches,
DROP COLUMN IF EXISTS patterns,
DROP COLUMN IF EXISTS solutions_tried,
DROP COLUMN IF EXISTS solutions_tried_tokens;

-- Drop indexes for removed columns
DROP INDEX IF EXISTS idx_document_yacht_patterns_gin;
DROP INDEX IF EXISTS idx_document_yacht_equipment_gin;
-- Add missing columns identified in final schema comparison
-- Date: October 14, 2025

-- ============================================
-- 1. ADD conversion_rate TO document_yacht
-- ============================================
ALTER TABLE document_yacht
ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC;

COMMENT ON COLUMN document_yacht.conversion_rate IS 'Conversion rate for document effectiveness';

-- ============================================
-- 2. ADD reliability_score TO emails_yacht
-- ============================================
ALTER TABLE emails_yacht
ADD COLUMN IF NOT EXISTS reliability_score NUMERIC;

COMMENT ON COLUMN emails_yacht.reliability_score IS 'Reliability score for contact';

-- ============================================
-- 3. ADD last_contacted TO emails_yacht
-- ============================================
ALTER TABLE emails_yacht
ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN emails_yacht.last_contacted IS 'Last time this contact was reached out to';

-- ============================================
-- 4. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_emails_yacht_reliability_score ON emails_yacht(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_emails_yacht_last_contacted ON emails_yacht(last_contacted DESC);
CREATE INDEX IF NOT EXISTS idx_document_yacht_conversion_rate ON document_yacht(conversion_rate DESC);
-- Secure RLS policies for n8n backend access
-- Date: October 14, 2025
-- Compliant with SOC-2 and GDPR requirements

-- ============================================
-- OPTION 1: Allow anon read access (least privilege)
-- ============================================
-- This allows n8n to read users_yacht without service_role
-- But still protects against unauthorized modifications

DROP POLICY IF EXISTS "Allow backend read access" ON users_yacht;
CREATE POLICY "Allow backend read access"
ON users_yacht
FOR SELECT
TO anon, authenticated
USING (true);

-- Still require auth for writes
DROP POLICY IF EXISTS "Users can update own data" ON users_yacht;
CREATE POLICY "Users can update own data"
ON users_yacht
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- OPTION 2: Service role maintains full access
-- ============================================
DROP POLICY IF EXISTS "Service role full access users_yacht" ON users_yacht;
CREATE POLICY "Service role full access users_yacht"
ON users_yacht
FOR ALL
TO service_role
USING (true);

-- ============================================
-- Apply same pattern to other tables
-- ============================================

-- emails_yacht
DROP POLICY IF EXISTS "Allow backend read emails" ON emails_yacht;
CREATE POLICY "Allow backend read emails"
ON emails_yacht
FOR SELECT
TO anon, authenticated
USING (true);

-- document_yacht
DROP POLICY IF EXISTS "Allow backend read documents" ON document_yacht;
CREATE POLICY "Allow backend read documents"
ON document_yacht
FOR SELECT
TO anon, authenticated
USING (true);

-- chat_messages
DROP POLICY IF EXISTS "Allow backend read messages" ON chat_messages;
CREATE POLICY "Allow backend read messages"
ON chat_messages
FOR SELECT
TO anon, authenticated
USING (true);

-- chat_sessions
DROP POLICY IF EXISTS "Allow backend read sessions" ON chat_sessions;
CREATE POLICY "Allow backend read sessions"
ON chat_sessions
FOR SELECT
TO anon, authenticated
USING (true);

COMMENT ON POLICY "Allow backend read access" ON users_yacht IS
'Allows n8n backend to read user data without service_role. Compliant with least-privilege principle for SOC-2.';
-- Fix RLS for user_microsoft_tokens table
-- Date: October 15, 2025
-- Issue: Service role cannot insert due to missing RLS policy

-- ============================================
-- Disable RLS (simplest solution for backend-only table)
-- ============================================
-- This table is only accessed by backend services, never directly by users
ALTER TABLE user_microsoft_tokens DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service_role
GRANT ALL ON user_microsoft_tokens TO service_role;

-- Grant read/write to authenticated users (for when users manage their own tokens)
GRANT SELECT, INSERT, UPDATE, DELETE ON user_microsoft_tokens TO authenticated;

-- Grant read access to anon (for status checks)
GRANT SELECT ON user_microsoft_tokens TO anon;

COMMENT ON TABLE user_microsoft_tokens IS
'Microsoft OAuth tokens. RLS disabled as this is a backend-only table accessed via service_role.';
-- Fix handover_yacht schema to match current code requirements
-- Date: October 28, 2025
-- Purpose: Add missing columns for entity-based handover system

-- ============================================
-- 1. Make solution_id NULLABLE (not always available)
-- ============================================
ALTER TABLE handover_yacht
ALTER COLUMN solution_id DROP NOT NULL;

COMMENT ON COLUMN handover_yacht.solution_id IS 'Optional: UUID of related solution/document';

-- ============================================
-- 2. Add document_page if missing (nullable for documents without page numbers)
-- ============================================
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS document_page INTEGER;

COMMENT ON COLUMN handover_yacht.document_page IS 'Optional: Page number for NAS documents';

-- ============================================
-- 3. Add document_source (nas/email/manual)
-- ============================================
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS document_source TEXT DEFAULT 'manual';

COMMENT ON COLUMN handover_yacht.document_source IS 'Source type: nas, email, or manual';

-- ============================================
-- 4. Add entity columns (flexible key-value pairs)
-- ============================================
ALTER TABLE handover_yacht
ADD COLUMN IF NOT EXISTS entity_0 JSONB,
ADD COLUMN IF NOT EXISTS entity_1 JSONB,
ADD COLUMN IF NOT EXISTS entity_2 JSONB,
ADD COLUMN IF NOT EXISTS entity_3 JSONB,
ADD COLUMN IF NOT EXISTS entity_4 JSONB,
ADD COLUMN IF NOT EXISTS entity_5 JSONB;

-- Add comments
COMMENT ON COLUMN handover_yacht.entity_0 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_1 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_2 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_3 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_4 IS 'Flexible key-value pair: {key: string, value: string}';
COMMENT ON COLUMN handover_yacht.entity_5 IS 'Flexible key-value pair: {key: string, value: string}';

-- ============================================
-- 5. Create indexes for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_handover_yacht_document_source ON handover_yacht(document_source);
CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_0 ON handover_yacht USING gin(entity_0);
CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_1 ON handover_yacht USING gin(entity_1);

-- ============================================
-- 6. Update old columns to be nullable (backward compatibility)
-- ============================================
ALTER TABLE handover_yacht
ALTER COLUMN system_affected DROP NOT NULL,
ALTER COLUMN fault_code DROP NOT NULL;

COMMENT ON TABLE handover_yacht IS 'Shift handover notes - flexible entity-based schema supporting both old and new formats';
