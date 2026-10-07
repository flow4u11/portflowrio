import { useEffect, useRef } from 'react';
import { useMotionSettings } from './MotionSettings';
import './footer-confetti.css';

const SESSION_KEY = 'kimportflowrio:footer-confetti:v1';
const MAX_BASE_RUNTIME_MS = 3000;
const COLORS = ['#050505', '#ffffff', '#a3a3a3', '#d8cced', '#c7d7ed', '#d7e2ca'];
let playedInThisPage = false;

const random = (min: number, max: number) => min + Math.random() * (max - min);
const dragTravel = (time: number, drag: number) => -Math.expm1(-drag * time) / drag;
const smoothstep = (value: number) => {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
};

/** Sample the flight once; the browser interpolates these small transforms thereafter. */
function createFlight(width: number, height: number, index: number, count: number) {
  const fallingCount = count * 2 / 3;
  const falling = index < fallingCount;
  const verticalDrag = falling ? random(.8, 1.35) : random(.5, .8);
  const horizontalDrag = random(.7, 1.15);
  const endY = height + 40;
  let startX: number;
  let startY: number;
  let velocityY: number;
  let terminalVelocity: number;
  let endX: number;
  let duration: number;

  if (falling) {
    const columns = width < 600 ? 4 : 6;
    const column = index % columns;
    const row = Math.floor(index / columns);
    startX = width * (column + random(.2, .8)) / columns;
    startY = -24 - height * (row * .045 + random(0, .035));
    duration = random(2.45, 2.77);
    velocityY = height * random(.06, .12);
    // Linear air resistance gradually limits the speed of the falling paper.
    const travel = dragTravel(duration, verticalDrag);
    terminalVelocity = (endY - startY - velocityY * travel) / (duration - travel);
    endX = startX + random(-1, 1) * Math.min(width * .045, 65);
  } else {
    const direction = index % 2 === 0 ? 1 : -1;
    startX = width * (direction === 1 ? .025 : .975);
    startY = height + 18;
    const peakTime = random(.8, 1);
    const peakY = height * random(.035, .28);
    // Solve the launch velocity and gravity from its apex, without an easing
    // switch there: the same flight equation handles the rise and the fall.
    terminalVelocity = (startY - peakY) / (Math.expm1(verticalDrag * peakTime) / verticalDrag - peakTime);
    velocityY = -terminalVelocity * Math.expm1(verticalDrag * peakTime);
    const yAt = (time: number) => startY + terminalVelocity * time + (velocityY - terminalVelocity) * dragTravel(time, verticalDrag);
    let beforeLanding = peakTime;
    let afterLanding = 2.8;
    for (let step = 0; step < 14; step += 1) {
      const middle = (beforeLanding + afterLanding) / 2;
      if (yAt(middle) < endY) beforeLanding = middle;
      else afterLanding = middle;
    }
    duration = afterLanding;
    const spread = (index - fallingCount + random(.2, .8)) / (count - fallingCount);
    endX = width * (.14 + .72 * spread);
  }

  const wind = random(-12, 12);
  const horizontalTravel = dragTravel(duration, horizontalDrag);
  const velocityX = (endX - startX - wind * (duration - horizontalTravel)) / horizontalTravel;
  const sway = Math.min(width * .025, random(10, 22));
  const phase = random(0, Math.PI * 2);
  const flutterRate = random(6, 10);
  const rotation = random(-180, 180);
  const rollRate = random(120, 260) * (Math.random() < .5 ? -1 : 1);
  const frames = Math.ceil(duration * 1000 / 65);
  const keyframes: Keyframe[] = [];

  for (let frame = 0; frame <= frames; frame += 1) {
    const progress = frame / frames;
    const time = duration * progress;
    const drift = dragTravel(time, horizontalDrag);
    const flutter = phase + time * flutterRate;
    // Air sway grows smoothly after release, avoiding a lateral jump at t=0.
    const envelope = (-Math.expm1(-time * 2)) ** 2;
    const x = startX + velocityX * drift + wind * (time - drift) + sway * envelope * Math.sin(flutter * .62);
    const y = startY + terminalVelocity * time + (velocityY - terminalVelocity) * dragTravel(time, verticalDrag)
      + envelope * 3 * Math.sin(flutter * .8);
    const roll = rotation + rollRate * dragTravel(time, .55) + envelope * 12 * Math.sin(flutter * .7);
    const flip = flutter * 180 / Math.PI;
    const tilt = 32 * Math.sin(flutter * .73);
    keyframes.push({
      offset: progress,
      transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${roll.toFixed(2)}deg) rotateY(${flip.toFixed(2)}deg) rotateX(${tilt.toFixed(2)}deg)`,
      opacity: smoothstep(progress / .035) * (1 - smoothstep((progress - .91) / .09)),
    });
  }

  return { keyframes, timing: { duration: duration * 1000, delay: random(0, 120), easing: 'linear', fill: 'both' } satisfies KeyframeAnimationOptions };
}

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
      const fragment = document.createDocumentFragment();
      const pending: { sprite: HTMLSpanElement; keyframes: Keyframe[]; timing: KeyframeAnimationOptions }[] = [];
      try {
        for (let index = 0; index < count; index += 1) {
          const sprite = document.createElement('span');
          sprite.className = 'footer-confetti-particle';
          sprite.style.width = `${5 + Math.random() * 3}px`;
          sprite.style.height = `${9 + Math.random() * 6}px`;
          sprite.style.backgroundColor = COLORS[index % COLORS.length];
          pending.push({ sprite, ...createFlight(width, height, index, count) });
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
