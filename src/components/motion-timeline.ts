/** Own the held sample even while the browser still has a pending pause task. */
export function holdTimeline(animation: Animation, held: { current: number | null }) {
  if (held.current === null) held.current = Number(animation.currentTime ?? 0);
  animation.playbackRate = 0;
  animation.pause();
  animation.currentTime = held.current;
}

export function resumeTimeline(animation: Animation, held: { current: number | null }, speed = 1,
  freshClock = (effect: AnimationEffect | null, timeline: AnimationTimeline | null) => new Animation(effect, timeline)) {
  if (held.current !== null) {
    const anchor = held.current;
    const effect = animation.effect;
    const timeline = animation.timeline;
    // Safari's compositor can restore the old start-time mapping when the
    // zero rate resumes, even after currentTime/startTime are reassigned.
    // Keep the exact keyframe effect and phase, but give it a fresh clock.
    // Cancellation and replacement happen in one task, before any paint.
    animation.cancel();
    const resumed = freshClock(effect, timeline);
    resumed.playbackRate = speed;
    resumed.currentTime = anchor;
    resumed.play();
    held.current = null;
    return resumed;
  }
  if (animation.playbackRate !== speed) animation.playbackRate = speed;
  if (animation.playState !== 'running' || animation.pending) animation.play();
  return animation;
}
