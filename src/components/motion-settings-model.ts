export type NameGradientPreset = 'monochrome' | 'aurora' | 'sunrise' | 'ocean' | 'custom';
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
  galleryAnimated: boolean;
  marqueeEnabled: boolean;
  nameGradientPreset: NameGradientPreset;
  nameGradientStart: string;
  nameGradientMiddle: string;
  nameGradientEnd: string;
  nameGradientStops: 2 | 3;
  nameGradientSpeed: number;
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
export const STORAGE_VERSION = 4;
export const NAME_PALETTES = {
  monochrome: ['#555555', '#999999', '#555555'],
  aurora: ['#7978ee', '#df80bf', '#59c6b5'],
  sunrise: ['#e67561', '#e7bc65', '#c479b8'],
  ocean: ['#4e9adb', '#5cc9b7', '#8a8adf'],
} as const;

/** Adaptive defaults are sampled only on initialization/reset, never on resize. */
export function createDefaultSettings(mobile = false): MotionSettings {
  return {
    starSpeed: 1, starCount: 120, showFps: false, animationSpeed: 1,
    avatarGrid: 10, avatarDuration: 0.55, avatarStagger: 0.85,
    trailEnabled: true, trailSize: 8, trailLifetime: 360, trailDensity: 0.75,
    galleryPreset: 'liquid', gallerySpeed: 1, galleryBend: 0.34,
    galleryAnimated: !mobile, marqueeEnabled: true,
    nameGradientPreset: 'monochrome', nameGradientStart: '#7978ee',
    nameGradientMiddle: '#df80bf', nameGradientEnd: '#59c6b5',
    nameGradientStops: 3, nameGradientSpeed: 1,
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
    nameGradientPreset: source.nameGradientPreset && ['monochrome', 'aurora', 'sunrise', 'ocean', 'custom'].includes(source.nameGradientPreset) ? source.nameGradientPreset : defaults.nameGradientPreset,
    nameGradientStart: color(source.nameGradientStart, defaults.nameGradientStart),
    nameGradientMiddle: color(source.nameGradientMiddle, defaults.nameGradientMiddle),
    nameGradientEnd: color(source.nameGradientEnd, defaults.nameGradientEnd),
    nameGradientStops: source.nameGradientStops === 2 ? 2 : 3,
    nameGradientSpeed: boundedNumber(source.nameGradientSpeed, defaults.nameGradientSpeed, 0.5, 2, 0.05),
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
    if (!stored || typeof stored !== 'object' || !('version' in stored) || ![1, 2, 3, STORAGE_VERSION].includes(stored.version as number)) return createDefaultSettings(mobile);
    return normalizeSettings('settings' in stored ? stored.settings : undefined, mobile);
  } catch { return createDefaultSettings(mobile); }
}

export function nameGradientStyle(settings: MotionSettings) {
  const speed = settings.animationSpeed * settings.nameGradientSpeed;
  const style: Record<string, string | number> = {
    '--name-gradient-duration': `${12 / speed}s`,
    '--name-gradient-steps': Math.max(45, Math.round(180 / speed)),
  };
  if (settings.nameGradientPreset === 'monochrome') return style;
  const palette = settings.nameGradientPreset === 'custom'
    ? [settings.nameGradientStart, settings.nameGradientMiddle, settings.nameGradientEnd]
    : NAME_PALETTES[settings.nameGradientPreset];
  // Mixing each stop with the theme's text preserves legibility in both themes,
  // even when a custom stop is pure white or black.
  const colors = (settings.nameGradientStops === 2 ? [palette[0], palette[2]] : palette)
    .map(stop => `color-mix(in srgb, var(--text, #050505) 60%, ${stop})`);
  style['--name-gradient-colors'] = `linear-gradient(112deg, ${[...colors, colors[0]].join(', ')})`;
  return style;
}
