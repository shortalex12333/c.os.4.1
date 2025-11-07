# Yacht Hardware Deployment Guide

**For deploying Supabase database to client yacht hardware**

---

## 📋 What You'll Get

This guide explains how to extract all Supabase credentials for client deployments. The script automatically generates:

1. **Human-readable credentials file** with explanations
2. **`.env` file** for environment variables
3. **JSON file** for machine-readable config
4. **USB backup** (optional)

---

## 🚀 Quick Start (For YOUR System)

### Run the Pre-Configured Script

```bash
cd /Users/celeste7/Documents/NEWSITE
./scripts/get_supabase_credentials.sh
```

**Output:**
- Creates timestamped credentials file
- Displays keys on screen for quick copy
- Sets secure file permissions (600)

**Files Created:**
```
/Users/celeste7/Documents/NEWSITE/
├── SUPABASE_CREDENTIALS_YYYYMMDD_HHMMSS.txt
└── .env.supabase.local
```

---

## 🏗️ For Client Deployments

### Step 1: Copy Template to Client Hardware

```bash
# Copy the template script
scp scripts/get_supabase_credentials_TEMPLATE.sh yacht@yacht-hardware:/home/yacht/
```

### Step 2: Configure for Client

Edit the template on client hardware:

```bash
nano /home/yacht/get_supabase_credentials_TEMPLATE.sh
```

**Update these values:**

```bash
# Yacht Information
YACHT_NAME="M/Y EXCELLENCE"           # Client's yacht name
YACHT_ID="yacht-excellence-001"       # Unique identifier
CLIENT_NAME="Captain John Smith"      # Primary contact
DEPLOYMENT_DATE="2025-10-15"          # Today's date

# Project Configuration
PROJECT_DIR="/home/yacht/yacht-system"  # Where Supabase is installed

# Supabase Configuration
SUPABASE_PROJECT_NAME="yacht-db"      # Project folder name

# USB Backup (optional)
BACKUP_TO_USB=true                    # Set true to backup to USB
USB_BACKUP_PATH="/media/usb/backup"   # USB mount point
```

### Step 3: Make Executable & Run

```bash
chmod +x get_supabase_credentials_TEMPLATE.sh
./get_supabase_credentials_TEMPLATE.sh
```

---

## 📝 Configuration Fields Explained

| Field | Example | Purpose |
|-------|---------|---------|
| `YACHT_NAME` | "M/Y EXCELLENCE" | Client's yacht name for documentation |
| `YACHT_ID` | "yacht-001" | Unique ID (use lowercase, no spaces) |
| `CLIENT_NAME` | "John Smith" | Who receives the credentials |
| `DEPLOYMENT_DATE` | "2025-10-15" | When deployed (YYYY-MM-DD) |
| `PROJECT_DIR` | "/home/yacht/system" | Path to project root |
| `SUPABASE_PROJECT_NAME` | "NEWSITE" | Supabase project folder name |

---

## 🔑 What Keys Are Generated

### 1. ANON KEY (Public - Read Only)
**Length:** ~200 characters
**Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Use for:**
- ✅ Reading data (SELECT queries)
- ✅ n8n workflows (GET requests)
- ✅ Safe for multiple places

**Cannot:**
- ❌ Write/modify data
- ❌ Delete records
- ❌ Admin operations

### 2. SERVICE_ROLE KEY (Private - Full Access)
**Length:** ~200 characters
**Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Use for:**
- ✅ Writing data (INSERT, UPDATE, DELETE)
- ✅ Admin operations
- ✅ Bypassing Row Level Security
- ✅ Backend services ONLY

**⚠️ CRITICAL:**
- ❌ NEVER expose in frontend
- ❌ NEVER commit to git
- ❌ NEVER share publicly

### 3. JWT SECRET
**Used for:** Token signing/validation (rarely needed directly)

---

## 📂 Generated Files

### 1. `SUPABASE_CREDENTIALS_*.txt`
**Human-readable credential file with:**
- All connection details
- Both keys explained
- Usage examples for n8n
- cURL commands for testing
- Security checklist

### 2. `.env.supabase.local`
**Machine-readable environment file:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Load in your app:
```javascript
require('dotenv').config({ path: '.env.supabase.local' });
```

