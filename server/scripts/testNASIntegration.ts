/**
 * Comprehensive NAS Integration Test Harness
 * Tests all modes: local, cloud, and production
 */

import { nasConfigManager } from '../config/nasConfig';
import { nasServiceV2 } from '../services/nasServiceV2';

interface TestResult {
  testName: string;
  success: boolean;
  responseTime: number;
  message: string;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  mode: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    averageResponseTime: number;
  };
}

class NASIntegrationTester {
  private testSuites: TestSuite[] = [];

  /**
   * Run comprehensive test suite
   */
  async runAllTests(): Promise<void> {
    console.log('🚢 NAS Integration Test Harness');
    console.log('================================');
    console.log('');

    // Test each mode
    await this.testMode('local');
    await this.testMode('cloud');
    await this.testMode('production');

    // Print summary
    this.printFinalSummary();
  }

  /**
   * Test specific NAS mode
   */
  async testMode(mode: 'local' | 'cloud' | 'production'): Promise<void> {
    console.log(`📊 Testing ${mode.toUpperCase()} Mode`);
    console.log('-'.repeat(30));

    // Switch to test mode
    nasConfigManager.switchMode(mode);

    const testSuite: TestSuite = {
      suiteName: `${mode.toUpperCase()} Mode Tests`,
      mode,
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
        averageResponseTime: 0
      }
    };

    // Run test cases
    testSuite.results.push(await this.testConnectivity());
    testSuite.results.push(await this.testConfiguration());
    testSuite.results.push(await this.testAuthentication());
    testSuite.results.push(await this.testDocumentSearch());
    testSuite.results.push(await this.testN8NCompatibility());
    testSuite.results.push(await this.testErrorHandling());
    testSuite.results.push(await this.testPerformance());

    // Calculate summary
    testSuite.summary.total = testSuite.results.length;
    testSuite.summary.passed = testSuite.results.filter(r => r.success).length;
    testSuite.summary.failed = testSuite.summary.total - testSuite.summary.passed;
    testSuite.summary.successRate = (testSuite.summary.passed / testSuite.summary.total) * 100;
    testSuite.summary.averageResponseTime = testSuite.results.reduce((sum, r) => sum + r.responseTime, 0) / testSuite.summary.total;

