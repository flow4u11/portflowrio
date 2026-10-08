import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Gauge, RotateCcw, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import './motion-settings.css';

export type MotionSettings = {
  starSpeed: number;
  starCount: number;
  showFps: boolean;
  animationSpeed: number;
  avatarGrid: number;
  avatarDuration: number;
  avatarStagger: number;
  trailEnabled: boolean;
  trailSize: number;
  trailLifetime: number;
  trailDensity: number;
  galleryPreset: 'liquid' | 'ribbon' | 'vortex' | 'arch';
  gallerySpeed: number;
  galleryBend: number;
};

const STORAGE_KEY = 'portfolio-motion-settings';
const STORAGE_VERSION = 2;
const DEFAULT_SETTINGS: MotionSettings = {
  starSpeed: 1, starCount: 120, showFps: false, animationSpeed: 1,
  avatarGrid: 10, avatarDuration: 0.55, avatarStagger: 0.85,
  trailEnabled: true, trailSize: 8, trailLifetime: 360, trailDensity: 0.75,
  galleryPreset: 'liquid', gallerySpeed: 1, galleryBend: 0.34,
};

function boundedNumber(value: unknown, fallback: number, min: number, max: number, step: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const bounded = Math.min(max, Math.max(min, value));
  return Number((Math.round(bounded / step) * step).toFixed(2));
}

function normalizeSettings(value: unknown): MotionSettings {
  const source = value && typeof value === 'object' ? value as Partial<MotionSettings> : {};
  return {
    starSpeed: boundedNumber(source.starSpeed, DEFAULT_SETTINGS.starSpeed, 0.25, 2, 0.05),
    starCount: boundedNumber(source.starCount, DEFAULT_SETTINGS.starCount, 20, 240, 1),
    showFps: typeof source.showFps === 'boolean' ? source.showFps : DEFAULT_SETTINGS.showFps,
    animationSpeed: boundedNumber(source.animationSpeed, DEFAULT_SETTINGS.animationSpeed, 0.5, 2, 0.05),
    avatarGrid: boundedNumber(source.avatarGrid, DEFAULT_SETTINGS.avatarGrid, 4, 20, 1),
    avatarDuration: boundedNumber(source.avatarDuration, DEFAULT_SETTINGS.avatarDuration, 0.2, 1.5, 0.05),
    avatarStagger: boundedNumber(source.avatarStagger, DEFAULT_SETTINGS.avatarStagger, 0.25, 1, 0.05),
    trailEnabled: typeof source.trailEnabled === 'boolean' ? source.trailEnabled : DEFAULT_SETTINGS.trailEnabled,
    trailSize: boundedNumber(source.trailSize, DEFAULT_SETTINGS.trailSize, 4, 16, 1),
    trailLifetime: boundedNumber(source.trailLifetime, DEFAULT_SETTINGS.trailLifetime, 120, 900, 20),
    trailDensity: boundedNumber(source.trailDensity, DEFAULT_SETTINGS.trailDensity, 0.25, 1.5, 0.05),
    galleryPreset: source.galleryPreset && ['liquid', 'ribbon', 'vortex', 'arch'].includes(source.galleryPreset) ? source.galleryPreset : DEFAULT_SETTINGS.galleryPreset,
    gallerySpeed: boundedNumber(source.gallerySpeed, DEFAULT_SETTINGS.gallerySpeed, 0.5, 2, 0.05),
    galleryBend: boundedNumber(source.galleryBend, DEFAULT_SETTINGS.galleryBend, 0, 0.65, 0.01),
  };
}

