import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Blocks, X } from 'lucide-react';
import type { ThemeOrigin } from './useSpecialTheme';
import './special-theme.css';

export type ThemeLabProps = {
  onActivate: (origin?: ThemeOrigin) => void;
  language?: 'en' | 'th';
};

const copy = {
  en: {
    keyword: 'theme', trigger: 'Open theme experiment', title: 'A different point of view',
    hint: 'Try neobrutalism. Type the word below, then press Enter.', label: 'Theme keyword',
    submit: 'Try it', close: 'Close theme experiment',
    error: 'That theme is not available. Type neobrutalism to try this experiment.',
  },
  th: {
    keyword: 'ธีม', trigger: 'เปิดการทดลองธีม', title: 'ลองมองในมุมใหม่',
    hint: 'ลอง neobrutalism พิมพ์คำนี้ด้านล่างแล้วกด Enter', label: 'ชื่อธีม',
    submit: 'ลองเลย', close: 'ปิดการทดลองธีม',
    error: 'ยังไม่มีธีมนี้ ลองพิมพ์ neobrutalism เพื่อเปิดธีมทดลอง',
  },
};

/** An inline word for an About sentence; the dialog is portalled to avoid clipping. */
export function ThemeLab({ onActivate, language = 'en' }: ThemeLabProps) {
  const text = copy[language];
  const id = useId();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback((restoreFocus = true) => {
    if (closeTimer.current) return;
    const finish = () => {
      closeTimer.current = null;
      setOpen(false);
      setClosing(false);
      if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    setClosing(true);
    closeTimer.current = setTimeout(finish, 160);
  }, []);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;
      const bounds = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewTop = viewport?.offsetTop ?? 0;
      const viewLeft = viewport?.offsetLeft ?? 0;
      const viewWidth = viewport?.width ?? window.innerWidth;
      const viewHeight = viewport?.height ?? window.innerHeight;
      const width = Math.min(320, viewWidth - 32);
      popover.style.width = `${width}px`;
      const height = Math.min(popover.scrollHeight, viewHeight - 32);
      const below = bounds.bottom + 10;
      const top = below + height <= viewTop + viewHeight - 16
        ? below : Math.max(viewTop + 16, bounds.top - height - 10);
      const left = Math.max(viewLeft + 16, Math.min(bounds.left - 18, viewLeft + viewWidth - width - 16));
      setPosition({ top, left, width, maxHeight: viewHeight - 32 });
    };
    place();
    const focusFrame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('resize', place);
    };
  }, [open, error, language]);

  useEffect(() => {
    if (!open) return;
    const inside = (target: EventTarget | null) => target instanceof Node &&
      (popoverRef.current?.contains(target) || triggerRef.current?.contains(target));
    const onPointerDown = (event: PointerEvent) => { if (!inside(event.target)) close(); };
    const onFocus = (event: FocusEvent) => { if (!inside(event.target)) close(false); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    // Dismiss on page scroll rather than continually measuring the anchor.
    const onScroll = (event: Event) => {
      if (!(event.target instanceof Node && popoverRef.current?.contains(event.target))) close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close]);

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="theme-lab-trigger"
      aria-label={text.trigger}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? `${id}-dialog` : undefined}
      onClick={() => {
        if (open) { close(); return; }
        setClosing(false);
        setValue('');
        setError(false);
        setPosition({ visibility: 'hidden' });
        setOpen(true);
      }}
    >{text.keyword}</button>
    {open && createPortal(<div
      ref={popoverRef}
      id={`${id}-dialog`}
      className="theme-lab-popover"
      data-closing={closing || undefined}
      style={position}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-hint`}
      lang={language}
    >
      <div className="theme-lab-heading"><Blocks size={18} aria-hidden="true" /><h3 id={`${id}-title`}>{text.title}</h3><button type="button" className="theme-lab-close" aria-label={text.close} onClick={() => close()}><X size={16} aria-hidden="true" /></button></div>
      <p className="theme-lab-hint" id={`${id}-hint`}>{text.hint}</p>
      <form onSubmit={event => {
        event.preventDefault();
        if (value.trim().toLowerCase() !== 'neobrutalism') {
          setError(true);
          inputRef.current?.focus({ preventScroll: true });
          return;
        }
        const bounds = triggerRef.current?.getBoundingClientRect();
        const origin = bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 } : undefined;
        close();
        onActivate(origin);
      }}>
        <label className="theme-lab-label" htmlFor={`${id}-input`}>{text.label}</label>
        <div className="theme-lab-entry"><input
          ref={inputRef}
          id={`${id}-input`}
          className="theme-lab-input"
          value={value}
          onChange={event => { setValue(event.target.value); setError(false); }}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="neobrutalism"
          maxLength={48}
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        /><button className="theme-lab-submit" type="submit"><span>{text.submit}</span><ArrowUpRight size={16} aria-hidden="true" /></button></div>
        {error && <p className="theme-lab-error" id={`${id}-error`} role="alert">{text.error}</p>}
      </form>
    </div>, document.body)}
  </>;
}
