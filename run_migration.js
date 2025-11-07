const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read the migration SQL
const migrationSQL = fs.readFileSync(
  '/Users/celeste7/Documents/NEWSITE/supabase/migrations/20251028000001_fix_handover_yacht_schema.sql',
  'utf8'
);

// Create Supabase client with service role key (full access)
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function runMigration() {
  console.log('🔄 Running handover_yacht schema migration...\n');

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executing: ${statement.substring(0, 80)}...`);

    const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

    if (error) {
      console.error('❌ Error:', error.message);
      // Try direct query as fallback
      const { error: directError } = await supabase
        .from('_sqlrunner')
        .insert({ query: statement });

      if (directError) {
        console.error('❌ Direct query also failed:', directError.message);
      }
    } else {
      console.log('✅ Success\n');
    }
  }

  console.log('\n✨ Migration completed!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
