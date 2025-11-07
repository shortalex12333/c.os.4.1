/**
 * Integration Test for JWT Token Refresh System
 *
 * Tests:
 * 1. Token expiry detection
 * 2. Document path extraction from JWT
 * 3. Single token refresh
 * 4. Batch token refresh
 * 5. Chat history refresh
 *
 * Run with: npx tsx test_token_refresh.ts
 */

import { tokenRefreshService, autoRefreshChatTokens } from './client/services/tokenRefreshService';
import { documentJWTService } from './client/services/documentJWTService';

// Test utilities
const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(emoji: string, message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${emoji} ${message}${COLORS.reset}`);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    log('❌', `ASSERTION FAILED: ${message}`, 'red');
    throw new Error(message);
  }
  log('✓', message, 'green');
}

// Test configuration
const TEST_CONFIG = {
  userId: 'test-crew-123',
  userRole: 'chief_engineer',
  testDocumentPath: '/ROOT/02_ENGINEERING/CAT/3516C/3516C_Marine_Engine_Manual.pdf'
};

/**
 * Test 1: Create a fresh JWT token and verify it works
 */
async function test1_CreateFreshToken() {
  log('🧪', 'TEST 1: Creating fresh JWT token', 'blue');

  try {
    const freshUrl = await documentJWTService.getSecureDocumentURL(
      TEST_CONFIG.testDocumentPath,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    assert(freshUrl.includes('/api/documents/stream/'), 'URL should contain stream endpoint');
    assert(freshUrl.includes('eyJ'), 'URL should contain JWT token');

    log('✅', `Fresh token created: ${freshUrl.substring(0, 80)}...`, 'green');
    return freshUrl;

  } catch (error) {
    log('❌', `Failed to create fresh token: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 2: Test token expiry detection
 */
async function test2_TokenExpiryDetection(validUrl: string) {
  log('🧪', 'TEST 2: Testing token expiry detection', 'blue');

  try {
    // Fresh token should NOT be expired
    const isExpired = (tokenRefreshService as any).isTokenExpired(validUrl);
    assert(!isExpired, 'Fresh token should not be expired');

    // Create an expired token manually (exp in the past)
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
      document_path: TEST_CONFIG.testDocumentPath,
      sub: TEST_CONFIG.userId
    };

    const expiredToken = btoa(JSON.stringify(expiredPayload));
    const expiredUrl = `http://localhost:8098/api/documents/stream/header.${expiredToken}.signature`;

    const isExpiredCheck = (tokenRefreshService as any).isTokenExpired(expiredUrl);
    assert(isExpiredCheck, 'Expired token should be detected as expired');

    log('✅', 'Token expiry detection working correctly', 'green');

  } catch (error) {
    log('❌', `Token expiry detection failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 3: Test document path extraction
 */
async function test3_DocumentPathExtraction(validUrl: string) {
  log('🧪', 'TEST 3: Testing document path extraction', 'blue');

  try {
    const extractedPath = await (tokenRefreshService as any).extractDocumentPath(validUrl);

    assert(extractedPath !== null, 'Should extract document path');
    assert(extractedPath === TEST_CONFIG.testDocumentPath,
      `Extracted path should match (got: ${extractedPath})`);

    log('✅', `Document path extracted: ${extractedPath}`, 'green');

  } catch (error) {
    log('❌', `Document path extraction failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 4: Test single document link refresh
 */
async function test4_SingleLinkRefresh() {
  log('🧪', 'TEST 4: Testing single document link refresh', 'blue');

  try {
    // Create an expired token
    const oldUrl = await documentJWTService.getSecureDocumentURL(
      TEST_CONFIG.testDocumentPath,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    // Simulate waiting (we'll just test the refresh mechanism)
    const documentLink = {
      url: oldUrl,
      document_path: TEST_CONFIG.testDocumentPath,
      page: 5
    };

    const result = await tokenRefreshService.refreshDocumentLink(
      documentLink,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    assert(result.success, 'Refresh should succeed');
    assert(result.refreshed_url !== result.original_url, 'New URL should be different');
    assert(result.refreshed_url.includes('#page=5'), 'Page parameter should be preserved');
    assert(result.document_path === TEST_CONFIG.testDocumentPath, 'Document path should match');

    log('✅', 'Single link refresh successful', 'green');
    log('📝', `  Old URL: ${result.original_url.substring(0, 60)}...`, 'yellow');
    log('📝', `  New URL: ${result.refreshed_url.substring(0, 60)}...`, 'yellow');

  } catch (error) {
    log('❌', `Single link refresh failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 5: Test batch document link refresh
 */
async function test5_BatchLinkRefresh() {
  log('🧪', 'TEST 5: Testing batch document link refresh', 'blue');

  try {
    // Create multiple document links
    const documentLinks = [
      {
        url: await documentJWTService.getSecureDocumentURL(TEST_CONFIG.testDocumentPath, TEST_CONFIG.userId, TEST_CONFIG.userRole),
        document_path: TEST_CONFIG.testDocumentPath,
        page: 1
      },
      {
        url: await documentJWTService.getSecureDocumentURL(TEST_CONFIG.testDocumentPath, TEST_CONFIG.userId, TEST_CONFIG.userRole),
        document_path: TEST_CONFIG.testDocumentPath,
        page: 10
      },
      {
        url: await documentJWTService.getSecureDocumentURL(TEST_CONFIG.testDocumentPath, TEST_CONFIG.userId, TEST_CONFIG.userRole),
        document_path: TEST_CONFIG.testDocumentPath,
        page: 20
      }
    ];

    const results = await tokenRefreshService.refreshDocumentLinks(
      documentLinks,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    assert(results.length === 3, 'Should return 3 results');
    assert(results.every(r => r.success), 'All refreshes should succeed');

    log('✅', `Batch refresh successful (${results.length} links)`, 'green');

  } catch (error) {
    log('❌', `Batch link refresh failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 6: Test chat history refresh
 */
async function test6_ChatHistoryRefresh() {
  log('🧪', 'TEST 6: Testing chat history refresh with expired tokens', 'blue');

  try {
    // Create mock chat history with expired tokens
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
      document_path: TEST_CONFIG.testDocumentPath,
      sub: TEST_CONFIG.userId
    };
    const expiredToken = btoa(JSON.stringify(expiredPayload));
    const expiredUrl = `http://localhost:8098/api/documents/stream/header.${expiredToken}.signature`;

    const mockChatHistory = [
      {
        id: 'msg-1',
        text: 'Here are the engine specs',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        document_links: [
          {
            url: expiredUrl,
            document_path: TEST_CONFIG.testDocumentPath,
            page: 5,
            title: 'Engine Manual'
          }
        ]
      },
      {
        id: 'msg-2',
        text: 'Check these specifications',
        timestamp: new Date(Date.now() - 500000).toISOString(),
        document_links: [
          {
            url: expiredUrl,
            document_path: TEST_CONFIG.testDocumentPath,
            page: 12,
            title: 'Specifications'
          }
        ]
      }
    ];

    // Refresh chat history
    const refreshedHistory = await tokenRefreshService.refreshChatDocumentLinks(
      mockChatHistory,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    assert(refreshedHistory.length === 2, 'Should have 2 messages');
    assert(
      refreshedHistory[0].document_links[0].url !== expiredUrl,
      'First message URL should be refreshed'
    );
    assert(
      refreshedHistory[1].document_links[0].url !== expiredUrl,
      'Second message URL should be refreshed'
    );
    assert(
      refreshedHistory[0].document_links[0].refreshed_at,
      'Should have refreshed_at timestamp'
    );

    log('✅', 'Chat history refresh successful', 'green');
    log('📝', `  Refreshed ${refreshedHistory.length} messages`, 'yellow');

  } catch (error) {
    log('❌', `Chat history refresh failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 7: Test auto-refresh with mixed tokens
 */
async function test7_AutoRefreshMixed() {
  log('🧪', 'TEST 7: Testing auto-refresh with mixed expired/valid tokens', 'blue');

  try {
    // Create fresh token
    const freshUrl = await documentJWTService.getSecureDocumentURL(
      TEST_CONFIG.testDocumentPath,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    // Create expired token
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 300,
      document_path: TEST_CONFIG.testDocumentPath,
      sub: TEST_CONFIG.userId
    };
    const expiredToken = btoa(JSON.stringify(expiredPayload));
    const expiredUrl = `http://localhost:8098/api/documents/stream/header.${expiredToken}.signature`;

    const mockChatHistory = [
      {
        id: 'msg-1',
        text: 'Fresh link',
        document_links: [{ url: freshUrl, document_path: TEST_CONFIG.testDocumentPath }]
      },
      {
        id: 'msg-2',
        text: 'Expired link',
        document_links: [{ url: expiredUrl, document_path: TEST_CONFIG.testDocumentPath }]
      }
    ];

    const result = await autoRefreshChatTokens(
      mockChatHistory,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    assert(result.refreshed === true, 'Should detect and refresh expired tokens');
    assert(result.chatHistory.length === 2, 'Should preserve all messages');

    log('✅', 'Auto-refresh with mixed tokens successful', 'green');

  } catch (error) {
    log('❌', `Auto-refresh test failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Test 8: Test performance with large chat history
 */
async function test8_PerformanceTest() {
  log('🧪', 'TEST 8: Testing performance with large chat history', 'blue');

  try {
    // Create expired token
    const expiredPayload = {
      exp: Math.floor(Date.now() / 1000) - 300,
      document_path: TEST_CONFIG.testDocumentPath,
      sub: TEST_CONFIG.userId
    };
    const expiredToken = btoa(JSON.stringify(expiredPayload));
    const expiredUrl = `http://localhost:8098/api/documents/stream/header.${expiredToken}.signature`;

    // Create large chat history (50 messages with 2 links each = 100 links)
    const largeChatHistory = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      text: `Message ${i}`,
      document_links: [
        { url: expiredUrl, document_path: TEST_CONFIG.testDocumentPath },
        { url: expiredUrl, document_path: TEST_CONFIG.testDocumentPath }
      ]
    }));

    const startTime = Date.now();

    const refreshedHistory = await tokenRefreshService.refreshChatDocumentLinks(
      largeChatHistory,
      TEST_CONFIG.userId,
      TEST_CONFIG.userRole
    );

    const duration = Date.now() - startTime;

    assert(refreshedHistory.length === 50, 'Should preserve all messages');

    log('✅', `Performance test passed: ${duration}ms for 100 links`, 'green');
    log('📝', `  Average: ${(duration / 100).toFixed(1)}ms per link`, 'yellow');

    // Performance threshold: Should complete in under 30 seconds
    if (duration < 30000) {
      log('⚡', 'Performance is acceptable', 'green');
    } else {
      log('⚠️', 'Performance is slow - consider optimization', 'yellow');
    }

  } catch (error) {
    log('❌', `Performance test failed: ${error}`, 'red');
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(70));
  log('🚀', 'JWT TOKEN REFRESH SYSTEM - INTEGRATION TESTS', 'blue');
  console.log('='.repeat(70) + '\n');

  log('📋', 'Test Configuration:', 'yellow');
  log('  ', `User ID: ${TEST_CONFIG.userId}`);
  log('  ', `User Role: ${TEST_CONFIG.userRole}`);
  log('  ', `Test Document: ${TEST_CONFIG.testDocumentPath}`);
  console.log();

  let passedTests = 0;
  let failedTests = 0;
  const totalTests = 8;

  try {
    // Test 1: Create fresh token
    const freshUrl = await test1_CreateFreshToken();
    passedTests++;
    console.log();

    // Test 2: Token expiry detection
    await test2_TokenExpiryDetection(freshUrl);
    passedTests++;
    console.log();

    // Test 3: Document path extraction
    await test3_DocumentPathExtraction(freshUrl);
    passedTests++;
    console.log();

    // Test 4: Single link refresh
    await test4_SingleLinkRefresh();
    passedTests++;
    console.log();

    // Test 5: Batch link refresh
    await test5_BatchLinkRefresh();
    passedTests++;
    console.log();

    // Test 6: Chat history refresh
    await test6_ChatHistoryRefresh();
    passedTests++;
    console.log();

    // Test 7: Auto-refresh with mixed tokens
    await test7_AutoRefreshMixed();
    passedTests++;
    console.log();

    // Test 8: Performance test
    await test8_PerformanceTest();
    passedTests++;
    console.log();

  } catch (error) {
    failedTests++;
    console.log();
    log('❌', 'TEST SUITE FAILED', 'red');
    log('  ', `Error: ${error}`, 'red');
  }

  // Summary
  console.log('='.repeat(70));
  log('📊', 'TEST SUMMARY', 'blue');
  console.log('='.repeat(70));
  console.log();

  log('✅', `Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');

  if (failedTests > 0) {
    log('❌', `Failed: ${failedTests}/${totalTests}`, 'red');
  }

  console.log();

  if (passedTests === totalTests) {
    log('🎉', 'ALL TESTS PASSED - Token refresh system is working correctly!', 'green');
    return 0;
  } else {
    log('⚠️', 'SOME TESTS FAILED - Please review errors above', 'red');
    return 1;
  }
}

// Run tests
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
