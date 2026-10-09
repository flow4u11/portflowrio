import { useLayoutEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import { ShinyText } from './ShinyText';
import './localized-copy.css';

export type Language = 'en' | 'th';

/** A finite fade exchanges readable text without a scrambled intermediate copy. */
export function LocalizedCopy({ text, language, shine = false }: { text: string; language: Language; shine?: boolean }) {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const [displayed, setDisplayed] = useState({ text, language });
  const entering = useRef(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!active || reduced || document.hidden) {
      entering.current = false;
      if (displayed.text !== text || displayed.language !== language) setDisplayed({ text, language });
      return;
    }
    if (displayed.text !== text || displayed.language !== language) {
      const animation = node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110 / speed.current, fill: 'forwards' });
      let cancelled = false;
      animation.onfinish = () => {
        if (cancelled) return;
        entering.current = true;
        setDisplayed({ text, language });
      };
      return () => { cancelled = true; animation.cancel(); };
    }
    if (entering.current) {
      entering.current = false;
      const animation = node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 / speed.current, easing: 'ease-out' });
      return () => animation.cancel();
    }
  }, [text, language, displayed, active, reduced, ref]);
  return <span ref={ref} className="localized-copy" lang={displayed.language}>
    <span className="localized-copy-content">{displayed.text.split('**').map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : shine ? <ShinyText key={index} disabled={reduced} text={part} speed={1.6 / settings.animationSpeed} delay={1.5} /> : part)}</span>
  </span>;
}

export function LanguageControl({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return <button className="language-control" aria-label={language === 'en' ? 'อ่านข้อมูลสำคัญเป็นภาษาไทย' : 'Read key information in English'} onClick={() => onChange(language === 'en' ? 'th' : 'en')}>
    <Languages size={17} aria-hidden="true" /><LocalizedCopy language={language} text={language.toUpperCase()} />
  </button>;
}
