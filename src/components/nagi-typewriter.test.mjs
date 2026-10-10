import test from 'node:test';
import assert from 'node:assert/strict';
import { replyGraphemes, typeReply } from './nagi-typewriter.ts';
function fakeClock() {
  let now = 0, sequence = 0;
  const timers = new Map();
  return { now: () => now, schedule: fn => { timers.set(++sequence, fn); return sequence; }, cancel: id => timers.delete(id),
    advance: ms => { now += ms; const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); }, pending: () => timers.size };
}
test('Thai marks, surrogate pairs and joined emoji stay intact', () => {
  const text = 'วิธี 👩‍💻';
  assert.deepEqual(replyGraphemes(text), ['วิ', 'ธี', ' ', '👩‍💻']);
});
test('the full reply grows from its first character to its final character', () => {
  const clock = fakeClock(), samples = []; let completed = 0;
  const text = 'คำตอบภาษาไทยและ English '.repeat(20);
  typeReply(text, value => samples.push(value), () => completed++, clock);
  assert.equal(samples[0], '');
  clock.advance(500);
  assert.ok(samples.at(-1).length > 0 && samples.at(-1).length < text.length);
  assert.ok(text.startsWith(samples.at(-1)));
  clock.advance(8000);
  assert.equal(samples.at(-1), text);
  assert.equal(completed, 1);
  assert.equal(clock.pending(), 0);
});
test('close, hide or reduced motion can finish once without leaving a timer', () => {
  const clock = fakeClock(), samples = []; let completed = 0;
  const typing = typeReply('A complete answer', value => samples.push(value), () => completed++, clock);
  typing.finish(); typing.finish(); clock.advance(5000);
  assert.equal(samples.at(-1), 'A complete answer');
  assert.equal(completed, 1);
  assert.equal(clock.pending(), 0);
});
test('unmount cancels writes and completion', () => {
  const clock = fakeClock(), samples = []; let completed = 0;
  const typing = typeReply('Do not update detached nodes', value => samples.push(value), () => completed++, clock);
  typing.cancel(); clock.advance(9000);
  assert.equal(samples.length, 1);
  assert.equal(completed, 0);
  assert.equal(clock.pending(), 0);
});
