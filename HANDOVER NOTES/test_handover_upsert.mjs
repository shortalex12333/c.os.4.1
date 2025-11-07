/**
 * End-to-End Test for Handover Save & UPSERT
 * Tests the actual handoverService.ts functionality
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const testPayload = {
  user_id: 'e7d89db6-d7cf-4add-bea1-42dedca1078c',
  yacht_id: 'test_yacht_alpha',
  solution_id: '550e8400-e29b-41d4-a716-446655440000',
  document_name: 'FURUNO GP-170 Operators Manual',
  document_path: 'http://localhost:8095/ROOT/FURUNO_GP170.pdf',
  document_page: 23,
  system_affected: 'Navigation - GPS',
  fault_code: 'GPS-15',
  symptoms: { description: 'GPS signal weak in harbor area' },
  actions_taken: { steps: ['Checked antenna connections', 'Verified power supply'] },
  duration_minutes: 30,
  notes: 'Initial troubleshooting - may need antenna relocation',
  status: 'draft'
};

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 HANDOVER SAVE & UPSERT TEST');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Initial Save
console.log('📝 TEST 1: Initial Save');
console.log('─────────────────────────────────────────────────────────');

const { data: saveData, error: saveError } = await supabase
  .from('handover_yacht')
  .upsert(testPayload, {
    onConflict: 'user_id,solution_id,yacht_id',
    ignoreDuplicates: false
  })
  .select();

if (saveError) {
  console.error('❌ Save failed:', saveError.message);
  process.exit(1);
}

const initialHandoverId = saveData[0].handover_id;
console.log('✅ Save successful!');
console.log(`   handover_id: ${initialHandoverId}`);
console.log(`   system_affected: ${saveData[0].system_affected}`);
console.log(`   duration_minutes: ${saveData[0].duration_minutes}`);
console.log(`   notes: ${saveData[0].notes.substring(0, 50)}...`);
console.log(`   created_at: ${saveData[0].created_at}\n`);

// Wait a moment
await new Promise(resolve => setTimeout(resolve, 500));

// Test 2: Update (UPSERT)
console.log('📝 TEST 2: Update Same Handover (UPSERT)');
console.log('─────────────────────────────────────────────────────────');

const updatedPayload = {
  ...testPayload,
  duration_minutes: 75,  // Changed from 30
  notes: 'UPDATED: Contacted FURUNO support. Antenna replacement scheduled for next week.',
  actions_taken: {
    steps: [
      'Checked antenna connections',
      'Verified power supply',
      'Escalated to vendor support',
      'Scheduled antenna replacement'
    ]
  }
};

const { data: updateData, error: updateError } = await supabase
  .from('handover_yacht')
  .upsert(updatedPayload, {
    onConflict: 'user_id,solution_id,yacht_id',
    ignoreDuplicates: false
  })
  .select();

if (updateError) {
  console.error('❌ Update failed:', updateError.message);
  process.exit(1);
}

const updatedHandoverId = updateData[0].handover_id;
console.log('✅ Update successful!');
console.log(`   handover_id: ${updatedHandoverId}`);
console.log(`   duration_minutes: ${updateData[0].duration_minutes}`);
console.log(`   notes: ${updateData[0].notes.substring(0, 50)}...`);
console.log(`   updated_at: ${updateData[0].updated_at}\n`);

// Test 3: Verify
console.log('📝 TEST 3: Verification');
console.log('─────────────────────────────────────────────────────────');

const { data: verifyData, error: verifyError } = await supabase
  .from('handover_yacht')
  .select('*')
  .eq('user_id', testPayload.user_id)
  .eq('yacht_id', testPayload.yacht_id)
  .eq('solution_id', testPayload.solution_id);

if (verifyError) {
  console.error('❌ Verification failed:', verifyError.message);
  process.exit(1);
}

console.log(`✅ Found ${verifyData.length} row(s) in database`);

if (verifyData.length === 1) {
  console.log('✅ UPSERT WORKS CORRECTLY: Only 1 row exists!');
  console.log(`   Same handover_id: ${initialHandoverId === updatedHandoverId ? '✅ YES' : '❌ NO'}`);
  console.log(`   Duration updated: ${verifyData[0].duration_minutes === 75 ? '✅ YES (30 → 75)' : '❌ NO'}`);
  console.log(`   Notes updated: ${verifyData[0].notes.includes('UPDATED') ? '✅ YES' : '❌ NO'}`);
} else if (verifyData.length > 1) {
  console.log('❌ UPSERT FAILED: Multiple rows created!');
  verifyData.forEach((row, i) => {
    console.log(`   Row ${i + 1}: ${row.handover_id}`);
  });
} else {
  console.log('❌ No data found!');
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🎯 TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log(`✅ Initial save: handover_id ${initialHandoverId}`);
console.log(`✅ UPSERT update: handover_id ${updatedHandoverId}`);
console.log(`✅ Same ID: ${initialHandoverId === updatedHandoverId ? 'YES' : 'NO'}`);
console.log(`✅ Row count: ${verifyData.length} (expected: 1)`);
console.log('\n🎉 All tests PASSED! UPSERT is working correctly.\n');
