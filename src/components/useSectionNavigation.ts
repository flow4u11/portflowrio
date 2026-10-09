import { useEffect, useRef, useState } from 'react';

type Destination = { id: string; label: string; keyboard?: boolean };

/** A finite eased journey; React changes only at start/end, never each frame. */
export function useSectionNavigation({ reduced, speed = 1 }: { reduced: boolean; speed?: number }) {
  const [navigating, setNavigating] = useState(false);
  const cancelRef = useRef<((updateState?: boolean) => void) | null>(null);

  useEffect(() => () => cancelRef.current?.(false), []);

  const navigate = (next: Destination) => {
    const target = document.getElementById(next.id);
    if (!target) return;
    cancelRef.current?.();
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 80;
    const requestedTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;
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
    let frame = 0;
    const start = window.scrollY;
    const distance = top - start;
    const duration = Math.min(2600, Math.max(650, (620 + 560 * Math.sqrt(Math.abs(distance) / Math.max(320, innerHeight))) / Math.max(.5, Math.min(2, speed))));
    const began = performance.now();
    const finish = (arrived: boolean, updateState = true) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', onUserInput);
      window.removeEventListener('touchstart', onUserInput);
      window.removeEventListener('pointerdown', onUserInput);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onUserInput);
      document.removeEventListener('visibilitychange', onHidden);
      cancelRef.current = null;
      delete document.documentElement.dataset.navigating;
      delete document.documentElement.dataset.navWarp;
      delete document.documentElement.dataset.navDirection;
      document.documentElement.style.removeProperty('--nav-travel-duration');
      window.dispatchEvent(new CustomEvent('portfolio:navigation-end'));
      if (updateState) setNavigating(false);
      if (arrived) complete();
    };
    const interrupt = (updateState = true) => {
      finish(false, updateState);
    };
    const travel = (now: number) => {
      if (finished) return;
      const progress = Math.min(1, Math.max(0, (now - began) / duration));
      // Slow anticipation and arrival surround a short burst of travel.
      const eased = progress < .5 ? 16 * progress ** 5 : 1 - (-2 * progress + 2) ** 5 / 2;
      window.scrollTo({ top: start + distance * eased, behavior: 'instant' });
      if (progress < 1) frame = requestAnimationFrame(travel);
      else finish(true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
    };
    const onHidden = () => { if (document.hidden) interrupt(); };
    const onUserInput = () => interrupt();

    // Keep marquee hover state fresh across travel, without a curtain overlay.
    document.documentElement.dataset.navigating = 'true';
    if (Math.abs(distance) > 180) document.documentElement.dataset.navWarp = 'true';
    document.documentElement.dataset.navDirection = distance > 0 ? 'down' : 'up';
    document.documentElement.style.setProperty('--nav-travel-duration', `${duration}ms`);
    window.dispatchEvent(new CustomEvent('portfolio:navigation-start', { detail: { duration, direction: distance > 0 ? 1 : -1, warp: Math.abs(distance) > 180 } }));
    setNavigating(true);
    cancelRef.current = interrupt;
    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('touchstart', onUserInput, { passive: true });
    window.addEventListener('pointerdown', onUserInput, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onUserInput);
    document.addEventListener('visibilitychange', onHidden);
    // Stop any native scroll already in flight, then own only this short trip.
    window.scrollTo({ top: start, behavior: 'instant' });
    frame = requestAnimationFrame(travel);
  };

  return { navigate, navigating };
}
