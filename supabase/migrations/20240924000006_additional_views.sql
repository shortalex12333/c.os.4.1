-- Additional Views for Comprehensive Marine/Yacht Analytics
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
WHERE created_at > NOW() - INTERVAL '30 days';