# 🚢 CelesteOS Yacht Deployment Security Checklist

## CRITICAL SECURITY FIXES (Complete Before Production)

### 1. **Environment Configuration** ✅ CREATED
```bash
# Copy yacht-specific configuration
cp .env.yacht .env

# Customize for this yacht:
# - YACHT_NAME=YourYachtName
# - YACHT_IMO=YourIMONumber
# - AZURE_CLIENT_SECRET=YourYachtSpecificSecret
# - NAS_BASE_PATH=/Volumes/YourNASName
```

### 2. **Remove Hardcoded Secrets** 🚨 CRITICAL
```bash
# Files that need cleaning:
# server/routes/emailRoutes.ts:18 - Remove hardcoded clientSecret
# server/services/email/.env - Move to yacht-specific location
# README.md - Remove exposed secrets from documentation
```

### 3. **Switch to Production Mode** 🚨 CRITICAL
```bash
# Stop development server
pkill -f "vite"

# Build for production
npm run build

# Start production server
npm run start
```

### 4. **Set Up Git Repository** 🚨 CRITICAL
```bash
git init
echo "*.env" >> .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
echo "server/services/email/.env" >> .gitignore
git add .
git commit -m "Initial yacht deployment"
```

## YACHT-SPECIFIC CONFIGURATION

### 5. **NAS Integration**
- Mount NAS to `/Volumes/YachtNAS`
- Update NAS_BASE_PATH in .env
- Test RAG document access
- Set up backup path

### 6. **Email RAG Setup**
- Configure yacht crew email access
- Test Microsoft Graph integration
- Verify email-based knowledge retrieval

### 7. **Chat Persistence** ⚠️ MISSING FEATURE
Currently chats are NOT saved. For $15k/month system, implement:
```sql
-- Add to Supabase migrations
CREATE TABLE chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    folder TEXT,
    yacht_id TEXT
);

CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id),
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    sources JSONB
);
```

## YACHT DEPLOYMENT STEPS

### 8. **Mac Studio Setup**
- [x] 96GB RAM confirmed adequate
- [x] Supabase local running (port 54321)
- [x] n8n workflows active (port 5678)
- [ ] Production build deployment
- [ ] Process monitoring (PM2 recommended)

### 9. **Network Security**
- [ ] Configure local network access only
- [ ] Set up HTTPS certificates for yacht network
- [ ] Block external internet access (optional)
- [ ] Configure firewall rules

### 10. **Backup Strategy**
- [ ] Set up automated Supabase backups to NAS
- [ ] Configuration file backups
- [ ] Chat history backups (once implemented)
- [ ] System restore procedures

### 11. **Monitoring & Maintenance**
- [ ] Set up log rotation
- [ ] Monitor disk space (NAS and local)
- [ ] Health check endpoints
- [ ] Update procedures

## YACHT CREW TRAINING

### 12. **User Access**
- Create crew member accounts in Supabase
- Set up role-based permissions
- Train on chat interface usage
- Document troubleshooting procedures

### 13. **Data Sources**
- [ ] Load yacht manuals to NAS
- [ ] Configure email accounts for RAG
- [ ] Test knowledge retrieval
- [ ] Update document indexes

## SECURITY VALIDATION

### 14. **Final Security Check**
- [ ] No secrets in source code
- [ ] All .env files properly configured
- [ ] SSL certificates installed
- [ ] Database access restricted
- [ ] Network access controlled

## YACHT-SPECIFIC CUSTOMIZATION

### 15. **Branding & Configuration**
- Update yacht name in interface
- Configure time zones
- Set up crew roles and permissions
- Customize RAG sources for yacht type

---

## 🚨 BEFORE YACHT DELIVERY

**CRITICAL**: The following MUST be completed before installing on yacht:

1. ✅ Chat persistence implementation
2. ✅ Secret management cleanup
3. ✅ Production build deployment
4. ✅ Backup procedures tested
5. ✅ Crew training materials

**Estimated completion time**: 2-3 days for critical fixes

**For $15k/month system, these issues present unacceptable risk for yacht operations.**