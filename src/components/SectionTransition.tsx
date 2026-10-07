import { useEffect, useRef, useState } from 'react';
import './section-transition.css';

type Destination = { id: string; label: string; keyboard?: boolean };

/** Three short compositor animations cover the section change; no scroll loop. */
export function useSectionTransition({ reduced, speed }: { reduced: boolean; speed: number }) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const arrive = (next: Destination) => {
    const target = document.getElementById(next.id);
    if (!target) return;
    const header = document.querySelector('.site-header');
    const top = target.getBoundingClientRect().top + window.scrollY - (header?.getBoundingClientRect().height ?? 80) - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
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

  const navigate = (next: Destination) => {
    if (busyRef.current || !document.getElementById(next.id)) return;
    if (reduced) { arrive(next); return; }
    busyRef.current = true;
    document.documentElement.dataset.navigating = 'true';
    window.dispatchEvent(new CustomEvent('portfolio:navigation-start'));
    setDestination(next);
  };

  useEffect(() => {
    if (!destination || !stageRef.current) return;
    const panels = Array.from(stageRef.current.querySelectorAll<HTMLElement>('.section-curtain-panel'));
    let cancelled = false;
    let finished = false;
    let committed = false;
    let hold: ReturnType<typeof setTimeout> | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    let animations: Animation[] = [];
    const multiplier = Math.min(2, Math.max(.5, speed));
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelled = true;
      if (hold) clearTimeout(hold);
      if (fallback) clearTimeout(fallback);
      animations.forEach(animation => animation.cancel());
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHidden);
      delete document.documentElement.dataset.navigating;
      window.dispatchEvent(new CustomEvent('portfolio:navigation-end'));
      busyRef.current = false;
      setDestination(null);
    };
    const interrupt = () => finish();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); };
    const onHidden = () => { if (document.hidden) finish(); };
    fallback = setTimeout(() => {
      if (!committed) arrive(destination);
      finish();
    }, 1700 / multiplier);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHidden);

    if (typeof panels[0]?.animate !== 'function') {
      arrive(destination);
      finish();
    } else {
      animations = panels.map((panel, index) => panel.animate(
        [{ transform: `translateY(${index % 2 ? '-105%' : '105%'})` }, { transform: 'translateY(0)' }],
        { duration: 360 / multiplier, delay: (60 + index * 55) / multiplier, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' },
      ));
      void Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (cancelled) return;
        arrive(destination);
        committed = true;
        hold = setTimeout(() => {
          if (cancelled) return;
          animations.forEach(animation => animation.cancel());
          animations = panels.map((panel, index) => panel.animate(
            [{ transform: 'translateY(0)' }, { transform: `translateY(${index % 2 ? '105%' : '-105%'})` }],
            { duration: 460 / multiplier, delay: (2 - index) * 45 / multiplier, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' },
          ));
          void Promise.all(animations.map(animation => animation.finished)).then(finish, () => {});
        }, 90 / multiplier);
      }, () => {});
    }
    return () => {
      clearTimeout(fallback);
      finish();
    };
    // A transition captures its speed on entry; changing preferences affects the next one.
  }, [destination]);

  return {
    navigating: destination !== null,
    navigate,
    curtain: destination ? <div ref={stageRef} className="section-curtain" aria-hidden="true" data-destination={destination.id}>
      {[0, 1, 2].map(index => <div className="section-curtain-panel" key={index} data-panel={index}>
        {index === 1 && <span>{destination.label}<i>.</i></span>}
      </div>)}
    </div> : null,
  };
}