function parseSettings(serialized: string | null): MotionSettings {
  if (!serialized) return { ...DEFAULT_SETTINGS };
  try {
    const stored: unknown = JSON.parse(serialized);
    if (!stored || typeof stored !== 'object' || !('version' in stored) || (stored.version !== 1 && stored.version !== STORAGE_VERSION)) return { ...DEFAULT_SETTINGS };
    return normalizeSettings('settings' in stored ? stored.settings : undefined);
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function readSettings() {
  try { return parseSettings(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return { ...DEFAULT_SETTINGS }; }
}

function settingsEqual(a: MotionSettings, b: MotionSettings) {
  return (Object.keys(DEFAULT_SETTINGS) as (keyof MotionSettings)[]).every(key => a[key] === b[key]);
}

type SettingsContext = {
  settings: MotionSettings;
  updateSettings: (patch: Partial<MotionSettings>) => void;
  resetSettings: () => void;
};
const MotionSettingsContext = createContext<SettingsContext>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
});

export function MotionSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(readSettings);
  const updateSettings = useCallback((patch: Partial<MotionSettings>) => {
    setSettings(previous => {
      const next = normalizeSettings({ ...previous, ...patch });
      return settingsEqual(previous, next) ? previous : next;
    });
  }, []);
  const resetSettings = useCallback(() => updateSettings(DEFAULT_SETTINGS), [updateSettings]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, settings })); }
    catch { /* Controls remain usable when browser storage is unavailable. */ }
  }, [settings]);

  useEffect(() => {
    const syncSettings = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = parseSettings(event.newValue);
      setSettings(previous => settingsEqual(previous, next) ? previous : next);
    };
    window.addEventListener('storage', syncSettings);
    return () => window.removeEventListener('storage', syncSettings);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue('--motion-duration-factor');
    root.style.setProperty('--motion-duration-factor', String(1 / settings.animationSpeed));
    return () => {
      if (previous) root.style.setProperty('--motion-duration-factor', previous);
      else root.style.removeProperty('--motion-duration-factor');
    };
  }, [settings.animationSpeed]);

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings, updateSettings, resetSettings]);
  return <MotionSettingsContext.Provider value={value}>{children}</MotionSettingsContext.Provider>;
}

export function useMotionSettings() { return useContext(MotionSettingsContext); }

const COPY = {
  en: {
    title: 'Motion settings', intro: 'Find a pace that feels right. Changes apply as you adjust them.',
    close: 'Close motion settings', stars: 'Background stars', starSpeed: 'Star speed', starCount: 'Number of stars',
    mobile: 'Mobile screens show up to 120 stars.', components: 'Component animation speed',
    fps: 'Show FPS', fpsHint: 'Browser frame rate, including idle frames. This is a live estimate.',
    reset: 'Reset to defaults', saved: 'Saved on this browser', reduced: 'Your device prefers reduced motion. Animation stays reduced.',
    slow: 'Slower', fast: 'Faster', fewer: 'Fewer', more: 'More',
    portrait: 'Profile photo', grid: 'Pixel grid', duration: 'Transition duration', stagger: 'Pixel stagger',
    trail: 'Pointer trail', trailEnabled: 'Show pixel trail', trailHint: 'Follows a mouse in black or white to match your theme.',
    trailSize: 'Pixel size', trailLifetime: 'Fade duration', trailDensity: 'Trail density',
    gallery: 'Project gallery', preset: 'Movement style', gallerySpeed: 'Gallery speed', galleryBend: 'Curve strength',
    liquid: 'Liquid', ribbon: 'Ribbon', vortex: 'Vortex', arch: 'Arch',
  },
  th: {
    title: 'ตั้งค่าการเคลื่อนไหว', intro: 'เลือกจังหวะที่สบายตา การเปลี่ยนแปลงมีผลทันที',
    close: 'ปิดการตั้งค่าการเคลื่อนไหว', stars: 'ดาวพื้นหลัง', starSpeed: 'ความเร็วของดาว', starCount: 'จำนวนดาว',
    mobile: 'หน้าจอมือถือแสดงดาวสูงสุด 120 ดวง', components: 'ความเร็วแอนิเมชันขององค์ประกอบ',
    fps: 'แสดง FPS', fpsHint: 'อัตราเฟรมของเบราว์เซอร์ รวมเฟรมขณะไม่มีการเคลื่อนไหว เป็นค่าประมาณแบบสด',
    reset: 'คืนค่าเริ่มต้น', saved: 'บันทึกในเบราว์เซอร์นี้', reduced: 'อุปกรณ์ของคุณเลือกให้ลดการเคลื่อนไหว แอนิเมชันจะยังคงลดลง',
    slow: 'ช้าลง', fast: 'เร็วขึ้น', fewer: 'น้อย', more: 'มาก',
    portrait: 'รูปโปรไฟล์', grid: 'จำนวนพิกเซลต่อด้าน', duration: 'เวลาเปลี่ยนรูป', stagger: 'จังหวะไล่พิกเซล',
    trail: 'เอฟเฟกต์ตามเมาส์', trailEnabled: 'แสดงพิกเซลตามเมาส์', trailHint: 'พิกเซลสีดำหรือขาวตามธีมของคุณ เมื่อใช้เมาส์',
    trailSize: 'ขนาดพิกเซล', trailLifetime: 'เวลาจางหาย', trailDensity: 'ความหนาแน่น',
    gallery: 'แกลเลอรีโปรเจกต์', preset: 'รูปแบบการเคลื่อนไหว', gallerySpeed: 'ความเร็วแกลเลอรี', galleryBend: 'ความโค้ง',
    liquid: 'พลิ้วไหว', ribbon: 'ริบบิ้น', vortex: 'วนหมุน', arch: 'โค้ง',
  },
};

