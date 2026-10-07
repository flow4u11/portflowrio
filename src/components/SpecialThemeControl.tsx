import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Blocks, RotateCcw } from 'lucide-react';
import type { ThemeOrigin } from './useSpecialTheme';
import './special-theme.css';

export type SpecialThemeControlProps = {
  active: boolean;
  onExit: (origin?: ThemeOrigin) => void;
  children: ReactNode;
  language?: 'en' | 'th';
  disabled?: boolean;
};

/** The original theme control is passed through unchanged when the experiment is off. */
export function SpecialThemeControl({ active, onExit, children, language = 'en', disabled = false }: SpecialThemeControlProps) {
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
    ><Blocks size={19} strokeWidth={2.1} aria-hidden="true" /><RotateCcw className="special-theme-return-icon" size={11} strokeWidth={2} aria-hidden="true" /></button> : children}
  </span>;
}
