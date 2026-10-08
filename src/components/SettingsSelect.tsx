import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string };
/** A themed single-choice control. Focus stays on its combobox while navigating options. */
export function SettingsSelect({ id, label, value, options, onChange, disabled = false }: {
  id: string; label: string; value: string | number; options: readonly Option[];
  onChange: (value: string) => void; disabled?: boolean;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [above, setAbove] = useState(false);
  const [menuHeight, setMenuHeight] = useState(220);
  const selected = Math.max(0, options.findIndex(option => option.value === String(value)));
  const reveal = () => {
    const rect = button.current?.getBoundingClientRect();
    const panel = root.current?.closest('.motion-settings-scroll')?.getBoundingClientRect();
    if (rect) {
      const below = Math.max(0, (panel?.bottom ?? window.innerHeight) - rect.bottom - 12);
      const aboveRoom = Math.max(0, rect.top - (panel?.top ?? 0) - 12);
      const upward = below < Math.min(220, options.length * 42 + 12) && aboveRoom > below;
      setAbove(upward);
      setMenuHeight(Math.max(40, Math.min(220, upward ? aboveRoom : below)));
    }
    setActive(selected);
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const scrollPanel = root.current?.closest('.motion-settings-scroll');
    const dismiss = () => setOpen(false);
    document.addEventListener('pointerdown', outside, true);
    scrollPanel?.addEventListener('scroll', dismiss, { passive: true });
    window.addEventListener('resize', dismiss, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      scrollPanel?.removeEventListener('scroll', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);
  useEffect(() => {
    // Scroll only the option list, never its workspace or the page behind it.
    const list = menu.current;
    const option = list?.children[active] as HTMLElement | undefined;
    if (!open || !list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [active, open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const choose = (index: number) => { onChange(options[index].value); setOpen(false); button.current?.focus({ preventScroll: true }); };
  return <div className="motion-settings-select-row" ref={root} data-disabled={disabled || undefined}>
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <div className="settings-select">
      <button ref={button} id={id} type="button" role="combobox" aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-activedescendant={open ? `${listId}-${active}` : undefined} disabled={disabled}
        onClick={() => open ? setOpen(false) : reveal()}
        onBlur={event => { if (!root.current?.contains(event.relatedTarget)) setOpen(false); }}
        onKeyDown={event => {
          if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
          if (event.key === 'Tab') { setOpen(false); return; }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); if (!open) reveal(); else setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length); return;
          }
          if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); if (!open) reveal(); setActive(event.key === 'Home' ? 0 : options.length - 1); return; }
          if ((event.key === 'Enter' || event.key === ' ') && open) { event.preventDefault(); choose(active); return; }
          if (event.key.length === 1 && event.key !== ' ') {
            const index = options.findIndex(option => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
            if (index >= 0) { event.preventDefault(); if (!open) reveal(); setActive(index); }
          }
        }}><span>{options[selected].label}</span><ChevronDown size={14} aria-hidden="true" /></button>
      {open && <div ref={menu} id={listId} style={{ maxHeight: menuHeight }} role="listbox" aria-labelledby={`${id}-label`} className="settings-select-menu" data-above={above}>
        {options.map((option, index) => <button key={option.value} id={`${listId}-${index}`} role="option" aria-selected={index === selected} type="button" tabIndex={-1} data-active={index === active} onPointerDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}><span>{option.label}</span>{index === selected && <Check size={13} aria-hidden="true" />}</button>)}
      </div>}
    </div>
  </div>;
}
