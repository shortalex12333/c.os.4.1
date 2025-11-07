-- Missing Yacht-Specific Tables
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
JOIN yacht_equipment ye ON yp.id = ye.yacht_id;