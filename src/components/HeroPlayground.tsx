import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { useMotionSettings } from './MotionSettings';
import { playgroundAim, playgroundBlast, playgroundHeldPose, playgroundHomeFlight, playgroundShotFlight, scatterPlaygroundPieces, type PlaygroundBounds, type PlaygroundPoint, type PlaygroundPose } from './hero-playground-physics';
import './hero-playground.css';

type Piece = {
  id: string;
  kind: 'letter' | 'part';
  label: string;
  glyph?: string;
  html?: string;
  width: number;
  height: number;
  copyWidth?: number;
  copyHeight?: number;
  home: PlaygroundPoint;
  target: PlaygroundPose;
  pose: PlaygroundPose;
  font?: string;
  letterSpacing?: string;
  source?: HTMLElement;
  animation?: Animation;
  floatAnimation?: Animation;
  returned: boolean;
  busy: boolean;
};
type HiddenSource = { element: HTMLElement; opacity: string; pointerEvents: string; inert: boolean };
type Session = {
  pieces: Piece[];
  bounds: PlaygroundBounds;
  origin: PlaygroundPoint;
  hidden: HiddenSource[];
  observers: MutationObserver[];
  name: HTMLElement;
  focusTarget: HTMLElement;
  focusTabIndex: string | null;
};
type Drag = { id: string; pointer: number; start: PlaygroundPoint; from: PlaygroundPose; current: PlaygroundPoint; startedAt: number; travel: number };
type Phase = 'idle' | 'playing' | 'assembling';

const COPY = {
  en: {
    title: 'Floating pieces', assemble: 'Put it back', returned: 'Back in place.',
    keyboard: 'Use Tab to choose a piece. Enter or Space returns it. Escape puts everything back.',
    letter: 'Letter', returnPiece: 'click to return, or hold and aim toward its home to shoot; Enter returns it',
    profile: 'Profile', role: 'Intro', tags: 'Interests', explore: 'Explore', ready: 'Choose any floating piece.',
  },
  th: {
    title: 'ชิ้นส่วนที่ลอยอยู่', assemble: 'จัดกลับที่เดิม', returned: 'กลับเข้าที่แล้ว',
    keyboard: 'ใช้ Tab เลือกชิ้นส่วน กด Enter หรือ Space เพื่อคืนที่เดิม กด Escape เพื่อคืนทุกอย่าง',
    letter: 'ตัวอักษร', returnPiece: 'คลิกเพื่อคืนที่เดิม หรือกดค้างแล้วเล็งไปที่เดิมเพื่อยิงกลับ กด Enter เพื่อคืนที่เดิม',
    profile: 'โปรไฟล์', role: 'คำแนะนำ', tags: 'ความสนใจ', explore: 'สำรวจ', ready: 'เลือกชิ้นส่วนที่ลอยอยู่ได้เลย',
  },
};
const IDENTITY = 'translate3d(0px, 0px, 0px)';

function poseTransform(piece: Piece, pose: PlaygroundPose) {
  return `translate3d(${pose.x - piece.width / 2}px, ${pose.y - piece.height / 2}px, ${pose.depth || 0}px) rotate(${pose.rotation}deg)`;
}

function snapshotComponent(source: HTMLElement, fallbackLabel: string) {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('style');
  if (source.matches('.hero-role') && !source.querySelector('.typewriter')) clone.textContent = fallbackLabel;
  const originals = source.querySelectorAll('canvas');
  clone.querySelectorAll('canvas').forEach((canvas, index) => {
    try {
      const image = document.createElement('img');
      image.src = originals[index].toDataURL();
      image.alt = '';
      image.className = canvas.className;
      image.style.cssText = canvas.style.cssText;
      canvas.replaceWith(image);
    } catch { canvas.remove(); }
  });
  [clone, ...clone.querySelectorAll<HTMLElement>('*')].forEach(node => {
    node.removeAttribute('id');
    node.removeAttribute('href');
    node.removeAttribute('autofocus');
    node.removeAttribute('aria-describedby');
    node.removeAttribute('aria-labelledby');
    node.setAttribute('tabindex', '-1');
    node.removeAttribute('inert');
  });
  // Keep contained CSS motion (glare, arrow, caret and badge). Canvas is a
  // snapshot because a DOM clone cannot own the original drawing context.
  return clone.outerHTML;
}

