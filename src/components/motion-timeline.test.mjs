import test from 'node:test';
import assert from 'node:assert/strict';
import { holdTimeline, resumeTimeline } from './motion-timeline.ts';
function pendingClock(effect = {}, timeline = {}) {
 return { effect, timeline, currentTime: 320, playbackRate: 1, pending: false, playState: 'running',
  pause() { this.pending = true; },
  play() { this.pending = false; this.playState = 'running'; },
  cancel() { this.playState = 'idle'; this.currentTime = null; },
  tick(ms) { if (this.playState === 'running') this.currentTime += ms * this.playbackRate; },
 };
}
test('pending browser pause cannot advance the held sample', () => {
 let animation = pendingClock(); const held = { current: null };
 holdTimeline(animation, held); animation.tick(5000);
 assert.equal(animation.currentTime, 320);
 holdTimeline(animation, held);
 animation = resumeTimeline(animation, held, 1.5, pendingClock);
 assert.equal(animation.currentTime, 320);
 animation.tick(100);
 assert.equal(animation.currentTime, 470);
 assert.equal(held.current, null);
});
test('a geometry remap while held is the resume anchor', () => {
 let animation = pendingClock(); const held = { current: null };
 holdTimeline(animation, held);
 animation.currentTime = held.current = 640;
 animation.tick(800);
 animation = resumeTimeline(animation, held, .75, pendingClock);
 assert.equal(animation.currentTime, 640);
 animation.tick(100);
 assert.equal(animation.currentTime, 715);
});
test('resume retires the stale compositor clock while preserving the keyframes', () => {
 const old = pendingClock(), held = { current: 320 };
 const replacement = resumeTimeline(old, held, 1, pendingClock);
 assert.notEqual(replacement, old);
 assert.equal(replacement.effect, old.effect);
 assert.equal(replacement.timeline, old.timeline);
 assert.equal(old.playState, 'idle');
 old.tick(5000);
 assert.equal(replacement.currentTime, 320);
 replacement.tick(100);
 assert.equal(replacement.currentTime, 420);
 assert.equal(resumeTimeline(replacement, held, 1, pendingClock), replacement);
});
