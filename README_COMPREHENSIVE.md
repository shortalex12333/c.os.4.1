# CelesteOS Bridge - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Quick Start](#quick-start)
5. [Development Guide](#development-guide)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [Known Issues](#known-issues)

---

## Project Overview

**CelesteOS Bridge** is a full-stack React/TypeScript application for yacht operations management with three primary search modes:

1. **Yacht Search** - RAG-based search for yacht maintenance documentation and operations manuals
2. **Email Search** - Outlook integration for searching and retrieving maritime correspondence
3. **SOP Creation** - AI-powered Standard Operating Procedure generation from uploaded manuals

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and HMR
- TailwindCSS for styling
- Radix UI component library
- React Router for routing
- TanStack Query for data fetching
- Framer Motion for animations

**Backend:**
- Express.js server
- Supabase (PostgreSQL) for database
- n8n for workflow automation (webhooks)
- Redis for caching (optional)
- ChromaDB with BGE embeddings for vector search

**Authentication:**
- Supabase Auth
- Microsoft OAuth for Outlook integration
- JWT token management with automatic refresh

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React SPA)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Yacht Search │  │ Email Search │  │ SOP Creation │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                      Express Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Webhook API  │  │  Auth Routes │  │  NAS Routes  │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          │ n8n Workflows
          │
┌─────────┼────────────────────────────────────────────────────┐
│    n8n Automation Server (localhost:5678)                    │
│  ┌──────┴───────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Yacht Search │  │ Email Search │  │ SOP Creation │      │
│  │  Workflow    │  │  Workflow    │  │  Workflow    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────┐
│    External Services & Databases                             │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐      │
│  │  ChromaDB    │  │ Outlook API  │  │  OpenAI API  │      │
│  │  + BGE       │  │  (Graph API) │  │  (GPT-4o)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │      Supabase PostgreSQL (Database + Auth)         │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Yacht Search Flow
1. User enters query → `AppFigma.tsx` handles input
2. Query sent to n8n webhook: `http://localhost:5678/webhook/yacht-search`
3. n8n workflow:
   - Embeds query using BGE model
   - Searches ChromaDB vector database
   - Retrieves relevant documentation chunks
   - Sends to GPT-4o for synthesis
4. Response streamed back to frontend
5. Results displayed in `ChatAreaReal.tsx` with `RAGSolutionCard` components

#### Email Search Flow
1. User authenticates with Microsoft OAuth
2. Access tokens stored in Supabase
3. Query sent to n8n webhook: `http://localhost:5678/webhook/email-search`
4. n8n workflow:
   - Uses MS Graph API to search mailbox
   - Retrieves emails with metadata
   - Generates deep links for Outlook desktop
5. Results displayed with `EmailThreadCard` components
6. "Handover" feature generates task summaries

#### SOP Creation Flow (NEW)
1. User drags/drops PDF files (up to 50MB each, 150MB total)
2. Files uploaded to cloud endpoint: `https://api.celeste7.ai/webhook/sop-creation`
3. Fallback to localhost if cloud unavailable: `http://localhost:5678/webhook/sop-creation`
4. n8n workflow:
   - Extracts text from PDFs
   - Analyzes content structure
   - Uses GPT-4o to generate standardized SOP
   - Returns JSON with procedures, warnings, checklists
5. Results displayed in `SOPCanvasCard` with interactive editor
6. User can edit, save, export to PDF

---

## Key Features

### 1. Yacht Search (Document RAG)

**Files:**
- `client/AppFigma.tsx` - Main state management
- `client/components/layout/ChatAreaReal.tsx` - Chat interface
- `client/components/RAGSolutionCard.tsx` - Result cards
- `client/services/webhookService.ts` - API calls

**Key Implementation Details:**
- Vector embeddings using BGE-M3 model
- ChromaDB for semantic search
- Response streaming for real-time updates
- Confidence scores for search results
- "Ask AI" feature for follow-up questions on specific documents

### 2. Email Search (Outlook Integration)

**Files:**
- `client/api/outlook.ts` - Microsoft Graph API integration
- `client/components/email/EmailThreadCard.tsx` - Email display
- `client/components/HandoverModal.tsx` - Task handover UI
- `server/routes/emailRoutes.ts` - Backend email handling

