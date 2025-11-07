
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
