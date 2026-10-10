/** Grapheme boundaries keep Thai marks and emoji attached to their characters. */
export function replyGraphemes(text: string): string[] {
  return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment);
}

/** A finite clock, independent of React renders and cancellable on close/hide. */
export function typeReply(text: string, write: (text: string) => void, complete: () => void,
  clock = { now: () => performance.now(), schedule: (tick: () => void) => setTimeout(tick, 32), cancel: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer) }) {
  const letters = replyGraphemes(text);
  const duration = Math.min(8000, Math.max(320, letters.length * 18));
  const started = clock.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let shown = -1;
  const cancel = () => { stopped = true; if (timer !== undefined) clock.cancel(timer); };
  const finish = () => { if (stopped) return; cancel(); write(text); complete(); };
  const tick = () => {
    if (stopped) return;
    const count = Math.min(letters.length, Math.floor(letters.length * Math.max(0, clock.now() - started) / duration));
    if (count !== shown) { shown = count; write(letters.slice(0, count).join('')); }
    if (count >= letters.length) finish();
    else timer = clock.schedule(tick);
  };
  tick();
  return { cancel, finish };
}
