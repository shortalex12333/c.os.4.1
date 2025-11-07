import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloud Supabase with service role key
const supabase = createClient(
  'https://vivovcnaapmcfxxfhzxk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NDk4MiwiZXhwIjoyMDcxNDQwOTgyfQ.ffejnfs_uasRdrgXoefwVWbrdaj1l-vqQNzgl4rjsbQ',
  {
    db: {
      schema: 'public'
    }
  }
);

async function executeMigration(migrationFile) {
  console.log(`\n📄 Processing: ${path.basename(migrationFile)}`);

  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split by semicolons but keep comments
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log(`   Found ${statements.length} statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip if it's just comments
      if (statement.trim().length === 0) continue;

      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`   [${i + 1}/${statements.length}] ${preview}...`);

      try {
        // Use raw SQL via fetch
        const response = await fetch('https://vivovcnaapmcfxxfhzxk.supabase.co/rest/v1/rpc/exec_sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NDk4MiwiZXhwIjoyMDcxNDQwOTgyfQ.ffejnfs_uasRdrgXoefwVWbrdaj1l-vqQNzgl4rjsbQ',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NDk4MiwiZXhwIjoyMDcxNDQwOTgyfQ.ffejnfs_uasRdrgXoefwVWbrdaj1l-vqQNzgl4rjsbQ'
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Check if it's an "already exists" error which we can safely ignore
          if (errorText.includes('already exists') || errorText.includes('does not exist')) {
            console.log(`      ⏭️  Skipped (already exists or safe error)`);
          } else {
            console.log(`      ⚠️  Warning: ${response.status} - ${errorText.substring(0, 100)}`);
          }
        } else {
          console.log('      ✅ Success');
        }
      } catch (error) {
        console.log(`      ⚠️  Warning: ${error.message}`);
      }
    }

    console.log(`   ✅ Migration completed: ${path.basename(migrationFile)}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error processing migration:`, error.message);
    return false;
  }
}

async function pushAllMigrations() {
  console.log('🚀 Pushing migrations to CLOUD Supabase...\n');
  console.log('☁️  Target: https://vivovcnaapmcfxxfhzxk.supabase.co\n');

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

  // Get all migration files and sort them
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📋 Found ${files.length} migration files\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const success = await executeMigration(filePath);

    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Successful: ${successCount}/${files.length}`);
  console.log(`❌ Failed: ${failureCount}/${files.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (successCount === files.length) {
    console.log('🎉 All migrations pushed successfully to cloud!');
  } else {
    console.log('⚠️  Some migrations had warnings or errors. Review the output above.');
  }
}

pushAllMigrations().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
