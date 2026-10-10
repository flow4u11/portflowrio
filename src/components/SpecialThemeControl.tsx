import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import type { SpecialDesign, ThemeOrigin } from './useSpecialTheme';
import './special-theme.css';

export type SpecialThemeControlProps = {
  active: boolean;
  design?: SpecialDesign | 'default';
  onExit: (origin?: ThemeOrigin) => void;
  children: ReactNode;
  language?: 'en' | 'th';
  disabled?: boolean;
};

/** The original theme control is passed through unchanged when the experiment is off. */
export function SpecialThemeControl({ active, design = 'neobrutalism', onExit, children, language = 'en', disabled = false }: SpecialThemeControlProps) {
  const slotRef = useRef<HTMLSpanElement>(null);
  const restoreFocusRef = useRef(false);
  useLayoutEffect(() => {
    if (!active && !disabled && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      slotRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    }
  }, [active, disabled]);
  const label = language === 'th' ? 'กลับไปใช้ธีมสว่างหรือมืดที่เลือกไว้' : 'Return to your saved Light/Dark theme';
  return <span className="special-theme-control-slot theme-control" ref={slotRef}>
    {active ? <button
      className="special-theme-control"
      data-special-icon={design}
      type="button"
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      aria-busy={disabled || undefined}
      onClick={event => {
        if (disabled) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        restoreFocusRef.current = document.activeElement === event.currentTarget;
        onExit(event.detail ? { x: event.clientX, y: event.clientY } : { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
      }}
    ><svg className="special-theme-emblem" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {design === 'halloween' ? <><path className="special-theme-moon" d="M17.8 3.5a8.4 8.4 0 1 0 2.7 14.2A7.4 7.4 0 0 1 17.8 3.5Z" /><path className="special-theme-bat" d="m6 12 3.2-2 .8 2 2-2 2 2 .8-2 3.2 2-3 1.2L12 16l-3-2.8Z" fill="currentColor" strokeWidth=".8" /><path d="M5 4v3M3.5 5.5h3" /></> : <><path className="special-theme-layer" d="m12 2 9 5-9 5-9-5Z" fill="var(--neo-mint)" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /><path d="M12 12v10" /></>}
    </svg><RotateCcw className="special-theme-return-icon" size={12} strokeWidth={2} aria-hidden="true" /></button> : children}
  </span>;
}