**Key Implementation Details:**
- OAuth 2.0 flow for Microsoft authentication
- JWT token refresh every 55 minutes (token expires at 60 minutes)
- Deep links using `outlook:` protocol for desktop app
- Email metadata extraction and categorization
- Task handover generation for crew coordination

### 3. SOP Creation (LATEST FEATURE)

**Files:**
- `client/AppFigma.tsx:323-425` - File upload and webhook logic
- `client/components/layout/ChatAreaReal.tsx:178-337` - Drag-and-drop UI
- `client/components/canvas/SOPCanvasCard.tsx` - SOP display and editing
- `client/services/sopService.ts` - API service layer
- `client/components/sop-editor/SOPCanvasEditor.tsx` - Interactive editor

**Key Implementation Details:**

#### File Upload System
```typescript
// Maximum limits based on GPT-4o context window (128k tokens)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150MB total (~200 pages)
const MAX_FILES = 10;
```

#### Drag-and-Drop Implementation
- Works on both new conversations and existing chat sessions
- Global drop zone on `ChatAreaReal.tsx`
- File validation with user-friendly error messages
- Visual preview of uploaded files with remove functionality

#### UUID Generation Fix
The system requires proper RFC 4122 UUIDs for Supabase compatibility:

```typescript
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
```

#### Primary/Fallback Webhook Pattern
```typescript
// Try cloud endpoint first
const primaryEndpoint = 'https://api.celeste7.ai/webhook/sop-creation';
const fallbackEndpoint = 'http://localhost:5678/webhook/sop-creation';

try {
  const response = await fetch(primaryEndpoint, { timeout: 5000 });
  // Use primary
} catch (error) {
  // Fallback to localhost
  const response = await fetch(fallbackEndpoint);
}
```

#### UX Patterns
- **No Clarify Button**: SOP mode disables the "Clarify" feature (not applicable for file processing)
- **File Preview Cards**: Shows filename, size, and remove button before sending
- **Progress Indicators**: Loading states during upload and processing
- **Error Handling**: Clear error messages for file size, type, and upload failures

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (via Supabase)
- n8n instance running on `localhost:5678`
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
cd /Users/celeste7/Documents/NEWSITE
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env` file (already exists):
```env
VITE_SETTINGS_GLASS=1
PING_MESSAGE="ping pong"
```

Create `.env.supabase.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. **Start the development server**
```bash
npm run dev
```

The app will be available at:
- Local: `http://localhost:8082`
- LAN: `http://h3.celeste7.ai:8888`

### Database Setup

1. **Initialize Supabase**
```bash
# If using local Supabase
npx supabase start

# Apply migrations
npx supabase db push
```

2. **Required Tables**

The database includes the following main tables:
- `users` - User authentication and profiles
- `chat_sessions` - Conversation history
- `messages` - Individual chat messages
- `documents` - Yacht documentation metadata
- `email_threads` - Cached email data
- `sop_documents` - Generated SOPs

See `supabase/migrations/` for complete schema.

---

## Development Guide

### Running Locally

1. **Start Supabase** (if using local instance):
```bash
npx supabase start
```

2. **Start n8n**:
```bash
# n8n should be running on localhost:5678
# Import workflows from docs/n8n_workflows/
```

3. **Start development server**:
```bash
npm run dev
```

