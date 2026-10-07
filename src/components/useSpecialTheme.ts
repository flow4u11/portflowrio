import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useMotionSettings } from './MotionSettings';
import './special-theme.css';

export type ThemeOrigin = { x: number; y: number };
export type SpecialThemeController = {
  specialTheme: boolean;
  transitioning: boolean;
  activateSpecial: (origin?: ThemeOrigin) => void;
  exitSpecial: (origin?: ThemeOrigin) => void;
};

const STORAGE_KEY = 'portfolio-design';
const SPECIAL_DESIGN = 'neobrutalism';

function readDesign() {
  try { return localStorage.getItem(STORAGE_KEY) === SPECIAL_DESIGN; }
  catch { return document.documentElement.dataset.design === SPECIAL_DESIGN; }
}

function applyDesign(special: boolean) {
  if (special) document.documentElement.dataset.design = SPECIAL_DESIGN;
  else delete document.documentElement.dataset.design;
}

/** Design is independent of the ordinary Light/Dark preference and iris control. */
export function useSpecialTheme(): SpecialThemeController {
  const { settings } = useMotionSettings();
  const speedRef = useRef(settings.animationSpeed);
  speedRef.current = settings.animationSpeed;
  const [specialTheme, setSpecialTheme] = useState(readDesign);
  const [transitioning, setTransitioning] = useState(false);
  const currentRef = useRef(specialTheme);
  const changingRef = useRef(false);
  const mountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    mountedRef.current = true;
    applyDesign(currentRef.current);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      cleanupRef.current?.();
      const next = event.key === null ? false : event.newValue === SPECIAL_DESIGN;
      currentRef.current = next;
      applyDesign(next);
      setSpecialTheme(next);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      mountedRef.current = false;
      cleanupRef.current?.();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const changeDesign = useCallback((next: boolean, origin?: ThemeOrigin) => {
    if (!mountedRef.current || changingRef.current || currentRef.current === next) return;
    changingRef.current = true;
    const speed = speedRef.current;
    let applied = false;
    let cancelled = false;
    let curtain: HTMLDivElement | undefined;
    const animations = new Set<Animation>();
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const commit = () => {
      if (applied || !mountedRef.current) return;
      applied = true;
      currentRef.current = next;
      applyDesign(next);
      try { localStorage.setItem(STORAGE_KEY, next ? SPECIAL_DESIGN : 'default'); }
      catch { /* The selected design still works when storage is unavailable. */ }
      flushSync(() => setSpecialTheme(next));
    };
    const cleanup = () => {
      cancelled = true;
      animations.forEach(animation => animation.cancel());
      animations.clear();
      curtain?.remove();
      document.removeEventListener('visibilitychange', onVisibility);
      motionPreference.removeEventListener('change', onMotionPreference);
      changingRef.current = false;
      cleanupRef.current = null;
      if (mountedRef.current) setTransitioning(false);
    };
    const onVisibility = () => {
      if (!document.hidden) return;
      commit();
      cleanup();
    };
    const onMotionPreference = () => {
      if (!motionPreference.matches) return;
      commit();
      cleanup();
    };
    cleanupRef.current = cleanup;
    if (document.hidden || motionPreference.matches || !Element.prototype.animate) {
      commit();
      cleanup();
      return;
    }
    setTransitioning(true);
    document.addEventListener('visibilitychange', onVisibility);
    motionPreference.addEventListener('change', onMotionPreference);

    const run = async () => {
      try {
        curtain = document.createElement('div');
        curtain.className = 'special-design-curtain';
        curtain.setAttribute('aria-hidden', 'true');
        const startRight = (origin?.x ?? window.innerWidth / 2) > window.innerWidth / 2;
        const panels = ['N', 'E', 'O'].map((letter, index) => {
          const panel = document.createElement('div');
          panel.className = 'special-design-curtain-card';
          panel.dataset.card = String(index);
          const title = document.createElement('span');
          title.textContent = letter;
          panel.append(title);
          curtain?.append(panel);
          return panel;
        });
        document.body.append(curtain);
        const animate = async (panel: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) => {
          const animation = panel.animate(frames, options);
          animations.add(animation);
          try { await animation.finished; }
          finally { animations.delete(animation); }
        };
        await Promise.all(panels.map((panel, index) => animate(panel, [
          { transform: `translateY(${index % 2 ? '-105%' : '105%'})`, opacity: 1 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 280 / speed, delay: (startRight ? 2 - index : index) * 35 / speed, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })));
        if (cancelled) return;
        commit();
        await Promise.all(panels.map((panel, index) => animate(panel, [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(${index % 2 ? '108%' : '-108%'})`, opacity: 0.92 },
        ], { duration: 350 / speed, delay: (startRight ? index : 2 - index) * 30 / speed, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })));
      } catch {
        if (!cancelled) commit();
      } finally {
        if (!cancelled) cleanup();
      }
    };
    void run();
  }, []);

  const activateSpecial = useCallback((origin?: ThemeOrigin) => changeDesign(true, origin), [changeDesign]);
  const exitSpecial = useCallback((origin?: ThemeOrigin) => changeDesign(false, origin), [changeDesign]);
  return { specialTheme, transitioning, activateSpecial, exitSpecial };
}
