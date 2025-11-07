# CelesteOS v4.1 🚢

AI-powered yacht management system with intelligent email search, document RAG, SOP creation, and conversational AI capabilities.

**🎯 Status: Ready for Vercel Cloud Deployment**

---

## 🚀 Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 6.2** - Build tool & dev server  
- **React Router 6.26** - Client-side routing
- **TailwindCSS 3.4** - Styling with custom design system
- **Radix UI** - Accessible component primitives
- **React Three Fiber 8.18** - 3D graphics engine
- **Framer Motion 12.23** - Animation library
- **TipTap 2.27** - Rich text editor (SOP creation)
- **Lucide React** - Icon library

### Backend
- **Express 4.18** - Node.js web server
- **TypeScript** - Type-safe backend
- **PostgreSQL** - Relational database
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage, RLS)

### AI & Automation
- **n8n** - Workflow automation & webhook orchestration
- **NASRAG Pipeline** - Custom AI search & retrieval system  
- **Microsoft Graph API** - Email integration (OAuth2)
- **Ollama** - LLM inference (moving to cloud)

### Key Features
1. **🔍 Yacht Search** - AI-powered document search across yacht manuals
2. **📧 Email Search** - Microsoft Outlook integration with OAuth2
3. **📝 SOP Creation** - Visual SOP editor with drag-and-drop canvas
4. **💬 Chat Interface** - Conversational AI assistant
5. **🤝 Handover System** - Knowledge transfer between crew members
6. **📄 Document RAG** - Retrieval-Augmented Generation for queries

---

## 📁 Project Structure

```
/NEWSITE
├── client/                    # React frontend (3.2MB)
│   ├── components/           # React components
│   │   ├── layout/          # Sidebar, InputArea, etc.
│   │   ├── sop-editor/      # SOP creation components
│   │   └── figma/           # Design system components
│   ├── services/            # API services & integrations
│   │   ├── webhookServiceFixed.ts
│   │   ├── emailAuthService.ts
│   │   ├── chatService.ts
│   │   └── sopService.ts
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── config/              # Frontend configuration
│   │   ├── webhookConfig.ts
│   │   └── network.ts
│   └── AppFigma.tsx         # Main app component
├── server/                   # Express backend (764KB)
│   ├── routes/              # API routes
│   │   ├── emailRoutes.ts           # Microsoft OAuth & email
│   │   ├── webhookRoutes.ts         # n8n webhook proxy
│   │   └── webhookRoutesFixed.ts    # Enhanced webhooks
│   ├── services/            # Backend services
│   │   ├── emailSupabaseIntegration.ts
│   │   ├── nasServiceV2.ts
│   │   └── email/           # Email service Python scripts
│   └── index.ts             # Server entry point
├── shared/                   # Shared types & utilities (4KB)
├── public/                   # Static assets
│   ├── Logo.png             # CelesteOS logo (✅ included)
│   ├── background.png       # Main background (✅ included)
│   ├── DAKR MODE BACKGROUND.png  # Dark mode bg (✅ included)
│   └── placeholder.svg      # Placeholder (✅ included)
├── supabase/                # Database migrations
│   └── migrations/          # SQL migration files
├── dev-proxy/               # Caddy reverse proxy (LOCAL ONLY)
├── docs/                    # Documentation
│   ├── SOP_FEATURE_GUIDE.md
│   └── features/            # Feature guides
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

---

## 🔧 Environment Variables

### **Local Development (Current)**
```env
# Server Port
VITE_PORT=8888

# Supabase (Local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# n8n Webhooks (Local)
N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# Microsoft OAuth
AZURE_CLIENT_ID=41f6dc82-8127-4330-97e0-c6b26e6aa967
AZURE_CLIENT_SECRET=<your-azure-client-secret>
AZURE_TENANT_ID=common
AZURE_REDIRECT_URI=http://localhost:8888/auth/microsoft/callback
```

### **☁️ Cloud Production (Vercel) - USE THESE**
```env
# Supabase (Cloud) ✅
NEXT_PUBLIC_SUPABASE_URL=https://vivovcnaapmcfxxfhzxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E

# n8n Webhooks (Cloud) ✅
N8N_WEBHOOK_BASE=https://api.celeste7.ai/webhook

# Microsoft OAuth (Production) ✅
AZURE_CLIENT_ID=41f6dc82-8127-4330-97e0-c6b26e6aa967
AZURE_CLIENT_SECRET=<your-azure-client-secret>
AZURE_TENANT_ID=common
AZURE_REDIRECT_URI=https://celeste7.ai/auth/microsoft/callback

# Node Environment
NODE_ENV=production
```

---

## 🌐 Local to Cloud Migration Map

| Service | Local (Current) | Cloud (Target) | Status |
|---------|----------------|----------------|--------|
| **Supabase** | `http://127.0.0.1:54321` | `https://vivovcnaapmcfxxfhzxk.supabase.co` | ✅ Ready |
| **n8n Webhooks** | `http://localhost:5678/webhook/*` | `https://api.celeste7.ai/webhook/*` | ⚠️ Update needed |
| **Frontend** | `http://localhost:8888` | `https://celeste7.ai` | ✅ Vercel |
| **OAuth Callback** | `http://localhost:8888/auth/microsoft/callback` | `https://celeste7.ai/auth/microsoft/callback` | ⚠️ Azure update needed |
| **AI Models** | Ollama (local) | Cloud API | ✅ Handled separately |

---

