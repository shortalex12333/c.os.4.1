/**
 * Test Script for QNAP NAS Integration
 * Verifies the complete workflow from setup to search
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

interface TestResult {
  test: string;
  success: boolean;
  responseTime: number;
  data?: any;
  error?: string;
}

async function runNASTests(): Promise<void> {
  console.log('🧪 Starting QNAP NAS Integration Tests...\n');
  
  const results: TestResult[] = [];

  // Test 1: Check server connectivity
  try {
    console.log('1️⃣ Testing server connectivity...');
    const start = Date.now();
    const response = await axios.get(`${BASE_URL}/ping`);
    const responseTime = Date.now() - start;
    
    results.push({
      test: 'Server Connectivity',
      success: response.status === 200,
      responseTime,
      data: response.data
    });
    
    console.log(`✅ Server responding in ${responseTime}ms`);
  } catch (error) {
    results.push({
      test: 'Server Connectivity',
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Server not responding');
  }

  // Test 2: Setup test environment
  try {
    console.log('\n2️⃣ Setting up QNAP test environment...');
    const start = Date.now();
    const response = await axios.post(`${BASE_URL}/nas/setup`);
    const responseTime = Date.now() - start;
    
    results.push({
      test: 'Environment Setup',
      success: response.data.success,
      responseTime,
      data: response.data
    });
    
    if (response.data.success) {
      console.log(`✅ Environment setup completed in ${responseTime}ms`);
      console.log(`   📁 Documents uploaded: ${response.data.data.documentsUploaded}`);
      console.log(`   🔗 NAS Status: ${response.data.data.nasStatus.connected ? 'Connected' : 'Disconnected'}`);
    } else {
      console.log('❌ Environment setup failed:', response.data.message);
    }
  } catch (error) {
    results.push({
      test: 'Environment Setup',
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Environment setup failed:', error);
  }

  // Test 3: Check NAS status
  try {
    console.log('\n3️⃣ Checking NAS status...');
    const start = Date.now();
    const response = await axios.get(`${BASE_URL}/nas/status`);
    const responseTime = Date.now() - start;
    
    results.push({
      test: 'NAS Status Check',
      success: response.data.success,
      responseTime,
      data: response.data
    });
    
    console.log(`✅ Status check completed in ${responseTime}ms`);
    console.log(`   🔗 Connected: ${response.data.data.connected}`);
    console.log(`   📍 Service: ${response.data.data.service}`);
    console.log(`   🌍 Location: ${response.data.data.location}`);
  } catch (error) {
    results.push({
      test: 'NAS Status Check',
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Status check failed');
  }

  // Test 4: Search documents
  try {
    console.log('\n4️⃣ Testing document search...');
    const start = Date.now();
    const response = await axios.post(`${BASE_URL}/nas/search`, {
      query: 'generator won\'t start',
      category: '02_ENGINEERING'
    });
    const responseTime = Date.now() - start;
    
    results.push({
      test: 'Document Search',
      success: response.data.success,
      responseTime,
      data: response.data
    });
    
    if (response.data.success) {
      console.log(`✅ Search completed in ${responseTime}ms`);
      console.log(`   📄 Results found: ${response.data.data.results}`);
      console.log(`   🔍 Search source: ${response.data.data.source}`);
      console.log(`   🛠️ Solutions available: ${response.data.maritime_data.solutions.length}`);
    } else {
      console.log('❌ Search failed:', response.data.message);
    }
  } catch (error) {
    results.push({
      test: 'Document Search',
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Document search failed');
  }

  // Test 5: Integration test
  try {
    console.log('\n5️⃣ Running full integration test...');
    const start = Date.now();
    const response = await axios.post(`${BASE_URL}/nas/test`);
    const responseTime = Date.now() - start;
    
    results.push({
      test: 'Full Integration',
      success: response.data.success,
      responseTime,
      data: response.data
    });
    
    if (response.data.success) {
      console.log(`✅ Integration test completed in ${responseTime}ms`);
      console.log(`   📊 Success rate: ${response.data.data.summary.successRate}`);
      console.log(`   ⚡ Average response: ${response.data.data.summary.averageResponseTime}`);
      console.log(`   🔗 N8N compatibility: ${response.data.data.integration.n8nCompatibility}`);
    } else {
      console.log('❌ Integration test failed:', response.data.message);
    }
  } catch (error) {
    results.push({
      test: 'Full Integration',
      success: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.log('❌ Integration test failed');
  }

  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / passedTests;
  
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS');
  console.log('-'.repeat(50));
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    if (result.success) {
      console.log(`   Response time: ${result.responseTime}ms`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Final verdict
  console.log('\n🎯 FINAL VERDICT');
  console.log('='.repeat(50));
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! QNAP integration is working correctly.');
    console.log('✅ Ready for yacht deployment testing.');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️  MOSTLY WORKING with some issues to address.');
    console.log('🔧 Check failed tests and retry.');
  } else {
    console.log('🚨 MAJOR ISSUES DETECTED. Integration needs fixing.');
    console.log('❌ Not ready for deployment.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runNASTests().catch(console.error);
}

export default runNASTests;