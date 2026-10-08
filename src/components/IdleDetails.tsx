import { useIdleMotion } from './useIdleMotion';
import './idle-details.css';

export function IdleGlare() {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="idle-glare" data-running={active} aria-hidden="true" />;
}

export function ProfileCheck() {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <span ref={ref} className="profile-check" data-running={active} role="img" aria-label="Profile check mark">
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <polygon fill="#1d9bf0" points="16,0 18.3,4.4 22.1,1.2 22.4,6.1 27.3,4.7 25.9,9.6 30.8,9.9 27.6,13.7 32,16 27.6,18.3 30.8,22.1 25.9,22.4 27.3,27.3 22.4,25.9 22.1,30.8 18.3,27.6 16,32 13.7,27.6 9.9,30.8 9.6,25.9 4.7,27.3 6.1,22.4 1.2,22.1 4.4,18.3 0,16 4.4,13.7 1.2,9.9 6.1,9.6 4.7,4.7 9.6,6.1 9.9,1.2 13.7,4.4" />
      <path d="m9.5 16 4.2 4.2 8.8-9" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>;
}
