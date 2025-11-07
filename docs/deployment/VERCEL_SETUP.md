# Vercel GitHub Integration - Final Steps

## Current Status ✅

1. ✅ Portal integrated into landing page
2. ✅ New GitHub repository created: `github.com/shortalex12333/celesteos-portal`
3. ✅ Code pushed to GitHub (2 commits)
4. ⏳ Vercel needs to be linked to GitHub

---

## Link Vercel to GitHub

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Navigate to your `landing-page-signup` project

2. **Connect to GitHub:**
   - Go to **Settings** → **Git**
   - Click **Connect Git Repository**
   - Select **GitHub**
   - Choose repository: `shortalex12333/celesteos-portal`
   - Branch: `main`
   - Click **Connect**

3. **Configure Build Settings:**
   - Framework Preset: **Vite**
   - Build Command: `vite build` (should auto-detect)
   - Output Directory: `dist` (should auto-detect)
   - Install Command: `npm install`

4. **Verify Custom Domain:**
   - Go to **Settings** → **Domains**
   - Confirm `celeste7.ai` is still configured
   - Should remain unchanged

5. **Trigger Deployment:**
   - Go to **Deployments**
   - Click **Redeploy** (or push triggers auto-deploy)
   - Wait for build to complete (~2-3 minutes)

---

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# Link project to GitHub
cd "/Users/celeste7/Documents/Landing Page Sign Up"
vercel link

# Deploy from GitHub
vercel --prod
```

---

## Verify Deployment

After linking and deploying, test these URLs:

**Landing Page (Existing):**
- https://celeste7.ai/
- Should show the original landing page with signup form

**Portal (New):**
- https://celeste7.ai/portal/login
- https://celeste7.ai/portal/dashboard (requires login)
- https://celeste7.ai/portal/download (requires login)

---

## What Changed

### Files Added:
- `src/lib/config.ts` - API configuration
- `src/lib/supabase.ts` - Supabase client
- `src/lib/n8n.ts` - n8n API wrapper
- `src/hooks/useAuth.ts` - Authentication hook
- `src/hooks/useSession.ts` - Session management
- `src/components/portal/` - 3 portal components
- `src/pages/Index.tsx` - Landing page (moved from App.tsx)
- `src/pages/portal/` - 3 portal pages

### Files Modified:
- `src/App.tsx` - Now uses React Router
- `.gitignore` - Excludes node_modules, build, credentials
- `package.json` - Added @supabase/supabase-js, react-router-dom

### Repository:
- GitHub: https://github.com/shortalex12333/celesteos-portal
- Main branch: 2 commits
- Size: ~270 files (excluded node_modules)

---

## Testing Checklist

After deployment completes:

### Landing Page Tests:
- [ ] Visit https://celeste7.ai/
- [ ] Landing page displays correctly
- [ ] Signup form still works
- [ ] All styles load correctly

### Portal Tests:
- [ ] Visit https://celeste7.ai/portal/login
- [ ] Login form displays
- [ ] Can enter email/password
- [ ] 2FA form appears after login
- [ ] Dashboard displays after 2FA
- [ ] Yacht information shows correctly
- [ ] Download page accessible from dashboard
- [ ] Logout returns to login page

### Routing Tests:
- [ ] Direct URL access works for all routes
- [ ] Page refresh maintains route
- [ ] Back/forward buttons work correctly
- [ ] Invalid routes redirect appropriately

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'react-router-dom'"**
- Solution: Ensure Vercel ran `npm install` during build
- Check: Build logs show "added 77 packages"

**Error: "Cannot find module '@supabase/supabase-js'"**
- Solution: Same as above - check build logs

**Error: TypeScript errors**
- Solution: Check if `@types/react`, `@types/react-dom`, `@types/react-router-dom` are in devDependencies

### Portal Pages 404

**Error: /portal/login returns 404**
- Solution: Ensure Vercel is configured for SPA routing
- Add `vercel.json` with rewrites:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Custom Domain Not Working

**Error: celeste7.ai not resolving**
- Solution: Check Vercel domain settings
- DNS should still point to Vercel nameservers
- May take 5-10 minutes to propagate after redeployment

---

## Architecture Summary

```
Browser Request
    ↓
Vercel CDN (celeste7.ai)
    ↓
React Router
    ↓
    ├── / → Landing Page (Index.tsx)
    │   └── Existing signup form preserved
    │
    └── /portal/* → Portal Pages
        ├── /portal/login → Login with 2FA
        ├── /portal/dashboard → Yacht info
        └── /portal/download → Download installer

Portal Backend
    ↓
    ├── n8n (api.celeste7.ai)
    │   ├── /webhook/user-login
    │   ├── /webhook/verify-2fa
    │   └── /webhook/download-request
    │
    └── Supabase (vivovcnaapmcfxxfhzxk.supabase.co)
        ├── auth.users
        ├── user_accounts
        ├── fleet_registry
        ├── twofa_codes
        ├── user_sessions
        └── download_links
```

---

## Next Steps

1. **Link Vercel to GitHub** (via dashboard or CLI)
2. **Verify deployment succeeds**
3. **Test landing page** (should be unchanged)
4. **Create test user** (use `/Users/celeste7/Documents/NEWSITE/create_test_user.sql`)
5. **Test portal flow** (login → 2FA → dashboard → download)

---

## Files Location

All documentation files are in:
- `/Users/celeste7/Documents/NEWSITE/`

Key files:
- `DEPLOYMENT_COMPLETE.md` - Original deployment instructions
- `INTEGRATION_COMPLETE.md` - Integration summary
- `VERCEL_SETUP.md` - This file
- `create_test_user.sql` - Test user SQL script

---

**Last Updated:** 2025-10-16
**GitHub Repo:** https://github.com/shortalex12333/celesteos-portal
**Status:** ✅ Ready for Vercel Link
