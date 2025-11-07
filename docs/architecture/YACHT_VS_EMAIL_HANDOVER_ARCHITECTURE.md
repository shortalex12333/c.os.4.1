# Yacht vs Email: Handover Architecture Comparison

**Date**: 2025-10-20
**Purpose**: Show how yacht branch handover pattern was adapted for email search

---

## Architecture Overview

Both branches follow the **same 8-node pattern**:

```
1. Consolidator     → Merge duplicates
2. Preview/Snippet  → Generate short previews
3. Link Generator   → Build URLs
4. Ranker/Categorizer → Tier into primary/other/all
5. Handover Context → Extract entities, detect patterns
6. Handover Simplifier → 6-field template
7. Per-Item Mapper  → Attach handover to each item
8. Final Wrapper    → Complete response
```

---

## Node-by-Node Comparison

### NODE 1: Consolidator

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Document Merger & Consolidator** | **Email Consolidator** |
| Groups by `filename` | Groups by `conversationId` |
| Merges pages: `all_pages = [...matching_pages]` | Keeps most recent email in thread |
| Deduplicates based on path | Deduplicates based on conversation |

**Shared Logic**:
- Use `Map()` for efficient grouping
- Preserve highest relevance score
- Consolidate array into unique items

---

### NODE 2: Preview Generator

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Content Trimmer & Snippet Generator** | **Email Preview Generator** |
| Trims `content_preview` to 25 chars | Trims to 500 chars |
| Uses `doc.content_full` as source | Uses `email.bodyPreview` or `email.body.content` |
| Creates `snippet` field | Creates `content_preview` field |

**Shared Logic**:
- `trimToWordBoundary(text, maxLength)` helper
- Normalize whitespace: `.replace(/\s+/g, ' ')`
- Find last space before maxLength
- Strip HTML tags (email only)

---

### NODE 3: Link Generator

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Hyperlink Generator** | **Email Link Generator** |
| `http://localhost:8095/ROOT/{relative_path}` | `https://outlook.office365.com/mail/deeplink/read/{id}?ItemID={id}&exvsurl=1` |
| Extracts relative path from full path | Uses email ID directly |
| Builds page links: `{docLink}#page={page}` | Builds web + desktop links |
| Generates `sol_id`, `search_sol_id` | Generates `email_sol_*`, `search_email_*` |

**Shared Logic**:
- Generate solution IDs for compatibility
- Build `links` object with multiple URL formats
- Preserve all existing fields with `...doc`/`...email`

---

### NODE 4: Ranker & Categorizer

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Document Ranker & Categorizer** | **Email Ranker & Categorizer** |
| Sorts by `relevance_score`, `quality_score`, `entity_count` | Uses ATLAS tiers: `high_confidence[]`, `medium_confidence[]`, `low_confidence[]` |
| Thresholds: ≥0.75 = primary, 0.50-0.74 = other | Directly maps IDs to tier arrays |
| No hard limit on results | **Enforces 7+5+5=17 limit** |
| No hidden results | **Creates `hidden_results` overflow** |

**Key Difference**: Email branch has **cascading limit** (17 visible max):

```javascript
// Yacht: No limit
const primary = docs.filter(d => d.match_ratio >= 0.75);

// Email: Hard limits
const primary_findings = highConfEmails.slice(0, 7);
const other_emails = medConfEmails.slice(0, 5);
const all_emails = lowConfEmails.slice(0, 5);
const hidden = [...high_overflow, ...med_overflow, ...low_overflow];
```

---

### NODE 5: Handover Context Generator

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Handover Generator** | **Handover Context Generator** |
| Extracts from `entity_requirements`, `entities`, `query_entities` | Extracts from `analyzed_data.entities.merged`, `query`, `email senders` |
| Pattern types: CRITICAL_FAULT, EQUIPMENT_FAULT, SPECIFICATION_LOOKUP, MAINTENANCE_TASK | Pattern types: INVOICE_INQUIRY, VENDOR_COMMUNICATION, EQUIPMENT_ORDER, ERROR_REPORT |
| Department: engineering/deck/galley/interior/bridge | Department: **correspondence** (always) |
| Priority: urgent/normal/routine (based on faults) | Priority: **routine** (always - emails rarely urgent) |

**Shared Entity Extraction Logic**:

```javascript
// Both use:
- entity_requirements (high confidence)
- entities array (medium confidence)
- query analysis (fallback)
- Pattern detection based on entity types
- detectedFields object (system, fault_code, symptoms, etc.)
```

