# CelesteOS Portal - Installation Instructions

**Target Repo:** `github.com/shortalex12333/UX`
**Date:** 2025-10-16

---

## Files to Add to Your GitHub Repo

All files have been created in `/Users/celeste7/Documents/NEWSITE/client/`

### 1. Library Files (Authentication & API)

```bash
# Add these to UX/client/lib/
UX/client/lib/config.ts       # ← UPDATE n8n webhook URLs here!
UX/client/lib/supabase.ts
UX/client/lib/n8n.ts
```

### 2. React Hooks

```bash
# Add these to UX/client/hooks/
UX/client/hooks/useAuth.ts
UX/client/hooks/useSession.ts
```

### 3. Portal Components

```bash
# Add these to UX/client/components/portal/
UX/client/components/portal/LoginForm.tsx
UX/client/components/portal/TwoFactorForm.tsx
UX/client/components/portal/YachtInfo.tsx
```

### 4. Portal Pages

```bash
# Add these to UX/client/pages/portal/
UX/client/pages/portal/Login.tsx
UX/client/pages/portal/Dashboard.tsx
UX/client/pages/portal/Download.tsx
```

### 5. Update App.tsx

**Replace:** `UX/client/App.tsx`
**With:** `/Users/celeste7/Documents/NEWSITE/client/App.tsx`

---

## Step-by-Step Integration

### Step 1: Install Dependencies

```bash
cd ~/path/to/UX
npm install @supabase/supabase-js react-router-dom
npm install -D @types/react-router-dom
```

### Step 2: Copy Files to Repo

**Option A: Using cp command**
```bash
# From your terminal
cd /Users/celeste7/Documents/NEWSITE

# Copy lib files
cp -r client/lib/* ~/path/to/UX/client/lib/

# Copy hooks
cp -r client/hooks/* ~/path/to/UX/client/hooks/

# Copy components
mkdir -p ~/path/to/UX/client/components/portal
cp -r client/components/portal/* ~/path/to/UX/client/components/portal/

# Copy pages
mkdir -p ~/path/to/UX/client/pages/portal
cp -r client/pages/portal/* ~/path/to/UX/client/pages/portal/

# Update App.tsx
cp client/App.tsx ~/path/to/UX/client/App.tsx
```

**Option B: Manually**
1. Create directories in UX repo
2. Copy file contents from NEWSITE to UX
3. Save each file

### Step 3: Update Configuration

**IMPORTANT:** Edit `UX/client/lib/config.ts` and add your n8n webhook URLs:

```typescript
export const CONFIG = {
  supabase: {
    url: 'https://vivovcnaapmcfxxfhzxk.supabase.co',
    anonKey: 'eyJhbGci...' // Already set
  },
  n8n: {
    webhooks: {
      // UPDATE THESE!
      login: 'https://YOUR-N8N-INSTANCE.com/webhook/user-login',
      verify2FA: 'https://YOUR-N8N-INSTANCE.com/webhook/verify-2fa',
      downloadRequest: 'https://YOUR-N8N-INSTANCE.com/webhook/download-request'
    }
  }
};
```

### Step 4: Test Locally

```bash
cd ~/path/to/UX
npm run dev
```

Visit:
- `http://localhost:5173/` → Landing page (should still work)
- `http://localhost:5173/portal/login` → Portal login (new)

### Step 5: Commit and Push

```bash
cd ~/path/to/UX

git add .
git commit -m "Add CelesteOS portal (login, dashboard, download)"
git push origin main
```

### Step 6: Deploy

**If linked to Vercel GitHub auto-deploy:**
- Push triggers automatic deployment ✅

**If using Vercel CLI:**
```bash
vercel --prod
```

---

## Testing Checklist

After deployment:

- [ ] Landing page still works: `https://celeste7.ai`
- [ ] Portal login accessible: `https://celeste7.ai/portal/login`
- [ ] Create test user in Supabase Dashboard
- [ ] Test login flow (email + password)
- [ ] Receive 2FA code via email
- [ ] Verify 2FA code works
- [ ] Dashboard loads with yacht info
- [ ] Download button generates link
- [ ] Logout clears session

---

## Create Test User

**In Supabase Dashboard:**

1. Go to: **Authentication → Users → Add User**
   - Email: `test@celeste7.ai`
   - Password: `TestPassword123!`
   - Click "Create User"
   - Copy the user UUID

2. Go to: **SQL Editor → New Query**

```sql
-- Link user to yacht
INSERT INTO user_accounts (id, email, yacht_id, display_name, status)
VALUES (
  '[PASTE USER UUID HERE]',
  'test@celeste7.ai',
  'TEST_2025_001',
  'Test User',
  'active'
);

-- Create test yacht
INSERT INTO fleet_registry (yacht_id, yacht_id_hash, yacht_name, active)
VALUES (
  'TEST_2025_001',
  'test_hash_123',
  'Test Yacht',
  true
);
```

3. Click "Run"

---

## File Structure After Integration

```
UX/
├── client/
│   ├── App.tsx                      # ✏️ Updated with routes
│   ├── pages/
│   │   ├── Index.tsx                # Existing (landing page)
│   │   ├── NotFound.tsx             # Existing
│   │   └── portal/                  # ✨ NEW
│   │       ├── Login.tsx
│   │       ├── Dashboard.tsx
│   │       └── Download.tsx
│   ├── components/
│   │   ├── ui/                      # Existing (shadcn)
│   │   └── portal/                  # ✨ NEW
│   │       ├── LoginForm.tsx
│   │       ├── TwoFactorForm.tsx
│   │       └── YachtInfo.tsx
│   ├── lib/                         # ✨ NEW
│   │   ├── config.ts                # ⚠️ UPDATE n8n URLs!
│   │   ├── supabase.ts
│   │   └── n8n.ts
│   └── hooks/                       # ✨ NEW
│       ├── useAuth.ts
│       └── useSession.ts
├── package.json                     # ✏️ Add dependencies
└── ... (rest unchanged)
```

---

## Deployment URLs

After deployment, portal will be available at:
- **Login:** `https://celeste7.ai/portal/login`
- **Dashboard:** `https://celeste7.ai/portal/dashboard`
- **Download:** `https://celeste7.ai/portal/download`

Landing page remains at: `https://celeste7.ai`

---

## Troubleshooting

**Login fails:**
- Check Supabase Auth is enabled
- Check user exists in auth.users
- Check user_accounts has matching record

**2FA not received:**
- Check n8n webhook URL in config.ts
- Check SMTP credentials in n8n
- Check n8n workflow is active

**Dashboard empty:**
- Check user has yacht_id in user_accounts
- Check yacht exists in fleet_registry

**Download fails:**
- Expected for MVP (DMG builder not implemented yet)
- Placeholder URL will be shown

---

## Next Steps After MVP

1. Set up n8n workflows (import 3 JSON files from cloud_installer/)
2. Configure n8n with Supabase + SMTP credentials
3. Update config.ts with real n8n webhook URLs
4. Build DMG builder service (for actual installer generation)

---

**Files Ready:** All files in `/Users/celeste7/Documents/NEWSITE/client/`
**Action Required:** Copy to UX repo → Update config.ts → Deploy
**Estimated Time:** 30 minutes

**Status:** ✅ Ready to integrate
