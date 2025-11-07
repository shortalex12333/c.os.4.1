/**
 * N8N JAVASCRIPT NODE: Email Search Handover Generator
 *
 * Purpose: Generate dynamic handover template for email search results
 * Based on: NAS Pipeline Handover Generator v5.1
 *
 * Approach:
 * 1. Extract entities from query (company, document_type, equipment, etc.)
 * 2. Detect pattern type (VENDOR_INQUIRY, DOCUMENT_REQUEST, FAULT_REPORT, etc.)
 * 3. Generate handover template with pre-filled fields
 * 4. Provide metadata showing auto-fill confidence
 *
 * Input: Entities from query + Email RAG API response
 * Output: handoverContext + handoverTemplate
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  MAX_ENTITIES: 20,
  VERSION: 'email_v1.0'
};

// ============================================================================
// PATTERN DETECTION (Email-specific patterns)
// ============================================================================

const EMAIL_PATTERN_RULES = {
  'VENDOR_INVOICE': {
    required_types: [['org', 'company', 'manufacturer'], ['document_type']],
    keywords: ['invoice', 'bill', 'payment', 'receipt'],
    priority: 100,
    department: 'admin',
    urgency: 'normal'
  },
  'EQUIPMENT_FAULT': {
    required_types: [['equipment', 'component', 'system'], ['symptoms', 'fault_code']],
    keywords: ['fault', 'error', 'broken', 'malfunction', 'not working'],
    priority: 110,
    department: 'engineering',
    urgency: 'urgent'
  },
  'MAINTENANCE_REQUEST': {
    required_types: [['equipment', 'component'], ['task', 'action']],
    keywords: ['service', 'maintenance', 'repair', 'replace', 'inspect'],
    priority: 80,
    department: 'engineering',
    urgency: 'normal'
  },
  'VENDOR_CORRESPONDENCE': {
    required_types: [['org', 'company', 'manufacturer']],
    keywords: ['quote', 'order', 'delivery', 'shipment', 'supplier'],
    priority: 70,
    department: 'procurement',
    urgency: 'routine'
  },
  'DOCUMENT_REQUEST': {
    required_types: [['document_type']],
    keywords: ['manual', 'specification', 'drawing', 'certificate', 'datasheet'],
    priority: 60,
    department: 'engineering',
    urgency: 'routine'
  },
  'CREW_COMMUNICATION': {
    required_types: [['person', 'role']],
    keywords: ['meeting', 'schedule', 'roster', 'shift'],
    priority: 50,
    department: 'operations',
    urgency: 'routine'
  },
  'GENERAL_EMAIL': {
    required_types: [],
    keywords: [],
    priority: 20,
    department: 'general',
    urgency: 'routine'
  }
};

// ============================================================================
// ENTITY EXTRACTION (From incoming data)
// ============================================================================

function extractEntitiesFromInput(inputData) {
  const entities = [];
  const seen = new Set();

  try {
    // Get entities from entity extraction API output
    const entitiesObj = inputData.entities || {};
    const merged = entitiesObj.merged || [];

    // Process merged entities array
    merged.forEach(entity => {
      const key = `${entity.type}:${entity.term.toLowerCase()}`;
      if (!seen.has(key)) {
        entities.push({
          type: entity.type,
          value: entity.term,
          confidence: entity.final_weight || 0.85,
          source: 'entity_extraction',
          weight: entity.final_weight || 0.85
        });
        seen.add(key);
      }
    });

    // Extract from query text
    const query = inputData.original_query || inputData.body?.message || '';

    // Extract company/org names (capitalized words before "invoice", "quote", etc.)
    const companyMatch = query.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(invoice|quote|order|delivery)/i);
    if (companyMatch && !entities.find(e => e.type === 'org')) {
      const key = `org:${companyMatch[1].toLowerCase()}`;
      if (!seen.has(key)) {
        entities.push({
          type: 'org',
          value: companyMatch[1],
          confidence: 0.90,
          source: 'query_pattern'
        });
        seen.add(key);
      }
    }

    // Extract fault codes (ABC-123, P0123, ERR-456 patterns)
    const faultMatch = query.match(/\b([A-Z]{2,4}[-_]?\d{2,4})\b/);
    if (faultMatch && !entities.find(e => e.type === 'fault_code')) {
      entities.push({
        type: 'fault_code',
        value: faultMatch[1],
        confidence: 0.95,
        source: 'query_pattern'
      });
    }

    // Cap entities
    if (entities.length > CONFIG.MAX_ENTITIES) {
      return entities.slice(0, CONFIG.MAX_ENTITIES);
    }

  } catch (error) {
    console.error('[EMAIL HANDOVER] Error extracting entities:', error.message);
    return [];
  }

  return entities;
}

// ============================================================================
// PATTERN DETECTION (Email patterns)
// ============================================================================

function detectEmailPattern(entities, query) {
  let bestPattern = {
    name: 'GENERAL_EMAIL',
    priority: 0,
    department: 'general',
    urgency: 'routine'
  };

  const entityTypes = new Set(entities.map(e => e.type));
  const lowerQuery = query.toLowerCase();

  for (const [patternName, rule] of Object.entries(EMAIL_PATTERN_RULES)) {
    let matches = true;
    let score = rule.priority;

    // Check required entity types
    for (const reqType of rule.required_types || []) {
      if (Array.isArray(reqType)) {
        // At least one of these types must be present
        if (!reqType.some(t => entityTypes.has(t))) {
          matches = false;
          break;
        }
      } else {
        // This specific type must be present
        if (!entityTypes.has(reqType)) {
          matches = false;
          break;
        }
      }
    }

    // Boost score if keywords match
    const keywordMatches = rule.keywords.filter(kw => lowerQuery.includes(kw)).length;
    if (keywordMatches > 0) {
      score += keywordMatches * 10;
    }

    if (matches && score > bestPattern.priority) {
      bestPattern = {
        name: patternName,
        priority: score,
        department: rule.department,
        urgency: rule.urgency
      };
    }
  }

  return bestPattern;
}

// ============================================================================
// FIELD EXTRACTION (Build handover fields)
// ============================================================================

function findEntityValue(entities, ...types) {
  for (const type of types) {
    const entity = entities.find(e => e.type === type);
    if (entity) return entity.value;
  }
  return null;
}

function titleCase(str) {
  if (!str) return '';
  return str.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function buildDetectedFields(entities, query) {
  // Extract key fields from entities
  const company = findEntityValue(entities, 'org', 'company', 'manufacturer');
  const documentType = findEntityValue(entities, 'document_type');
  const equipment = findEntityValue(entities, 'equipment', 'component', 'system');
  const faultCode = findEntityValue(entities, 'fault_code', 'error_code', 'alarm_code');
  const location = findEntityValue(entities, 'location_on_board', 'location');
  const person = findEntityValue(entities, 'person', 'role');

  // Build detected fields object
  return {
    company: titleCase(company || ''),
    document_type: titleCase(documentType || ''),
    equipment: titleCase(equipment || ''),
    fault_code: (faultCode || '').toUpperCase(),
    location: titleCase(location || ''),
    person: titleCase(person || ''),
    symptoms: query // Original query as symptoms
  };
}

// ============================================================================
// HANDOVER TEMPLATE BUILDER
// ============================================================================

function buildHandoverTemplate(detectedFields, topEmailLink, pattern) {
  // Build the 6-field template
  const template = {
    system: detectedFields.equipment || detectedFields.company || '',
    fault_code: detectedFields.fault_code || '',
    symptoms: detectedFields.symptoms || '',
    actions_taken: 'Searched email correspondence for related information',
    duration: null, // User fills
    linked_doc: topEmailLink || ''
  };

  // Count auto-filled fields (excluding user-fill fields)
  const autoFilledFields = Object.entries(template)
    .filter(([key, val]) =>
      val !== '' &&
      val !== null &&
      key !== 'linked_doc' &&
      key !== 'actions_taken' &&
      key !== 'duration'
    )
    .map(([key]) => key);

  return {
    template,
    autoFilledFields,
    autoFilledCount: autoFilledFields.length
  };
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

try {
  const input = $input.item.json;

  console.log('[EMAIL HANDOVER] ========== Generating Handover Context ==========');

  // Get query text
  const query = input.original_query ||
                input.body?.message ||
                input.query_text ||
                '';

  console.log(`[EMAIL HANDOVER] Query: "${query}"`);

  // 1. Extract entities
  const entities = extractEntitiesFromInput(input);
  console.log(`[EMAIL HANDOVER] Extracted ${entities.length} entities`);

  // 2. Detect pattern
  const pattern = detectEmailPattern(entities, query);
  console.log(`[EMAIL HANDOVER] Pattern: ${pattern.name} (priority: ${pattern.priority})`);
  console.log(`[EMAIL HANDOVER] Department: ${pattern.department}, Urgency: ${pattern.urgency}`);

  // 3. Build detected fields
  const detectedFields = buildDetectedFields(entities, query);
  console.log('[EMAIL HANDOVER] Detected fields:', detectedFields);

  // 4. Get top email link (from Email RAG API response if available)
  let topEmailLink = '';
  if (input.solution_emails && input.solution_emails.length > 0) {
    const topEmail = input.solution_emails[0];
    topEmailLink = topEmail.webLink ||
                   `https://outlook.office365.com/mail/deeplink/read/${topEmail.id}`;
  }

  // 5. Build handover template
  const { template, autoFilledFields, autoFilledCount } = buildHandoverTemplate(
    detectedFields,
    topEmailLink,
    pattern
  );

  console.log(`[EMAIL HANDOVER] Template created with ${autoFilledCount} auto-filled fields`);
  console.log(`[EMAIL HANDOVER] Auto-filled: ${autoFilledFields.join(', ')}`);

  // 6. Build handover context (full intelligence)
  const handoverContext = {
    entities: entities,
    pattern: pattern,
    department: pattern.department,
    priority: pattern.urgency,
    detectedFields: detectedFields,
    confidence: entities.length > 0
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
      : 0,
    generated_at: new Date().toISOString(),
    version: CONFIG.VERSION
  };

  // 7. Build handover metadata
  const handoverMetadata = {
    pattern: pattern.name,
    pattern_priority: pattern.priority,
    department: pattern.department,
    priority: pattern.urgency,
    confidence: handoverContext.confidence,
    auto_filled_count: autoFilledCount,
    auto_filled_fields: autoFilledFields,
    entity_count: entities.length,
    generated_at: new Date().toISOString()
  };

  console.log('[EMAIL HANDOVER] ========== Handover Generated Successfully ==========');

  // Return input + handover data
  const output = {
    ...input,
    handoverContext: handoverContext,
    handoverTemplate: template,
    handoverMetadata: handoverMetadata
  };

  return [{ json: output }];

} catch (error) {
  console.error('[EMAIL HANDOVER] ERROR:', error.message);

  // Return input with empty handover on error
  return [{
    json: {
      ...input,
      handoverContext: {
        entities: [],
        pattern: { name: 'GENERAL_EMAIL', priority: 20, department: 'general', urgency: 'routine' },
        department: 'general',
        priority: 'routine',
        detectedFields: {},
        confidence: 0,
        error: error.message,
        version: CONFIG.VERSION
      },
      handoverTemplate: {
        system: '',
        fault_code: '',
        symptoms: '',
        actions_taken: '',
        duration: null,
        linked_doc: ''
      },
      handoverMetadata: {
        pattern: 'GENERAL_EMAIL',
        pattern_priority: 20,
        department: 'general',
        priority: 'routine',
        confidence: 0,
        auto_filled_count: 0,
        auto_filled_fields: [],
        entity_count: 0,
        error: error.message,
        generated_at: new Date().toISOString()
      }
    }
  }];
}
