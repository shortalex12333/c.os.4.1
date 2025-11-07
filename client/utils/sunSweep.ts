/**
 * Sun Sweep Theme Transition
 * Creates a warm light animation that sweeps across the viewport during theme changes
 */

type Theme = 'light' | 'dark';

const isReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const deviceIsTight = (): boolean => {
  // Coarse heuristic for low/mid devices
  // @ts-ignore - deviceMemory is not in all TS definitions
  const mem = navigator.deviceMemory;
  return (typeof mem === 'number' && mem <= 4) ||
         window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;
};

/**
 * Triggers the sun sweep animation for theme transitions
 * Returns a promise that resolves when animation completes
 * @param incoming - The theme being switched to ('light' | 'dark')
 * @param onThemeSwitch - Callback to switch theme mid-animation
 */
export function createSunSweepOverlay(
  incoming: Theme,
  onThemeSwitch: () => void
): Promise<void> {
  return new Promise((resolve) => {
    console.log('🔧 createSunSweepOverlay called with:', { incoming, reducedMotion: isReducedMotion() });

    if (isReducedMotion()) {
      console.log('⏭️ Skipping animation due to reduced motion');
      onThemeSwitch();
      resolve();
      return;
    }

    // Create overlay element WITHOUT animation class
    const overlay = document.createElement('div');
    overlay.className = 'sun-sweep-overlay';
    overlay.id = 'debug-sun-sweep-overlay';
    console.log('📦 Created overlay element:', overlay);

    // Add blend mode based on incoming theme
    if (incoming === 'light') {
      overlay.classList.add('mix-blend-overlay');
    } else {
      overlay.classList.add('mix-blend-screen');
    }

    // Performance & compatibility guards
    if (deviceIsTight()) {
      overlay.dataset.low = '1';
      overlay.style.mixBlendMode = 'normal';
    } else if (!(CSS as any)?.supports?.('mix-blend-mode', 'screen')) {
      overlay.style.mixBlendMode = 'normal';
    }

    // Add to DOM first
    document.body.appendChild(overlay);
    document.body.classList.add('sweep-active');
    console.log('🌐 Overlay added to DOM:', {
      parentNode: overlay.parentNode,
      className: overlay.className,
      style: overlay.style.cssText
    });

    // Force reflow before starting animation
    requestAnimationFrame(() => {
      console.log('🎬 Starting animation in next frame');
      // Start animation
      overlay.classList.add('animate-sun-sweep');
      console.log('✨ Animation class added:', overlay.className);

      // Switch theme mid-animation (300ms into 620ms animation)
      setTimeout(() => {
        console.log('🔄 Triggering theme switch callback');
        onThemeSwitch();
      }, 300);
    });

    // Clean up when animation ends
    const cleanup = () => {
      console.log('🧹 Cleaning up overlay');
      overlay.remove();
      document.body.classList.remove('sweep-active');
      console.log('✅ Overlay cleanup complete');
      resolve();
    };

    // Listen for animation end
    overlay.addEventListener('animationend', cleanup, { once: true });

    // Fallback cleanup after max duration
    const duration = deviceIsTight() ? 480 : 620;
    setTimeout(cleanup, duration + 200);

    // Optional telemetry for performance monitoring
    if (typeof window !== 'undefined' && (window as any).analytics?.track) {
      const start = performance.now();
      requestAnimationFrame(function probe(last = start, drops = 0) {
        const now = performance.now();
        if (now - last > 24) drops++;
        if (now - start < duration + 200) requestAnimationFrame(ts => probe(ts, drops));
        else (window as any).analytics.track('theme_sweep_perf', {
          durationMs: now - start,
          droppedFrames: drops
        });
      });
    }
  });
}