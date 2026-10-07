import { useEffect, useRef } from 'react';
import './footer-confetti.css';

const SESSION_KEY = 'kimportflowrio:footer-confetti:v1';
const MAX_RUNTIME_MS = 2000;
const COLORS = ['#050505', '#ffffff', '#a3a3a3', '#d8cced', '#c7d7ed', '#d7e2ca'];
let playedInThisPage = false;

/** Small compositor-driven corner bursts; no canvas or per-frame JavaScript. */
export function FooterConfetti() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const trigger = triggerRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!container || !trigger || !left || !right || typeof IntersectionObserver === 'undefined' || typeof left.animate !== 'function') return;
    const stages = [left, right];
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let alreadyPlayed = playedInThisPage;
    try { alreadyPlayed ||= sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* A page-local guard still prevents repeat bursts. */ }
    if (alreadyPlayed) return;

    let disposed = false;
    let atBottom = false;
    let running = false;
    let animations: Animation[] = [];
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;

    const detach = () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      preference.removeEventListener('change', syncVisibility);
      window.removeEventListener('resize', onResize);
    };

    const finish = () => {
      if (!running) return;
      running = false;
      container.dataset.active = 'false';
      if (cleanupTimer !== null) clearTimeout(cleanupTimer);
      cleanupTimer = null;
      for (const animation of animations) animation.cancel();
      animations = [];
      for (const stage of stages) {
        stage.dataset.active = 'false';
        stage.replaceChildren();
      }
      detach();
    };

    const celebrate = () => {
      if (disposed || !atBottom || alreadyPlayed || document.hidden || preference.matches) return;
      // Measure both small stages once, before creating or animating any sprites.
      const bounds = stages.map(stage => stage.getBoundingClientRect());
      if (bounds.some(bound => bound.width === 0 || bound.height === 0)) return;
      alreadyPlayed = true;
      playedInThisPage = true;
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* Storage may be blocked or full. */ }
      running = true;
      container.dataset.active = 'true';

      const perSide = window.innerWidth < 600 ? 8 : 12;
      try {
        stages.forEach((stage, sideIndex) => {
          const { width, height } = bounds[sideIndex];
          const direction = sideIndex === 0 ? 1 : -1;
          const fragment = document.createDocumentFragment();
          const pending: { sprite: HTMLSpanElement; keyframes: Keyframe[]; timing: KeyframeAnimationOptions }[] = [];
          for (let index = 0; index < perSide; index += 1) {
            const sprite = document.createElement('span');
            sprite.className = 'footer-confetti-particle';
            sprite.style.width = `${4 + Math.random() * 3}px`;
            sprite.style.height = `${7 + Math.random() * 5}px`;
            sprite.style.backgroundColor = COLORS[(index + sideIndex) % COLORS.length];
            const startX = width * (sideIndex === 0 ? .12 : .88);
            const distance = width * (.45 + Math.random() * .3);
            const peakY = height * (.06 + Math.random() * .32);
            const rotation = Math.random() * 180;
            const spin = direction * (180 + Math.random() * 360);
            const transform = (x: number, y: number, turn: number, scale: number) =>
              `translate3d(${x}px, ${y}px, 0) rotate(${turn}deg) scaleX(${scale})`;
            pending.push({
              sprite,
              keyframes: [
                { offset: 0, transform: transform(startX, height + 14, rotation, 1), opacity: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
                { offset: .08, opacity: 1 },
                { offset: .42, transform: transform(startX + direction * distance * .5, peakY, rotation + spin * .42, .65), opacity: 1, easing: 'cubic-bezier(.45,0,.85,.5)' },
                { offset: .78, opacity: .9 },
                { offset: 1, transform: transform(startX + direction * distance, height + 24, rotation + spin, .35), opacity: 0 },
              ],
              timing: { duration: 1450 + Math.random() * 350, delay: Math.random() * 90, fill: 'both' },
            });
            fragment.appendChild(sprite);
          }
          stage.appendChild(fragment);
          stage.dataset.active = 'true';
          for (const particle of pending) animations.push(particle.sprite.animate(particle.keyframes, particle.timing));
        });
      } catch {
        finish();
        return;
      }
      cleanupTimer = setTimeout(finish, MAX_RUNTIME_MS);
      void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (!disposed) finish();
      });
    };

    function syncVisibility() {
      if (document.hidden || preference.matches) {
        if (running) finish();
      } else celebrate();
    }
    function onResize() {
      if (running) finish();
    }

    observer = new IntersectionObserver(([entry]) => {
      atBottom = entry.isIntersecting;
      if (!atBottom) {
        if (running) finish();
      } else celebrate();
    }, { threshold: 0 });
    observer.observe(trigger);
    document.addEventListener('visibilitychange', syncVisibility);
    preference.addEventListener('change', syncVisibility);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      disposed = true;
      finish();
      detach();
    };
  }, []);

  return <div ref={containerRef} className="footer-confetti" data-active="false" aria-hidden="true">
    <span ref={triggerRef} className="footer-confetti-trigger" aria-hidden="true" />
    <div ref={leftRef} className="footer-confetti-stage footer-confetti-stage--left" aria-hidden="true" />
    <div ref={rightRef} className="footer-confetti-stage footer-confetti-stage--right" aria-hidden="true" />
  </div>;
}
