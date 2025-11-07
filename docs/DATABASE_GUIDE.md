# Yacht Management Database Guide

**Last Updated:** October 14, 2025
**Database:** Local Supabase (PostgreSQL)
**URL:** http://127.0.0.1:54321

---

## Quick Reference

### Authentication Keys

```bash
# For reading data (safe for n8n workflows)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# For full access (use sparingly, backend only)
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**Use ANON_KEY for:** Reading data, n8n workflows, safe operations
**Use SERVICE_ROLE_KEY for:** Writes, deletes, admin operations

---

## Tables Overview

### 👥 **users_yacht** - User Profiles
**What it stores:** User accounts and their yacht assignments

**Columns:**
- `user_id` (uuid) - Unique user identifier
- `yacht_id` (text) - Which yacht they're assigned to
- `email` (text) - User's email address
- `role` (text) - Their role (e.g., "/02_ENGINEERING")
- `permissions` (jsonb) - What they can access
- `notification_settings` (jsonb) - Notification preferences
- `total_queries` (int) - How many searches they've done
- `created_at`, `updated_at` (timestamp)

**Use this for:**
- User authentication
- Finding which yacht a user belongs to
- Checking user permissions
- User activity tracking

**Example Query:**
```sql
SELECT * FROM users_yacht WHERE email = 'x@alex-short.com';
```

---

### 📧 **emails_yacht** - Contact Management
**What it stores:** Vendor contacts, technicians, suppliers

**Columns:**
- `contact_id` (uuid) - Unique contact ID
- `yacht_id` (text) - Which yacht this contact is for
- `user_id` (uuid) - Who added this contact
- `contact_name` (text) - Person's name
- `email` (text) - Email address
- `vendor` (text) - Company name
- `specialization` (text) - What they specialize in (e.g., "engines")
- `reliability_score` (numeric) - 0-1 score of reliability
- `last_contacted` (timestamp) - When they were last reached out to
- `notes` (text) - Free-form notes
- `created_at`, `updated_at` (timestamp)

**Use this for:**
- Finding the right vendor for a problem
- Tracking vendor reliability
- Email lookups for support requests
- Vendor recommendations

**Example Query:**
```sql
SELECT * FROM emails_yacht
WHERE yacht_id = 'yacht-001'
AND specialization = 'engines'
ORDER BY reliability_score DESC;
```

---

### 📄 **document_yacht** - Document Repository
**What it stores:** Manuals, procedures, search results with chunking support

**Columns:**
- `id` (uuid) - Unique document/chunk ID
- `yacht_id` (text) - Which yacht owns this
- `document_name` (text) - File name
- `document_path` (text) - Path to file
- `document_type` (text) - PDF, manual, etc.
- `department` (text) - Which department (e.g., "engineering")
- `equipment_covered` (jsonb) - What equipment is in this doc
- `times_helpful` (int) - How many times marked helpful
- `helpful_count` (int) - Total helpful votes
- `conversion_rate` (numeric) - Success rate (helpful/accessed)
- `chunk_id` (text) - For chunked documents
- `chunk_text` (text) - Actual chunk content
- `chunk_index` (int) - Order in document
- `page_num` (int) - Page number
- `entities_found` (jsonb) - Equipment/parts mentioned
- `entity_weights` (jsonb) - Importance scores
- `query` (text) - Original search query
- `session_id` (uuid) - Which chat session found this
- `score` (numeric) - Search relevance score
- `chunk_metadata` (jsonb) - Additional info
- `is_chunk` (boolean) - Is this a document chunk?
- `fault_code_matches` (jsonb) - Fault codes in document
- `effectiveness_score`, `total_uses`, `successful_uses` (numeric/int)
- `created_at`, `updated_at`, `last_used` (timestamp)
- `user_id` (uuid) - Who owns/uploaded this

**Use this for:**
- Searching manuals
- Finding relevant procedures
- Tracking document effectiveness
- Semantic search with embeddings
- Showing context in chat responses

**Example Query (find relevant chunks):**
```sql
SELECT chunk_text, page_num, score
FROM document_yacht
WHERE is_chunk = true
AND yacht_id = 'yacht-001'
AND entities_found ? 'generator'
ORDER BY score DESC
LIMIT 5;
```

---

### 🔧 **fault_yacht** - Fault Tracking
**What it stores:** Equipment failures, repairs, maintenance issues

**Columns:**
- `fault_id` (uuid) - Unique fault ID
- `yacht_id` (text) - Which yacht
- `user_id` (uuid) - Who reported it
- `equipment_type`, `equipment_brand`, `equipment_model` (text)
- `fault_code` (text) - Error code (e.g., "SPN 94")
- `fault_description` (text) - What's wrong
- `symptoms` (array) - List of symptoms
- `severity_level` (text) - Critical, high, medium, low
- `detected_date` (timestamp) - When issue found
- `resolved_date` (timestamp) - When fixed
- `resolution_status` (text) - Open, in progress, resolved
- `resolution_id` (uuid) - Link to resolution used
- `technician_notes` (text) - Notes from tech
- `root_cause` (text) - What caused it
- `preventive_measures` (text) - How to avoid in future
- `downtime_hours` (numeric) - How long out of service
- `repair_cost_usd` (numeric) - Cost to fix
- `parts_replaced` (jsonb) - Which parts were replaced
- `created_at`, `updated_at` (timestamp)

**Use this for:**
- Tracking all equipment issues
- Maintenance history
- Cost tracking
- Pattern analysis (recurring issues)
- Downtime reporting

**Example Query:**
```sql
SELECT * FROM fault_yacht
WHERE yacht_id = 'yacht-001'
AND resolution_status = 'open'
ORDER BY severity_level, detected_date DESC;
```

---

### 💡 **resolution_yacht** - Solutions Database
**What it stores:** How to fix problems (repair procedures)

**Columns:**
- `resolution_id` (uuid) - Unique solution ID
- `yacht_id` (text) - Which yacht
- `resolution_title` (text) - Short name
- `resolution_description` (text) - Detailed explanation
- `resolution_steps` (jsonb) - Step-by-step instructions
- `equipment_type` (text) - What equipment this fixes
- `applicable_models` (array) - Which models/brands
- `success_count`, `failure_count` (int) - Track effectiveness
- `average_time_minutes` (int) - How long to complete
- `difficulty_level` (text) - Easy, medium, hard
- `required_expertise` (array) - Skills needed
- `safety_warnings` (array) - Important safety notes
- `tools_required` (array) - Tools list
- `parts_required` (jsonb) - Parts needed with quantities
- `estimated_cost_range` (text) - Cost estimate
- `created_by`, `approved_by` (text) - Who made/verified it
- `approval_date` (timestamp)
- `is_verified` (boolean) - Has this been confirmed to work?
- `created_at`, `updated_at` (timestamp)

**Use this for:**
- Providing repair instructions
- Matching faults to solutions
- Cost estimation
- Resource planning (tools/parts)
- Training (difficulty levels)

**Example Query:**
```sql
SELECT * FROM resolution_yacht
WHERE equipment_type = 'generator'
AND is_verified = true
ORDER BY success_count DESC;
```

---

### 📝 **handover_yacht** - Shift Handover Notes
**What it stores:** What the next shift needs to know

**Columns:**
- `handover_id` (uuid) - Unique handover ID
- `user_id` (uuid) - Who created this handover
- `yacht_id` (text) - Which yacht
- `solution_id` (uuid) - Related solution if any
- `document_name`, `document_path` (text) - Referenced docs
- `document_page` (numeric) - Specific page
- `system_affected` (text) - Which system (e.g., "propulsion")
- `fault_code` (text) - Any fault codes
- `symptoms` (jsonb) - Current symptoms
- `actions_taken` (jsonb) - What was already done
- `duration_minutes` (int) - Time spent so far
- `notes` (text) - Additional context
- `status` (text) - Pending, in progress, completed
- `created_at`, `updated_at`, `completed_at` (timestamp)

**Use this for:**
- Shift changes
- Work in progress tracking
- Continuity between crew
- Documenting troubleshooting steps

**Example Query:**
```sql
SELECT * FROM handover_yacht
WHERE yacht_id = 'yacht-001'
AND status != 'completed'
ORDER BY created_at DESC;
```

---

### 💬 **chat_sessions** - Conversation Management
**What it stores:** User chat sessions with the AI assistant

**Columns:**
- `id` (uuid) - Unique session ID
- `user_id` (uuid) - Who owns this chat
- `yacht_id` (text) - Which yacht context
- `title` (text) - Session name (auto-generated or user-set)
- `folder` (text) - Organization folder
- `search_type` (text) - Semantic, keyword, hybrid
- `session_metadata` (jsonb) - Extra info
- `is_archived` (boolean) - Archived chats
- `message_count` (int) - Number of messages
- `deleted` (boolean) - Soft delete flag
- `created_at`, `updated_at` (timestamp)

**Use this for:**
- Loading chat history
- Organizing conversations
- Context for AI responses
- User activity tracking

**Example Query:**
```sql
SELECT id, title, message_count
FROM chat_sessions
WHERE user_id = '0f355e38-d5a0-4f8b-ba24-5cc0514cf085'
AND deleted = false
ORDER BY updated_at DESC
LIMIT 10;
```

---

### 💬 **chat_messages** - Individual Messages
**What it stores:** Every message in every conversation

**Columns:**
- `id` (uuid) - Unique message ID
- `session_id` (uuid) - Which conversation
- `yacht_id` (text) - Which yacht context
- `role` (text) - "user", "assistant", or "system"
- `content` (text) - Message text
- `timestamp` (timestamp) - When sent
- `message_index` (int) - Order in conversation
- `sources` (jsonb) - Documents/chunks used for answer
- `metadata` (jsonb) - Additional info
- `tokens_used` (int) - API token count
- `confidence_score` (numeric) - How confident AI was

**Use this for:**
- Displaying chat history
- Training data collection
- Answer quality tracking
- Source attribution

**Example Query:**
```sql
SELECT role, content, timestamp, sources
FROM chat_messages
WHERE session_id = 'abc-123-def'
ORDER BY message_index;
```

---

### 🔐 **user_microsoft_tokens** - Email OAuth
**What it stores:** Microsoft/Outlook authentication tokens

**Columns:**
- `id` (uuid) - Unique record ID
- `user_id` (text) - User identifier
- `yacht_id` (text) - Which yacht
- `microsoft_user_id` (text) - Microsoft account ID
- `original_email`, `microsoft_email` (text)
- `display_name` (text) - User's display name
- `microsoft_access_token` (text) - Active token
- `microsoft_refresh_token` (text) - Refresh token
- `token_expires_at` (timestamp) - Expiration
- `token_type` (text) - Bearer
- `scopes` (array) - Permissions granted
- `client_id`, `client_secret` (text) - OAuth app credentials
- `created_at`, `updated_at` (timestamp)

**Use this for:**
- Email integration
- Accessing user's Outlook inbox
- Sending emails on behalf of user
- Token refresh automation

**Security Note:** These tokens have full email access - handle with care!

---

## Common Use Cases

### 🔍 **Search for a Solution**
```sql
-- Find solutions for a specific problem
SELECT r.resolution_title, r.resolution_steps, r.success_count
FROM resolution_yacht r
JOIN fault_yacht f ON f.resolution_id = r.resolution_id
WHERE f.fault_code = 'SPN 94'
AND r.is_verified = true
ORDER BY r.success_count DESC;
```

### 📊 **User Dashboard Data**
```sql
-- Get user info with recent activity
SELECT
  u.email,
  u.yacht_id,
  u.total_queries,
  COUNT(DISTINCT cs.id) as chat_sessions,
  COUNT(DISTINCT f.fault_id) as faults_reported
