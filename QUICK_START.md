# CelesteOS Bridge - Quick Start Guide

Get the CelesteOS Bridge up and running in under 30 minutes.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [n8n Workflow Setup](#n8n-workflow-setup)
5. [Running the Application](#running-the-application)
6. [Verification](#verification)
7. [Common Issues](#common-issues)
8. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

Before starting, ensure you have:

- **Node.js** 18 or higher
  ```bash
  node --version  # Should show v18.x.x or higher
  ```

- **npm** or **yarn**
  ```bash
  npm --version   # Should show 9.x.x or higher
  ```

- **Git**
  ```bash
  git --version
  ```

### Required Services

You'll need accounts/access to:

1. **Supabase** (Database + Auth)
   - Sign up at https://supabase.com
   - Or run local Supabase (see Database Configuration)

2. **n8n** (Workflow automation)
   - Install locally or use cloud version
   - Needs to be accessible at `localhost:5678`

3. **OpenAI** (GPT-4o API)
   - Get API key from https://platform.openai.com

### Optional Services

- **Vercel** (for deployment)
- **Redis** (for caching - optional)

---

## Initial Setup

### 1. Navigate to Project

The project is already on your machine:

```bash
cd /Users/celeste7/Documents/NEWSITE
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages (may take 2-3 minutes).

### 3. Environment Configuration

The project uses two environment files:

#### `.env` (Public variables)

Already exists with basic configuration. No changes needed.

```env
VITE_SETTINGS_GLASS=1
PING_MESSAGE="ping pong"
```

#### `.env.supabase.local` (Credentials)

Create this file with your Supabase credentials:

```bash
cp .env.supabase.local.example .env.supabase.local
```

Edit `.env.supabase.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Microsoft OAuth (for Email Search)
VITE_MICROSOFT_CLIENT_ID=your-client-id
VITE_MICROSOFT_TENANT_ID=common

# Optional: OpenAI API
OPENAI_API_KEY=sk-your-key-here
```

**Getting Supabase Credentials:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Database Configuration

### Option A: Use Existing Cloud Supabase (Recommended)

If you already have a Supabase project:

1. **Apply Migrations**:
```bash
# Connect to your Supabase project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

2. **Verify Tables**:
```bash
# Check if tables were created
npx supabase db execute --sql "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

You should see tables like:
- `chat_sessions`
- `messages`
- `documents`
- `email_threads`
- `sop_documents`

### Option B: Local Supabase (Development)

If you want to run Supabase locally:

1. **Install Supabase CLI**:
```bash
brew install supabase/tap/supabase
```

2. **Start Local Supabase**:
```bash
npx supabase start
```

This will:
- Start PostgreSQL on port 54322
- Start Supabase Studio on port 54323
- Generate local credentials

3. **Use Local Credentials**:

After `supabase start`, copy the output credentials to `.env.supabase.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbG... (from output)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (from output)
```

4. **Apply Migrations**:
```bash
npx supabase db reset
```

### Create Test User

Create a test account for development:

```sql
-- Run in Supabase SQL Editor or psql
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

Or use the SQL file:

```bash
npx supabase db execute --file create_test_user.sql
```

---

## n8n Workflow Setup

### Install n8n

**Option A: Docker (Recommended)**

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: npm**

```bash
npm install -g n8n
n8n start
```

### Import Workflows

1. **Open n8n**:
```
http://localhost:5678
```

2. **Import Workflow Files**:

Navigate to `docs/n8n_workflows/` and import:

- `n8n_email_search_final_workflow.json` - Email Search
- `yacht_search_workflow.json` - Yacht Search (if exists)
- `sop_creation_workflow.json` - SOP Creation (if exists)

**Steps**:
1. Click "Workflows" in n8n dashboard
2. Click "Import from File"
3. Select JSON file
4. Click "Import"

### Configure Webhooks

Each workflow needs webhook URLs configured:

**Yacht Search Webhook**:
- URL: `http://localhost:5678/webhook/yacht-search`
- Method: POST
- Authentication: None (for local dev)

**Email Search Webhook**:
- URL: `http://localhost:5678/webhook/email-search`
- Method: POST
- Authentication: None (for local dev)

**SOP Creation Webhook**:
- URL: `http://localhost:5678/webhook/sop-creation`
- Method: POST
- Content-Type: multipart/form-data
- Authentication: None (for local dev)

### Add Credentials

In n8n, add credentials for:

1. **OpenAI**:
   - Go to Credentials → Add Credential → OpenAI
   - Enter your API key
   - Test connection

2. **Microsoft Graph** (for Email Search):
   - Go to Credentials → Add Credential → Microsoft OAuth2
   - Enter Client ID and Client Secret
   - Set redirect URL: `http://localhost:8082/auth/microsoft/callback`

3. **Supabase**:
   - Add PostgreSQL credential
   - Host: From your Supabase URL (extract domain)
   - Database: `postgres`
   - User: `postgres`
   - Password: Your Supabase password
   - Port: 5432

### Activate Workflows

For each imported workflow:
1. Open the workflow
2. Click "Active" toggle in top-right
3. Verify "Active" badge appears
4. Test webhook with curl (see Verification section)

---

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

This will:
- Start Vite dev server on port 8082
- Enable Hot Module Replacement (HMR)
- Compile TypeScript on-the-fly
- Start Express backend

**Output should show**:
```
VITE v6.2.2  ready in 543 ms

  ➜  Local:   http://localhost:8082/
  ➜  Network: http://192.168.1.100:8082/
  ➜  press h to show help
```

### Access the Application

Open your browser to:
- **Local**: http://localhost:8082
- **LAN** (from other devices): http://h3.celeste7.ai:8888

You should see the CelesteOS Bridge login screen.

### Login

Use the test credentials you created earlier:
- Email: `test@example.com`
- Password: `password123`

---

## Verification

### 1. Check Frontend

- [ ] Login page loads
- [ ] Can log in with test credentials
- [ ] Sidebar shows three buttons:
  - Yacht Search
  - Email Search
  - SOP Creation
- [ ] Dark/light mode toggle works
- [ ] New chat opens

### 2. Test Yacht Search

```bash
# Test yacht search webhook
curl -X POST http://localhost:5678/webhook/yacht-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I change the oil filter?",
    "session_id": "test-session-123",
    "user_id": "test-user-123"
  }'
```

Expected response: JSON with search results

### 3. Test SOP Creation

```bash
# Test SOP webhook with a small file
curl -X POST http://localhost:5678/webhook/sop-creation \
  -F "files=@test.pdf" \
  -F "session_id=test-session-123" \
  -F "user_id=test-user-123" \
  -F "prompt=Generate a safety checklist"
```

Expected response: JSON with SOP data

### 4. Test Database Connection

```bash
# Query chat sessions
npx supabase db execute --sql "SELECT COUNT(*) FROM chat_sessions;"
```

Expected: Returns count (may be 0 if no chats yet)

### 5. Frontend-to-Backend Flow

1. Open http://localhost:8082
2. Log in
3. Click "Yacht Search"
4. Type: "test query"
5. Click send
6. Check browser console (F12)
7. Verify:
   - No errors
   - Webhook request sent
   - Response received

### 6. Check Background Dev Server

The dev server should be running in the background:

```bash
# Check if bash process is running
# (from conversation history, ID: 367612)
```

If you need to restart it:

```bash
cd /Users/celeste7/Documents/NEWSITE && npm run dev
```

---

## Common Issues

### Issue 1: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::8082`

**Solution**:
```bash
# Find process using port 8082
lsof -i :8082

# Kill process
kill -9 <PID>

# Restart dev server
npm run dev
```

### Issue 2: Supabase Connection Failed

**Error**: `Failed to fetch` or `CORS error`

**Solutions**:
1. Verify Supabase URL in `.env.supabase.local`
2. Check if Supabase project is running (cloud dashboard or local)
3. Verify API keys are correct
4. Check CORS settings in Supabase dashboard

### Issue 3: n8n Webhooks Not Responding

**Error**: `ERR_CONNECTION_REFUSED` to localhost:5678

**Solutions**:
1. Verify n8n is running:
   ```bash
   curl http://localhost:5678/
   ```
2. Check workflows are activated in n8n dashboard
3. Review n8n logs:
   ```bash
   # Docker
   docker logs n8n

   # npm
   # Check terminal where n8n was started
   ```

### Issue 4: Authentication Errors

**Error**: `Session undefined` or `Invalid JWT`

**Solutions**:
1. Clear browser localStorage:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
2. Re-login
3. Verify Supabase JWT secret in environment variables
4. Check RLS policies in Supabase:
   ```sql
   SELECT * FROM policies WHERE tablename = 'chat_sessions';
   ```

### Issue 5: Build Fails

**Error**: `TypeScript error` or `Module not found`

**Solutions**:
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check TypeScript errors:
   ```bash
   npm run typecheck
   ```
3. Verify all dependencies are installed:
   ```bash
   npm ls
   ```

### Issue 6: Files Won't Upload (SOP)

**Error**: File upload fails silently

**Solutions**:
1. Check file size (must be < 50MB)
2. Verify file is PDF format
3. Check browser console for errors
4. Verify n8n SOP workflow is active
5. Test webhook directly:
   ```bash
   curl -X POST http://localhost:5678/webhook/sop-creation \
     -F "files=@small_test.pdf"
   ```

---

## Next Steps

### For Development

1. **Read the Documentation**:
   - [README_COMPREHENSIVE.md](README_COMPREHENSIVE.md) - Full project overview
   - [docs/INDEX.md](docs/INDEX.md) - Documentation index
   - [docs/SOP_FEATURE_GUIDE.md](docs/SOP_FEATURE_GUIDE.md) - SOP feature details

2. **Explore the Codebase**:
   - `client/AppFigma.tsx` - Main application logic
   - `client/components/layout/` - Core UI components
   - `client/services/` - API integrations
   - `server/` - Backend Express server

3. **Set Up IDE**:
   - Install recommended extensions (ESLint, Prettier, TypeScript)
   - Configure auto-format on save
   - Enable TypeScript checking

4. **Test All Features**:
   - Yacht Search - try various queries
   - Email Search - connect Microsoft account
   - SOP Creation - upload a test PDF

### For Deployment

1. **Review Deployment Docs**:
   - [docs/deployment/VERCEL_SETUP.md](docs/deployment/VERCEL_SETUP.md)
   - [docs/deployment/DEPLOYMENT_COMPLETE.md](docs/deployment/DEPLOYMENT_COMPLETE.md)

2. **Set Up CI/CD**:
   - Connect GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Set up automatic deployments

3. **Configure Production Services**:
   - Use production Supabase instance
   - Set up cloud n8n instance
   - Configure custom domain

### For Contributing

1. **Read Standards**:
   - Review code style guidelines
   - Understand component patterns
   - Follow naming conventions

2. **Set Up Git**:
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

3. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Run Tests Before Committing**:
   ```bash
   npm run typecheck
   npm test
   npm run format.fix
   ```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server
npm run typecheck       # Check TypeScript
npm test                # Run tests

# Database
npx supabase start      # Start local Supabase
npx supabase stop       # Stop local Supabase
npx supabase db push    # Apply migrations
npx supabase db reset   # Reset database

# Formatting
npm run format.fix      # Fix code formatting
```

### Important URLs

- **Frontend**: http://localhost:8082
- **n8n**: http://localhost:5678
- **Supabase Studio**: http://localhost:54323 (if local)
- **API Docs**: http://localhost:8082/api/docs (if implemented)

### Configuration Files

- `.env` - Public environment variables
- `.env.supabase.local` - Supabase credentials (DO NOT COMMIT)
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

### Key Directories

- `client/` - Frontend React code
- `server/` - Backend Express code
- `docs/` - All documentation
- `supabase/migrations/` - Database migrations
- `public/` - Static assets

---

## Getting Help

### Troubleshooting Steps

1. **Check this guide** for common issues
2. **Review documentation** in `docs/` directory
3. **Check browser console** for frontend errors
4. **Check server logs** for backend errors
5. **Review n8n workflow logs** for webhook issues
6. **Check Supabase logs** for database issues

### Debug Mode

Enable verbose logging by adding to `.env`:

```env
VITE_DEBUG=true
```

Then check browser console for detailed logs.

### Useful Debug Commands

```javascript
// In browser console

// Check authentication state
localStorage.getItem('supabase.auth.token')

// View current session
window.__SESSION__

// Force logout
localStorage.clear(); location.reload()

// Check uploaded files
window.__DEBUG_FILES__
```

---

## Success Checklist

You've successfully set up CelesteOS Bridge when:

- [ ] npm run dev starts without errors
- [ ] Can access frontend at localhost:8082
- [ ] Can log in with test credentials
- [ ] Sidebar shows all three search modes
- [ ] Can create a new chat session
- [ ] Yacht Search returns results (even test results)
- [ ] Can upload a file in SOP mode
- [ ] No errors in browser console
- [ ] Database queries work
- [ ] n8n webhooks respond

**If all items are checked, you're ready to develop! 🎉**

---

**Last Updated**: November 2025
**Estimated Setup Time**: 15-30 minutes
**Difficulty**: Intermediate

**Need help?** Check [docs/INDEX.md](docs/INDEX.md) for more resources.
