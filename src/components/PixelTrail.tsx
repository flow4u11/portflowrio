import { useEffect, useRef } from 'react';
import { useMotionSettings } from './MotionSettings';
import './pixel-trail.css';

type Point = { x: number; y: number };
type Cell = { key: number; x: number; y: number; born: number; strength: number };
const POOL_SIZE = 320;
const FRAME_INTERVAL = 1000 / 60;

/** React Bits PixelTrail's screen-grid sampling and aging trail, adapted to bounded Canvas2D.
 * David Haz's source and MIT + Commons Clause notice are recorded in docs/react-bits-sources.md.
 */
export function PixelTrail({ enabled = true }: { enabled?: boolean }) {
  const { settings } = useMotionSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = enabled && settings.trailEnabled;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !active) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const size = settings.trailSize;
    const lifetime = settings.trailLifetime;
    const spacing = size / settings.trailDensity;
    const cells = Array.from({ length: POOL_SIZE }, (): Cell => ({ key: -1, x: 0, y: 0, born: -Infinity, strength: 0 }));
    const occupied = new Map<number, Cell>();
    let cursor = 0;
    let frame = 0;
    let previousFrame = 0;
    let previousPoint: Point | null = null;
    let pendingPoint: Point | null = null;
    let width = 0;
    let height = 0;
    let columns = 0;
    let disposed = false;
    let color = document.documentElement.dataset.theme === 'dark' ? '#fff' : '#000';
    const permitted = () => !document.hidden && !preference.matches && pointer.matches;
    const clear = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      previousFrame = 0;
      previousPoint = null;
      pendingPoint = null;
      occupied.clear();
      for (const cell of cells) { cell.born = -Infinity; cell.key = -1; }
      context.clearRect(0, 0, width, height);
    };
    const stamp = (point: Point, now: number) => {
      const column = Math.floor(point.x / size);
      const row = Math.floor(point.y / size);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = column + dx;
          const y = row + dy;
          if (x < 0 || y < 0 || x * size >= width || y * size >= height) continue;
          const key = y * columns + x;
          const strength = dx === 0 && dy === 0 ? 0.32 : dx === 0 || dy === 0 ? 0.18 : 0.07;
          let cell = occupied.get(key);
          if (!cell) {
            cell = cells[cursor];
            cursor = (cursor + 1) % POOL_SIZE;
            if (cell.key !== -1) occupied.delete(cell.key);
            cell.key = key;
            cell.x = x * size;
            cell.y = y * size;
            cell.strength = strength;
            occupied.set(key, cell);
          } else {
            const currentStrength = cell.strength * Math.max(0, 1 - (now - cell.born) / lifetime);
            cell.strength = Math.max(strength, currentStrength);
          }
          cell.born = now;
        }
      }
    };
    const animate = (now: number) => {
      frame = 0;
      if (disposed) return;
      if (!permitted()) { clear(); return; }
      if (previousFrame && now - previousFrame < FRAME_INTERVAL - 1) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      previousFrame = now;
      if (pendingPoint) {
        const point = pendingPoint;
        pendingPoint = null;
        const dx = previousPoint ? point.x - previousPoint.x : 0;
        const dy = previousPoint ? point.y - previousPoint.y : 0;
        const distance = Math.hypot(dx, dy);
        // Bound interpolation and treat a large jump as a new pointer entry.
        const steps = previousPoint && distance < 240 ? Math.min(12, Math.max(1, Math.ceil(distance / spacing))) : 1;
        for (let step = 1; step <= steps; step++) {
          stamp({ x: point.x - dx * (1 - step / steps), y: point.y - dy * (1 - step / steps) }, now);
        }
        previousPoint = point;
      }
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      let remaining = 0;
      for (const cell of cells) {
        const age = (now - cell.born) / lifetime;
        if (age >= 1) {
          if (cell.key !== -1) { occupied.delete(cell.key); cell.key = -1; }
          continue;
        }
        remaining++;
        context.globalAlpha = cell.strength * (1 - age) ** 2;
        context.fillRect(cell.x, cell.y, size, size);
      }
      context.globalAlpha = 1;
      if (remaining || pendingPoint) frame = window.requestAnimationFrame(animate);
      else { previousPoint = null; previousFrame = 0; }
    };
    const resize = () => {
      clear();
      width = window.innerWidth;
      height = window.innerHeight;
      columns = Math.ceil(width / size);
      // Pixel cells need no retina oversampling; cap backing storage on large screens.
      const scale = Math.min(1, Math.sqrt(2_000_000 / Math.max(1, width * height)));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    const move = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.pointerType !== 'mouse' || !permitted() || event.buttons || document.querySelector('dialog[open]') || target?.closest('input, textarea, select, [contenteditable="true"], [data-pixel-trail="off"]')) {
        if (frame || occupied.size) clear();
        return;
      }
      pendingPoint = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(animate);
    };
    const onPreference = () => { if (!permitted()) clear(); };
    const resetPath = () => { previousPoint = null; pendingPoint = null; };
    const leaveWindow = (event: PointerEvent) => { if (!event.relatedTarget) resetPath(); };
    const themeObserver = new MutationObserver(() => {
      color = document.documentElement.dataset.theme === 'dark' ? '#fff' : '#000';
      clear();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', clear, { passive: true });
    window.addEventListener('pointerout', leaveWindow, { passive: true });
    window.addEventListener('blur', clear);
    window.addEventListener('scroll', resetPath, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onPreference);
    preference.addEventListener('change', onPreference);
    pointer.addEventListener('change', onPreference);
    resize();
    return () => {
      disposed = true;
      clear();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', clear);
      window.removeEventListener('pointerout', leaveWindow);
      window.removeEventListener('blur', clear);
      window.removeEventListener('scroll', resetPath);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onPreference);
      preference.removeEventListener('change', onPreference);
      pointer.removeEventListener('change', onPreference);
      canvas.width = 1;
      canvas.height = 1;
    };
  }, [active, settings.trailSize, settings.trailLifetime, settings.trailDensity]);

  return <canvas ref={canvasRef} className="pixel-trail" aria-hidden="true" data-enabled={active || undefined} width={1} height={1} />;
}
