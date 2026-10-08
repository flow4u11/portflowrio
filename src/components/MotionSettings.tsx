import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Gauge, RotateCcw, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useIdleMotion } from './useIdleMotion';
import { createDefaultSettings, NAME_PALETTES, nameGradientStyle, normalizeSettings, parseSettings, STORAGE_KEY, STORAGE_VERSION, type MotionSettings } from './motion-settings-model';
import './motion-settings.css';
import './animated-name.css';
export type { MotionSettings } from './motion-settings-model';

const DEFAULT_SETTINGS = createDefaultSettings();
function isMobileScreen() { return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches; }
function readSettings() {
  try { return parseSettings(window.localStorage.getItem(STORAGE_KEY), isMobileScreen()); }
  catch { return createDefaultSettings(isMobileScreen()); }
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
  const resetSettings = useCallback(() => updateSettings(createDefaultSettings(isMobileScreen())), [updateSettings]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, settings })); }
    catch { /* Controls remain usable when browser storage is unavailable. */ }
  }, [settings]);

  useEffect(() => {
    const syncSettings = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = parseSettings(event.newValue, isMobileScreen());
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
    galleryAnimated: 'Animate gallery', galleryHint: 'On by default on desktop; off on mobile. Your choice is saved.',
    marquee: 'Toolkit & technology', marqueeEnabled: 'Animate scrolling rows', marqueeHint: 'Turn off to show every item in wrapped rows.',
    name: 'Name gradient', palette: 'Palette', monochrome: 'Monochrome', aurora: 'Aurora', sunrise: 'Sunrise', ocean: 'Ocean', custom: 'Custom',
    stops: 'Color stops', twoStops: 'Two', threeStops: 'Three', startColor: 'First color', middleColor: 'Middle color', endColor: 'Last color', nameSpeed: 'Gradient speed', namePreview: 'Live name preview', nameHint: 'Colors blend with your theme to keep the name readable.',
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
    galleryAnimated: 'เปิดแอนิเมชันแกลเลอรี', galleryHint: 'ค่าเริ่มต้นเปิดบนเดสก์ท็อปและปิดบนมือถือ ระบบจะจำค่าที่คุณเลือก',
    marquee: 'เครื่องมือและเทคโนโลยี', marqueeEnabled: 'เปิดการเลื่อนแถว', marqueeHint: 'ปิดเพื่อแสดงทุกรายการในแถวที่ตัดบรรทัดได้',
    name: 'สีไล่เฉดของชื่อ', palette: 'ชุดสี', monochrome: 'ขาวดำ', aurora: 'ออโรรา', sunrise: 'แสงอรุณ', ocean: 'มหาสมุทร', custom: 'กำหนดเอง',
    stops: 'จำนวนสี', twoStops: 'สองสี', threeStops: 'สามสี', startColor: 'สีแรก', middleColor: 'สีกลาง', endColor: 'สีสุดท้าย', nameSpeed: 'ความเร็วสีไล่เฉด', namePreview: 'ตัวอย่างชื่อแบบสด', nameHint: 'สีจะผสมกับธีมเพื่อให้ชื่อยังอ่านได้ชัดเจน',
  },
};

function multiplier(value: number) { return `${Number(value.toFixed(2))}×`; }

