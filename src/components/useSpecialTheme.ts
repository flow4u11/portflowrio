import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useMotionSettings } from './MotionSettings';
import './special-theme.css';

export type ThemeOrigin = { x: number; y: number };
export type SpecialDesign = 'neobrutalism' | 'halloween';
type Design = 'default' | SpecialDesign;
export type SpecialThemeController = {
  design: Design;
  specialTheme: boolean;
  transitioning: boolean;
  activateSpecial: (origin?: ThemeOrigin, design?: SpecialDesign) => void;
  exitSpecial: (origin?: ThemeOrigin) => void;
};

const STORAGE_KEY = 'portfolio-design';
const validDesign = (value: string | null | undefined): Design => value === 'neobrutalism' || value === 'halloween' ? value : 'default';

function readDesign() {
  try { return validDesign(localStorage.getItem(STORAGE_KEY)); }
  catch { return validDesign(document.documentElement.dataset.design); }
}

function applyDesign(special: Design) {
  if (special !== 'default') document.documentElement.dataset.design = special;
  else delete document.documentElement.dataset.design;
}

/** Design is independent of the ordinary Light/Dark preference and iris control. */
export function useSpecialTheme(): SpecialThemeController {
  const { settings } = useMotionSettings();
  const speedRef = useRef(settings.animationSpeed);
  speedRef.current = settings.animationSpeed;
  const [design, setDesign] = useState(readDesign);
  const [transitioning, setTransitioning] = useState(false);
  const currentRef = useRef(design);
  const changingRef = useRef(false);
  const mountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    mountedRef.current = true;
    applyDesign(currentRef.current);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      cleanupRef.current?.();
      const next = event.key === null ? 'default' : validDesign(event.newValue);
      currentRef.current = next;
      applyDesign(next);
      setDesign(next);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      mountedRef.current = false;
      cleanupRef.current?.();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const changeDesign = useCallback((next: Design, origin?: ThemeOrigin) => {
    if (!mountedRef.current || changingRef.current || currentRef.current === next) return;
    changingRef.current = true;
    const speed = speedRef.current;
    let applied = false;
    let cancelled = false;
    let curtain: HTMLDivElement | undefined;
    const halloween = next === 'halloween' || currentRef.current === 'halloween';
    const animations = new Set<Animation>();
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const commit = () => {
      if (applied || !mountedRef.current) return;
      applied = true;
      currentRef.current = next;
      applyDesign(next);
      try { localStorage.setItem(STORAGE_KEY, next); }
      catch { /* The selected design still works when storage is unavailable. */ }
      flushSync(() => setDesign(next));
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
        if (halloween) curtain.dataset.palette = 'halloween';
        curtain.setAttribute('aria-hidden', 'true');
        const startRight = (origin?.x ?? window.innerWidth / 2) > window.innerWidth / 2;
        const panels = (halloween ? ['B', 'O', 'O'] : ['N', 'E', 'O']).map((letter, index) => {
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

  const activateSpecial = useCallback((origin?: ThemeOrigin, next: SpecialDesign = 'neobrutalism') => changeDesign(next, origin), [changeDesign]);
  const exitSpecial = useCallback((origin?: ThemeOrigin) => changeDesign('default', origin), [changeDesign]);
  return { design, specialTheme: design !== 'default', transitioning, activateSpecial, exitSpecial };
}
