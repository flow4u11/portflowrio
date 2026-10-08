import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { beginPortfolioReadiness, reportPortfolioReady } from './portfolioReadiness';
import type { createPixelSnow, PixelSnowConfig } from './pixel-snow-renderer';
import './pixel-snow.css';

/** Small, deterministic Canvas2D fallback, also used as still reduced-motion snow. */
function SnowFallback({ config, reduced }: { config: PixelSnowConfig; reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(config);
  latest.current = config;
  const repaint = useRef<(() => void) | null>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const context = node.getContext('2d', { alpha: true });
    if (!context) return;
    let frame = 0;
    let resizeFrame = 0;
    let previous = 0;
    let phase = 0;
    let visible = true;
    let disposed = false;
    let width = 1;
    let height = 1;
    const draw = () => {
      if (disposed || document.hidden || !visible) return;
      const current = latest.current;
      context.clearRect(0, 0, width, height);
      context.fillStyle = current.color;
      const count = Math.round(35 + current.density * 200);
      const angle = current.direction * Math.PI / 180;
      for (let index = 0; index < count; index++) {
        const depth = 0.35 + (index * 17 % 67) / 100;
        const dx = Math.cos(angle) * phase * 8 * depth;
        const dy = -Math.sin(angle) * phase * 8 * depth;
        const x = ((index * 0.61803398875 * width + dx) % width + width) % width;
        const y = ((index * 0.41421356237 * height + dy) % height + height) % height;
        const size = Math.max(1, current.flakeSize * 170 * depth);
        context.globalAlpha = Math.min(0.8, depth * current.brightness * 0.65);
        if (current.variant === 'round') { context.beginPath(); context.arc(x, y, size / 2, 0, Math.PI * 2); context.fill(); }
        else if (current.variant === 'snowflake') { context.fillRect(x - size, y, size * 2, 1); context.fillRect(x, y - size, 1, size * 2); }
        else context.fillRect(x, y, size, size);
      }
      context.globalAlpha = 1;
    };
    const tick = (now: number) => {
      if (disposed || reduced || document.hidden || !visible) return;
      if (!previous || now - previous >= 1000 / 30 - 1) { phase += previous ? Math.min(0.1, (now - previous) / 1000) * latest.current.speed : 0; previous = now; draw(); }
      frame = requestAnimationFrame(tick);
    };
    const resume = () => { cancelAnimationFrame(frame); previous = 0; draw(); if (!disposed && !reduced && !document.hidden && visible) frame = requestAnimationFrame(tick); };
    const resize = () => {
      width = Math.max(1, node.clientWidth); height = Math.max(1, node.clientHeight);
      const density = Math.min(1, Math.sqrt((width < 641 ? 90_000 : 180_000) / (width * height)));
      node.width = Math.max(1, Math.floor(width * density)); node.height = Math.max(1, Math.floor(height * density));
      context.setTransform(density, 0, 0, density, 0, 0); resume();
    };
    const sizeObserver = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize); });
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    sizeObserver.observe(node); visibilityObserver.observe(node);
    document.addEventListener('visibilitychange', resume);
    repaint.current = draw;
    resize();
    return () => { disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(resizeFrame); sizeObserver.disconnect(); visibilityObserver.disconnect(); document.removeEventListener('visibilitychange', resume); repaint.current = null; };
  }, [reduced]);
  useLayoutEffect(() => { repaint.current?.(); }, [config]);
  return <canvas ref={canvas} className="pixel-snow-canvas" data-renderer="pixel-snow-fallback" aria-hidden="true" />;
}

export function PixelSnow({ config }: { config: Omit<PixelSnowConfig, 'color'> }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createPixelSnow> | null>(null);
  const reduced = useReducedMotion() ?? false;
  const [failed, setFailed] = useState(false);
  const [color, setColor] = useState('#050505');
  const latest = useRef({ ...config, color });
  latest.current = { ...config, color };
  const fallback = reduced || failed;

  useLayoutEffect(() => {
    const updateColor = () => { if (host.current) setColor(getComputedStyle(host.current).color); };
    updateColor();
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-design', 'class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const generation = beginPortfolioReadiness('background');
    if (fallback) { reportPortfolioReady('background', 'fallback', generation); return; }
    const target = canvas.current;
    if (!target) return;
    let cancelled = false;
    const fail = () => { if (!cancelled) { setFailed(true); reportPortfolioReady('background', 'fallback', generation); } };
    const deadline = setTimeout(fail, 5000);
    void import('./pixel-snow-renderer').then(module => {
      if (cancelled) return;
      try {
        engine.current = module.createPixelSnow(target, latest.current, fail, () => {
          if (cancelled) return;
          clearTimeout(deadline);
          reportPortfolioReady('background', 'ready', generation);
        });
      } catch (error) { console.warn('Pixel snow initialization failed:', error); fail(); }
    }).catch(error => { console.warn('Pixel snow module failed:', error); fail(); });
    return () => { cancelled = true; clearTimeout(deadline); engine.current?.dispose(); engine.current = null; };
  }, [fallback]);
  useEffect(() => { engine.current?.update(latest.current); }, [config.speed, config.density, config.flakeSize, config.pixelResolution, config.direction, config.variant, config.brightness, config.depth, color]);
  return <div ref={host} className="pixel-snow-field" aria-hidden="true">{fallback ? <SnowFallback config={latest.current} reduced={reduced} /> : <canvas ref={canvas} className="pixel-snow-canvas" aria-hidden="true" />}</div>;
}
