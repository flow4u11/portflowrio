import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Gauge, Pipette, RotateCcw, X, Sparkles, Stars, MousePointer2, Images, UserRound, SlidersHorizontal, Palette, Check } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { SettingsSelect } from './SettingsSelect';
import { ShinyText } from './ShinyText';
import { useIdleMotion } from './useIdleMotion';
import { createDefaultSettings, NAME_PALETTES, namePalette, nameGradientStyle, normalizeSettings, parseSettings, STORAGE_KEY, STORAGE_VERSION, type MotionSettings } from './motion-settings-model';
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
    background: 'Background', backgroundStyle: 'Background style', starsStyle: 'Three stars', snowStyle: 'Pixel snow',
    snowSpeed: 'Snow speed', snowDensity: 'Snow density', snowFlakeSize: 'Flake size', snowPixelResolution: 'Pixel detail', snowDirection: 'Wind direction', snowVariant: 'Flake shape', snowBrightness: 'Brightness', snowDepth: 'Depth', square: 'Square', round: 'Round', snowflake: 'Snowflake', snowHint: 'Colors follow your theme. Reduced motion keeps the snow still.',
    navigation: 'Settings categories', motion: 'Motion & performance', panelHint: 'Make it feel like you.', title: 'Settings', intro: 'Find a pace that feels right. Changes apply as you adjust them.',
    close: 'Close motion settings', starScale: 'Star scale', direction: 'Gradient direction', fiveStops: 'Five', spectrum: 'Spectrum', ember: 'Ember', pastel: 'Pastel', secondColor: 'Second color', fourthColor: 'Fourth color', shine: 'Name shine', shineEnabled: 'Show shiny text', shineSpeed: 'Sweep duration', shineDelay: 'Pause between sweeps', shineWidth: 'Shine width', shineSoftness: 'Softness', shineAngle: 'Shine angle', shineDirection: 'Sweep direction', left: 'Left', right: 'Right', shineAuto: 'Match theme color', shineColor: 'Shine color', stars: 'Background stars', starSpeed: 'Star speed', starCount: 'Number of stars',
    mobile: 'Mobile screens show up to 120 stars.', components: 'Component animation speed',
    fps: 'Show FPS', fpsHint: 'Browser frame rate, including idle frames. This is a live estimate.',
    reset: 'Reset to defaults', saved: 'Saved on this browser', reduced: 'Your device prefers reduced motion. Animation stays reduced.',
    slow: 'Slower', fast: 'Faster', fewer: 'Fewer', more: 'More',
    portrait: 'Profile photo', grid: 'Pixel grid', duration: 'Transition duration', stagger: 'Pixel stagger',
    trail: 'Pointer trail', trailEnabled: 'Show pixel trail', trailHint: 'Follows a mouse in black or white to match your theme.',
    trailSize: 'Pixel size', trailLifetime: 'Fade duration', trailDensity: 'Trail density',
    gallery: 'Project gallery', preset: 'Movement style', gallerySpeed: 'Gallery speed', galleryBend: 'Curve strength',
    galleryIntro: 'Entrance', galleryFit: 'Image shape', galleryGap: 'Card spacing', galleryRadius: 'Corner radius', galleryHeight: 'Card height', galleryTilt: 'Lens angle', galleryRoundness: 'Lens roundness', galleryReach: 'Curve reach', galleryDispersion: 'Color separation', galleryLiquid: 'Liquid movement', galleryFollow: 'Follow cursor', galleryHover: 'Focus on hover', galleryEntranceHint: 'The entrance plays on your first visit to the gallery. Changing its style applies on the next page load.',
    rise: 'Rise', bloom: 'Bloom', spin: 'Spin', deal: 'Deal', none: 'None', natural: 'Natural', portraitFit: 'Portrait', squareFit: 'Square', landscape: 'Landscape',
    liquid: 'Liquid', ribbon: 'Ribbon', vortex: 'Vortex', arch: 'Arch',
    galleryAnimated: 'Animate gallery', galleryHint: 'On by default on desktop; off on mobile. Your choice is saved.',
    marquee: 'Toolkit & technology', marqueeEnabled: 'Animate scrolling rows', marqueeHint: 'Turn off to show every item in wrapped rows.',
    name: 'Name gradient', palette: 'Palette', monochrome: 'Monochrome', aurora: 'Aurora', sunrise: 'Sunrise', ocean: 'Ocean', custom: 'Custom',
    stops: 'Color stops', twoStops: 'Two', threeStops: 'Three', startColor: 'First color', middleColor: 'Middle color', endColor: 'Last color', nameSpeed: 'Gradient speed', namePreview: 'Live name preview', nameHint: 'Colors blend with your theme to keep the name readable.',
  },
  th: {
    background: 'พื้นหลัง', backgroundStyle: 'รูปแบบพื้นหลัง', starsStyle: 'ดาวสามมิติ', snowStyle: 'หิมะพิกเซล',
    snowSpeed: 'ความเร็วหิมะ', snowDensity: 'ความหนาแน่น', snowFlakeSize: 'ขนาดเกล็ด', snowPixelResolution: 'ความละเอียดพิกเซล', snowDirection: 'ทิศทางลม', snowVariant: 'รูปทรงเกล็ด', snowBrightness: 'ความสว่าง', snowDepth: 'ระยะลึก', square: 'สี่เหลี่ยม', round: 'วงกลม', snowflake: 'เกล็ดหิมะ', snowHint: 'สีเปลี่ยนตามธีม และหยุดนิ่งเมื่อเลือกการลดการเคลื่อนไหว',
    navigation: 'หมวดการตั้งค่า', motion: 'การเคลื่อนไหวและประสิทธิภาพ', panelHint: 'ปรับให้เป็นจังหวะของคุณ', title: 'ตั้งค่า', intro: 'เลือกจังหวะที่สบายตา การเปลี่ยนแปลงมีผลทันที',
    close: 'ปิดการตั้งค่าการเคลื่อนไหว', starScale: 'ขนาดดาว', direction: 'ทิศทางสีไล่เฉด', fiveStops: 'ห้าสี', spectrum: 'สเปกตรัม', ember: 'เปลวไฟ', pastel: 'พาสเทล', secondColor: 'สีที่สอง', fourthColor: 'สีที่สี่', shine: 'ประกายแสงบนชื่อ', shineEnabled: 'เปิด Shiny Text', shineSpeed: 'ระยะเวลากวาดแสง', shineDelay: 'เวลาพักระหว่างรอบ', shineWidth: 'ความกว้างแสง', shineSoftness: 'ความนุ่มของแสง', shineAngle: 'มุมแสง', shineDirection: 'ทิศทางกวาดแสง', left: 'ซ้าย', right: 'ขวา', shineAuto: 'ใช้สีตามธีม', shineColor: 'สีประกายแสง', stars: 'ดาวพื้นหลัง', starSpeed: 'ความเร็วของดาว', starCount: 'จำนวนดาว',
    mobile: 'หน้าจอมือถือแสดงดาวสูงสุด 120 ดวง', components: 'ความเร็วแอนิเมชันขององค์ประกอบ',
    fps: 'แสดง FPS', fpsHint: 'อัตราเฟรมของเบราว์เซอร์ รวมเฟรมขณะไม่มีการเคลื่อนไหว เป็นค่าประมาณแบบสด',
    reset: 'คืนค่าเริ่มต้น', saved: 'บันทึกในเบราว์เซอร์นี้', reduced: 'อุปกรณ์ของคุณเลือกให้ลดการเคลื่อนไหว แอนิเมชันจะยังคงลดลง',
    slow: 'ช้าลง', fast: 'เร็วขึ้น', fewer: 'น้อย', more: 'มาก',
    portrait: 'รูปโปรไฟล์', grid: 'จำนวนพิกเซลต่อด้าน', duration: 'เวลาเปลี่ยนรูป', stagger: 'จังหวะไล่พิกเซล',
    trail: 'เอฟเฟกต์ตามเมาส์', trailEnabled: 'แสดงพิกเซลตามเมาส์', trailHint: 'พิกเซลสีดำหรือขาวตามธีมของคุณ เมื่อใช้เมาส์',
    trailSize: 'ขนาดพิกเซล', trailLifetime: 'เวลาจางหาย', trailDensity: 'ความหนาแน่น',
    gallery: 'แกลเลอรีโปรเจกต์', preset: 'รูปแบบการเคลื่อนไหว', gallerySpeed: 'ความเร็วแกลเลอรี', galleryBend: 'ความโค้ง',
    galleryIntro: 'แอนิเมชันเปิดตัว', galleryFit: 'รูปทรงภาพ', galleryGap: 'ระยะห่างการ์ด', galleryRadius: 'มุมโค้งการ์ด', galleryHeight: 'ความสูงการ์ด', galleryTilt: 'มุมเลนส์', galleryRoundness: 'ความมนเลนส์', galleryReach: 'ระยะโค้ง', galleryDispersion: 'การแยกสี', galleryLiquid: 'ความพลิ้วไหว', galleryFollow: 'เลนส์ตามเมาส์', galleryHover: 'ขยายเมื่อวางเมาส์', galleryEntranceHint: 'แอนิเมชันเล่นเมื่อเข้าแกลเลอรีครั้งแรก รูปแบบใหม่จะใช้เมื่อโหลดหน้าเว็บครั้งถัดไป',
    rise: 'ลอยขึ้น', bloom: 'เบ่งบาน', spin: 'หมุน', deal: 'คลี่การ์ด', none: 'ปิด', natural: 'สัดส่วนเดิม', portraitFit: 'แนวตั้ง', squareFit: 'จัตุรัส', landscape: 'แนวนอน',
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
    <span ref={ref} className="animated-name" data-running={enabled && active} style={nameGradientStyle(settings)} aria-hidden="true">flowrio.<span className="animated-name-gradient">flowrio.</span><ShinyText overlay text="flowrio." disabled={!enabled || !settings.nameShineEnabled} speed={settings.nameShineSpeed / settings.animationSpeed} delay={settings.nameShineDelay / settings.animationSpeed} angle={settings.nameShineAngle} shineWidth={settings.nameShineWidth} softness={settings.nameShineSoftness} direction={settings.nameShineDirection} shineColor={settings.nameShineAutoColor ? 'var(--text)' : settings.nameShineColor} /></span>
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
  const [category, setCategory] = useState<'name' | 'shine' | 'background' | 'motion' | 'gallery' | 'portrait' | 'trail'>('name');
  const scrollRef = useRef<HTMLDivElement>(null);
  const categories = [
    { key: 'name', label: text.name, icon: Palette },
    { key: 'shine', label: text.shine, icon: Sparkles },
    { key: 'background', label: text.background, icon: Stars },
    { key: 'motion', label: text.motion, icon: SlidersHorizontal },
    { key: 'gallery', label: text.gallery, icon: Images },
    { key: 'portrait', label: text.portrait, icon: UserRound },
    { key: 'trail', label: text.trail, icon: MousePointer2 },
  ] as const;
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [category, open]);

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
    <header className="motion-settings-header">
      <div className="motion-settings-heading"><Gauge size={21} aria-hidden="true" /><h2 id={`${id}-title`}>{text.title}</h2><button ref={closeRef} type="button" className="motion-settings-close" onClick={requestClose} aria-label={text.close}><X size={20} aria-hidden="true" /></button></div>
      <p id={`${id}-intro`} className="motion-settings-intro">{text.intro}</p>
    </header>
    <div className="motion-settings-workspace">
      <nav className="motion-settings-nav" aria-label={text.navigation}>
        {categories.map(({ key, icon: Icon, label }) => <button key={key} type="button" aria-current={category === key ? 'page' : undefined} aria-controls={`${id}-panel`} onClick={() => setCategory(key)}><Icon size={17} aria-hidden="true" /><span>{label}</span></button>)}
      </nav>
      <div className="motion-settings-scroll" ref={scrollRef}>
        <section key={category} className="motion-settings-panel" id={`${id}-panel`} aria-labelledby={`${id}-panel-title`}>
          <div className="motion-settings-panel-heading"><span className="motion-settings-eyebrow">{text.panelHint}</span><h3 id={`${id}-panel-title`}>{categories.find(item => item.key === category)?.label}</h3></div>
          {category === 'name' && <section className="motion-settings-controls motion-settings-name-panel">
      <NameGradientPreview settings={settings} label={text.namePreview} enabled={open && !closing} />
      <div className="motion-settings-palette-heading"><span>{text.palette}</span><button type="button" aria-label={text.monochrome} title={text.monochrome} onClick={() => updateSettings({ nameGradientPreset: 'monochrome' })}><RotateCcw size={15} aria-hidden="true" /></button></div>
      <div className="motion-settings-color-chooser">
        <div className="motion-settings-color-rail" style={{ background: `linear-gradient(90deg, ${namePalette(settings).join(', ')})` }}>
          {(['nameGradientStart', 'nameGradientSecond', 'nameGradientMiddle', 'nameGradientFourth', 'nameGradientEnd'] as const).map((key, index) => <label className="motion-settings-color-stop" key={key} title={[text.startColor, text.secondColor, text.middleColor, text.fourthColor, text.endColor][index]}>
            <Pipette size={20} aria-hidden="true" /><input type="color" aria-label={[text.startColor, text.secondColor, text.middleColor, text.fourthColor, text.endColor][index]} value={namePalette(settings)[index]} onChange={event => {
              const palette = namePalette(settings);
              updateSettings({ nameGradientPreset: 'custom', nameGradientStart: palette[0], nameGradientSecond: palette[1], nameGradientMiddle: palette[2], nameGradientFourth: palette[3], nameGradientEnd: palette[4], [key]: event.currentTarget.value, nameGradientStops: 5 });
            }} />
          </label>)}
        </div>
        <div className="motion-settings-presets" role="group" aria-label={text.palette}>{(['spectrum', 'sunrise', 'ember', 'ocean', 'aurora', 'pastel'] as const).map(preset => <button key={preset} type="button" aria-label={text[preset]} title={text[preset]} aria-pressed={settings.nameGradientPreset === preset} style={{ background: `linear-gradient(90deg, ${NAME_PALETTES[preset].join(', ')})` }} onClick={() => updateSettings({ nameGradientPreset: preset, nameGradientStops: 5 })} />)}</div>
      </div>
      <SettingsSelect id={`${id}-name-stops`} label={text.stops} value={settings.nameGradientStops} options={[{ value: '2', label: text.twoStops }, { value: '3', label: text.threeStops }, { value: '5', label: text.fiveStops }]} onChange={value => updateSettings({ nameGradientStops: Number(value) as 2 | 3 | 5 })} />
      <SettingRange id={`${id}-name-speed`} label={text.nameSpeed} value={settings.nameGradientSpeed} min={0.5} max={2} step={0.05} display={multiplier(settings.nameGradientSpeed)} onChange={nameGradientSpeed => updateSettings({ nameGradientSpeed })} />
      <SettingRange id={`${id}-name-direction`} label={text.direction} value={settings.nameGradientDirection} min={0} max={360} step={5} display={`${settings.nameGradientDirection}°`} onChange={nameGradientDirection => updateSettings({ nameGradientDirection })} />
      <p className="motion-settings-hint">{text.nameHint}</p>
    </section>}
          {category === 'shine' && <section className="motion-settings-controls">
      <NameGradientPreview settings={settings} label={text.namePreview} enabled={open && !closing} />
      <div className="motion-settings-toggle-row"><label htmlFor={`${id}-shine-enabled`}>{text.shineEnabled}</label><input id={`${id}-shine-enabled`} type="checkbox" checked={settings.nameShineEnabled} onChange={event => updateSettings({ nameShineEnabled: event.currentTarget.checked })} /></div>
      <SettingRange id={`${id}-shine-speed`} label={text.shineSpeed} value={settings.nameShineSpeed} min={0.5} max={6} step={0.1} display={`${settings.nameShineSpeed} s`} disabled={!settings.nameShineEnabled} onChange={nameShineSpeed => updateSettings({ nameShineSpeed })} />
      <SettingRange id={`${id}-shine-delay`} label={text.shineDelay} value={settings.nameShineDelay} min={0} max={5} step={0.1} display={`${settings.nameShineDelay} s`} disabled={!settings.nameShineEnabled} onChange={nameShineDelay => updateSettings({ nameShineDelay })} />
      <SettingRange id={`${id}-shine-width`} label={text.shineWidth} value={settings.nameShineWidth} min={5} max={80} step={1} display={`${settings.nameShineWidth}%`} disabled={!settings.nameShineEnabled} onChange={nameShineWidth => updateSettings({ nameShineWidth })} />
      <SettingRange id={`${id}-shine-softness`} label={text.shineSoftness} value={settings.nameShineSoftness} min={0} max={1} step={0.05} display={`${Math.round(settings.nameShineSoftness * 100)}%`} disabled={!settings.nameShineEnabled} onChange={nameShineSoftness => updateSettings({ nameShineSoftness })} />
      <SettingRange id={`${id}-shine-angle`} label={text.shineAngle} value={settings.nameShineAngle} min={0} max={180} step={5} display={`${settings.nameShineAngle}°`} disabled={!settings.nameShineEnabled} onChange={nameShineAngle => updateSettings({ nameShineAngle })} />
      <SettingsSelect id={`${id}-shine-direction`} label={text.shineDirection} value={settings.nameShineDirection} disabled={!settings.nameShineEnabled} options={(['left', 'right'] as const).map(value => ({ value, label: text[value] }))} onChange={nameShineDirection => updateSettings({ nameShineDirection: nameShineDirection as 'left' | 'right' })} />
      <div className="motion-settings-toggle-row"><label htmlFor={`${id}-shine-auto`}>{text.shineAuto}</label><input id={`${id}-shine-auto`} type="checkbox" checked={settings.nameShineAutoColor} disabled={!settings.nameShineEnabled} onChange={event => updateSettings({ nameShineAutoColor: event.currentTarget.checked })} /></div>
      {!settings.nameShineAutoColor && <div className="motion-settings-color"><label htmlFor={`${id}-shine-color`}>{text.shineColor}</label><input id={`${id}-shine-color`} type="color" value={settings.nameShineColor} disabled={!settings.nameShineEnabled} onChange={event => updateSettings({ nameShineColor: event.currentTarget.value })} /></div>}
    </section>}
          {category === 'background' && <section className="motion-settings-controls motion-settings-background">
      <SettingsSelect id={`${id}-background-style`} label={text.backgroundStyle} value={settings.backgroundStyle} options={[{ value: 'stars', label: text.starsStyle }, { value: 'snow', label: text.snowStyle }]} onChange={backgroundStyle => updateSettings({ backgroundStyle: backgroundStyle as MotionSettings['backgroundStyle'] })} />
      {settings.backgroundStyle === 'stars' ? <div className="motion-settings-controls">
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
      <SettingRange id={`${id}-star-scale`} label={text.starScale} value={settings.starScale} min={0.5} max={3} step={0.05} display={multiplier(settings.starScale)} onChange={starScale => updateSettings({ starScale })} />
      </div> : <div className="motion-settings-snow-controls">
        <SettingsSelect id={`${id}-snow-variant`} label={text.snowVariant} value={settings.snowVariant} options={(['square', 'round', 'snowflake'] as const).map(value => ({ value, label: text[value] }))} onChange={snowVariant => updateSettings({ snowVariant: snowVariant as MotionSettings['snowVariant'] })} />
        <SettingRange id={`${id}-snow-speed`} label={text.snowSpeed} value={settings.snowSpeed} min={0.25} max={2} step={0.05} display={multiplier(settings.snowSpeed)} onChange={snowSpeed => updateSettings({ snowSpeed })} />
        <SettingRange id={`${id}-snow-density`} label={text.snowDensity} value={settings.snowDensity} min={0.1} max={0.6} step={0.05} display={`${Math.round(settings.snowDensity * 100)}%`} onChange={snowDensity => updateSettings({ snowDensity })} />
        <SettingRange id={`${id}-snow-size`} label={text.snowFlakeSize} value={settings.snowFlakeSize} min={0.005} max={0.04} step={0.005} display={`${Math.round(settings.snowFlakeSize * 1000)}`} onChange={snowFlakeSize => updateSettings({ snowFlakeSize })} />
        <SettingRange id={`${id}-snow-pixels`} label={text.snowPixelResolution} value={settings.snowPixelResolution} min={100} max={360} step={10} onChange={snowPixelResolution => updateSettings({ snowPixelResolution })} />
        <SettingRange id={`${id}-snow-direction`} label={text.snowDirection} value={settings.snowDirection} min={0} max={360} step={5} display={`${settings.snowDirection}°`} onChange={snowDirection => updateSettings({ snowDirection })} />
        <SettingRange id={`${id}-snow-brightness`} label={text.snowBrightness} value={settings.snowBrightness} min={0.4} max={1.4} step={0.05} display={multiplier(settings.snowBrightness)} onChange={snowBrightness => updateSettings({ snowBrightness })} />
        <SettingRange id={`${id}-snow-depth`} label={text.snowDepth} value={settings.snowDepth} min={6} max={16} step={1} onChange={snowDepth => updateSettings({ snowDepth })} />
        <p className="motion-settings-hint">{text.snowHint}</p>
      </div>}
    </section>}
          {category === 'motion' && <section className="motion-settings-controls"><div className="motion-settings-range motion-settings-component-speed">
      <div className="motion-settings-label"><label htmlFor={`${id}-animation-speed`}>{text.components}</label><output htmlFor={`${id}-animation-speed`}>{multiplier(settings.animationSpeed)}</output></div>
      <input id={`${id}-animation-speed`} type="range" min="0.5" max="2" step="0.05" value={settings.animationSpeed} aria-valuetext={multiplier(settings.animationSpeed)} onChange={event => updateSettings({ animationSpeed: event.currentTarget.valueAsNumber })} />
      <div className="motion-settings-scale" aria-hidden="true"><span>{text.slow}</span><span>{text.fast}</span></div>
    </div><section className="motion-settings-controls">
      <div className="motion-settings-toggle-row"><div><label htmlFor={`${id}-marquee-enabled`}>{text.marqueeEnabled}</label><p className="motion-settings-hint" id={`${id}-marquee-hint`}>{text.marqueeHint}</p></div><input id={`${id}-marquee-enabled`} type="checkbox" checked={settings.marqueeEnabled} aria-describedby={`${id}-marquee-hint`} onChange={event => updateSettings({ marqueeEnabled: event.currentTarget.checked })} /></div>
    </section><div className="motion-settings-fps-row"><div><label htmlFor={`${id}-fps`}>{text.fps}</label><p id={`${id}-fps-hint`} className="motion-settings-hint">{text.fpsHint}</p></div><input id={`${id}-fps`} type="checkbox" checked={settings.showFps} aria-describedby={`${id}-fps-hint`} onChange={event => updateSettings({ showFps: event.currentTarget.checked })} /></div></section>}
          {category === 'gallery' && <section className="motion-settings-controls">
      <div className="motion-settings-toggle-row"><div><label htmlFor={`${id}-gallery-animated`}>{text.galleryAnimated}</label><p className="motion-settings-hint" id={`${id}-gallery-hint`}>{text.galleryHint}</p></div><input id={`${id}-gallery-animated`} type="checkbox" checked={settings.galleryAnimated} aria-describedby={`${id}-gallery-hint`} onChange={event => updateSettings({ galleryAnimated: event.currentTarget.checked })} /></div>
      <SettingsSelect id={`${id}-gallery-preset`} label={text.preset} value={settings.galleryPreset} disabled={!settings.galleryAnimated} options={(['liquid', 'ribbon', 'vortex', 'arch'] as const).map(value => ({ value, label: text[value] }))} onChange={galleryPreset => updateSettings({ galleryPreset: galleryPreset as MotionSettings['galleryPreset'] })} />
      <SettingRange id={`${id}-gallery-speed`} label={text.gallerySpeed} value={settings.gallerySpeed} disabled={!settings.galleryAnimated} min={0.5} max={2} step={0.05} display={multiplier(settings.gallerySpeed)} onChange={gallerySpeed => updateSettings({ gallerySpeed })} />
      <SettingRange id={`${id}-gallery-bend`} label={text.galleryBend} value={settings.galleryBend} disabled={!settings.galleryAnimated} min={0} max={0.65} step={0.01} display={`${Math.round(settings.galleryBend * 100)}%`} onChange={galleryBend => updateSettings({ galleryBend })} />
      <SettingsSelect id={`${id}-gallery-intro`} label={text.galleryIntro} value={settings.galleryIntro} disabled={!settings.galleryAnimated} options={(['rise', 'bloom', 'spin', 'deal', 'none'] as const).map(value => ({ value, label: text[value] }))} onChange={galleryIntro => updateSettings({ galleryIntro: galleryIntro as MotionSettings['galleryIntro'] })} />
      <SettingsSelect id={`${id}-gallery-fit`} label={text.galleryFit} value={settings.galleryFit} disabled={!settings.galleryAnimated} options={(['natural', 'portrait', 'square', 'landscape'] as const).map(value => ({ value, label: text[value === 'portrait' ? 'portraitFit' : value === 'square' ? 'squareFit' : value] }))} onChange={galleryFit => updateSettings({ galleryFit: galleryFit as MotionSettings['galleryFit'] })} />
      <SettingRange id={`${id}-gallery-height`} label={text.galleryHeight} value={settings.galleryCardHeight} disabled={!settings.galleryAnimated} min={.4} max={.8} step={.04} display={`${Math.round(settings.galleryCardHeight * 100)}%`} onChange={galleryCardHeight => updateSettings({ galleryCardHeight })} />
      <SettingRange id={`${id}-gallery-gap`} label={text.galleryGap} value={settings.galleryGap} disabled={!settings.galleryAnimated} min={8} max={64} step={4} display={`${settings.galleryGap} px`} onChange={galleryGap => updateSettings({ galleryGap })} />
      <SettingRange id={`${id}-gallery-radius`} label={text.galleryRadius} value={settings.galleryRadius} disabled={!settings.galleryAnimated} min={0} max={48} step={4} display={`${settings.galleryRadius} px`} onChange={galleryRadius => updateSettings({ galleryRadius })} />
      <SettingRange id={`${id}-gallery-tilt`} label={text.galleryTilt} value={settings.galleryTilt} disabled={!settings.galleryAnimated} min={0} max={90} step={1} display={`${settings.galleryTilt}°`} onChange={galleryTilt => updateSettings({ galleryTilt })} />
      {(['galleryRoundness', 'galleryReach', 'galleryDispersion', 'galleryLiquid'] as const).map(key => <SettingRange key={key} id={`${id}-${key}`} label={text[key]} value={settings[key]} disabled={!settings.galleryAnimated} min={key === 'galleryReach' ? .1 : 0} max={key === 'galleryReach' ? .8 : 1} step={key === 'galleryReach' ? .02 : key === 'galleryLiquid' ? .04 : .05} display={`${Math.round(settings[key] * 100)}%`} onChange={value => updateSettings({ [key]: value })} />)}
      <div className="motion-settings-toggle-row"><label htmlFor={`${id}-gallery-follow`}>{text.galleryFollow}</label><input id={`${id}-gallery-follow`} type="checkbox" disabled={!settings.galleryAnimated} checked={settings.galleryFollowCursor} onChange={event => updateSettings({ galleryFollowCursor: event.currentTarget.checked })} /></div>
      <div className="motion-settings-toggle-row"><label htmlFor={`${id}-gallery-hover`}>{text.galleryHover}</label><input id={`${id}-gallery-hover`} type="checkbox" disabled={!settings.galleryAnimated} checked={settings.galleryHoverFocus} onChange={event => updateSettings({ galleryHoverFocus: event.currentTarget.checked })} /></div>
      <p className="motion-settings-hint">{text.galleryEntranceHint}</p>
    </section>}
          {category === 'portrait' && <section className="motion-settings-controls">
      <SettingRange id={`${id}-avatar-grid`} label={text.grid} value={settings.avatarGrid} min={4} max={20} step={1} display={`${settings.avatarGrid} × ${settings.avatarGrid}`} onChange={avatarGrid => updateSettings({ avatarGrid })} />
      <SettingRange id={`${id}-avatar-duration`} label={text.duration} value={settings.avatarDuration} min={0.2} max={1.5} step={0.05} display={`${settings.avatarDuration} s`} onChange={avatarDuration => updateSettings({ avatarDuration })} />
      <SettingRange id={`${id}-avatar-stagger`} label={text.stagger} value={settings.avatarStagger} min={0.25} max={1} step={0.05} display={`${Math.round(settings.avatarStagger * 100)}%`} onChange={avatarStagger => updateSettings({ avatarStagger })} />
    </section>}
          {category === 'trail' && <section className="motion-settings-controls">
      <div className="motion-settings-toggle-row"><div><label htmlFor={`${id}-trail-enabled`}>{text.trailEnabled}</label><p className="motion-settings-hint" id={`${id}-trail-hint`}>{text.trailHint}</p></div><input id={`${id}-trail-enabled`} type="checkbox" checked={settings.trailEnabled} aria-describedby={`${id}-trail-hint`} onChange={event => updateSettings({ trailEnabled: event.currentTarget.checked })} /></div>
      <SettingRange id={`${id}-trail-size`} label={text.trailSize} value={settings.trailSize} min={4} max={16} step={1} display={`${settings.trailSize} px`} disabled={!settings.trailEnabled} onChange={trailSize => updateSettings({ trailSize })} />
      <SettingRange id={`${id}-trail-lifetime`} label={text.trailLifetime} value={settings.trailLifetime} min={120} max={900} step={20} display={`${settings.trailLifetime} ms`} disabled={!settings.trailEnabled} onChange={trailLifetime => updateSettings({ trailLifetime })} />
      <SettingRange id={`${id}-trail-density`} label={text.trailDensity} value={settings.trailDensity} min={0.25} max={1.5} step={0.05} display={multiplier(settings.trailDensity)} disabled={!settings.trailEnabled} onChange={trailDensity => updateSettings({ trailDensity })} />
    </section>}
          {reducedMotion && <p className="motion-settings-reduced">{text.reduced}</p>}
        </section>
      </div>
    </div>
    <footer className="motion-settings-footer"><button type="button" className="motion-settings-reset" onClick={resetSettings}><RotateCcw size={15} aria-hidden="true" />{text.reset}</button><span><Check size={13} aria-hidden="true" />{text.saved}</span></footer>
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
