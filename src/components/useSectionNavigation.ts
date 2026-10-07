import { useEffect, useRef, useState } from 'react';

type Destination = { id: string; label: string; keyboard?: boolean };

/** Native smooth scrolling owns the frames; React changes only at start/end. */
export function useSectionNavigation({ reduced }: { reduced: boolean }) {
  const [navigating, setNavigating] = useState(false);
  const cancelRef = useRef<((updateState?: boolean) => void) | null>(null);

  useEffect(() => () => cancelRef.current?.(false), []);

  const navigate = (next: Destination) => {
    const target = document.getElementById(next.id);
    if (!target) return;
    cancelRef.current?.();
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 80;
    const requestedTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    const top = Math.max(0, Math.min(requestedTop, document.documentElement.scrollHeight - window.innerHeight));
    const complete = () => {
      if (window.location.hash !== `#${next.id}`) history.pushState(null, '', `#${next.id}`);
      if (next.keyboard) {
        const heading = target.querySelector<HTMLElement>('h1, h2');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
          heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
        }
      }
    };

    if (reduced || Math.abs(window.scrollY - top) < 1) {
      window.scrollTo({ top, behavior: 'instant' });
      complete();
      return;
    }

    let finished = false;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const finish = (arrived: boolean, updateState = true) => {
      if (finished) return;
      finished = true;
      clearTimeout(quietTimer);
      clearTimeout(fallback);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onEnd);
      window.removeEventListener('wheel', onUserInput);
      window.removeEventListener('touchstart', onUserInput);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onUserInput);
      document.removeEventListener('visibilitychange', onHidden);
      cancelRef.current = null;
      delete document.documentElement.dataset.navigating;
      window.dispatchEvent(new CustomEvent('portfolio:navigation-end'));
      if (updateState) setNavigating(false);
      if (arrived) complete();
    };
    const interrupt = (updateState = true) => {
      // Cancel the browser's remaining scroll without snapping to the target.
      window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' });
      finish(false, updateState);
    };
    const onEnd = () => finish(Math.abs(window.scrollY - top) <= 3);
    const onScroll = () => {
      clearTimeout(quietTimer);
      // Fallback for browsers without scrollend; no layout reads per scroll.
      quietTimer = setTimeout(onEnd, 140);
    };
    const onKey = (event: KeyboardEvent) => {
      if (['Escape', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
    };
    const onHidden = () => { if (document.hidden) interrupt(); };
    const onUserInput = () => interrupt();

    // Keep marquee hover state fresh across travel, without a curtain overlay.
    document.documentElement.dataset.navigating = 'true';
    window.dispatchEvent(new CustomEvent('portfolio:navigation-start'));
    setNavigating(true);
    cancelRef.current = interrupt;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', onEnd);
    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('touchstart', onUserInput, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onUserInput);
    document.addEventListener('visibilitychange', onHidden);
    fallback = setTimeout(onEnd, 2500);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return { navigate, navigating };
}
