# Text-Chat Frontend Type Definitions

**Complete TypeScript interfaces for accepting text-chat webhook responses**

**Purpose:** Universal type safety that handles all response variations (varying doc counts, optional fields, etc.)

**Last Updated:** 2025-10-14

---

## Table of Contents

1. [Top-Level Response](#top-level-response)
2. [UI Payload](#ui-payload)
3. [Document Types](#document-types)
4. [Solution Types](#solution-types)
5. [AI Summary](#ai-summary)
6. [Handover Section](#handover-section)
7. [Usage Examples](#usage-examples)
8. [Validation Rules](#validation-rules)

---

## Top-Level Response

### WebhookResponse<T>

```typescript
/**
 * Generic webhook response wrapper
 * Used by webhookServiceComplete.ts
 */
interface WebhookResponse<T = any> {
  success: boolean;                    // REQUIRED: Request success status
  data?: T;                            // OPTIONAL: Response data (can be undefined)
  error?: string;                      // OPTIONAL: Error message if failed
  message?: string;                    // OPTIONAL: Additional info
}
```

**Usage:**
```typescript
const response: WebhookResponse<TextChatResponse> = await sendTextChat(...);
```

---

## UI Payload

### TextChatResponse

```typescript
/**
 * Complete text-chat webhook response structure
 * This is what comes back from n8n
 */
interface TextChatResponse {
  // ========================================
  // REQUIRED FIELDS
  // ========================================

  /**
   * Controls which UI variant to render
   * REQUIRED - Frontend MUST check this
   */
  ux_display: 'search_mode' | 'ai_summary' | 'email_results';

  /**
   * Main payload container
   * REQUIRED - Contains all UI data
   */
  ui_payload: UIPayload;

  // ========================================
  // OPTIONAL METADATA
  // ========================================

  /**
   * Original webhook payload (for debugging)
   * OPTIONAL - Can be omitted
   */
  webhook_payload?: Record<string, any>;

  /**
   * Success flag (redundant with top-level)
   * OPTIONAL - Can be omitted
   */
  success?: boolean;
}
```

---

### UIPayload

```typescript
/**
 * Container for all frontend display data
 * Fields vary based on ux_display mode
 */
interface UIPayload {
  // ========================================
  // COMMON FIELDS (All modes)
  // ========================================

  /**
   * Original user query
   * REQUIRED in most cases, but can be empty string
   */
  query_text?: string;

  /**
   * Query ID for tracking
   * OPTIONAL - Used for handover linking
   */
  query_id?: string;

  /**
   * Conversation ID for session tracking
   * OPTIONAL - Generated on frontend if missing
   */
  conversation_id?: string;

  // ========================================
  // AI SUMMARY MODE ONLY
  // ========================================

  /**
   * AI-generated summary
   * NULLABLE - Only present if ux_display = "ai_summary"
   * Can be null even in AI mode if processing failed
   */
  ai_summary?: AISummary | null;

  /**
   * Primary solution (highest confidence)
   * NULLABLE - Only present in ai_summary mode
   */
  primary_solution?: Solution | null;

  /**
   * Other solutions (lower confidence alternatives)
   * NULLABLE - Can be empty array or omitted
   */
  other_solutions?: Solution[];

  // ========================================
  // SEARCH MODE ONLY
  // ========================================

  /**
   * All documents found (search mode)
   * REQUIRED in search_mode, OPTIONAL in ai_summary
   * Can be empty array (no results)
   */
  all_documents?: Document[];

  // ========================================
  // HANDOVER DATA (All modes)
  // ========================================

  /**
   * Handover log data
   * NULLABLE - Always returned but can be null or empty
   * Fields may be pre-populated or empty strings
   */
  handover_section?: HandoverSection | null;

  // ========================================
  // LEGACY FIELDS (Backward compatibility)
  // ========================================

  /**
   * Old combined solutions array
   * NULLABLE - Use primary_solution + other_solutions instead
   */
  solutions?: Solution[];

  /**
   * Additional documents
   * NULLABLE - Deprecated, use all_documents
   */
  additional_documents?: Document[];
  other_documents?: Document[];

  /**
   * Legacy mode field
   * NULLABLE - Use ux_display instead
   */
  mode?: 'search' | 'ai' | 'ai_enhanced';
  show_ai_summary?: boolean;
}
```

---

## Document Types

### Document

```typescript
/**
 * Document object (NAS/yacht search results)
 * Represents a single PDF/file match
 */
interface Document {
  // ========================================
  // IDENTIFICATION (REQUIRED)
  // ========================================

  /**
   * Display title
   * REQUIRED - Always present
   */
  display_name: string;

  /**
   * Unique identifier
   * OPTIONAL - May be generated from filename
   */
  id?: string;

  /**
   * Source filename
   * OPTIONAL - Not always available
   */
  filename?: string;

  // ========================================
  // CONFIDENCE/SCORING (REQUIRED)
  // ========================================

  /**
   * Match quality (0.0 - 1.0)
   * REQUIRED - Used for confidence circle color
   */
  match_ratio: number;

  /**
   * Percentage confidence (0-100)
   * OPTIONAL - Derived from match_ratio if missing
   * Frontend calculates: match_ratio * 100
   */
  confidenceScore?: number;

  /**
   * Text quality indicator
   * OPTIONAL - Used for badge display
   */
  confidence?: 'low' | 'medium' | 'high';

  /**
   * Quality tier (1-5, 5 = best)
   * OPTIONAL - Used for star display
   */
  tier?: number;
  stars?: number;

  // ========================================
  // PAGE INFORMATION (OPTIONAL)
  // ========================================

  /**
   * Best matching page number
   * OPTIONAL - Can be null for non-PDF files
   */
  best_page?: number | null;

  /**
   * All matching pages
   * OPTIONAL - Can be empty array
   */
  matching_pages?: number[];

  /**
   * Count of matching pages
   * OPTIONAL - Derived from matching_pages.length
   */
  page_count?: number;

  // ========================================
  // CONTENT (OPTIONAL)
  // ========================================

  /**
   * Preview snippet
   * OPTIONAL - First ~200 chars of matching content
   */
  content_preview?: string;

  /**
   * Full matching content
   * OPTIONAL - Usually omitted for bandwidth
   */
  content_full?: string;

  /**
   * Content length in characters
   * OPTIONAL - For truncation logic
   */
  content_length?: number;

  // ========================================
  // LINKS (REQUIRED for clickable docs)
  // ========================================

  /**
   * Link objects
   * REQUIRED for NAS/yacht, OPTIONAL for email
   */
  links?: DocumentLinks;

  /**
   * File path (server-side)
   * OPTIONAL - Not exposed to frontend
   */
  path?: string;

  /**
   * Relative path from ROOT
   * OPTIONAL - For display purposes
   */
  relative_path?: string;

  // ========================================
  // METADATA (OPTIONAL)
  // ========================================

  /**
   * Document type indicator
   * OPTIONAL - "document" | "email" | "web"
   */
  source_type?: string;

  /**
   * Entities found in document
   * OPTIONAL - Can be empty array
   */
  entities_found?: string[];
  entity_count?: number;

  /**
   * Display color for UI
   * OPTIONAL - Hex color code
   */
  display_color?: string;
}
```

---

### DocumentLinks

```typescript
/**
 * Link structure for documents
 * Different link types based on source
 */
interface DocumentLinks {
  /**
   * Main document URL
   * REQUIRED for NAS/yacht search
   * Format: "http://localhost:8095/ROOT/path/to/file.pdf"
   */
  document?: string;

  /**
   * Page-specific links
   * OPTIONAL - Array of page URLs with anchors
   */
  pages?: PageLink[];

  /**
   * Email link (email search only)
   * Format: "outlook:message/{id}" or Graph API URL
   */
  email?: string;
}

interface PageLink {
  page: number;
  url: string;  // "http://localhost:8095/ROOT/path/file.pdf#page=12"
}
```

---

### EmailDocument

```typescript
/**
 * Email search result (different from regular documents)
 * Only present when search_strategy = "email"
 */
interface EmailDocument {
  // ========================================
  // IDENTIFICATION (REQUIRED)
  // ========================================

  id: string;                          // Microsoft Graph message ID
  subject: string;                     // Email subject line

  // ========================================
  // SENDER/RECIPIENTS (REQUIRED)
  // ========================================

  sender: {
    name: string;
    email: string;
  };

  recipients?: string[];               // To addresses

  // ========================================
  // DATES (REQUIRED)
  // ========================================

  date: string;                        // ISO 8601 timestamp
  received_date?: string;              // When received (may differ from sent)

  // ========================================
  // CONTENT (OPTIONAL)
  // ========================================

  snippet?: string;                    // Short preview
  preview?: string;                    // Longer preview

  // ========================================
  // METADATA (OPTIONAL)
  // ========================================

  relevanceScore: number;              // 0.0 - 1.0
  has_attachments?: boolean;
  attachments?: EmailAttachment[];
  folder?: string;                     // "Inbox", "Sent Items", etc.
  is_read?: boolean;
  importance?: 'low' | 'normal' | 'high';
  categories?: string[];

  // ========================================
  // LINKS (OPTIONAL)
  // ========================================

  links?: {
    email: string;                     // Outlook URL
  };
}

interface EmailAttachment {
  name: string;
  type: string;                        // MIME type
  size: number;                        // Bytes
}
```

---

## Solution Types

### Solution

```typescript
/**
 * Solution object (AI-generated or high-confidence match)
 * Can represent either:
 * - A step-by-step procedure (AI mode)
 * - A document match (search mode)
 */
interface Solution {
  // ========================================
  // IDENTIFICATION (REQUIRED)
  // ========================================

  id: string;                          // Unique identifier
  sol_id?: string;                     // Alternative ID (legacy)

  /**
   * Solution/document title
   * REQUIRED
   */
  title: string;
  display_name?: string;               // Alternative title field

  // ========================================
  // CONFIDENCE (REQUIRED)
  // ========================================

  /**
   * Confidence level
   * REQUIRED - Used for badge color
   */
  confidence: 'low' | 'medium' | 'high';

  /**
   * Percentage score (0-100)
   * OPTIONAL - Used for circle color
   */
  confidenceScore?: number;

  /**
   * Match ratio (0.0 - 1.0)
   * OPTIONAL - Alternative to confidenceScore
   */
  match_ratio?: number;

  // ========================================
  // SOURCE DOCUMENT (OPTIONAL)
  // ========================================

  /**
   * Source document metadata
   * OPTIONAL - May not exist for AI-generated solutions
   */
  source?: {
    title: string;
    page?: number;
    revision?: string;
  };

  // ========================================
  // STEPS (OPTIONAL - AI mode only)
  // ========================================

  /**
   * Step-by-step instructions
   * REQUIRED in AI mode, OPTIONAL in search mode
   * Can be empty array
   */
  steps?: SolutionStep[];

  // ========================================
  // LINKS (OPTIONAL)
  // ========================================

  /**
   * Link to full procedure
   * OPTIONAL - URL to open document
   */
  procedureLink?: string;

  /**
   * Link structure (alternative)
   * OPTIONAL - Same as Document.links
   */
  links?: DocumentLinks;

  // ========================================
  // DOCUMENT METADATA (OPTIONAL)
  // ========================================

  filename?: string;
  best_page?: number;
  relative_path?: string;

  // ========================================
  // HANDOVER (OPTIONAL)
  // ========================================

  /**
   * Handover fields for this solution
   * OPTIONAL - Legacy, use handover_section instead
   */
  handover_fields?: HandoverField[];

  // ========================================
  // DOCUMENT CASCADES (OPTIONAL)
  // ========================================

  /**
   * Related documents
   * OPTIONAL - Can be empty array
   */
  related_docs?: RelatedDocument[];

  /**
   * All documents searched
   * OPTIONAL - Can be empty array
   */
  all_docs?: RelatedDocument[];
}
```

---

### SolutionStep

```typescript
/**
 * Individual step in a solution
 */
interface SolutionStep {
  text: string;                        // REQUIRED: Step instruction
  type?: 'normal' | 'warning' | 'tip'; // OPTIONAL: Step importance
  isBold?: boolean;                    // OPTIONAL: Emphasis flag
}
```

---

### RelatedDocument

```typescript
/**
 * Document in cascade (related_docs or all_docs)
 */
interface RelatedDocument {
  file_name: string;                   // REQUIRED
  doc_link: string;                    // REQUIRED: URL to document
  page_number?: number;                // OPTIONAL
  confidence?: number;                 // OPTIONAL: 0.0 - 1.0
}
```

---

## AI Summary

### AISummary

```typescript
/**
 * AI-generated summary (REACH/POWER models only)
 * Can be null or omitted in search mode
 */
interface AISummary {
  // ========================================
  // CONTENT (REQUIRED if present)
  // ========================================

  /**
   * Main summary text
   * REQUIRED if ai_summary exists
   * Either 'text' or 'answer' must be present
   */
  text?: string;                       // NEW format
  answer?: string;                     // Alternative field

  /**
   * Summary headline
   * OPTIONAL - Short title for summary
   */
  headline?: string;

  // ========================================
  // CONFIDENCE (OPTIONAL)
  // ========================================

  /**
   * Confidence in AI response
   * OPTIONAL - Can be numeric or text
   */
  confidence?: number | 'High' | 'Medium' | 'Low' | 'Unknown';

  // ========================================
  // METADATA (OPTIONAL)
  // ========================================

  /**
   * Enable/disable flag
   * OPTIONAL - Defaults to true if ai_summary present
   */
  enabled?: boolean;

  /**
   * Key points extracted
   * OPTIONAL - Can be empty array
   */
  key_points?: string[];

  /**
   * Model used for generation
   * OPTIONAL - "reach" | "power"
   */
  model_used?: string;

  /**
   * Processing time in milliseconds
   * OPTIONAL - For performance monitoring
   */
  processing_time_ms?: number;
}
```

---

## Handover Section

### HandoverSection

```typescript
/**
 * Handover log data structure
 * NEW unified structure (replaces old handover_fields)
 * Always returned but may have empty fields
 */
interface HandoverSection {
  // ========================================
  // STATE FLAGS (REQUIRED)
  // ========================================

  /**
   * Is handover functionality enabled?
   * REQUIRED - Hides/shows "Add to Handover" button
   */
  enabled: boolean;

  /**
   * Is there an error state?
   * REQUIRED - Shows error UI if true
   */
  error_state: boolean;

  // ========================================
  // METADATA (OPTIONAL)
  // ========================================

  /**
   * User role context
   * OPTIONAL - "engineering" | "operations" | etc.
   */
  role?: string;

  /**
   * Additional metadata
   * OPTIONAL - Can be any object
   */
  metadata?: Record<string, any>;

  // ========================================
  // FIELDS (REQUIRED if enabled)
  // ========================================

  /**
   * Dynamic field array
   * REQUIRED if enabled = true
   * Can be empty array
   * Each field can be pre-populated or empty
   */
  fields: HandoverField[];
}
```

---

### HandoverField

```typescript
/**
 * Individual handover field
 * Used in both NEW and LEGACY structures
 */
interface HandoverField {
  // ========================================
  // IDENTIFICATION (REQUIRED)
  // ========================================

  /**
   * Field key/name
   * REQUIRED - Examples: "system", "fault_code", "symptoms"
   */
  key: string;

  /**
   * Field value
   * REQUIRED - Can be empty string ""
   */
  value: string;

  // ========================================
  // NEW STRUCTURE FIELDS (OPTIONAL)
  // ========================================

  /**
   * Value source
   * OPTIONAL - Where did this value come from?
   */
  source?: 'entity_framework' | 'user_pending' | 'document' | 'system';

  /**
   * Is field editable?
   * OPTIONAL - Defaults to true
   */
  editable?: boolean;

  /**
   * AI confidence in this value
   * OPTIONAL - 0.0 - 1.0
   */
  confidence?: number;

  /**
   * Placeholder text
   * OPTIONAL - Shown if value is empty
   */
  placeholder?: string;

  /**
   * Field type
   * OPTIONAL - "error" for system errors
   */
  type?: 'error' | 'warning' | 'info' | 'normal';
}
```

---

## Usage Examples

### Example 1: Parsing Search Mode Response

```typescript
import type { WebhookResponse, TextChatResponse, UIPayload, Document } from './types';

async function handleSearchModeResponse(response: WebhookResponse<TextChatResponse>) {
  // Check success
  if (!response.success || !response.data) {
    console.error('Webhook failed:', response.error);
    return;
  }

  const data: TextChatResponse = response.data;

  // Check UX display mode
  if (data.ux_display !== 'search_mode') {
    console.warn('Expected search_mode, got:', data.ux_display);
  }

  // Extract UI payload
  const uiPayload: UIPayload = data.ui_payload;

  // Get documents (may be empty array)
  const documents: Document[] = uiPayload.all_documents || [];

  // Render documents
  documents.forEach((doc: Document) => {
    console.log('Document:', doc.display_name);
    console.log('Confidence:', doc.match_ratio * 100 + '%');
    console.log('Best page:', doc.best_page || 'N/A');
    console.log('Link:', doc.links?.document || 'No link');
  });

  // Check handover section (may be null)
  const handover: HandoverSection | null = uiPayload.handover_section || null;

  if (handover && handover.enabled) {
    console.log('Handover fields:', handover.fields.length);
  }
}
```

---

### Example 2: Parsing AI Summary Mode Response

```typescript
async function handleAISummaryResponse(response: WebhookResponse<TextChatResponse>) {
  if (!response.success || !response.data) return;

  const data: TextChatResponse = response.data;
  const uiPayload: UIPayload = data.ui_payload;

  // Check for AI summary
  const aiSummary: AISummary | null = uiPayload.ai_summary || null;

  if (aiSummary && aiSummary.enabled !== false) {
    // Get summary text (check both fields)
    const summaryText: string = aiSummary.text || aiSummary.answer || 'No summary';
    console.log('AI Summary:', summaryText);

    // Get confidence (may be string or number)
    const confidence = aiSummary.confidence;
    if (typeof confidence === 'string') {
      console.log('Confidence:', confidence); // "High" | "Medium" | "Low"
    } else if (typeof confidence === 'number') {
      console.log('Confidence:', confidence * 100 + '%');
    }
  }

  // Get primary solution
  const primary: Solution | null = uiPayload.primary_solution || null;

  if (primary) {
    console.log('Primary solution:', primary.title);
    console.log('Steps:', primary.steps?.length || 0);

    // Render steps (may be empty)
    primary.steps?.forEach((step: SolutionStep, idx: number) => {
      console.log(`${idx + 1}. ${step.text}`);
      if (step.type === 'warning') {
        console.warn('  ⚠️ Warning');
      }
    });
  }

  // Get other solutions (may be undefined or empty)
  const others: Solution[] = uiPayload.other_solutions || [];
  console.log('Other solutions:', others.length);
}
```

---

### Example 3: Handling Email Results

```typescript
import type { EmailDocument } from './types';

async function handleEmailResults(response: WebhookResponse<TextChatResponse>) {
  if (!response.success || !response.data) return;

  const data: TextChatResponse = response.data;

  // Email results may be in all_documents or custom field
  const emails: any[] = data.ui_payload.all_documents || [];

  emails.forEach((email: any) => {
    // Check if it's an email (has sender field)
    if ('sender' in email && email.sender) {
      const e: EmailDocument = email as EmailDocument;

      console.log('Subject:', e.subject);
      console.log('From:', e.sender.name, '<' + e.sender.email + '>');
      console.log('Date:', new Date(e.date).toLocaleString());
      console.log('Snippet:', e.snippet || 'No preview');
      console.log('Attachments:', e.has_attachments ? e.attachments?.length : 0);
    }
  });
}
```

---

### Example 4: Safe Field Access

```typescript
/**
 * Safe accessor functions for nullable fields
 */
function getConfidenceScore(doc: Document): number {
  // Try confidenceScore first, fallback to match_ratio * 100
  return doc.confidenceScore ?? (doc.match_ratio * 100);
}

function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 85) return 'high';
  if (score >= 67.5) return 'medium';
  return 'low';
}

function getBestPage(doc: Document): number | null {
  return doc.best_page ?? null;
}

function getDocumentLink(doc: Document): string | null {
  return doc.links?.document ?? null;
}

function getSummaryText(summary: AISummary | null): string {
  if (!summary) return '';
  return summary.text || summary.answer || '';
}

function getHandoverFields(payload: UIPayload): HandoverField[] {
  const section = payload.handover_section;
  if (!section || !section.enabled) return [];
  return section.fields || [];
}
```

---

## Validation Rules

### Required Field Checks

```typescript
/**
 * Validate text-chat response
 */
function validateResponse(data: any): data is TextChatResponse {
  // Check ux_display exists
  if (!data.ux_display) {
    console.error('Missing ux_display field');
    return false;
  }

  // Check valid ux_display value
  if (!['search_mode', 'ai_summary', 'email_results'].includes(data.ux_display)) {
    console.error('Invalid ux_display:', data.ux_display);
    return false;
  }

  // Check ui_payload exists
  if (!data.ui_payload) {
    console.error('Missing ui_payload');
    return false;
  }

  return true;
}

/**
 * Validate document object
 */
function validateDocument(doc: any): doc is Document {
  if (!doc.display_name) {
    console.error('Document missing display_name');
    return false;
  }

  if (typeof doc.match_ratio !== 'number') {
    console.error('Document missing match_ratio');
    return false;
  }

  return true;
}

/**
 * Validate handover section
 */
function validateHandoverSection(section: any): section is HandoverSection {
  if (typeof section.enabled !== 'boolean') {
    console.error('handover_section missing enabled flag');
    return false;
  }

  if (typeof section.error_state !== 'boolean') {
    console.error('handover_section missing error_state flag');
    return false;
  }

  if (!Array.isArray(section.fields)) {
    console.error('handover_section.fields must be array');
    return false;
  }

  return true;
}
```

---

## TypeScript Type File

**Save as:** `src/types/textChatResponse.ts`

```typescript
/**
 * Text-Chat Webhook Response Types
 * Auto-generated from TEXT_CHAT_FRONTEND_TYPES.md
 */

// ========================================
// TOP-LEVEL RESPONSE
// ========================================

export interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TextChatResponse {
  ux_display: 'search_mode' | 'ai_summary' | 'email_results';
  ui_payload: UIPayload;
  webhook_payload?: Record<string, any>;
  success?: boolean;
}

// ========================================
// UI PAYLOAD
// ========================================

export interface UIPayload {
  // Common
  query_text?: string;
  query_id?: string;
  conversation_id?: string;

  // AI mode
  ai_summary?: AISummary | null;
  primary_solution?: Solution | null;
  other_solutions?: Solution[];

  // Search mode
  all_documents?: Document[];

  // Handover
  handover_section?: HandoverSection | null;

  // Legacy
  solutions?: Solution[];
  additional_documents?: Document[];
  other_documents?: Document[];
  mode?: 'search' | 'ai' | 'ai_enhanced';
  show_ai_summary?: boolean;
}

// ========================================
// DOCUMENTS
// ========================================

export interface Document {
  // Identification
  display_name: string;
  id?: string;
  filename?: string;

  // Confidence
  match_ratio: number;
  confidenceScore?: number;
  confidence?: 'low' | 'medium' | 'high';
  tier?: number;
  stars?: number;

  // Pages
  best_page?: number | null;
  matching_pages?: number[];
  page_count?: number;

  // Content
  content_preview?: string;
  content_full?: string;
  content_length?: number;

  // Links
  links?: DocumentLinks;
  path?: string;
  relative_path?: string;

  // Metadata
  source_type?: string;
  entities_found?: string[];
  entity_count?: number;
  display_color?: string;
}

export interface DocumentLinks {
  document?: string;
  pages?: PageLink[];
  email?: string;
}

export interface PageLink {
  page: number;
  url: string;
}

export interface EmailDocument {
  id: string;
  subject: string;
  sender: { name: string; email: string };
  recipients?: string[];
  date: string;
  received_date?: string;
  snippet?: string;
  preview?: string;
  relevanceScore: number;
  has_attachments?: boolean;
  attachments?: EmailAttachment[];
  folder?: string;
  is_read?: boolean;
  importance?: 'low' | 'normal' | 'high';
  categories?: string[];
  links?: { email: string };
}

export interface EmailAttachment {
  name: string;
  type: string;
  size: number;
}

// ========================================
// SOLUTIONS
// ========================================

export interface Solution {
  // Identification
  id: string;
  sol_id?: string;
  title: string;
  display_name?: string;

  // Confidence
  confidence: 'low' | 'medium' | 'high';
  confidenceScore?: number;
  match_ratio?: number;

  // Source
  source?: {
    title: string;
    page?: number;
    revision?: string;
  };

  // Steps
  steps?: SolutionStep[];

  // Links
  procedureLink?: string;
  links?: DocumentLinks;

  // Metadata
  filename?: string;
  best_page?: number;
  relative_path?: string;

  // Handover
  handover_fields?: HandoverField[];

  // Cascades
  related_docs?: RelatedDocument[];
  all_docs?: RelatedDocument[];
}

export interface SolutionStep {
  text: string;
  type?: 'normal' | 'warning' | 'tip';
  isBold?: boolean;
}

export interface RelatedDocument {
  file_name: string;
  doc_link: string;
  page_number?: number;
  confidence?: number;
}

// ========================================
// AI SUMMARY
// ========================================

export interface AISummary {
  text?: string;
  answer?: string;
  headline?: string;
  confidence?: number | 'High' | 'Medium' | 'Low' | 'Unknown';
  enabled?: boolean;
  key_points?: string[];
  model_used?: string;
  processing_time_ms?: number;
}

// ========================================
// HANDOVER SECTION
// ========================================

export interface HandoverSection {
  enabled: boolean;
  error_state: boolean;
  role?: string;
  metadata?: Record<string, any>;
  fields: HandoverField[];
}

export interface HandoverField {
  key: string;
  value: string;
  source?: 'entity_framework' | 'user_pending' | 'document' | 'system';
  editable?: boolean;
  confidence?: number;
  placeholder?: string;
  type?: 'error' | 'warning' | 'info' | 'normal';
}
```

---

## Summary: What Can Be Omitted

### Always Required
- ✅ `ux_display` - Frontend must know which UI to render
- ✅ `ui_payload` - Container for all data
- ✅ `display_name` (documents) - Must have a title
- ✅ `match_ratio` (documents) - Must have confidence
- ✅ `enabled` (handover_section) - Must know if handover available
- ✅ `error_state` (handover_section) - Must know if error
- ✅ `fields` (handover_section) - Can be empty array

### Can Be Omitted/Null
- ⚠️ `ai_summary` - Null in search mode
- ⚠️ `primary_solution` - Null in search mode
- ⚠️ `other_solutions` - Can be undefined or empty array
- ⚠️ `all_documents` - Can be empty array
- ⚠️ `handover_section` - Can be null
- ⚠️ `best_page` - Null for non-PDF files
- ⚠️ `links` - May not exist for some sources
- ⚠️ `steps` - Empty array in search mode
- ⚠️ `related_docs` - Empty array if none found
- ⚠️ `all_docs` - Empty array if none found

### Variable Length Arrays
- 📊 `all_documents` - 0 to N documents
- 📊 `other_solutions` - 0 to N solutions
- 📊 `steps` - 0 to N steps
- 📊 `handover_section.fields` - 0 to N fields (typically 5-7)
- 📊 `related_docs` - 0 to N documents
- 📊 `all_docs` - 0 to N documents
- 📊 `matching_pages` - 0 to N page numbers

---

**Last Updated:** 2025-10-14
**TypeScript Version:** 5.0+
**Status:** ✅ Production Ready
