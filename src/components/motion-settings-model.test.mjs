import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSettings, normalizeSettings, parseSettings, nameGradientStyle, STORAGE_VERSION } from './motion-settings-model.ts';

test('first initialization and reset use adaptive gallery defaults', () => {
  assert.equal(parseSettings(null, false).galleryAnimated, true);
  assert.equal(parseSettings(null, true).galleryAnimated, false);
  assert.equal(createDefaultSettings(true).marqueeEnabled, true);
  assert.equal(createDefaultSettings(false).showFps, false);
  assert.equal(createDefaultSettings(true).nameGradientPreset, 'monochrome');
  const defaults = createDefaultSettings();
  assert.deepEqual([defaults.starSpeed, defaults.starCount, defaults.starScale, defaults.animationSpeed], [1.65, 210, 1.5, .9]);
  assert.deepEqual([defaults.nameGradientStops, defaults.nameGradientSpeed, defaults.nameGradientDirection], [5, 2, 110]);
  assert.deepEqual([defaults.nameShineSpeed, defaults.nameShineDelay, defaults.nameShineWidth, defaults.nameShineSoftness, defaults.nameShineAngle], [1.6, 1.5, 35, .8, 120]);
  assert.deepEqual([defaults.avatarGrid, defaults.avatarDuration, defaults.avatarStagger], [20, .55, .85]);
  assert.deepEqual([defaults.trailSize, defaults.trailLifetime, defaults.trailDensity, defaults.gallerySpeed, defaults.galleryBend], [6, 180, .4, 1.2, .05]);
});

test('legacy storage keeps existing controls and migrates new settings', () => {
  for (const version of [1, 2, 3, 4]) {
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
  assert.equal(settings.starCount, 210);
  assert.equal(settings.gallerySpeed, 2);
  assert.equal(settings.galleryAnimated, false);
  assert.equal(settings.marqueeEnabled, true);
  assert.equal(settings.nameGradientPreset, 'monochrome');
  assert.equal(settings.nameGradientStart, '#aabbcc');
  assert.equal(settings.nameGradientMiddle, '#df80bf');
  assert.equal(settings.nameGradientEnd, '#59c6b5');
  assert.equal(settings.nameGradientStops, 5);
  assert.equal(settings.nameGradientSpeed, 2);
});

test('gradient styles are scoped, respect selected stops and retain theme contrast', () => {
  const base = createDefaultSettings();
  assert.match(nameGradientStyle(base)['--name-gradient-colors'], /var\(--muted/);
  const colored = nameGradientStyle({ ...base, nameGradientPreset: 'custom', nameGradientStart: '#111111', nameGradientMiddle: '#222222', nameGradientEnd: '#333333', nameGradientStops: 2, nameGradientSpeed: 2 });
  assert.equal(colored['--name-gradient-duration'], (12 / (base.animationSpeed * 2)) + 's');
  assert.match(colored['--name-gradient-colors'], /var\(--text, #050505\) 35%/);
  assert.match(colored['--name-gradient-colors'], /#111111/);
  assert.match(colored['--name-gradient-colors'], /#333333/);
  assert.doesNotMatch(colored['--name-gradient-colors'], /#222222/);
  assert.ok(nameGradientStyle({ ...base, nameGradientPreset: 'ocean', nameGradientStops: 3 })['--name-gradient-colors'].includes('#6ce0e2'));
});


test('version four custom colors and background choices survive new controls', () => {
  const migrated = parseSettings(JSON.stringify({ version: 4, settings: {
    nameGradientPreset: 'custom', nameGradientStart: '#123456', nameGradientMiddle: '#345678', nameGradientEnd: '#abcdef', nameGradientStops: 3,
    backgroundStyle: 'snow', snowDensity: .45, nameGradientSpeed: 1.4,
  } }));
  assert.equal(migrated.nameGradientStart, '#123456');
  assert.equal(migrated.nameGradientMiddle, '#345678');
  assert.equal(migrated.nameGradientEnd, '#abcdef');
  assert.equal(migrated.nameGradientStops, 3);
  assert.equal(migrated.backgroundStyle, 'snow');
  assert.equal(migrated.snowDensity, .45);
  assert.equal(migrated.starScale, 1.5);
  assert.equal(migrated.nameShineEnabled, true);
});

test('new controls bound rendering costs and reject malformed stored colors', () => {
  const bounded = normalizeSettings({ starScale: 100, nameGradientDirection: -90, nameShineSpeed: Infinity,
    nameShineDelay: -9, nameShineWidth: 200, nameShineSoftness: 4, nameShineAngle: 900,
    nameShineDirection: 'up', nameShineEnabled: false, nameShineColor: 'url(secret)', nameGradientSecond: '#ABCDEF', nameGradientFourth: 'red' });
  assert.equal(bounded.starScale, 3);
  assert.equal(bounded.nameGradientDirection, 0);
  assert.equal(bounded.nameShineSpeed, 1.6);
  assert.equal(bounded.nameShineDelay, 0);
  assert.equal(bounded.nameShineWidth, 80);
  assert.equal(bounded.nameShineSoftness, 1);
  assert.equal(bounded.nameShineAngle, 180);
  assert.equal(bounded.nameShineDirection, 'left');
  assert.equal(bounded.nameShineEnabled, false);
  assert.equal(bounded.nameShineColor, '#ffffff');
  assert.equal(bounded.nameGradientSecond, '#abcdef');
  assert.equal(bounded.nameGradientFourth, '#a4b5c0');
});

test('five custom stops and gradient direction persist with shine overrides', () => {
  const settings = { ...createDefaultSettings(), nameGradientPreset: 'custom', nameGradientStops: 5,
    nameGradientStart: '#111111', nameGradientSecond: '#222222', nameGradientMiddle: '#333333', nameGradientFourth: '#444444', nameGradientEnd: '#555555',
    nameGradientDirection: 270, nameShineEnabled: false, nameShineDirection: 'right', nameShineAutoColor: false, nameShineColor: '#654321', starScale: 1.75 };
  const saved = parseSettings(JSON.stringify({ version: STORAGE_VERSION, settings }));
  assert.deepEqual(saved, settings);
  const gradient = nameGradientStyle(saved)['--name-gradient-colors'];
  assert.match(gradient, /^linear-gradient\(270deg/);
  for (const color of ['#111111', '#222222', '#333333', '#444444', '#555555']) assert.ok(gradient.includes(color));
});
