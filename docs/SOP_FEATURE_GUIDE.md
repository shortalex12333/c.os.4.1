# SOP Creation Feature - Complete Developer Guide

## Table of Contents
1. [Overview](#overview)
2. [User Experience Flow](#user-experience-flow)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Details](#implementation-details)
5. [File Upload System](#file-upload-system)
6. [Webhook Integration](#webhook-integration)
7. [Frontend Components](#frontend-components)
8. [Bug Fixes Applied](#bug-fixes-applied)
9. [Known Limitations](#known-limitations)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The **SOP Creation** feature allows users to upload PDF manuals and automatically generate Standard Operating Procedures (SOPs) using GPT-4o. This feature was implemented to match the existing UX patterns of Yacht Search and Email Search, providing a consistent chat-based interface.

### Key Capabilities

- **Drag-and-drop file upload** from Finder/Explorer
- **Multi-file support** (up to 10 files, 150MB total)
- **File size limits** appropriate for GPT-4o context window
- **Primary/fallback webhook** architecture for reliability
- **Interactive SOP editor** with export to PDF
- **Chat-based UX** matching existing search modes

### Design Philosophy

The SOP feature was designed to:
1. **Match existing UX patterns** - Uses same chat interface as Yacht/Email search
2. **Be discoverable** - Visible button in sidebar (desktop and mobile)
3. **Handle large documents** - Supports up to 200 pages of text content
4. **Degrade gracefully** - Falls back from cloud to localhost if needed
5. **Provide immediate feedback** - Shows uploaded files before sending

---

## User Experience Flow

### 1. Starting SOP Creation

**Desktop:**
```
User clicks "SOP Creation" button in sidebar
  ↓
New chat session created with searchType='sop'
  ↓
Chat interface opens with file upload capability
```

**Mobile:**
```
User taps hamburger menu
  ↓
Taps "SOP Creation" in drawer
  ↓
Drawer closes, chat interface opens
```

### 2. Uploading Files

**Method A: Drag and Drop**
```
User drags PDF from Finder/Explorer
  ↓
Hover over chat area (drop zone activates)
  ↓
Drop files (validated immediately)
  ↓
File preview cards appear above input
```

**Method B: File Button**
```
User clicks upload button (📎 icon in input area)
  ↓
File picker opens
  ↓
User selects files
  ↓
File preview cards appear
```

### 3. Submitting Request

```
User types optional instructions (e.g., "Focus on safety procedures")
  ↓
Clicks send button
  ↓
Files uploaded to webhook (with retry logic)
  ↓
Progress indicator shows
  ↓
SOP generated and streamed back
  ↓
SOPCanvasCard displays result
```

### 4. Editing and Exporting

```
SOP appears in chat as interactive card
  ↓
User can edit sections, add notes
  ↓
Click "Export to PDF" to download
  ↓
Click "Save" to store in database
```

---

## Technical Architecture

### Component Hierarchy

```
AppFigma.tsx (State Management)
│
├─ Sidebar.tsx (Navigation)
│  └─ SOP Creation Button
│
├─ ChatAreaReal.tsx (Main Interface)
│  ├─ Drag-and-Drop Zone
│  ├─ File Preview Cards
│  └─ Message Display
│     └─ SOPCanvasCard.tsx (SOP Display)
│
├─ InputArea.tsx (User Input)
│  ├─ Text Input
│  ├─ File Upload Button (SOP mode only)
│  └─ Send Button
│
└─ Services
   ├─ sopService.ts (API calls)
   └─ webhookService.ts (Webhook handling)
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Action: Upload Files + Send Message                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  AppFigma.handleSendMessage()                                │
│  - Creates FormData with files                               │
│  - Generates UUID for session                                │
│  - Adds message to chat state                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Primary Webhook: https://api.celeste7.ai/webhook/sop       │
│  - Timeout: 5 seconds                                        │
│  - If fails → Fallback                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ (on failure)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Fallback Webhook: http://localhost:5678/webhook/sop        │
│  - Timeout: 120 seconds (long-running)                       │
│  - Retry on network error                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  n8n Workflow Processing                                     │
│  1. Receive multipart/form-data                              │
│  2. Extract text from PDFs                                   │
│  3. Send to GPT-4o with SOP generation prompt               │
│  4. Parse structured SOP response                            │
│  5. Return JSON                                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Rendering                                          │
│  - Parse SOP JSON                                            │
│  - Render SOPCanvasCard                                      │
│  - Enable editing/export                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### File Structure

```
client/
├── AppFigma.tsx
│   └── Lines 323-425: SOP webhook handling
│
├── components/layout/
│   ├── Sidebar.tsx
│   │   └── Lines 1363-1400: SOP button (desktop)
│   │   └── Lines 1200-1235: SOP button (mobile drawer)
│   │
│   ├── ChatAreaReal.tsx
│   │   └── Lines 178-337: Drag-and-drop implementation
│   │   └── Lines 298-320: Clarify button removal (SOP mode)
│   │   └── Lines 450-550: SOPCanvasCard rendering
│   │
│   └── InputArea.tsx
│       └── Lines 235-255: File upload button (SOP mode only)
│       └── Lines 190-210: File preview cards
│
├── components/canvas/
│   └── SOPCanvasCard.tsx
│       └── Complete SOP display and editing logic
│
└── services/
    └── sopService.ts
        └── API calls for generate, save, export
```

### Key Code Sections

#### 1. UUID Generation (AppFigma.tsx)

**Problem**: Supabase requires RFC 4122 compliant UUIDs, but initial implementation used timestamps like `session_1761957870171`

**Solution**:
```typescript
const generateUUID = () => {
  // Use native crypto API if available
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

**Location**: `client/AppFigma.tsx:50-60`

#### 2. Drag-and-Drop Implementation (ChatAreaReal.tsx)

**Features**:
- Works on both new and existing conversations
- Validates file size and type on drop
- Provides visual feedback (hover state)
- Shows preview cards before sending

```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  const files = Array.from(e.dataTransfer.files);
  const pdfFiles = files.filter(file =>
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );

  // Validate total size
  const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);
  const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150MB

  if (totalSize > MAX_TOTAL_SIZE) {
    alert('Total file size exceeds 150MB limit');
    return;
  }

  // Validate individual file size
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const oversizedFiles = pdfFiles.filter(f => f.size > MAX_FILE_SIZE);

  if (oversizedFiles.length > 0) {
    alert(`Files exceed 50MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
    return;
  }

  // Add to state
  onFileUpload?.(pdfFiles);
};
```

**Location**: `client/components/layout/ChatAreaReal.tsx:200-235`

#### 3. Primary/Fallback Webhook Pattern (AppFigma.tsx)

**Architecture**: Try cloud endpoint first, fallback to localhost if unavailable

```typescript
const sendSOPRequest = async (formData: FormData) => {
  const primaryEndpoint = 'https://api.celeste7.ai/webhook/sop-creation';
  const fallbackEndpoint = 'http://localhost:5678/webhook/sop-creation';

  try {
    // Try primary endpoint with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(primaryEndpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }

    throw new Error('Primary endpoint failed');

  } catch (primaryError) {
    console.warn('Primary endpoint unavailable, trying fallback:', primaryError);

    // Fallback to localhost with longer timeout
    const response = await fetch(fallbackEndpoint, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120000) // 2 minutes for long processing
    });

    if (!response.ok) {
      throw new Error('Both endpoints failed');
    }

    return await response.json();
  }
};
```

**Location**: `client/AppFigma.tsx:350-390`

#### 4. Removing Clarify Button in SOP Mode (ChatAreaReal.tsx)

**Design Decision**: The "Clarify" feature doesn't make sense for SOP creation (it's for asking follow-up questions about specific search results)

```typescript
{currentSearchType !== 'sop' && (
  <button
    onClick={() => handleClarify(message.id, 'auto')}
    className="clarify-button"
  >
    <span>Clarify</span>
  </button>
)}
```

**Location**: `client/components/layout/ChatAreaReal.tsx:298-307`

---

## File Upload System

### File Size Limits

Based on GPT-4o's context window (128k tokens):

```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024;      // 50MB per file
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;    // 150MB total
const MAX_FILES = 10;                         // Maximum number of files
```

**Rationale**:
- GPT-4o has 128k token context (~96k words)
- Target: 85k tokens for input (~200 pages of text)
- Buffer: 43k tokens for output and system prompts
- PDF text density: ~750 words/page
- 200 pages × 750 words = 150k words = ~50MB text content

### Supported File Types

```typescript
const ALLOWED_TYPES = [
  'application/pdf',
  '.pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain' // .txt
];
```

**Current Implementation**: PDF only (others planned)

### File Validation

Validation happens at three points:

1. **On Drop** (immediate feedback):
```typescript
// Check file type
if (!file.type.includes('pdf')) {
  showError('Only PDF files are supported');
  return;
}

// Check individual file size
if (file.size > MAX_FILE_SIZE) {
  showError(`${file.name} exceeds 50MB limit`);
  return;
}
```

2. **Before Send** (batch validation):
```typescript
// Check total size
const totalSize = files.reduce((sum, f) => sum + f.size, 0);
if (totalSize > MAX_TOTAL_SIZE) {
  showError('Total size exceeds 150MB');
  return;
}

// Check file count
if (files.length > MAX_FILES) {
  showError('Maximum 10 files allowed');
  return;
}
```

3. **On Backend** (security):
```javascript
// n8n workflow validation
if (!file.mimetype.includes('pdf')) {
  return { error: 'Invalid file type' };
}

if (file.size > 52428800) { // 50MB
  return { error: 'File too large' };
}
```

### File Preview UI

Shows uploaded files before sending:

```typescript
interface FilePreviewCard {
  filename: string;
  size: number;
  onRemove: () => void;
}

// Display format:
// 📄 engine_manual.pdf (12.5 MB) [X]
//    ↑ icon  ↑ name      ↑ size  ↑ remove button
```

**Visual States**:
- **Default**: Gray background, black text
- **Hover**: Darker background
- **Remove hover**: Red X button
- **Error**: Red border, error message

---

## Webhook Integration

### n8n Workflow Overview

The SOP creation workflow in n8n performs these steps:

1. **Receive Request**
   - Parse multipart/form-data
   - Extract files and metadata
   - Validate file types and sizes

2. **Extract Text**
   - Use pdf-parse or similar library
   - Extract text from each PDF
   - Combine multiple files with separators

3. **Generate SOP**
   - Send to OpenAI GPT-4o
   - Use specialized SOP generation prompt
   - Request structured JSON output

4. **Format Response**
   - Parse GPT-4o JSON
   - Validate SOP structure
   - Add metadata (source files, timestamps)

5. **Return to Frontend**
   - Stream response (optional)
   - Include all SOP sections
   - Provide download/edit URLs

### Webhook Endpoints

#### Primary Endpoint (Cloud)
```
POST https://api.celeste7.ai/webhook/sop-creation
Content-Type: multipart/form-data

Form Fields:
- files[]: File[] (PDF files)
- session_id: string (UUID)
- user_id: string (UUID)
- prompt?: string (optional instructions)
```

**Advantages**:
- Accessible from anywhere
- Production-grade infrastructure
- Better performance/reliability

#### Fallback Endpoint (Local)
```
POST http://localhost:5678/webhook/sop-creation
(Same format as primary)
```

**Advantages**:
- Works offline
- No external dependencies
- Easier debugging

### Response Format

```json
{
  "success": true,
  "sop": {
    "id": "uuid",
    "title": "Engine Oil Change Procedure",
    "created_at": "2025-11-03T10:30:00Z",
    "source_files": ["engine_manual.pdf", "maintenance_guide.pdf"],
    "sections": [
      {
        "type": "overview",
        "title": "Procedure Overview",
        "content": "This SOP outlines the steps..."
      },
      {
        "type": "safety",
        "title": "Safety Requirements",
        "warnings": [
          "Ensure engine is cool before starting",
          "Wear protective equipment"
        ],
        "ppe": ["Safety glasses", "Gloves", "Steel-toed boots"]
      },
      {
        "type": "tools",
        "title": "Required Tools",
        "items": [
          {"name": "Oil filter wrench", "quantity": 1},
          {"name": "Drain pan", "quantity": 1, "capacity": "20 liters"}
        ]
      },
      {
        "type": "procedure",
        "title": "Step-by-Step Instructions",
        "steps": [
          {
            "number": 1,
            "action": "Locate the oil drain plug",
            "details": "The drain plug is located...",
            "caution": "Do not over-tighten"
          },
          {
            "number": 2,
            "action": "Position drain pan",
            "details": "Place pan directly under..."
          }
        ]
      },
      {
        "type": "checklist",
        "title": "Post-Completion Checklist",
        "items": [
          {"text": "Oil level checked and correct", "required": true},
          {"text": "No leaks observed", "required": true},
          {"text": "Work area cleaned", "required": false}
        ]
      }
    ]
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File engine_manual.pdf exceeds 50MB limit",
    "details": {
      "filename": "engine_manual.pdf",
      "size": 52428800,
      "limit": 50000000
    }
  }
}
```

**Error Codes**:
- `FILE_TOO_LARGE` - Individual file exceeds 50MB
- `TOTAL_SIZE_EXCEEDED` - Combined files exceed 150MB
- `INVALID_FILE_TYPE` - Non-PDF file uploaded
- `EXTRACTION_FAILED` - Could not extract text from PDF
- `GENERATION_FAILED` - GPT-4o API error
- `TIMEOUT` - Processing took too long (>120s)

---

## Frontend Components

### SOPCanvasCard Component

**Purpose**: Display and edit generated SOPs

**Features**:
- Expandable/collapsible sections
- Inline editing of text
- Section reordering (drag-and-drop)
- Add/remove sections
- Export to PDF
- Save to database

**Props**:
```typescript
interface SOPCanvasCardProps {
  sop: SOPData;
  onSave?: (sop: SOPData) => Promise<void>;
  onExport?: (format: 'pdf' | 'docx') => Promise<void>;
  onClose?: () => void;
  isEditable?: boolean;
}
```

**Usage**:
```typescript
// In ChatAreaReal.tsx
{message.type === 'sop' && (
  <SOPCanvasCard
    sop={message.sopData}
    onSave={handleSaveSOp}
    onExport={handleExportSOP}
    isEditable={true}
  />
)}
```

**Location**: `client/components/canvas/SOPCanvasCard.tsx`

### File Preview Component

**Purpose**: Show uploaded files before sending

**Features**:
- Display filename and size
- Remove button for each file
- Total size indicator
- Error state display

**Implementation**:
```typescript
// In ChatAreaReal.tsx
{uploadedFiles.length > 0 && (
  <div className="file-preview-container">
    {uploadedFiles.map((file, index) => (
      <div key={index} className="file-preview-card">
        <Upload className="w-4 h-4" />
        <span className="filename">{file.name}</span>
        <span className="filesize">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </span>
        <button onClick={() => handleRemoveFile(index)}>
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
    <div className="total-size">
      Total: {(totalSize / 1024 / 1024).toFixed(2)} MB / 150 MB
    </div>
  </div>
)}
```

**Location**: `client/components/layout/ChatAreaReal.tsx:400-430`

---

## Bug Fixes Applied

### 1. SOP Button Not Visible on Frontend

**Issue**: Button existed in mobile drawer but not on desktop sidebar

**Root Cause**: Button only added to mobile navigation, desktop sidebar missing

**Fix**: Added button to desktop sidebar (Lines 1363-1400 in Sidebar.tsx)

```typescript
// Desktop sidebar section (outside drawer)
<button
  onClick={() => onShowSopCreation()}
  className="sidebar-button"
>
  <FileText className="w-4 h-4" />
  {!isCollapsed && <span>SOP Creation</span>}
</button>
```

**Commit**: Fixed visibility issue for SOP button

### 2. Session Undefined Error

**Issue**: `ReferenceError: session is not defined at handleSendMessage`

**Root Cause**: `session` not extracted from `useAuth()` hook

**Fix**: Added `session` to destructuring (Line 150 in AppFigma.tsx)

```typescript
// Before
const { user, isLoading, isAuthenticated } = useAuth();

// After
const { user, isLoading, isAuthenticated, session } = useAuth();
```

**Commit**: Fixed session reference in SOP creation

### 3. Invalid UUID Format

**Issue**: `invalid input syntax for type uuid: "session_1761957870171"`

**Root Cause**: Using timestamp strings instead of RFC 4122 UUIDs

**Fix**: Implemented proper UUID generation function

```typescript
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
```

**Commit**: Fixed UUID generation for Supabase compatibility

### 4. Wrong UX Pattern

**Issue**: SOP Creation used separate view instead of chat interface

**Root Cause**: Misunderstanding of design pattern

**Fix**: Changed to use same chat interface with `handleNewChat('sop')`

**Before**:
- Separate `/sop` route
- Different layout from Yacht/Email search
- Inconsistent navigation

**After**:
- Uses main chat interface
- Consistent with other search types
- Same message flow and history

**Commit**: Aligned SOP UX with Yacht/Email search patterns

### 5. Files Not Visible After Upload

**Issue**: Files uploaded but no visual confirmation

**Root Cause**: No file preview component implemented

**Fix**: Added file preview cards above chat messages

**Features Added**:
- Show filename and size
- Remove button per file
- Total size indicator
- Visual feedback on upload

**Commit**: Added file preview cards for SOP uploads

### 6. Clarify Button in SOP Mode

**Issue**: Clarify button shown in SOP mode (not applicable)

**Root Cause**: No conditional rendering based on search type

**Fix**: Wrapped button in conditional (Line 298 in ChatAreaReal.tsx)

```typescript
{currentSearchType !== 'sop' && (
  <button onClick={handleClarify}>Clarify</button>
)}
```

**Commit**: Removed Clarify button from SOP mode

---

## Known Limitations

### Current Limitations

1. **PDF Only**: Currently only supports PDF files
   - DOCX, TXT support planned but not implemented
   - No image/OCR support for scanned PDFs

2. **File Size Constraints**:
   - 50MB per file is a hard browser limit
   - Large files may cause memory issues on mobile
   - No chunked upload for files >50MB

3. **No OCR**: Scanned PDFs without text layer won't work
   - Only extracts embedded text
   - Images in PDFs are ignored

4. **No Streaming**: SOP generation doesn't stream
   - User sees loading state entire time
   - No partial results shown

5. **Mobile Drag-and-Drop**: iOS Safari doesn't support file drag-and-drop
   - Workaround: Use file input button
   - Works fine on Android Chrome

6. **No Version Control**: SOPs can be edited but not versioned
   - No history of changes
   - No ability to revert to previous version

7. **Limited Export Formats**: Only PDF export currently works
   - DOCX export planned
   - No Excel/CSV export for checklists

8. **No Collaborative Editing**: Single-user editing only
   - No real-time collaboration
   - No conflict resolution

### Performance Considerations

1. **Large Files**: Processing 150MB can take 60-90 seconds
   - Backend timeout set to 120s
   - Frontend shows generic loading state

2. **Memory Usage**: Holding files in memory before upload
   - Browser may crash with many large files
   - Consider chunked upload for future

3. **Token Usage**: Long documents use significant OpenAI tokens
   - 200 pages ≈ 150k words ≈ 200k tokens
   - Can be expensive ($4-8 per request)

---

## Future Enhancements

### High Priority

1. **Streaming Support**
   - Show SOP sections as they're generated
   - Improve perceived performance
   - Better user feedback

2. **DOCX/TXT Support**
   - Accept more file formats
   - Parse Word documents
   - Handle plain text manuals

3. **OCR Integration**
   - Process scanned PDFs
   - Extract text from images
   - Improve accessibility

4. **Mobile UX Improvements**
   - Better file upload on iOS
   - Optimize for small screens
   - Touch-friendly editing

### Medium Priority

5. **Version Control**
   - Track SOP changes
   - Allow revert to previous version
   - Show diff between versions

6. **Collaborative Editing**
   - Multiple users editing same SOP
   - Real-time updates
   - Conflict resolution

7. **Template Library**
   - Pre-built SOP templates
   - Industry-specific formats
   - Customizable sections

8. **Export Formats**
   - DOCX export with formatting
   - Excel export for checklists
   - Print-optimized layouts

### Low Priority

9. **AI-Powered Suggestions**
   - Suggest improvements to existing SOPs
   - Identify missing sections
   - Compliance checking

10. **Multi-Language Support**
    - Translate SOPs automatically
    - Support non-English manuals
    - Localized terminology

11. **Offline Mode**
    - Generate SOPs without internet
    - Use local LLM (Ollama)
    - Sync when online

12. **Analytics**
    - Track SOP usage
    - Identify most-used procedures
    - Suggest consolidation

---

## Testing

### Unit Tests

**Priority Tests**:
```typescript
// UUID generation
describe('generateUUID', () => {
  it('should generate valid RFC 4122 UUID', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

// File validation
describe('validateFiles', () => {
  it('should reject files over 50MB', () => {
    const file = new File(['x'.repeat(51 * 1024 * 1024)], 'large.pdf');
    expect(() => validateFiles([file])).toThrow('File too large');
  });

  it('should reject non-PDF files', () => {
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' });
    expect(() => validateFiles([file])).toThrow('Invalid file type');
  });

  it('should accept valid PDF under 50MB', () => {
    const file = new File(['content'], 'valid.pdf', { type: 'application/pdf' });
    expect(() => validateFiles([file])).not.toThrow();
  });
});

// Webhook fallback
describe('sendSOPRequest', () => {
  it('should try primary endpoint first', async () => {
    const formData = new FormData();
    await sendSOPRequest(formData);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('celeste7.ai'));
  });

  it('should fallback to localhost if primary fails', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Primary failed'))
      .mockResolvedValueOnce({ ok: true, json: () => ({}) });

    await sendSOPRequest(new FormData());
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('localhost'));
  });
});
```

### Integration Tests

**Test Scenarios**:
1. Upload single PDF, generate SOP
2. Upload multiple PDFs, combine into one SOP
3. Test file size limits (reject 51MB file)
4. Test drag-and-drop on new conversation
5. Test drag-and-drop on existing conversation
6. Test file removal before sending
7. Test webhook fallback (primary down)
8. Test edit and save SOP
9. Test export to PDF

### Manual Testing Checklist

**Desktop**:
- [ ] Click "SOP Creation" button in sidebar
- [ ] Verify new chat opens with search_type='sop'
- [ ] Drag PDF from Finder, verify drop zone highlights
- [ ] Drop file, verify preview card appears
- [ ] Remove file using X button
- [ ] Add multiple files, verify total size shown
- [ ] Type optional message, click send
- [ ] Verify webhook call (check network tab)
- [ ] Verify SOP displays correctly
- [ ] Edit SOP sections
- [ ] Save SOP to database
- [ ] Export SOP to PDF
- [ ] Verify no Clarify button shown

**Mobile**:
- [ ] Open hamburger menu
- [ ] Tap "SOP Creation"
- [ ] Verify drawer closes, chat opens
- [ ] Tap file upload button (📎)
- [ ] Select PDF from files
- [ ] Verify preview card shows
- [ ] Send and verify SOP generation
- [ ] Test editing on mobile (touch)

**Edge Cases**:
- [ ] Upload exactly 50MB file (should work)
- [ ] Upload 51MB file (should reject)
- [ ] Upload 10 small files (should work)
- [ ] Upload 11 files (should reject)
- [ ] Upload corrupted PDF (should show error)
- [ ] Upload password-protected PDF
- [ ] Test with slow network (verify timeout)
- [ ] Test with n8n down (verify fallback)
- [ ] Test with both webhooks down (verify error)

---

## Troubleshooting

### Common Issues

**1. Files don't upload**
- Check browser console for errors
- Verify file size < 50MB
- Ensure file is PDF format
- Check network tab for failed requests
- Verify n8n is running (`curl http://localhost:5678/health`)

**2. "Session undefined" error**
- Check if user is logged in
- Verify Supabase connection
- Check AuthContext provider wraps app
- Review browser console for auth errors

**3. "Invalid UUID" error**
- Verify `generateUUID()` function exists
- Check UUID format with regex
- Ensure crypto API is available
- Clear localStorage and retry

**4. Webhook timeout**
- Large files may take >30 seconds
- Increase timeout to 120s
- Check n8n workflow logs
- Verify OpenAI API key is valid

**5. SOP not displaying**
- Check response format matches expected structure
- Verify JSON parsing succeeds
- Check SOPCanvasCard component loaded
- Review console for rendering errors

### Debug Commands

```javascript
// Check uploaded files
console.log('Files:', uploadedFiles);

// Check session UUID
console.log('Session ID:', sessionId);

// Force UUID regeneration
localStorage.removeItem('current_session_id');

// Check webhook response
fetch('http://localhost:5678/webhook/sop-creation', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);

// Check authentication
console.log('Auth state:', useAuth());
```

---

## Conclusion

The SOP Creation feature provides a powerful tool for generating standardized procedures from technical manuals. By following the existing UX patterns and implementing robust error handling, it seamlessly integrates with the Yacht Search and Email Search features.

### Key Takeaways

1. **Consistency is key** - Matching existing UX patterns improves usability
2. **Validate early** - File validation on drop provides immediate feedback
3. **Graceful degradation** - Fallback webhooks ensure reliability
4. **Mobile-first** - Consider touch interfaces from the start
5. **User feedback** - Always show file previews and progress indicators

### Next Steps for Engineers

1. Review this guide thoroughly
2. Set up local n8n instance with SOP workflow
3. Test all user flows (desktop and mobile)
4. Familiarize yourself with webhook retry logic
5. Understand UUID generation requirements
6. Review bug fixes applied and why they were needed

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Author**: Development Team
**Status**: Production-ready
