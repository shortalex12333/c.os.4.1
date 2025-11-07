import { useEffect, useState } from 'react';

export function useVisualViewportBottom(): number {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onChange = () => {
      // How much of the viewport is occluded by the keyboard on iOS
      const occluded = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
      setBottom(Math.round(occluded));
    };

    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    onChange();

    return () => {
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
    };
  }, []);

  return bottom;
}