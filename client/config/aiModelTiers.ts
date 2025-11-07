/**
 * CelesteOS 3-Tier AI Model Configuration
 * Heavy Lane (32B) → Main Lane (14B) → Fast Lane (7B)
 */

export interface AIModelTier {
  name: string;
  model: string;
  maxTokens: number;
  timeout: number; // milliseconds
  description: string;
  useCases: string[];
}

export const AI_MODEL_TIERS: Record<'heavy' | 'main' | 'fast', AIModelTier> = {
  // Heavy Lane - Complex reasoning, analysis, code generation
  heavy: {
    name: 'Heavy Lane',
    model: 'qwen2.5:32b-instruct-q4_K_M',
    maxTokens: 4096,
    timeout: 120000, // 2 minutes
    description: 'Most capable model for complex reasoning and analysis',
    useCases: [
      'Complex technical analysis',
      'Code generation and debugging', 
      'Multi-step problem solving',
      'Research and synthesis',
      'Maritime system diagnostics'
    ]
  },

  // Main Lane - General chat, moderate complexity (×2 instances for load balancing)
  main: {
    name: 'Main Lane',
    model: 'qwen2.5:14b-instruct-q4_K_M',
    maxTokens: 2048,
    timeout: 60000, // 1 minute
    description: 'Balanced performance for general conversations',
    useCases: [
      'General yacht management queries',
      'Standard troubleshooting',
      'Equipment maintenance guidance',
      'Operational procedures',
      'Documentation search'
    ]
  },

  // Fast Lane - Quick responses, simple queries (×2 instances for high throughput)
  fast: {
    name: 'Fast Lane', 
    model: 'mistral:7b-instruct-v0.3-q4_K_M',
    maxTokens: 1024,
    timeout: 30000, // 30 seconds
    description: 'Fastest responses for simple queries',
    useCases: [
      'Quick status checks',
      'Simple Q&A',
      'Basic navigation',
      'Equipment status',
      'Emergency quick reference'
    ]
  }
};

export type AIModelTierName = keyof typeof AI_MODEL_TIERS;

/**
 * Route user query to appropriate AI tier based on complexity and urgency
 */
export function routeToTier(
  query: string,
  context?: {
    isEmergency?: boolean;
    preferFast?: boolean;
    preferHeavy?: boolean;
    queryLength?: number;
  }
): AIModelTierName {
  const queryLower = query.toLowerCase();
  const queryLength = context?.queryLength || query.length;

  // Emergency queries → Fast Lane
  if (context?.isEmergency || 
      queryLower.includes('emergency') || 
      queryLower.includes('urgent') ||
      queryLower.includes('mayday')) {
    return 'fast';
  }

  // User preference override
  if (context?.preferHeavy) return 'heavy';
  if (context?.preferFast) return 'fast';

  // Complex technical queries → Heavy Lane
  const complexIndicators = [
    'analyze', 'debug', 'diagnose', 'troubleshoot', 'explain how',
    'step by step', 'algorithm', 'compare', 'evaluate', 'optimize',
    'code', 'program', 'script', 'configuration', 'architecture'
  ];
  
  if (complexIndicators.some(indicator => queryLower.includes(indicator)) ||
      queryLength > 200) {
    return 'heavy';
  }

  // Simple status/quick queries → Fast Lane
  const simpleIndicators = [
    'status', 'is', 'are', 'what is', 'check', 'show', 'list',
    'yes', 'no', 'ok', 'thanks', 'hello', 'hi'
  ];

  if (simpleIndicators.some(indicator => queryLower.includes(indicator)) ||
      queryLength < 50) {
    return 'fast';
  }

  // Default to Main Lane for balanced performance
  return 'main';
}

/**
 * Health check endpoints for each tier
 */
export const HEALTH_CHECK_CONFIG = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    endpoints: {
      tags: '/api/tags',
      generate: '/api/generate'
    }
  },
  healthCheck: {
    timeout: 10000, // 10 seconds
    testPrompt: 'Say OK',
    intervalMs: 300000 // 5 minutes
  }
};