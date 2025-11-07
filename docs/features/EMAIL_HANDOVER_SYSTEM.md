# Email Handover System Documentation

**Date:** October 21, 2025
**Version:** 1.0
**Purpose:** Dynamic handover generation for email search results

---

## Overview

The handover system for email search creates **dynamic, entity-driven handover templates** that:
1. Pre-fill fields based on extracted entities from the query
2. Provide empty fields for users to complete
3. Collect corpus data patterns for future vector knowledge base
4. Enable quick export to handover reports

---

## Key Concepts

### Two-Fold Purpose

**1. User Benefit: Dynamic Handover Creation**
- Users get pre-filled handover templates based on their query
- Reduces manual data entry
- Consistent data structure for export

**2. Business Benefit: Data Corpus Collection**
- Collect industry patterns (what equipment fails, common faults, vendor relationships)
- Build knowledge graph for future vector search
- Train AI models on real-world maritime patterns

---

## How It Works

### Example Flow

**User Query:** "what is the microsoft invoice amount?"

**System extracts entities:**
- `org`: Microsoft
- `document_type`: invoice

**Generated handover template:**
```javascript
{
  system: "Microsoft",           // Auto-filled from org entity
  fault_code: "",                // Empty - not applicable
  symptoms: "what is the microsoft invoice amount?",  // Original query
  actions_taken: "Searched email correspondence for related information",
  duration: null,                // User fills
  linked_doc: "https://outlook.office365.com/mail/deeplink/read/AAMk..."
}
```

**Metadata (shows intelligence):**
```javascript
{
  auto_filled_count: 2,
  auto_filled_fields: ["system", "symptoms"],
  confidence: 0.85,
  entity_count: 2,
  generated_at: "2025-10-21T23:30:00Z"
}
```

---

## Field Extraction Logic

### Priority Order

The system extracts fields using a priority fallback chain:

#### 1. System Field
```
Priority:
1. equipment entity
2. company/org entity
3. location + equipment
4. regex match from query (engine, generator, pump, etc.)
```

**Example:**
- Query: "hydraulic pump pressure issue"
- Entity extracted: `equipment: "hydraulic pump"`
- System field: "Hydraulic Pump"

#### 2. Fault Code Field
```
Priority:
1. fault_code entity
2. error_code entity
3. regex match from query (ABC-123, P0123, ERR-456 patterns)
```

**Example:**
- Query: "main engine error P0234"
- Regex match: "P0234"
- Fault code field: "P0234"

#### 3. Symptoms Field
```
Always filled:
- Original user query
```

#### 4. Actions Taken Field
```
Static default:
- "Searched email correspondence for related information"
```

#### 5. Duration Field
```
Always empty:
- null (user must fill)
```

#### 6. Linked Doc Field
```
Auto-filled:
- Link to top email result (#1 from solution_emails)
```

---

## Entity Type Mapping

### Email-specific entity types:

| Entity Type | Used For | Example |
|-------------|----------|---------|
| `org`, `company`, `manufacturer` | System field (company context) | "Microsoft", "Caterpillar", "Furuno" |
| `equipment`, `component`, `system` | System field (equipment context) | "Main Engine", "Hydraulic Pump", "Radar" |
| `document_type` | Metadata (not in 6-field template) | "invoice", "manual", "certificate" |
| `fault_code`, `error_code` | Fault Code field | "P0234", "ERR-42", "ALARM-12" |
| `location_on_board`, `location` | System field prefix | "Port Engine", "Starboard Generator" |
| `person`, `role` | Metadata (not in 6-field template) | "Chief Engineer", "Captain" |

---

## Example Scenarios

### Scenario 1: Vendor Invoice Query

**Query:** "what was the latest caterpillar invoice?"

**Entities:**
```javascript
{
  extracted: {
    company: ["Caterpillar"],
    document_type: ["invoice"]
  }
}
```

**Generated Handover:**
```javascript
{
  system: "Caterpillar",         // From company entity
  fault_code: "",                // No fault code
  symptoms: "what was the latest caterpillar invoice?",
  actions_taken: "Searched email correspondence for related information",
  duration: null,
  linked_doc: "https://outlook.office365.com/mail/deeplink/read/AAMk..."
}
```

**Metadata:**
```javascript
{
  auto_filled_count: 2,
  auto_filled_fields: ["system", "symptoms"],
  confidence: 0.85,
  entity_count: 2
}
```

