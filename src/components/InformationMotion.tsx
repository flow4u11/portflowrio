import { useEffect, useRef } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { LocalizedCopy, type Language } from './LocalizedCopy';
import { useMotionSettings } from './MotionSettings';
import './information-motion.css';

export function GraduationYears() {
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const first = useRef<HTMLSpanElement>(null);
  const last = useRef<HTMLSpanElement>(null);
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  useEffect(() => {
    const finish = () => { if (first.current) first.current.textContent = '2016'; if (last.current) last.current.textContent = '2023'; };
    if (reduced || !active) { finish(); return; }
    if (first.current) first.current.textContent = '1940';
    if (last.current) last.current.textContent = '1940';
    let frame = 0;
    let previous = -1;
    const start = performance.now() + 280 / speed.current;
    const duration = 1450 / speed.current;
    const tick = (time: number) => {
      if (time < start) { frame = requestAnimationFrame(tick); return; }
      const progress = Math.min(1, (time - start) / duration);
      const step = Math.floor(progress * 44);
      if (step !== previous) {
        const ease = 1 - (1 - progress) ** 3;
        if (first.current) first.current.textContent = String(Math.round(1940 + 76 * ease));
        if (last.current) last.current.textContent = String(Math.round(1940 + 83 * ease));
        previous = step;
      }
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); finish(); };
  }, [active, reduced]);
  return <span ref={ref} className="graduation-years" aria-label="2016–2023"><span aria-hidden="true"><span ref={first}>2016</span>–<span ref={last}>2023</span></span></span>;
}

export function ExperienceStatus({ language }: { language: Language }) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="experience-status" data-running={active} lang={language}>
    <span className="experience-dot" aria-hidden="true" /><LocalizedCopy shine language={language} text={language === 'th' ? 'กำลังมองหาประสบการณ์' : 'Looking for experience'} /><span className="experience-ellipsis" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
  </span>;
}
