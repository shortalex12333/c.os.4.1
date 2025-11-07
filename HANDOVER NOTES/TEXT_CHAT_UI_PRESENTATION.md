# Text-Chat UI Presentation Guide

**Complete frontend rendering specifications for all UI elements**

**Source:** `client/components/layout/AISolutionCard.tsx`, `client/components/layout/ChatAreaReal.tsx`

---

## Table of Contents

1. [Confidence Display](#confidence-display)
2. [Button Specifications](#button-specifications)
3. [Document Cascades](#document-cascades)
4. [AI Summary Display](#ai-summary-display)
5. [Search Mode vs AI Mode](#search-mode-vs-ai-mode)
6. [Handover Form](#handover-form)
7. [Session & User Data](#session--user-data)

---

## Confidence Display

### Confidence Circle Button

**Location:** Top-right of each solution card
**File:** `AISolutionCard.tsx:875-890`

**Visual:**
- Circular button, 24px (mobile) / 28px (desktop)
- Color changes based on percentage score
- Gradient background with shadow

**Color Mapping:**

| Confidence | Color | Gradient | Shadow |
|------------|-------|----------|--------|
| **85%+** (High) | Green | `#22c55e` → `#16a34a` | `rgba(34, 197, 94, 0.25)` |
| **67.5-85%** (Medium) | Amber | `#f59e0b` → `#d97706` | `rgba(245, 158, 11, 0.25)` |
| **<67.5%** (Low) | Red | `#ef4444` → `#dc2626` | `rgba(239, 68, 68, 0.25)` |

**Hover Effect:**
- Scale: `1.1` (10% larger)
- Active scale: `0.95` (slight press effect)

**Accessibility:**
- Title: `"{score}% confidence"`
- ARIA label: `"Confidence level: {score}%"`

**Code:**
```typescript
<button
  style={{
    width: isMobile ? '24px' : '28px',
    height: isMobile ? '24px' : '28px',
    background: confidenceScore >= 85
      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
      : confidenceScore >= 67.5
      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '50%',
    boxShadow: '0 3px 12px rgba(...)'
  }}
  title={`${confidenceScore}% confidence`}
/>
```

---

## Button Specifications

### 1. "Ask AI" Button

**When Shown:** Only in `mode: "search"` (AIR model)
**Location:** Below solution steps, left side
**File:** `AISolutionCard.tsx:1060-1095`

**Styling:**

| Property | Mobile | Desktop | Both |
|----------|--------|---------|------|
| **Padding** | `16px 24px` | `18px 32px` | - |
| **Font Size** | `17px` | `19px` | - |
| **Line Height** | `24px` | `28px` | - |
| **Font Weight** | `600` | `600` | - |
| **Border Radius** | `16px` | `16px` | - |
| **Background (Light)** | `rgba(255, 255, 255, 0.95)` | Same | `border: 1px solid rgba(0, 0, 0, 0.1)` |
| **Background (Dark)** | `rgba(255, 255, 255, 0.1)` | Same | `border: 1px solid rgba(255, 255, 255, 0.2)` |
| **Shadow (Light)** | `0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)` | Same | - |
| **Shadow (Dark)** | `0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)` | Same | - |

**Hover Effect:**
- Scale: `1.01` (subtle growth)
- Active scale: `0.99` (press effect)
- Backdrop blur: `20px`

---

### 2. "Add to Handover" Button

**When Shown:** Always visible (for yacht/local searches)
**Location:** Below solution steps, right side (or full-width in AI mode)
**File:** `AISolutionCard.tsx:1098-1150`

**States:**

#### A. Initial State (Blue)
```css
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
color: #ffffff;
box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25), 0 2px 4px rgba(0, 0, 0, 0.05);
text: "Add to Handover"
```

#### B. Saved State (Green)
```css
background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
color: #ffffff;
box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25), 0 2px 4px rgba(0, 0, 0, 0.05);
icon: Check mark (✓)
```

#### C. Saved + Hover State
```css
background: Green gradient (same as B)
text: "Edit?" (replaces checkmark on hover)
```

**Sizing:**

| Property | Mobile | Desktop |
|----------|--------|---------|
| **Padding** | `16px 24px` | `18px 32px` |
| **Font Size** | `17px` | `19px` |
| **Line Height** | `24px` | `28px` |
| **Border Radius** | `16px` | `16px` |

**Behavior:**
- Click: Opens handover form dropdown
- After save: Changes to green checkmark
- Hover after save: Shows "Edit?" text
- Click again: Re-opens form for editing

---

### 3. "View Full Procedure" Link

**When Shown:** If `solution.procedureLink` exists
**Location:** Footer of expanded solution card
**File:** `AISolutionCard.tsx:1006-1025`

**Styling:**
```css
color: #2563eb (blue-600);
hover-color: #1d4ed8 (blue-700);
font-size: 14px (mobile) / 15px (desktop);
text-decoration: underline on hover;
icon: ExternalLink (16px);
```

**Click Behavior:**
- Opens in new tab (`target="_blank"`)
- Security: `noopener,noreferrer`

---

### 4. Copy Button

**Location:** Footer of expanded card, far right
**File:** `AISolutionCard.tsx:1028-1041`

**Styling:**
```css
padding: 8px;
border-radius: 8px;
color: gray-500;
hover-color: gray-700;
hover-background: gray-100;
icon: Copy (16px);
```

**Click Behavior:**
- Copies solution title + steps to clipboard
- Format: `{title}\n\n• {step1}\n• {step2}...`

---

## Document Cascades

### Structure Hierarchy

```
Solution Card
  ├─ Primary Document (in header)
  └─ [Expanded Content]
      ├─ Solution Steps
      ├─ Action Buttons
      └─ Document Cascades
          ├─ "Other related documents" (N docs)
          │   └─ [Expanded]
          │       ├─ Document 1 (with "+ Handover" button)
          │       ├─ Document 2 (with "+ Handover" button)
          │       └─ "All documents searched" (M docs)
          │           └─ [Expanded]
          │               ├─ All Doc 1
          │               ├─ All Doc 2
          │               └─ All Doc N
```

### "Other Related Documents"

**When Shown:** Always (even if 0 docs)
**Location:** Below action buttons
**File:** `AISolutionCard.tsx:1428-1664`

**Header:**
```
Text: "Other related documents (N)"
Icon: ChevronDown (rotates 180° when expanded)
Color: gray-700 (light) / gray-300 (dark)
Font: 13px (mobile) / 14px (desktop)
```

**Document Item:**
```
Format: "N. {filename} p.{page_number}"
Font: Eloquia Text, 13px (mobile) / 14px (desktop)
Color: gray-600 → blue-600 on hover
Icon: FileText (16px) on right
Button: "+ Handover" (blue, mini version)
```

**"+ Handover" Mini Button:**
```css
padding: 4px 8px;
font-size: 11px;
border-radius: 6px;
background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
border: 1px solid rgba(59, 130, 246, 0.2);
color: #60a5fa (dark) / #2563eb (light);
```

---

### "All Documents Searched"

**When Shown:** Nested inside "Other related documents" (when expanded)
**Location:** Indented `pl-2` (mobile) / `pl-3` (desktop)
**File:** `AISolutionCard.tsx:1555-1660`

**Container:**
```css
background: white/30 (light) / black/20 (dark);
border: white/15 (light) / white/8 (dark);
border-radius: 8px;
padding: 8px;
```

**Document Item:**
```
Format: "N. {filename} p.{page_number}"
Font: 12px (smaller than parent)
Color: gray-500 → blue-600 on hover
Icon: FileText (12px)
NO "+ Handover" button (read-only list)
```

**Scrolling:**
```css
max-height: 96px (mobile) / 128px (desktop);
overflow-y: auto;
```

---

## AI Summary Display

### AI Summary Box

**When Shown:** If `mode: "ai_enhanced"` AND `show_ai_summary: true`
**Location:** Top of chat message, before solutions
**File:** `components/AISummaryBox.tsx`

**Structure:**
```
┌─────────────────────────────────────┐
│  AI SUMMARY                         │
│  ─────────────────────────────────  │
│                                     │
│  {headline}                         │
│  Confidence: {High/Medium/Low}      │
│                                     │
│  {answer text...}                   │
│                                     │
└─────────────────────────────────────┘
```

**Styling:**

| Property | Value |
|----------|-------|
| **Background (Light)** | `rgba(255, 255, 255, 0.95)` |
| **Background (Dark)** | `rgba(30, 30, 35, 0.95)` |
| **Border** | `1px solid rgba(0, 0, 0, 0.1)` (light) / `rgba(255, 255, 255, 0.1)` (dark) |
| **Border Radius** | `16px` |
| **Padding** | `20px` (mobile) / `24px` (desktop) |
| **Backdrop Blur** | `20px` |
| **Shadow** | `0 8px 24px rgba(0, 0, 0, 0.15)` |

**Headline:**
```css
font-size: 18px (mobile) / 20px (desktop);
font-weight: 600;
color: #1a1a1a (light) / #f5f5f5 (dark);
font-family: Eloquia Display;
margin-bottom: 12px;
```

**Confidence Badge:**
```css
display: inline-block;
padding: 4px 12px;
border-radius: 12px;
font-size: 13px;
font-weight: 500;

High:   background: rgba(34, 197, 94, 0.2), color: #16a34a;
Medium: background: rgba(245, 158, 11, 0.2), color: #d97706;
Low:    background: rgba(239, 68, 68, 0.2), color: #dc2626;
```

**Answer Text:**
```css
font-size: 15px (mobile) / 16px (desktop);
line-height: 24px;
color: #374151 (light) / #d1d5db (dark);
font-family: Eloquia Text;
```

---

## Search Mode vs AI Mode

### Visual Differences

| Element | Search Mode (AIR) | AI Mode (REACH/POWER) |
|---------|-------------------|-----------------------|
| **AI Summary Box** | ❌ Not shown | ✅ Shown at top |
| **"Ask AI" Button** | ✅ Shown per solution | ❌ Hidden |
| **Solution Expansion** | Collapsed by default | Collapsed by default |
| **Document Layout** | Simple list | Cards with steps |
| **Primary Solution** | N/A | ✅ Highlighted first |
| **Other Solutions** | N/A | ✅ Separate section |

---

### Search Mode Layout

```
┌───────────────────────────────────────┐
│  Solution 1 (collapsed)               │
│  • Confidence dot                     │
│  • Title                              │
│  • Source chip                        │
│                                       │
│  [Click to expand]                    │
│    → Steps                            │
│    → [Ask AI] [Add to Handover]      │
│    → Other related documents          │
└───────────────────────────────────────┘
┌───────────────────────────────────────┐
│  Solution 2...                        │
└───────────────────────────────────────┘
```

---

### AI Mode Layout

```
┌───────────────────────────────────────┐
│  🤖 AI SUMMARY                        │
│  {headline}                           │
│  {answer text}                        │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Primary Solution (collapsed)         │
│  • Confidence dot                     │
│  • Title                              │
│  • Source chip                        │
│                                       │
│  [Click to expand]                    │
│    → Steps                            │
│    → [Add to Handover]               │
│    → Other related documents          │
└───────────────────────────────────────┘

Other Solutions (3)
┌───────────────────────────────────────┐
│  Solution 2...                        │
└───────────────────────────────────────┘
```

---

## Handover Form

### Form Dropdown

**Trigger:** Click "Add to Handover" button
**Animation:** Slide down with 300ms ease
**File:** `AISolutionCard.tsx:1154-1280`

**Container:**
```css
background: rgba(248, 250, 252, 0.8) (light) / rgba(30, 30, 35, 0.4) (dark);
backdrop-filter: blur(8px);
border: 1px solid rgba(0, 0, 0, 0.06) (light) / rgba(255, 255, 255, 0.06) (dark);
border-radius: 16px;
padding: 16px (mobile) / 20px (desktop);
margin-top: 16px;
```

### Field Row Structure

```
┌─────────────────────────────────────────────────────┐
│  [Label]      [Input Field]              [✓ Save]  │
│  System       Engine - Hydraulics         ✓        │
└─────────────────────────────────────────────────────┘
```

**Field Specifications:**

| Element | Mobile | Desktop | Style |
|---------|--------|---------|-------|
| **Label Width** | `100px` | `140px` | Fixed width, right-aligned |
| **Label Font** | `15px` | `16px` | Weight: 600, Color: gray-700 |
| **Input Padding** | `12px 16px` | `14px 18px` | - |
| **Input Font** | `15px` | `16px` | Eloquia Text |
| **Input Background** | `#ffffff` (light) / `rgba(0, 0, 0, 0.3)` (dark) | - | - |
| **Input Border** | `1px solid rgba(0, 0, 0, 0.08)` | - | Radius: 12px |
| **Save Button Size** | `44px × 44px` | `48px × 48px` | Square |

### Save Button States

#### Unsaved (Gray)
```css
background: rgba(226, 232, 240, 0.8) (light) / rgba(51, 65, 85, 0.5) (dark);
icon: Check (gray);
```

#### Saving (Blue + Spinner)
```css
background: rgba(191, 219, 254, 0.8) (light) / rgba(59, 130, 246, 0.3) (dark);
content: Spinning loader (20px);
cursor: wait;
```

#### Saved (Green)
```css
background: rgba(226, 232, 240, 0.8) (light) / rgba(71, 85, 105, 0.3) (dark);
icon: Check (gray/muted);
title: "Saved to Supabase";
```

**Hover Effects:**
- Scale: `1.05` on hover
- Scale: `0.95` on active (press)

---

## Session & User Data

### Data Flow

```
User Login
  ↓
AuthContext stores:
  - user.userId
  - user.userName
  - user.email
  ↓
Passed to webhookService.sendTextChat()
  ↓
Included in webhook payload:
  {
    userId: user.userId,
    userName: user.userName,
    conversation_id: "conversation_1728567890",
    sessionId: "session_1728567890"
  }
```

### Session Tracking

**Purpose:** Group related queries together

**Format:**
```typescript
conversationId: `conversation_${Date.now()}`
sessionId: `session_${Date.now()}`
```

**Persistence:**
- Stored in component state
- Reset on "New Chat"
- Used for handover linking

### User Display

**Location:** Multiple places
- Mobile header (top-left)
- Sidebar (profile section)
- Handover forms (user_id field)

**Format:**
```
Display Name: user.userName || user.email || "User"
User ID: user.userId (UUID)
```

---

## Animation Timings

### Solution Card Expand/Collapse

```typescript
expand: {
  duration: 280ms,
  ease: cubic-bezier(0.22, 0.61, 0.36, 1),
  stagger: 60ms between steps
}

collapse: {
  duration: 200ms,
  ease: cubic-bezier(0.22, 0.61, 0.36, 1)
}
```

### Handover Form Slide

```typescript
open: {
  duration: 300ms,
  ease: cubic-bezier(0.22, 0.61, 0.36, 1),
  initial: { opacity: 0, height: 0, y: -10 }
}

close: {
  duration: 300ms,
  ease: cubic-bezier(0.22, 0.61, 0.36, 1),
  exit: { opacity: 0, height: 0, y: -10 }
}
```

### Button Hover

```typescript
hover: {
  scale: 1.01 (Ask AI, Add to Handover),
  scale: 1.05 (Save button, mini buttons),
  duration: 200ms
}

active: {
  scale: 0.99 (large buttons),
  scale: 0.95 (small buttons),
  duration: 100ms
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| **Mobile** | < 768px | Single column, larger touch targets, truncated text |
| **Tablet** | 768px - 1024px | Same as desktop but narrower |
| **Desktop** | > 1024px | Full layout, sidebar visible |

**Mobile-Specific:**
- Solution titles truncated with ellipsis
- Buttons stack vertically
- Smaller font sizes (15-17px)
- Larger padding for touch (16px+)

---

## Color Tokens

### Light Mode

```css
--primary-blue: #3b82f6;
--primary-blue-dark: #2563eb;
--success-green: #22c55e;
--success-green-dark: #16a34a;
--warning-amber: #f59e0b;
--warning-amber-dark: #d97706;
--error-red: #ef4444;
--error-red-dark: #dc2626;

--text-primary: #1a1a1a;
--text-secondary: #374151;
--text-muted: #6b7280;

--bg-card: rgba(255, 255, 255, 0.95);
--bg-input: #ffffff;
--border-light: rgba(0, 0, 0, 0.08);
```

### Dark Mode

```css
--text-primary: #f5f5f5;
--text-secondary: #d1d5db;
--text-muted: #94a3b8;

--bg-card: rgba(30, 30, 35, 0.95);
--bg-input: rgba(0, 0, 0, 0.3);
--border-light: rgba(255, 255, 255, 0.1);
```

---

## Accessibility

### Keyboard Navigation

- Tab order: Card header → Expand → Ask AI → Add to Handover → Form fields → Save buttons
- Enter/Space: Activates buttons
- Escape: Closes modals/dropdowns

### Screen Readers

- All buttons have `aria-label` or `title`
- Confidence circles announce percentage
- Form fields have associated labels
- Expanded/collapsed state announced

### Motion

- Respects `prefers-reduced-motion`
- If enabled: All animations set to `duration: 0`

---

**Last Updated:** 2025-10-14
**Source Files:**
- `client/components/layout/AISolutionCard.tsx`
- `client/components/AISummaryBox.tsx`
- `client/components/layout/ChatAreaReal.tsx`
