import { useEffect, useRef, useState } from 'react';
import { useMotionSettings } from './MotionSettings';

type PixelAvatarProps = {
  defaultSrc: string;
  hoverSrc: string;
  className?: string;
};

type TileTransition = {
  from: number;
  delay: number;
  duration: number;
};

type AvatarRenderer = {
  setTarget: (alternate: boolean) => void;
};

const GRID_SIZE = 12;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

/** A portrait that changes through shuffled pixel tiles on hover, focus, or tap. */
export function PixelAvatar({ defaultSrc, hoverSrc, className }: PixelAvatarProps) {
  const { settings } = useMotionSettings();
  const speed = useRef(settings.animationSpeed);
  speed.current = settings.animationSpeed;
  const [alternate, setAlternate] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AvatarRenderer | null>(null);
  const alternateRef = useRef(alternate);
  const pointerTypeRef = useRef('');
  const suppressTouchFocusRef = useRef(false);

  useEffect(() => {
    alternateRef.current = alternate;
    rendererRef.current?.setTarget(alternate);
  }, [alternate]);

  useEffect(() => {
    const button = buttonRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    setCanvasReady(false);
    if (!button || !canvas || !context) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const values = new Array<number>(TILE_COUNT).fill(0);
    let transitions: TileTransition[] = [];
    let primary: HTMLImageElement | null = null;
    let secondary: HTMLImageElement | null = null;
    let desired = 0;
    let startedAt = 0;
    let frame = 0;
    let disposed = false;
    let hasRendered = false;

    const draw = () => {
      if (disposed || !primary || !secondary || canvas.width === 0 || canvas.height === 0) {
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);

      for (let index = 0; index < TILE_COUNT; index += 1) {
        const column = index % GRID_SIZE;
        const row = Math.floor(index / GRID_SIZE);
        const x = Math.round((column * width) / GRID_SIZE);
        const y = Math.round((row * height) / GRID_SIZE);
        const tileWidth = Math.round(((column + 1) * width) / GRID_SIZE) - x;
        const tileHeight = Math.round(((row + 1) * height) / GRID_SIZE) - y;
        const progress = values[index];
        const source = progress < 0.5 ? primary : secondary;
        const coverScale = Math.max(width / source.naturalWidth, height / source.naturalHeight);
        const cropX = (source.naturalWidth - width / coverScale) / 2;
        const cropY = (source.naturalHeight - height / coverScale) / 2;
        const sourceX = cropX + x / coverScale;
        const sourceY = cropY + y / coverScale;
        const sourceWidth = tileWidth / coverScale;
        const sourceHeight = tileHeight / coverScale;

        if (progress === 0 || progress === 1) {
          context.drawImage(
            source, sourceX, sourceY, sourceWidth, sourceHeight,
            x, y, tileWidth, tileHeight,
          );
          continue;
        }

        // The narrow midpoint exposes a small alternating light/dark pixel flash.
        context.fillStyle = (column + row) % 2 === 0 ? '#fff' : '#050505';
        context.fillRect(x, y, tileWidth, tileHeight);
        context.save();
        context.translate(x + tileWidth / 2, y + tileHeight / 2);
        context.scale(Math.max(0.035, Math.abs(Math.cos(Math.PI * progress))), 1);
        context.globalAlpha = 0.86 + 0.14 * Math.abs(2 * progress - 1);
        context.drawImage(
          source, sourceX, sourceY, sourceWidth, sourceHeight,
          -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight,
        );
        context.restore();
      }

      if (!hasRendered) {
        hasRendered = true;
        setCanvasReady(true);
      }
    };

    const resize = () => {
      const bounds = button.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * density);
      const height = Math.round(bounds.height * density);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      draw();
    };

    const animate = (timestamp: number) => {
      frame = 0;
      if (disposed) return;
      let complete = true;

      for (let index = 0; index < TILE_COUNT; index += 1) {
        const tile = transitions[index];
        const elapsed = Math.max(0, Math.min(1, (timestamp - startedAt - tile.delay) / tile.duration));
        const eased = elapsed * elapsed * (3 - 2 * elapsed);
        values[index] = elapsed === 1 ? desired : tile.from + (desired - tile.from) * eased;
        if (elapsed < 1 && tile.from !== desired) complete = false;
      }

      draw();
      if (!complete) frame = window.requestAnimationFrame(animate);
    };

    const setTarget = (isAlternate: boolean) => {
      desired = isAlternate ? 1 : 0;
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (!primary || !secondary) return;

      if (motionPreference.matches || values.every((value) => value === desired)) {
        values.fill(desired);
        draw();
        return;
      }

      const order = Array.from({ length: TILE_COUNT }, (_, index) => index);
      for (let index = order.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1));
        [order[index], order[other]] = [order[other], order[index]];
      }

      transitions = new Array<TileTransition>(TILE_COUNT);
      order.forEach((index, rank) => {
        transitions[index] = {
          from: values[index],
          delay: (rank / TILE_COUNT) * 140 / speed.current,
          duration: (240 + Math.random() * 80) / speed.current,
        };
      });
      startedAt = window.performance.now();
      frame = window.requestAnimationFrame(animate);
    };

    const handleMotionPreference = () => {
      if (motionPreference.matches) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        values.fill(desired);
        draw();
      }
    };

    const images: HTMLImageElement[] = [];
    const preload = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      images.push(image);
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });

    rendererRef.current = { setTarget };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(button);
    window.addEventListener('resize', resize);
    motionPreference.addEventListener('change', handleMotionPreference);
    resize();

    void Promise.all([preload(defaultSrc), preload(hoverSrc)]).then(([first, second]) => {
      if (disposed || !first || !second) return;
      primary = first;
      secondary = second;
      resize();
      setTarget(alternateRef.current);
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      motionPreference.removeEventListener('change', handleMotionPreference);
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
      rendererRef.current = null;
    };
  }, [defaultSrc, hoverSrc]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={['pixel-avatar', className].filter(Boolean).join(' ')}
      aria-label="Toggle alternate profile photo"
      aria-pressed={alternate}
      title="Switch profile photo"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') setAlternate(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') setAlternate(false);
      }}
      onPointerDown={(event) => {
        pointerTypeRef.current = event.pointerType;
        suppressTouchFocusRef.current = event.pointerType === 'touch';
      }}
      onPointerCancel={() => { suppressTouchFocusRef.current = false; }}
      onFocus={() => {
        if (!suppressTouchFocusRef.current) setAlternate(true);
        suppressTouchFocusRef.current = false;
      }}
      onBlur={() => {
        suppressTouchFocusRef.current = false;
        setAlternate(false);
      }}
      onClick={(event) => {
        suppressTouchFocusRef.current = false;
        if (event.detail === 0 || pointerTypeRef.current === 'touch') {
          setAlternate((current) => !current);
        }
      }}
      style={{
        position: 'relative',
        display: 'block',
        aspectRatio: '1',
        overflow: 'hidden',
        borderRadius: '50%',
        border: 0,
        padding: 0,
        background: 'transparent',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <img
        src={alternate ? hoverSrc : defaultSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: canvasReady ? 1 : 0,
          pointerEvents: 'none',
        }}
      />
    </button>
  );
}

export default PixelAvatar;
