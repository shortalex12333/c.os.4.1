# Outlook RAG Transform - Quick Reference

**Date:** October 22, 2025
**Status:** ✅ Ready for n8n deployment

---

## 📁 Main Files (USE THESE)

### 1. Transform Node Code ⭐
**File:** `OUTLOOK_RAG_TRANSFORM.js`
**Purpose:** Main transform node for n8n workflow
**Use:** Copy this entire file into your **Code3** node in n8n

**Location:**
```
/Users/celeste7/Documents/NEWSITE/OUTLOOK_RAG_TRANSFORM.js
```

**Workflow Position:**
```
[Previous Node] → [Outlook RAG] → [Code3 (PASTE HERE)] → [Response]
```

### 2. Handover Generator (Optional)
**File:** `OUTLOOK_HANDOVER_GENERATOR.js`
**Purpose:** Standalone handover generation (if you want a separate node)
**Use:** Optional - handover is already integrated in main transform

---

## 🚀 Quick Start

### Step 1: Copy Transform Code
```bash
cat /Users/celeste7/Documents/NEWSITE/OUTLOOK_RAG_TRANSFORM.js
```

### Step 2: Paste into n8n
1. Open n8n workflow
2. Find **Code3** node
3. Delete all existing code
4. Paste the code from `OUTLOOK_RAG_TRANSFORM.js`
5. Save

### Step 3: Test
1. Send a test query: "what was the microsoft invoice amount?"
2. Check Code3 output
3. Verify handover fields are auto-filled

---

## 📊 What It Does

### Input (from "Outlook RAG" node)
```json
[{
  "tier": "uncertain",
  "confidence": 0.6501,
  "solution_emails": [5 emails],
  "entities": {
    "merged": [
      {"term": "Microsoft", "type": "org", "final_weight": 1.5},
      {"term": "invoice", "type": "document_type", "final_weight": 0.4225}
    ]
  }
}]
```

### Output (to frontend)
```json
{
  "success": true,
  "ux_display": "search_mode",
  "ui_payload": {
    "primary_findings": [5 emails],
    "other_emails": [],
    "all_emails": [5 emails],
    "summary": {...},
    "handover_section": {
      "system": "Microsoft",           // ✅ Auto-filled!
      "symptoms": "what was the microsoft invoice amount?",
      "fault_code": "",
      "actions_taken": "Searched email correspondence for related information",
      "duration": null,
      "linked_doc": "https://outlook.office365.com/mail/..."
    },
    "handover_metadata": {
      "auto_filled_count": 2,
      "auto_filled_fields": ["system", "symptoms"]
    }
  }
}
```

---

## 📚 Documentation (Reference)

| File | Purpose |
|------|---------|
| `EMAIL_RAG_V4_COMPLETE_SUMMARY.md` | Complete implementation guide |
| `EMAIL_HANDOVER_SYSTEM.md` | Handover system architecture |
| `TRANSFORM_NODE_FIX_NODE_REFERENCES.md` | Latest fix (node references) |
| `PIPELINE_FIX_ENTITIES_IN_OUTPUT.md` | Pipeline fix for entities |

---

## 🔧 API Configuration

**Email RAG API Endpoint:**
```
POST http://localhost:5156/api/v4/search-emails
```

**Services Required:**
- ✅ Email RAG API (port 5156)
- ✅ Entity Extractor (ports 5400, 5401)
- ✅ Supabase (port 54321)

**Check Health:**
```bash
curl http://localhost:5156/health
```

---

## ✅ Features

- [x] Array-wrapped response handling
- [x] Entity extraction from API response
- [x] Entity transformation (merged → extracted)
- [x] Dynamic handover generation
- [x] Auto-fill handover fields (system, symptoms)
- [x] Rescued emails handling
- [x] Debug logging throughout
- [x] Error handling (token expiry, network, etc.)

---

## 🐛 Troubleshooting

### Error: "Referenced node doesn't exist"
**Solution:** ✅ Fixed - No longer references non-existent nodes

### Error: "Handover fields are empty"
**Solution:** ✅ Fixed - Pipeline now returns entities in response

### Error: "No entities in API response"
**Solution:** ✅ Fixed - Email RAG API v4.0 now includes entities

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 20 | Initial transform node |
| 1.1 | Oct 21 | Added handover generation |
| 1.2 | Oct 21 | Pipeline fix - entities in API response |
| 1.3 | Oct 22 | Fixed node references (removed Webhook) |

---

**Current Version:** 1.3
**File:** `OUTLOOK_RAG_TRANSFORM.js`
**Ready to Deploy:** ✅ YES
