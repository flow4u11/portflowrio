import { useEffect, useRef } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { LocalizedCopy, type Language } from './LocalizedCopy';
import './information-motion.css';

export function GraduationYears() {
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const number = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  useEffect(() => {
    if (reduced) { if (number.current) number.current.textContent = '2023'; return; }
    if (!active || played.current) return;
    played.current = true;
    let frame = 0;
    let previous = 2016;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 1100);
      const value = Math.round(2016 + 7 * (1 - (1 - progress) ** 3));
      if (number.current && previous !== value) number.current.textContent = String(value);
      previous = value;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); if (number.current) number.current.textContent = '2023'; };
  }, [active, reduced]);
  return <span ref={ref} className="graduation-years" aria-label="2016–2023"><span aria-hidden="true">2016–<span ref={number}>{reduced ? 2023 : 2016}</span></span></span>;
}

export function ExperienceStatus({ language }: { language: Language }) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="experience-status" data-running={active} lang={language}>
    <span className="experience-dot" aria-hidden="true" /><LocalizedCopy language={language} text={language === 'th' ? 'กำลังมองหาประสบการณ์' : 'Looking for experience'} /><span className="experience-ellipsis" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
  </span>;
}