FROM users_yacht u
LEFT JOIN chat_sessions cs ON cs.user_id = u.user_id
LEFT JOIN fault_yacht f ON f.user_id = u.user_id
WHERE u.user_id = '0f355e38-d5a0-4f8b-ba24-5cc0514cf085'
GROUP BY u.user_id;
```

### 🛠️ **Active Maintenance Issues**
```sql
-- Get all open faults with handover notes
SELECT
  f.fault_code,
  f.equipment_type,
  f.severity_level,
  f.detected_date,
  h.notes as handover_notes,
  h.actions_taken
FROM fault_yacht f
LEFT JOIN handover_yacht h ON h.fault_code = f.fault_code
WHERE f.yacht_id = 'yacht-001'
AND f.resolution_status != 'resolved'
ORDER BY f.severity_level, f.detected_date;
```

### 📚 **Find Relevant Documents**
```sql
-- Semantic search for documents
SELECT
  document_name,
  chunk_text,
  page_num,
  score,
  entities_found
FROM document_yacht
WHERE yacht_id = 'yacht-001'
AND is_chunk = true
AND entities_found ?| ARRAY['generator', 'fuel system']
ORDER BY score DESC
LIMIT 10;
```

### 👤 **Get User's Recent Chats**
```sql
-- Last 10 conversations with preview
SELECT
  cs.title,
  cs.updated_at,
  cs.message_count,
  (
    SELECT content
    FROM chat_messages
    WHERE session_id = cs.id
    AND role = 'user'
    ORDER BY message_index
    LIMIT 1
  ) as first_message
