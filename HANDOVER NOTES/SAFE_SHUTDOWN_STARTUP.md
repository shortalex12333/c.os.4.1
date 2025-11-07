# 🔒 Safe Shutdown & Startup Procedures

**Last Updated:** October 2, 2025 12:36 PM
**Status:** ✅ **SAFE TO SHUTDOWN**

---

## ✅ Pre-Shutdown Checklist

- [x] **Fresh backup created:** `/supabase/backups/pre_shutdown_20251002_123647/complete_backup.sql` (475KB)
- [x] **Data verified in backup:**
  - ✅ User: `x@alex-short.com`
  - ✅ Chat sessions: 4 sessions
  - ✅ Users_yacht: Chief Engineer role
  - ✅ Auth sessions and tokens
- [x] **Supabase volumes exist:**
  - ✅ `supabase_db_NEWSITE` (database data)
  - ✅ `supabase_storage_NEWSITE` (file storage)
  - ✅ `supabase_config_NEWSITE` (configuration)

---

## 🛑 SHUTDOWN PROCEDURE

### Step 1: Stop Application
```bash
cd /Users/celeste7/Documents/NEWSITE

# Stop the Next.js dev server (Ctrl+C in terminal)
# Or kill the process if running in background
```

### Step 2: Stop Supabase (Graceful)
```bash
npx supabase stop
```

**What this does:**
- ✅ Saves all data to volumes
- ✅ Stops all containers gracefully
- ✅ Data persists in: `/Users/celeste7/Library/Containers/com.docker.docker/Data/vms/0/data/docker/volumes/`

**⚠️ DO NOT run:**
- ❌ `npx supabase db reset` (WIPES DATA!)
- ❌ Manual volume deletion
- ❌ Force kill containers

---

## 🚀 STARTUP PROCEDURE

### Step 1: Start Supabase
```bash
cd /Users/celeste7/Documents/NEWSITE

npx supabase start
```

**Expected output:**
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local
```

### Step 2: Verify Data Loaded
```bash
# Check user exists
podman exec supabase_db_NEWSITE psql -U postgres -d postgres -c "SELECT email FROM auth.users;"

# Expected output:
#       email
# ------------------
#  x@alex-short.com
# (1 row)
```

```bash
# Check chat sessions
podman exec supabase_db_NEWSITE psql -U postgres -d postgres -c "SELECT COUNT(*) FROM chat_sessions;"

# Expected output:
#  count
# -------
#      4
# (1 row)
```

### Step 3: Start Application
```bash
npm run dev
```

### Step 4: Test in Browser
1. Navigate to `http://localhost:8082`
2. **Clear browser auth tokens first:**
   - Visit: `http://localhost:8082/fix-auth`
   - Click "Clear Auth Tokens & Sign Out"
3. Log in with: `x@alex-short.com`
4. Verify:
   - ✅ Chats appear in sidebar
   - ✅ User profile shows "Chief Engineer"
   - ✅ Can create new chats

---

## 🆘 If Data Doesn't Load

### Option 1: Check Volumes
```bash
podman volume ls | grep supabase

# Should show:
# supabase_db_NEWSITE
# supabase_storage_NEWSITE
# supabase_config_NEWSITE
```

If volumes are missing → Data was lost, restore from backup.

### Option 2: Restore from Latest Backup
```bash
cd /Users/celeste7/Documents/NEWSITE

# Find latest backup
ls -lt supabase/backups/

# Restore it
cat supabase/backups/pre_shutdown_20251002_123647/complete_backup.sql | \
  podman exec -i supabase_db_NEWSITE psql -U postgres -d postgres
```

### Option 3: Emergency Restore
If Supabase containers are completely gone:

```bash
# 1. Start Supabase fresh
npx supabase start

# 2. Apply migrations (creates schema)
# Migrations are automatically applied on start

# 3. Restore data
cat supabase/backups/pre_shutdown_20251002_123647/complete_backup.sql | \
  podman exec -i supabase_db_NEWSITE psql -U postgres -d postgres

# 4. Verify
podman exec supabase_db_NEWSITE psql -U postgres -d postgres \
  -c "SELECT email FROM auth.users;"
```

---

## 📋 Data Persistence Explained

### How Supabase Stores Data:

