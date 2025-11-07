/**
 * Feature flags for experimental features
 */

interface FeatureFlags {
  FX_SUN_SWEEP: boolean;
}

// Default feature flags - can be overridden by environment variables
const defaultFlags: FeatureFlags = {
  FX_SUN_SWEEP: false, // Disabled by default for safe rollout
};

// Dynamic feature flag getter - evaluates each time it's accessed
const getFeatureFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') return defaultFlags;

  return {
    FX_SUN_SWEEP:
      localStorage.getItem('FX_SUN_SWEEP') === 'true' ||
      (import.meta as any).env?.VITE_FX_SUN_SWEEP === 'true' ||
      defaultFlags.FX_SUN_SWEEP,
  };
};

// Dynamic flags object that re-evaluates each time it's accessed
export const flags = new Proxy({} as FeatureFlags, {
  get(_target, prop: keyof FeatureFlags) {
    return getFeatureFlags()[prop];
  }
});

// Helper to enable/disable flags during development
export const setFeatureFlag = (flag: keyof FeatureFlags, enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(flag, enabled.toString());
    (flags as any)[flag] = enabled;
  }
};