function NameGradientPreview({ settings, label, enabled }: { settings: MotionSettings; label: string; enabled: boolean }) {
  const { ref, active } = useIdleMotion<HTMLSpanElement>();
  return <div className="motion-settings-name-preview" role="img" aria-label={label}>
    <span ref={ref} className="animated-name" data-running={enabled && active} style={nameGradientStyle(settings)} aria-hidden="true">flowrio.<span className="animated-name-gradient">flowrio.</span></span>
  </div>;
}

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
    <details className="motion-settings-details"><summary>{text.marquee}</summary><div className="motion-settings-details-body">
      <div className="motion-settings-toggle-row"><div><label htmlFor={`${id}-marquee-enabled`}>{text.marqueeEnabled}</label><p className="motion-settings-hint" id={`${id}-marquee-hint`}>{text.marqueeHint}</p></div><input id={`${id}-marquee-enabled`} type="checkbox" checked={settings.marqueeEnabled} aria-describedby={`${id}-marquee-hint`} onChange={event => updateSettings({ marqueeEnabled: event.currentTarget.checked })} /></div>
    </div></details>
    <details className="motion-settings-details"><summary>{text.name}</summary><div className="motion-settings-details-body">
      <NameGradientPreview settings={settings} label={text.namePreview} enabled={open && !closing} />
      <div className="motion-settings-select-row"><label htmlFor={`${id}-name-palette`}>{text.palette}</label><select id={`${id}-name-palette`} value={settings.nameGradientPreset} onChange={event => {
        const nameGradientPreset = event.currentTarget.value as MotionSettings['nameGradientPreset'];
        const palette = nameGradientPreset === 'custom' ? null : NAME_PALETTES[nameGradientPreset];
        updateSettings({ nameGradientPreset, ...(palette ? { nameGradientStart: palette[0], nameGradientMiddle: palette[1], nameGradientEnd: palette[2] } : {}) });
      }}>{(['monochrome', 'aurora', 'sunrise', 'ocean', 'custom'] as const).map(preset => <option key={preset} value={preset}>{text[preset]}</option>)}</select></div>
      <div className="motion-settings-select-row"><label htmlFor={`${id}-name-stops`}>{text.stops}</label><select id={`${id}-name-stops`} value={settings.nameGradientStops} onChange={event => updateSettings({ nameGradientStops: Number(event.currentTarget.value) as 2 | 3 })}><option value="2">{text.twoStops}</option><option value="3">{text.threeStops}</option></select></div>
      <div className="motion-settings-colors">
        {([{ key: 'nameGradientStart', label: text.startColor }, ...(settings.nameGradientStops === 3 ? [{ key: 'nameGradientMiddle', label: text.middleColor }] : []), { key: 'nameGradientEnd', label: text.endColor }] as { key: 'nameGradientStart' | 'nameGradientMiddle' | 'nameGradientEnd'; label: string }[]).map(({ key, label }) => <div className="motion-settings-color" key={key}><label htmlFor={`${id}-${key}`}>{label}</label><input id={`${id}-${key}`} type="color" value={settings[key]} onChange={event => updateSettings({ nameGradientPreset: 'custom', [key]: event.currentTarget.value })} /></div>)}
      </div>
      <SettingRange id={`${id}-name-speed`} label={text.nameSpeed} value={settings.nameGradientSpeed} min={0.5} max={2} step={0.05} display={multiplier(settings.nameGradientSpeed)} onChange={nameGradientSpeed => updateSettings({ nameGradientSpeed })} />
      <p className="motion-settings-hint">{text.nameHint}</p>
    </div></details>
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
      <div className="motion-settings-toggle-row"><div><label htmlFor={`${id}-gallery-animated`}>{text.galleryAnimated}</label><p className="motion-settings-hint" id={`${id}-gallery-hint`}>{text.galleryHint}</p></div><input id={`${id}-gallery-animated`} type="checkbox" checked={settings.galleryAnimated} aria-describedby={`${id}-gallery-hint`} onChange={event => updateSettings({ galleryAnimated: event.currentTarget.checked })} /></div>
      <div className="motion-settings-select-row"><label htmlFor={`${id}-gallery-preset`}>{text.preset}</label><select id={`${id}-gallery-preset`} value={settings.galleryPreset} disabled={!settings.galleryAnimated} onChange={event => updateSettings({ galleryPreset: event.currentTarget.value as MotionSettings['galleryPreset'] })}>{(['liquid', 'ribbon', 'vortex', 'arch'] as const).map(preset => <option key={preset} value={preset}>{text[preset]}</option>)}</select></div>
      <SettingRange id={`${id}-gallery-speed`} label={text.gallerySpeed} value={settings.gallerySpeed} disabled={!settings.galleryAnimated} min={0.5} max={2} step={0.05} display={multiplier(settings.gallerySpeed)} onChange={gallerySpeed => updateSettings({ gallerySpeed })} />
      <SettingRange id={`${id}-gallery-bend`} label={text.galleryBend} value={settings.galleryBend} disabled={!settings.galleryAnimated} min={0} max={0.65} step={0.01} display={`${Math.round(settings.galleryBend * 100)}%`} onChange={galleryBend => updateSettings({ galleryBend })} />
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
