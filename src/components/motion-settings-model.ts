export type NameGradientPreset = 'monochrome' | 'aurora' | 'sunrise' | 'ocean' | 'spectrum' | 'ember' | 'pastel' | 'custom';
export type MotionSettings = {
  starSpeed: number;
  starCount: number;
  starScale: number;
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
  galleryAnimated: boolean;
  marqueeEnabled: boolean;
  nameGradientPreset: NameGradientPreset;
  nameGradientStart: string;
  nameGradientSecond: string;
  nameGradientMiddle: string;
  nameGradientFourth: string;
  nameGradientEnd: string;
  nameGradientStops: 2 | 3 | 5;
  nameGradientSpeed: number;
  nameGradientDirection: number;
  nameShineEnabled: boolean;
  nameShineSpeed: number;
  nameShineDelay: number;
  nameShineWidth: number;
  nameShineSoftness: number;
  nameShineAngle: number;
  nameShineDirection: 'left' | 'right';
  nameShineColor: string;
  nameShineAutoColor: boolean;
  backgroundStyle: 'stars' | 'snow';
  snowSpeed: number;
  snowDensity: number;
  snowFlakeSize: number;
  snowPixelResolution: number;
  snowDirection: number;
  snowVariant: 'square' | 'round' | 'snowflake';
  snowBrightness: number;
  snowDepth: number;
};

export const STORAGE_KEY = 'portfolio-motion-settings';
export const STORAGE_VERSION = 5;
export const NAME_PALETTES = {
  monochrome: ['#151515', '#444444', '#777777', '#aaaaaa', '#dddddd'],
  aurora: ['#49d7be', '#6fcfbc', '#b9cc9b', '#e2acbd', '#cc81e3'],
  sunrise: ['#ff695e', '#ff9c53', '#f7cf65', '#f29db7', '#bd66ec'],
  ocean: ['#6ce0e2', '#72cdec', '#80a3ed', '#a286ef', '#c76cec'],
  spectrum: ['#61dbb7', '#dce96b', '#facb62', '#ea6ac1', '#7664ef'],
  ember: ['#9d1818', '#db3d16', '#fa741b', '#ffad20', '#ffe56b'],
  pastel: ['#bce990', '#dae896', '#f1dca5', '#f3bdc6', '#e7b7db'],
} as const;

export function namePalette(settings: MotionSettings): readonly string[] {
  return settings.nameGradientPreset === 'custom'
    ? [settings.nameGradientStart, settings.nameGradientSecond, settings.nameGradientMiddle, settings.nameGradientFourth, settings.nameGradientEnd]
    : NAME_PALETTES[settings.nameGradientPreset];
}

/** Adaptive defaults are sampled only on initialization/reset, never on resize. */
export function createDefaultSettings(mobile = false): MotionSettings {
  return {
    starSpeed: 1, starCount: 120, starScale: 1, showFps: false, animationSpeed: 1,
    avatarGrid: 10, avatarDuration: 0.55, avatarStagger: 0.85,
    trailEnabled: true, trailSize: 8, trailLifetime: 360, trailDensity: 0.75,
    galleryPreset: 'liquid', gallerySpeed: 1, galleryBend: 0.34,
    galleryAnimated: !mobile, marqueeEnabled: true,
    nameGradientPreset: 'monochrome', nameGradientStart: '#7978ee',
    nameGradientSecond: '#b08bcf', nameGradientMiddle: '#df80bf', nameGradientFourth: '#a4b5c0', nameGradientEnd: '#59c6b5',
    nameGradientStops: 5, nameGradientSpeed: 1, nameGradientDirection: 110,
    nameShineEnabled: true, nameShineSpeed: 2.4, nameShineDelay: 1.2,
    nameShineWidth: 35, nameShineSoftness: .8, nameShineAngle: 120,
    nameShineDirection: 'left', nameShineColor: '#ffffff', nameShineAutoColor: true,
    backgroundStyle: 'stars', snowSpeed: 1.25, snowDensity: 0.3,
    snowFlakeSize: 0.015, snowPixelResolution: 200, snowDirection: 125,
    snowVariant: 'square', snowBrightness: 0.9, snowDepth: 12,
  };
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number, step: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const bounded = Math.min(max, Math.max(min, value));
  return Number((Math.round(bounded / step) * step).toFixed(3));
}
function color(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
}