## 🚦 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (via Supabase)
- n8n instance (port 5678)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Server runs on **http://localhost:8888**

### Build
```bash
# Build client & server
npm run build

# Start production
npm start
```

---

## 📊 Database Schema

### Key Tables
- **`chat_sessions`** - User chat history & conversations
- **`user_microsoft_tokens`** - OAuth tokens for email integration
- **`handovers`** - Crew handover documents
- **`sop_documents`** - Standard Operating Procedures
- **`sop_steps`** - Individual SOP steps with ordering
- **`folder_templates`** - Chat folder organization by user role

Full schema: `/supabase/migrations/`

---

## 🔐 Authentication & OAuth

### Microsoft OAuth Flow
1. User clicks "Connect Email" → `/microsoft-auth?user_id=<uuid>`
2. Backend generates OAuth URL → Redirects to Microsoft login
3. Microsoft redirects back → `/auth/microsoft/callback?code=<code>&state=<state>`
4. Backend exchanges code for access/refresh tokens
5. Tokens stored in `user_microsoft_tokens` table
6. Success! Email integration active ✅

### Current OAuth Configuration
- **Client ID:** `41f6dc82-8127-4330-97e0-c6b26e6aa967`
- **Tenant:** `common` (multitenant)
- **Scopes:** Mail.Read, User.Read, MailboxSettings.Read, offline_access
- **Redirect URI (Local):** `http://localhost:8888/auth/microsoft/callback`
- **Redirect URI (Production):** `https://celeste7.ai/auth/microsoft/callback` ⚠️ **Must update in Azure Portal**

---

## 🎯 Critical Files for Cloud Deployment

### ⚠️ Must Update for Cloud:

1. **`server/routes/webhookRoutes.ts`** (Line 64)
   - Replace: `http://localhost:5678` 
   - With: `https://api.celeste7.ai`

2. **`server/routes/emailRoutes.ts`** (Lines 19-21)
   - Update redirect URI to production URL

3. **`client/config/webhookConfig.ts`**
   - Update webhook base URL to cloud n8n

4. **`server/services/emailSupabaseIntegration.ts`**
   - Supabase URL (currently hardcoded localhost)

5. **`vite.config.ts`** (Line 11)
   - Port configuration (currently 8888)

### ✅ Media Assets Verified:
- `/public/Logo.png` - CelesteOS logo (512x512)
- `/public/background.png` - Main background image
- `/public/DAKR MODE BACKGROUND.png` - Dark mode background
- `/public/placeholder.svg` - Placeholder graphic

---

## 🐛 Known Issues & Cloud Migration TODOs

### Required for Vercel Deployment:
- [ ] Replace all `localhost:5678` → `https://api.celeste7.ai/webhook`
- [ ] Replace all `localhost:54321` → cloud Supabase URL
- [ ] Update Azure OAuth redirect URI to production domain
- [ ] Configure Vercel environment variables (see above)
- [ ] Test webhook connectivity with cloud n8n instance
- [ ] Verify Supabase RLS policies for production access
- [ ] Update CORS settings for production domain
- [ ] Configure custom domain DNS (celeste7.ai)

### Local-Only Components (Not Needed for Vercel):
- ❌ Caddy reverse proxy (`/dev-proxy/`) - Vercel handles this
- ❌ Local n8n instance - Moving to cloud at `api.celeste7.ai`
- ❌ Local Supabase - Using cloud instance
- ❌ Ollama local LLM - Moving to cloud APIs

---

## 📚 Additional Documentation

- **`DEPLOYMENT.md`** - Complete Vercel deployment guide
- **`CLOUD_CONFIG.md`** - Cloud service configuration details
- **`README_LOCAL_DEV.md`** - Original local development guide (backup)
- **`docs/SOP_FEATURE_GUIDE.md`** - SOP editor documentation
- **`docs/features/`** - Feature-specific implementation guides

---

## 🤝 Handoff to Claude Code (Web)

### Context
This repository is being transitioned from **local development** (localhost:8888) to **cloud deployment** via Vercel.

### Your Mission
1. **Update all service URLs** from localhost to cloud endpoints
2. **Configure Vercel** environment variables and build settings
3. **Test & verify** cloud integrations (Supabase, n8n, Microsoft OAuth)
4. **Deploy to production** at celeste7.ai

### Key Points
- ✅ Code is production-ready and tested locally
- ✅ All media assets included in `/public/`
- ✅ Database schema deployed to cloud Supabase
- ⚠️ Service URLs need updating (localhost → cloud)
- ⚠️ Environment variables must be configured in Vercel
- ⚠️ Azure OAuth redirect URI needs manual update

### Quick Reference
- **Cloud Supabase:** https://vivovcnaapmcfxxfhzxk.supabase.co
- **Cloud n8n:** https://api.celeste7.ai/webhook/
- **Target Domain:** https://celeste7.ai
- **Deployment Platform:** Vercel
- **Tech Stack:** React + Vite + Express + TypeScript

### Next Steps
See **`DEPLOYMENT.md`** for step-by-step Vercel deployment instructions.

---

## 📞 Support & Documentation

For deployment questions, refer to:
- `DEPLOYMENT.md` - Complete deployment guide
- `CLOUD_CONFIG.md` - Cloud service configuration
- GitHub Issues: https://github.com/shortalex12333/c.os.4.1/issues

---

**Version:** 4.1  
**Last Updated:** November 2025  
**Status:** 🚀 Ready for cloud deployment  
**Repository:** https://github.com/shortalex12333/c.os.4.1
