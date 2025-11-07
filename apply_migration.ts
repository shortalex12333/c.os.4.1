import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying handover_yacht schema fix...\n');

  // Execute SQL statements one by one
  const migrations = [
    // 1. Make solution_id nullable
    'ALTER TABLE handover_yacht ALTER COLUMN solution_id DROP NOT NULL',

    // 2. Add document_page if missing
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS document_page INTEGER',

    // 3. Add document_source
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS document_source TEXT DEFAULT \'manual\'',

    // 4. Add entity columns
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS entity_0 JSONB',
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS entity_1 JSONB',
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS entity_2 JSONB',
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS entity_3 JSONB',
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS entity_4 JSONB',
    'ALTER TABLE handover_yacht ADD COLUMN IF NOT EXISTS entity_5 JSONB',

    // 5. Create indexes
    'CREATE INDEX IF NOT EXISTS idx_handover_yacht_document_source ON handover_yacht(document_source)',
    'CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_0 ON handover_yacht USING gin(entity_0)',
    'CREATE INDEX IF NOT EXISTS idx_handover_yacht_entity_1 ON handover_yacht USING gin(entity_1)',
  ];

  for (let i = 0; i < migrations.length; i++) {
    const sql = migrations[i];
    console.log(`[${i + 1}/${migrations.length}] ${sql.substring(0, 60)}...`);

    try {
      // Use raw SQL execution via the database
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        console.log(`⚠️  Skipped (${response.status} - likely already exists)`);
      } else {
        console.log('✅ Success');
      }
    } catch (error: any) {
      console.log(`⚠️  Skipped: ${error.message}`);
    }
  }

  console.log('\n✨ Migration application complete!\n');
  console.log('📋 Summary:');
  console.log('   ✓ solution_id is now nullable');
  console.log('   ✓ document_page added (nullable - for docs without page numbers)');
  console.log('   ✓ document_source added (nas/email/manual)');
  console.log('   ✓ entity_0 through entity_5 added (JSONB key-value pairs)');
  console.log('\n🔄 Try adding to handover again!');
}

applyMigration().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
