import { useEffect, useRef, useState } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import './idle-motion.css';

const WORDS = ['flowrio.', 'portfolio.'] as const;
const GLYPHS = 'flowrip/.:*';
const HOLD_MS = 6800;
const BURST_MS = 600;
const FRAME_MS = 1000 / 15;

/** Place inside the existing wordmark control. Its accessible name stays "flowrio.". */
export function ScrambleWordmark({ className = '' }: { className?: string }) {
  const { settings: { animationSpeed } } = useMotionSettings();
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const [text, setText] = useState<string>(WORDS[0]);
  const settled = useRef(0);

  useEffect(() => {
    if (!active) {
      setText(WORDS[reduced ? 0 : settled.current]);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const startBurst = () => {
      const next = (settled.current + 1) % WORDS.length;
      const target = WORDS[next];
      const startedAt = performance.now();
      const update = () => {
        if (cancelled) return;
        const progress = Math.min((performance.now() - startedAt) / (BURST_MS / animationSpeed), 1);
        if (progress === 1) {
          settled.current = next;
          setText(target);
          timer = setTimeout(startBurst, HOLD_MS / animationSpeed);
          return;
        }
        const revealed = Math.floor(progress * (target.length + 2)) - 2;
        setText(Array.from(target, (character, index) => character === '.' || index < revealed
          ? character
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(''));
        timer = setTimeout(update, FRAME_MS);
      };
      update();
    };
    timer = setTimeout(startBurst, HOLD_MS / animationSpeed);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [active, reduced, animationSpeed]);

  return <span ref={ref} className={`scramble-wordmark ${className}`} role="img" aria-label="flowrio.">
    <span className="scramble-wordmark-size" aria-hidden="true">portfolio.</span>
    <span className="scramble-wordmark-text" aria-hidden="true">{text}</span>
  </span>;
}
