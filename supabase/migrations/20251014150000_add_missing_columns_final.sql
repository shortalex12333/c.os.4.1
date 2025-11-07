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
