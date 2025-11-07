# SOP Creation Module - Implementation Guide

## Files Created

### 1. Service Layer
**File**: `/Users/celeste7/Documents/NEWSITE/client/services/sopService.ts`
- Handles all API communication with n8n webhook
- Methods: `generateSop()`, `saveSop()`, `generatePdf()`
- Includes proper TypeScript types and error handling
- Uses JWT authentication from Supabase

### 2. UI Component
**File**: `/Users/celeste7/Documents/NEWSITE/client/components/SopCreation.tsx`
- Full-featured SOP creation interface
- Input form with prompt and checkbox for "use docs"
- Markdown editor for generated content
- Action buttons: Save to NAS, Save to Cloud, Download PDF
- Auto-save to localStorage every 30s
- Toast notifications using sonner
- Responsive dark glass aesthetic matching Bridge style

### 3. Icon Import (Updated)
**File**: `/Users/celeste7/Documents/NEWSITE/client/components/layout/Sidebar.tsx`
- Added `FileText` icon to imports (line 4)

## Integration Steps Required

### Step 1: Add Sidebar Navigation Button

Add this code after the Email Search button (around line 791 in Sidebar.tsx):

```tsx
{/* SOP Creation Button */}
<button
  onClick={() => {
    // Navigate to /bridge/sop or trigger view change
    if (onShowSopCreation) {
      onShowSopCreation();
    }
  }}
  className={`flex items-center gap-3 w-full p-3 transition-all duration-200 sop_creation_button`}
  style={{
    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff'
  }}
  onMouseEnter={(e) => {
    if (isDarkMode) {
      e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)';
    } else {
      e.currentTarget.style.background = isChatMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.08)';
    }
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'transparent';
  }}
>
  <FileText
    className="w-4 h-4"
    style={{
      color: currentView === 'sop'
        ? '#0A84FF'
        : 'rgba(255, 255, 255, 0.88)'
    }}
  />
  {!isCollapsed && "SOP Creation"}
</button>
```

### Step 2: Update Sidebar Props

Add to `SidebarProps` interface (around line 242):

```typescript
interface SidebarProps {
  // ... existing props ...
  onShowSopCreation?: () => void;  // NEW
  currentView?: 'chat' | 'sop' | null;  // NEW (optional)
}
```

### Step 3: Add Routing

If using React Router, add this route:

```tsx
<Route path="/bridge/sop" element={<SopCreation />} />
```

Or if using state-based view switching in AppFigma.tsx:

```tsx
// Add state
const [currentView, setCurrentView] = useState<'chat' | 'sop' | null>(null);

// Add handler
const handleShowSopCreation = () => {
  setCurrentView('sop');
};

// Pass to Sidebar
<Sidebar
  // ... existing props ...
  onShowSopCreation={handleShowSopCreation}
  currentView={currentView}
/>

// Conditional rendering
{currentView === 'sop' && <SopCreation />}
```

### Step 4: Update App Layout

In AppFigma.tsx, conditionally render SopCreation component:

```tsx
import { SopCreation } from './components/SopCreation';

// In render:
{currentView === 'sop' ? (
  <SopCreation />
) : (
  // ... existing chat area components ...
)}
```

## API Requirements

### N8n Webhook Endpoint
Must be running at: `http://localhost:5678/webhook/sop-creation`

### Request Format
```json
{
  "query": "SOP for main engine lube oil change",
  "use_docs": true,
  "user": {
    "id": "<supabase_user_id>",
    "email": "user@example.com",
    "role": "engineer"
  },
  "jwt": "<supabase_jwt_token>"
}
```

### Response Format
```json
{
  "sop_id": "tmp_1234",
  "title": "Main Engine Lube Oil Change Procedure",
  "content_md": "## Tools Required...",
  "sources": ["MTU_Manual_p124.pdf", "Previous_SOP_v3.md"]
}
```

### Save Request Format
```json
{
  "sop_id": "tmp_1234",
  "action": "save",
  "target": "nas" | "cloud",
  "content_md": "...edited markdown...",
  "title": "Main Engine Lube Oil Change",
  "user": { "id": "...", "email": "..." },
  "jwt": "..."
}
```

### PDF Generation
Endpoint: `http://localhost:5678/webhook/sop-creation/pdf`
Returns: Binary PDF blob

## Authentication

The component automatically:
- Gets user from `useAuth()` hook
- Extracts JWT from `session.access_token`
- Includes JWT in all API requests
- Shows error if user not authenticated

## Error Handling

- Shows toast notifications for all operations
- Handles 401/403 authentication errors
- Provides clear error messages
- Logs all errors to console for debugging

## Features Implemented

✅ Prompt input with placeholder text
✅ "Use docs" checkbox for context
✅ Generate button with loading state
✅ Markdown content editor (editable)
✅ Sources display with visual styling
✅ Save to NAS button
✅ Save to Cloud button
✅ Download PDF button
✅ Clear/Reset functionality
✅ Auto-save drafts to localStorage
✅ Toast notifications
✅ Loading spinners
✅ Button disable states
✅ Dark glass aesthetic
✅ Responsive layout
✅ JWT authentication

## Testing Checklist

- [ ] Sidebar button appears and is styled correctly
- [ ] Clicking button navigates to SOP view
- [ ] Input form accepts text and checkbox works
- [ ] Generate button calls webhook and shows loading
- [ ] Generated SOP displays with title and content
- [ ] Sources list displays (if returned)
- [ ] Content is editable in textarea
- [ ] Save to NAS button works
- [ ] Save to Cloud button works
- [ ] Download PDF button works
- [ ] All buttons show loading states
- [ ] Toast notifications appear
- [ ] Clear button resets form
- [ ] Authentication required (shows error if not logged in)
- [ ] Auto-save works (check localStorage)

## Styling

Component uses:
- Tailwind CSS classes
- Dark gradient background: `bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900`
- Glass morphism: `bg-white/5 backdrop-blur-sm border-white/10`
- Blue accent color: `#0A84FF` (matching Yacht/Email Search)
- Spacing: 24px outer padding, 16px between controls
- Rounded corners: `rounded-xl` (12px)

Matches existing Bridge aesthetic perfectly.

## Next Steps

1. **Complete Sidebar Integration**: Add the navigation button code from Step 1
2. **Add Routing**: Implement routing or state-based view switching
3. **Setup n8n Webhook**: Ensure webhook is running and returns correct format
4. **Test Authentication**: Verify JWT is being passed correctly
5. **Test Full Flow**: Generate → Edit → Save → Download
6. **Mobile Responsiveness**: Test on mobile devices
7. **Error Scenarios**: Test with invalid inputs, network errors, etc.

## Support

For issues:
- Check browser console for error logs
- Verify n8n webhook is running
- Confirm Supabase auth is working
- Check network tab for API request/response

All service methods log detailed information to console for debugging.
