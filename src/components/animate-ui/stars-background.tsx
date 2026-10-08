// Public API adapted from Animate UI, copyright (c) 2025 Elliot Sutton.
// Source and MIT + Commons Clause notice: docs/animate-ui-sources.md.
// The canvas renderer below is an original, bounded replacement for shadow layers.
import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps, type SpringOptions, type Transition } from 'motion/react';
import { cn } from '../../lib/utils';
import { useMotionSettings } from '../MotionSettings';
import { ThreeStarField } from '../ThreeStarField';

type Star = { x: number; y: number; depth: number; opacity: number };
type Offset = { x: number; y: number };
type StarCanvasProps = {
  starColor: string;
  speed: number;
  speedMultiplier?: number;
  count?: number;
  size?: number;
  scale?: number;
  offset?: React.RefObject<Offset>;
};

const MAX_STARS = 240;
const MOBILE_STAR_CAP = 120;
const FRAME_INTERVAL = 1000 / 30;

function StarCanvas({ starColor, speed, speedMultiplier = 1, count, size, scale = 1, offset }: StarCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const starsRef = React.useRef<Star[]>([]);
  const phaseRef = React.useRef(0);
  const colorRef = React.useRef(starColor);
  const repaintRef = React.useRef<(() => void) | null>(null);
  const configRef = React.useRef({ speed, speedMultiplier, count, size, scale });
  const reduceMotion = useReducedMotion();

  React.useLayoutEffect(() => {
    configRef.current = { speed, speedMultiplier, count, size, scale };
    repaintRef.current?.();
  }, [speed, speedMultiplier, count, size, scale]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const updateColor = () => {
      colorRef.current = starColor === 'currentColor' && canvas
        ? getComputedStyle(canvas).color
        : starColor;
      if (!document.hidden) repaintRef.current?.();
    };
    updateColor();
    if (starColor !== 'currentColor') return;
    const themeObserver = new MutationObserver(updateColor);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-design', 'class'] });
    return () => themeObserver.disconnect();
  }, [starColor]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!context) return;
    if (!starsRef.current.length) {
      starsRef.current = Array.from({ length: MAX_STARS }, () => ({
        x: Math.random(), y: Math.random(), depth: Math.random(),
        opacity: 0.28 + Math.random() * 0.46,
      }));
    }

    let width = 0;
    let height = 0;
    let frame = 0;
    let resizeFrame = 0;
    let previousFrame = 0;
    let onScreen = true;
    let disposed = false;
    let publishedCount = -1;
    let publishedSpeed = -1;
    const currentOffset = { x: 0, y: 0 };
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const draw = () => {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = colorRef.current;
      const target = reduceMotion ? undefined : offset?.current;
      currentOffset.x += ((target?.x ?? 0) - currentOffset.x) * 0.09;
      currentOffset.y += ((target?.y ?? 0) - currentOffset.y) * 0.09;
      const fieldHeight = height + 48;
      const config = configRef.current;
      const requestedCount = config.count ?? Math.max(48, width * height / 8500);
      const particleCap = coarsePointer || width < 600 ? MOBILE_STAR_CAP : MAX_STARS;
      const starCount = Math.min(particleCap, Math.max(0, Math.round(Number.isFinite(requestedCount) ? requestedCount : 120)));
      const currentSpeed = Math.min(2, Math.max(0.25, Number.isFinite(config.speedMultiplier) ? config.speedMultiplier : 1));
      if (publishedCount !== starCount) { canvas.dataset.starCount = String(starCount); publishedCount = starCount; }
      if (publishedSpeed !== currentSpeed) { canvas.dataset.starSpeed = String(currentSpeed); publishedSpeed = currentSpeed; }
      for (let index = 0; index < starCount; index++) {
        const star = starsRef.current[index];
        const drift = phaseRef.current * (3.5 + star.depth * 9);
        const x = star.x * width + currentOffset.x * star.depth;
        const y = ((star.y * fieldHeight - drift) % fieldHeight + fieldHeight) % fieldHeight - 24
          + currentOffset.y * star.depth;
        const diameter = (config.size ?? (0.65 + star.depth * 1.7)) * config.scale;
        context.globalAlpha = star.opacity;
        // Small rects avoid hundreds of paths, shadows, and full-page CSS paints.
        context.fillRect(x, y, diameter, diameter);
      }
      context.globalAlpha = 1;
    };

    const tick = (timestamp: number) => {
      if (disposed || document.hidden || !onScreen || reduceMotion) return;
      if (!previousFrame || timestamp - previousFrame >= FRAME_INTERVAL - 1) {
        const { speed: currentSpeed, speedMultiplier: multiplier } = configRef.current;
        const rate = 60 / Math.max(Number.isFinite(currentSpeed) ? currentSpeed : 90, 1)
          * Math.min(2, Math.max(0.25, Number.isFinite(multiplier) ? multiplier : 1));
        // Integrate speed into the phase so a slider change does not jump the field.
        phaseRef.current += previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.1) * rate : 0;
        previousFrame = timestamp;
        draw();
      }
      frame = window.requestAnimationFrame(tick);
    };

    const resume = () => {
      window.cancelAnimationFrame(frame);
      previousFrame = 0;
      if (!document.hidden && onScreen) {
        draw();
        if (!reduceMotion) frame = window.requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.round(bounds.width);
      const nextHeight = Math.round(bounds.height);
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      // Keep high-density and large monitors from multiplying the pixel workload.
      const density = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1 : 1.35,
        Math.sqrt(2_000_000 / Math.max(width * height, 1)));
      canvas.width = Math.max(1, Math.round(width * density));
      canvas.height = Math.max(1, Math.round(height * density));
      context.setTransform(density, 0, 0, density, 0, 0);
      resume();
    };

    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    });
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      resume();
    });
    visibilityObserver.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    repaintRef.current = () => { if (!document.hidden && onScreen) draw(); };
    resize();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', resume);
      repaintRef.current = null;
    };
  }, [offset, reduceMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}

