# RLS (Row Level Security) Troubleshooting Guide
*For CelesteOS Yacht Management System*

## 🚨 Common RLS Issues & Solutions

### 1. **"Empty Results" or "Access Denied" Errors**

**Symptoms:**
```bash
# API returns empty array when data exists
curl /rest/v1/chat_sessions  # Returns: []
```

**Causes:**
- **Frontend using wrong token** (`anon` vs `authenticated`)
- **RLS policy rejecting user**
- **User not properly authenticated**
- **Policy checking wrong field** (user_id vs auth.uid())

**Quick Diagnosis:**
```bash
# Test with service_role (bypasses RLS)
curl -H "Authorization: Bearer [SERVICE_ROLE_KEY]" /rest/v1/chat_sessions

# If service_role works but anon doesn't = RLS issue
```

### 2. **Authentication Context Issues**

**Symptoms:**
- User can register/login but can't access their data
- `auth.uid()` returning NULL in policies

**Common Causes:**
```sql
-- ❌ WRONG: Using anon token with auth.uid()
auth.uid() = user_id  -- auth.uid() is NULL for anon users

-- ✅ CORRECT: Either disable RLS or ensure proper auth token
```

**Fix:**
```typescript
// Ensure frontend passes user session token
const { data: session } = await supabase.auth.getSession();
// Use session.access_token in API calls, not anon key
```

### 3. **Policy Logic Errors**

**Common Mistakes:**
```sql
-- ❌ WRONG: Overly restrictive
CREATE POLICY "users_own_data" ON table_name
    FOR ALL USING (auth.uid() = user_id AND role = 'admin');

-- ✅ BETTER: More flexible
CREATE POLICY "users_own_data" ON table_name
    FOR ALL USING (
        auth.uid() = user_id OR
        current_setting('role') = 'service_role'
    );
```

### 4. **Temporary RLS Disable (Development Only)**

**When to use:**
- ✅ Local development/testing
- ✅ Debugging authentication flow
- ❌ NEVER in production

**How to disable:**
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

**How to re-enable:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## 🔧 Debugging Checklist

### Step 1: Verify Data Exists
```bash
# Use service_role to bypass RLS
curl -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
     http://127.0.0.1:54321/rest/v1/table_name
```

### Step 2: Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'your_table_name';
-- rowsecurity = true means RLS is enabled
```

### Step 3: Test Authentication
```bash
# Get user's actual auth token
curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
     -d '{"email":"user@example.com","password":"password"}'

# Use that token in Authorization header
curl -H "Authorization: Bearer [USER_ACCESS_TOKEN]" \
     http://127.0.0.1:54321/rest/v1/table_name
```

### Step 4: Inspect Policy Logic
```sql
-- View all policies for a table
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';

-- Test what auth.uid() returns
SELECT auth.uid() AS current_user_id;
```

## 🚢 Yacht Deployment Considerations

### Development vs Production

**Development (Current):**
```sql
-- Temporarily disabled for frontend development
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
```

**Production (TODO):**
```sql
-- Re-enable with proper policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Ensure frontend uses authenticated sessions
-- All crew must login to access their chat history
```

### Yacht-Specific RLS Patterns

**Multi-user boat access:**
```sql
-- Allow crew members to access shared yacht data
CREATE POLICY "yacht_crew_access" ON chat_sessions
    FOR ALL USING (
        yacht_id IN (
            SELECT yacht_id
            FROM crew_assignments
            WHERE user_id = auth.uid()
        )
    );
```

**Role-based access:**
```sql
-- Captain sees all chats, crew see only their own
CREATE POLICY "role_based_chat_access" ON chat_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'captain'
            AND yacht_id = chat_sessions.yacht_id
        )
    );
```

## 🔥 Emergency RLS Disable

**If yacht crew can't access critical systems:**

```bash
# Connect to Supabase and disable RLS on critical tables
supabase db reset  # This will temporarily disable all RLS

# Or target specific tables:
echo "ALTER TABLE critical_table DISABLE ROW LEVEL SECURITY;" | \
supabase db reset --with-migration
```

## 🛡️ Security Best Practices

### When to Use RLS
- ✅ **Production yacht deployment** - protect crew data
- ✅ **Multi-tenant systems** - isolate yacht data
- ✅ **Sensitive operations** - financial, personal data

### When to Disable RLS
- ✅ **Local development** - ease debugging
- ✅ **Testing** - focus on functionality first
- ❌ **Never in production** without proper justification

### Re-enabling RLS Safely
1. **Test policies thoroughly** in development
2. **Ensure frontend authentication** works properly
3. **Have rollback plan** (service_role access)
4. **Monitor for access errors** after deployment

## 📝 Quick Reference Commands

```bash
# Check RLS status
curl -H "apikey: [ANON_KEY]" http://127.0.0.1:54321/rest/v1/table_name

# Test with service role (bypasses RLS)
curl -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
     http://127.0.0.1:54321/rest/v1/table_name

# Get user auth token
curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
     -d '{"email":"test@example.com","password":"password"}'

# Test with user token
curl -H "Authorization: Bearer [USER_TOKEN]" \
     http://127.0.0.1:54321/rest/v1/table_name

# Disable RLS (emergency)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

# Re-enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

**Remember**: RLS issues are almost always authentication or authorization problems, not database problems. Start by verifying who the system thinks the user is!