### Building for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Type checking
npm run typecheck
```

### Code Style

```bash
# Format code
npm run format.fix
```

---

## Project Structure

```
NEWSITE/
├── client/                      # Frontend React application
│   ├── components/              # React components
│   │   ├── layout/              # Main layout components
│   │   │   ├── ChatAreaReal.tsx      # Main chat interface
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── InputArea.tsx         # Message input
│   │   │   └── MainHeader.tsx        # Top navigation
│   │   ├── canvas/              # SOP editor components
│   │   │   ├── SOPCanvasCard.tsx     # SOP display card
│   │   │   └── CanvasMode.tsx        # Canvas editor mode
│   │   ├── email/               # Email-specific components
│   │   │   ├── EmailThreadCard.tsx   # Email result display
│   │   │   └── EmailResultsDisplay.tsx
│   │   ├── auth/                # Authentication components
│   │   │   ├── Login.tsx
│   │   │   └── MicrosoftOAuthModal.tsx
│   │   └── ui/                  # Reusable UI components (shadcn/ui)
│   ├── services/                # API and business logic
│   │   ├── webhookService.ts         # n8n webhook calls
│   │   ├── sopService.ts             # SOP creation API
│   │   ├── emailIntegration.ts       # Outlook integration
│   │   └── chatService.ts            # Chat management
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx           # Authentication state
│   │   ├── ThemeContext.tsx          # Dark/light mode
│   │   └── SettingsContext.tsx       # User preferences
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts                # Authentication hook
│   │   └── useTokenRefresh.ts        # Token refresh logic
│   ├── lib/                     # Utilities and configuration
│   │   ├── supabase.ts               # Supabase client
│   │   └── utils.ts                  # Helper functions
│   └── AppFigma.tsx             # Main application component
│
├── server/                      # Backend Express server
│   ├── routes/                  # API routes
│   │   ├── webhookRoutes.ts          # Webhook proxying
│   │   ├── emailRoutes.ts            # Email endpoints
│   │   └── nasRoutes.ts              # NAS integration
│   ├── services/                # Backend services
│   │   ├── emailServiceManager.ts    # Email service logic
│   │   └── nasService.ts             # NAS file access
│   └── index.ts                 # Server entry point
│
├── supabase/                    # Database configuration
│   └── migrations/              # SQL migration files
│
├── docs/                        # Documentation (see below)
│   ├── architecture/
│   ├── features/
│   └── n8n_workflows/
│
├── public/                      # Static assets
├── dist/                        # Build output
│
├── vite.config.ts               # Vite configuration
├── tailwind.config.ts           # TailwindCSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

### Key Files

| File | Purpose |
|------|---------|
| `client/AppFigma.tsx` | Main app logic, state management, routing |
| `client/components/layout/ChatAreaReal.tsx` | Chat interface, message display, drag-drop |
| `client/components/layout/Sidebar.tsx` | Navigation, new chat, search type selection |
| `client/components/layout/InputArea.tsx` | Message input, file upload UI |
| `client/services/webhookService.ts` | n8n webhook integration |
| `server/index.ts` | Express server setup |
| `server/routes/webhookRoutes.ts` | Proxy for n8n webhooks |

---

## Database Schema

### Core Tables

#### `chat_sessions`
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  search_type TEXT CHECK (search_type IN ('yacht', 'email', 'sop')),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sop_documents`
```sql
CREATE TABLE sop_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id),
  title TEXT,
  content JSONB, -- Structured SOP data
  source_files TEXT[], -- Original uploaded filenames
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data:

```sql
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## API Endpoints

### Frontend to Backend

#### Chat Session Management
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions` - List user's chat sessions
- `GET /api/chat/sessions/:id` - Get session details
- `DELETE /api/chat/sessions/:id` - Delete session

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

#### Email Integration
- `POST /api/email/search` - Search user's mailbox
- `GET /api/email/thread/:id` - Get email thread details
- `POST /api/email/handover` - Generate handover document

### Backend to n8n Webhooks

#### Yacht Search
- **URL**: `http://localhost:5678/webhook/yacht-search`
- **Method**: POST
- **Body**:
```json
{
  "query": "How do I change the oil filter?",
  "session_id": "uuid",
  "user_id": "uuid"
}
```

#### Email Search
- **URL**: `http://localhost:5678/webhook/email-search`
- **Method**: POST
- **Body**:
```json
{
  "query": "emails about engine maintenance",
  "user_email": "user@example.com",
  "access_token": "jwt_token",
  "session_id": "uuid"
}
```

#### SOP Creation
- **Primary URL**: `https://api.celeste7.ai/webhook/sop-creation`
- **Fallback URL**: `http://localhost:5678/webhook/sop-creation`
- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `files[]`: PDF files (max 50MB each, 150MB total)
  - `session_id`: UUID
  - `user_id`: UUID
  - `prompt`: Optional instructions for SOP generation