**Podman Volumes (Persistent):**
```
supabase_db_NEWSITE → PostgreSQL database files
  ├── User accounts (auth.users)
  ├── Chat sessions (chat_sessions)
  ├── Chat messages (chat_messages)
  ├── User yacht data (users_yacht)
  └── All other tables
```

**Location on Disk:**
```
/Users/celeste7/Library/Containers/com.docker.docker/Data/vms/0/data/docker/volumes/
```

**When you run `npx supabase stop`:**
- ✅ Containers stop
- ✅ Volumes remain intact
- ✅ Data persists

**When you run `npx supabase start`:**
- ✅ Containers restart
- ✅ Volumes remount
- ✅ Data loads from volumes
- ✅ **Migrations are NOT re-run** (already applied)

**What WIPES data:**
- ❌ `npx supabase db reset` (NEVER USE!)
- ❌ `podman volume rm supabase_db_NEWSITE`
- ❌ Manually deleting volume directories

---

## 🔐 Backup Strategy

### Current Backups:
1. **Pre-shutdown backup (LATEST):**
   - `/supabase/backups/pre_shutdown_20251002_123647/complete_backup.sql`
   - Created: October 2, 2025 12:36 PM
   - Size: 475KB
   - Contains: ALL current data

2. **Morning backup:**
   - `/supabase/backups/20251002/backup_COMPLETE_20251002.sql`
   - Created: October 2, 2025 11:00 AM
   - Size: 105KB
   - Contains: Earlier state

### Create Manual Backup Anytime:
```bash
# Create timestamped backup
BACKUP_DIR="supabase/backups/manual_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

podman exec supabase_db_NEWSITE pg_dump -U postgres --clean --if-exists --inserts postgres > "$BACKUP_DIR/complete_backup.sql"

echo "✅ Backup saved to: $BACKUP_DIR"
```

### Automated Backup Script:
```bash
# Use this before every shutdown
./scripts/backup_database.sh
```

---

## ⚠️ IMPORTANT WARNINGS

### ❌ NEVER RUN THESE COMMANDS:
```bash
# FORBIDDEN - WIPES ALL DATA:
npx supabase db reset --local
npx supabase db reset

# ALSO FORBIDDEN:
podman volume rm supabase_db_NEWSITE
rm -rf /Users/celeste7/Library/Containers/.../supabase_db_NEWSITE
```

### ✅ SAFE COMMANDS:
```bash
# Safe shutdown
npx supabase stop

# Safe startup
npx supabase start

# Check status
npx supabase status

# Create backup
podman exec supabase_db_NEWSITE pg_dump -U postgres postgres > backup.sql
```

---

## 🧪 Test Startup Procedure (Do This Now)

Before actual shutdown, test the startup:

```bash
# 1. Stop Supabase
npx supabase stop

# 2. Wait 10 seconds
sleep 10

# 3. Restart Supabase
npx supabase start

# 4. Verify data
podman exec supabase_db_NEWSITE psql -U postgres -d postgres -c "SELECT COUNT(*) FROM auth.users;"

# Expected: count = 1 (your user)
```

If this works, you can safely shut down anytime!

---

## 📊 Quick Reference

| Command | Purpose | Safe? |
|---------|---------|-------|
| `npx supabase start` | Start Supabase | ✅ SAFE |
| `npx supabase stop` | Stop Supabase | ✅ SAFE |
| `npx supabase status` | Check status | ✅ SAFE |
| `npx supabase db reset` | **WIPE DATABASE** | ❌ **FORBIDDEN** |
| `podman volume ls` | List volumes | ✅ SAFE |
| `podman exec ... pg_dump` | Create backup | ✅ SAFE |

---

## ✅ Ready for Shutdown

Your database will automatically reload on startup because:
1. ✅ Data stored in persistent Podman volumes
2. ✅ Fresh backup created (475KB)
3. ✅ Migrations already applied
4. ✅ All tables and data verified

**Safe to power down!** 🔌

---

**Emergency Contact:**
- Backup location: `/Users/celeste7/Documents/NEWSITE/supabase/backups/`
- Restore script: `cat backup.sql | podman exec -i supabase_db_NEWSITE psql -U postgres -d postgres`
- Documentation: This file (`SAFE_SHUTDOWN_STARTUP.md`)
