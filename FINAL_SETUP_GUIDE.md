# 🚀 FINAL SETUP GUIDE - Complete Instructions

## Current Status

✅ **Code**: All fixes committed and pushed to GitHub
✅ **Scripts**: Automated setup scripts created and tested
❌ **Supabase**: Project is PAUSED or BROKEN (returning 403)
❌ **Vercel**: Environment variables not set yet

**YOU MUST COMPLETE STEPS 1 & 2 BELOW FOR THE SITE TO WORK**

---

## Step 1: Fix Supabase (5 minutes) 🔴 CRITICAL

Your Supabase project is currently **BLOCKING ALL API REQUESTS with 403 Forbidden**.

### 1.1 Go to Supabase Dashboard

Open: **https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk**

### 1.2 Resume the Project

Look for one of these:
- A **"PAUSED"** banner at the top
- A **"Resume Project"** button
- A **"Project Status: Paused"** indicator

**Click "Resume Project"** and wait 1-2 minutes for it to activate.

### 1.3 Verify API Key

Go to: **Settings → API**

Check that the **anon / public** key matches:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
```

If it's **different**, copy the correct one from the dashboard. You'll need it for Step 2.

### 1.4 Test Supabase Works

Run this command to verify Supabase is working:

```bash
cd /home/user/c.os.4.1
./scripts/verify-supabase.sh
```

You should see **✅ green checkmarks**, not ❌ red X's.

If you get a different API key from Supabase dashboard, test with it:

```bash
./scripts/verify-supabase.sh "paste_your_new_key_here"
```

**DO NOT PROCEED TO STEP 2 UNTIL SUPABASE PASSES ALL TESTS**

---

## Step 2: Set Vercel Environment Variables (5 minutes) 🔴 CRITICAL

You have two options:

### Option A: Automated Script (Recommended)

1. **Get Vercel Token**
   - Go to: https://vercel.com/account/tokens
   - Click "Create Token"
   - Name it: "CLI Access"
   - Copy the token

2. **Run Setup Script**
   ```bash
   cd /home/user/c.os.4.1
   ./scripts/setup-vercel-env.sh YOUR_VERCEL_TOKEN_HERE
   ```

   If your project has a different name than `c-os-4-1`:
   ```bash
   ./scripts/setup-vercel-env.sh YOUR_VERCEL_TOKEN_HERE your-project-name
   ```

3. **Wait for Deployment**
   - The script will automatically trigger a deployment
   - Wait for it to complete (2-5 minutes)

### Option B: Manual Setup (If script fails)

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com/dashboard
   - Select your project (`c-os-4-1` or similar)
   - Go to: **Settings → Environment Variables**

2. **Add These 5 Variables** (click "Add New" for each):

   **Variable 1:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://vivovcnaapmcfxxfhzxk.supabase.co
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

   **Variable 2:**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://vivovcnaapmcfxxfhzxk.supabase.co
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

   **Variable 3:**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

   **Variable 4:**
   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

   **Variable 5:**
   ```
   Name: VITE_WEBHOOK_BASE_URL
   Value: https://api.celeste7.ai/webhook
   Environments: ☑ Production ☑ Preview ☑ Development
   ```

   **⚠️ IMPORTANT:** Make sure to check ALL THREE environment checkboxes for each variable!

3. **Trigger Deployment**
   - Go to: **Deployments** tab
   - Click the (...) menu on the latest deployment
   - Click **"Redeploy"**
   - **UNCHECK** "Use existing Build Cache"
   - Click **"Redeploy"**

---

## Step 3: Test Your Deployment (2 minutes)

### 3.1 Wait for Deployment

- Watch the deployment logs in Vercel
- Wait for "Ready" status (usually 2-5 minutes)

### 3.2 Open Your Site

- Click on the deployment URL
- Open browser DevTools (F12)
- Go to Console tab

### 3.3 Check Logs

You should see these logs:
```
🔍 [supabaseConfig] Using env URL: https://vivovcnaapmcfxxfhzxk.supabase.co
🔍 [supabaseConfig] Using env anon key
🔍 [webhookConfig] Final WEBHOOK_BASE_URL: https://api.celeste7.ai/webhook
```

If you see "Using production URL" instead of "Using env URL", the environment variables didn't load properly.

### 3.4 Test Login

Try to log in with a test account.

**Expected: Login works**
**If you see "Invalid API key"**: Supabase is still broken (go back to Step 1)

---

## Troubleshooting

### Issue: Supabase Still Returns 403

**Cause:** Project is still paused or API key is wrong

**Fix:**
1. Double-check project is ACTIVE in Supabase dashboard
2. Verify the API key matches exactly
3. Check if there are IP restrictions in Supabase settings
4. Contact Supabase support if project won't resume

### Issue: Vercel Env Vars Not Loading

**Cause:** Variables weren't set correctly or deployment used cache

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify all 5 variables are listed
3. Make sure all have "Production, Preview, Development" selected
4. Redeploy WITHOUT build cache

### Issue: "Using production URL" Instead of "Using env URL"

**Cause:** Vite/Next.js isn't seeing the environment variables

**Fix:**
1. Variables must start with `VITE_` or `NEXT_PUBLIC_`
2. Redeploy without cache
3. Check Vercel build logs for env var warnings

### Issue: Webhook Endpoints Return 403

**Cause:** Your n8n instance or API gateway at `api.celeste7.ai` is down

**Fix:**
1. Check if your n8n server is running
2. Verify DNS for `api.celeste7.ai` points correctly
3. Check firewall/security group rules
4. Test endpoint directly: `curl https://api.celeste7.ai/webhook/health`

