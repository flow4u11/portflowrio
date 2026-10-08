import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { beginPortfolioReadiness, reportPortfolioReady } from './portfolioReadiness';
import type { createSpatialStars } from './three-star-renderer';

export function ThreeStarField({ color, count, speed, fallback }: { color: string; count: number; speed: number; fallback: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createSpatialStars> | null>(null);
  const reduced = useReducedMotion() ?? false;
  const [failed, setFailed] = useState(false);
  const config = useRef({ color, count, speed, reduced });
  config.current = { color, count, speed, reduced };
  const useFallback = failed || reduced;

  useEffect(() => {
    const generation = beginPortfolioReadiness('background');
    if (useFallback) { reportPortfolioReady('background', 'fallback', generation); return; }
    const target = canvas.current;
    if (!target) return;
    let cancelled = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const fail = () => {
      if (cancelled) return;
      clearTimeout(deadline);
      setFailed(true);
      reportPortfolioReady('background', 'fallback', generation);
    };
    deadline = setTimeout(fail, 6000);
    void import('./three-star-renderer').then(module => {
      if (cancelled) return;
      try {
        engine.current = module.createSpatialStars(target, config.current, fail);
        clearTimeout(deadline);
        reportPortfolioReady('background', 'ready', generation);
      } catch { fail(); }
    }).catch(fail);
    return () => { cancelled = true; clearTimeout(deadline); engine.current?.dispose(); engine.current = null; };
  }, [useFallback]);

  useEffect(() => { engine.current?.update(config.current); }, [color, count, speed, reduced]);
  return useFallback ? fallback : <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}
