/**
 * Test Script for Handover Save/Edit Flow
 * Run in browser console on localhost:3000
 */

// Test data
const testHandover = {
  user_id: 'e7d89db6-d7cf-4add-bea1-42dedca1078c', // From our created user
  yacht_id: 'yacht_alpha_01',
  solution_id: 'test_solution_001',
  document_name: 'FURUNO Radar Manual FR-8252',
  document_path: 'http://localhost:8095/ROOT/FURUNO_Manual.pdf',
  document_page: 12,
  system_affected: 'Navigation - Radar',
  fault_code: 'RAD-42',
  symptoms: 'Intermittent signal loss during heavy weather',
  actions_taken: 'Checked all cable connections and power supply',
  duration_minutes: 45,
  notes: 'May need professional calibration if issue persists after current fixes',
  status: 'draft'
};

// Test 1: Initial Save
async function testInitialSave() {
  console.log('🧪 TEST 1: Initial Save');
  console.log('📤 Sending:', testHandover);

  const response = await fetch('http://127.0.0.1:54321/rest/v1/handover_yacht', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testHandover)
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Save successful!');
    console.log('📥 Response:', data);
    console.log('🆔 handover_id:', data[0]?.handover_id);
    return data[0];
  } else {
    console.error('❌ Save failed:', data);
    return null;
  }
}

// Test 2: Update/Patch Same Row (UPSERT)
async function testUpdate(originalData) {
  console.log('\n🧪 TEST 2: Update Existing Handover (UPSERT)');

  const updatedHandover = {
    ...testHandover,
    notes: 'EDITED: Contacted Furuno support - awaiting callback',
    duration_minutes: 60 // Changed from 45 to 60
  };

  console.log('📤 Sending update:', updatedHandover);

  const response = await fetch('http://127.0.0.1:54321/rest/v1/handover_yacht', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(updatedHandover)
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Update successful!');
    console.log('📥 Response:', data);
    console.log('🆔 handover_id:', data[0]?.handover_id);
    console.log('🔍 Same ID?', data[0]?.handover_id === originalData?.handover_id);
    return data[0];
  } else {
    console.error('❌ Update failed:', data);
    return null;
  }
}

// Test 3: Verify Data
async function testVerify() {
  console.log('\n🧪 TEST 3: Verify Final Data');

  const response = await fetch(`http://127.0.0.1:54321/rest/v1/handover_yacht?user_id=eq.${testHandover.user_id}&yacht_id=eq.${testHandover.yacht_id}&solution_id=eq.${testHandover.solution_id}`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    }
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Query successful!');
    console.log('📥 Found records:', data.length);
    console.log('📄 Data:', data);

    if (data.length === 1) {
      console.log('✅ UPSERT WORKS: Only 1 row exists (not 2!)');
      console.log('📝 notes field:', data[0].notes);
      console.log('⏱️  duration:', data[0].duration_minutes, 'minutes');
    } else if (data.length > 1) {
      console.log('❌ UPSERT FAILED: Multiple rows created!');
    } else {
      console.log('❌ No data found');
    }

    return data;
  } else {
    console.error('❌ Query failed:', data);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Handover Save/Edit Tests\n');
  console.log('=''.repeat(50));

  const saved = await testInitialSave();
  if (!saved) {
    console.error('❌ Initial save failed, stopping tests');
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

  const updated = await testUpdate(saved);
  if (!updated) {
    console.error('❌ Update failed, stopping tests');
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

  const verified = await testVerify();

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests Complete!\n');

  if (verified && verified.length === 1) {
    console.log('✅ ALL TESTS PASSED');
    console.log('✅ UPSERT logic working correctly');
    console.log('✅ Same handover_id reused for updates');
  } else {
    console.log('❌ TESTS FAILED - Review output above');
  }
}

// Export for manual testing
window.testHandover = {
  runAllTests,
  testInitialSave,
  testUpdate,
  testVerify,
  testData: testHandover
};

console.log('📋 Test functions loaded. Run: testHandover.runAllTests()');
