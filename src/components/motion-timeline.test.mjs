import test from 'node:test';
import assert from 'node:assert/strict';
import { holdTimeline, resumeTimeline } from './motion-timeline.ts';

function pendingClock() {
  return { currentTime: 320, playbackRate: 1, pending: false, playState: 'running',
    pause() { this.pending = true; },
    play() { this.pending = false; this.playState = 'running'; },
    tick(ms) { if (this.playState === 'running') this.currentTime += ms * this.playbackRate; },
  };
}
test('pending browser pause cannot advance the held sample', () => {
  const animation = pendingClock(), held = { current: null };
  holdTimeline(animation, held);
  animation.tick(5000);
  assert.equal(animation.currentTime, 320);
  holdTimeline(animation, held);
  resumeTimeline(animation, held, 1.5);
  assert.equal(animation.currentTime, 320);
  animation.tick(100);
  assert.equal(animation.currentTime, 470);
  assert.equal(held.current, null);
});
test('a geometry remap while held is the resume anchor', () => {
  const animation = pendingClock(), held = { current: null };
  holdTimeline(animation, held);
  animation.currentTime = held.current = 640;
  animation.tick(800);
  resumeTimeline(animation, held, .75);
  assert.equal(animation.currentTime, 640);
  animation.tick(100);
  assert.equal(animation.currentTime, 715);
});
