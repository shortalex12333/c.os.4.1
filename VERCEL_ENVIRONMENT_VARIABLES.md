# Vercel Environment Variables Configuration

This document lists all required environment variables for the CelesteOS deployment on Vercel.

## Required Environment Variables

### Supabase Configuration

Add these to your Vercel project settings under Environment Variables:

```bash
# Supabase URL
VITE_SUPABASE_URL=https://vivovcnaapmcfxxfhzxk.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://vivovcnaapmcfxxfhzxk.supabase.co

# Supabase Anonymous Key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
```

### Webhook Configuration

```bash
# Webhook Base URL (Production N8N Instance)
VITE_WEBHOOK_BASE_URL=https://api.celeste7.ai/webhook
```

### Other Configuration (if needed)

```bash
# Builder.io Key
VITE_PUBLIC_BUILDER_KEY=__BUILDER_PUBLIC_KEY__

# Settings
VITE_SETTINGS_GLASS=1
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Navigate to "Environment Variables"
4. Add each variable listed above
5. Set the environment scope (Production, Preview, Development)
6. Click "Save"
7. Redeploy your application for changes to take effect

## Important Notes

- **Both `VITE_*` and `NEXT_PUBLIC_*` prefixes are included** for compatibility with both Vite and Next.js build systems
- The Supabase anon key is safe to expose in the frontend (it's a public key)
- The webhook URL points to the production N8N instance at `api.celeste7.ai`
- If environment variables are not set, the code will fall back to hardcoded production values in `client/config/supabaseConfig.ts`

## Verification

After setting these variables:

1. Trigger a new deployment in Vercel
2. Check the browser console for these log messages:
   - `🔍 [supabaseConfig] Using env URL: https://vivovcnaapmcfxxfhzxk.supabase.co`
   - `🔍 [supabaseConfig] Using env anon key`
   - `🔍 [webhookConfig] Final WEBHOOK_BASE_URL: https://api.celeste7.ai/webhook`

3. Test authentication:
   - Try logging in with a test account
   - Check that there are no "Invalid API key" errors
   - Verify Supabase auth state changes in console

## Troubleshooting

If you see "Invalid API key" errors:

1. Verify the environment variables are set correctly in Vercel
2. Ensure you've redeployed after adding the variables
3. Check that the Supabase URL and anon key match the values above
4. Clear browser cache and hard reload (Cmd+Shift+R or Ctrl+Shift+R)
5. Check the browser console for which Supabase URL is being used
