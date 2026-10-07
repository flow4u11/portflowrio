import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Code2, Film, Gamepad2, Grid2X2, Lightbulb, X } from 'lucide-react';
import { ThemeTogglerButton } from './components/animate-ui/theme-toggler';
import { StarsBackground } from './components/animate-ui/stars-background';
import { PixelAvatar } from './components/PixelAvatar';
import { VisitsCounter } from './components/VisitsCounter';
import { Typewriter } from './components/Typewriter';
import { BrandIcon } from './components/BrandIcon';
import { ScrambleWordmark } from './components/ScrambleWordmark';
import { CyclingAboutTitle } from './components/CyclingAboutTitle';
import { LoopingMarquee } from './components/LoopingMarquee';
import { ProjectGallery, type Project } from './components/ProjectGallery';

type Theme = 'light' | 'dark';
const projects: Project[] = [
  {
    id: 'laststand', title: 'LastStand', category: 'Unreal Engine 5 · FPS game', image: '/assets/project-laststand.svg',
    status: 'IN DEVELOPMENT',
    alt: 'LastStand concept cover showing an industrial FPS arena and a monochrome title screen',
    description: 'An FPS game project built in Unreal Engine 5. A space to explore gameplay, game lighting, and the atmosphere of an interactive world.',
    tags: ['Unreal Engine 5', 'FPS', 'Game lighting'],
    details: [
      { label: 'The idea', text: 'Build a first-person game with a clear visual identity and an engaging atmosphere.' },
      { label: 'Exploration', text: 'Gameplay, lighting, and game graphics are the areas to document in this project.' },
      { label: 'Next chapter', text: 'Gameplay footage, real screenshots, and development notes will be added as the project takes shape.' },
    ],
  },
  {
    id: 'grades', title: 'School Ledger', category: 'Full stack web app · Student grade system', image: '/assets/project-school-ledger.svg',
    status: 'LIVE BETA', liveUrl: 'https://school-ledger-beta.vercel.app', sourceUrl: 'https://github.com/flow4u11/student-grade-system',
    alt: 'School Ledger illustrated dashboard with subjects, grade entry and a student overview',
    description: 'A bilingual grade management app that brings classes, scores, and GPA into one clear workspace — with a dedicated student portal.',
    tags: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Vercel'],
    details: [
      { label: 'For teachers', text: 'Manage terms, classes, and subjects. Enter scores, configure grading rules, calculate GPA, and publish results.' },
      { label: 'For students', text: 'View published grades through a PIN-based portal. Thai and English interfaces and personal themes keep the experience approachable.' },
      { label: 'The details', text: 'Excel import and export, an audit history, and a public demo using fictional data. Built with Next.js, React, TypeScript, Tailwind CSS, Supabase, Radix UI, GSAP, Zod, and ExcelJS.' },
    ],
  },
];
const navigation = [{ id: 'home', label: 'Home' }, { id: 'about', label: 'About' }, { id: 'projects', label: 'Projects' }, { id: 'contact', label: 'Contact' }];

function Depth({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <div className={`depth-stage ${className}`}><motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.12, margin: '-12px 0px -12px 0px' }} transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div></div>;
}

function Loader({ progress, reduced }: { progress: number; reduced: boolean }) {
  return <motion.div className="loading-screen" role="status" aria-label="Loading portfolio" initial={{ opacity: 1 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: '-12%', rotateX: -12, scale: 0.98 }} transition={{ duration: reduced ? 0.1 : 0.65, ease: [0.22, 1, 0.36, 1] }}>
    <div className="loader-top"><span>kimportflowrio</span><span>CHAYATHORN / KIM</span></div>
    <div className="loader-center"><span className="loader-star" aria-hidden="true">✳</span><p>Welcome to<br />my <i>Portfolio.</i></p></div>
    <div className="loader-bottom"><span>LOADING EXPERIENCE</span><div className="loader-track"><motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} /></div><span>{String(progress).padStart(3, '0')}%</span></div>
  </motion.div>;
}

