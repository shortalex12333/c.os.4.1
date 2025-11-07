import { createClient } from '@supabase/supabase-js';

// Cloud Supabase with service role key for admin access
const cloudClient = createClient(
  'https://vivovcnaapmcfxxfhzxk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NDk4MiwiZXhwIjoyMDcxNDQwOTgyfQ.5rXnXCrV4SWwZ-RLvDZxpD1ueR4DP-yIE9JMXcgVBdI'
);

async function getCloudTables() {
  console.log('☁️  Fetching CLOUD tables via SQL query...\n');

  try {
    // Try direct SQL query via rpc
    const { data, error } = await cloudClient.rpc('exec_sql', {
      sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
    });

    if (error) {
      console.log('RPC method failed, trying alternative...');

      // Alternative: Try to query any known table to see what's available
      const { data: testData, error: testError } = await cloudClient
        .from('handover_yacht')
        .select('*')
        .limit(1);

      if (testError) {
        console.log('Table query test:', testError.message);
      } else {
        console.log('✅ Successfully connected to cloud database!');
        console.log('handover_yacht table exists and is accessible');
      }

      // Try to get the schema via PostgREST
      const response = await fetch('https://vivovcnaapmcfxxfhzxk.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NDk4MiwiZXhwIjoyMDcxNDQwOTgyfQ.5rXnXCrV4SWwZ-RLvDZxpD1ueR4DP-yIE9JMXcgVBdI',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdm92Y25hYXBtY2Z4eGZoenhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg2NDk4MiwiZXhwIjoyMDcxNDQwOTgyfQ.5rXnXCrV4SWwZ-RLvDZxpD1ueR4DP-yIE9JMXcgVBdI'
        }
      });

      const schema = await response.json();

      if (schema.definitions) {
        const tables = Object.keys(schema.definitions);
        console.log('\n📋 Tables found in CLOUD (via OpenAPI schema):');
        console.log(`   Total: ${tables.length} tables\n`);
        tables.sort().forEach(table => {
          console.log(`   • ${table}`);
        });
        return tables;
      } else {
        console.log('Schema response:', JSON.stringify(schema, null, 2));
      }
    } else {
      const tables = data.map(row => row.tablename);
      console.log('✅ Found tables via RPC:', tables);
      return tables;
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  return [];
}

getCloudTables().catch(console.error);
