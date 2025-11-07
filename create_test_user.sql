-- CelesteOS Portal - Create Test User
-- Run this in Supabase SQL Editor

-- Step 1: Create user in Supabase Auth (do this via Supabase Dashboard UI)
-- Email: test@celeste7.ai
-- Password: TestPassword123!
-- Copy the user UUID after creation

-- Step 2: Create yacht in fleet_registry
INSERT INTO fleet_registry (yacht_id, yacht_id_hash, yacht_name, buyer_email, active)
VALUES (
  'TEST_2025_001',
  'test_hash_123456789',
  'M/Y Test Yacht',
  'test@celeste7.ai',
  true
)
ON CONFLICT (yacht_id) DO UPDATE
SET active = true, buyer_email = 'test@celeste7.ai';

-- Step 3: Link user to yacht (REPLACE 'USER_UUID_HERE' with actual UUID from Step 1)
INSERT INTO user_accounts (id, email, yacht_id, display_name, status)
VALUES (
  'USER_UUID_HERE',  -- ← REPLACE THIS with UUID from Supabase Auth
  'test@celeste7.ai',
  'TEST_2025_001',
  'Test Captain',
  'active'
)
ON CONFLICT (id) DO UPDATE
SET yacht_id = 'TEST_2025_001', status = 'active';

-- Step 4: Verify setup
SELECT
  ua.id as user_id,
  ua.email,
  ua.yacht_id,
  ua.status as user_status,
  fr.yacht_name,
  fr.active as yacht_active
FROM user_accounts ua
JOIN fleet_registry fr ON ua.yacht_id = fr.yacht_id
WHERE ua.email = 'test@celeste7.ai';
