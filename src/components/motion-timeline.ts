/** Own the held sample even while the browser still has a pending pause task. */
export function holdTimeline(animation: Animation, held: { current: number | null }) {
  if (held.current === null) held.current = Number(animation.currentTime ?? 0);
  animation.playbackRate = 0;
  animation.pause();
  animation.currentTime = held.current;
}

export function resumeTimeline(animation: Animation, held: { current: number | null }, speed = 1) {
  if (held.current !== null) {
    animation.currentTime = held.current;
    held.current = null;
  }
  if (animation.playbackRate !== speed) animation.playbackRate = speed;
  if (animation.playState !== 'running' || animation.pending) animation.play();
}
