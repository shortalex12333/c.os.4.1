/**
 * Restore backup data to Supabase using Node.js
 */

const fs = require('fs');
const path = require('path');

// Read the backup file
const backupPath = path.join(__dirname, '../supabase/backups/20251002/backup_data_20251002_110005.sql');
const backupSQL = fs.readFileSync(backupPath, 'utf8');

console.log('📂 Reading backup file...');
console.log(`   File size: ${(backupSQL.length / 1024).toFixed(2)} KB`);

// Split into individual statements
const statements = backupSQL
  .split(';\n')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET'));

console.log(`📝 Found ${statements.length} SQL statements to execute`);

// Execute via psql command
const { execSync } = require('child_process');

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

console.log('\n🔄 Restoring data...\n');

try {
  // Try to use psql if available
  execSync(`echo "${backupSQL.replace(/"/g, '\\"')}" | psql "${DB_URL}"`, {
    stdio: 'inherit',
    shell: '/bin/bash'
  });
  console.log('\n✅ Data restored successfully!');
} catch (error) {
  console.error('\n❌ psql not found. Trying alternative method...\n');

  // Alternative: Write SQL to temp file and execute via docker
  const tempFile = '/tmp/restore_backup.sql';
  fs.writeFileSync(tempFile, backupSQL);

  try {
    // Find Supabase container
    const containers = execSync('docker ps --filter "name=postgres" --format "{{.Names}}"')
      .toString()
      .trim()
      .split('\n');

    const supabaseContainer = containers.find(c => c.includes('supabase') || c.includes('db'));

    if (supabaseContainer) {
      console.log(`📦 Using container: ${supabaseContainer}`);

      execSync(`cat ${tempFile} | docker exec -i ${supabaseContainer} psql -U postgres -d postgres`, {
        stdio: 'inherit'
      });

      console.log('\n✅ Data restored successfully via Docker!');
    } else {
      console.error('❌ Could not find Supabase container');
      console.log('\n📝 Manual restore instructions:');
      console.log('1. Install PostgreSQL: brew install postgresql');
      console.log('2. Run: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f ' + backupPath);
    }
  } catch (dockerError) {
    console.error('❌ Docker method failed:', dockerError.message);
    console.log('\n📝 Please install PostgreSQL and run:');
    console.log('   brew install postgresql');
    console.log('   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f ' + backupPath);
  }
}