export function normalizeSettings(value: unknown, mobile = false): MotionSettings {
  const defaults = createDefaultSettings(mobile);
  const source = value && typeof value === 'object' ? value as Partial<MotionSettings> : {};
  return {
    starSpeed: boundedNumber(source.starSpeed, defaults.starSpeed, 0.25, 2, 0.05),
    starCount: boundedNumber(source.starCount, defaults.starCount, 20, 240, 1),
    starScale: boundedNumber(source.starScale, defaults.starScale, .5, 3, .05),
    showFps: typeof source.showFps === 'boolean' ? source.showFps : defaults.showFps,
    animationSpeed: boundedNumber(source.animationSpeed, defaults.animationSpeed, 0.5, 2, 0.05),
    avatarGrid: boundedNumber(source.avatarGrid, defaults.avatarGrid, 4, 20, 1),
    avatarDuration: boundedNumber(source.avatarDuration, defaults.avatarDuration, 0.2, 1.5, 0.05),
    avatarStagger: boundedNumber(source.avatarStagger, defaults.avatarStagger, 0.25, 1, 0.05),
    trailEnabled: typeof source.trailEnabled === 'boolean' ? source.trailEnabled : defaults.trailEnabled,
    trailSize: boundedNumber(source.trailSize, defaults.trailSize, 4, 16, 1),
    trailLifetime: boundedNumber(source.trailLifetime, defaults.trailLifetime, 120, 900, 20),
    trailDensity: boundedNumber(source.trailDensity, defaults.trailDensity, 0.25, 1.5, 0.05),
    galleryPreset: source.galleryPreset && ['liquid', 'ribbon', 'vortex', 'arch'].includes(source.galleryPreset) ? source.galleryPreset : defaults.galleryPreset,
    gallerySpeed: boundedNumber(source.gallerySpeed, defaults.gallerySpeed, 0.5, 2, 0.05),
    galleryBend: boundedNumber(source.galleryBend, defaults.galleryBend, 0, 0.65, 0.01),
    galleryAnimated: typeof source.galleryAnimated === 'boolean' ? source.galleryAnimated : defaults.galleryAnimated,
    marqueeEnabled: typeof source.marqueeEnabled === 'boolean' ? source.marqueeEnabled : defaults.marqueeEnabled,
    nameGradientPreset: source.nameGradientPreset && ['monochrome', 'aurora', 'sunrise', 'ocean', 'spectrum', 'ember', 'pastel', 'custom'].includes(source.nameGradientPreset) ? source.nameGradientPreset : defaults.nameGradientPreset,
    nameGradientStart: color(source.nameGradientStart, defaults.nameGradientStart),
    nameGradientSecond: color(source.nameGradientSecond, defaults.nameGradientSecond),
    nameGradientMiddle: color(source.nameGradientMiddle, defaults.nameGradientMiddle),
    nameGradientFourth: color(source.nameGradientFourth, defaults.nameGradientFourth),
    nameGradientEnd: color(source.nameGradientEnd, defaults.nameGradientEnd),
    nameGradientStops: source.nameGradientStops === 2 ? 2 : source.nameGradientStops === 3 ? 3 : 5,
    nameGradientSpeed: boundedNumber(source.nameGradientSpeed, defaults.nameGradientSpeed, 0.5, 2, 0.05),
    nameGradientDirection: boundedNumber(source.nameGradientDirection, defaults.nameGradientDirection, 0, 360, 5),
    nameShineEnabled: typeof source.nameShineEnabled === 'boolean' ? source.nameShineEnabled : defaults.nameShineEnabled,
    nameShineSpeed: boundedNumber(source.nameShineSpeed, defaults.nameShineSpeed, .5, 6, .1),
    nameShineDelay: boundedNumber(source.nameShineDelay, defaults.nameShineDelay, 0, 5, .1),
    nameShineWidth: boundedNumber(source.nameShineWidth, defaults.nameShineWidth, 5, 80, 1),
    nameShineSoftness: boundedNumber(source.nameShineSoftness, defaults.nameShineSoftness, 0, 1, .05),
    nameShineAngle: boundedNumber(source.nameShineAngle, defaults.nameShineAngle, 0, 180, 5),
    nameShineDirection: source.nameShineDirection === 'right' ? 'right' : 'left',
    nameShineColor: color(source.nameShineColor, defaults.nameShineColor),
    nameShineAutoColor: typeof source.nameShineAutoColor === 'boolean' ? source.nameShineAutoColor : defaults.nameShineAutoColor,
    backgroundStyle: source.backgroundStyle === 'snow' ? 'snow' : 'stars',
    snowSpeed: boundedNumber(source.snowSpeed, defaults.snowSpeed, 0.25, 2, 0.05),
    snowDensity: boundedNumber(source.snowDensity, defaults.snowDensity, 0.1, 0.6, 0.05),
    snowFlakeSize: boundedNumber(source.snowFlakeSize, defaults.snowFlakeSize, 0.005, 0.04, 0.005),
    snowPixelResolution: boundedNumber(source.snowPixelResolution, defaults.snowPixelResolution, 100, 360, 10),
    snowDirection: boundedNumber(source.snowDirection, defaults.snowDirection, 0, 360, 5),
    snowVariant: source.snowVariant && ['square', 'round', 'snowflake'].includes(source.snowVariant) ? source.snowVariant : defaults.snowVariant,
    snowBrightness: boundedNumber(source.snowBrightness, defaults.snowBrightness, 0.4, 1.4, 0.05),
    snowDepth: boundedNumber(source.snowDepth, defaults.snowDepth, 6, 16, 1),
  };
}

export function parseSettings(serialized: string | null, mobile = false): MotionSettings {
  if (!serialized) return createDefaultSettings(mobile);
  try {
    const stored: unknown = JSON.parse(serialized);
    if (!stored || typeof stored !== 'object' || !('version' in stored) || ![1, 2, 3, 4, STORAGE_VERSION].includes(stored.version as number)) return createDefaultSettings(mobile);
    return normalizeSettings('settings' in stored ? stored.settings : undefined, mobile);
  } catch { return createDefaultSettings(mobile); }
}

export function nameGradientStyle(settings: MotionSettings) {
  const speed = settings.animationSpeed * settings.nameGradientSpeed;
  const style: Record<string, string | number> = {
    '--name-gradient-duration': `${12 / speed}s`,
    '--name-gradient-steps': Math.max(45, Math.round(180 / speed)),
  };
  const palette = namePalette(settings);
  const selected = settings.nameGradientStops === 2 ? [palette[0], palette[4]] : settings.nameGradientStops === 3 ? [palette[0], palette[2], palette[4]] : palette;
  const colors = settings.nameGradientPreset === 'monochrome'
    ? ['var(--text, #050505)', 'var(--muted, #606060)', 'var(--text, #050505)', 'var(--muted, #606060)', 'var(--text, #050505)']
    : selected.map(stop => `color-mix(in srgb, var(--text, #050505) 35%, ${stop})`);
  style['--name-gradient-colors'] = `linear-gradient(${settings.nameGradientDirection}deg, ${[...colors, colors[0]].join(', ')})`;
  return style;
}
