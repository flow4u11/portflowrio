import { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import './localized-copy.css';

export type Language = 'en' | 'th';
const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Keep readable content in the accessibility tree while a short visual layer resolves. */
export function LocalizedCopy({ text, language }: { text: string; language: Language }) {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const previous = useRef(text);
  const [scramble, setScramble] = useState<string | null>(null);
  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;
    if (!active || reduced || document.hidden) { setScramble(null); return; }
    const characters = Array.from(text.replaceAll('**', ''));
    let frame = 0;
    const tick = () => {
      frame += 1;
      if (frame >= 10 || document.hidden) { setScramble(null); clearInterval(timer); return; }
      const resolved = Math.ceil(characters.length * frame / 10);
      setScramble(characters.map((character, index) => index < resolved || /\s|[.,!?—·]/u.test(character)
        ? character : glyphs[Math.floor(Math.random() * glyphs.length)]).join(''));
    };
    const timer = setInterval(tick, 55 / speed.current);
    tick();
    return () => clearInterval(timer);
  }, [text, active, reduced]);
  useEffect(() => { if (!active || reduced) setScramble(null); }, [active, reduced]);
  return <span ref={ref} className="localized-copy" lang={language} data-scrambling={scramble !== null || undefined}>
    <span className="localized-copy-content">{text.split('**').map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}</span>
    {scramble !== null && <span className="localized-copy-scramble" aria-hidden="true">{scramble}</span>}
  </span>;
}

export function LanguageControl({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <button className="language-control" aria-label={language === 'en' ? 'อ่านข้อมูลสำคัญเป็นภาษาไทย' : 'Read key information in English'} onClick={() => onChange(language === 'en' ? 'th' : 'en')}>
    <Languages size={17} aria-hidden="true" /><LocalizedCopy language={language} text={language.toUpperCase()} />
  </button>;
}
