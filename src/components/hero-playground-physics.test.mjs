import test from 'node:test';
import assert from 'node:assert/strict';
import { playgroundBlast, playgroundHomeFlight, scatterPlaygroundPieces } from './hero-playground-physics.ts';

const bounds = { width: 780, height: 760, top: 120, bottom: 672 };
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

function assertFiniteFlight(flight) {
  assert.ok(flight.frames.length > 1 && flight.frames.length <= 80);
  flight.frames.forEach((frame, index) => {
    for (const key of ['x', 'y', 'rotation', 'depth', 'offset']) assert.ok(Number.isFinite(frame[key]), `${key} at frame ${index}`);
    if (index > 0) assert.ok(frame.offset > flight.frames[index - 1].offset);
  });
  assert.equal(flight.frames[0].offset, 0);
  assert.equal(flight.frames.at(-1).offset, 1);
  assert.deepEqual(flight.frames.at(-1), { ...flight.end, offset: 1 });
}

function assertContained(frame, size, area) {
  const radians = frame.rotation * Math.PI / 180;
  const width = Math.abs(Math.cos(radians)) * size.width + Math.abs(Math.sin(radians)) * size.height;
  const height = Math.abs(Math.sin(radians)) * size.width + Math.abs(Math.cos(radians)) * size.height;
  assert.ok(frame.x - width / 2 >= -1e-8 && frame.x + width / 2 <= area.width + 1e-8, `horizontal edge at ${frame.x}, angle ${frame.rotation}`);
  assert.ok(frame.y - height / 2 >= area.top - 1e-8 && frame.y + height / 2 <= area.bottom + 1e-8, `vertical edge at ${frame.y}, angle ${frame.rotation}`);
}

test('home return follows one direct monotonic line and settles every transform exactly', () => {
  const from = { x: 630, y: 200, rotation: -31, depth: -27 };
  const home = { x: 230, y: 570 };
  for (const velocity of [undefined, { x: -800, y: 600 }, { x: 900, y: -1100 }, { x: -1e6, y: 1e6 }]) {
    const flight = playgroundHomeFlight(from, home, velocity);
    assertFiniteFlight(flight);
    assert.deepEqual(flight.frames[0], { ...from, offset: 0 });
    assert.deepEqual(flight.end, { ...home, rotation: 0, depth: 0 });
    assert.ok(flight.duration >= 420 && flight.duration <= 700);
    let previousProgress = 0;
    for (const frame of flight.frames) {
      const progress = (frame.x - from.x) / (home.x - from.x);
      close(frame.y, from.y + (home.y - from.y) * progress);
      close(frame.rotation, from.rotation * (1 - progress));
      close(frame.depth, from.depth * (1 - progress));
      assert.ok(progress >= previousProgress - 1e-10 && progress <= 1 + 1e-10);
      previousProgress = progress;
    }
  }
});

test('home return has a smooth low-speed arrival, including vertical and identity paths', () => {
  for (const from of [{ x: 100, y: 600, rotation: 28, depth: 16 }, { x: 100, y: 100, rotation: 0, depth: 0 }, { x: 100, y: 100, rotation: 44, depth: -25 }]) {
    const flight = playgroundHomeFlight(from, { x: 100, y: 100 });
    assertFiniteFlight(flight);
    const beforeEnd = flight.frames.at(-2);
    assert.equal(flight.end.x, 100);
    assert.equal(flight.end.y, 100);
    assert.equal(flight.end.rotation, 0);
    assert.equal(flight.end.depth, 0);
    assert.ok(Math.hypot(beforeEnd.x - 100, beforeEnd.y - 100) < .05);
    assert.ok(Math.abs(beforeEnd.rotation) < .015 && Math.abs(beforeEnd.depth) < .015);
    for (const frame of flight.frames) {
      assert.equal(frame.x, 100);
      assert.ok(frame.y >= 100 && frame.y <= Math.max(100, from.y));
    }
  }
  const identity = playgroundHomeFlight({ x: 10, y: 20, rotation: 0 }, { x: 10, y: 20 });
  for (const frame of identity.frames) assert.deepEqual(frame, { x: 10, y: 20, rotation: 0, depth: 0, offset: frame.offset });
});

