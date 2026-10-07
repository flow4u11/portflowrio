import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useIdleMotion } from './useIdleMotion';
import { useMotionSettings } from './MotionSettings';
import './idle-motion.css';

type LoopingMarqueeProps = {
  children: ReactNode;
  label: string;
  className?: string;
  /** Existing chip-list class; applied to each set so direct-child styles work. */
  contentClassName?: string;
  direction?: 'left' | 'right';
  durationSeconds?: number;
};
type MarqueeInteraction = { hovered: boolean; pressed: boolean; keyboard: boolean };
const idleInteraction: MarqueeInteraction = { hovered: false, pressed: false, keyboard: false };

/** Children are presentational chips without IDs or focusable controls. */
export function LoopingMarquee({ children, label, className = '', contentClassName = '', direction = 'left', durationSeconds = 32 }: LoopingMarqueeProps) {
  const { ref, active, reduced } = useIdleMotion<HTMLDivElement>();
  const { settings: { animationSpeed } } = useMotionSettings();
  const original = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [setsPerGroup, setSetsPerGroup] = useState(1);
  const [ready, setReady] = useState(false);
  const [interaction, setInteraction] = useState(idleInteraction);
  const interactionRef = useRef(idleInteraction);
  const keyboardInput = useRef(false);
  const hoverSupported = useRef(false);
  const heldPointer = useRef<number | null>(null);
  const pointerPosition = useRef({ x: NaN, y: NaN, id: -1 });
  const freshPointerMove = useRef<PointerEvent | null>(null);
  const navigatingRef = useRef(false);
  const [navigating, setNavigating] = useState(false);

  const updateInteraction = useCallback((patch: Partial<MarqueeInteraction>) => {
    const current = interactionRef.current;
    const next = { ...current, ...patch };
    if (current.hovered === next.hovered && current.pressed === next.pressed && current.keyboard === next.keyboard) return;
    interactionRef.current = next;
    setInteraction(next);
  }, []);
  const clearPointer = useCallback(() => {
    heldPointer.current = null;
    if (!interactionRef.current.hovered && !interactionRef.current.pressed) return;
    updateInteraction({ hovered: false, pressed: false });
  }, [updateInteraction]);

  useEffect(() => {
    const viewport = ref.current;
    if (!viewport) return;
    const hoverPreference = window.matchMedia('(any-hover: hover)');
    hoverSupported.current = hoverPreference.matches;
    const syncHoverSupport = () => {
      hoverSupported.current = hoverPreference.matches;
      if (!hoverSupported.current) clearPointer();
    };
    const onKeyboardInput = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      keyboardInput.current = true;
      if (viewport.contains(document.activeElement)) updateInteraction({ keyboard: true });
    };
    const onPointerInput = (event: PointerEvent) => {
      pointerPosition.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
      freshPointerMove.current = null;
      keyboardInput.current = false;
      updateInteraction({ keyboard: false });
      if (!(event.target instanceof Node) || !viewport.contains(event.target)) clearPointer();
    };
    const onPointerMovement = (event: PointerEvent) => {
      const previous = pointerPosition.current;
      const moved = previous.id !== event.pointerId || previous.x !== event.clientX || previous.y !== event.clientY || event.movementX !== 0 || event.movementY !== 0;
      freshPointerMove.current = moved ? event : null;
      previous.x = event.clientX;
      previous.y = event.clientY;
      previous.id = event.pointerId;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (heldPointer.current !== event.pointerId) return;
      heldPointer.current = null;
      updateInteraction({ pressed: false });
    };
    const onWindowBlur = () => {
      keyboardInput.current = false;
      heldPointer.current = null;
      updateInteraction(idleInteraction);
    };
    const onNavigationStart = () => {
      navigatingRef.current = true;
      setNavigating(true);
      clearPointer();
    };
    const onNavigationEnd = () => {
      navigatingRef.current = false;
      setNavigating(false);
      clearPointer();
    };

    document.addEventListener('keydown', onKeyboardInput, true);
    document.addEventListener('pointerdown', onPointerInput, true);
    document.addEventListener('pointermove', onPointerMovement, { capture: true, passive: true });
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', clearPointer, true);
    document.addEventListener('visibilitychange', clearPointer);
    // A scroll can move a transformed row away without a reliable pointerleave.
    // The ref guard makes this a single state transition, with no layout reads.
    window.addEventListener('scroll', clearPointer, { capture: true, passive: true });
    window.addEventListener('resize', clearPointer);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('hashchange', clearPointer);
    window.addEventListener('portfolio:navigation-start', onNavigationStart);
    window.addEventListener('portfolio:navigation-end', onNavigationEnd);
    hoverPreference.addEventListener('change', syncHoverSupport);
    return () => {
      document.removeEventListener('keydown', onKeyboardInput, true);
      document.removeEventListener('pointerdown', onPointerInput, true);
      document.removeEventListener('pointermove', onPointerMovement, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', clearPointer, true);
      document.removeEventListener('visibilitychange', clearPointer);
      window.removeEventListener('scroll', clearPointer, true);
      window.removeEventListener('resize', clearPointer);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('hashchange', clearPointer);
      window.removeEventListener('portfolio:navigation-start', onNavigationStart);
      window.removeEventListener('portfolio:navigation-end', onNavigationEnd);
      hoverPreference.removeEventListener('change', syncHoverSupport);
    };
  }, [ref, clearPointer, updateInteraction]);

  useLayoutEffect(() => {
    if (!active) clearPointer();
  }, [active, clearPointer]);

  const speed = Number.isFinite(animationSpeed) ? Math.min(2, Math.max(.5, animationSpeed)) : 1;
  useLayoutEffect(() => {
    if (reduced) return;
    // Changing CSS duration would remap progress and jump. Change the playback
    // rate of the same animation instead, retaining its current time and phase.
    for (const animation of track.current?.getAnimations?.() ?? []) {
      if (typeof animation.updatePlaybackRate === 'function') animation.updatePlaybackRate(speed);
      else animation.playbackRate = speed;
    }
  }, [speed, reduced]);

  useLayoutEffect(() => {
    const viewport = ref.current;
    const set = original.current;
    if (!viewport || !set || reduced) return;
    let disposed = false;
    const fonts = document.fonts;
    let fontsSettled = !fonts || fonts.status === 'loaded';
    let fontTimeout: number | undefined;
    const measure = () => {
      if (disposed) return;
      // Fractional widths include the trailing gap. Ancestor scale affects both
      // rectangles equally, so the number of copies also stays correct during reveals.
      const width = set.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (!width || !viewportWidth) {
        setReady(false);
        return;
      }
      // Each half must fill the viewport, including short technology groups.
      setSetsPerGroup(Math.max(1, Math.ceil(viewportWidth / width)));
      setReady(fontsSettled);
    };
    const finishFonts = () => {
      if (disposed) return;
      fontsSettled = true;
      window.clearTimeout(fontTimeout);
      measure();
    };
    measure();
    if (fonts) {
      // Start from settled text metrics, with a fallback for a stalled font request.
      if (!fontsSettled) fontTimeout = window.setTimeout(finishFonts, 2000);
      void fonts.ready.then(finishFonts, finishFonts);
      fonts.addEventListener('loadingdone', measure);
      fonts.addEventListener('loadingerror', measure);
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(viewport);
    observer?.observe(set);
    if (!observer) window.addEventListener('resize', measure);
    return () => {
      disposed = true;
      window.clearTimeout(fontTimeout);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      fonts?.removeEventListener('loadingdone', measure);
      fonts?.removeEventListener('loadingerror', measure);
    };
  }, [ref, reduced]);

  const copies = reduced ? 0 : setsPerGroup - 1;
  const duration = Number.isFinite(durationSeconds) ? Math.max(8, durationSeconds) : 32;
  const style = { '--marquee-duration': `${duration}s` } as CSSProperties;
  const paused = interaction.hovered || interaction.pressed || interaction.keyboard;

  return <div ref={ref} className={`looping-marquee ${className}`} role="group" aria-label={label} tabIndex={reduced ? undefined : 0}
    data-running={active && ready && !navigating && !paused} data-direction={direction} data-static={reduced}
    data-active={active} data-ready={ready} data-navigating={navigating}
    data-pointer-hover={interaction.hovered} data-pointer-pressed={interaction.pressed} data-keyboard-focus={interaction.keyboard} style={style}
    onPointerMove={event => {
      // Actual movement reacquires hover after a scroll/navigation. A cached
      // :hover or a geometry-only pointerenter cannot hold the row paused.
      if (!active || navigatingRef.current || !hoverSupported.current || event.pointerType === 'touch' || interactionRef.current.hovered || freshPointerMove.current !== event.nativeEvent) return;
      updateInteraction({ hovered: true });
    }}
    onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0 || !active || navigatingRef.current) return;
      heldPointer.current = event.pointerId;
      keyboardInput.current = false;
      updateInteraction({ pressed: true, keyboard: false, hovered: event.pointerType !== 'touch' && hoverSupported.current });
    }}
    onPointerLeave={clearPointer} onPointerCancel={clearPointer} onLostPointerCapture={clearPointer}
    onFocusCapture={() => updateInteraction({ keyboard: keyboardInput.current })}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) updateInteraction({ keyboard: false });
    }}>
    <div ref={track} className="looping-marquee-track">
      <div className="looping-marquee-group">
        <div ref={original} className={`looping-marquee-set ${contentClassName}`}>{children}</div>
        {/* aria-hidden avoids repeated announcements; copies still receive pointer hover/press. */}
        {Array.from({ length: copies }, (_, index) => <div key={index} className={`looping-marquee-set looping-marquee-copy ${contentClassName}`} aria-hidden="true">{children}</div>)}
      </div>
      {!reduced && <div className="looping-marquee-group looping-marquee-clone" aria-hidden="true">
        {Array.from({ length: setsPerGroup }, (_, index) => <div key={index} className={`looping-marquee-set ${contentClassName}`}>{children}</div>)}
      </div>}
    </div>
  </div>;
}
