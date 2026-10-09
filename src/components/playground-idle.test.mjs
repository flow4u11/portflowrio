import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaygroundIdle, PLAYGROUND_IDLE_MS } from './playground-idle.ts';
function setup() {
  let time = 0, id = 0;
  const jobs = new Map(), archived = [];
  const idle = createPlaygroundIdle({ set(callback, delay) { const key = ++id; jobs.set(key, { callback, at: time + delay }); archived.push(callback); return key; }, clear(key) { jobs.delete(key); } });
  const advance = elapsed => { time += elapsed; for (const [key, job] of jobs) if (job.at <= time) { jobs.delete(key); job.callback(); } };
  return { idle, advance, archived, jobs };
}
test('idle restores once after five seconds with no interaction', () => {
  const { idle, advance, jobs } = setup(); let returns = 0;
  idle.arm(() => returns++); advance(PLAYGROUND_IDLE_MS - 1); assert.equal(returns, 0);
  advance(1); assert.equal(returns, 1); advance(60000); assert.equal(returns, 1); assert.equal(jobs.size, 0);
});
test('interaction renews one deadline instead of accumulating callbacks', () => {
  const { idle, advance, jobs } = setup(); let returns = 0;
  idle.arm(() => returns++); advance(PLAYGROUND_IDLE_MS - 1000); idle.arm(() => returns++);
  advance(PLAYGROUND_IDLE_MS - 1000); assert.equal(returns, 0); assert.equal(jobs.size, 1);
  advance(1000); assert.equal(returns, 1);
});
test('queued stale timers cannot affect a replacement session or explicit reset', () => {
  const { idle, archived, advance } = setup(); let returns = 0;
  idle.arm(() => returns++); const old = archived[0]; idle.cancel();
  idle.arm(() => returns++); old(); assert.equal(returns, 0);
  advance(PLAYGROUND_IDLE_MS); assert.equal(returns, 1);
  idle.arm(() => returns++); const last = archived.at(-1); idle.cancel(); last(); assert.equal(returns, 1);
});
