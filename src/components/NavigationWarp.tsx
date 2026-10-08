import { useEffect, useRef } from 'react';
import './navigation-warp.css';

/** Original finite perspective streaks, inspired by the public Glitter Warp preview. */
export function NavigationWarp() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    const context = node?.getContext('2d', { alpha: true });
    if (!node || !context) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const stars = Array.from({ length: 112 }, (_, index) => ({
      angle: index * 2.399963, phase: (index * .618034) % 1,
      radius: .2 + ((index * 37) % 73) / 100, size: .55 + (index % 7) * .16,
    }));
    let frame = 0;
    let began = 0;
    let last = 0;
    let duration = 1800;
    let direction = 1;
    let width = 1;
    let height = 1;
    let color = '#ffffff';
    const stop = () => { cancelAnimationFrame(frame); frame = 0; node.style.opacity = '0'; context.clearRect(0, 0, width, height); };
    const draw = (now: number) => {
      if (document.hidden || preference.matches) { stop(); return; }
      const progress = Math.min(1, (now - began) / duration);
      if (progress >= 1) { stop(); return; }
      if (now - last >= 1000 / 30 - 1) {
        last = now;
        const envelope = Math.sin(Math.PI * progress) ** 1.5;
        const travel = progress < .5 ? 16 * progress ** 5 : 1 - (-2 * progress + 2) ** 5 / 2;
        context.clearRect(0, 0, width, height);
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineCap = 'round';
        const count = width < 641 ? 64 : stars.length;
        const extent = Math.hypot(width, height) * .46;
        for (let index = 0; index < count; index++) {
          const star = stars[index];
          const z = .16 + ((star.phase + direction * travel * .78 + 2) % 1) * 1.8;
          const radius = star.radius * extent * .34 / z;
          const angle = star.angle + Math.sin(travel * 2 + star.phase) * .025;
          const x = width * .5 + Math.cos(angle) * radius;
          const y = height * .48 + Math.sin(angle) * radius;
          const length = (2 + envelope * 35) * star.size / z;
          context.globalAlpha = envelope * Math.min(.58, .18 + .12 / z);
          context.lineWidth = Math.min(2.2, star.size / Math.sqrt(z));
          context.beginPath(); context.moveTo(x, y);
          context.lineTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length); context.stroke();
          if (index % 11 === 0) { context.globalAlpha *= .55; context.fillRect(x - 2.5, y, 5, .7); context.fillRect(x, y - 2.5, .7, 5); }
        }
        context.globalAlpha = 1;
      }
      frame = requestAnimationFrame(draw);
    };
    const start = (event: Event) => {
      stop();
      const detail = (event as CustomEvent<{ duration: number; direction: number; warp: boolean }>).detail;
      if (!detail?.warp || preference.matches || document.hidden) return;
      width = innerWidth; height = innerHeight;
      const scale = Math.min(1, Math.sqrt(450_000 / (width * height)));
      node.width = Math.round(width * scale); node.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      color = getComputedStyle(node).color;
      duration = detail.duration; direction = detail.direction;
      began = performance.now(); last = 0; node.style.opacity = '1';
      frame = requestAnimationFrame(draw);
    };
    window.addEventListener('portfolio:navigation-start', start);
    window.addEventListener('portfolio:navigation-end', stop);
    window.addEventListener('resize', stop); document.addEventListener('visibilitychange', stop);
    preference.addEventListener('change', stop);
    return () => {
      stop(); window.removeEventListener('portfolio:navigation-start', start); window.removeEventListener('portfolio:navigation-end', stop);
      window.removeEventListener('resize', stop); document.removeEventListener('visibilitychange', stop); preference.removeEventListener('change', stop);
    };
  }, []);
  return <canvas ref={canvas} className="navigation-warp-canvas" aria-hidden="true" />;
}
