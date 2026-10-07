import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useIdleMotion } from './useIdleMotion';
import './idle-motion.css';

type LoopingMarqueeProps = {
  children: ReactNode;
  label: string;
  className?: string;
  /** Existing chip-list class; applied to each set so direct-child styles work. */
  contentClassName?: string;
  direction?: 'left' | 'right';
  durationSeconds?: number;
};

/** Children are presentational chips without IDs or focusable controls. */
export function LoopingMarquee({ children, label, className = '', contentClassName = '', direction = 'left', durationSeconds = 32 }: LoopingMarqueeProps) {
  const { ref, active, reduced } = useIdleMotion<HTMLDivElement>();
  const original = useRef<HTMLDivElement>(null);
  const [setsPerGroup, setSetsPerGroup] = useState(1);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const viewport = ref.current;
    const set = original.current;
    if (!viewport || !set || reduced) return;
    let disposed = false;
    const fonts = document.fonts;
    let fontsSettled = !fonts || fonts.status === 'loaded';
    let fontTimeout: number | undefined;
    const measure = () => {
      if (disposed) return;
      // Fractional widths include the trailing gap. Ancestor scale affects both
      // rectangles equally, so the number of copies also stays correct during reveals.
      const width = set.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (!width || !viewportWidth) {
        setReady(false);
        return;
      }
      // Each half must fill the viewport, including short technology groups.
      setSetsPerGroup(Math.max(1, Math.ceil(viewportWidth / width)));
      setReady(fontsSettled);
    };
    const finishFonts = () => {
      if (disposed) return;
      fontsSettled = true;
      window.clearTimeout(fontTimeout);
      measure();
    };
    measure();
    if (fonts) {
      // Start from settled text metrics, with a fallback for a stalled font request.
      if (!fontsSettled) fontTimeout = window.setTimeout(finishFonts, 2000);
      void fonts.ready.then(finishFonts, finishFonts);
      fonts.addEventListener('loadingdone', measure);
      fonts.addEventListener('loadingerror', measure);
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(viewport);
    observer?.observe(set);
    if (!observer) window.addEventListener('resize', measure);
    return () => {
      disposed = true;
      window.clearTimeout(fontTimeout);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      fonts?.removeEventListener('loadingdone', measure);
      fonts?.removeEventListener('loadingerror', measure);
    };
  }, [ref, reduced]);

  const copies = reduced ? 0 : setsPerGroup - 1;
  const duration = Number.isFinite(durationSeconds) ? Math.max(8, durationSeconds) : 32;
  const style = { '--marquee-duration': `${duration}s` } as CSSProperties;

  return <div ref={ref} className={`looping-marquee ${className}`} role="group" aria-label={label} tabIndex={reduced ? undefined : 0}
    data-running={active && ready} data-direction={direction} data-static={reduced} style={style}>
    <div className="looping-marquee-track">
      <div className="looping-marquee-group">
        <div ref={original} className={`looping-marquee-set ${contentClassName}`}>{children}</div>
        {/* aria-hidden avoids repeated announcements; copies still receive pointer hover/press. */}
        {Array.from({ length: copies }, (_, index) => <div key={index} className={`looping-marquee-set looping-marquee-copy ${contentClassName}`} aria-hidden="true">{children}</div>)}
      </div>
      {!reduced && <div className="looping-marquee-group looping-marquee-clone" aria-hidden="true">
        {Array.from({ length: setsPerGroup }, (_, index) => <div key={index} className={`looping-marquee-set ${contentClassName}`}>{children}</div>)}
      </div>}
    </div>
  </div>;
}
