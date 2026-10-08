export type PlaygroundPoint = { x: number; y: number };
export type PlaygroundBounds = { width: number; height: number; top: number; bottom: number };
export type PlaygroundSize = { width: number; height: number };
export type PlaygroundPose = PlaygroundPoint & { rotation: number; depth?: number };
export type PlaygroundVelocity = PlaygroundPoint;
export type PlaygroundFlight = {
  frames: Array<PlaygroundPose & { offset: number }>;
  duration: number;
  end: PlaygroundPose;
};

export const clampPlayground = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

const finite = (value: number | undefined, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smootherstep = (progress: number) => progress * progress * progress * (10 + progress * (-15 + progress * 6));
const normalizedSize = (size: PlaygroundSize) => ({ width: Math.max(0, finite(size.width)), height: Math.max(0, finite(size.height)) });
const normalizedPose = (pose: PlaygroundPose): PlaygroundPose => ({ x: finite(pose.x), y: finite(pose.y), rotation: finite(pose.rotation), depth: finite(pose.depth) });

function usableBounds(bounds: PlaygroundBounds) {
  const width = Math.max(1, finite(bounds.width, 1));
  const height = Math.max(1, finite(bounds.height, 1));
  const top = clampPlayground(finite(bounds.top), 0, height);
  const bottom = clampPlayground(finite(bounds.bottom, height), top, height);
  return { width, top, bottom };
}

function rotatedSize(size: PlaygroundSize, rotation: number): PlaygroundSize {
  const radians = rotation * Math.PI / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return { width: size.width * cosine + size.height * sine, height: size.width * sine + size.height * cosine };
}

function centerLimits(size: PlaygroundSize, rotation: number, bounds: PlaygroundBounds, padding = 22) {
  const usable = usableBounds(bounds);
  const rotated = rotatedSize(normalizedSize(size), rotation);
  // Reduce the margin for a close-fitting piece. An oversized piece keeps
  // its center in the available region, since its edges cannot both fit.
  const marginX = Math.max(0, Math.min(padding, (usable.width - rotated.width) / 2));
  const marginY = Math.max(0, Math.min(padding, (usable.bottom - usable.top - rotated.height) / 2));
  const halfWidth = Math.min(usable.width / 2, rotated.width / 2 + marginX);
  const halfHeight = Math.min((usable.bottom - usable.top) / 2, rotated.height / 2 + marginY);
  return { left: halfWidth, right: usable.width - halfWidth, top: usable.top + halfHeight, bottom: usable.bottom - halfHeight };
}

function boundedPose(pose: PlaygroundPose, size: PlaygroundSize, bounds: PlaygroundBounds, padding = 22): PlaygroundPose {
  const limits = centerLimits(size, pose.rotation, bounds, padding);
  return { ...pose, x: clampPlayground(pose.x, limits.left, limits.right), y: clampPlayground(pose.y, limits.top, limits.bottom) };
}

/** A held piece keeps its rotated edges inside the court, including wide parts. */
export function playgroundHeldPose(pose: PlaygroundPose, size: PlaygroundSize, bounds: PlaygroundBounds): PlaygroundPose {
  return boundedPose(normalizedPose(pose), size, bounds, 8);
}

/** Broad directional assistance, with a stronger magnetic capture near home. */
export function playgroundAim(start: PlaygroundPoint, held: PlaygroundPoint, home: PlaygroundPoint, size: PlaygroundSize) {
  const dx = finite(held.x) - finite(start.x);
  const dy = finite(held.y) - finite(start.y);
  const homeX = finite(home.x) - finite(start.x);
  const homeY = finite(home.y) - finite(start.y);
  const travel = Math.hypot(dx, dy);
  const originalDistance = Math.hypot(homeX, homeY);
  const distance = Math.hypot(finite(home.x) - finite(held.x), finite(home.y) - finite(held.y));
  const radius = clampPlayground(Math.hypot(finite(size.width), finite(size.height)) * .3, 36, 68);
  const alignment = travel > 6 && originalDistance > 1 ? (dx * homeX + dy * homeY) / (travel * originalDistance) : 0;
  return { locked: distance < radius * 1.2 || alignment > .6, magnet: clampPlayground(1 - distance / radius, 0, 1) ** 2 * .5 };
}

function seededRandom(seed: number) {
  let state = ((Math.trunc(finite(seed)) % 2147483646) + 2147483646) % 2147483646 + 1;
  return () => { state = state * 16807 % 2147483647; return (state - 1) / 2147483646; };
}

/** Deterministic, size-aware resting poses. Coordinates are element centers. */
export function scatterPlaygroundPieces(
  homes: Array<PlaygroundPoint & PlaygroundSize & { kind?: 'letter' | 'part' }>,
  origin: PlaygroundPoint,
  bounds: PlaygroundBounds,
): PlaygroundPose[] {
  const usable = usableBounds(bounds);
  const result: PlaygroundPose[] = new Array(homes.length);
  const placed: Array<PlaygroundPoint & PlaygroundSize> = [];
  const ordered = homes.map((home, index) => ({ home, index })).sort((a, b) => b.home.width * b.home.height - a.home.width * a.home.height || a.index - b.index);
  for (const { home, index } of ordered) {
    const random = seededRandom(417 + index * 7919);
    const size = normalizedSize(home);
    let rotation = (random() - .5) * (home.kind === 'part' ? 14 : 44);
    // A nearly full-width component needs less rotation on a small viewport.
    for (let attempt = 0; attempt < 8 && (rotatedSize(size, rotation).width > usable.width || rotatedSize(size, rotation).height > usable.bottom - usable.top); attempt++) rotation *= .5;
    if (rotatedSize(size, rotation).width > usable.width || rotatedSize(size, rotation).height > usable.bottom - usable.top) rotation = 0;
    const depth = -6 - random() * 24;
    const limits = centerLimits(size, rotation, bounds);
    const footprint = rotatedSize(size, rotation);
    const baseAngle = Math.atan2(finite(home.y) - finite(origin.y), finite(home.x) - finite(origin.x));
    const span = Math.hypot(usable.width, usable.bottom - usable.top);
    let best = boundedPose({ x: finite(home.x), y: finite(home.y), rotation, depth }, size, bounds);
    let bestPenalty = Infinity;
    for (let attempt = 0; attempt < 120; attempt++) {
      const angle = baseAngle + (random() - .5) * (attempt < 48 ? 2.5 : Math.PI * 2);
      const distance = span * (.2 + random() * .55);
      const candidate = attempt % 3 === 2 ? {
        x: mix(limits.left, limits.right, random()),
        y: mix(limits.top, limits.bottom, random()),
      } : {
        x: clampPlayground(finite(origin.x) + Math.cos(angle) * distance, limits.left, limits.right),
        y: clampPlayground(finite(origin.y) + Math.sin(angle) * distance, limits.top, limits.bottom),
      };
      let penalty = 0;
      for (const other of placed) {
        const overlapX = (footprint.width + other.width) / 2 + 8 - Math.abs(candidate.x - other.x);
        const overlapY = (footprint.height + other.height) / 2 + 8 - Math.abs(candidate.y - other.y);
        if (overlapX > 0 && overlapY > 0) penalty += overlapX * overlapY * 8;
      }
      const travel = Math.hypot(candidate.x - finite(home.x), candidate.y - finite(home.y));
      const minimumTravel = Math.min(110, span * .18);
      penalty += Math.max(0, minimumTravel - travel) ** 2 * .08;
      if (penalty < bestPenalty) { bestPenalty = penalty; best = { ...candidate, rotation, depth }; }
      if (penalty === 0) break;
    }
    result[index] = best;
    placed.push({ x: best.x, y: best.y, ...footprint });
  }
  return result;
}

/**
 * A radial impulse followed by damped spring inertia and soft wall rebounds.
 * Compute once and render with linear WAAPI easing. A small smooth tail
 * correction makes the resting pose exact without a final visible snap.
 */
export function playgroundBlast(
  from: PlaygroundPose,
  target: PlaygroundPose,
  origin: PlaygroundPoint,
  bounds: PlaygroundBounds,
  size: PlaygroundSize,
  index = 0,
): PlaygroundFlight {
  const start = normalizedPose(from);
  const end = boundedPose(normalizedPose(target), size, bounds);
  const random = seededRandom(919 + index * 3571);
  const duration = 1280 + Math.round(random() * 160);
  const steps = 72;
  const frameDt = duration / steps / 1000;
  const substeps = Math.ceil(frameDt / (1 / 240));
  const dt = frameDt / substeps;
  const usable = usableBounds(bounds);
  const directionX = start.x - finite(origin.x);
  const directionY = start.y - finite(origin.y);
  const directionLength = Math.hypot(directionX, directionY);
  const fallbackAngle = Math.atan2(end.y - start.y, end.x - start.x) + (random() - .5) * .55;
  const direction = directionLength > 1 ? { x: directionX / directionLength, y: directionY / directionLength } : { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) };
  const viewportScale = clampPlayground(Math.min(usable.width, usable.bottom - usable.top) / 520, .3, 1);
  const impulse = (480 + random() * 180) * viewportScale;
  let velocityX = direction.x * impulse;
  let velocityY = direction.y * impulse;
  let angularVelocity = (random() < .5 ? -1 : 1) * (80 + random() * 110);
  let depthVelocity = -65 - random() * 70;
  let pose = { ...start, depth: finite(start.depth) };
  const frames: PlaygroundFlight['frames'] = [{ ...pose, offset: 0 }];
  const stiffness = 64;
  const drag = 16;
  for (let step = 1; step <= steps; step++) {
    for (let substep = 0; substep < substeps; substep++) {
      // Integrate at 240 Hz, then sample a bounded compositor trajectory.
      // Let the outward impulse lead before the resting target attracts the
      // piece. Even a target on the opposite side begins with an outward kick.
      const attraction = stiffness * smootherstep(clampPlayground(((step - 1) * frameDt + (substep + 1) * dt) / .12, 0, 1));
      velocityX += ((end.x - pose.x) * attraction - velocityX * drag) * dt;
      velocityY += ((end.y - pose.y) * attraction - velocityY * drag) * dt;
      angularVelocity += ((end.rotation - pose.rotation) * attraction - angularVelocity * drag) * dt;
      depthVelocity += ((finite(end.depth) - pose.depth) * attraction - depthVelocity * drag) * dt;
      const next = { x: pose.x + velocityX * dt, y: pose.y + velocityY * dt, rotation: pose.rotation + angularVelocity * dt, depth: clampPlayground(pose.depth + depthVelocity * dt, -64, 20) };
      const limits = centerLimits(size, next.rotation, bounds);
      if (next.x < limits.left || next.x > limits.right) {
        next.x = clampPlayground(next.x, limits.left, limits.right);
        velocityX = next.x === limits.left ? Math.abs(velocityX) * .26 : -Math.abs(velocityX) * .26;
      }
      if (next.y < limits.top || next.y > limits.bottom) {
        next.y = clampPlayground(next.y, limits.top, limits.bottom);
        velocityY = next.y === limits.top ? Math.abs(velocityY) * .26 : -Math.abs(velocityY) * .26;
      }
      pose = next;
    }
    frames.push({ ...pose, offset: step / steps });
  }
  const residual = { x: end.x - pose.x, y: end.y - pose.y, rotation: end.rotation - pose.rotation, depth: finite(end.depth) - pose.depth };
  for (let step = 1; step < frames.length; step++) {
    const frame = frames[step];
    const correction = smootherstep(clampPlayground((frame.offset - .55) / .45, 0, 1));
    frames[step] = { ...boundedPose({ x: frame.x + residual.x * correction, y: frame.y + residual.y * correction, rotation: frame.rotation + residual.rotation * correction, depth: finite(frame.depth) + residual.depth * correction }, size, bounds), offset: frame.offset };
  }
  frames[frames.length - 1] = { ...end, offset: 1 };
  return { frames, duration, end };
}

