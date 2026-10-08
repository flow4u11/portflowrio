import type { CSSProperties } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import './animated-name.css';
import { ShinyText } from './ShinyText';
import { nameGradientStyle } from './motion-settings-model';

/** Original heading typography with a small, visibility-gated customizable gradient. */
export function AnimatedName({ children, className = '' }: { children: string; className?: string }) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  const { settings } = useMotionSettings();
  const style = nameGradientStyle(settings) as CSSProperties;

  return <span ref={ref} className={`animated-name ${className}`} data-running={active} style={style}>
    {children}<span className="animated-name-gradient" aria-hidden="true">{children}</span>
    <ShinyText text={children} overlay disabled={!settings.nameShineEnabled} speed={settings.nameShineSpeed / settings.animationSpeed} delay={settings.nameShineDelay / settings.animationSpeed} angle={settings.nameShineAngle} shineWidth={settings.nameShineWidth} softness={settings.nameShineSoftness} direction={settings.nameShineDirection} shineColor={settings.nameShineAutoColor ? 'var(--text)' : settings.nameShineColor} />
  </span>;
}
