import { useEffect, useRef } from 'react';
import { useMotionSettings } from './MotionSettings';
import { useIdleMotion } from './useIdleMotion';
import type { Language } from './LocalizedCopy';

const richParts = (text: string) => text.split('**');
const characters = (text: string) => {
  if (typeof Intl.Segmenter !== 'function') return Array.from(text);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text), part => part.segment);
};
type VisualPart = { text: string; bold: boolean };
const visualParts = (text: string): VisualPart[] => richParts(text).map((part, index) => ({ text: part, bold: index % 2 === 1 }));

/** Complete semantic text stays in place while a finite layer erases and types. */
export function ProjectMotionCopy({ text, language, enabled = true }: { text: string; language: Language; enabled?: boolean }) {
  const { settings } = useMotionSettings();
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const visualRef = useRef<HTMLSpanElement>(null);
  const displayed = useRef<VisualPart[]>([]);
  const lastText = useRef<string | null>(null);
  const hasShown = useRef(false);

  useEffect(() => {
    const root = ref.current;
    const visual = visualRef.current;
    if (!root || !visual) return;
    const next = visualParts(text);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const prepare = (parts: VisualPart[]) => {
      visual.replaceChildren(...parts.map(part => document.createElement(part.bold ? 'strong' : 'span')));
      return parts.map(part => ({ ...part, characters: characters(part.text) }));
    };
    let prepared = prepare(next);
    const paint = (count: number) => {
      let remaining = count;
      displayed.current = prepared.map((part, index) => {
        const copy = part.characters.slice(0, Math.max(0, remaining)).join('');
        if (visual.children[index].textContent !== copy) visual.children[index].textContent = copy;
        remaining -= part.characters.length;
        return { text: copy, bold: part.bold };
      });
    };
    const nextTotal = prepared.reduce((count, part) => count + part.characters.length, 0);
    const finish = () => {
      prepared = prepare(next);
      paint(nextTotal);
      root.removeAttribute('data-typing');
    };
    if (!active || reduced || !enabled) {
      finish();
      if (hasShown.current) lastText.current = text;
      return;
    }
    if (hasShown.current && lastText.current === text) { finish(); return; }

    const previous = hasShown.current ? displayed.current : [];
    hasShown.current = true;
    lastText.current = text;
    prepared = prepare(previous);
    const oldTotal = prepared.reduce((count, part) => count + part.characters.length, 0);
    paint(oldTotal);
    root.setAttribute('data-typing', 'true');
    const eraseDuration = oldTotal ? Math.min(420, Math.max(140, oldTotal * 3)) / speed.current : 0;
    const typeDuration = Math.min(1250, Math.max(380, nextTotal * 13)) / speed.current;
    const started = performance.now();
    let typing = false;
    const tick = () => {
      if (document.hidden) { finish(); return; }
      const elapsed = performance.now() - started;
      if (elapsed < eraseDuration) paint(Math.ceil(oldTotal * (1 - elapsed / eraseDuration)));
      else {
        if (!typing) { prepared = prepare(next); typing = true; }
        const progress = Math.min(1, (elapsed - eraseDuration) / typeDuration);
        paint(Math.ceil(nextTotal * progress));
        if (progress === 1) { finish(); return; }
      }
      timer = setTimeout(tick, 35);
    };
    timer = setTimeout(tick, 35);
    // Preserve the currently visible characters when a new selection interrupts.
    return () => { clearTimeout(timer); };
  }, [text, active, reduced, enabled, ref]);

  return <span ref={ref} className="pg-motion-copy" lang={language}>
    <span className="pg-motion-copy-full">{richParts(text).map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}</span>
    <span ref={visualRef} className="pg-motion-copy-visual" aria-hidden="true" />
  </span>;
}

/** Count from the previous visible number; assistive text has the final value. */
export function ProjectMotionNumber({ value, enabled = true }: { value: number; enabled?: boolean }) {
  const { settings } = useMotionSettings();
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const visualRef = useRef<HTMLSpanElement>(null);
  const displayed = useRef(value);
  const initial = useRef(String(value).padStart(2, '0'));
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const formatted = String(value).padStart(2, '0');

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    const from = displayed.current;
    if (!active || reduced || !enabled || from === value) {
      displayed.current = value;
      visual.textContent = formatted;
      return;
    }
    let frame = 0;
    let started = 0;
    const tick = (now: number) => {
      if (!started) started = now;
      const progress = Math.min(1, (now - started) / (520 / speed.current));
      const eased = 1 - Math.pow(1 - progress, 3);
      displayed.current = Math.round(from + (value - from) * eased);
      const copy = String(displayed.current).padStart(2, '0');
      if (visual.textContent !== copy) visual.textContent = copy;
      if (progress < 1 && !document.hidden) frame = requestAnimationFrame(tick);
      else { displayed.current = value; visual.textContent = formatted; }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [value, formatted, active, reduced, enabled]);

  return <span ref={ref} className="pg-motion-number"><span className="pg-sr-only">{formatted}</span><span ref={visualRef} aria-hidden="true">{initial.current}</span></span>;
}
