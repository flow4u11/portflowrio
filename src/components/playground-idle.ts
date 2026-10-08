export const PLAYGROUND_IDLE_MS = 12000;
type Clock = {
  set: (callback: () => void, delay: number) => unknown;
  clear: (handle: unknown) => void;
};
/** One deadline per session; cancelled callbacks cannot restore a later session. */
export function createPlaygroundIdle(clock: Clock = {
  set: (callback, delay) => setTimeout(callback, delay),
  clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
}) {
  let handle: unknown;
  let generation = 0;
  const cancel = () => { generation++; if (handle !== undefined) clock.clear(handle); handle = undefined; };
  return {
    cancel,
    arm(callback: () => void, delay = PLAYGROUND_IDLE_MS) {
      cancel();
      const token = generation;
      handle = clock.set(() => {
        if (token !== generation) return;
        handle = undefined;
        generation++;
        callback();
      }, delay);
    },
  };
}
