import { useEffect } from 'react';
import { useIdleMotion } from './useIdleMotion';
import './halloween.css';

/** Decorative silhouettes; no extra canvas, pointer handling, or frame loop. */
export function HalloweenAtmosphere() {
  const { ref, active, reduced } = useIdleMotion<HTMLDivElement>();
  useEffect(() => {
    if (!active || reduced) return;
    const animations = Array.from(ref.current?.querySelectorAll('svg') ?? []).map((node, index) => node.animate([
      { transform: 'translate3d(0,0,0) rotate(-3deg)' },
      { transform: `translate3d(${8 + index * 4}px,-8px,0) rotate(3deg)` },
      { transform: 'translate3d(0,0,0) rotate(-3deg)' },
    ], { duration: 6000 + index * 1200, iterations: Infinity, easing: 'ease-in-out' }));
    return () => animations.forEach(animation => animation.cancel());
  }, [active, reduced, ref]);
  return <div ref={ref} className="halloween-atmosphere" aria-hidden="true"><span className="halloween-moon" />{[0, 1, 2].map(index => <svg key={index} viewBox="0 0 100 40"><path d="M50 21 46 10 42 16Q25 1 2 3Q14 14 11 28Q26 18 35 31L46 28 50 36 54 28 65 31Q74 18 89 28Q86 14 98 3Q75 1 58 16L54 10Z" /></svg>)}</div>;
}