**Response Format**:
```json
{
  "success": true,
  "sop": {
    "title": "Engine Oil Change Procedure",
    "sections": [
      {
        "type": "procedure",
        "title": "Pre-operation Checks",
        "steps": [
          "Ensure engine is cool",
          "Gather required tools"
        ]
      },
      {
        "type": "warning",
        "content": "Always wear protective equipment"
      },
      {
        "type": "checklist",
        "items": ["Oil filter", "New oil", "Drain pan"]
      }
    ]
  }
}
```

---

## Deployment

### Cloud Deployment (Vercel)

The application is deployed to Vercel with the following configuration:

1. **Build Settings**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

2. **Environment Variables** (set in Vercel dashboard):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_SETTINGS_GLASS
```

3. **Custom Domain**:
- Production: `https://celeste7.ai`
- Staging: `https://h3.celeste7.ai`

See `VERCEL_SETUP.md` for detailed deployment instructions.

### Local Production Build

```bash
# Build
npm run build

# Test production build
npm start
```

### Docker Deployment (Future)

A Dockerfile is not currently included but could be added:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Troubleshooting

### Common Issues

#### 1. Webhook Connection Failures

**Symptoms**: Queries return errors, no response from n8n

**Solutions**:
- Verify n8n is running: `curl http://localhost:5678/health`
- Check webhook URLs in `client/config/webhookConfig.ts`
- Review n8n workflow logs
- For SOP, ensure primary endpoint is accessible or fallback works

#### 2. Authentication Errors

**Symptoms**: "Session undefined" errors, unable to login

**Solutions**:
- Check Supabase connection in browser console
- Verify `.env.supabase.local` has correct credentials
- Clear browser cookies and localStorage
- Check if user exists in Supabase dashboard

#### 3. File Upload Failures (SOP)

**Symptoms**: Files don't upload, size errors

**Solutions**:
- Verify file size < 50MB per file, < 150MB total
- Check file type is PDF, DOC, DOCX, or TXT
- Ensure n8n workflow has file handling enabled
- Check browser console for detailed error messages

#### 4. Token Refresh Issues

**Symptoms**: "Token expired" errors, forced re-login

**Solutions**:
- Token refresh runs every 55 minutes (see `client/hooks/useTokenRefresh.ts`)
- Check Supabase JWT expiration settings
- Review `client/services/tokenRefreshService.ts` logs
- Ensure user session is valid in Supabase

#### 5. Database Connection Issues

**Symptoms**: "Failed to fetch" errors, no data loading

**Solutions**:
- Verify Supabase project is running (check dashboard)
- Test connection: `psql -h your-project.supabase.co -U postgres`
- Check RLS policies allow user access
- Review Supabase logs for SQL errors

#### 6. Build Failures

**Symptoms**: `npm run build` fails

**Solutions**:
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run typecheck`
- Review build logs for specific file errors
- Ensure all environment variables are set

### Debug Mode

Enable verbose logging:

```typescript
// Add to client/lib/config.ts
export const DEBUG = true;

// In components
if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Browser Console Commands

```javascript
// Check authentication state
localStorage.getItem('supabase.auth.token')

// View current session
console.log(window.__SESSION__)

// Force token refresh
window.__FORCE_TOKEN_REFRESH__()

// Clear all local data
localStorage.clear()
sessionStorage.clear()
```

---

## Known Issues

### Critical Issues

1. **n8n Dependency**: Application requires n8n to be running locally. No graceful degradation if n8n is down.
   - **Workaround**: Implement fallback mock responses for development
   - **Future Fix**: Add retry logic and better error handling

2. **OAuth Token Storage**: Microsoft OAuth tokens stored in localStorage (not ideal for security)
   - **Workaround**: Tokens are short-lived (60 minutes)
   - **Future Fix**: Use httpOnly cookies for token storage

3. **File Upload Size Limits**: Browser memory constraints for large files
   - **Current Limit**: 50MB per file
   - **Future Fix**: Implement chunked uploads for files > 50MB

### Minor Issues

4. **Mobile Drag-and-Drop**: Not supported on iOS Safari
   - **Workaround**: File input button works on all devices
   - **Future Fix**: Add iOS-specific file upload UX

