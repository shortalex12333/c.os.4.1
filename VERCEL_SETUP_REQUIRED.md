# 🚨 CRITICAL: VERCEL ENVIRONMENT VARIABLES NOT SET 🚨

## The Problem

You're getting this error:
```
POST https://vivovcnaapmcfxxfhzxk.supabase.co/auth/v1/token?grant_type=password 401 (Unauthorized)
Login error: AuthApiError: Invalid API key
```

**This is because the environment variables are NOT set in your Vercel project.**

The `.env` file is LOCAL ONLY - it does not get deployed to Vercel!

## What You MUST Do Right Now

### Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your `c-os-4-1` project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar

### Step 2: Add These EXACT Variables

Click "Add New" for each of these:

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://vivovcnaapmcfxxfhzxk.supabase.co
Environment: Production, Preview, Development (check all)
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://vivovcnaapmcfxxfhzxk.supabase.co
Environment: Production, Preview, Development (check all)
```

**Variable 3:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
Environment: Production, Preview, Development (check all)
```

**Variable 4:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
Environment: Production, Preview, Development (check all)
```

**Variable 5:**
```
Name: VITE_WEBHOOK_BASE_URL
Value: https://api.celeste7.ai/webhook
Environment: Production, Preview, Development (check all)
```

### Step 3: Redeploy

After adding ALL FIVE variables:

1. Go to "Deployments" tab in Vercel
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Make sure "Use existing Build Cache" is UNCHECKED
5. Click "Redeploy"

### Step 4: Verify

Once the deployment finishes:

1. Open your deployed site
2. Open browser console (F12)
3. Look for these log messages:
   ```
   🔍 [supabaseConfig] Using env URL: https://vivovcnaapmcfxxfhzxk.supabase.co
   🔍 [supabaseConfig] Using env anon key
   ```

If you see these, the env vars are working!

If you see:
   ```
   🔍 [supabaseConfig] Using production URL
   🔍 [supabaseConfig] Using production anon key
   ```

Then the env vars are NOT set and it's using the fallback (which should still work).

### Step 5: Test Login

Try logging in. If you still get "Invalid API key", the issue is with Supabase itself, not the config.

## Why This Happened

- `.env` files are gitignored and never uploaded to Vercel
- Environment variables must be set manually in Vercel's dashboard
- Each deployment needs these variables to work properly

## Quick Verification Checklist

- [ ] All 5 environment variables added to Vercel
- [ ] Each variable is set for Production, Preview, AND Development
- [ ] Redeployed without build cache
- [ ] Checked browser console for confirmation logs
- [ ] Tested login

## If It Still Doesn't Work

Check these:

1. **Verify Supabase Project Is Active**
   - Go to https://supabase.com/dashboard
   - Make sure the project `vivovcnaapmcfxxfhzxk` is active
   - Check that the anon key matches

2. **Check Supabase API Settings**
   - Project Settings → API
   - Verify the anon/public key matches what we're using
   - Make sure API is enabled

3. **Test Supabase Directly**
   - Try making a curl request to Supabase:
   ```bash
   curl -X POST 'https://vivovcnaapmcfxxfhzxk.supabase.co/auth/v1/signup' \
     -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E' \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@test.com","password":"testpass123"}'
   ```

   If this returns 401, the API key itself is wrong.

## Screenshot Guide

I can't access your Vercel dashboard, but here's what you should see:

**Vercel → Settings → Environment Variables should show:**
```
VITE_SUPABASE_URL                  https://vivovcnaapmcfxxfhzxk.supabase.co        Production, Preview, Development
NEXT_PUBLIC_SUPABASE_URL           https://vivovcnaapmcfxxfhzxk.supabase.co        Production, Preview, Development
VITE_SUPABASE_ANON_KEY             eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...         Production, Preview, Development
NEXT_PUBLIC_SUPABASE_ANON_KEY      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...         Production, Preview, Development
VITE_WEBHOOK_BASE_URL              https://api.celeste7.ai/webhook                 Production, Preview, Development
```

## DO THIS NOW

Stop reading and go set those environment variables in Vercel. The site will NOT work until you do this.
