export type PortfolioReadinessKey = 'gallery' | 'background';
export type PortfolioReadinessStatus = 'pending' | 'ready' | 'fallback';
export type PortfolioReadinessSnapshot = Readonly<Record<PortfolioReadinessKey, PortfolioReadinessStatus>>;

let snapshot: PortfolioReadinessSnapshot = { gallery: 'pending', background: 'pending' };
const generations: Record<PortfolioReadinessKey, number> = { gallery: 0, background: 0 };
const listeners = new Set<() => void>();

/** Start a real initializer; its token prevents an aborted initializer reporting later. */
export function beginPortfolioReadiness(key: PortfolioReadinessKey) {
  generations[key] += 1;
  snapshot = { ...snapshot, [key]: 'pending' };
  listeners.forEach(listener => listener());
  return generations[key];
}

/** Report after the first useful paint, or once the component adopts its fallback. */
export function reportPortfolioReady(key: PortfolioReadinessKey, status: Exclude<PortfolioReadinessStatus, 'pending'>, generation?: number) {
  if (generation !== undefined && generations[key] !== generation) return;
  if (snapshot[key] !== 'pending') return;
  snapshot = { ...snapshot, [key]: status };
  listeners.forEach(listener => listener());
}

export function getPortfolioReadiness(): PortfolioReadinessSnapshot { return snapshot; }

export function subscribePortfolioReadiness(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