### 3. `credentials_*.json` (Template only)
**Structured JSON for automation:**
```json
{
  "yacht": {
    "name": "M/Y EXCELLENCE",
    "id": "yacht-001"
  },
  "supabase": {
    "api_url": "http://127.0.0.1:54321",
    "anon_key": "...",
    "service_role_key": "..."
  }
}
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Store credentials in secure location
- Set file permissions to 600 (owner only)
- Use `.gitignore` for credential files
- Use ANON key for read operations
- Use SERVICE_ROLE key only in backend
- Rotate keys if exposed
- Keep USB backups in safe

### ❌ DON'T:
- Commit credentials to git
- Share SERVICE_ROLE key in Slack/email
- Use SERVICE_ROLE key in frontend code
- Store credentials in plain text documents
- Leave credentials on USB drives unencrypted

---

## 🧪 Testing Credentials

### Test ANON KEY (Read):
```bash
curl -X GET "http://127.0.0.1:54321/rest/v1/users_yacht" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected:** Returns data array (even if empty: `[]`)

### Test SERVICE_ROLE KEY (Write):
```bash
curl -X POST "http://127.0.0.1:54321/rest/v1/users_yacht" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-123","yacht_id":"yacht-001","email":"test@example.com"}'
```

**Expected:** Returns created record or `201 Created`

---

## 🛠️ Troubleshooting

### "Supabase is not running"
```bash
# Start Supabase first
cd /path/to/project
npx supabase start
```

### "Configuration not set"
Edit the script and replace all `{{PLACEHOLDERS}}` with actual values.

### "Failed to extract credentials"
Check that:
- Supabase CLI is installed: `npx supabase --version`
- You're in the correct project directory
- Supabase is running: `npx supabase status`

### "Permission denied"
Make script executable:
```bash
chmod +x get_supabase_credentials.sh
```

### Keys not working in n8n
Double-check:
- Using correct URL: `http://127.0.0.1:54321`
- Both `apikey` header AND `Authorization: Bearer` header set
- Same key value in both headers
- No extra spaces or line breaks in key

---

## 📊 Platform-Specific Notes

### macOS
```bash
PROJECT_DIR="/Users/username/Documents/NEWSITE"
USB_BACKUP_PATH="/Volumes/USB_DRIVE"
```

### Linux
```bash
PROJECT_DIR="/home/username/yacht-system"
USB_BACKUP_PATH="/media/usb/backup"
```

### Windows (Git Bash/WSL)
```bash
PROJECT_DIR="/c/yacht-system"  # or "C:/yacht-system"
USB_BACKUP_PATH="/e/"           # USB drive letter
```

---

## 🔄 Re-generating Credentials

If you need to extract credentials again (keys don't change unless you reset Supabase):

```bash
./scripts/get_supabase_credentials.sh
```

Creates new timestamped file with same keys.

**Keys only change when:**
- You run `npx supabase db reset` (local)
- You create a new Supabase project (cloud)
- You manually rotate keys in Supabase dashboard (cloud)

---

## 📞 Support Checklist

Before contacting support, verify:

- [ ] Supabase is running (`npx supabase status`)
- [ ] Script is executable (`chmod +x`)
- [ ] Configuration values are set (no `{{PLACEHOLDERS}}`)
- [ ] You're in correct project directory
- [ ] Generated files exist and have 600 permissions
- [ ] Keys are complete (no truncation)

---

## 📄 Files Reference

| File | Purpose | Security |
|------|---------|----------|
| `get_supabase_credentials.sh` | YOUR system (pre-configured) | 600 (secure) |
| `get_supabase_credentials_TEMPLATE.sh` | Client deployments (needs config) | 755 (executable) |
| `SUPABASE_CREDENTIALS_*.txt` | Human-readable output | 600 (secure) |
| `.env.supabase.local` | Environment variables | 600 (secure) |
| `credentials_*.json` | Machine-readable config | 600 (secure) |

---

## 🎯 Quick Reference Card

**For n8n HTTP Requests:**

```
READ (GET):
  apikey: [ANON_KEY]
  Authorization: Bearer [ANON_KEY]

WRITE (POST/PUT/DELETE):
  apikey: [SERVICE_ROLE_KEY]
  Authorization: Bearer [SERVICE_ROLE_KEY]
```

**Database Access:**
```
Host: 127.0.0.1
Port: 54322
DB: postgres
User: postgres
Pass: postgres
```

---

**Last Updated:** October 14, 2025
**Script Version:** 1.0
**Tested On:** macOS, Linux, Windows (WSL)