/** A monotonic straight-line return with synchronized rotation/depth settling. */
export function playgroundHomeFlight(
  from: PlaygroundPose,
  home: PlaygroundPoint,
  initialVelocity?: PlaygroundVelocity,
): PlaygroundFlight {
  const start = normalizedPose(from);
  const end: PlaygroundPose = { x: finite(home.x), y: finite(home.y), rotation: 0, depth: 0 };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const duration = Math.round(clampPlayground(420 + distance * .34, 420, 700));
  const projectedVelocity = distance > .001 ? (finite(initialVelocity?.x) * dx + finite(initialVelocity?.y) * dy) / distance : 0;
  // Project carried velocity onto the home line. Capping its contribution
  // prevents a sideways kick, reversal, or overshoot.
  const momentum = distance > .001 ? clampPlayground(projectedVelocity * duration / 1000 / distance / 3, 0, .7) : 0;
  const steps = Math.ceil(duration / 12);
  const frames: PlaygroundFlight['frames'] = [];
  for (let step = 0; step <= steps; step++) {
    const offset = step / steps;
    const progress = mix(smootherstep(offset), 1 - (1 - offset) ** 3, momentum);
    frames.push({ x: mix(start.x, end.x, progress), y: mix(start.y, end.y, progress), rotation: mix(start.rotation, 0, progress), depth: mix(finite(start.depth), 0, progress), offset });
  }
  frames[0] = { ...start, offset: 0 };
  frames[frames.length - 1] = { ...end, offset: 1 };
  return { frames, duration, end };
}

