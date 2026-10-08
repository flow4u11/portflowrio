import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { useMotionSettings } from './MotionSettings';
import { assistedVelocity, clampPlayground, nearPlaygroundHome, playgroundFlight, pulledVelocity, scatterPlaygroundPieces, type PlaygroundBounds, type PlaygroundFlight, type PlaygroundHoop, type PlaygroundPoint, type PlaygroundVelocity } from './hero-playground-physics';
import './hero-playground.css';

type Pose = PlaygroundPoint & { rotation: number };
type Piece = {
  id: string;
  kind: 'letter' | 'part';
  label: string;
  glyph?: string;
  html?: string;
  width: number;
  height: number;
  home: PlaygroundPoint;
  homeWidth: number;
  homeHeight: number;
  target: PlaygroundPoint;
  pose: Pose;
  font?: string;
  letterSpacing?: string;
  source?: HTMLElement;
  animation?: Animation;
  returned: boolean;
  busy: boolean;
};
type HiddenSource = { element: HTMLElement; opacity: string; pointerEvents: string; inert: boolean };
type Session = {
  pieces: Piece[];
  bounds: PlaygroundBounds;
  stageRect: { left: number; top: number };
  hoop: PlaygroundHoop;
  origin: PlaygroundPoint;
  hidden: HiddenSource[];
  name: HTMLElement;
  opener: HTMLElement | null;
};
type Drag = { id: string; pointer: number; start: PlaygroundPoint; from: PlaygroundPoint; current: PlaygroundPoint; base: PlaygroundVelocity; pull: PlaygroundPoint; moved: boolean };
type Phase = 'idle' | 'playing' | 'assembling';

const COPY = {
  en: {
    play: 'Play with my name', hint: 'Double-click my name', title: 'A little court in space',
    help: 'Pull a letter back to aim, then release. Tap for an assisted shot.',
    parts: 'Drag the other pieces to their outlines. Everything returns after a little rest.',
    assemble: 'Put it back', score: 'Letters home', scored: 'Nice shot! A letter is back home.', missed: 'Almost. Try the arc again.',
    partHome: 'Back in place.', keyboard: 'Use Tab to choose a piece. Enter shoots a letter or returns a piece. Escape puts everything back.',
    letter: 'Letter', shoot: 'drag to aim, or press Enter for an assisted shot', returnPart: 'drag to its outline, or press Enter to return',
    profile: 'Profile', role: 'Intro', tags: 'Interests', explore: 'Explore', ready: 'Court ready. Choose any letter.',
  },
  th: {
    play: 'เล่นกับชื่อของฉัน', hint: 'ดับเบิลคลิกที่ชื่อ', title: 'สนามเล็ก ๆ ในอวกาศ',
    help: 'ลากตัวอักษรย้อนกลับเพื่อเล็ง แล้วปล่อย แตะเพื่อช่วยเล็งชู้ต',
    parts: 'ลากส่วนอื่นกลับไปที่เส้นประ ทุกอย่างจะกลับเองเมื่อพักสักครู่',
    assemble: 'จัดกลับที่เดิม', score: 'ตัวอักษรกลับบ้าน', scored: 'ลงห่วง! ตัวอักษรกลับที่เดิมแล้ว', missed: 'เกือบแล้ว ลองเล็งใหม่อีกครั้ง',
    partHome: 'กลับเข้าที่แล้ว', keyboard: 'ใช้ Tab เลือกส่วนต่าง ๆ กด Enter เพื่อชู้ตหรือจัดกลับ กด Escape เพื่อคืนทุกอย่าง',
    letter: 'ตัวอักษร', shoot: 'ลากเพื่อเล็ง หรือกด Enter เพื่อช่วยเล็งชู้ต', returnPart: 'ลากไปที่เส้นประ หรือกด Enter เพื่อคืนที่เดิม',
    profile: 'โปรไฟล์', role: 'คำแนะนำ', tags: 'ความสนใจ', explore: 'สำรวจ', ready: 'สนามพร้อมแล้ว เลือกตัวอักษรได้เลย',
  },
};

function poseTransform(piece: Piece, pose: Pose, depth = 0) {
  return `translate3d(${pose.x - piece.width / 2}px, ${pose.y - piece.height / 2}px, ${depth}px) rotate(${pose.rotation}deg)`;
}