export type StarLayerProps = HTMLMotionProps<'div'> & {
  count: number;
  size: number;
  transition: Transition;
  starColor: string;
};

/** Retained for callers that use an individual star layer. */
export function StarLayer({ count, size, transition, starColor, className, ...props }: StarLayerProps) {
  return (
    <motion.div {...props} data-slot="star-layer" aria-hidden="true" className={cn('absolute inset-0', className)}>
      <StarCanvas count={count} size={size} speed={typeof transition.duration === 'number' ? transition.duration : 50} starColor={starColor} />
    </motion.div>
  );
}

export type StarsBackgroundProps = React.ComponentProps<'div'> & {
  factor?: number;
  speed?: number;
  starCount?: number;
  transition?: SpringOptions;
  starColor?: string;
  pointerEvents?: boolean;
};

/** A single canvas intended to be shared behind every section of the page. */
export function StarsBackground({
  children,
  className,
  factor = 0.05,
  speed = 90,
  starCount,
  transition: _transition,
  starColor = 'currentColor',
  pointerEvents = true,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: StarsBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const { settings } = useMotionSettings();
  const offset = React.useRef({ x: 0, y: 0 });
  return (
    <div
      {...props}
      data-slot="stars-background"
      className={cn('relative size-full overflow-hidden', className)}
      style={{ pointerEvents: pointerEvents ? undefined : 'none', ...style }}
      onMouseMove={(event) => {
        onMouseMove?.(event);
        if (reduceMotion || !pointerEvents) return;
        offset.current.x = -(event.clientX - window.innerWidth / 2) * factor;
        offset.current.y = -(event.clientY - window.innerHeight / 2) * factor;
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        offset.current.x = 0;
        offset.current.y = 0;
      }}
    >
      <ThreeStarField color={starColor} speed={settings.starSpeed} scale={settings.starScale} count={starCount ?? settings.starCount} fallback={<StarCanvas starColor={starColor} speed={speed} speedMultiplier={settings.starSpeed} scale={settings.starScale} count={starCount ?? settings.starCount} offset={offset} />} />
      {children}
    </div>
  );
}
