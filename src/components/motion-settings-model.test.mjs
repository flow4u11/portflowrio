import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSettings, normalizeSettings, parseSettings, nameGradientStyle, STORAGE_VERSION } from './motion-settings-model.ts';

test('first initialization and reset use adaptive gallery defaults', () => {
  assert.equal(parseSettings(null, false).galleryAnimated, true);
  assert.equal(parseSettings(null, true).galleryAnimated, false);
  assert.equal(createDefaultSettings(true).marqueeEnabled, true);
  assert.equal(createDefaultSettings(false).showFps, false);
  assert.equal(createDefaultSettings(true).nameGradientPreset, 'monochrome');
});

test('legacy storage keeps existing controls and migrates new settings', () => {
  for (const version of [1, 2, 3]) {
    const migrated = parseSettings(JSON.stringify({ version, settings: {
      starSpeed: 1.4, starCount: 197, showFps: true, animationSpeed: 0.75,
      avatarGrid: 14, avatarDuration: 0.8, avatarStagger: 0.45,
      trailEnabled: false, trailSize: 12, trailLifetime: 620, trailDensity: 1.2,
      galleryPreset: 'vortex', gallerySpeed: 1.5, galleryBend: 0.5,
    } }), true);
    assert.equal(migrated.galleryAnimated, false);
    assert.equal(migrated.marqueeEnabled, true);
    assert.equal(migrated.nameGradientPreset, 'monochrome');
    assert.equal(migrated.starCount, 197);
    assert.equal(migrated.animationSpeed, 0.75);
    assert.equal(migrated.avatarGrid, 14);
    assert.equal(migrated.trailEnabled, false);
    assert.equal(migrated.trailLifetime, 620);
    assert.equal(migrated.galleryPreset, 'vortex');
    assert.equal(migrated.galleryBend, 0.5);
  }
});

test('version three keeps explicit name, marquee and gallery choices while adding stars default', () => {
  const migrated = parseSettings(JSON.stringify({ version: 3, settings: {
    galleryAnimated: true, marqueeEnabled: false, nameGradientPreset: 'custom',
    nameGradientStart: '#123456', nameGradientMiddle: '#456789', nameGradientEnd: '#abcdef', nameGradientStops: 2, nameGradientSpeed: 1.7,
  } }), true);
  assert.equal(migrated.backgroundStyle, 'stars');
  assert.equal(migrated.galleryAnimated, true);
  assert.equal(migrated.marqueeEnabled, false);
  assert.equal(migrated.nameGradientPreset, 'custom');
  assert.equal(migrated.nameGradientStart, '#123456');
  assert.equal(migrated.nameGradientStops, 2);
  assert.equal(migrated.nameGradientSpeed, 1.7);
  assert.equal(migrated.snowDensity, 0.3);
});

test('snow controls clamp workload and retain subpixel size precision', () => {
  const bounded = normalizeSettings({ backgroundStyle: 'snow', snowSpeed: 999, snowDensity: 99, snowFlakeSize: 0.005, snowPixelResolution: 9000, snowDirection: -10, snowVariant: 'snowflake', snowBrightness: 999, snowDepth: 999 });
  assert.equal(bounded.backgroundStyle, 'snow');
  assert.equal(bounded.snowSpeed, 2);
  assert.equal(bounded.snowDensity, 0.6);
  assert.equal(bounded.snowFlakeSize, 0.005);
  assert.equal(bounded.snowPixelResolution, 360);
  assert.equal(bounded.snowDirection, 0);
  assert.equal(bounded.snowVariant, 'snowflake');
  assert.equal(bounded.snowBrightness, 1.4);
  assert.equal(bounded.snowDepth, 16);
  const invalid = normalizeSettings({ backgroundStyle: 'unknown', snowDensity: NaN, snowSpeed: Infinity, snowVariant: 'injected', snowDepth: -2 });
  assert.equal(invalid.backgroundStyle, 'stars');
  assert.equal(invalid.snowDensity, 0.3);
  assert.equal(invalid.snowSpeed, 1.25);
  assert.equal(invalid.snowVariant, 'square');
  assert.equal(invalid.snowDepth, 6);
});

test('persisted explicit overrides survive a different viewport default', () => {
  const mobileOverride = { ...createDefaultSettings(true), galleryAnimated: true, marqueeEnabled: false };
  const desktopOverride = { ...createDefaultSettings(false), galleryAnimated: false };
  assert.equal(parseSettings(JSON.stringify({ version: STORAGE_VERSION, settings: mobileOverride }), true).galleryAnimated, true);
  assert.equal(parseSettings(JSON.stringify({ version: STORAGE_VERSION, settings: mobileOverride }), false).marqueeEnabled, false);
  assert.equal(parseSettings(JSON.stringify({ version: STORAGE_VERSION, settings: desktopOverride }), true).galleryAnimated, false);
  assert.equal(parseSettings(JSON.stringify({ version: STORAGE_VERSION, settings: desktopOverride }), false).galleryAnimated, false);
});

test('invalid or unknown storage restores the current adaptive default', () => {
  for (const serialized of ['{', 'null', '[]', '{"version":99}', '{"version":"3"}']) {
    assert.deepEqual(parseSettings(serialized, true), createDefaultSettings(true));
  }
});

test('normalization bounds values and rejects color CSS injection', () => {
  const settings = normalizeSettings({
    starSpeed: -10, starCount: Infinity, gallerySpeed: 3, galleryAnimated: 'true',
    marqueeEnabled: 0, nameGradientPreset: 'unknown', nameGradientStops: 100,
    nameGradientStart: '#AABBCC', nameGradientMiddle: 'var(--text)',
    nameGradientEnd: '#ffffff); background:url(secret)', nameGradientSpeed: NaN,
  }, true);
  assert.equal(settings.starSpeed, 0.25);
  assert.equal(settings.starCount, 120);
  assert.equal(settings.gallerySpeed, 2);
  assert.equal(settings.galleryAnimated, false);
  assert.equal(settings.marqueeEnabled, true);
  assert.equal(settings.nameGradientPreset, 'monochrome');
  assert.equal(settings.nameGradientStart, '#aabbcc');
  assert.equal(settings.nameGradientMiddle, '#df80bf');
  assert.equal(settings.nameGradientEnd, '#59c6b5');
  assert.equal(settings.nameGradientStops, 3);
  assert.equal(settings.nameGradientSpeed, 1);
});

test('gradient styles are scoped, respect selected stops and retain theme contrast', () => {
  const base = createDefaultSettings();
  assert.equal(nameGradientStyle(base)['--name-gradient-colors'], undefined);
  const colored = nameGradientStyle({ ...base, nameGradientPreset: 'custom', nameGradientStart: '#111111', nameGradientMiddle: '#222222', nameGradientEnd: '#333333', nameGradientStops: 2, nameGradientSpeed: 2 });
  assert.equal(colored['--name-gradient-duration'], '6s');
  assert.match(colored['--name-gradient-colors'], /var\(--text, #050505\) 60%/);
  assert.match(colored['--name-gradient-colors'], /#111111/);
  assert.match(colored['--name-gradient-colors'], /#333333/);
  assert.doesNotMatch(colored['--name-gradient-colors'], /#222222/);
  assert.ok(nameGradientStyle({ ...base, nameGradientPreset: 'ocean', nameGradientStops: 3 })['--name-gradient-colors'].includes('#5cc9b7'));
});
