-- Remove redundant and unnecessary indexes from empty tables
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
-- Keeping: 14 primary keys + 2 unique constraints + 1 useful index = 17 total