/** Finite trajectories stay on the compositor; React tracks only entry/return. */
export function HeroPlayground({ children, enabled = true, language = 'en' }: { children: ReactNode; enabled?: boolean; language?: 'en' | 'th' }) {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const tether = useRef<SVGPathElement>(null);
  const homeTarget = useRef<HTMLDivElement>(null);
  const homeGlyph = useRef<HTMLSpanElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const session = useRef<Session | null>(null);
  const drag = useRef<Drag | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const inactivity = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFocus = useRef<{ element: HTMLElement; tabIndex: string | null } | null>(null);
  const mounted = useRef(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [scene, setScene] = useState<Session | null>(null);
  const [homeIds, setHomeIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const text = COPY[language];
  const copy = useRef(text);
  copy.current = text;

  const clearInactivity = useCallback(() => {
    if (inactivity.current) clearTimeout(inactivity.current);
    inactivity.current = null;
  }, []);

  const hideTether = useCallback(() => {
    tether.current?.setAttribute('d', '');
    if (homeTarget.current) { homeTarget.current.dataset.active = 'false'; homeTarget.current.dataset.locked = 'false'; }
  }, []);
  const drawTether = useCallback((piece: Piece, from: PlaygroundPoint) => {
    const bounds = session.current?.bounds;
    if (!bounds) return;
    // Preview the same gravity/capture trajectory used by the released piece.
    const flight = playgroundShotFlight({ ...piece.pose, ...from }, piece.home, bounds, piece);
    tether.current?.setAttribute('d', flight.frames.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '));
    const held = drag.current;
    if (held && homeTarget.current) homeTarget.current.dataset.locked = String(playgroundAim(held.from, from, piece.home, piece).locked);
  }, []);

  const restoreSource = useCallback((source: HTMLElement) => {
    const saved = session.current?.hidden.find(item => item.element === source);
    if (!saved) return;
    source.style.opacity = saved.opacity;
    source.style.pointerEvents = saved.pointerEvents;
    source.inert = saved.inert;
  }, []);

  const stopAnimation = useCallback((piece: Piece, freeze: boolean) => {
    const node = nodes.current.get(piece.id);
    if (freeze && node) {
      // Only read transforms when a user grabs or returns a piece, never per frame.
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      piece.pose = { x: matrix.m41 + piece.width / 2, y: matrix.m42 + piece.height / 2, depth: matrix.m43, rotation: Math.atan2(matrix.m12, matrix.m11) * 180 / Math.PI };
      node.style.transform = poseTransform(piece, piece.pose);
      const floating = node.querySelector<HTMLElement>('.hero-playground-piece-float');
      if (floating) {
        const transform = getComputedStyle(floating).transform;
        floating.style.animation = 'none';
        floating.style.transform = transform === 'none' ? IDENTITY : transform;
      }
    }
    piece.animation?.cancel();
    piece.animation = undefined;
    piece.floatAnimation?.cancel();
    piece.floatAnimation = undefined;
  }, []);

  const finishSession = useCallback((restoreFocus = false) => {
    const current = session.current;
    if (!current) return;
    clearInactivity();
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
    drag.current = null;
    hideTether();
    current.pieces.forEach(piece => stopAnimation(piece, false));
    current.observers.forEach(observer => observer.disconnect());
    current.hidden.forEach(saved => {
      saved.element.style.opacity = saved.opacity;
      saved.element.style.pointerEvents = saved.pointerEvents;
      saved.element.inert = saved.inert;
    });
    const focusedInside = layer.current?.contains(document.activeElement);
    session.current = null;
    phaseRef.current = 'idle';
    nodes.current.clear();
    if (mounted.current) {
      if (restoreFocus || focusedInside) pendingFocus.current = { element: current.focusTarget, tabIndex: current.focusTabIndex };
      else if (current.focusTabIndex === null) current.focusTarget.removeAttribute('tabindex');
      else current.focusTarget.setAttribute('tabindex', current.focusTabIndex);
      setPhase('idle');
      setScene(null);
      setHomeIds([]);
      setAnnouncement('');
    } else if (current.focusTabIndex === null) {
      current.focusTarget.removeAttribute('tabindex');
    } else {
      current.focusTarget.setAttribute('tabindex', current.focusTabIndex);
    }
  }, [clearInactivity, hideTether, stopAnimation]);

  useLayoutEffect(() => {
    if (phase !== 'idle' || !pendingFocus.current) return;
    const { element: destination, tabIndex } = pendingFocus.current;
    pendingFocus.current = null;
    if (!destination.isConnected) return;
    destination.focus({ preventScroll: true });
    // The heading is a focus destination, without a persistent new tab stop.
    if (tabIndex === null) destination.removeAttribute('tabindex');
    else destination.setAttribute('tabindex', tabIndex);
  }, [phase]);

  const animatePiece = useCallback((piece: Piece, frames: Keyframe[], duration: number, done: () => void, delay = 0) => {
    const node = nodes.current.get(piece.id);
    if (!node) return;
    piece.animation?.cancel();
    const currentSession = session.current;
    const animation = node.animate(frames, { duration: duration / speed.current, delay: delay / speed.current, fill: 'forwards', easing: 'linear' });
    piece.animation = animation;
    animation.onfinish = () => {
      if (session.current !== currentSession || piece.animation !== animation) return;
      done();
      animation.cancel();
      if (piece.animation === animation) piece.animation = undefined;
    };
  }, []);

  const settleFloat = useCallback((piece: Piece, duration: number) => {
    const floating = nodes.current.get(piece.id)?.querySelector<HTMLElement>('.hero-playground-piece-float');
    if (!floating) return;
    const from = floating.style.transform || IDENTITY;
    const animation = floating.animate([{ transform: from }, { transform: IDENTITY }], { duration: duration / speed.current, easing: 'cubic-bezier(.5,0,.5,1)', fill: 'forwards' });
    piece.floatAnimation = animation;
    animation.onfinish = () => {
      if (piece.floatAnimation !== animation) return;
      floating.style.transform = IDENTITY;
      animation.cancel();
      piece.floatAnimation = undefined;
    };
  }, []);

  const assemble = useCallback((immediate = false, restoreFocus = false) => {
    const current = session.current;
    if (!current || phaseRef.current === 'assembling') return;
    clearInactivity();
    if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finishSession(restoreFocus); return; }
    drag.current = null;
    hideTether();
    phaseRef.current = 'assembling';
    setPhase('assembling');
    let longest = 0;
    current.pieces.forEach(piece => {
      const node = nodes.current.get(piece.id);
      if (!node || piece.returned) return;
      stopAnimation(piece, true);
      node.dataset.motion = 'returning';
      const flight = playgroundHomeFlight(piece.pose, piece.home);
      longest = Math.max(longest, flight.duration);
      settleFloat(piece, flight.duration);
      animatePiece(piece, flight.frames.map(frame => ({ transform: poseTransform(piece, frame), offset: frame.offset })), flight.duration, () => {
        piece.pose = flight.end;
        node.style.transform = poseTransform(piece, flight.end);
      });
    });
    exitTimer.current = setTimeout(() => finishSession(restoreFocus), (longest + 35) / speed.current);
  }, [animatePiece, clearInactivity, finishSession, hideTether, settleFloat, stopAnimation]);

  const restTimer = useCallback(() => {
    clearInactivity();
    if (phaseRef.current === 'playing') inactivity.current = setTimeout(() => assemble(), 24000);
  }, [assemble, clearInactivity]);

  const returnPiece = useCallback((piece: Piece, shoot = false) => {
    const current = session.current;
    const node = nodes.current.get(piece.id);
    if (!current || !node || piece.returned || phaseRef.current !== 'playing') return;
    stopAnimation(piece, true);
    piece.busy = true;
    node.dataset.motion = 'returning';
    node.setAttribute('aria-disabled', 'true');
    node.tabIndex = -1;
    const flight = shoot ? playgroundShotFlight(piece.pose, piece.home, current.bounds, piece) : playgroundHomeFlight(piece.pose, piece.home);
    settleFloat(piece, flight.duration);
    animatePiece(piece, flight.frames.map(frame => ({ transform: poseTransform(piece, frame), offset: frame.offset })), flight.duration, () => {
      piece.pose = flight.end;
      piece.returned = true;
      node.style.transform = poseTransform(piece, flight.end);
      node.dataset.motion = 'home';
      if (piece.source) {
        restoreSource(piece.source);
        node.style.visibility = 'hidden';
      }
      setHomeIds(previous => [...previous, piece.id]);
      setAnnouncement(copy.current.returned);
      if (current.pieces.filter(item => item.kind === 'letter').every(item => item.returned)) {
        restoreSource(current.name);
        current.pieces.filter(item => item.kind === 'letter').forEach(item => { const letter = nodes.current.get(item.id); if (letter) letter.style.visibility = 'hidden'; });
      }
      if (document.activeElement === node) {
        const next = current.pieces.find(item => !item.returned && !item.busy);
        (next ? nodes.current.get(next.id) : layer.current?.querySelector<HTMLButtonElement>('.hero-playground-reset'))?.focus({ preventScroll: true });
      }
      if (current.pieces.every(item => item.returned)) {
        clearInactivity();
        inactivity.current = setTimeout(() => finishSession(), 350);
      } else restTimer();
    });
    restTimer();
  }, [animatePiece, clearInactivity, finishSession, restTimer, restoreSource, settleFloat, stopAnimation]);

  const begin = useCallback((origin: PlaygroundPoint) => {
    if (!enabled || session.current || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = host.current?.closest<HTMLElement>('.hero');
    const name = host.current?.querySelector<HTMLElement>('.animated-name');
    const nameText = name && Array.from(name.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (!hero || !name || !nameText?.textContent) return;
    // One instant alignment cancels any in-progress native section scroll.
    const heroTop = hero.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, heroTop), left: window.scrollX, behavior: 'instant' });
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 180 || rect.top > innerHeight - 150) return;
    const bounds = { width: rect.width, height: rect.height, top: 110, bottom: rect.height - 50 };
    const typography = getComputedStyle(name);
    const pieces: Piece[] = [];
    const hidden: HiddenSource[] = [];
    const hide = (element: HTMLElement, inert = true) => {
      hidden.push({ element, opacity: element.style.opacity, pointerEvents: element.style.pointerEvents, inert: element.inert });
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      if (inert) element.inert = true;
    };
    const range = document.createRange();
    Array.from(nameText.textContent).forEach((glyph, index) => {
      if (/\s/.test(glyph)) return;
      range.setStart(nameText, index);
      range.setEnd(nameText, index + 1);
      const letter = range.getBoundingClientRect();
      const home = { x: letter.left - rect.left + letter.width / 2, y: letter.top - rect.top + letter.height / 2 };
      pieces.push({ id: `letter-${index}`, kind: 'letter', glyph, label: glyph, width: Math.max(44, letter.width), height: Math.max(44, letter.height), home, target: { ...home, rotation: 0 }, pose: { ...home, rotation: 0 }, font: typography.font, letterSpacing: typography.letterSpacing, returned: false, busy: false });
    });
    range.detach();
    const selectors = [
      ['.profile-frame', copy.current.profile], ['.hero-role', copy.current.role],
      ['.hero-tags', copy.current.tags], ['.explore-button', copy.current.explore],
    ];
    selectors.forEach(([selector, label], index) => {
      const source = host.current?.querySelector<HTMLElement>(selector);
      if (!source) return;
      const box = source.getBoundingClientRect();
      const home = { x: box.left - rect.left + box.width / 2, y: box.top - rect.top + box.height / 2 };
      pieces.push({ id: `part-${index}`, kind: 'part', label, html: snapshotComponent(source, label), width: Math.max(44, box.width), height: Math.max(44, box.height), copyWidth: box.width, copyHeight: box.height, home, target: { ...home, rotation: 0 }, pose: { ...home, rotation: 0 }, source, returned: false, busy: false });
    });
    const ordered = [...pieces.filter(piece => piece.kind === 'part'), ...pieces.filter(piece => piece.kind === 'letter')];
    const targets = scatterPlaygroundPieces(ordered.map(piece => ({ ...piece.home, width: piece.width, height: piece.height, kind: piece.kind })), origin, bounds);
    ordered.forEach((piece, index) => { piece.target = targets[index]; });
    pieces.filter(piece => piece.source).forEach(piece => hide(piece.source!));
    hide(name, false);
    const focusTarget = name.closest<HTMLElement>('h1') || name;
    const focusTabIndex = focusTarget.getAttribute('tabindex');
    focusTarget.tabIndex = -1;
    const next: Session = { pieces, bounds, origin, hidden, observers: [], name, focusTarget, focusTabIndex };
    pendingFocus.current = null;
    session.current = next;
    phaseRef.current = 'playing';
    setScene(next);
    setHomeIds([]);
    setPhase('playing');
    setAnnouncement(copy.current.ready);
  }, [enabled]);

  useLayoutEffect(() => {
    if (!scene || phase !== 'playing') return;
    scene.pieces.forEach((piece, index) => {
      const node = nodes.current.get(piece.id);
      if (!node || piece.returned) return;
      piece.busy = true;
      node.setAttribute('aria-disabled', 'true');
      node.dataset.motion = 'burst';
      const flight = playgroundBlast(piece.pose, piece.target, scene.origin, scene.bounds, piece, index);
      animatePiece(piece, flight.frames.map(frame => ({ transform: poseTransform(piece, frame), offset: frame.offset })), flight.duration, () => {
        piece.pose = flight.end;
        piece.busy = false;
        node.setAttribute('aria-disabled', 'false');
        node.style.transform = poseTransform(piece, flight.end);
        node.dataset.motion = 'idle';
        const floating = node.querySelector<HTMLElement>('.hero-playground-piece-float');
        if (floating) { floating.style.animation = ''; floating.style.transform = ''; }
      });
      // The original typewriter owns its timer. Mirror its occasional DOM text
      // changes rather than starting another timer or per-frame React loop.
      if (piece.source?.matches('.hero-role')) {
        const original = piece.source.querySelector('.typewriter > [aria-hidden="true"]');
        const clone = node.querySelector('.typewriter > [aria-hidden="true"]');
        if (original && clone) {
          const sync = () => {
            const caret = clone.querySelector('.typewriter-caret');
            const value = Array.from(original.childNodes).filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join('');
            const existing = Array.from(clone.childNodes).find(child => child.nodeType === Node.TEXT_NODE);
            if (existing) existing.textContent = value;
            else clone.insertBefore(document.createTextNode(value), caret);
          };
          const observer = new MutationObserver(sync);
          observer.observe(original, { childList: true, characterData: true, subtree: true });
          scene.observers.push(observer);
        }
      }
    });
    restTimer();
    // Scene identity changes only at entry; returning a piece never replays it.
  }, [scene, animatePiece, restTimer]);

  useEffect(() => {
    mounted.current = true;
    const hero = host.current?.closest('.hero');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopHidden = () => { if (document.hidden) finishSession(); };
    const stopReduced = () => { if (preference.matches) finishSession(); };
    const stopResize = () => finishSession();
    const stopEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && session.current) { event.preventDefault(); assemble(false, true); }
    };
    const observer = hero && typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < .12) finishSession();
    }, { threshold: [0, .12] }) : null;
    if (hero) observer?.observe(hero);
    document.addEventListener('visibilitychange', stopHidden);
    preference.addEventListener('change', stopReduced);
    window.addEventListener('resize', stopResize, { passive: true });
    window.addEventListener('keydown', stopEscape);
    return () => {
      mounted.current = false;
      finishSession();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', stopHidden);
      preference.removeEventListener('change', stopReduced);
      window.removeEventListener('resize', stopResize);
      window.removeEventListener('keydown', stopEscape);
    };
  }, [assemble, finishSession]);

  useEffect(() => { if (!enabled) finishSession(); }, [enabled, finishSession]);

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>, piece: Piece) => {
    if (!session.current || phaseRef.current !== 'playing' || piece.returned || piece.busy || drag.current || event.button !== 0) return;
    event.preventDefault();
    clearInactivity();
    stopAnimation(piece, true);
    const node = event.currentTarget;
    node.focus({ preventScroll: true });
    node.setPointerCapture(event.pointerId);
    node.dataset.motion = 'dragging';
    drag.current = { id: piece.id, pointer: event.pointerId, from: { ...piece.pose }, start: { x: event.clientX, y: event.clientY }, current: piece.pose, startedAt: performance.now(), travel: 0 };
    const target = homeTarget.current;
    if (target) {
      target.style.width = `${piece.width}px`;
      target.style.height = `${piece.height}px`;
      target.style.transform = `translate3d(${piece.home.x - piece.width / 2}px, ${piece.home.y - piece.height / 2}px, 0)`;
      target.dataset.kind = piece.kind;
      target.dataset.active = 'true';
      if (homeGlyph.current) { homeGlyph.current.textContent = piece.glyph || ''; homeGlyph.current.style.font = piece.font || ''; homeGlyph.current.style.letterSpacing = piece.letterSpacing || ''; }
    }
    drawTether(piece, piece.pose);
    inactivity.current = setTimeout(() => assemble(), 24000);
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>, piece: Piece) => {
    const held = drag.current;
    const current = session.current;
    if (!held || !current || held.id !== piece.id || held.pointer !== event.pointerId) return;
    const delta = { x: event.clientX - held.start.x, y: event.clientY - held.start.y };
    held.travel = Math.max(held.travel, Math.hypot(delta.x, delta.y));
    const next = playgroundHeldPose({ ...held.from, x: held.from.x + delta.x, y: held.from.y + delta.y }, piece, current.bounds);
    const { magnet } = playgroundAim(held.from, next, piece.home, piece);
    piece.pose = playgroundHeldPose({ ...next, x: next.x + (piece.home.x - next.x) * magnet, y: next.y + (piece.home.y - next.y) * magnet }, piece, current.bounds);
    held.current = piece.pose;
    event.currentTarget.style.transform = poseTransform(piece, piece.pose);
    drawTether(piece, held.current);
    restTimer();
  };

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>, piece: Piece) => {
    const held = drag.current;
    if (!held || held.id !== piece.id || held.pointer !== event.pointerId) return;
    drag.current = null;
    hideTether();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    returnPiece(piece, event.type === 'pointerup' && (held.travel > 6 || performance.now() - held.startedAt > 180));
  };

  return <div ref={host} className="hero-playground-host" data-play-active={phase !== 'idle'} onDoubleClickCapture={event => {
    const name = (event.target as HTMLElement).closest('.animated-name');
    if (!name || !host.current?.contains(name)) return;
    event.preventDefault();
    const hero = host.current.closest<HTMLElement>('.hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    begin({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }}>
    {children}
    {scene && <div ref={layer} className="hero-playground-layer" data-phase={phase} role="group" aria-label={text.title}>
      <div className="hero-playground-toolbar"><button type="button" className="hero-playground-reset" onClick={() => assemble(false, true)} disabled={phase === 'assembling'}><RotateCcw size={13} aria-hidden="true" />{text.assemble}</button></div>
      <span className="sr-only">{text.keyboard}</span>
      <svg className="hero-playground-tether" viewBox={`0 0 ${scene.bounds.width} ${scene.bounds.height}`} aria-hidden="true"><path ref={tether} d="" /></svg>
      <div ref={homeTarget} className="hero-playground-home-target" data-active="false" data-locked="false" aria-hidden="true"><div className="hero-playground-home-frame"><i /><i /><i /><i /><span ref={homeGlyph} /></div></div>
      {scene.pieces.map((piece, index) => <div key={piece.id} ref={node => { if (node) nodes.current.set(piece.id, node); else nodes.current.delete(piece.id); }} className={`hero-playground-piece hero-playground-piece--${piece.kind}`} role="button" tabIndex={homeIds.includes(piece.id) || phase === 'assembling' ? -1 : 0} aria-hidden={homeIds.includes(piece.id) || undefined} aria-label={`${piece.kind === 'letter' ? `${text.letter} ${piece.glyph}` : piece.label}: ${text.returnPiece}`} style={{ width: piece.width, height: piece.height, transform: poseTransform(piece, piece.pose), '--piece-float-duration': `${6.4 + index % 5}s` } as CSSProperties}
        onPointerDown={event => pointerDown(event, piece)} onPointerMove={event => pointerMove(event, piece)} onPointerUp={event => pointerUp(event, piece)} onPointerCancel={event => pointerUp(event, piece)} onLostPointerCapture={event => pointerUp(event, piece)}
        onClick={event => { if (event.detail === 0 && !piece.busy && !piece.returned) returnPiece(piece); }}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && !piece.busy && !piece.returned && phaseRef.current === 'playing') {
            event.preventDefault();
            const held = drag.current;
            drag.current = null;
            hideTether();
            const heldNode = held && nodes.current.get(held.id);
            if (held && heldNode?.hasPointerCapture(held.pointer)) heldNode.releasePointerCapture(held.pointer);
            const previousPiece = held && held.id !== piece.id && session.current?.pieces.find(item => item.id === held.id);
            if (previousPiece) returnPiece(previousPiece);
            returnPiece(piece);
          }
        }}>
        <div className="hero-playground-piece-float" style={{ animation: 'none', transform: IDENTITY }}>{piece.kind === 'letter' ? <span className="hero-playground-glyph" aria-hidden="true" style={{ font: piece.font, letterSpacing: piece.letterSpacing }}>{piece.glyph}</span> : <div className="hero-playground-copy" style={{ width: piece.copyWidth, height: piece.copyHeight }} inert aria-hidden="true" dangerouslySetInnerHTML={{ __html: piece.html || '' }} />}</div>
      </div>)}
    </div>}
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </div>;
}
