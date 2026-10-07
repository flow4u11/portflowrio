import { useIdleMotion } from './useIdleMotion';
import './idle-motion.css';

/** A fixed two-line heading; only the second line fades and moves. */
export function CyclingAboutTitle({ id, className = '' }: { id?: string; className?: string }) {
  const { ref, active } = useIdleMotion<HTMLHeadingElement>();
  return <h2 ref={ref} id={id} className={`cycling-about-title ${className}`} data-running={active}>
    <span className="idle-motion-sr-only">A little design and play.</span>
    <span aria-hidden="true">A little<br /><span className="cycling-about-slot">
      <span className="cycling-about-size">design.</span>
      <span className="cycling-about-word cycling-about-design">design.</span>
      <i className="cycling-about-word cycling-about-play">play.</i>
    </span></span>
  </h2>;
}
