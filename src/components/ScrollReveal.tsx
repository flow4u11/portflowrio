import { useEffect, useRef, type ReactNode } from 'react';
import './scroll-reveal.css';

/** Viewport boundaries trigger short transitions; scrolling does not render React. */
export function ScrollReveal({ children, className = '', delay = 180, flat = false }: { children: ReactNode; className?: string; delay?: number; flat?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | null = null;
    let entrance: ReturnType<typeof setTimeout> | undefined;

    const observe = () => {
      observer?.disconnect();
      clearTimeout(entrance);
      entrance = undefined;
      if (preference.matches) {
        stage.dataset.reveal = 'visible';
        return;
      }
      stage.dataset.reveal = 'before';
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
          if (stage.dataset.reveal !== 'visible' && !entrance) entrance = setTimeout(() => {
            stage.dataset.reveal = 'visible'; entrance = undefined;
          }, delay);
        } else if (!entry.isIntersecting) {
          clearTimeout(entrance); entrance = undefined;
          stage.dataset.reveal = entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)
            ? 'after'
            : 'before';
        }
      }, { threshold: [0, 0.08], rootMargin: '0px 0px -6% 0px' });
      observer.observe(stage);
    };

    observe();
    preference.addEventListener('change', observe);
    return () => {
      observer?.disconnect();
      clearTimeout(entrance);
      preference.removeEventListener('change', observe);
      delete stage.dataset.reveal;
    };
  }, [delay]);

  return <div ref={ref} className={`depth-stage scroll-reveal ${className}`} data-flat={flat || undefined}>
    <div className="scroll-reveal-content">{children}</div>
  </div>;
}
