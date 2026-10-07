import { Check } from 'lucide-react';
import { useIdleMotion } from './useIdleMotion';
import './idle-details.css';

export function IdleGlare() {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="idle-glare" data-running={active} aria-hidden="true" />;
}

export function ProfileCheck() {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="profile-check" data-running={active} role="img" aria-label="Profile check mark">
    <Check size={15} strokeWidth={3} aria-hidden="true" />
  </span>;
}
