import { useEffect, useState } from 'react';

/** A cached section map avoids callback-order races between overlapping observers. */
export function useActiveSection() {
  const [active, setActive] = useState('home');
  useEffect(() => {
    const sections = ['home', 'about', 'projects', 'contact'].map(id => document.getElementById(id)).filter((node): node is HTMLElement => !!node);
    let frame = 0;
    let measureFrame = 0;
    let header = 80;
    let positions: { id: string; top: number }[] = [];
    const update = () => {
      frame = 0;
      const line = window.scrollY + header + 28;
      let next = positions[0]?.id ?? 'home';
      for (const section of positions) { if (section.top <= line) next = section.id; else break; }
      if (window.scrollY > 0 && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 3) next = 'contact';
      setActive(previous => previous === next ? previous : next);
    };
    const measure = () => {
      measureFrame = 0;
      header = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 80;
      positions = sections.map(node => ({ id: node.id, top: node.getBoundingClientRect().top + window.scrollY }));
      update();
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onLayout = () => { if (!measureFrame) measureFrame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(onLayout);
    sections.forEach(node => observer.observe(node));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onLayout, { passive: true });
    window.addEventListener('portfolio:navigation-end', onLayout);
    window.addEventListener('hashchange', onLayout);
    measure();
    return () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(measureFrame); observer.disconnect();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onLayout);
      window.removeEventListener('portfolio:navigation-end', onLayout); window.removeEventListener('hashchange', onLayout);
    };
  }, []);
  return active;
}