5. **Dark Mode Flicker**: Brief flash of light mode on page load
   - **Workaround**: Theme loads from localStorage
   - **Future Fix**: Server-side theme injection

6. **Clarify Button in SOP Mode**: Disabled but still shows briefly during render
   - **Status**: Fixed by conditional rendering (see line 298 in ChatAreaReal.tsx)

### Performance Considerations

7. **Large Chat History**: Scrolling performance degrades with 100+ messages
   - **Mitigation**: Virtualized scrolling using `react-window` (not implemented)
   - **Current Behavior**: Loads all messages, pagination on server

8. **Webhook Timeouts**: Long-running n8n workflows may timeout (default 30s)
   - **Current**: Timeout set to 120s for SOP creation
   - **Recommendation**: Implement WebSocket for long-running tasks

---

## Documentation Files

The repository includes extensive documentation in the root directory. These should be organized into `/docs`:

### Architecture Documents
- `ASK_AI_DATA_FLOW.md` - Ask AI feature implementation
- `ASK_AI_INTEGRATION_GUIDE.md` - Integration guide for Ask AI
- `DATABASE_GUIDE.md` - Database schema and setup

### Feature Implementations
- `SOP_CREATION_IMPLEMENTATION.md` - SOP feature overview
- `SOP_EDITOR_INTEGRATION.md` - SOP editor details
- `SOP_CANVAS_INTEGRATION.md` - Canvas editor integration
- `EMAIL_RAG_V4_COMPLETE_SUMMARY.md` - Email search implementation
- `FRONTEND_CHANGES_IMPLEMENTED.md` - UI/UX changes

### Bug Fixes and Issues
- `BUGFIXES_EMAIL_LINKS_HANDOVER.md` - Email link fixes
- `DOCUMENT_SEARCH_UX_FIX.md` - Search UX improvements
- `OAUTH_FIX_COMPLETE.md` - OAuth authentication fixes
- `TOKEN_REFRESH_IMPLEMENTATION.md` - Token refresh logic

### Deployment
- `VERCEL_SETUP.md` - Vercel deployment guide
- `INTEGRATION_COMPLETE.md` - Integration summary
- `INSTALLATION_INSTRUCTIONS.md` - Setup guide

### n8n Workflows
- `n8n_email_search_final_workflow.json` - Email search workflow
- `n8n_search_mode_test_cases.json` - Test cases

---

## Next Steps for Engineers

### Immediate Priorities

1. **Organize Documentation**
   - Move all `.md` files from root to `/docs` directory
   - Create subdirectories: `/docs/architecture`, `/docs/features`, `/docs/deployment`

2. **Implement Error Handling**
   - Add global error boundary
   - Improve webhook failure recovery
   - Add retry logic for failed requests

3. **Testing**
   - Write unit tests for critical components
   - Add E2E tests with Playwright
   - Test SOP creation with various PDF formats

4. **Performance Optimization**
   - Implement virtual scrolling for chat history
   - Add request debouncing
   - Optimize bundle size (currently ~2MB)

### Future Enhancements

5. **SOP Feature Improvements**
   - Add SOP versioning and history
   - Implement collaborative editing
   - Add export to Word/Excel formats
   - Support more file types (DOCX, XLSX)

6. **Email Search Enhancements**
   - Add Gmail integration
   - Implement email categorization
   - Add calendar integration for scheduling

7. **Yacht Search Improvements**
   - Add full-text search fallback
   - Implement search filters (date, category, vessel)
   - Add bookmarking and favorites

8. **Infrastructure**
   - Set up CI/CD pipeline
   - Add monitoring and alerting (Sentry, DataDog)
   - Implement rate limiting
   - Add caching layer (Redis)

---

## Contact and Support

For questions or issues:

1. Check this documentation first
2. Review existing documentation in `/docs` directory
3. Check Supabase logs for database issues
4. Review n8n workflow logs for webhook issues
5. Check browser console for frontend errors

---

## License

Proprietary - CelesteOS Bridge
© 2024-2025 Celeste Seven

---

**Last Updated**: November 2025
**Version**: 2.1.0 (SOP Creation Feature)
**Maintained By**: Development Team
