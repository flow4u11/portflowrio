import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { useMotionSettings } from './MotionSettings';

const phrases = ['Designing thoughtful experiences.', 'Exploring interactive worlds.', 'Turning little ideas into something real.'];
const sizingPhrase = phrases.reduce((longest, phrase) => phrase.length > longest.length ? phrase : longest, '');

export function Typewriter() {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref);
  const reduced = useReducedMotion();
  const [text, setText] = useState(phrases[0]);
  useEffect(() => {
    if (reduced || !visible) return;
    let phrase = 0;
    let character = phrases[0].length;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (document.hidden) return;
      const current = phrases[phrase];
      character += deleting ? -1 : 1;
      setText(current.slice(0, character));
      if (character === 0) {
        phrase = (phrase + 1) % phrases.length;
        deleting = false;
        timer = setTimeout(tick, 350 / speed.current);
      } else if (character === current.length) {
        deleting = true;
        timer = setTimeout(tick, 2800 / speed.current);
      } else timer = setTimeout(tick, (deleting ? 35 : 70) / speed.current);
    };
    const resume = () => {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(tick, 1500 / speed.current);
    };
    setText(phrases[0]);
    timer = setTimeout(tick, 2800 / speed.current);
    document.addEventListener('visibilitychange', resume);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', resume); };
  }, [reduced, visible]);
  return <span ref={ref} className="typewriter"><span className="sr-only">Designing thoughtful experiences and exploring interactive worlds.</span><span className="typewriter-sizer" aria-hidden="true">{sizingPhrase}|</span><span className="typewriter-value" aria-hidden="true">{reduced ? phrases[0] : text}<span className="typewriter-caret">|</span></span></span>;
}
