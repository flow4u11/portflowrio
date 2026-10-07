import { useEffect, useRef, useState } from 'react';

/** State changes only on visibility or preference changes, never per frame. */
export function useIdleMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => typeof document !== 'undefined' && !document.hidden);
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReduced(preference.matches);
    const syncVisibility = () => setTabVisible(!document.hidden);
    syncPreference();
    syncVisibility();
    preference.addEventListener('change', syncPreference);
    document.addEventListener('visibilitychange', syncVisibility);

    const node = ref.current;
    const observer = node && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
      : null;
    if (node && observer) observer.observe(node);
    else setVisible(true);

    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', syncPreference);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  return { ref, reduced, active: visible && tabVisible && !reduced };
}
