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

/** Use presentational chips without IDs; duplicate sets are inert and aria-hidden. */
export function LoopingMarquee({ children, label, className = '', contentClassName = '', direction = 'left', durationSeconds = 32 }: LoopingMarqueeProps) {
  const { ref, active, reduced } = useIdleMotion<HTMLDivElement>();
  const original = useRef<HTMLDivElement>(null);
  const [setsPerGroup, setSetsPerGroup] = useState(1);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);

  useLayoutEffect(() => {
    const viewport = ref.current;
    const set = original.current;
    if (!viewport || !set || reduced) return;
    const measure = () => {
      const width = set.scrollWidth;
      if (!width || !viewport.clientWidth) return;
      // Each half must fill the viewport, including short technology groups.
      setSetsPerGroup(Math.max(1, Math.ceil(viewport.clientWidth / width)));
      setReady(true);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(set);
    return () => observer.disconnect();
  }, [ref, reduced]);

  const copies = reduced ? 0 : setsPerGroup - 1;
  const duration = Number.isFinite(durationSeconds) ? Math.max(8, durationSeconds) : 32;
  const style = { '--marquee-duration': `${duration}s` } as CSSProperties;

  return <div ref={ref} className={`looping-marquee ${className}`} role="group" aria-label={label} tabIndex={0}
    data-running={active && ready} data-direction={direction} data-static={reduced} data-focused={focused} style={style}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="looping-marquee-track">
      <div className="looping-marquee-group">
        <div ref={original} className={`looping-marquee-set ${contentClassName}`}>{children}</div>
        {Array.from({ length: copies }, (_, index) => <div key={index} className={`looping-marquee-set looping-marquee-copy ${contentClassName}`} aria-hidden="true" inert>{children}</div>)}
      </div>
      {!reduced && <div className="looping-marquee-group looping-marquee-clone" aria-hidden="true" inert>
        {Array.from({ length: setsPerGroup }, (_, index) => <div key={index} className={`looping-marquee-set ${contentClassName}`}>{children}</div>)}
      </div>}
    </div>
  </div>;
}
