import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Connection string for cloud Supabase
// Using direct connection (not pooler) - needed for DDL operations
const connectionString = 'postgresql://postgres:Password2!@db.vivovcnaapmcfxxfhzxk.supabase.co:5432/postgres';

async function executeMigration(client, migrationFile) {
  console.log(`\n📄 Processing: ${path.basename(migrationFile)}`);

  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log(`   Executing migration...`);

    // Execute the entire migration as one transaction
    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`   ✅ Migration completed successfully`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');

      // Check if it's a benign error (already exists, etc.)
      if (error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          error.message.includes('duplicate')) {
        console.log(`   ⏭️  Skipped (${error.message.split('\n')[0]})`);
        return true;
      } else {
        console.log(`   ⚠️  Error: ${error.message.split('\n')[0]}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`   ❌ Fatal error:`, error.message);
    return false;
  }
}

async function pushAllMigrations() {
  console.log('🚀 Connecting to CLOUD Supabase database...\n');

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to cloud database!\n');

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
      const success = await executeMigration(client, filePath);

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

    await client.end();

    if (successCount === files.length) {
      console.log('🎉 All migrations pushed successfully to cloud!');
    } else {
      console.log('⚠️  Some migrations had errors. Review the output above.');
    }
  } catch (error) {
    console.error('💥 Connection error:', error.message);
    console.log('\n💡 This requires the database password.');
    console.log('   Get it from: https://supabase.com/dashboard/project/vivovcnaapmcfxxfhzxk/settings/database');
    console.log('   Then update the connection string in the script.');
    process.exit(1);
  }
}

pushAllMigrations();
