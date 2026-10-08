import test from 'node:test';
import assert from 'node:assert/strict';
import { assistedVelocity, nearPlaygroundHome, playgroundFlight, pulledVelocity, scatterPlaygroundPieces } from './hero-playground-physics.ts';

const bounds = { width: 780, height: 760, top: 120, bottom: 672 };
const hoop = { x: 390, y: 365, halfWidth: 41 };

test('assisted shots from around the court descend through the actual rim opening', () => {
  for (const x of [35, 100, 290, 390, 600, 745]) {
    for (const y of [160, 220, 365, 470, 620]) {
      const from = { x, y };
      const flight = playgroundFlight(from, assistedVelocity(from, hoop, bounds.top), hoop, bounds);
      assert.equal(flight.scored, true, `shot from ${x}, ${y}`);
      assert.ok(Math.abs(flight.crossing.x - hoop.x) < 1);
      const crossingFrame = flight.frames.findIndex((frame, index) => index > 0 && flight.frames[index - 1].y < hoop.y && frame.y >= hoop.y);
      assert.ok(crossingFrame > 0);
    }
  }
});

test('an arc passing up through the rim then descending outside it is a miss', () => {
  const from = { x: 390, y: 425 };
  const flight = playgroundFlight(from, { x: 130, y: -580 }, hoop, bounds);
  assert.equal(flight.scored, false);
  assert.ok(flight.crossing.x > hoop.x + hoop.halfWidth);
});

test('pulling changes the visible shot; a large sideways adjustment can miss', () => {
  const from = { x: 290, y: 540 };
  const base = assistedVelocity(from, hoop, bounds.top);
  assert.equal(playgroundFlight(from, base, hoop, bounds).scored, true);
  assert.equal(playgroundFlight(from, pulledVelocity(base, { x: -100, y: 0 }), hoop, bounds).scored, false);
});

test('fast wild shots stay finite and inside the court for at most two seconds', () => {
  for (let seed = 1; seed <= 1500; seed++) {
    const from = { x: 30 + (seed * 17) % 720, y: 145 + (seed * 43) % 490 };
    const velocity = { x: (seed * 79) % 2900 - 1450, y: (seed * 31) % 2050 - 1500 };
    const flight = playgroundFlight(from, velocity, hoop, bounds);
    assert.ok(flight.duration > 0 && flight.duration <= 2000);
    for (const frame of flight.frames) {
      assert.ok(Number.isFinite(frame.x) && Number.isFinite(frame.y) && Number.isFinite(frame.rotation));
      assert.ok(frame.x >= 18 && frame.x <= bounds.width - 18);
      assert.ok(frame.y >= bounds.top + 10 && frame.y <= bounds.bottom - 10);
    }
    assert.equal(flight.frames[0].offset, 0);
    assert.equal(flight.frames.at(-1).offset, 1);
  }
});

test('component snapping uses a bounded home radius rather than any drop position', () => {
  const home = { x: 100, y: 200 };
  assert.equal(nearPlaygroundHome({ x: 130, y: 200 }, home, 116, 116), true);
  assert.equal(nearPlaygroundHome({ x: 180, y: 200 }, home, 116, 116), false);
  assert.equal(nearPlaygroundHome({ x: 164, y: 200 }, home, 500, 500), false);
});

test('mobile scattering is deterministic and keeps every target in the usable court', () => {
  const mobile = { width: 320, height: 650, top: 120, bottom: 562 };
  const mobileHoop = { x: 160, y: 312, halfWidth: 41 };
  const homes = [
    { x: 160, y: 180, width: 116, height: 116, kind: 'part' },
    { x: 160, y: 370, width: 255, height: 44, kind: 'part' },
    { x: 160, y: 410, width: 220, height: 16, kind: 'part' },
    { x: 160, y: 530, width: 177, height: 49, kind: 'part' },
    ...Array.from({ length: 20 }, (_, index) => ({ x: 55 + index * 10, y: 300, width: 44, height: 44, kind: 'letter' })),
  ];
  const origin = { x: 160, y: 300 };
  const targets = scatterPlaygroundPieces(homes, origin, mobile, mobileHoop);
  assert.deepEqual(targets, scatterPlaygroundPieces(homes, origin, mobile, mobileHoop));
  targets.forEach((target, index) => {
    assert.ok(target.x - homes[index].width / 2 >= 12);
    assert.ok(target.x + homes[index].width / 2 <= 308);
    assert.ok(target.y - homes[index].height / 2 >= mobile.top);
    assert.ok(target.y + homes[index].height / 2 <= mobile.bottom);
  });
});
