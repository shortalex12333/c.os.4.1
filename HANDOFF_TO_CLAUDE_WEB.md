# 🚀 CelesteOS v4.1 - Vercel Deployment Handoff

**Hello Claude Code (Web)!** You're taking over the deployment of CelesteOS v4.1 from local development to production on Vercel.

---

## 📍 Current Status

✅ **Repository**: https://github.com/shortalex12333/c.os.4.1  
✅ **Branch**: `main`  
✅ **Local Dev**: Fully functional on localhost:8888  
✅ **Documentation**: Complete (README.md, DEPLOYMENT.md, CLOUD_CONFIG.md)  
✅ **Media Assets**: All included in `/public/`  
✅ **Database**: Migrated to cloud Supabase  

⚠️ **Needs Cloud Deployment**: Currently configured for localhost

---

## 🎯 Your Mission

Deploy CelesteOS v4.1 to **Vercel** at domain **celeste7.ai** with full cloud integration.

---

## 📋 Critical Information You Need

### 1. **Cloud Services (Already Provisioned)**

#### Supabase (Cloud Database)
```
URL: https://vivovcnaapmcfxxfhzxk.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E
```

#### n8n (Cloud Webhooks)
```
Base URL: https://api.celeste7.ai/webhook/
```

#### Microsoft OAuth (Azure App)
```
Client ID: 41f6dc82-8127-4330-97e0-c6b26e6aa967
Tenant ID: common
Client Secret: <user will provide separately - it's sensitive>
```

### 2. **URLs to Update (localhost → cloud)**

| Current (localhost) | Target (cloud) |
|---------------------|----------------|
| `http://localhost:5678/webhook/` | `https://api.celeste7.ai/webhook/` |
| `http://127.0.0.1:54321` | `https://vivovcnaapmcfxxfhzxk.supabase.co` |
| `http://localhost:8888/auth/microsoft/callback` | `https://celeste7.ai/auth/microsoft/callback` |

### 3. **Files That Need URL Updates**

**Critical files to modify:**
1. `server/routes/webhookRoutes.ts` - Line 64: n8n webhook URL
2. `server/routes/emailRoutes.ts` - Lines 19-21, 122-123: OAuth redirect & Supabase
3. `client/config/webhookConfig.ts` - Webhook base URL
4. `server/services/emailSupabaseIntegration.ts` - Supabase URL (hardcoded)

**Search for and replace:**
- `localhost:5678` → `api.celeste7.ai`
- `localhost:54321` → `vivovcnaapmcfxxfhzxk.supabase.co`
- `127.0.0.1:54321` → `vivovcnaapmcfxxfhzxk.supabase.co`

---

## 🔧 Step-by-Step Deployment Plan

### **Step 1: Connect GitHub to Vercel**

1. Go to Vercel dashboard
2. Click "New Project"
3. Import from GitHub: `shortalex12333/c.os.4.1`
4. Select `main` branch

### **Step 2: Configure Vercel Build Settings**

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist/spa
Install Command: npm install
Node Version: 18.x
```

### **Step 3: Set Vercel Environment Variables**

Add these in Vercel Project Settings → Environment Variables:

```env
# Supabase (Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://vivovcnaapmcfxxfhzxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E

# n8n Webhooks
N8N_WEBHOOK_BASE=https://api.celeste7.ai/webhook

# Microsoft OAuth
AZURE_CLIENT_ID=41f6dc82-8127-4330-97e0-c6b26e6aa967
AZURE_CLIENT_SECRET=<ASK USER FOR THIS>
AZURE_TENANT_ID=common
AZURE_REDIRECT_URI=https://celeste7.ai/auth/microsoft/callback

# Environment
NODE_ENV=production
```

⚠️ **IMPORTANT**: Ask the user for `AZURE_CLIENT_SECRET` - it's not in the repo for security.

### **Step 4: Update Code for Cloud URLs**

Use global search & replace to update all localhost references:

**Search patterns:**
- `localhost:5678/webhook` → `api.celeste7.ai/webhook`
- `http://127.0.0.1:54321` → `https://vivovcnaapmcfxxfhzxk.supabase.co`
- `http://localhost:54321` → `https://vivovcnaapmcfxxfhzxk.supabase.co`

**Key files to update:**
```
server/routes/webhookRoutes.ts
server/routes/emailRoutes.ts
server/services/emailSupabaseIntegration.ts
client/config/webhookConfig.ts
```

### **Step 5: Commit Changes & Deploy**

