# Service Key Generation Scripts

**Purpose:** Extract Supabase credentials for yacht hardware deployments

---

## 📁 Files in this Directory

| File | Purpose | Who Uses It |
|------|---------|-------------|
| `get_supabase_credentials.sh` | Pre-configured for YOUR system | You (local testing) |
| `get_supabase_credentials_TEMPLATE.sh` | Universal template with placeholders | Client deployments |
| `DEPLOYMENT_GUIDE.md` | Complete usage instructions | Everyone |

---

## 🚀 Quick Start

### For Your Local System:
```bash
cd /Users/celeste7/Documents/NEWSITE
./SCRIPTS/SERVICEKEY_GENERATION/get_supabase_credentials.sh
```

### For Client Deployments:
1. Copy `get_supabase_credentials_TEMPLATE.sh` to client hardware
2. Edit configuration section (YACHT_NAME, YACHT_ID, etc.)
3. Run script to extract credentials
4. See `DEPLOYMENT_GUIDE.md` for full instructions

---

## 🔑 What Gets Generated

- **ANON_KEY** - Public key for reading data
- **SERVICE_ROLE_KEY** - Private key for full access
- **JWT_SECRET** - Token signing secret
- **Database URLs** - Connection strings
- **Environment files** - Ready to use .env files

---

## 📖 Documentation

See `DEPLOYMENT_GUIDE.md` for:
- Step-by-step setup instructions
- Configuration examples
- Security best practices
- Troubleshooting guide
- Platform-specific notes (macOS/Linux/Windows)

---

## 🔒 Security Notes

- All generated files have 600 permissions (owner only)
- Never commit credential files to git
- SERVICE_ROLE_KEY = full database access
- Keep credentials in secure location
- Use ANON_KEY for read operations
- Use SERVICE_ROLE_KEY only in backend

---

**Location:** `/Users/celeste7/Documents/NEWSITE/SCRIPTS/SERVICEKEY_GENERATION/`
**Last Updated:** October 14, 2025