function multiplier(value: number) { return `${Number(value.toFixed(2))}×`; }

function SettingRange({ id, label, value, min, max, step, display, disabled = false, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number;
  display?: string; disabled?: boolean; onChange: (value: number) => void;
}) {
  const formatted = display ?? String(value);
  return <div className="motion-settings-range">
    <div className="motion-settings-label"><label htmlFor={id}>{label}</label><output htmlFor={id}>{formatted}</output></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-valuetext={formatted} onChange={event => onChange(event.currentTarget.valueAsNumber)} />
  </div>;
}

export function MotionSettingsDialog({ open, onClose, language }: { open: boolean; onClose: () => void; language: 'en' | 'th' }) {
  const { settings, updateSettings, resetSettings } = useMotionSettings();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const outsideDown = useRef(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const reducedMotion = useReducedMotion();
  const text = COPY[language];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    setClosing(false);
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const alreadyLocked = document.body.classList.contains('motion-settings-locked');
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('motion-settings-locked');
    dialog.scrollTop = 0;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      if (dialog.open) dialog.close();
      if (!alreadyLocked) document.body.classList.remove('motion-settings-locked');
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      outsideDown.current = false;
    };
  }, [open]);

  const requestClose = () => {
    if (closing || closeTimer.current) return;
    if (reducedMotion) { onClose(); return; }
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 220 / settings.animationSpeed);
  };

  const isOutside = (event: React.PointerEvent<HTMLDialogElement> | React.MouseEvent<HTMLDialogElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };

  return <dialog
    ref={dialogRef}
    id={`${id}-dialog`}
    className="motion-settings-dialog"
    lang={language}
    data-closing={closing || undefined}
    aria-labelledby={`${id}-title`}
    aria-describedby={`${id}-intro`}
    onCancel={event => { event.preventDefault(); requestClose(); }}
    onClose={() => { if (open) onClose(); }}
    onPointerDown={event => { outsideDown.current = isOutside(event); }}
    onClick={event => { if (outsideDown.current && isOutside(event)) requestClose(); outsideDown.current = false; }}
  >
    <div className="motion-settings-heading"><Gauge size={18} aria-hidden="true" /><h2 id={`${id}-title`}>{text.title}</h2><button ref={closeRef} type="button" className="motion-settings-close" onClick={requestClose} aria-label={text.close}><X size={18} aria-hidden="true" /></button></div>
    <p id={`${id}-intro`} className="motion-settings-intro">{text.intro}</p>
    <fieldset className="motion-settings-group"><legend>{text.stars}</legend>
      <div className="motion-settings-range">
        <div className="motion-settings-label"><label htmlFor={`${id}-star-speed`}>{text.starSpeed}</label><output htmlFor={`${id}-star-speed`}>{multiplier(settings.starSpeed)}</output></div>
        <input id={`${id}-star-speed`} type="range" min="0.25" max="2" step="0.05" value={settings.starSpeed} aria-valuetext={multiplier(settings.starSpeed)} onChange={event => updateSettings({ starSpeed: event.currentTarget.valueAsNumber })} />
        <div className="motion-settings-scale" aria-hidden="true"><span>{text.slow}</span><span>{text.fast}</span></div>
      </div>
      <div className="motion-settings-range">
        <div className="motion-settings-label"><label htmlFor={`${id}-star-count`}>{text.starCount}</label><output htmlFor={`${id}-star-count`}>{settings.starCount}</output></div>
        <input id={`${id}-star-count`} type="range" min="20" max="240" step="1" value={settings.starCount} aria-describedby={`${id}-mobile`} onChange={event => updateSettings({ starCount: event.currentTarget.valueAsNumber })} />
        <div className="motion-settings-scale" aria-hidden="true"><span>{text.fewer}</span><span>{text.more}</span></div>
        <p id={`${id}-mobile`} className="motion-settings-hint">{text.mobile}</p>
      </div>
    </fieldset>
    <div className="motion-settings-range motion-settings-component-speed">
      <div className="motion-settings-label"><label htmlFor={`${id}-animation-speed`}>{text.components}</label><output htmlFor={`${id}-animation-speed`}>{multiplier(settings.animationSpeed)}</output></div>
      <input id={`${id}-animation-speed`} type="range" min="0.5" max="2" step="0.05" value={settings.animationSpeed} aria-valuetext={multiplier(settings.animationSpeed)} onChange={event => updateSettings({ animationSpeed: event.currentTarget.valueAsNumber })} />
      <div className="motion-settings-scale" aria-hidden="true"><span>{text.slow}</span><span>{text.fast}</span></div>
    </div>
    <details className="motion-settings-details"><summary>{text.portrait}</summary><div className="motion-settings-details-body">
      <SettingRange id={`${id}-avatar-grid`} label={text.grid} value={settings.avatarGrid} min={4} max={20} step={1} display={`${settings.avatarGrid} × ${settings.avatarGrid}`} onChange={avatarGrid => updateSettings({ avatarGrid })} />
      <SettingRange id={`${id}-avatar-duration`} label={text.duration} value={settings.avatarDuration} min={0.2} max={1.5} step={0.05} display={`${settings.avatarDuration} s`} onChange={avatarDuration => updateSettings({ avatarDuration })} />
      <SettingRange id={`${id}-avatar-stagger`} label={text.stagger} value={settings.avatarStagger} min={0.25} max={1} step={0.05} display={`${Math.round(settings.avatarStagger * 100)}%`} onChange={avatarStagger => updateSettings({ avatarStagger })} />
    </div></details>
    <details className="motion-settings-details"><summary>{text.trail}</summary><div className="motion-settings-details-body">
      <div className="motion-settings-toggle-row"><div><label htmlFor={`${id}-trail-enabled`}>{text.trailEnabled}</label><p className="motion-settings-hint" id={`${id}-trail-hint`}>{text.trailHint}</p></div><input id={`${id}-trail-enabled`} type="checkbox" checked={settings.trailEnabled} aria-describedby={`${id}-trail-hint`} onChange={event => updateSettings({ trailEnabled: event.currentTarget.checked })} /></div>
      <SettingRange id={`${id}-trail-size`} label={text.trailSize} value={settings.trailSize} min={4} max={16} step={1} display={`${settings.trailSize} px`} disabled={!settings.trailEnabled} onChange={trailSize => updateSettings({ trailSize })} />
      <SettingRange id={`${id}-trail-lifetime`} label={text.trailLifetime} value={settings.trailLifetime} min={120} max={900} step={20} display={`${settings.trailLifetime} ms`} disabled={!settings.trailEnabled} onChange={trailLifetime => updateSettings({ trailLifetime })} />
      <SettingRange id={`${id}-trail-density`} label={text.trailDensity} value={settings.trailDensity} min={0.25} max={1.5} step={0.05} display={multiplier(settings.trailDensity)} disabled={!settings.trailEnabled} onChange={trailDensity => updateSettings({ trailDensity })} />
    </div></details>
    <details className="motion-settings-details"><summary>{text.gallery}</summary><div className="motion-settings-details-body">
      <div className="motion-settings-select-row"><label htmlFor={`${id}-gallery-preset`}>{text.preset}</label><select id={`${id}-gallery-preset`} value={settings.galleryPreset} onChange={event => updateSettings({ galleryPreset: event.currentTarget.value as MotionSettings['galleryPreset'] })}>{(['liquid', 'ribbon', 'vortex', 'arch'] as const).map(preset => <option key={preset} value={preset}>{text[preset]}</option>)}</select></div>
      <SettingRange id={`${id}-gallery-speed`} label={text.gallerySpeed} value={settings.gallerySpeed} min={0.5} max={2} step={0.05} display={multiplier(settings.gallerySpeed)} onChange={gallerySpeed => updateSettings({ gallerySpeed })} />
      <SettingRange id={`${id}-gallery-bend`} label={text.galleryBend} value={settings.galleryBend} min={0} max={0.65} step={0.01} display={`${Math.round(settings.galleryBend * 100)}%`} onChange={galleryBend => updateSettings({ galleryBend })} />
    </div></details>
    <div className="motion-settings-fps-row"><div><label htmlFor={`${id}-fps`}>{text.fps}</label><p id={`${id}-fps-hint`} className="motion-settings-hint">{text.fpsHint}</p></div><input id={`${id}-fps`} type="checkbox" checked={settings.showFps} aria-describedby={`${id}-fps-hint`} onChange={event => updateSettings({ showFps: event.currentTarget.checked })} /></div>
    {reducedMotion && <p className="motion-settings-reduced">{text.reduced}</p>}
    <div className="motion-settings-footer"><button type="button" className="motion-settings-reset" onClick={resetSettings}><RotateCcw size={13} aria-hidden="true" />{text.reset}</button><span>{text.saved}</span></div>
  </dialog>;
}

/** Samples browser callbacks; canvas and component drawing may run at a lower rate. */
export function FpsOverlay() {
  const { settings } = useMotionSettings();
  const valueRef = useRef<HTMLSpanElement>(null);
  const enabled = settings.showFps;

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let sampleStart = 0;
    let sampleFrames = 0;
    let disposed = false;
    const tick = (timestamp: number) => {
      if (disposed || document.hidden) return;
      if (!sampleStart) sampleStart = timestamp;
      else sampleFrames++;
      const elapsed = timestamp - sampleStart;
      if (elapsed >= 500) {
        if (valueRef.current) valueRef.current.textContent = String(Math.round(sampleFrames * 1000 / elapsed));
        sampleStart = timestamp;
        sampleFrames = 0;
      }
      frame = window.requestAnimationFrame(tick);
    };
    const resume = () => {
      window.cancelAnimationFrame(frame);
      sampleStart = 0;
      sampleFrames = 0;
      if (valueRef.current) valueRef.current.textContent = '—';
      if (!document.hidden) frame = window.requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', resume);
    resume();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [enabled]);

  return enabled ? <div className="motion-fps-overlay" aria-hidden="true"><span ref={valueRef}>—</span><span>FPS</span></div> : null;
}