```bash
git add .
git commit -m "Update URLs for production cloud deployment"
git push origin main
```

Vercel will auto-deploy after push.

### **Step 6: Configure Custom Domain**

1. In Vercel project settings → Domains
2. Add custom domain: `celeste7.ai`
3. Update DNS A record to point to Vercel IP
4. Wait for SSL certificate provisioning

### **Step 7: Update Azure OAuth Redirect URI**

⚠️ **CRITICAL**: User must do this manually in Azure Portal:

1. Go to https://portal.azure.com
2. Navigate to Azure Active Directory → App registrations → CelesteOS
3. Click "Authentication"
4. Under "Web" → "Redirect URIs", add:
   ```
   https://celeste7.ai/auth/microsoft/callback
   ```
5. Click "Save"

### **Step 8: Test & Verify**

✅ **Deployment Checklist:**
- [ ] Site loads at https://celeste7.ai
- [ ] Supabase connection works (login/signup)
- [ ] n8n webhooks respond (chat queries)
- [ ] Microsoft OAuth flow works (Connect Email)
- [ ] Chat interface functional
- [ ] SOP editor accessible
- [ ] No console errors

---

## 🐛 Common Issues & Solutions

### Issue: Build fails
**Solution**: Check Node version is 18.x in Vercel settings

### Issue: OAuth fails
**Solution**: Verify Azure redirect URI matches exactly: `https://celeste7.ai/auth/microsoft/callback`

### Issue: Webhooks timeout
**Solution**: Verify n8n instance at `api.celeste7.ai` is running and accessible

### Issue: Database connection fails
**Solution**: Double-check Supabase URL and anon key in environment variables

### Issue: 404 on routes
**Solution**: Ensure output directory is set to `dist/spa` in Vercel

---

## 📂 Repository Structure (Quick Reference)

```
/
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Express backend
├── public/          # Static assets (logos, backgrounds)
├── supabase/        # Database migrations
├── docs/            # Documentation
├── README.md        # Tech stack overview
├── DEPLOYMENT.md    # Vercel deployment guide
└── CLOUD_CONFIG.md  # Cloud service URLs
```

---

## 🔑 Key Features to Test

1. **Yacht Search** - AI document search across manuals
2. **Email Search** - Microsoft Outlook integration (requires OAuth)
3. **Chat Interface** - Conversational AI assistant
4. **SOP Creation** - Visual SOP editor with canvas
5. **Handover System** - Crew knowledge transfer

---

## 📞 What to Ask the User

Before deploying, ask the user:

1. **"Can you provide the Azure Client Secret for Microsoft OAuth?"**
   - It's not in the repo for security reasons
   - Needed for environment variables

2. **"Is the n8n instance at api.celeste7.ai running and accessible?"**
   - Verify webhooks are operational

3. **"Do you want me to proceed with updating the code URLs and deploying?"**
   - Get confirmation before making changes

---

## 🚨 IMPORTANT NOTES

1. **Don't commit secrets**: Azure client secret goes in Vercel env vars only
2. **Test webhooks**: Ensure n8n cloud instance is running before deploying
3. **DNS propagation**: Custom domain may take 5-10 minutes to propagate
4. **SSL cert**: Vercel provisions automatically, may take a few minutes
5. **Azure OAuth**: User MUST update redirect URI in Azure Portal manually

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Supabase Docs**: https://supabase.com/docs
- **n8n Webhooks**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

---

## ✅ Success Criteria

Deployment is successful when:

✅ Site loads at https://celeste7.ai  
✅ Users can sign up/login via Supabase  
✅ Chat queries return results from n8n webhooks  
✅ Microsoft email integration works (OAuth flow)  
✅ All features functional (no console errors)  
✅ SSL certificate active (HTTPS working)  

---

## 🎯 Your Action Plan

1. Ask user for Azure Client Secret
2. Confirm n8n cloud instance is running
3. Update all localhost URLs to cloud URLs
4. Configure Vercel project with correct settings
5. Set environment variables in Vercel
6. Commit and push changes
7. Deploy to Vercel
8. Configure custom domain
9. Remind user to update Azure OAuth redirect URI
10. Test all features and verify deployment

---

**Good luck! You've got this!** 🚀

The codebase is clean, well-documented, and ready for deployment. Everything you need is in this repository.

---

**Repository**: https://github.com/shortalex12333/c.os.4.1  
**Status**: Ready for production deployment  
**Target**: celeste7.ai via Vercel  
**Last Updated**: November 2025

