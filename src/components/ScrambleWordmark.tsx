import { useEffect, useRef, useState } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import './idle-motion.css';
import './scramble-wordmark.css';

const WORDS = ['flowrio.', 'portfolio.'] as const;
const GLYPHS = 'flowrip/.:*';
const HOLD_MS = 6800;
const BURST_MS = 600;
const FRAME_MS = 1000 / 15;

/** Place inside the existing wordmark control. Its accessible name stays "flowrio.". */
export function ScrambleWordmark({ className = '', settingsHint = false }: { className?: string; settingsHint?: boolean }) {
  const { settings: { animationSpeed } } = useMotionSettings();
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const [text, setText] = useState<string>(WORDS[0]);
  const settled = useRef(0);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const control = ref.current?.closest('button');
    if (!settingsHint || !control) return;
    const enter = (event: PointerEvent) => { if (event.pointerType !== 'touch') setHint(true); };
    const leave = () => setHint(control.matches(':focus-visible'));
    const focus = () => { if (control.matches(':focus-visible')) setHint(true); };
    const blur = () => setHint(false);
    control.addEventListener('pointerenter', enter);
    control.addEventListener('pointerleave', leave);
    control.addEventListener('focus', focus);
    control.addEventListener('blur', blur);
    return () => {
      control.removeEventListener('pointerenter', enter);
      control.removeEventListener('pointerleave', leave);
      control.removeEventListener('focus', focus);
      control.removeEventListener('blur', blur);
    };
  }, [settingsHint, ref]);

  useEffect(() => {
    if (!active) {
      setText(hint ? 'Open Settings' : WORDS[reduced ? 0 : settled.current]);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const startBurst = (restore = false) => {
      const next = restore || hint ? settled.current : (settled.current + 1) % WORDS.length;
      const target = hint ? 'Open Settings' : WORDS[next];
      if (reduced) { setText(target); return; }
      const startedAt = performance.now();
      const update = () => {
        if (cancelled) return;
        const progress = Math.min((performance.now() - startedAt) / (BURST_MS / animationSpeed), 1);
        if (progress === 1) {
          settled.current = next;
          setText(target);
          if (!hint) timer = setTimeout(() => startBurst(), HOLD_MS / animationSpeed);
          return;
        }
        const revealed = Math.floor(progress * (target.length + 2)) - 2;
        setText(Array.from(target, (character, index) => character === '.' || character === ' ' || index < revealed
          ? character
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));
        timer = setTimeout(update, FRAME_MS);
      };
      update();
    };
    startBurst(true);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [active, reduced, animationSpeed, hint]);

  return <span ref={ref} className={`scramble-wordmark ${settingsHint ? 'scramble-wordmark--settings' : ''} ${className}`} role="img" aria-label={hint ? 'Open Settings' : 'flowrio.'}>
    <span className="scramble-wordmark-size" aria-hidden="true">{settingsHint ? 'Open Settings' : 'portfolio.'}</span>
    <span className="scramble-wordmark-text" aria-hidden="true">{text}</span>
  </span>;
}
