import { BadgeCheck } from 'lucide-react';
import { useIdleMotion } from './useIdleMotion';
import './idle-details.css';

export function IdleGlare() {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="idle-glare" data-running={active} aria-hidden="true" />;
}

export function ProfileCheck() {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="profile-check" data-running={active} role="img" aria-label="Profile check mark">
    <BadgeCheck size={30} strokeWidth={2.5} aria-hidden="true" />
  </span>;
}
