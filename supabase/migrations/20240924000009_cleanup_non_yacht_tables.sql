-- Drop all tables that don't end in _yacht (except fault_codes, user_email_tokens, user_microsoft_tokens)
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
-- 4. user_microsoft_tokens