function snapshotComponent(source: HTMLElement, fallbackLabel: string) {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('style');
  const currentRole = source.querySelector('.typewriter > [aria-hidden="true"]')?.textContent?.replace('|', '').trim();
  if (source.matches('.hero-role') && !currentRole) clone.textContent = fallbackLabel;
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
    node.removeAttribute('data-running');
    node.setAttribute('tabindex', '-1');
    node.removeAttribute('inert');
  });
  return clone.outerHTML;
}

/** Transforms live in the DOM; React only tracks entry, scoring and exit. */
export function HeroPlayground({ children, enabled = true, language = 'en' }: { children: ReactNode; enabled?: boolean; language?: 'en' | 'th' }) {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const host = useRef<HTMLDivElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const trajectory = useRef<SVGPathElement>(null);
  const landingMarker = useRef<SVGCircleElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const ghosts = useRef(new Map<string, HTMLDivElement>());
  const session = useRef<Session | null>(null);
  const drag = useRef<Drag | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const inactivity = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effects = useRef<Animation[]>([]);
  const pendingFocus = useRef<HTMLElement | null>(null);
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

  const hideAim = useCallback(() => {
    trajectory.current?.setAttribute('d', '');
    landingMarker.current?.setAttribute('opacity', '0');
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
    if (freeze && node && piece.animation) {
      // One compositor-transform read on grabbing or exit, never a frame loop.
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      piece.pose = { x: matrix.m41 + piece.width / 2, y: matrix.m42 + piece.height / 2, rotation: Math.atan2(matrix.m12, matrix.m11) * 180 / Math.PI };
      node.style.transform = poseTransform(piece, piece.pose);
    }
    piece.animation?.cancel();
    piece.animation = undefined;
  }, []);

  const finishSession = useCallback((restoreFocus = false) => {
    const current = session.current;
    if (!current) return;
    clearInactivity();
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
    drag.current = null;
    hideAim();
    current.pieces.forEach(piece => stopAnimation(piece, false));
    effects.current.forEach(animation => animation.cancel());
    effects.current = [];
    current.hidden.forEach(saved => {
      saved.element.style.opacity = saved.opacity;
      saved.element.style.pointerEvents = saved.pointerEvents;
      saved.element.inert = saved.inert;
    });
    const focusedInside = layer.current?.contains(document.activeElement);
    session.current = null;
    phaseRef.current = 'idle';
    nodes.current.clear();
    ghosts.current.clear();
    if (mounted.current) {
      if (restoreFocus || focusedInside) pendingFocus.current = current.opener?.isConnected ? current.opener : startButton.current;
      setPhase('idle');
      setScene(null);
      setHomeIds([]);
      setAnnouncement('');
    }
  }, [clearInactivity, hideAim, stopAnimation]);

  useLayoutEffect(() => {
    if (phase !== 'idle' || !pendingFocus.current) return;
    const destination = pendingFocus.current;
    pendingFocus.current = null;
    destination.focus({ preventScroll: true });
  }, [phase]);

  const assemble = useCallback((immediate = false, restoreFocus = false) => {
    const current = session.current;
    if (!current || phaseRef.current === 'assembling') return;
    clearInactivity();
    if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finishSession(restoreFocus); return; }
    drag.current = null;
    hideAim();
    phaseRef.current = 'assembling';
    setPhase('assembling');
    current.pieces.forEach((piece, index) => {
      const node = nodes.current.get(piece.id);
      if (!node || piece.returned) return;
      stopAnimation(piece, true);
      node.dataset.motion = 'returning';
      const home = { ...piece.home, rotation: 0 };
      piece.animation = node.animate([
        { transform: poseTransform(piece, piece.pose), opacity: 1 },
        { transform: poseTransform(piece, home), opacity: 1 },
      ], { duration: 620 / speed.current, delay: index * 7 / speed.current, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    });
    exitTimer.current = setTimeout(() => finishSession(restoreFocus), (650 + current.pieces.length * 7) / speed.current);
  }, [clearInactivity, finishSession, hideAim, stopAnimation]);

  const restTimer = useCallback(() => {
    clearInactivity();
    if (phaseRef.current === 'playing') inactivity.current = setTimeout(() => assemble(), 24000);
  }, [assemble, clearInactivity]);

  const animatePiece = useCallback((piece: Piece, frames: Keyframe[], duration: number, done: () => void, delay = 0) => {
    const node = nodes.current.get(piece.id);
    if (!node) return;
    piece.animation?.cancel();
    const currentSession = session.current;
    const animation = node.animate(frames, { duration: duration / speed.current, delay: delay / speed.current, fill: 'forwards', easing: 'linear' });
    piece.animation = animation;
    animation.onfinish = () => {
      if (session.current !== currentSession || phaseRef.current !== 'playing' || piece.animation !== animation) return;
      done();
      animation.cancel();
      if (piece.animation === animation) piece.animation = undefined;
    };
  }, []);

  const returnPiece = useCallback((piece: Piece, scored = false) => {
    const current = session.current;
    const node = nodes.current.get(piece.id);
    if (!current || !node || piece.returned) return;
    piece.busy = true;
    node.dataset.motion = 'returning';
    node.setAttribute('aria-disabled', 'true');
    node.tabIndex = -1;
    stopAnimation(piece, true);
    const home = { ...piece.home, rotation: 0 };
    animatePiece(piece, [
      { transform: poseTransform(piece, piece.pose), opacity: 1, offset: 0 },
      { transform: poseTransform(piece, { x: (piece.pose.x + home.x) / 2, y: Math.min(piece.pose.y, home.y) - 35, rotation: 0 }, 30), opacity: 1, offset: .42 },
      { transform: poseTransform(piece, home), opacity: 1, offset: 1 },
    ], scored ? 510 : 380, () => {
      piece.pose = home;
      piece.returned = true;
      node.style.visibility = 'hidden';
      const ghost = ghosts.current.get(piece.id);
      if (ghost) {
        ghost.dataset.near = 'false';
        const animation = ghost.animate([{ opacity: .3, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1.15)', offset: .45 }, { opacity: 1, transform: 'scale(1)' }], { duration: 430 / speed.current, easing: 'ease-out' });
        effects.current.push(animation);
      }
      if (piece.source) restoreSource(piece.source);
      setHomeIds(previous => [...previous, piece.id]);
      setAnnouncement(scored ? copy.current.scored : copy.current.partHome);
      const allLettersHome = current.pieces.filter(item => item.kind === 'letter').every(item => item.returned);
      if (allLettersHome) restoreSource(current.name);
      if (document.activeElement === node) {
        const next = current.pieces.find(item => !item.returned && !item.busy);
        (next ? nodes.current.get(next.id) : layer.current?.querySelector<HTMLButtonElement>('.hero-playground-reset'))?.focus({ preventScroll: true });
      }
      if (current.pieces.every(item => item.returned)) {
        clearInactivity();
        inactivity.current = setTimeout(() => assemble(), 650);
      } else restTimer();
    });
  }, [animatePiece, assemble, clearInactivity, restTimer, restoreSource, stopAnimation]);

  const flightFor = useCallback((piece: Piece, from: PlaygroundPoint, velocity: PlaygroundVelocity) => {
    const current = session.current;
    return current ? playgroundFlight(from, velocity, current.hoop, current.bounds, Math.min(piece.homeWidth * .4, 12)) : null;
  }, []);

  const drawAim = useCallback((flight: PlaygroundFlight | null) => {
    if (!flight) return;
    const visible = flight.frames.filter((_, index) => index % 2 === 0);
    trajectory.current?.setAttribute('d', visible.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '));
    trajectory.current?.setAttribute('data-score', String(flight.scored));
    if (flight.crossing && landingMarker.current) {
      landingMarker.current.setAttribute('cx', String(flight.crossing.x));
      landingMarker.current.setAttribute('cy', String(flight.crossing.y));
      landingMarker.current.setAttribute('opacity', '1');
      landingMarker.current.setAttribute('data-score', String(flight.scored));
    } else landingMarker.current?.setAttribute('opacity', '0');
  }, []);

  const shoot = useCallback((piece: Piece, from: PlaygroundPoint, velocity: PlaygroundVelocity) => {
    const current = session.current;
    const node = nodes.current.get(piece.id);
    const flight = flightFor(piece, from, velocity);
    if (!current || !node || !flight || piece.returned || piece.busy) return;
    piece.busy = true;
    stopAnimation(piece, false);
    node.dataset.motion = 'flying';
    node.setAttribute('aria-disabled', 'true');
    hideAim();
    restTimer();
    animatePiece(piece, flight.frames.map(frame => ({
      transform: poseTransform(piece, { ...frame, rotation: frame.rotation * .45 }),
      offset: frame.offset,
    })), flight.duration, () => {
      piece.pose = { ...flight.end, rotation: 0 };
      node.style.transform = poseTransform(piece, piece.pose);
      piece.busy = false;
      if (flight.scored) {
        const hoop = layer.current?.querySelector<SVGSVGElement>('.hero-playground-hoop');
        if (hoop) effects.current.push(hoop.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(6px)', offset: .3 }, { transform: 'translateY(0)' }], { duration: 320 / speed.current, easing: 'ease-out' }));
        returnPiece(piece, true);
      } else {
        node.dataset.motion = 'idle';
        node.setAttribute('aria-disabled', 'false');
        setAnnouncement(copy.current.missed);
      }
    });
  }, [animatePiece, flightFor, hideAim, restTimer, returnPiece, stopAnimation]);

  const begin = useCallback((origin?: PlaygroundPoint) => {
    if (!enabled || session.current || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = host.current?.closest<HTMLElement>('.hero');
    const name = host.current?.querySelector<HTMLElement>('.animated-name');
    const nameText = name && Array.from(name.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (!hero || !name || !nameText?.textContent) return;
    // Focusing the low Play control can scroll a mobile page before its click.
    // This single instant scroll also cancels native smooth-scroll momentum.
    const heroTop = hero.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, heroTop), left: window.scrollX, behavior: 'instant' });
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 180 || rect.top > innerHeight - 150) return;
    const bounds = { width: rect.width, height: rect.height, top: 120, bottom: rect.height - 88 };
    const hoop = { x: rect.width / 2, y: Math.min(rect.height * .48, rect.height - 240), halfWidth: 41 };
    const nameRect = name.getBoundingClientRect();
    const click = origin || { x: nameRect.left - rect.left + nameRect.width / 2, y: nameRect.top - rect.top + nameRect.height / 2 };
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
      pieces.push({ id: `letter-${index}`, kind: 'letter', glyph, label: glyph, width: Math.max(44, letter.width), height: Math.max(44, letter.height), home, homeWidth: letter.width, homeHeight: letter.height, target: home, pose: { ...home, rotation: 0 }, font: typography.font, letterSpacing: typography.letterSpacing, returned: false, busy: false });
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
      pieces.push({ id: `part-${index}`, kind: 'part', label, html: snapshotComponent(source, label), width: Math.max(44, box.width), height: Math.max(44, box.height), home, homeWidth: box.width, homeHeight: box.height, target: home, pose: { ...home, rotation: 0 }, source, returned: false, busy: false });
    });
    // Place larger pieces first so letters find the remaining gaps.
    const ordered = [...pieces.filter(piece => piece.kind === 'part'), ...pieces.filter(piece => piece.kind === 'letter')];
    const targets = scatterPlaygroundPieces(ordered.map(piece => ({ ...piece.home, width: piece.width, height: piece.height, kind: piece.kind })), click, bounds, hoop);
    ordered.forEach((piece, index) => { piece.target = targets[index]; });
    pieces.filter(piece => piece.source).forEach(piece => hide(piece.source!));
    hide(name, false);
    const next: Session = { pieces, bounds, stageRect: { left: rect.left, top: rect.top }, hoop, origin: click, hidden, name, opener: document.activeElement === startButton.current ? startButton.current : null };
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
      const rotation = ((index * 37) % 31) - 15;
      const target = { ...piece.target, rotation };
      const overshoot = { x: target.x + (target.x - piece.home.x) * .06, y: target.y + (target.y - piece.home.y) * .06, rotation: rotation * 1.2 };
      piece.busy = true;
      node.setAttribute('aria-disabled', 'true');
      node.dataset.motion = 'burst';
      animatePiece(piece, [
        { transform: poseTransform(piece, piece.pose), offset: 0 },
        { transform: poseTransform(piece, overshoot, 45), offset: .68 },
        { transform: poseTransform(piece, target), offset: 1 },
      ], 930, () => { piece.pose = target; piece.busy = false; node.setAttribute('aria-disabled', 'false'); node.style.transform = poseTransform(piece, target); node.dataset.motion = 'idle'; }, Math.min(150, Math.hypot(piece.home.x - scene.origin.x, piece.home.y - scene.origin.y) * .24));
    });
    restTimer();
    // Entering from the keyboard lands on a useful, immediately playable piece.
    if (scene.opener === startButton.current) nodes.current.get(scene.pieces[0]?.id)?.focus({ preventScroll: true });
    // Scene identity changes only at entry; scoring must not replay the blast.
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
    const current = session.current;
    if (!current || phaseRef.current !== 'playing' || piece.returned || piece.busy || drag.current || event.button !== 0) return;
    event.preventDefault();
    clearInactivity();
    stopAnimation(piece, true);
    const node = event.currentTarget;
    node.focus({ preventScroll: true });
    node.setPointerCapture(event.pointerId);
    node.dataset.motion = 'dragging';
    const from = { x: piece.pose.x, y: piece.pose.y };
    const start = { x: event.clientX, y: event.clientY };
    const base = assistedVelocity(from, current.hoop, current.bounds.top);
    drag.current = { id: piece.id, pointer: event.pointerId, from, start, current: from, base, pull: { x: 0, y: 0 }, moved: false };
    if (piece.kind === 'letter') drawAim(flightFor(piece, from, base));
    // A lost pointer still has a finite safety exit.
    inactivity.current = setTimeout(() => assemble(), 60000);
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>, piece: Piece) => {
    const held = drag.current;
    const current = session.current;
    if (!held || !current || held.id !== piece.id || held.pointer !== event.pointerId) return;
    const pull = { x: event.clientX - held.start.x, y: event.clientY - held.start.y };
    held.moved ||= Math.hypot(pull.x, pull.y) > 8;
    held.current = {
      x: clampPlayground(held.from.x + pull.x, piece.width / 2 + 8, current.bounds.width - piece.width / 2 - 8),
      y: clampPlayground(held.from.y + pull.y, current.bounds.top + piece.height / 2, current.bounds.bottom - piece.height / 2),
    };
    held.pull = { x: held.current.x - held.from.x, y: held.current.y - held.from.y };
    piece.pose = { ...held.current, rotation: 0 };
    event.currentTarget.style.transform = poseTransform(piece, piece.pose, 24);
    if (piece.kind === 'letter') drawAim(flightFor(piece, held.current, held.moved ? pulledVelocity(held.base, held.pull) : held.base));
    else ghosts.current.get(piece.id)?.setAttribute('data-near', String(nearPlaygroundHome(held.current, piece.home, piece.width, piece.height)));
  };

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>, piece: Piece, canceled = false) => {
    const held = drag.current;
    if (!held || held.id !== piece.id || held.pointer !== event.pointerId) return;
    drag.current = null;
    hideAim();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.style.transform = poseTransform(piece, piece.pose);
    event.currentTarget.dataset.motion = 'idle';
    ghosts.current.get(piece.id)?.setAttribute('data-near', 'false');
    if (!canceled && piece.kind === 'letter') shoot(piece, held.current, held.moved ? pulledVelocity(held.base, held.pull) : held.base);
    else if (!canceled && nearPlaygroundHome(held.current, piece.home, piece.width, piece.height)) returnPiece(piece);
    restTimer();
  };

  const letters = scene?.pieces.filter(piece => piece.kind === 'letter') || [];
  const score = letters.filter(piece => homeIds.includes(piece.id)).length;
  const allNameHome = score > 0 && score === letters.length;

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
    <button ref={startButton} type="button" className="hero-playground-start" hidden={!enabled || phase !== 'idle'} onClick={() => begin()} aria-label={text.play}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18M5.5 5.5c7 3 7 10 0 13M18.5 5.5c-7 3-7 10 0 13" /></svg>
      <span className="hero-playground-hint">{text.hint}</span><span className="hero-playground-touch-hint">{text.play}</span>
    </button>
    {scene && <div ref={layer} className="hero-playground-layer" data-phase={phase} role="group" aria-label={text.title} style={{ '--play-burst-x': `${scene.origin.x}px`, '--play-burst-y': `${scene.origin.y}px` } as CSSProperties}>
      <div className="hero-playground-atmosphere" aria-hidden="true" />
      <div className="hero-playground-burst" aria-hidden="true" />
      <div className="hero-playground-toolbar"><div><span className="hero-playground-score">{String(score).padStart(2, '0')}<span>/ {letters.length}</span></span><span className="hero-playground-score-label">{text.score}</span></div><button type="button" className="hero-playground-reset" onClick={() => assemble(false, true)} disabled={phase === 'assembling'}><RotateCcw size={13} aria-hidden="true" />{text.assemble}</button></div>
      <div className="hero-playground-instructions"><p>{text.help}</p><p>{text.parts}</p><span className="sr-only">{text.keyboard}</span></div>
      <svg className="hero-playground-hoop" viewBox="0 0 200 156" width="200" height="156" style={{ left: scene.hoop.x - 100, top: scene.hoop.y - 91 }} aria-hidden="true">
        <defs><linearGradient id="hero-court-board" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--bg)" stopOpacity=".9" /><stop offset="1" stopColor="var(--bg)" stopOpacity=".58" /></linearGradient></defs>
        <path className="hero-hoop-support" d="M119 88l16 56h-25" />
        <path className="hero-hoop-board-edge" d="M37 14l126-5 8 77-126 7z" />
        <path className="hero-hoop-board" d="M30 9l126-5 8 77-126 7z" fill="url(#hero-court-board)" />
        <path className="hero-hoop-square" d="M77 43l42-2 3 34-42 2z" />
        <ellipse className="hero-hoop-rim-back" cx="100" cy="91" rx="41" ry="9" />
        <path className="hero-hoop-net" d="M61 94l17 43h44l17-43M69 98l53 39M86 100l45 22M103 100l32 7M131 98l-53 39M114 100l-45 22M97 100l-32 7M70 116h60M75 129h50" />
        <path className="hero-hoop-rim-front" d="M59 91c0 12 82 12 82 0" />
      </svg>
      <svg className="hero-playground-trajectory" viewBox={`0 0 ${scene.bounds.width} ${scene.bounds.height}`} aria-hidden="true"><path ref={trajectory} d="" /><circle ref={landingMarker} r="7" opacity="0" /></svg>
      <div className="hero-playground-homes" aria-hidden="true">{scene.pieces.map(piece => <div key={piece.id} ref={node => { if (node) ghosts.current.set(piece.id, node); else ghosts.current.delete(piece.id); }} className={`hero-playground-home hero-playground-home--${piece.kind}`} data-returned={homeIds.includes(piece.id)} hidden={piece.kind === 'letter' ? allNameHome : homeIds.includes(piece.id)} style={{ left: piece.home.x - piece.homeWidth / 2, top: piece.home.y - piece.homeHeight / 2, width: piece.homeWidth, height: piece.homeHeight, font: piece.font, letterSpacing: piece.letterSpacing }}>
        {piece.kind === 'letter' ? piece.glyph : <span>{piece.label}</span>}
      </div>)}</div>
      {scene.pieces.map((piece, index) => <div key={piece.id} ref={node => { if (node) nodes.current.set(piece.id, node); else nodes.current.delete(piece.id); }} className={`hero-playground-piece hero-playground-piece--${piece.kind}`} role="button" tabIndex={homeIds.includes(piece.id) || phase === 'assembling' ? -1 : 0} aria-hidden={homeIds.includes(piece.id) || undefined} aria-label={piece.kind === 'letter' ? `${text.letter} ${piece.glyph}: ${text.shoot}` : `${piece.label}: ${text.returnPart}`} style={{ width: piece.width, height: piece.height, transform: poseTransform(piece, piece.pose), '--piece-float-duration': `${6.4 + index % 5}s`, '--piece-float-delay': `${-index * .47}s` } as CSSProperties}
        onPointerDown={event => pointerDown(event, piece)} onPointerMove={event => pointerMove(event, piece)} onPointerUp={event => pointerUp(event, piece)} onPointerCancel={event => pointerUp(event, piece, true)} onLostPointerCapture={event => pointerUp(event, piece, true)}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && !piece.busy && !piece.returned && session.current && phaseRef.current === 'playing') {
            event.preventDefault();
            stopAnimation(piece, true);
            if (piece.kind === 'letter') {
              const velocity = assistedVelocity(piece.pose, session.current.hoop, session.current.bounds.top);
              drawAim(flightFor(piece, piece.pose, velocity));
              shoot(piece, piece.pose, velocity);
            } else returnPiece(piece);
          }
        }}>
        <div className="hero-playground-piece-float">{piece.kind === 'letter' ? <span className="hero-playground-glyph" aria-hidden="true" style={{ font: piece.font, letterSpacing: piece.letterSpacing }}>{piece.glyph}</span> : <div className="hero-playground-copy" inert aria-hidden="true" dangerouslySetInnerHTML={{ __html: piece.html || '' }} />}</div>
      </div>)}
    </div>}
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </div>;
}
