# CelesteOS Portal - Integration Plan for Existing Vercel Site

**Date:** 2025-10-16
**Target Site:** celeste7.ai (landing-page-signup project)
**Framework:** Vite + React + TypeScript + shadcn/ui

---

## Current Site Analysis

**Existing Structure:**
```
├── src/
│   ├── App.tsx                    # Main React app
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── SignupForm.tsx         # Landing page signup
│   │   └── ui/                    # shadcn/ui components (50+ components)
│   ├── styles/
│   │   └── globals.css
│   └── assets/
├── src/api/
│   └── webhook.js                 # Vercel serverless function
├── index.html
├── package.json
├── vercel.json
└── vite.config.ts
```

**What We Have:**
- React + TypeScript + Vite
- shadcn/ui component library (cards, buttons, forms, inputs, etc.)
- Existing email collection workflow
- Vercel serverless functions
- Production domains: celeste7.ai, www.celeste7.ai

---

## Integration Approach

### Option 1: Add Portal as React Routes (RECOMMENDED)

**Why This Approach:**
- Integrates seamlessly with existing React app
- Reuses shadcn/ui components for consistency
- Single deployment pipeline
- No routing conflicts
- Better for SEO and user experience

**Structure:**
```
├── src/
│   ├── App.tsx                           # Add React Router
│   ├── pages/
│   │   ├── Landing.tsx                   # Current landing page
│   │   └── portal/
│   │       ├── Login.tsx                 # Portal login (converted from HTML)
│   │       ├── Dashboard.tsx             # Portal dashboard
│   │       └── Download.tsx              # Portal download
│   ├── components/
│   │   ├── SignupForm.tsx                # Keep existing
│   │   ├── portal/
│   │   │   ├── LoginForm.tsx             # Portal-specific components
│   │   │   ├── TwoFactorForm.tsx
│   │   │   └── YachtInfo.tsx
│   │   └── ui/                           # Keep all shadcn components
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase client
│   │   ├── n8n.ts                        # n8n webhook client
│   │   └── config.ts                     # App configuration
│   └── hooks/
│       ├── useAuth.ts                    # Authentication hook
│       └── useSession.ts                 # Session management hook
```

**Routes:**
- `/` → Landing page (current)
- `/portal/login` → Portal login
- `/portal/dashboard` → Portal dashboard
- `/portal/download` → Portal download page

---

## Step-by-Step Integration

### Step 1: Add Required Dependencies

```bash
npm install @supabase/supabase-js react-router-dom
npm install -D @types/react-router-dom
```

### Step 2: Create Configuration Files

**File: `src/lib/config.ts`**
```typescript
export const CONFIG = {
  supabase: {
    url: 'https://vivovcnaapmcfxxfhzxk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Your anon key
  },
  n8n: {
    webhooks: {
      login: 'https://YOUR-N8N-INSTANCE.com/webhook/user-login',
      verify2FA: 'https://YOUR-N8N-INSTANCE.com/webhook/verify-2fa',
      downloadRequest: 'https://YOUR-N8N-INSTANCE.com/webhook/download-request'
    }
  }
};
```

**File: `src/lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

export const supabase = createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);
```

**File: `src/lib/n8n.ts`**
```typescript
import { CONFIG } from './config';

export const n8nAPI = {
  async login(userId: string, email: string) {
    const response = await fetch(CONFIG.n8n.webhooks.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email })
    });
    return response.json();
  },

  async verify2FA(userId: string, code: string) {
    const response = await fetch(CONFIG.n8n.webhooks.verify2FA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, code })
    });
    return response.json();
  },

  async requestDownload(sessionToken: string) {
    const response = await fetch(CONFIG.n8n.webhooks.downloadRequest, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: sessionToken })
    });
    return response.json();
  }
};
```

### Step 3: Update App.tsx with Router

