-- Critical Yacht Management Tables
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
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();