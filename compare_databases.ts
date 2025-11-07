import { createClient } from '@supabase/supabase-js';

// Local Supabase
const localClient = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

// Cloud Supabase
const cloudClient = createClient(
  'https://vivovcnaapmcfxxfhzxk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjQ5ODIsImV4cCI6MjA3MTQ0MDk4Mn0.eUICOqJRP_MyVMNJNlZu3Mc-1-jAG6nQE-Oy0k3Yr0E'
);

async function getTables(client: any, name: string): Promise<string[]> {
  try {
    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      // Try alternative method
      const response = await fetch(`${client.supabaseUrl}/rest/v1/rpc/get_tables`, {
        method: 'POST',
        headers: {
          'apikey': client.supabaseKey,
          'Authorization': `Bearer ${client.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tables from ${name}`);
      }

      const tables = await response.json();
      return tables.map((t: any) => t.table_name);
    }

    return data?.map(t => t.table_name) || [];
  } catch (error) {
    console.error(`Error fetching ${name} tables:`, error);
    return [];
  }
}

async function compareDatabases() {
  console.log('🔍 Comparing LOCAL vs CLOUD Supabase databases...\n');

  console.log('📊 Fetching LOCAL tables...');
  const localTables = await getTables(localClient, 'LOCAL');
  console.log(`   Found ${localTables.length} tables in LOCAL\n`);

  console.log('☁️  Fetching CLOUD tables...');
  const cloudTables = await getTables(cloudClient, 'CLOUD');
  console.log(`   Found ${cloudTables.length} tables in CLOUD\n`);

  // Find tables in LOCAL but NOT in CLOUD
  const missingInCloud = localTables.filter(table => !cloudTables.includes(table));

  // Find tables in CLOUD but NOT in LOCAL
  const missingInLocal = cloudTables.filter(table => !localTables.includes(table));

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 COMPARISON RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (missingInCloud.length > 0) {
    console.log(`❌ MISSING IN CLOUD (${missingInCloud.length} tables):`);
    console.log('   These tables exist in LOCAL but NOT in CLOUD:\n');
    missingInCloud.sort().forEach(table => {
      console.log(`   • ${table}`);
    });
    console.log('');
  } else {
    console.log('✅ All local tables exist in cloud!\n');
  }

  if (missingInLocal.length > 0) {
    console.log(`ℹ️  MISSING IN LOCAL (${missingInLocal.length} tables):`);
    console.log('   These tables exist in CLOUD but NOT in LOCAL:\n');
    missingInLocal.sort().forEach(table => {
      console.log(`   • ${table}`);
    });
    console.log('');
  }

  // Common tables
  const commonTables = localTables.filter(table => cloudTables.includes(table));
  console.log(`✅ COMMON TABLES: ${commonTables.length} tables exist in both`);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📝 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   LOCAL:  ${localTables.length} tables`);
  console.log(`   CLOUD:  ${cloudTables.length} tables`);
  console.log(`   COMMON: ${commonTables.length} tables`);
  console.log(`   LOCAL ONLY: ${missingInCloud.length} tables ⚠️`);
  console.log(`   CLOUD ONLY: ${missingInLocal.length} tables`);
  console.log('');
}

compareDatabases().catch(console.error);
