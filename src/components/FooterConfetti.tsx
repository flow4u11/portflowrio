import { useEffect, useRef } from 'react';
import './footer-confetti.css';

const SESSION_KEY = 'kimportflowrio:footer-confetti:v1';
const DURATION_MS = 2700;
const FRAME_MS = 1000 / 30;
const COLORS = ['#050505', '#ffffff', '#a3a3a3', '#d8cced', '#c7d7ed', '#d7e2ca'];
let playedInThisPage = false;

type Particle = {
  x: number; y: number; vx: number; vy: number;
  width: number; height: number; angle: number; spin: number;
  delay: number; color: string;
};

/** One finite rectangle burst when the actual footer bottom reaches the viewport. */
export function FooterConfetti() {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const canvas = canvasRef.current;
    if (!trigger || !canvas || typeof IntersectionObserver === 'undefined') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let alreadyPlayed = playedInThisPage;
    try { alreadyPlayed ||= sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* A page-local guard still prevents repeat bursts. */ }
    if (alreadyPlayed) return;

    let frame = 0;
    let atBottom = false;
    let running = false;
    let observer: IntersectionObserver;

    const finish = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      running = false;
      canvas.dataset.active = 'false';
      canvas.width = 1;
      canvas.height = 1;
    };

    const celebrate = () => {
      if (!atBottom || alreadyPlayed || document.hidden || preference.matches) return;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) return;
      alreadyPlayed = true;
      playedInThisPage = true;
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* Storage may be blocked or full. */ }
      observer.disconnect();

      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.dataset.active = 'true';
      running = true;
      const count = width < 600 ? 32 : 48;
      const particles: Particle[] = Array.from({ length: count }, (_, index) => {
        const side = index % 2 === 0 ? 1 : -1;
        return {
          x: side === 1 ? width * .08 : width * .92,
          y: height + 12,
          vx: side * (100 + Math.random() * Math.min(width * .24, 250)),
          vy: -(Math.min(height, 950) * .66 + 180 + Math.random() * 170),
          width: 4 + Math.random() * 4,
          height: 7 + Math.random() * 7,
          angle: Math.random() * Math.PI,
          spin: (Math.random() - .5) * 10,
          delay: Math.random() * .15,
          color: COLORS[index % COLORS.length],
        };
      });
      const started = performance.now();
      let lastDraw = -FRAME_MS;
      const draw = (now: number) => {
        const elapsed = now - started;
        if (elapsed >= DURATION_MS) { finish(); return; }
        frame = requestAnimationFrame(draw);
        if (elapsed - lastDraw < FRAME_MS) return;
        lastDraw = elapsed;
        context.clearRect(0, 0, width, height);
        for (const particle of particles) {
          const time = elapsed / 1000 - particle.delay;
          if (time < 0) continue;
          const x = particle.x + particle.vx * time;
          const y = particle.y + particle.vy * time + 240 * time * time;
          if (y > height + 30 || x < -30 || x > width + 30) continue;
          context.save();
          context.globalAlpha = Math.min(1, Math.max(0, (DURATION_MS - elapsed) / 650));
          context.translate(x, y);
          context.rotate(particle.angle + particle.spin * time);
          context.scale(Math.max(.2, Math.abs(Math.cos(time * 6 + particle.angle))), 1);
          context.fillStyle = particle.color;
          context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
          context.restore();
        }
      };
      frame = requestAnimationFrame(draw);
    };

    observer = new IntersectionObserver(([entry]) => {
      atBottom = entry.isIntersecting;
      celebrate();
    }, { threshold: 0 });
    observer.observe(trigger);
    const syncVisibility = () => {
      if (document.hidden || preference.matches) { if (running) finish(); }
      else celebrate();
    };
    const onResize = () => { if (running) finish(); };
    document.addEventListener('visibilitychange', syncVisibility);
    preference.addEventListener('change', syncVisibility);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      observer.disconnect();
      finish();
      document.removeEventListener('visibilitychange', syncVisibility);
      preference.removeEventListener('change', syncVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <>
    <span ref={triggerRef} className="footer-confetti-trigger" aria-hidden="true" />
    <canvas ref={canvasRef} className="footer-confetti-canvas" width="1" height="1" aria-hidden="true" />
  </>;
}