**Email-Specific Additions**:

```javascript
// Extract invoice numbers from query
const invoiceMatch = query.match(/\b(invoice|inv)[\s#:]*([A-Z0-9-]+)/i);

// Extract vendor from email sender domain
const senderDomain = email.from.emailAddress.address.split('@')[1];
const companyName = senderDomain.split('.')[0];

// detectedFields includes:
- vendor (instead of manufacturer)
- invoice (instead of specification)
```

---

### NODE 6: Handover Simplifier

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Handover Simplifier** | **Handover Simplifier** |
| **IDENTICAL CODE** | **IDENTICAL CODE** |

Both create the same 6-field structure:

```javascript
{
  system: "",
  fault_code: "",
  symptoms: "",
  actions_taken: "",  // Always empty - user fills
  duration: null,     // Always null - user fills
  linked_doc: ""      // Will be set per-item in next node
}
```

**No changes needed** - this node is search-strategy agnostic.

---

### NODE 7: Per-Item Handover Mapper

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Per-Document Handover Mapper** | **Per-Email Handover Mapper** |
| Enhances `system` from document path | Enhances `system` from sender domain |
| Extracts `fault_code` from filename | Extracts `fault_code` from email subject |
| Adds location prefix (Port/Starboard/Forward/Aft) | Adds vendor prefix from email address |

**Yacht Document Path Enhancement**:

```javascript
function extractSystemFromPath(path) {
  if (path.includes('main_engine')) return 'Main Engine';
  if (path.includes('generator')) return 'Generator';
  if (path.includes('hydraulic')) return 'Hydraulic System';
  // ...
}

function extractLocationFromPath(path) {
  if (path.includes('port_engine')) return 'Port Engine';
  if (path.includes('starboard_engine')) return 'Starboard Engine';
  // ...
}
```

**Email Sender Domain Enhancement**:

```javascript
function enhanceSystemFromEmail(email) {
  const domain = email.from.emailAddress.address.split('@')[1];
  if (domain && !domain.includes('gmail')) {
    const vendor = domain.split('.')[0];
    return `Correspondence - ${vendor.charAt(0).toUpperCase() + vendor.slice(1)}`;
  }
}
```

**Shared Logic**:
- Clone `handoverTemplate` to avoid mutations
- Set `linked_doc` to item's URL
- Preserve all existing fields: `{ ...doc/email, handover_section }`

---

### NODE 8: Final Wrapper

| Yacht Branch | Email Branch |
|--------------|--------------|
| **Final Document Cleaner** | **Final Email Wrapper** |
| Returns `primary_documents`, `other_documents`, `all_documents` | Returns `primary_findings`, `other_emails`, `all_emails` |
| No transformation needed (already doc objects) | **Transforms emails → document-like structure** |
| Includes `answer`, `entities`, `quality_metrics` | Includes same intelligence data |

**Email Transformation**:

```javascript
// Email branch transforms emails to look like documents for frontend:
function transformEmailToDocument(email) {
  return {
    id: email.id,
    display_name: email.subject,     // ← Maps subject to display_name
    sender: { name, email },          // ← Email-specific field
    received_date: email.receivedDateTime,
    content_preview: email.content_preview,
    match_ratio: email.match_ratio,
    has_attachments: email.hasAttachments,
    links: email.links,
    metadata: {                       // ← Email metadata
      importance: email.importance,
      is_read: email.isRead,
      categories: email.categories
    },
    handover_section: email.handover_section
  };
}
```

**Shared Output Structure**:

```javascript
{
  success: true,
  ux_display: "search_mode",
  ui_payload: {
    primary_findings/documents: [...],
    other_emails/documents: [...],
    all_emails/documents: [...],
    hidden_results: { count, emails/documents },  // Only email branch
    summary: {
      emails_found/documents_found,
      showing,
      hidden,
      tier_reached,
      message
    },
    handover_section: { ... }  // Global template
  }
}
```

---

## Key Architectural Differences

### 1. Cascading Limits

**Yacht**: No hard limits, shows all documents by tier
**Email**: Strict 7+5+5=17 visible limit with overflow in `hidden_results`

**Reason**: Email search can return 50+ emails, overwhelming UI. Document search typically returns 5-15 results.

---

### 2. Entity Sources

