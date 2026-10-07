import { useIdleMotion } from './useIdleMotion';
import './animated-name.css';

const FONTS = ['sans', 'mono', 'serif'] as const;

/** All font variants reserve one shared grid cell, so cycling cannot move the page. */
export function AnimatedName({ children, className = '' }: { children: string; className?: string }) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();

  return <span ref={ref} className={`animated-name ${className}`} data-running={active}>
    <span className="animated-name-accessible">{children}</span>
    {FONTS.map(font => <span key={font} className={`animated-name-font animated-name-font--${font}`} aria-hidden="true">
      {children}<span className="animated-name-gradient">{children}</span>
    </span>)}
  </span>;
}