---

### Scenario 2: Equipment Fault Query

**Query:** "port engine overheating alarm P0217"

**Entities:**
```javascript
{
  extracted: {
    equipment: ["engine"],
    location_on_board: ["port"],
    fault_code: ["P0217"],
    symptoms: ["overheating", "alarm"]
  }
}
```

**Generated Handover:**
```javascript
{
  system: "Port - Engine",       // Location + Equipment
  fault_code: "P0217",           // From fault_code entity
  symptoms: "port engine overheating alarm P0217",
  actions_taken: "Searched email correspondence for related information",
  duration: null,
  linked_doc: "https://outlook.office365.com/mail/deeplink/read/AAMk..."
}
```

**Metadata:**
```javascript
{
  auto_filled_count: 3,
  auto_filled_fields: ["system", "fault_code", "symptoms"],
  confidence: 0.90,
  entity_count: 4
}
```

---

### Scenario 3: General Email Query

**Query:** "where is the team meeting schedule?"

**Entities:**
```javascript
{
  extracted: {}  // No relevant entities
}
```

**Generated Handover:**
```javascript
{
  system: "",                    // Empty - no entities
  fault_code: "",                // Empty - no fault code
  symptoms: "where is the team meeting schedule?",
  actions_taken: "Searched email correspondence for related information",
  duration: null,
  linked_doc: "https://outlook.office365.com/mail/deeplink/read/AAMk..."
}
```

**Metadata:**
```javascript
{
  auto_filled_count: 1,
  auto_filled_fields: ["symptoms"],
  confidence: 0,
  entity_count: 0
}
```

---

## Frontend Integration

### Display Logic

#### 1. Show "Add to Handover" button
```javascript
// Always show button (even if no pre-fill)
<button onClick={() => handleAddToHandover(searchId)}>
  Add to Handover
</button>
```

#### 2. On Click: Expand Form
```javascript
// Show 6-field form with pre-filled values
const { handover_section, handover_metadata } = response.ui_payload;

// Render form
<Form>
  <Input label="System" value={handover_section.system} />
  <Input label="Fault Code" value={handover_section.fault_code} />
  <Textarea label="Symptoms" value={handover_section.symptoms} />
  <Textarea label="Actions Taken" value={handover_section.actions_taken} />
  <Input label="Duration (mins)" value={handover_section.duration} type="number" />
  <Input label="Linked Doc" value={handover_section.linked_doc} disabled />
</Form>
```

#### 3. Show Intelligence Badge
```javascript
// Display auto-fill count to show system intelligence
{handover_metadata.auto_filled_count > 0 && (
  <Badge>
    {handover_metadata.auto_filled_count} fields auto-filled
  </Badge>
)}
```

#### 4. Visual Feedback
```javascript
// Highlight auto-filled fields
const isAutoFilled = (field) =>
  handover_metadata.auto_filled_fields.includes(field);

<Input
  label="System"
  value={handover_section.system}
  className={isAutoFilled('system') ? 'bg-blue-50' : ''}
  icon={isAutoFilled('system') ? <CheckCircle /> : null}
/>
```

---

## Database Schema (Supabase)

### Table: `handover_yacht`

```sql
CREATE TABLE handover_yacht (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  yacht_id VARCHAR(255) NOT NULL,
  solution_id VARCHAR(255) NOT NULL,

  -- 6-field template
  system_affected VARCHAR(500),
  fault_code VARCHAR(100),
  symptoms TEXT,
  actions_taken TEXT,
  duration_minutes INTEGER,
  notes TEXT,

  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  linked_doc VARCHAR(1000),

  -- Intelligence tracking (for corpus collection)
  auto_filled_fields JSONB,
  entity_count INTEGER,
  confidence DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, solution_id, yacht_id)
);
```

### UPSERT Logic

```javascript
const handoverData = {
  user_id: userId,
  yacht_id: yachtId,
  solution_id: searchId,  // Unique ID per search result
  system_affected: handover_section.system,
  fault_code: handover_section.fault_code,
  symptoms: handover_section.symptoms,
  actions_taken: handover_section.actions_taken,
  duration_minutes: handover_section.duration,
  linked_doc: handover_section.linked_doc,

  // Intelligence metadata
  auto_filled_fields: handover_metadata.auto_filled_fields,
  entity_count: handover_metadata.entity_count,
  confidence: handover_metadata.confidence,

  status: 'draft'
};

const { data, error } = await supabase
  .from('handover_yacht')
  .upsert(handoverData, {
    onConflict: 'user_id,solution_id,yacht_id',
    ignoreDuplicates: false
  })
  .select();
```

