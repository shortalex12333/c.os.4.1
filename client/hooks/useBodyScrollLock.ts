import { useEffect } from 'react';

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    const el = document.documentElement;
    if (active) {
      el.style.overflow = 'hidden';
    } else {
      el.style.overflow = '';
    }
    return () => {
      el.style.overflow = '';
    };
  }, [active]);
}