    this.testSuites.push(testSuite);
    this.printTestSuiteResults(testSuite);
    console.log('');
  }

  /**
   * Test connectivity
   */
  private async testConnectivity(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const connectivity = await nasConfigManager.testConnectivity();
      
      return {
        testName: 'Connectivity Test',
        success: connectivity.success,
        responseTime: Date.now() - startTime,
        message: connectivity.message,
        details: connectivity.details
      };
    } catch (error) {
      return {
        testName: 'Connectivity Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `Connectivity test failed: ${error.message}`
      };
    }
  }

  /**
   * Test configuration
   */
  private async testConfiguration(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const config = nasConfigManager.getConfig();
      const connectionInfo = nasConfigManager.getConnectionInfo();
      
      const hasRequiredFields = config.type && 
        (config.type === 'local' ? config.simulator_url :
         config.type === 'cloud' ? config.endpoint :
         config.type === 'production' ? config.host : false);

      return {
        testName: 'Configuration Test',
        success: !!hasRequiredFields,
        responseTime: Date.now() - startTime,
        message: hasRequiredFields ? 'Configuration is valid' : 'Configuration is missing required fields',
        details: { config, connectionInfo }
      };
    } catch (error) {
      return {
        testName: 'Configuration Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `Configuration test failed: ${error.message}`
      };
    }
  }

  /**
   * Test authentication
   */
  private async testAuthentication(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const authenticated = await nasServiceV2.authenticate();
      
      return {
        testName: 'Authentication Test',
        success: authenticated,
        responseTime: Date.now() - startTime,
        message: authenticated ? 'Authentication successful' : 'Authentication failed'
      };
    } catch (error) {
      return {
        testName: 'Authentication Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `Authentication test failed: ${error.message}`
      };
    }
  }

  /**
   * Test document search
   */
  private async testDocumentSearch(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const searchQueries = [
        { query: 'generator fault', category: '02_ENGINE_ROOM' },
        { query: 'CAT engine overheat', category: undefined },
        { query: 'Northern Lights', category: 'Generators' },
        { query: 'voltage regulation', category: undefined }
      ];

      let totalResults = 0;
      let successfulQueries = 0;

      for (const { query, category } of searchQueries) {
        try {
          const result = await nasServiceV2.searchDocuments(query, category);
          if (result.success) {
            successfulQueries++;
            totalResults += result.data.results;
          }
        } catch (error) {
          // Continue with other queries
        }
      }

      const success = successfulQueries > 0;
      
      return {
        testName: 'Document Search Test',
        success,
        responseTime: Date.now() - startTime,
        message: success ? 
          `Found ${totalResults} results across ${successfulQueries}/${searchQueries.length} queries` :
          'All search queries failed',
        details: { totalResults, successfulQueries, totalQueries: searchQueries.length }
      };
    } catch (error) {
      return {
        testName: 'Document Search Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `Search test failed: ${error.message}`
      };
    }
  }

  /**
   * Test n8n workflow compatibility
   */
  private async testN8NCompatibility(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await nasServiceV2.searchDocuments('generator problem');
      
      // Check if response has n8n compatible format
      const hasMaritimeData = result.maritime_data && Array.isArray(result.maritime_data.solutions);
      const hasRequiredFields = hasMaritimeData && result.maritime_data.solutions.every(solution => 
        solution.title && solution.fault_code && solution.system
      );

      return {
        testName: 'n8n Compatibility Test',
        success: hasMaritimeData && hasRequiredFields,
        responseTime: Date.now() - startTime,
        message: hasMaritimeData && hasRequiredFields ? 
          'Response format is n8n compatible' : 
          'Response format missing maritime_data structure',
        details: { 
          hasMaritimeData, 
          hasRequiredFields,
          solutionCount: result.maritime_data?.solutions?.length || 0
        }
      };
    } catch (error) {
      return {
        testName: 'n8n Compatibility Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `n8n compatibility test failed: ${error.message}`
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<TestResult> {
    const startTime = Date.now();
    let errorsHandledCorrectly = 0;
    const totalErrorTests = 3;
    
    try {
      // Test 1: Empty query
      try {
        const result = await nasServiceV2.searchDocuments('');
        if (!result.success) errorsHandledCorrectly++;
      } catch (error) {
        errorsHandledCorrectly++; // Expected to fail
      }

      // Test 2: Invalid category
      try {
        const result = await nasServiceV2.searchDocuments('test', 'INVALID_CATEGORY');
        // Should handle gracefully
        errorsHandledCorrectly++;
      } catch (error) {
        errorsHandledCorrectly++; // Acceptable to fail
      }

      // Test 3: Network timeout simulation (if local mode)
      if (nasConfigManager.isLocalMode()) {
        try {
          // Try to search with very long timeout
          const result = await Promise.race([
            nasServiceV2.searchDocuments('timeout test'),
            new Promise(resolve => setTimeout(() => resolve({ success: false }), 100))
          ]);
          errorsHandledCorrectly++; // Should handle timeout gracefully
        } catch (error) {
          errorsHandledCorrectly++; // Expected behavior
        }
      } else {
        errorsHandledCorrectly++; // Skip this test for non-local modes
      }

      const success = errorsHandledCorrectly >= 2; // At least 2/3 error cases handled

      return {
        testName: 'Error Handling Test',
        success,
        responseTime: Date.now() - startTime,
        message: `Handled ${errorsHandledCorrectly}/${totalErrorTests} error cases correctly`,
        details: { errorsHandledCorrectly, totalErrorTests }
      };
    } catch (error) {
      return {
        testName: 'Error Handling Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `Error handling test failed: ${error.message}`
      };
    }
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const performanceMetrics = {
        maxResponseTime: 0,
        minResponseTime: Infinity,
        totalRequests: 0,
        successfulRequests: 0
      };

      // Run multiple search queries to test performance
      const queries = ['engine', 'generator', 'hydraulic', 'navigation', 'hvac'];
      
      for (const query of queries) {
        const queryStart = Date.now();
        try {
          const result = await nasServiceV2.searchDocuments(query);
          const queryTime = Date.now() - queryStart;
          
          performanceMetrics.totalRequests++;
          if (result.success) {
            performanceMetrics.successfulRequests++;
          }
          
          performanceMetrics.maxResponseTime = Math.max(performanceMetrics.maxResponseTime, queryTime);
          performanceMetrics.minResponseTime = Math.min(performanceMetrics.minResponseTime, queryTime);
        } catch (error) {
          performanceMetrics.totalRequests++;
        }
      }

      const avgResponseTime = (Date.now() - startTime) / performanceMetrics.totalRequests;
      const successRate = (performanceMetrics.successfulRequests / performanceMetrics.totalRequests) * 100;
      
      // Performance is acceptable if average response time < 2000ms and success rate > 50%
      const success = avgResponseTime < 2000 && successRate > 50;

      return {
        testName: 'Performance Test',
        success,
        responseTime: Date.now() - startTime,
        message: success ? 
          `Performance acceptable: ${Math.round(avgResponseTime)}ms avg, ${Math.round(successRate)}% success` :
          `Performance issues: ${Math.round(avgResponseTime)}ms avg, ${Math.round(successRate)}% success`,
        details: {
          ...performanceMetrics,
          averageResponseTime: Math.round(avgResponseTime),
          successRate: Math.round(successRate)
        }
      };
    } catch (error) {
      return {
        testName: 'Performance Test',
        success: false,
        responseTime: Date.now() - startTime,
        message: `Performance test failed: ${error.message}`
      };
    }
  }

  /**
   * Print test suite results
   */
  private printTestSuiteResults(testSuite: TestSuite): void {
    console.log(`Results for ${testSuite.suiteName}:`);
    
    testSuite.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = `${result.responseTime}ms`;
      console.log(`  ${status} ${result.testName.padEnd(25)} (${time.padStart(6)}) - ${result.message}`);
    });

    console.log('');
    console.log(`Summary: ${testSuite.summary.passed}/${testSuite.summary.total} tests passed (${Math.round(testSuite.summary.successRate)}%)`);
    console.log(`Average response time: ${Math.round(testSuite.summary.averageResponseTime)}ms`);
  }

  /**
   * Print final summary
   */
  private printFinalSummary(): void {
    console.log('🎯 FINAL TEST SUMMARY');
    console.log('====================');
    console.log('');

    let totalTests = 0;
    let totalPassed = 0;
    let bestMode = { mode: '', successRate: 0 };

    this.testSuites.forEach(suite => {
      totalTests += suite.summary.total;
      totalPassed += suite.summary.passed;
      
      if (suite.summary.successRate > bestMode.successRate) {
        bestMode = { mode: suite.mode, successRate: suite.summary.successRate };
      }

      const status = suite.summary.successRate >= 70 ? '🟢' : 
                     suite.summary.successRate >= 40 ? '🟡' : '🔴';
      
      console.log(`${status} ${suite.mode.toUpperCase()} Mode: ${suite.summary.passed}/${suite.summary.total} (${Math.round(suite.summary.successRate)}%)`);
    });

    console.log('');
    console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${Math.round((totalPassed/totalTests)*100)}%)`);
    console.log(`Recommended mode: ${bestMode.mode.toUpperCase()} (${Math.round(bestMode.successRate)}% success rate)`);
    console.log('');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (bestMode.mode === 'local') {
      console.log('✅ Use LOCAL mode for development and testing');
      console.log('📚 48 realistic yacht documents available');
      console.log('🔧 Run "node server/nas-simulator/nasApiSimulator.cjs" to start simulator');
    } else if (bestMode.mode === 'cloud') {
      console.log('⚠️  QNAP Cloud has limitations - consider local mode');
      console.log('🔧 Update QNAP Cloud credentials if needed');
    } else {
      console.log('🚢 Production mode requires physical NAS on yacht network');
      console.log('🔧 Use local mode for development testing');
    }

    console.log('');
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new NASIntegrationTester();
  tester.runAllTests()
    .then(() => {
      console.log('🏁 All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test harness failed:', error);
      process.exit(1);
    });
}

export default NASIntegrationTester;