import { useLayoutEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import { ShinyText } from './ShinyText';
import './localized-copy.css';

export type Language = 'en' | 'th';
const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Readable semantic copy stays intact beneath the finite visual scramble. */
export function LocalizedCopy({ text, language, shine = false }: { text: string; language: Language; shine?: boolean }) {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const previous = useRef(text);
  const [transition, setTransition] = useState<{ scramble: string | null; outgoing: string | null; entering: boolean }>({ scramble: null, outgoing: null, entering: false });
  useLayoutEffect(() => {
    if (!active || reduced || document.hidden) {
      previous.current = text;
      setTransition({ scramble: null, outgoing: null, entering: false });
      return;
    }
    if (previous.current === text) return;
    const outgoing = previous.current;
    previous.current = text;
    const characters = Array.from(text.replaceAll('**', ''));
    let frame = 0;
    let enterTimer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      frame += 1;
      if (frame >= 10 || document.hidden) {
        clearInterval(timer);
        setTransition({ scramble: null, outgoing: null, entering: !document.hidden });
        enterTimer = setTimeout(() => setTransition(current => ({ ...current, entering: false })), 180 / speed.current);
        return;
      }
      const resolved = Math.ceil(characters.length * frame / 10);
      const scramble = characters.map((character, index) => index < resolved || /\s|[.,!?—·]/u.test(character)
        ? character : glyphs[Math.floor(Math.random() * glyphs.length)]).join('');
      setTransition(current => ({ ...current, scramble, entering: false }));
    };
    setTransition({ scramble: '', outgoing, entering: false });
    const exitTimer = setTimeout(() => setTransition(current => ({ ...current, outgoing: null })), 110 / speed.current);
    const timer = setInterval(tick, 55 / speed.current);
    tick();
    return () => { clearInterval(timer); clearTimeout(exitTimer); clearTimeout(enterTimer); };
  }, [text, active, reduced]);
  return <span ref={ref} className="localized-copy" lang={language} data-scrambling={transition.scramble !== null || undefined} data-bold-entering={transition.entering || undefined}>
    <span className="localized-copy-content">{text.split('**').map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : shine ? <ShinyText key={index} continuous direction="right" disabled={reduced} text={part} speed={2.8 / settings.animationSpeed} delay={0} /> : part)}</span>
    {transition.scramble !== null && <span className="localized-copy-scramble" aria-hidden="true">{transition.scramble}</span>}
    {transition.outgoing !== null && <span className="localized-copy-outgoing" aria-hidden="true">{transition.outgoing.split('**').map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>)}</span>}
  </span>;
}

export function LanguageControl({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <button className="language-control" aria-label={language === 'en' ? 'อ่านข้อมูลสำคัญเป็นภาษาไทย' : 'Read key information in English'} onClick={() => onChange(language === 'en' ? 'th' : 'en')}>
    <Languages size={17} aria-hidden="true" /><LocalizedCopy language={language} text={language.toUpperCase()} />
  </button>;
}
