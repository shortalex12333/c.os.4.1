# Vercel Deployment Guide - CelesteOS v4.1

Quick deployment guide for Claude Code (Web) to deploy CelesteOS to Vercel.

## 🎯 Prerequisites

- Vercel account connected to GitHub
- Cloud Supabase instance: `https://vivovcnaapmcfxxfhzxk.supabase.co`
- Cloud n8n instance: `https://api.celeste7.ai/webhook/`
- Azure OAuth app configured

## ⚡ Quick Deploy Steps

### 1. Configure Vercel Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://vivovcnaapmcfxxfhzxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
N8N_WEBHOOK_BASE=https://api.celeste7.ai/webhook
AZURE_CLIENT_ID=41f6dc82-8127-4330-97e0-c6b26e6aa967
AZURE_CLIENT_SECRET=<your-azure-client-secret>
AZURE_TENANT_ID=common
AZURE_REDIRECT_URI=https://celeste7.ai/auth/microsoft/callback
NODE_ENV=production
```

### 2. Update Code (Required Changes)

**A. Webhook URLs** - Replace all localhost:5678 with cloud:
- `server/routes/webhookRoutes.ts`
- `client/config/webhookConfig.ts`

**B. Supabase URLs** - Replace localhost:54321 with cloud:
- `server/services/emailSupabaseIntegration.ts`

### 3. Update Azure OAuth

Go to Azure Portal → App Registrations → CelesteOS → Authentication

Add redirect URI:
```
https://celeste7.ai/auth/microsoft/callback
```

### 4. Deploy

Push to GitHub main branch - Vercel auto-deploys.

## ✅ Verification Checklist

- [ ] Vercel build succeeds
- [ ] Site loads at celeste7.ai
- [ ] Supabase connection works
- [ ] n8n webhooks respond
- [ ] Microsoft OAuth flow works
- [ ] Chat interface functional

## 🔧 Vercel Build Settings

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist/spa`
- Install Command: `npm install`
- Node Version: 18.x

## 📞 Troubleshooting

**Build fails?** Check Node version and dependencies.
**OAuth fails?** Verify Azure redirect URI.
**Webhooks fail?** Check n8n cloud connectivity.
**Supabase fails?** Verify environment variables.

---

**Ready?** Push to main and Vercel will handle the rest! 🚀