test('blast starts at the measured pose with an outward impulse and dissipates into the exact target', () => {
  const from = { x: 420, y: 350, rotation: 4, depth: 0 };
  const target = { x: 630, y: 470, rotation: -18, depth: -22 };
  const flight = playgroundBlast(from, target, { x: 280, y: 350 }, bounds, { width: 42, height: 48 }, 3);
  assertFiniteFlight(flight);
  assert.deepEqual(flight.frames[0], { ...from, offset: 0 });
  assert.deepEqual(flight.end, target);
  assert.ok(flight.duration >= 1200 && flight.duration <= 1500);
  const first = flight.frames[1];
  const firstTravel = Math.hypot(first.x - from.x, first.y - from.y);
  assert.ok(first.x > from.x && (first.x - from.x) / firstTravel > .95, 'initial movement points radially outward');
  const speeds = flight.frames.slice(1).map((frame, index) => Math.hypot(frame.x - flight.frames[index].x, frame.y - flight.frames[index].y) / ((frame.offset - flight.frames[index].offset) * flight.duration / 1000));
  assert.ok(Math.max(...speeds.slice(-6)) < Math.max(...speeds.slice(0, 12)) * .015, 'late speed dissipates rather than snapping to rest');
  const beforeEnd = flight.frames.at(-2);
  assert.ok(Math.hypot(beforeEnd.x - target.x, beforeEnd.y - target.y) < .15);
  assert.ok(Math.abs(beforeEnd.rotation - target.rotation) < .04);
  assert.ok(Math.abs(beforeEnd.depth - target.depth) < .04);
  for (const frame of flight.frames) assertContained(frame, { width: 42, height: 48 }, bounds);
  assert.deepEqual(flight, playgroundBlast(from, target, { x: 280, y: 350 }, bounds, { width: 42, height: 48 }, 3));
  const opposite = playgroundBlast(from, { x: 110, y: 220, rotation: 12, depth: -16 }, { x: 280, y: 350 }, bounds, { width: 42, height: 48 });
  assert.ok(opposite.frames[1].x > from.x, 'the radial impulse leads even when the resting target lies inward');
});

test('scatter uses the rotated footprint and distributes feasible pieces without overlap', () => {
  const homes = Array.from({ length: 16 }, (_, index) => ({ x: 255 + index * 15, y: 340, width: 38, height: 44, kind: 'letter' }));
  homes.unshift({ x: 390, y: 200, width: 116, height: 116, kind: 'part' });
  const origin = { x: 390, y: 340 };
  const targets = scatterPlaygroundPieces(homes, origin, bounds);
  assert.deepEqual(targets, scatterPlaygroundPieces(homes, origin, bounds));
  targets.forEach((target, index) => {
    assertContained(target, homes[index], bounds);
    assert.ok(Math.hypot(target.x - homes[index].x, target.y - homes[index].y) >= 100);
    assert.ok(target.depth >= -30 && target.depth <= 0);
    for (let other = 0; other < index; other++) {
      const centerDistance = Math.hypot(target.x - targets[other].x, target.y - targets[other].y);
      assert.ok(centerDistance > (Math.min(homes[index].width, homes[index].height) + Math.min(homes[other].width, homes[other].height)) / 2);
    }
  });
});

test('small mobile scatter and blasts stay within their rotated viewport bounds', () => {
  for (const width of [280, 320, 390]) {
    const mobile = { width, height: 650, top: 80, bottom: 590 };
    const homes = [
      { x: width / 2, y: 155, width: 116, height: 116, kind: 'part' },
      { x: width / 2, y: 330, width: width - 40, height: 44, kind: 'part' },
      { x: width / 2, y: 380, width: 220, height: 16, kind: 'part' },
      { x: width / 2, y: 530, width: 177, height: 49, kind: 'part' },
      ...Array.from({ length: 20 }, (_, index) => ({ x: 35 + index * (width - 70) / 20, y: 280, width: 24, height: 36, kind: 'letter' })),
    ];
    const origin = { x: width / 2, y: 280 };
    const targets = scatterPlaygroundPieces(homes, origin, mobile);
    targets.forEach((target, index) => {
      assertContained(target, homes[index], mobile);
      const flight = playgroundBlast({ x: homes[index].x, y: homes[index].y, rotation: 0, depth: 0 }, target, origin, mobile, homes[index], index);
      assertFiniteFlight(flight);
      assert.deepEqual(flight.end, target);
      for (const frame of flight.frames) assertContained(frame, homes[index], mobile);
    });
  }
});

test('extreme origins, outlying targets and collapsed areas yield finite bounded motion', () => {
  for (let seed = 1; seed <= 1200; seed++) {
    const area = { width: 80 + seed % 700, height: 700, top: 30, bottom: 610 };
    const size = { width: 12 + seed % 50, height: 18 + seed % 56 };
    const from = { x: area.width / 2, y: 300, rotation: 0, depth: 0 };
    const target = { x: (seed % 2 ? 1 : -1) * 1e5, y: seed % 3 ? -1e5 : 1e5, rotation: seed % 44 - 22, depth: -20 };
    const origin = { x: seed * -1e4, y: seed * 1e4 };
    const flight = playgroundBlast(from, target, origin, area, size, seed);
    assertFiniteFlight(flight);
    for (const frame of flight.frames) assertContained(frame, size, area);
  }
  const collapsed = { width: 0, height: 0, top: 100, bottom: -100 };
  const oversized = [{ x: 0, y: 0, width: 500, height: 900, kind: 'part' }];
  const [target] = scatterPlaygroundPieces(oversized, { x: 0, y: 0 }, collapsed);
  assert.ok(Number.isFinite(target.x) && Number.isFinite(target.y));
  assertFiniteFlight(playgroundBlast({ x: 0, y: 0, rotation: 0 }, target, { x: 0, y: 0 }, collapsed, oversized[0]));
});
