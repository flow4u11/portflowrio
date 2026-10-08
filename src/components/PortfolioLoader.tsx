import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useMotionSettings } from './MotionSettings';
import { getPortfolioReadiness, subscribePortfolioReadiness, type PortfolioReadinessStatus } from './portfolioReadiness';
import './portfolio-loader.css';

type LoaderPhase = 'entry' | 'loading' | 'complete';
type Resource = 'portrait' | 'portraitAlternate' | 'fonts' | 'gallery' | 'background';

const RESOURCE_WEIGHTS: Record<Resource, number> = {
  portrait: 12, portraitAlternate: 12, fonts: 16, gallery: 35, background: 25,
};
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ/.:+*';
const DEADLINE_MS = 6200;

function scramble(target: string, progress: number, frame: number) {
  if (progress >= 1) return target;
  const revealed = Math.floor(progress * (target.length + 4)) - 2;
  return Array.from(target, (character, index) => {
    if (character === ' ' || index < revealed) return character;
    return GLYPHS[(frame * 7 + index * 11) % GLYPHS.length];
  }).join('');
}

/** One finite sequence: entrance, real preparation, settled text, then the Hero handoff. */
export function PortfolioLoader({ reduced, onComplete }: { reduced: boolean; onComplete: () => void }) {
  const { settings } = useMotionSettings();
  const [phase, setPhase] = useState<LoaderPhase>(reduced ? 'loading' : 'entry');
  const [fallback, setFallback] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const invitationRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLProgressElement>(null);
  const configRef = useRef({ reduced, speed: settings.animationSpeed, onComplete });
  configRef.current = { reduced, speed: settings.animationSpeed, onComplete };
  const completedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let lastFrame = 0;
    let visibleTime = 0;
    let loadingAt = -1;
    let completeAt = -1;
    let displayedProgress = 0;
    let lastNumber = -1;
    let lastScrambleFrame = -1;
    let textSettled = false;
    const speed = Math.max(.5, Math.min(2, configRef.current.speed));
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const cleanups: (() => void)[] = [];
    const resources: Record<Resource, PortfolioReadinessStatus> = {
      portrait: 'pending', portraitAlternate: 'pending', fonts: 'pending', gallery: 'pending', background: 'pending',
    };
    const settle = (resource: Resource, status: Exclude<PortfolioReadinessStatus, 'pending'>) => {
      if (!cancelled && resources[resource] === 'pending') resources[resource] = status;
    };
    const boundedTimer = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
      return timer;
    };
    const clearTimer = (timer: ReturnType<typeof setTimeout>) => { clearTimeout(timer); timers.delete(timer); };

    const syncReadiness = () => {
      const readiness = getPortfolioReadiness();
      for (const resource of ['gallery', 'background'] as const) {
        if (readiness[resource] !== 'pending') settle(resource, readiness[resource]);
      }
    };
    const unsubscribe = subscribePortfolioReadiness(syncReadiness);
    syncReadiness();

    // Decode both avatar states before their first possible interaction. A failed
    // asset is a settled fallback, never a promise that can trap the entrance.
    for (const [resource, src] of [
      ['portrait', '/assets/profile-anime.png'],
      ['portraitAlternate', '/assets/profile-photo.png'],
    ] as const) {
      const image = new Image();
      image.decoding = 'async';
      let finished = false;
      const finish = (status: 'ready' | 'fallback') => {
        if (finished) return;
        finished = true;
        clearTimer(timeout);
        image.onload = image.onerror = null;
        settle(resource, status);
      };
      const timeout = boundedTimer(() => finish('fallback'), 3600);
      image.onload = () => { void image.decode().then(() => finish('ready'), () => finish('fallback')); };
      image.onerror = () => finish('fallback');
      image.src = src;
      cleanups.push(() => { image.onload = image.onerror = null; });
    }

    if (document.fonts) {
      const timeout = boundedTimer(() => settle('fonts', 'fallback'), 3600);
      void Promise.all([
        document.fonts.load('400 16px Manrope'),
        document.fonts.load('800 64px Manrope'),
        document.fonts.load('400 16px "Noto Sans Thai"', 'กขค'),
        document.fonts.load('700 16px "Noto Sans Thai"', 'กขค'),
        document.fonts.load('400 12px "Space Mono"'),
        document.fonts.ready,
      ]).then(results => {
        clearTimer(timeout);
        // A missing font stylesheet can resolve load() with no matching faces.
        const fontFaces = results.slice(0, -1) as FontFace[][];
        settle('fonts', fontFaces.every(faces => faces.length > 0) ? 'ready' : 'fallback');
      }, () => {
        clearTimer(timeout);
        settle('fonts', 'fallback');
      });
    } else settle('fonts', 'fallback');

    const deadline = boundedTimer(() => {
      for (const resource of Object.keys(resources) as Resource[]) settle(resource, 'fallback');
    }, DEADLINE_MS);
    const writeProgress = (value: number) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`;
      const rounded = Math.floor(value);
      if (rounded !== lastNumber) {
        lastNumber = rounded;
        if (numberRef.current) numberRef.current.textContent = `${rounded}%`;
        if (progressRef.current) progressRef.current.value = rounded;
        rootRef.current?.setAttribute('data-progress', String(rounded));
      }
    };
    writeProgress(0);
    rootRef.current?.removeAttribute('data-text-settled');

    const animate = (now: number) => {
      frame = 0;
      if (cancelled || completedRef.current) return;
      // rAF sleeps in hidden tabs. Capping its delta preserves the visible
      // sequence on return instead of jumping from zero to a completed bar.
      const delta = lastFrame ? Math.min(48, now - lastFrame) : 0;
      lastFrame = now;
      if (!document.hidden) visibleTime += delta;
      const motionReduced = configRef.current.reduced;
      const entryDuration = motionReduced ? 0 : 440 / speed;
      if (loadingAt < 0 && visibleTime >= entryDuration) {
        loadingAt = visibleTime;
        setPhase('loading');
      }
      if (loadingAt >= 0 && completeAt < 0) {
        const elapsed = visibleTime - loadingAt;
        const minimumDuration = motionReduced ? 240 : 1400 / speed;
        const timeProgress = Math.min(1, elapsed / minimumDuration);
        const temporalCap = (timeProgress * timeProgress * (3 - 2 * timeProgress)) * 100;
        const resourceProgress = (Object.keys(resources) as Resource[]).reduce((total, resource) =>
          total + (resources[resource] === 'pending' ? 0 : RESOURCE_WEIGHTS[resource]), 0);
        const target = Math.min(resourceProgress, temporalCap);
        displayedProgress = motionReduced ? target : displayedProgress + (target - displayedProgress) * (1 - Math.exp(-delta / 135));
        if (target === 100 && displayedProgress > 99.85) displayedProgress = 100;
        writeProgress(displayedProgress);
        const scrambleFrame = Math.floor(elapsed / 44);
        if (scrambleFrame !== lastScrambleFrame || motionReduced) {
          lastScrambleFrame = scrambleFrame;
          if (labelRef.current) labelRef.current.textContent = scramble('Loading...', motionReduced ? 1 : elapsed / (600 / speed), scrambleFrame);
        }
        if (displayedProgress === 100 && elapsed >= (motionReduced ? 0 : 600 / speed)) {
          clearTimer(deadline);
          unsubscribe();
          completeAt = visibleTime;
          lastScrambleFrame = -1;
          const usesFallback = Object.values(resources).some(status => status === 'fallback');
          setFallback(usesFallback);
          setPhase('complete');
          rootRef.current?.setAttribute('data-readiness', usesFallback ? 'fallback' : 'ready');
        }
      }
      if (completeAt >= 0) {
        const elapsed = visibleTime - completeAt;
        const labelDuration = motionReduced ? 0 : 620 / speed;
        const invitationDelay = motionReduced ? 0 : 100 / speed;
        const invitationDuration = motionReduced ? 0 : 680 / speed;
        const settleDuration = Math.max(labelDuration, invitationDelay + invitationDuration);
        const scrambleFrame = Math.floor(elapsed / 44);
        if (scrambleFrame !== lastScrambleFrame || motionReduced) {
          lastScrambleFrame = scrambleFrame;
          if (labelRef.current) labelRef.current.textContent = scramble('Portfolio', labelDuration ? elapsed / labelDuration : 1, scrambleFrame);
          if (invitationRef.current) invitationRef.current.textContent = scramble('Dive it to flow(rio)', invitationDuration ? Math.max(0, elapsed - invitationDelay) / invitationDuration : 1, scrambleFrame + 3);
        }
        if (!textSettled && elapsed >= settleDuration) {
          textSettled = true;
          if (labelRef.current) labelRef.current.textContent = 'Portfolio';
          if (invitationRef.current) invitationRef.current.textContent = 'Dive it to flow(rio)';
          rootRef.current?.setAttribute('data-text-settled', 'true');
        }
        // The full bar and the complete invitation stay readable together.
        if (textSettled && elapsed >= settleDuration + (motionReduced ? 180 : 1050 / speed)) {
          completedRef.current = true;
          configRef.current.onComplete();
          return;
        }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      unsubscribe();
      timers.forEach(clearTimeout);
      cleanups.forEach(cleanup => cleanup());
    };
  }, []);

  const complete = phase === 'complete';
  return <motion.div ref={rootRef} className="loading-screen portfolio-loader" role="status" aria-live="polite" aria-atomic="true"
    aria-label={complete ? 'Portfolio ready' : 'Preparing portfolio'} data-phase={phase} data-complete={complete} initial={false}
    exit={reduced ? { opacity: 0 } : { y: '-28%', rotateX: 48, z: -420, scale: .84, opacity: [1, 1, 0] }}
    transition={{ duration: reduced ? .12 : .9 / settings.animationSpeed, ease: [.76, 0, .24, 1] }}
    style={{ transformPerspective: 1200 }}>
    <motion.div className="portfolio-loader-entry" aria-hidden="true"
      initial={reduced ? { opacity: 0 } : { opacity: 0, rotateY: -48, scale: .65 }}
      animate={phase === 'entry' ? { opacity: [0, 1, 1, 0], rotateY: [-48, 0, 0], scale: [.65, 1, .78] } : { opacity: 0, scale: .78 }}
      transition={{ duration: reduced ? 0 : .44 / settings.animationSpeed, times: [0, .32, .72, 1], ease: [.22, 1, .36, 1] }}>
      <i /><i /><i /><i />
    </motion.div>
    <motion.div className="portfolio-loader-center" aria-hidden="true"
      initial={false} animate={phase === 'entry' ? { opacity: 0, y: 18, rotateX: 24, scale: .96 } : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: reduced ? 0 : .52 / settings.animationSpeed, ease: [.22, 1, .36, 1] }}>
      <span ref={labelRef} className="portfolio-loader-label">Loading...</span>
      <div className="portfolio-loader-meter"><span ref={numberRef}>0%</span><div className="portfolio-loader-track"><span ref={barRef} style={{ transform: 'scaleX(0)' }} /></div></div>
      <motion.span ref={invitationRef} className="portfolio-loader-invitation" animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 6 }} transition={{ duration: reduced ? 0 : .3 / settings.animationSpeed }}>Dive it to flow(rio)</motion.span>
    </motion.div>
    <span className="loader-sr-only">{complete ? fallback ? 'Portfolio ready with simplified visual effects.' : 'Portfolio ready.' : 'Preparing images, fonts, and visual effects.'}</span>
    <progress ref={progressRef} className="loader-sr-only" value={0} max={100} aria-label="Portfolio preparation progress" />
  </motion.div>;
}
