import { useEffect, useRef } from 'react';
import { useMotionSettings } from './MotionSettings';
import { useIdleMotion } from './useIdleMotion';
import type { Language } from './LocalizedCopy';

const richParts = (text: string) => text.split('**');
const characters = (text: string) => {
  // Keep Thai combining marks and emoji together as the visual text appears.
  if (typeof Intl.Segmenter !== 'function') return Array.from(text);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text), part => part.segment);
};

/** A stable, complete semantic copy with a short, decorative typing layer. */
export function ProjectMotionCopy({ text, language, enabled = true }: { text: string; language: Language; enabled?: boolean }) {
  const { settings } = useMotionSettings();
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const visualRef = useRef<HTMLSpanElement>(null);
  const parts = richParts(text);

  useEffect(() => {
    const root = ref.current;
    const visual = visualRef.current;
    if (!root || !visual || !active || reduced || !enabled) {
      root?.removeAttribute('data-typing');
      return;
    }
    const segments = richParts(text).map(characters);
    const spans = Array.from(visual.children);
    const total = segments.reduce((count, part) => count + part.length, 0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = 0;
    root.setAttribute('data-typing', 'true');
    spans.forEach(span => { span.textContent = ''; });

    const finish = () => root.removeAttribute('data-typing');
    const tick = () => {
      if (document.hidden) { finish(); return; }
      const now = performance.now();
      if (!started) started = now;
      const progress = Math.min(1, (now - started) / (Math.min(1250, Math.max(560, total * 13)) / speed.current));
      let remaining = Math.ceil(total * progress);
      segments.forEach((part, index) => {
        const next = part.slice(0, Math.max(0, remaining)).join('');
        if (spans[index].textContent !== next) spans[index].textContent = next;
        remaining -= part.length;
      });
      if (progress === 1) finish();
      else timer = setTimeout(tick, 35);
    };
    // Let the artwork and caption enter before typing starts, so it is visible.
    timer = setTimeout(tick, 220 / speed.current);
    return () => { clearTimeout(timer); finish(); };
  }, [text, active, reduced, enabled, ref]);

  const renderParts = (visual: boolean) => parts.map((part, index) => index % 2
    ? <strong key={index}>{part}</strong>
    : visual ? <span key={index}>{part}</span> : part);

  return <span ref={ref} className="pg-motion-copy" lang={language}>
    <span className="pg-motion-copy-full">{renderParts(false)}</span>
    <span ref={visualRef} className="pg-motion-copy-visual" aria-hidden="true">{renderParts(true)}</span>
  </span>;
}

/** Count only the decorative layer; assistive technology always has the final number. */
export function ProjectMotionNumber({ value, enabled = true }: { value: number; enabled?: boolean }) {
  const { settings } = useMotionSettings();
  const { ref, active, reduced } = useIdleMotion<HTMLSpanElement>();
  const visualRef = useRef<HTMLSpanElement>(null);
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const formatted = String(value).padStart(2, '0');

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    visual.textContent = formatted;
    if (!active || reduced || !enabled) return;
    let frame = 0;
    let started = 0;
    const tick = (now: number) => {
      if (!started) started = now;
      const progress = Math.min(1, (now - started) / (680 / speed.current));
      const eased = 1 - Math.pow(1 - progress, 3);
      visual.textContent = String(Math.round(value * eased)).padStart(2, '0');
      if (progress < 1 && !document.hidden) frame = requestAnimationFrame(tick);
      else visual.textContent = formatted;
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); visual.textContent = formatted; };
  }, [value, formatted, active, reduced, enabled]);

  return <span ref={ref} className="pg-motion-number"><span className="pg-sr-only">{formatted}</span><span ref={visualRef} aria-hidden="true">{formatted}</span></span>;
}
