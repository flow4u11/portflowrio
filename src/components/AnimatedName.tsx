import type { CSSProperties } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import './animated-name.css';

/** Original heading typography with a small, visibility-gated monochrome shimmer. */
export function AnimatedName({ children, className = '' }: { children: string; className?: string }) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  const { settings } = useMotionSettings();
  const speed = Number.isFinite(settings.animationSpeed) ? Math.min(2, Math.max(.5, settings.animationSpeed)) : 1;
  const style = {
    '--name-gradient-duration': `${12 / speed}s`,
    '--name-gradient-steps': Math.round(180 / speed),
  } as CSSProperties;

  return <span ref={ref} className={`animated-name ${className}`} data-running={active} style={style}>
    {children}<span className="animated-name-gradient" aria-hidden="true">{children}</span>
  </span>;
}