---

## What Was Fixed in the Code

All these changes are committed and pushed to GitHub:

### ✅ Fixed Files

1. **`.env`** - Added production Supabase credentials
2. **`client/config/supabaseConfig.ts`** - Added production fallback and logging
3. **`client/config/webhookConfig.ts`** - Simplified to use WEBHOOK_BASE_URL consistently
4. **`client/lib/config.ts`** - Already had correct credentials

### ✅ Created Files

1. **`scripts/verify-supabase.sh`** - Tests Supabase configuration
2. **`scripts/setup-vercel-env.sh`** - Automated Vercel environment setup
3. **`CRITICAL_SUPABASE_ISSUE.md`** - Detailed Supabase diagnostic info
4. **`VERCEL_SETUP_REQUIRED.md`** - Manual Vercel setup instructions
5. **`ACTION_PLAN.md`** - Step-by-step action plan
6. **`FINAL_SETUP_GUIDE.md`** - This complete guide

### ✅ Commits

```
4e4b9b9 Add comprehensive action plan for fixing Supabase auth
61c2c6b Add Supabase diagnostic tools and documentation
8d12000 Fix Supabase auth errors and update webhook configuration
```

---

## Quick Reference

### Test Commands

```bash
# Test Supabase
./scripts/verify-supabase.sh

# Test with different key
./scripts/verify-supabase.sh "your_key_here"

# Setup Vercel (automated)
./scripts/setup-vercel-env.sh YOUR_VERCEL_TOKEN

# Check git status
git status
git log --oneline -5
```

### Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Tokens**: https://vercel.com/account/tokens
- **GitHub Repo**: https://github.com/shortalex12333/c.os.4.1

### Environment Variables Summary

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://vivovcnaapmcfxxfhzxk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vivovcnaapmcfxxfhzxk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...Oy0k3Yr0E` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...Oy0k3Yr0E` |
| `VITE_WEBHOOK_BASE_URL` | `https://api.celeste7.ai/webhook` |

---

## Success Checklist

- [ ] Supabase project resumed and active
- [ ] `./scripts/verify-supabase.sh` shows all ✅ green checks
- [ ] All 5 Vercel environment variables set
- [ ] Vercel redeployed without build cache
- [ ] Browser console shows "Using env URL" and "Using env anon key"
- [ ] Login works without "Invalid API key" error

---

## Still Having Issues?

If you've completed all steps and it's still not working:

1. **Share the exact error message** from browser console
2. **Run diagnostic**: `./scripts/verify-supabase.sh` and share output
3. **Check Vercel logs**: Share any build or runtime errors
4. **Screenshot**: Capture browser console showing the error

The code is correct. The infrastructure needs to be set up properly.

---

**DO THESE STEPS IN ORDER. DO NOT SKIP STEP 1.**
