-- Analytics and Intelligence Tables for Marine/Yacht Management Platform
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
FOR ALL USING (current_setting('role') = 'service_role');