**File: `src/App.tsx`**
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import PortalLogin from './pages/portal/Login';
import PortalDashboard from './pages/portal/Dashboard';
import PortalDownload from './pages/portal/Download';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal/dashboard" element={<PortalDashboard />} />
        <Route path="/portal/download" element={<PortalDownload />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### Step 4: Move Landing Page to Separate Component

**File: `src/pages/Landing.tsx`**
```typescript
// Move current App.tsx content here
// Keep existing SignupForm and landing page structure
import SignupForm from '../components/SignupForm';

export default function Landing() {
  return (
    <div>
      {/* Your existing landing page */}
      <SignupForm />
    </div>
  );
}
```

---

## Converting HTML Portal to React

### Portal Login Page

**File: `src/pages/portal/Login.tsx`**
- Uses shadcn/ui `<Card>`, `<Input>`, `<Button>` components
- State management with React hooks
- Integrates Supabase Auth
- Calls n8n webhooks for 2FA

### Portal Dashboard Page

**File: `src/pages/portal/Dashboard.tsx`**
- Uses shadcn/ui `<Card>`, `<Badge>` components
- Fetches yacht data from Supabase
- Protected route (requires session)

### Portal Download Page

**File: `src/pages/portal/Download.tsx`**
- Displays download information
- Shows download link with expiration
- Uses shadcn/ui components for consistency

---

## Design: Minimal Black/White (shadcn/ui)

**Color Scheme:**
- Background: White or light gray
- Text: Black
- Borders: Gray
- Buttons: Black background, white text
- Status indicators: Green (active), Red (inactive), Yellow (pending)

**Typography:**
- Use existing shadcn/ui defaults
- Monospace for IDs/codes

**Components:**
- Use existing shadcn/ui components (Card, Button, Input, Badge, Separator)
- No custom styling beyond what's needed for functionality

---

## Deployment Steps

### 1. Add Files to Your GitHub Repo

Since your Vercel project isn't linked to GitHub yet, you'll need to:

1. **Create GitHub repo** (if you don't have one)
2. **Push existing code** to GitHub
3. **Link Vercel to GitHub** (for auto-deployments)

OR

**Continue using Vercel CLI** for manual deployments:
```bash
vercel --prod
```

### 2. Update Environment Variables

In Vercel Dashboard:
```
VITE_SUPABASE_URL=https://vivovcnaapmcfxxfhzxk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_N8N_LOGIN_WEBHOOK=https://...
VITE_N8N_VERIFY_WEBHOOK=https://...
VITE_N8N_DOWNLOAD_WEBHOOK=https://...
```

### 3. Deploy

**Option A: GitHub Auto-Deploy (Recommended)**
```bash
git add .
git commit -m "Add CelesteOS portal"
git push origin main
# Vercel automatically deploys
```

**Option B: Vercel CLI**
```bash
vercel --prod
```

---

## Testing Checklist

After deployment:

- [ ] Landing page still works at `https://celeste7.ai`
- [ ] Portal login accessible at `https://celeste7.ai/portal/login`
- [ ] Can create test user in Supabase
- [ ] Login flow works (email + password)
- [ ] 2FA code received via email
- [ ] 2FA verification works
- [ ] Dashboard loads with yacht info
- [ ] Download request works
- [ ] Logout clears session

---

## Files to Create

I will now create all necessary React component files:

1. `src/lib/config.ts` - Configuration
2. `src/lib/supabase.ts` - Supabase client
3. `src/lib/n8n.ts` - n8n API client
4. `src/hooks/useAuth.ts` - Authentication hook
5. `src/hooks/useSession.ts` - Session hook
6. `src/pages/Landing.tsx` - Landing page
7. `src/pages/portal/Login.tsx` - Portal login
8. `src/pages/portal/Dashboard.tsx` - Portal dashboard
9. `src/pages/portal/Download.tsx` - Portal download
10. `src/components/portal/LoginForm.tsx` - Login form component
11. `src/components/portal/TwoFactorForm.tsx` - 2FA form component
12. `src/components/portal/YachtInfo.tsx` - Yacht info component

---

## Next Steps

1. Review this integration plan
2. I'll create all React component files
3. You add them to your existing site
4. Deploy to Vercel
5. Test complete flow

**Estimated Time:** 1-2 hours to integrate + test

---

**Status:** Ready to create component files
**Action Required:** Confirm approach, then I'll generate all files