/**
 * Assisted basketball flight: constant horizontal travel and gravity form a
 * parabola, then a short magnetic capture dissipates velocity at home. The
 * apex is limited before sampling, so a low ceiling flattens the arc smoothly
 * instead of clipping it. All animation work is a finite set of keyframes.
 */
export function playgroundShotFlight(
  from: PlaygroundPose,
  home: PlaygroundPoint,
  bounds: PlaygroundBounds,
  size: PlaygroundSize,
): PlaygroundFlight {
  const start = boundedPose(normalizedPose(from), size, bounds, 0);
  const end = boundedPose({ x: finite(home.x), y: finite(home.y), rotation: 0, depth: 0 }, size, bounds, 0);
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const duration = Math.round(clampPlayground(560 + Math.sqrt(distance) * 20, 640, 1180));
  const steps = Math.ceil(duration / 16);
  const usable = usableBounds(bounds);
  const footprint = Math.hypot(finite(size.width), finite(size.height));
  const spin = footprint + 44 < Math.min(usable.width, usable.bottom - usable.top) ? Math.sign(end.x - start.x || start.rotation) * Math.min(12, distance * .018) : 0;
  const capture = .22;
  const clockRate = 1 / (1 - capture / 2);
  const samples = Array.from({ length: steps + 1 }, (_, step) => {
    const offset = step / steps;
    // Match velocity at the capture boundary; ease to zero over the final 22%.
    const clock = offset <= 1 - capture ? offset * clockRate : 1 - (1 - offset) ** 2 * clockRate / (2 * capture);
    return {
      offset, clock,
      x: mix(start.x, end.x, clock),
      y: mix(start.y, end.y, clock),
      rotation: mix(start.rotation, 0, smootherstep(offset)) + spin * Math.sin(Math.PI * offset) * (1 - offset) ** 3,
    };
  });
  let arc = distance < 2 ? 0 : clampPlayground(40 + distance * .22, 40, 190);
  for (const sample of samples) {
    const lift = 4 * sample.clock * (1 - sample.clock);
    if (lift > .0001) {
      const limits = centerLimits(size, sample.rotation, bounds, 0);
      arc = Math.min(arc, Math.max(0, (sample.y - limits.top - 2) / lift));
    }
  }
  const frames = samples.map(sample => {
    const lift = 4 * sample.clock * (1 - sample.clock);
    const pose = boundedPose({
      x: sample.x, y: sample.y - arc * lift, rotation: sample.rotation,
      // Recede through the apex rather than enlarging a wide part past an edge.
      depth: mix(finite(start.depth), 0, smootherstep(sample.offset)) - Math.min(30, arc * .16) * Math.sin(Math.PI * sample.clock),
    }, size, bounds, 0);
    return { ...pose, offset: sample.offset };
  });
  frames[0] = { ...start, offset: 0 };
  frames[frames.length - 1] = { ...end, offset: 1 };
  return { frames, duration, end };
}