function ToolIcon({ tool }: { tool: string }) {
  if (tool === 'Figma') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h4v6H8a3 3 0 1 1 0-6Zm4 0h4a3 3 0 1 1 0 6h-4ZM8 9h4v6H8a3 3 0 1 1 0-6Zm4 3a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM8 15h4v3a3 3 0 1 1-3-3Z" /></svg>;
  if (tool === 'DaVinci Resolve') return <Film aria-hidden="true" />;
  if (tool === 'VS Code') return <Code2 aria-hidden="true" />;
  if (tool === 'Unreal Engine 5') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7 6v10l5 3 5-3V6m-8 1v8l3 2 3-2V7" /></svg>;
  if (tool === 'Unity') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10m0-20v5m-9 10 5-3m13 3-5-3" /></svg>;
  if (tool === 'Roblox Studio') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 1 17 5-5 17L1 18ZM10 8l6 2-2 6-6-2Z" /></svg>;
  if (tool === 'Premiere Pro' || tool === 'After Effects') return <span className="tool-monogram" aria-hidden="true">{tool === 'Premiere Pro' ? 'Pr' : 'Ae'}</span>;
  if (tool === 'CapCut') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 5 18 14M3 19 21 5M3 5v4l18 6v4M3 19v-4l18-6V5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 4 14 8-14 8V4Zm0 0 7 8-7 8m7-8h7" /></svg>;
}