**Yacht**:
- `entity_requirements` (from Model Router)
- Document paths (`/yacht-nas/ROOT/02_ENGINEERING/main_engine/...`)
- Filenames (e.g., `FURUNO_FR8252_Manual.pdf`)

**Email**:
- ATLAS `analyzed_data.entities.merged`
- Email sender domains (vendor detection)
- Email subjects (invoice/error code extraction)

---

### 3. Pattern Detection

**Yacht Patterns**: Equipment-focused
- CRITICAL_FAULT (fault_code + equipment)
- SPECIFICATION_LOOKUP (measurement + model)
- MAINTENANCE_TASK (task + component)

**Email Patterns**: Communication-focused
- INVOICE_INQUIRY (invoice_number + vendor)
- VENDOR_COMMUNICATION (vendor + equipment)
- ERROR_REPORT (error_code + equipment)

---

### 4. Department & Priority

**Yacht**:
- Department inferred from path: `engineering`, `deck`, `galley`, `bridge`
- Priority based on fault severity: `urgent` (leak/fire), `normal`, `routine`

**Email**:
- Department always: `correspondence`
- Priority always: `routine`

**Reason**: Email handover is for record-keeping, not urgent action.

---

### 5. Link Formats

**Yacht**: Local HTTP file server
```
http://localhost:8095/ROOT/02_ENGINEERING/fuel_systems/capdp68.pdf#page=12
```

**Email**: Outlook deep links
```
https://outlook.office365.com/mail/deeplink/read/AAMkA...?ItemID=AAMkA...&exvsurl=1
```

---

## Reusable Components

### ✅ Directly Reused (No Changes)

1. **Handover Simplifier** - Identical 6-field mapping logic
2. **Pattern Detection Algorithm** - Same `detectPatternFromTypes()` structure
3. **Entity Confidence Scoring** - Same weighted average calculation
4. **Word Boundary Trimming** - Same `trimToWordBoundary()` helper

### ⚙️ Adapted (Minor Changes)

1. **Entity Extraction** - Different sources, same structure
2. **System Enhancement** - Different heuristics, same goal
3. **Fault Code Extraction** - Different regex patterns, same concept

### 🆕 Email-Specific (New Logic)

1. **Conversation Thread Consolidation** - Email-only
2. **HTML Stripping** - Email previews contain HTML
3. **Sender Domain Parsing** - Vendor detection from email addresses
4. **Cascading Limits (7+5+5)** - Email UI requirement
5. **Hidden Results Overflow** - Email volume management

---

## Testing Strategy

### Yacht Branch Tests

```bash
✅ Test with 1, 5, 10, 20 documents
✅ Test multi-page documents (matching_pages array)
✅ Test missing paths (relative_path extraction)
✅ Test fault codes in filenames
✅ Test location detection (Port/Starboard)
```

### Email Branch Tests

```bash
✅ Test with 0, 1, 17, 50 emails
✅ Test conversation thread consolidation
✅ Test cascading limits (7+5+5 split)
✅ Test hidden overflow (33 emails hidden)
✅ Test sender domain vendor extraction
✅ Test invoice number extraction from subjects
✅ Test empty results message
```

---

## Migration Checklist

If adding a **new search strategy** (e.g., `search_strategy: "slack"`):

- [ ] **NODE 1**: Decide consolidation logic (thread? channel? date?)
- [ ] **NODE 2**: Define max preview length (500? 1000?)
- [ ] **NODE 3**: Define link format (Slack deep links)
- [ ] **NODE 4**: Define tier limits (show all? limit to 20?)
- [ ] **NODE 5**: Define entity sources (channel name? user mentions?)
- [ ] **NODE 6**: **Reuse as-is** (no changes needed)
- [ ] **NODE 7**: Define enhancement heuristics (channel → system?)
- [ ] **NODE 8**: Define transformation to document-like structure

---

## Summary

The **Handover Generator architecture is fully reusable** across search strategies:

✅ **Core Logic**: Pattern detection, entity extraction, 6-field template
⚙️ **Customizable**: Entity sources, pattern types, enhancement heuristics
🔄 **Workflow**: Same 8-node pipeline regardless of data source

**Key Insight**: The handover system is **content-agnostic**. Whether processing:
- Yacht technical manuals
- Email correspondence
- Slack messages
- GitHub issues

...the same architecture applies:
1. Extract entities from content
2. Detect query pattern
3. Pre-fill handover fields
4. Attach to each result

This makes the system **highly extensible** for future search integrations.
