import { useLayoutEffect, useRef } from 'react';

type Destination = { id: string; label: string; keyboard?: boolean };

/** One persistent bubble stretches toward the next section, then settles. */
export function TopbarNavigation({ items, active, reduced, speed, onNavigate }: {
  items: Destination[]; active: string; reduced: boolean; speed: number; onNavigate: (next: Destination) => void;
}) {
  const nav = useRef<HTMLElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const animation = useRef<Animation | null>(null);
  const initialized = useRef(false);
  useLayoutEffect(() => {
    const root = nav.current;
    const node = bubble.current;
    if (!root || !node) return;
    const place = (animate: boolean) => {
      const target = root.querySelector<HTMLElement>('[aria-current]');
      if (!target) return;
      const container = root.getBoundingClientRect();
      const before = node.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const fromX = before.left - container.left;
      const fromWidth = before.width;
      const toX = to.left - container.left;
      node.style.opacity = to.width ? '1' : '0';
      animation.current?.cancel();
      node.style.width = to.width + 'px';
      node.style.transform = 'translateX(' + toX + 'px)';
      if (!animate || reduced || !initialized.current || !fromWidth) { initialized.current = true; return; }
      const distance = toX + to.width / 2 - (fromX + fromWidth / 2);
      const frames = Array.from({ length: 25 }, (_, index) => {
        const t = index / 24;
        const eased = 1 - (1 - t) ** 3;
        const pull = Math.sin(Math.PI * t) ** 2;
        const width = fromWidth + (to.width - fromWidth) * eased + Math.min(42, Math.abs(distance) * .32) * pull;
        const center = fromX + fromWidth / 2 + distance * eased;
        return { offset: t, width: width + 'px', transform: 'translateX(' + (center - width / 2) + 'px) scaleY(' + (1 - .17 * pull) + ')' };
      });
      animation.current = node.animate(frames, { duration: 620 / speed, easing: 'linear' });
    };
    place(true);
    let width = root.clientWidth;
    let height = root.clientHeight;
    const observer = new ResizeObserver(() => {
      if (width === root.clientWidth && height === root.clientHeight) return;
      width = root.clientWidth; height = root.clientHeight; place(false);
    });
    observer.observe(root);
    return () => { observer.disconnect(); };
  }, [active, reduced, speed]);
  useLayoutEffect(() => () => animation.current?.cancel(), []);
  return <nav ref={nav} aria-label="Main navigation">
    <span ref={bubble} className="nav-indicator" aria-hidden="true" />
    {items.map(item => <a key={item.id} href={'#' + item.id} className={item.id === 'home' ? 'nav-home' : undefined}
      aria-current={active === item.id ? 'location' : undefined} onClick={event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); onNavigate({ ...item, keyboard: event.detail === 0 });
      }}><span className="nav-label">{item.label}</span></a>)}
  </nav>;
}