const toolkit = ['Figma', 'Unreal Engine 5', 'Unity', 'Roblox Studio', 'Premiere Pro', 'After Effects', 'CapCut', 'DaVinci Resolve', 'VS Code', 'Cursor'];
const technologyGroups = [
  { label: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Vite'] },
  { label: 'Motion & interface', items: ['Motion', 'GSAP', 'Radix UI'] },
  { label: 'Backend & data', items: ['Node.js', 'Supabase', 'PostgreSQL', 'Supabase Auth', 'Zod', 'ExcelJS'] },
  { label: 'Ship & test', items: ['Git', 'GitHub', 'Vercel', 'Vitest', 'Playwright'] },
];

export default function App() {
  const reduced = useReducedMotion() ?? false;
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState<Project | 'contact' | null>(null);
  const [dialogClosing, setDialogClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outsideDown = useRef(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroVisible = useInView(heroRef, { amount: 0.15 });
  const { scrollYProgress } = useScroll();
  const pageProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 35 });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#050505' : '#ffffff');
    try { localStorage.setItem('portfolio-theme', theme); } catch { /* Explicit theme still works without storage. */ }
  }, [theme]);
  useEffect(() => {
    const syncTheme = (event: StorageEvent) => { if (event.key === 'portfolio-theme') setTheme(event.newValue === 'dark' ? 'dark' : 'light'); };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let complete = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const markReady = () => { complete += 1; if (!cancelled) setLoadProgress(Math.round(complete / 3 * 100)); };
    const images = ['/assets/profile-anime.png', '/assets/profile-kim.jpg'].map(src => new Promise<void>(resolve => {
      const image = new Image();
      let ready = false;
      const finish = () => {
        if (ready) return;
        ready = true;
        image.onload = image.onerror = null;
        markReady();
        resolve();
      };
      image.onload = image.onerror = finish;
      timers.push(setTimeout(finish, 2200));
      image.src = src;
    }));
    const wait = (milliseconds: number) => new Promise<void>(resolve => { timers.push(setTimeout(resolve, milliseconds)); });
    const fonts = Promise.race([document.fonts.ready, wait(1400)]).then(markReady);
    void Promise.all([...images, fonts, wait(reduced ? 120 : 1150)]).then(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [reduced]);

  useEffect(() => {
    document.body.classList.toggle('scroll-locked', loading || modal !== null);
    return () => document.body.classList.remove('scroll-locked');
  }, [loading, modal]);

  useEffect(() => {
    const sections = navigation.map(item => document.getElementById(item.id)).filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
    }, { rootMargin: '-20% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
    const sentinel = document.getElementById('header-sentinel');
    const headerObserver = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    if (sentinel) headerObserver.observe(sentinel);
    return () => { observer.disconnect(); headerObserver.disconnect(); };
  }, []);

  useEffect(() => {
    if (!modal || !dialogRef.current) return;
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector<HTMLButtonElement>('.dialog-close')?.focus({ preventScroll: true });
  }, [modal]);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const openModal = (next: Project | 'contact', trigger: HTMLElement) => { triggerRef.current = trigger; setDialogClosing(false); setCopied(false); setModal(next); };
  const finishModalClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    dialogRef.current?.close();
  };
  const closeModal = () => {
    if (!dialogRef.current?.open || closeTimer.current) return;
    if (reduced) { finishModalClose(); return; }
    setDialogClosing(true);
    closeTimer.current = setTimeout(finishModalClose, 250);
  };
  const onDialogClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = null; setDialogClosing(false); setModal(null); triggerRef.current?.focus({ preventScroll: true }); triggerRef.current = null; };
  const copyDiscord = async () => {
    try {
      await navigator.clipboard.writeText('flow4u');
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch { setCopied(false); }
  };

  return <>
    <AnimatePresence>{loading ? <Loader progress={loadProgress} reduced={reduced} /> : null}</AnimatePresence>
    <div className="portfolio-page" inert={loading || undefined}>
      <StarsBackground className="page-stars" starColor={theme === 'dark' ? '#d5d8ed' : '#6d7b9c'} speed={90} factor={0} pointerEvents={false} />
      <div id="header-sentinel" aria-hidden="true" />
      <a className="skip-link" href="#home">Skip to content</a>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <a href="#home" className="wordmark" aria-label="flowrio, back to home"><ScrambleWordmark /></a>
        <nav aria-label="Main navigation">{navigation.map(item => <a key={item.id} href={`#${item.id}`} className={item.id === 'home' ? 'nav-home' : undefined} aria-current={activeSection === item.id ? 'location' : undefined}>{activeSection === item.id && <motion.span className="nav-indicator" layoutId="active-navigation" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }} aria-hidden="true" />}<span className="nav-label">{item.label}</span></a>)}</nav>
        <ThemeTogglerButton theme={theme} onThemeChange={setTheme} className="theme-control" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} />
        <motion.div className="page-progress" style={{ scaleX: pageProgress }} aria-hidden="true" />
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <motion.div ref={heroRef} className="hero-profile" initial={false} animate={!loading && (heroVisible || reduced) ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }} transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="profile-frame"><PixelAvatar className="profile-avatar" defaultSrc="/assets/profile-anime.png" hoverSrc="/assets/profile-kim.jpg" /><span className="profile-corner profile-corner--one" aria-hidden="true">+</span><span className="profile-corner profile-corner--two" aria-hidden="true">+</span></div>
            <h1 id="hero-title">Chayathorn Chianpolsane</h1>
            <p className="hero-role"><Typewriter /></p>
            <div className="hero-tags"><span>UX/UI</span><span className="tag-dot" aria-hidden="true">·</span><span>Game design</span><span className="tag-dot" aria-hidden="true">·</span><span>Visual craft</span></div>
          </motion.div>
          <a href="#about" className="explore-button"><span>Explore my world</span><ArrowDown aria-hidden="true" size={15} /></a>
          <div className="hero-bottom"><span><i className="status-dot" />Bangkok University · Year 01</span><span className="hero-scroll">SCROLL TO EXPLORE <ArrowDown size={11} aria-hidden="true" /></span></div>
        </section>

        <section className="section about-section" id="about" aria-labelledby="about-title">
          <Depth><p className="eyebrow"><span>01</span> About me</p></Depth>
          <div className="about-layout">
            <Depth className="about-introduction"><CyclingAboutTitle id="about-title" /><p className="about-lead">I’m Kim — a first-year Games and Interactive Media student at Bangkok University.</p><div className="study-strip"><span className="study-mark">BU</span><div><strong>Bangkok University</strong><span>Games and Interactive Media</span></div><span className="year-label">YEAR 01</span></div></Depth>
            <Depth className="about-story"><p className="about-copy">I love UX/UI design and the visual side of games, especially lighting and graphics. I’m curious about how an interface feels, how a scene sets a mood, and how small details shape an experience.</p><p className="about-copy">Before this, I edited gaming montages. That’s where my interest in rhythm, storytelling, and visual craft started — and it still influences the way I create.</p><div className="interest-row"><span><Grid2X2 size={15} />UX/UI design</span><span><Lightbulb size={15} />Game lighting</span><span><Gamepad2 size={15} />Game graphics</span><span><Film size={15} />Montage editing</span></div></Depth>
          </div>
          <Depth><div className="tools-block"><p className="eyebrow">My creative toolkit</p><LoopingMarquee label="Creative tools" contentClassName="tool-list" durationSeconds={40}>{toolkit.map(tool => <div className="tool-item" key={tool}><ToolIcon tool={tool} /><span>{tool}</span></div>)}</LoopingMarquee></div></Depth>
          <Depth><div className="technology-block"><p className="eyebrow">The technology behind my projects</p><div className="technology-grid">{technologyGroups.map((group, index) => <div className="technology-group" key={group.label}><h3>{group.label}</h3><LoopingMarquee label={group.label} contentClassName="technology-list" direction={index % 2 ? 'right' : 'left'} durationSeconds={32 + index * 4}>{group.items.map(item => <span key={item}>{item}</span>)}</LoopingMarquee></div>)}</div></div></Depth>
        </section>

        <section className="section projects-section" id="projects" aria-labelledby="projects-title">
          <Depth><div className="section-heading"><div><p className="eyebrow"><span>02</span> Selected projects</p><h2 id="projects-title">Ideas taking<br /><i>shape.</i></h2></div><p className="section-intro">Games, useful tools, and what comes next.<br />Scroll through the collection.</p></div></Depth>
          <Depth><ProjectGallery projects={projects} onOpen={openModal} /></Depth>
          <Depth><p className="draft-note"><span aria-hidden="true">+</span> Work in progress. More screens, stories, and details coming soon.</p></Depth>
        </section>

        <section className="section contact-section" id="contact" aria-labelledby="contact-title">
          <Depth><div className="contact-content"><p className="eyebrow"><span>03</span> Let’s connect</p><h2 id="contact-title">Good things start<br />with a <i>hello.</i></h2><p>Have an idea, a project, or a shared love for design?<br />I’d love to hear about it.</p><button className="contact-button" onClick={event => openModal('contact', event.currentTarget)}>Say hello <ArrowUpRight size={18} aria-hidden="true" /></button><span className="contact-note">Design. Games. Whatever comes next.</span></div></Depth>
          <Depth><div className="social-links"><a href="mailto:flowxyzy@gmail.com"><BrandIcon brand="gmail" /><span>flowxyzy@gmail.com</span></a><button onClick={event => openModal('contact', event.currentTarget)}><BrandIcon brand="discord" /><span>flow4u</span></button><a href="https://github.com/flow4u11" target="_blank" rel="noopener noreferrer"><BrandIcon brand="github" /><span>flow4u11</span></a></div></Depth>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><a className="wordmark" href="#home" aria-label="flowrio, back to home"><ScrambleWordmark /></a><p>© {new Date().getFullYear()} · Made with curiosity.</p></div><VisitsCounter /><a className="back-to-top" href="#home">Back to top <ArrowUp size={13} aria-hidden="true" /></a></footer>
    </div>

    <dialog ref={dialogRef} className={`detail-dialog ${modal === 'contact' ? 'detail-dialog--contact' : ''}`} aria-labelledby="dialog-title" data-closing={dialogClosing || undefined} onClose={onDialogClose} onCancel={event => { event.preventDefault(); closeModal(); }} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'dialog-out') finishModalClose(); }} onPointerDown={event => { const rect = event.currentTarget.getBoundingClientRect(); outsideDown.current = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; }} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; if (outsideDown.current && outside) closeModal(); outsideDown.current = false; }}>
      <button className="dialog-close" onClick={closeModal} aria-label="Close preview"><X size={18} /></button>
      {modal === 'contact' ? <div className="contact-dialog-content"><p className="eyebrow">Let’s make a connection</p><h2 id="dialog-title">Hello, <i>Kim.</i></h2><p>A project idea, a design conversation, or just a hello — find me here.</p><div className="contact-channels"><a href="mailto:flowxyzy@gmail.com"><BrandIcon brand="gmail" /><span><strong>Gmail</strong>flowxyzy@gmail.com</span><ArrowUpRight size={16} /></a><button onClick={copyDiscord}><BrandIcon brand="discord" /><span><strong>Discord</strong>flow4u</span>{copied ? <Check size={16} /> : <span className="copy-hint">Copy</span>}</button><a href="https://github.com/flow4u11" target="_blank" rel="noopener noreferrer"><BrandIcon brand="github" /><span><strong>GitHub</strong>flow4u11</span><ArrowUpRight size={16} /></a></div><span className="copy-status" aria-live="polite">{copied ? 'Discord username copied.' : 'Click Discord to copy my username.'}</span></div> : modal ? <><img className="dialog-cover" src={modal.image} alt={modal.alt} width="1200" height="800" /><div className="dialog-content"><p className="eyebrow">{modal.status}</p><h2 id="dialog-title">{modal.title}</h2><p>{modal.description}</p>{modal.liveUrl && <div className="project-links"><a href={modal.liveUrl} target="_blank" rel="noopener noreferrer">Visit website <ArrowUpRight size={14} /></a><a href={modal.sourceUrl} target="_blank" rel="noopener noreferrer"><BrandIcon brand="github" /> GitHub</a></div>}<div className="project-tags">{modal.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="case-study-rows">{modal.details.map(item => <div key={item.label}><h3>{item.label}</h3><p>{item.text}</p></div>)}</div><p className="case-study-note">{modal.liveUrl ? 'An original illustrated cover. Open the live website to explore the actual app.' : 'Concept cover for a project in development. Gameplay captures are coming soon.'}</p></div></> : null}
    </dialog>
  </>;
}
