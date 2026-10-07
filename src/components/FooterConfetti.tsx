import { useEffect, useRef } from 'react';
import { useMotionSettings } from './MotionSettings';
import './footer-confetti.css';

const SESSION_KEY = 'kimportflowrio:footer-confetti:v1';
const MAX_BASE_RUNTIME_MS = 3000;
const COLORS = ['#050505', '#ffffff', '#a3a3a3', '#d8cced', '#c7d7ed', '#d7e2ca'];
let playedInThisPage = false;

/** One full-viewport celebration made from small compositor-driven rectangles. */
export function FooterConfetti() {
  const { settings } = useMotionSettings();
  const speed = Number.isFinite(settings.animationSpeed) ? Math.min(2, Math.max(.5, settings.animationSpeed)) : 1;
  const speedRef = useRef(speed);
  const controlsRef = useRef<{ updateSpeed: (next: number) => void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    speedRef.current = speed;
    controlsRef.current?.updateSpeed(speed);
  }, [speed]);

  useEffect(() => {
    const container = containerRef.current;
    const trigger = triggerRef.current;
    const stage = stageRef.current;
    if (!container || !trigger || !stage || typeof IntersectionObserver === 'undefined' || typeof stage.animate !== 'function') return;
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
      stage.dataset.active = 'false';
      stage.replaceChildren();
      detach();
    };

    const armCleanup = () => {
      if (cleanupTimer !== null) clearTimeout(cleanupTimer);
      const remaining = animations.reduce((longest, animation) => {
        const end = Number(animation.effect?.getComputedTiming().endTime) || MAX_BASE_RUNTIME_MS;
        const elapsed = Number(animation.currentTime) || 0;
        return Math.max(longest, end - elapsed);
      }, 0);
      cleanupTimer = setTimeout(finish, Math.min(MAX_BASE_RUNTIME_MS / .5, remaining / speedRef.current + 160));
    };

    controlsRef.current = {
      updateSpeed(next) {
        if (!running) return;
        for (const animation of animations) animation.updatePlaybackRate(next);
        armCleanup();
      },
    };

    const celebrate = () => {
      if (disposed || !atBottom || alreadyPlayed || document.hidden || preference.matches) return;
      // One viewport measurement before the single sprite insertion; never per frame.
      const { width, height } = stage.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      alreadyPlayed = true;
      playedInThisPage = true;
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* Storage may be blocked or full. */ }
      running = true;
      container.dataset.active = 'true';

      const count = width < 600 ? 24 : 36;
      const waterfallCount = count * 2 / 3;
      const columns = width < 600 ? 4 : 6;
      const rows = waterfallCount / columns;
      const fragment = document.createDocumentFragment();
      const pending: { sprite: HTMLSpanElement; keyframes: Keyframe[]; timing: KeyframeAnimationOptions }[] = [];
      const transform = (x: number, y: number, turn: number, scale: number) =>
        `translate3d(${x}px, ${y}px, 0) rotate(${turn}deg) scaleX(${scale})`;
      const clampX = (x: number) => Math.max(12, Math.min(width - 12, x));
      try {
        for (let index = 0; index < count; index += 1) {
          const sprite = document.createElement('span');
          sprite.className = 'footer-confetti-particle';
          sprite.style.width = `${5 + Math.random() * 3}px`;
          sprite.style.height = `${9 + Math.random() * 6}px`;
          sprite.style.backgroundColor = COLORS[index % COLORS.length];
          const rotation = Math.random() * 180;
          let keyframes: Keyframe[];

          if (index < waterfallCount) {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const startX = width * (column + .18 + Math.random() * .64) / columns;
            const startY = height * ((row + .15 + Math.random() * .35) / rows - .08);
            const drift = (Math.random() - .5) * Math.min(width * .2, 180);
            const endX = clampX(startX + drift);
            const endY = height + 36;
            const spin = (Math.random() < .5 ? -1 : 1) * (360 + Math.random() * 360);
            keyframes = [
              { offset: 0, transform: transform(startX, startY, rotation, .85), opacity: 0 },
              { offset: .06, opacity: 1 },
              { offset: .46, transform: transform(clampX(startX + drift * .55), startY + (endY - startY) * .43, rotation + spin * .46, .35), opacity: 1 },
              { offset: .87, opacity: .95 },
              { offset: 1, transform: transform(endX, endY, rotation + spin, .8), opacity: 0 },
            ];
          } else {
            const direction = index % 2 === 0 ? 1 : -1;
            const startX = width * (direction === 1 ? .035 : .965);
            const peakX = clampX(startX + direction * width * (.2 + Math.random() * .28));
            const peakY = height * (.05 + Math.random() * .32);
            const endX = clampX(startX + direction * width * (.4 + Math.random() * .45));
            const spin = direction * (240 + Math.random() * 480);
            keyframes = [
              { offset: 0, transform: transform(startX, height + 24, rotation, 1), opacity: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
              { offset: .06, opacity: 1 },
              { offset: .36, transform: transform(peakX, peakY, rotation + spin * .36, .45), opacity: 1, easing: 'cubic-bezier(.35,0,.7,.75)' },
              { offset: .86, opacity: .95 },
              { offset: 1, transform: transform(endX, height + 36, rotation + spin, .85), opacity: 0 },
            ];
          }

          pending.push({ sprite, keyframes, timing: { duration: 2350 + Math.random() * 350, delay: Math.random() * 120, fill: 'both' } });
          fragment.appendChild(sprite);
        }
        stage.appendChild(fragment);
        stage.dataset.active = 'true';
        for (const particle of pending) {
          const animation = particle.sprite.animate(particle.keyframes, particle.timing);
          animation.playbackRate = speedRef.current;
          animations.push(animation);
        }
      } catch {
        finish();
        return;
      }
      armCleanup();
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
      if (atBottom) celebrate();
    }, { threshold: 0 });
    observer.observe(trigger);
    document.addEventListener('visibilitychange', syncVisibility);
    preference.addEventListener('change', syncVisibility);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      disposed = true;
      finish();
      detach();
      controlsRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="footer-confetti" data-active="false" aria-hidden="true">
    <span ref={triggerRef} className="footer-confetti-trigger" aria-hidden="true" />
    <div ref={stageRef} className="footer-confetti-stage" aria-hidden="true" />
  </div>;
}
