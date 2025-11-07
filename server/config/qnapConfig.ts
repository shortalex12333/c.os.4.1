/**
 * QNAP Cloud Configuration for MVP Testing
 * 
 * Testing: Uses QNAP Cloud Storage (admin credentials)
 * Production: Will use local QNAP NAS with read-only users
 */

export interface QNAPCredentials {
  service: string;
  endpoint?: string;
  host?: string;
  credentials: {
    email?: string;
    password?: string;
    username?: string;
    space?: string;
    share?: string;
  };
  location?: string;
}

// Test Configuration - QNAP Cloud Storage
const testConfig: QNAPCredentials = {
  service: 'QNAP_CLOUD_STORAGE',
  endpoint: 'https://myqnapcloud.com/api/v1',
  credentials: {
    email: 'shortalex@hotmail.co.uk',
    password: 'z9w4d@@b#/nQ$Gz',
    space: 'My space - eu-west-1'
  },
  location: 'London,UK'
};

// Production Configuration - Local QNAP NAS (template)
const productionConfig: QNAPCredentials = {
  service: 'QNAP_NAS',
  host: '192.168.1.100', // Yacht's local network IP
  credentials: {
    username: 'engineer_readonly', // Created on customer's QNAP
    password: 'yacht_specific_pass',
    share: 'Engineering_Docs'
  }
};

// Environment-based configuration selector
export const getNASConfig = (): QNAPCredentials => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? productionConfig : testConfig;
};

// QNAP Cloud API Configuration
export const QNAP_CONFIG = {
  baseUrl: 'https://myqnapcloud.com/api/v1',
  testFolder: 'YACHT_AI_TEST',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  
  // Test environment paths
  testPaths: {
    root: 'YACHT_AI_TEST',
    bridge: 'YACHT_AI_TEST/01_BRIDGE',
    engineering: 'YACHT_AI_TEST/02_ENGINEERING', 
    electrical: 'YACHT_AI_TEST/03_ELECTRICAL',
    hydraulics: 'YACHT_AI_TEST/04_HYDRAULICS',
    hvac: 'YACHT_AI_TEST/05_HVAC',
    water: 'YACHT_AI_TEST/06_WATER_SYSTEMS',
    safety: 'YACHT_AI_TEST/07_SAFETY_SYSTEMS',
    galley: 'YACHT_AI_TEST/08_GALLEY'
  }
};

export default getNASConfig;