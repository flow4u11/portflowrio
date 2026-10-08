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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [above, setAbove] = useState(false);
  const selected = Math.max(0, options.findIndex(option => option.value === String(value)));
  const reveal = () => {
    const rect = button.current?.getBoundingClientRect();
    setAbove(Boolean(rect && window.innerHeight - rect.bottom < Math.min(230, options.length * 42 + 16) && rect.top > 240));
    setActive(selected);
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);
  useEffect(() => {
    if (open) root.current?.querySelector(`[id="${CSS.escape(`${listId}-${active}`)}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, listId]);
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
      {open && <div id={listId} role="listbox" aria-labelledby={`${id}-label`} className="settings-select-menu" data-above={above}>
        {options.map((option, index) => <button key={option.value} id={`${listId}-${index}`} role="option" aria-selected={index === selected} type="button" tabIndex={-1} data-active={index === active} onPointerDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}><span>{option.label}</span>{index === selected && <Check size={13} aria-hidden="true" />}</button>)}
      </div>}
    </div>
  </div>;
}
