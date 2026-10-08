import { useEffect, useRef, useState } from 'react';
import { useMotionSettings } from './MotionSettings';
import './pixel-avatar.css';

type PixelAvatarProps = { defaultSrc: string; hoverSrc: string; className?: string };
type AvatarRenderer = { setTarget: (alternate: boolean) => void };

function shuffled(count: number) {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = count - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  return order;
}

/** React Bits PixelTransition's shuffled cover/swap/uncover, drawn in one small canvas.
 * Adapted from David Haz; source revision and MIT + Commons Clause notice in docs/react-bits-sources.md.
 */
export function PixelAvatar({ defaultSrc, hoverSrc, className }: PixelAvatarProps) {
  const { settings } = useMotionSettings();
  const configRef = useRef(settings);
  configRef.current = settings;
  const [alternate, setAlternate] = useState(false);
  const alternateRef = useRef(alternate);
  alternateRef.current = alternate;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const alternateImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AvatarRenderer | null>(null);
  const touchFocusRef = useRef(false);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.setTarget(alternate);
    else if (alternateImageRef.current) alternateImageRef.current.style.opacity = alternate ? '1' : '0';
  }, [alternate]);

  useEffect(() => {
    const button = buttonRef.current;
    const canvas = canvasRef.current;
    const image = alternateImageRef.current;
    const context = canvas?.getContext('2d');
    if (!button || !canvas || !image || !context) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const grid = settings.avatarGrid;
    const count = grid * grid;
    let frame = 0;
    let disposed = false;
    let inView = true;
    let displayed = alternateRef.current;
    let desired = displayed;
    let startedAt = 0;
    let duration = 0;
    let stagger = 1;
    let covered = shuffled(count);
    let uncovered = shuffled(count);
    let color = document.documentElement.dataset.theme === 'dark' ? '#fff' : '#000';

    const showImage = (target: boolean) => {
      displayed = target;
      image.style.opacity = target ? '1' : '0';
    };
    const settle = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      showImage(desired);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
    const drawPixel = (index: number) => {
      const column = index % grid;
      const row = Math.floor(index / grid);
      const x = Math.floor(column * canvas.width / grid);
      const y = Math.floor(row * canvas.height / grid);
      const right = Math.ceil((column + 1) * canvas.width / grid);
      const bottom = Math.ceil((row + 1) * canvas.height / grid);
      context.fillRect(x, y, right - x, bottom - y);
    };
    const animate = (now: number) => {
      frame = 0;
      if (disposed) return;
      if (document.hidden || !inView || preference.matches) { settle(); return; }
      const progress = Math.min(1, (now - startedAt) / duration);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = color;
      if (progress < 0.5) {
        const visible = Math.min(count, Math.ceil((progress * 2 / stagger) * count));
        for (let index = 0; index < visible; index++) drawPixel(covered[index]);
      } else {
        if (displayed !== desired) showImage(desired);
        const hidden = Math.min(count, Math.floor(((progress * 2 - 1) / stagger) * count));
        for (let index = hidden; index < count; index++) drawPixel(uncovered[index]);
      }
      if (progress < 1) frame = window.requestAnimationFrame(animate);
      else settle();
    };
    const setTarget = (target: boolean) => {
      desired = target;
      window.cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (desired === displayed || document.hidden || !inView || preference.matches) { settle(); return; }
      covered = shuffled(count);
      uncovered = shuffled(count);
      duration = configRef.current.avatarDuration * 1000 / configRef.current.animationSpeed;
      stagger = configRef.current.avatarStagger;
      startedAt = performance.now();
      frame = window.requestAnimationFrame(animate);
    };
    const resize = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(button.clientWidth * density);
      const height = Math.round(button.clientHeight * density);
      if (width !== canvas.width || height !== canvas.height) {
        canvas.width = width;
        canvas.height = height;
        settle();
      }
    };
    const pause = () => { if (document.hidden || preference.matches) settle(); };
    const resizeObserver = new ResizeObserver(resize);
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) settle();
    });
    const themeObserver = new MutationObserver(() => {
      color = document.documentElement.dataset.theme === 'dark' ? '#fff' : '#000';
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    resizeObserver.observe(button);
    viewObserver.observe(button);
    document.addEventListener('visibilitychange', pause);
    preference.addEventListener('change', pause);
    rendererRef.current = { setTarget };
    showImage(desired);
    resize();

    return () => {
      disposed = true;
      settle();
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', pause);
      preference.removeEventListener('change', pause);
      rendererRef.current = null;
    };
  }, [defaultSrc, hoverSrc, settings.avatarGrid]);

  return <button
    ref={buttonRef}
    type="button"
    className={['pixel-avatar', className].filter(Boolean).join(' ')}
    aria-label="Toggle alternate profile photo"
    aria-pressed={alternate}
    title="Switch profile photo"
    onPointerEnter={event => { if (event.pointerType === 'mouse') setAlternate(true); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') setAlternate(false); }}
    onPointerDown={event => { touchFocusRef.current = event.pointerType === 'touch'; }}
    onPointerCancel={() => { touchFocusRef.current = false; }}
    onFocus={event => {
      if (!touchFocusRef.current && event.currentTarget.matches(':focus-visible')) setAlternate(true);
      touchFocusRef.current = false;
    }}
    onBlur={() => { touchFocusRef.current = false; setAlternate(false); }}
    onClick={() => { touchFocusRef.current = false; setAlternate(current => !current); }}
  >
    <img src={defaultSrc} className="pixel-avatar-image" alt="" aria-hidden="true" draggable={false} />
    <img ref={alternateImageRef} src={hoverSrc} className="pixel-avatar-image pixel-avatar-image--alternate" alt="" aria-hidden="true" draggable={false} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} onLoad={event => { event.currentTarget.style.visibility = 'visible'; }} />
    <canvas ref={canvasRef} className="pixel-avatar-mask" aria-hidden="true" />
  </button>;
}

export default PixelAvatar;
