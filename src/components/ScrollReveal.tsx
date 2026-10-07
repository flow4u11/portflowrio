import { useEffect, useRef, type ReactNode } from 'react';
import './scroll-reveal.css';

/** Viewport boundaries trigger short transitions; scrolling does not render React. */
export function ScrollReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      if (preference.matches) {
        stage.dataset.reveal = 'visible';
        return;
      }
      stage.dataset.reveal = 'before';
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
          stage.dataset.reveal = 'visible';
        } else {
          stage.dataset.reveal = entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)
            ? 'after'
            : 'before';
        }
      }, { threshold: [0, 0.08], rootMargin: '-16px 0px -16px 0px' });
      observer.observe(stage);
    };

    observe();
    preference.addEventListener('change', observe);
    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', observe);
      delete stage.dataset.reveal;
    };
  }, []);

  return <div ref={ref} className={`depth-stage scroll-reveal ${className}`}>
    <div className="scroll-reveal-content">{children}</div>
  </div>;
}
