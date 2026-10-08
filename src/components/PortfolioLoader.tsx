import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useMotionSettings } from './MotionSettings';
import './portfolio-loader.css';

/** A short typing line and a single progress bar share the Hero's plane. */
export function PortfolioLoader({ progress, reduced }: { progress: number; reduced: boolean }) {
  const { settings } = useMotionSettings();
  const [label, setLabel] = useState(reduced ? 'loading...' : '');
  const complete = progress === 100;
  useEffect(() => {
    const target = complete ? 'portfolio' : 'loading...';
    if (reduced) { setLabel(target); return; }
    let current = '';
    let timer: ReturnType<typeof setTimeout>;
    const type = () => {
      current = target.slice(0, current.length + 1);
      setLabel(current);
      if (current.length < target.length) timer = setTimeout(type, 64);
    };
    setLabel('');
    timer = setTimeout(type, 80);
    return () => clearTimeout(timer);
  }, [complete, reduced]);

  return <motion.div className="loading-screen portfolio-loader" role="status" aria-label="Loading portfolio"
    data-complete={complete} initial={false}
    exit={reduced ? { opacity: 0 } : { y: '-110%', rotateX: 62, z: -180, scale: .94, opacity: [1, 1, 0] }}
    transition={{ duration: reduced ? .12 : 1.05 / settings.animationSpeed, ease: [.65, 0, .2, 1] }}
    style={{ transformPerspective: 1200 }}>
    <div className="portfolio-loader-center" aria-hidden="true">
      <span className="portfolio-loader-label">{label}<i /></span>
      <div className="portfolio-loader-track"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: progress / 100 }} transition={{ duration: reduced ? 0 : .32, ease: 'easeOut' }} /></div>
    </div>
    <progress className="loader-sr-only" value={progress} max={100} aria-label="Loading progress" />
  </motion.div>;
}