FROM chat_sessions cs
WHERE cs.user_id = '0f355e38-d5a0-4f8b-ba24-5cc0514cf085'
AND cs.deleted = false
ORDER BY cs.updated_at DESC
LIMIT 10;
```

---

## Data Relationships

```
users_yacht
├── chat_sessions (via user_id)
│   └── chat_messages (via session_id)
├── fault_yacht (via user_id)
├── handover_yacht (via user_id)
├── emails_yacht (via user_id)
└── document_yacht (via user_id)

fault_yacht
└── resolution_yacht (via resolution_id)

document_yacht
└── chat_messages.sources (references chunk_id)
```

---

## Security & Access Control

### Row Level Security (RLS) Policies

**Read Access (ANON key):**
- ✅ All tables allow SELECT for reading
- ✅ Safe for n8n workflows
- ✅ No authentication required

**Write Access (SERVICE_ROLE key required):**
- ❌ INSERT, UPDATE, DELETE require service_role
- ❌ Never expose service_role key in frontend
- ✅ Use for backend operations only

**Best Practices:**
1. Use ANON key for read-only operations
2. Use SERVICE_ROLE key for admin operations
3. Store keys in environment variables
4. Never commit keys to git
5. Rotate keys if exposed

---

## Performance Tips

### Indexes
All tables have indexes on:
- Primary keys (uuid)
- Foreign keys (user_id, yacht_id, session_id)
- Commonly filtered columns (is_chunk, deleted, status)
- JSONB columns have GIN indexes for fast JSON queries

### Optimization
- Use `SELECT specific_columns` instead of `SELECT *`
- Add `LIMIT` to queries that don't need all results
- Use `WHERE yacht_id = 'xxx'` to filter by yacht first
- For text search, use the `search_vector` columns (tsvector)

---

## Backup & Recovery

**Backup Location:** `/Users/celeste7/Documents/NEWSITE/supabase/backups/`

**Create Backup:**
```bash
npx supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore Backup:**
```bash
npx supabase db reset
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f backup_file.sql
```

---

## Migration Management

**Migrations Location:** `/Users/celeste7/Documents/NEWSITE/supabase/migrations/`

**Apply New Migrations:**
```bash
npx supabase migration up
```

**Create New Migration:**
```bash
npx supabase migration new migration_name
```

**Check Migration Status:**
```bash
npx supabase db diff --schema public
```

---

## Troubleshooting

### "Empty results but data exists"
→ Check RLS policies, use service_role key

### "Cannot insert/update"
→ Need service_role key for writes

### "Slow queries"
→ Add indexes, use EXPLAIN ANALYZE

### "Connection refused"
→ Check Supabase is running: `npx supabase status`

---

## Contact & Support

**Database Type:** PostgreSQL 15
**Vector Extension:** pgvector (for embeddings)
**Full-text Search:** tsvector
**JSON Support:** jsonb with GIN indexes

**Useful Commands:**
```bash
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# View logs
npx supabase logs

# Reset database (⚠️ DELETES ALL DATA)
npx supabase db reset
```

---

**Last Updated:** October 14, 2025
**Schema Version:** 20251014160000
**Status:** ✅ Production Ready
