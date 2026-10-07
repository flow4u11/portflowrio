// Public API adapted from Animate UI, copyright (c) 2025 Elliot Sutton.
// Source and MIT + Commons Clause notice: docs/animate-ui-sources.md.
// Original circular reveal inspired by Motion's Iris from click example.
import * as React from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

export type ThemeSelection = 'light' | 'dark';
export type Direction = 'btt' | 'ttb' | 'ltr' | 'rtl';

type ViewTransitionHandle = {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
};

export type ThemeTogglerButtonProps = Omit<React.ComponentProps<'button'>, 'onChange'> & {
  theme: ThemeSelection;
  onThemeChange: (theme: ThemeSelection) => void;
  /** Kept for compatibility; the reveal now starts at the click position. */
  direction?: Direction;
};

/** Reveals the next theme through an expanding iris at the user's click. */
export function ThemeTogglerButton({
  theme,
  onThemeChange,
  direction: _direction,
  className,
  onClick,
  disabled,
  children,
  ...props
}: ThemeTogglerButtonProps) {
  const reduceMotion = useReducedMotion();
  const changing = React.useRef(false);
  const mounted = React.useRef(true);
  const cleanupRef = React.useRef<(() => void) | null>(null);
  const [transitioning, setTransitioning] = React.useState(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cleanupRef.current?.();
    };
  }, []);

  const toggleTheme = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (changing.current || disabled) return;
    changing.current = true;
    const buttonBounds = event.currentTarget.getBoundingClientRect();
    // Keyboard clicks report no pointer coordinates, so use the button's center.
    const x = event.detail ? event.clientX : buttonBounds.left + buttonBounds.width / 2;
    const y = event.detail ? event.clientY : buttonBounds.top + buttonBounds.height / 2;
    const radius = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + 2;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    let applied = false;
    const commit = () => {
      if (applied) return;
      applied = true;
      flushSync(() => {
        document.documentElement.dataset.theme = nextTheme;
        onThemeChange(nextTheme);
      });
    };
    const viewDocument = document as Document & {
      startViewTransition?: (update: () => void) => ViewTransitionHandle;
    };
    if (reduceMotion || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit();
      changing.current = false;
      return;
    }
    setTransitioning(true);
    let transition: ViewTransitionHandle | undefined;
    let curtain: HTMLDivElement | undefined;
    let animation: Animation | undefined;
    let cancelled = false;
    cleanupRef.current = () => {
      cancelled = true;
      animation?.cancel();
      transition?.skipTransition();
      curtain?.remove();
    };

    const revealCurtain = async () => {
      // Safari and embedded browsers can use a simple color curtain without
      // screenshots or cloning the page. Switch content only once it is covered.
      curtain = document.createElement('div');
      curtain.dataset.themeCurtain = nextTheme;
      curtain.setAttribute('aria-hidden', 'true');
      Object.assign(curtain.style, {
        position: 'fixed', inset: '0', zIndex: '2147483647',
        pointerEvents: 'none', contain: 'strict',
        background: nextTheme === 'dark'
          ? 'var(--theme-dark-background, #050505)'
          : 'var(--theme-light-background, #fff)',
        clipPath: `circle(0px at ${x}px ${y}px)`,
      });
      document.body.append(curtain);
      animation = curtain.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
      );
      await animation.finished;
      if (cancelled) return;
      curtain.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
      animation.cancel();
      commit();
      animation = curtain.animate(
        { opacity: [1, 0] },
        { duration: 180, easing: 'ease-out', fill: 'forwards' },
      );
      await animation.finished;
    };

    try {
      if (viewDocument.startViewTransition) {
        transition = viewDocument.startViewTransition(commit);
        // Hidden tabs may skip snapshots; always consume completion rejections.
        void transition.finished.catch(() => undefined);
        await transition.ready;
        if (cancelled) return;
        animation = document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 680,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
            fill: 'both',
          },
        );
        await animation.finished;
        await transition.finished;
      } else {
        await revealCurtain();
      }
    } catch {
      transition?.skipTransition();
      if (!cancelled) commit();
    } finally {
      animation?.cancel();
      curtain?.remove();
      cleanupRef.current = null;
      changing.current = false;
      if (mounted.current) setTransitioning(false);
    }
  };

  return (
    <>
      <button
        {...props}
        type="button"
        data-slot="theme-toggler-button"
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text)] aria-disabled:cursor-wait',
          className,
        )}
        aria-label={props['aria-label'] ?? 'Dark theme'}
        aria-pressed={theme === 'dark'}
        aria-busy={transitioning || undefined}
        aria-disabled={disabled || transitioning || undefined}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) void toggleTheme(event);
        }}
      >
        {children ?? (theme === 'dark'
          ? <Moon size={18} strokeWidth={1.6} aria-hidden="true" />
          : <Sun size={18} strokeWidth={1.6} aria-hidden="true" />)}
      </button>
      <style>{'::view-transition-group(root){animation:none;}::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}::view-transition-old(root){z-index:1;}::view-transition-new(root){z-index:2;}::view-transition{pointer-events:none;}'}</style>
    </>
  );
}
