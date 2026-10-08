export type PlaygroundPoint = { x: number; y: number };
export type PlaygroundBounds = { width: number; height: number; top: number; bottom: number };
export type PlaygroundHoop = PlaygroundPoint & { halfWidth: number };
export type PlaygroundVelocity = { x: number; y: number };
export type PlaygroundFlight = {
  frames: Array<PlaygroundPoint & { offset: number; rotation: number }>;
  duration: number;
  scored: boolean;
  crossing: PlaygroundPoint | null;
  end: PlaygroundPoint;
};

export const PLAYGROUND_GRAVITY = 980;
export const clampPlayground = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** The assisted shot still follows the same parabola and descending-rim test. */
export function assistedVelocity(from: PlaygroundPoint, hoop: PlaygroundHoop, ceiling = 0): PlaygroundVelocity {
  const apex = Math.max(ceiling + 18, Math.min(from.y - 26, hoop.y - 95));
  const vertical = -Math.sqrt(2 * PLAYGROUND_GRAVITY * Math.max(0, from.y - apex));
  const time = (-vertical + Math.sqrt(vertical * vertical + 2 * PLAYGROUND_GRAVITY * (hoop.y - from.y))) / PLAYGROUND_GRAVITY;
  return {
    x: (hoop.x - from.x) / time,
    y: vertical,
  };
}

/** Pulling away adds launch energy; a tap uses the visible assisted arc. */
export function pulledVelocity(base: PlaygroundVelocity, pull: PlaygroundPoint): PlaygroundVelocity {
  return {
    x: clampPlayground(base.x - pull.x * 5.2, -1450, 1450),
    y: clampPlayground(base.y - pull.y * 5.2, -1500, 550),
  };
}

/** Fixed-step, finite flight. Render its precomputed transforms with WAAPI. */
export function playgroundFlight(
  from: PlaygroundPoint,
  velocity: PlaygroundVelocity,
  hoop: PlaygroundHoop,
  bounds: PlaygroundBounds,
  radius = 10,
): PlaygroundFlight {
  const dt = 1 / 40;
  const maxSteps = 80;
  const frames: PlaygroundFlight['frames'] = [{ ...from, offset: 0, rotation: 0 }];
  let point = { ...from };
  let vx = velocity.x;
  let vy = velocity.y;
  let scored = false;
  let crossing: PlaygroundPoint | null = null;
  let finished = false;
  let scoreStep = -1;
  let steps = 0;

  for (let step = 1; step <= maxSteps; step++) {
    const previous = point;
    const next = {
      x: previous.x + vx * dt,
      y: previous.y + vy * dt + .5 * PLAYGROUND_GRAVITY * dt * dt,
    };
    vy += PLAYGROUND_GRAVITY * dt;

    // Only a downward crossing through the opening counts. Side and rising
    // approaches can miss even when the sprite overlaps the net or backboard.
    if (!crossing && previous.y < hoop.y && next.y >= hoop.y && vy > 0) {
      const fraction = (hoop.y - previous.y) / (next.y - previous.y);
      crossing = { x: previous.x + (next.x - previous.x) * fraction, y: hoop.y };
      scored = Math.abs(crossing.x - hoop.x) <= Math.max(1, hoop.halfWidth - radius * .45);
      if (scored) scoreStep = step;
    }

    if (next.x < radius + 8) { next.x = radius + 8; vx = Math.abs(vx) * .58; }
    if (next.x > bounds.width - radius - 8) { next.x = bounds.width - radius - 8; vx = -Math.abs(vx) * .58; }
    if (next.y < bounds.top + radius) { next.y = bounds.top + radius; vy = Math.abs(vy) * .45; }
    if (next.y > bounds.bottom - radius) {
      next.y = bounds.bottom - radius;
      vy = -Math.abs(vy) * .42;
      vx *= .72;
      if (Math.abs(vy) < 95) finished = true;
    }
    point = next;
    frames.push({ ...point, offset: 0, rotation: (vx > 0 ? 1 : -1) * step * 8 });
    steps = step;
    if ((scoreStep >= 0 && step >= scoreStep + 5) || finished) break;
  }
  frames.forEach((frame, index) => { frame.offset = index / steps; });
  return { frames, duration: steps * dt * 1000, scored, crossing, end: point };
}

export function nearPlaygroundHome(point: PlaygroundPoint, home: PlaygroundPoint, width: number, height: number) {
  const magnetRadius = clampPlayground(Math.hypot(width, height) * .22, 38, 62);
  return Math.hypot(point.x - home.x, point.y - home.y) <= magnetRadius;
}

/** Deterministic targets: preserve the blast direction while avoiding overlap. */
export function scatterPlaygroundPieces(
  homes: Array<PlaygroundPoint & { width: number; height: number; kind: 'letter' | 'part' }>,
  origin: PlaygroundPoint,
  bounds: PlaygroundBounds,
  hoop: PlaygroundHoop,
): PlaygroundPoint[] {
  const placed: Array<PlaygroundPoint & { width: number; height: number }> = [];
  let seed = 417;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return homes.map((home, index) => {
    let best = { x: home.x, y: home.y };
    let bestPenalty = Infinity;
    for (let attempt = 0; attempt < 95; attempt++) {
      const baseAngle = Math.atan2(home.y - origin.y, home.x - origin.x);
      const angle = attempt < 28 ? baseAngle + (random() - .5) * 2.6 : random() * Math.PI * 2;
      const distance = 135 + random() * Math.max(180, bounds.width * .48);
      const candidate = {
        x: clampPlayground(origin.x + Math.cos(angle) * distance, home.width / 2 + 15, bounds.width - home.width / 2 - 15),
        y: clampPlayground(origin.y + Math.sin(angle) * distance, bounds.top + home.height / 2 + 35, bounds.bottom - home.height / 2 - 10),
      };
      let penalty = 0;
      for (const other of placed) {
        const overlapX = (home.width + other.width) / 2 + 8 - Math.abs(candidate.x - other.x);
        const overlapY = (home.height + other.height) / 2 + 8 - Math.abs(candidate.y - other.y);
        if (overlapX > 0 && overlapY > 0) penalty += overlapX * overlapY;
      }
      const hoopOverlapX = home.width / 2 + hoop.halfWidth + 28 - Math.abs(candidate.x - hoop.x);
      const hoopOverlapY = home.height / 2 + 85 - Math.abs(candidate.y - hoop.y + 10);
      if (hoopOverlapX > 0 && hoopOverlapY > 0) penalty += hoopOverlapX * hoopOverlapY * 4;
      // Keep the top controls and home-name area clear enough to read.
      if (candidate.y < bounds.top + 70) penalty += 400;
      if (penalty < bestPenalty) { bestPenalty = penalty; best = candidate; }
      if (penalty === 0) break;
    }
    placed.push({ ...best, width: home.width, height: home.height });
    // Alternate the lowest-overlap solution very slightly for dimensionality.
    return { x: best.x, y: best.y + (index % 2 ? 1 : -1) * 2 };
  });
}
