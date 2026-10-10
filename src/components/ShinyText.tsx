import { useEffect, useRef, type CSSProperties, type Ref } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { holdTimeline, resumeTimeline } from './motion-timeline';
import './shiny-text.css';

type ShinyTextProps = {
  text: string; className?: string; disabled?: boolean; speed?: number; delay?: number;
  angle?: number; shineWidth?: number; softness?: number; direction?: 'left' | 'right';
  shineColor?: string; overlay?: boolean; contentRef?: Ref<HTMLSpanElement>;
  continuous?: boolean;
};

/** Adapted from the supplied ReactBits ShinyText: static band + bounded WAAPI paint.
 * Keeps its geometry/direction/rest controls without per-frame React/color parsing.
 */
export function ShinyText({ text, className = '', disabled = false, speed = 2.4, delay = 1.2, angle = 120,
  shineWidth = 35, softness = .8, direction = 'left', shineColor = 'var(--text)', overlay = false, contentRef, continuous = false }: ShinyTextProps) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  const animation = useRef<Animation | null>(null);
  const held = useRef<number | null>(null);
  const half = shineWidth / 2;
  const core = half * (1 - softness);
  const fill = overlay ? 'transparent' : 'color-mix(in srgb, var(--text) 58%, var(--bg))';
  const style = { backgroundColor: continuous ? fill : undefined, '--shine-band': `linear-gradient(${angle}deg, ${fill} ${50 - half}%, ${shineColor} ${50 - core}%, ${shineColor} ${50 + core}%, ${fill} ${50 + half}%)` } as CSSProperties;
  useEffect(() => {
    const node = ref.current;
    if (!node || disabled) return;
    const total = Math.max(.5, speed) + delay;
    // With a 250%-wide gradient the band is completely outside the text at
    // both endpoints. A continuous wrap therefore has no visible reset.
    const end = continuous ? (direction === 'right' ? '-100% 50%' : '200% 50%') : direction === 'right' ? '0% 50%' : '100% 50%';
    const start = continuous ? (direction === 'right' ? '200% 50%' : '-100% 50%') : direction === 'right' ? '100% 50%' : '0% 50%';
    const sweep = speed / total;
    animation.current = node.animate([
      { backgroundPosition: start, offset: 0, easing: continuous ? 'linear' : 'cubic-bezier(.45,0,.55,1)' },
      { backgroundPosition: end, offset: sweep }, { backgroundPosition: end, offset: 1 },
    ], { duration: total * 1000, iterations: Infinity, easing: continuous ? 'linear' : `steps(${Math.max(30, Math.round(total * 30))}, end)` });
    held.current = null;
    if (!active) holdTimeline(animation.current, held);
    return () => { animation.current?.cancel(); animation.current = null; };
  }, [disabled, speed, delay, direction, continuous]);
  useEffect(() => { const current = animation.current; if (current) { if (active) resumeTimeline(current, held); else holdTimeline(current, held); } }, [active]);
  return <span ref={node => { ref.current = node; if (typeof contentRef === 'function') contentRef(node); else if (contentRef) contentRef.current = node; }}
    className={`shiny-text ${overlay ? 'shiny-text--overlay' : ''} ${className}`} data-shiny={!disabled || undefined} style={style} aria-hidden={overlay || undefined}>{text}</span>;
}