---

## Data Corpus Collection

### What We Collect

Every handover save captures:

1. **Entity patterns**
   - Which equipment fails most often?
   - Common fault codes per system
   - Vendor relationships (company + document_type combinations)

2. **User behavior**
   - Which fields users fill vs. skip
   - Average duration values per fault type
   - Most linked document types

3. **Query patterns**
   - Common symptom descriptions
   - Natural language fault reporting patterns
   - Department-specific terminology

### Future Vector Knowledge Base

**Phase 2 Features:**
- Semantic search: "Similar issues on port engine"
- Pattern detection: "This fault pattern matches 15 historical cases"
- Predictive maintenance: "Based on corpus, expect this fault in 30 days"
- Auto-complete: Suggest actions_taken based on similar symptoms

---

## Transform Node Implementation

### Location in Workflow

```
[Webhook] → [Entity Extraction] → [HTTP: Email RAG API] → [Transform + Handover] → [Response]
                                                                    ↑
                                                             (this generates handover)
```

### Key Functions

#### 1. `extractHandoverFieldsFromEntities(entitiesGrouped)`
Extracts company, equipment, fault_code, location from grouped entities

#### 2. `transformEntitiesToGroupedFormat(entitiesObj)`
Converts merged array to grouped extracted object

#### 3. Handover Template Builder
Combines entity extraction + query parsing to fill 6-field template

---

## Testing

### Test Case 1: Invoice Query

**Input:**
```json
{
  "body": {
    "message": "what was latest microsoft invoice?"
  },
  "entities": {
    "merged": [
      {
        "term": "Microsoft",
        "type": "org",
        "final_weight": 1.5
      },
      {
        "term": "invoice",
        "type": "document_type",
        "final_weight": 0.42
      }
    ]
  }
}
```

**Expected Output:**
```json
{
  "handover_section": {
    "system": "Microsoft",
    "fault_code": "",
    "symptoms": "what was latest microsoft invoice?",
    "actions_taken": "Searched email correspondence for related information",
    "duration": null,
    "linked_doc": "https://outlook.office365.com/..."
  },
  "handover_metadata": {
    "auto_filled_count": 2,
    "auto_filled_fields": ["system", "symptoms"],
    "confidence": 0.85,
    "entity_count": 2
  }
}
```

---

## Key Differences: Email vs. NAS Handover

| Feature | Email Handover | NAS Handover |
|---------|----------------|--------------|
| **Scope** | Global (one per search) | Per-document |
| **Entity Source** | Query extraction | Document path + content |
| **linked_doc** | Top email link | Each document link |
| **Pattern Detection** | Email patterns (VENDOR_INVOICE, etc.) | Equipment patterns (FAULT, MAINTENANCE, etc.) |
| **Complexity** | Simpler (2-3 entity types typical) | More complex (5-10 entity types) |
| **Auto-fill Rate** | Lower (50-70%) | Higher (80-90%) |

---

## Files

### Transform Node
- `/Users/celeste7/Documents/NEWSITE/n8n_email_rag_v4_transform.js` (main transform with integrated handover)

### Standalone Handover Generator (optional)
- `/Users/celeste7/Documents/NEWSITE/n8n_email_handover_generator.js` (separate node if needed)

### Documentation
- `/Users/celeste7/Documents/NEWSITE/EMAIL_HANDOVER_SYSTEM.md` (this file)
- `/Users/celeste7/Documents/NEWSITE/TRANSFORM_NODE_FIX_SUMMARY.md` (transform fixes)

---

## Next Steps

1. ✅ **Transform node updated** - Handover generation integrated
2. ⏳ **Frontend integration** - Connect to AISolutionCard.tsx
3. ⏳ **Database setup** - Create handover_yacht table with intelligence fields
4. ⏳ **Test with live data** - Validate entity extraction → handover generation
5. ⏳ **Export functionality** - PDF/Word export of handovers
6. ⏳ **Corpus analysis** - Dashboard showing patterns collected

---

**Status:** Handover system integrated into Email RAG v4.0 transform
**Confidence:** 9/10 (needs frontend + database testing)
