import { useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowDown, ArrowUp, ArrowUpRight, Asterisk, Check, Film, Gamepad2, Grid2X2, Lightbulb, X } from 'lucide-react';
import { ThemeTogglerButton } from './components/animate-ui/theme-toggler';
import { StarsBackground } from './components/animate-ui/stars-background';
import { PixelAvatar } from './components/PixelAvatar';
import { Typewriter } from './components/Typewriter';
import { ToolBrandIcon } from './components/ToolBrandIcon';
import { ScrollReveal as Depth } from './components/ScrollReveal';
import { AnimatedName } from './components/AnimatedName';
import { FooterConfetti } from './components/FooterConfetti';
import { LanguageControl, LocalizedCopy, type Language } from './components/LocalizedCopy';
import { copy, getProjects, toolkitRows } from './content';
import { ThemeLab } from './components/ThemeLab';
import { useSpecialTheme } from './components/useSpecialTheme';
import { SpecialThemeControl } from './components/SpecialThemeControl';
import { ScrambleWordmark } from './components/ScrambleWordmark';
import { CyclingAboutTitle } from './components/CyclingAboutTitle';
import { LoopingMarquee } from './components/LoopingMarquee';
import { ProjectGallery, type Project } from './components/ProjectGallery';

type Theme = 'light' | 'dark';
const navigation = [{ id: 'home', label: 'Home' }, { id: 'about', label: 'About' }, { id: 'projects', label: 'Projects' }, { id: 'contact', label: 'Contact' }];

function Loader({ progress, reduced }: { progress: number; reduced: boolean }) {
  return <motion.div className="loading-screen" role="status" aria-label="Loading portfolio" initial={{ opacity: 1 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: '-12%', rotateX: -12, scale: 0.98 }} transition={{ duration: reduced ? 0.1 : 0.65, ease: [0.22, 1, 0.36, 1] }}>
    <div className="loader-top"><span>kimportflowrio</span><span>MY CREATIVE SPACE</span></div>
    <div className="loader-center"><Asterisk className="loader-star" aria-hidden="true" size={42} /><p>Welcome to<br />my <i>Portfolio.</i></p></div>
    <div className="loader-bottom"><span>LOADING EXPERIENCE</span><div className="loader-track"><motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} /></div><span>{String(progress).padStart(3, '0')}%</span></div>
  </motion.div>;
}

export default function App() {
  const reduced = useReducedMotion() ?? false;
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('portfolio-language') === 'th' ? 'th' : 'en'; } catch { return 'en'; }
  });
  const text = copy[language];
  const projects = useMemo(() => getProjects(language), [language]);
  const { specialTheme, transitioning, activateSpecial, exitSpecial } = useSpecialTheme();
  useEffect(() => {
    try { localStorage.setItem('portfolio-language', language); } catch { /* Reading still works without storage. */ }
  }, [language]);
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
    const images = ['/assets/profile-anime.png', '/assets/profile-photo.png'].map(src => new Promise<void>(resolve => {
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
        <div className="header-controls"><LanguageControl language={language} onChange={setLanguage} /><SpecialThemeControl active={specialTheme} onExit={exitSpecial} language={language} disabled={transitioning}><ThemeTogglerButton theme={theme} onThemeChange={setTheme} disabled={transitioning} className="theme-control" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} /></SpecialThemeControl></div>
        <motion.div className="page-progress" style={{ scaleX: pageProgress }} aria-hidden="true" />
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <motion.div ref={heroRef} className="hero-profile" initial={false} animate={!loading && (heroVisible || reduced) ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }} transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="profile-frame"><PixelAvatar className="profile-avatar" defaultSrc="/assets/profile-anime.png" hoverSrc="/assets/profile-photo.png" /><span className="profile-corner profile-corner--one" aria-hidden="true">+</span><span className="profile-corner profile-corner--two" aria-hidden="true">+</span></div>
            <h1 id="hero-title"><AnimatedName>Chayathorn Chianpolsane</AnimatedName></h1>
            <p className="hero-role"><Typewriter /></p>
            <div className="hero-tags"><span>UX/UI</span><span className="tag-dot" aria-hidden="true">·</span><span>Game design</span><span className="tag-dot" aria-hidden="true">·</span><span>Visual craft</span></div>
          </motion.div>
          <a href="#about" className="explore-button"><span>Explore my world</span><ArrowDown aria-hidden="true" size={15} /></a>
          <div className="hero-bottom"><span><i className="status-dot" />Based in Thailand · Creating with curiosity</span><span className="hero-scroll">SCROLL TO EXPLORE <ArrowDown size={11} aria-hidden="true" /></span></div>
        </section>

        <section className="section about-section" id="about" aria-labelledby="about-title">
          <Depth><p className="eyebrow"><span>01</span> About me</p></Depth>
          <div className="about-layout">
            <Depth className="about-introduction"><CyclingAboutTitle id="about-title" /><p className="about-lead"><LocalizedCopy text={text.lead} language={language} /></p><div className="study-strip"><div><strong>Bangkok University</strong><span>Games and Interactive Media</span></div><span className="year-label">YEAR 01</span></div><dl className="personal-details" lang={language}><div><dt>{text.birth}</dt><dd><LocalizedCopy text={text.birthValue} language={language} /></dd></div><div><dt>{text.country}</dt><dd><LocalizedCopy text={text.countryValue} language={language} /></dd></div><div className="personal-school"><dt>{text.school}</dt><dd><LocalizedCopy text={text.schoolValue} language={language} /></dd></div></dl></Depth>
            <Depth className="about-story"><p className="about-copy"><LocalizedCopy text={text.design} language={language} /></p><p className="about-copy"><LocalizedCopy text={text.learning} language={language} /></p><p className="about-copy"><LocalizedCopy text={text.leisure} language={language} /></p><p className="about-copy theme-story" lang={language}>{text.themeBefore}<ThemeLab onActivate={activateSpecial} language={language} />{text.themeAfter}</p><div className="interest-row"><span><Grid2X2 size={15} aria-hidden="true" />UX/UI design</span><span><Lightbulb size={15} aria-hidden="true" />Game lighting</span><span><Gamepad2 size={15} aria-hidden="true" />FPS games</span><span><Film size={15} aria-hidden="true" />Visual storytelling</span></div></Depth>
          </div>
          <Depth><div className="tools-block"><p className="eyebrow">My creative toolkit &amp; tech</p><div className="toolkit-lanes">{toolkitRows.map((items, index) => <div className="toolkit-lane" key={index}><LoopingMarquee label={`Creative toolkit and technology, row ${index + 1}`} contentClassName="tool-list" direction={index ? 'right' : 'left'} durationSeconds={64 + index * 8}>{items.map(tool => <div className="tool-item" key={tool}><ToolBrandIcon name={tool} /><span>{tool}</span></div>)}</LoopingMarquee></div>)}</div></div></Depth>
        </section>

        <section className="section projects-section" id="projects" aria-labelledby="projects-title">
          <Depth><div className="section-heading"><div><p className="eyebrow"><span>02</span> Selected projects</p><h2 id="projects-title">Ideas taking<br /><i>shape.</i></h2></div><p className="section-intro"><LocalizedCopy text={text.projectIntro} language={language} /></p></div></Depth>
          <Depth><ProjectGallery projects={projects} onOpen={openModal} language={language} /></Depth>
          <Depth><p className="draft-note"><span aria-hidden="true">+</span> <LocalizedCopy text={text.projectNote} language={language} /></p></Depth>
        </section>

        <section className="section contact-section" id="contact" aria-labelledby="contact-title">
          <Depth><div className="contact-content"><p className="eyebrow"><span>03</span> Let’s connect</p><h2 id="contact-title">Good things start<br />with a <i>hello.</i></h2><p><LocalizedCopy text={text.contact} language={language} /></p><button className="contact-button" onClick={event => openModal('contact', event.currentTarget)}>{text.hello} <ArrowUpRight size={18} aria-hidden="true" /></button><span className="contact-note">Design. Games. Whatever comes next.</span></div></Depth>
          <Depth><div className="social-links"><a href="mailto:flowxyzy@gmail.com"><ToolBrandIcon name="Gmail" /><span>flowxyzy@gmail.com</span></a><a href="https://discord.com/users/845863458628567050" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Discord" /><span>flow4u</span></a><a href="https://github.com/flow4u11" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" /><span>flow4u11</span></a><a href="https://fastwork.co/user/flow4u?source=web_marketplace_profile-menu_profile" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Fastwork" /><span>Fastwork</span></a></div></Depth>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><a className="wordmark" href="#home" aria-label="flowrio, back to home"><ScrambleWordmark /></a><p>© {new Date().getFullYear()} · Made with curiosity.</p><p className="design-credit"><LocalizedCopy text={text.footer} language={language} /></p></div>{!loading && <FooterConfetti />}<a className="back-to-top" href="#home">Back to top <ArrowUp size={13} aria-hidden="true" /></a></footer>
    </div>

    <dialog ref={dialogRef} className={`detail-dialog ${modal === 'contact' ? 'detail-dialog--contact' : ''}`} aria-labelledby="dialog-title" data-closing={dialogClosing || undefined} onClose={onDialogClose} onCancel={event => { event.preventDefault(); closeModal(); }} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'dialog-out') finishModalClose(); }} onPointerDown={event => { const rect = event.currentTarget.getBoundingClientRect(); outsideDown.current = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; }} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; if (outsideDown.current && outside) closeModal(); outsideDown.current = false; }}>
      <button className="dialog-close" onClick={closeModal} aria-label={text.close}><X size={18} /></button>
      {modal === 'contact' ? <div className="contact-dialog-content"><p className="eyebrow">Let’s make a connection</p><h2 id="dialog-title">Let’s <i>talk.</i></h2><p><LocalizedCopy text={text.contactDialog} language={language} /></p><div className="contact-channels"><a href="mailto:flowxyzy@gmail.com"><ToolBrandIcon name="Gmail" /><span><strong>Gmail</strong>flowxyzy@gmail.com</span><ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://github.com/flow4u11" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" /><span><strong>GitHub</strong>flow4u11</span><ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://fastwork.co/user/flow4u?source=web_marketplace_profile-menu_profile" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Fastwork" /><span><strong>Fastwork</strong>flow4u</span><ArrowUpRight size={16} aria-hidden="true" /></a><div className="discord-channel"><a href="https://discord.com/users/845863458628567050" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Discord" /><span><strong>Discord</strong>flow4u</span><ArrowUpRight size={16} aria-hidden="true" /></a><button onClick={copyDiscord} aria-label={language === 'th' ? 'คัดลอกชื่อ Discord' : 'Copy Discord username'}>{copied ? <Check size={16} aria-hidden="true" /> : text.copy}</button></div></div><span className="copy-status" aria-live="polite">{copied ? text.copied : text.copyHint}</span></div> : modal ? <><img className="dialog-cover" src={modal.image} alt={modal.alt} width="1200" height="800" /><div className="dialog-content"><p className="eyebrow">{modal.status}</p><h2 id="dialog-title">{modal.title}</h2><p lang={language}>{modal.description}</p><div className="project-links">{modal.videoUrl && <a href={modal.videoUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="YouTube" />{text.video}<ArrowUpRight size={14} aria-hidden="true" /></a>}{modal.liveUrl && <a href={modal.liveUrl} target="_blank" rel="noopener noreferrer">{text.visit}<ArrowUpRight size={14} aria-hidden="true" /></a>}{modal.sourceUrl && <a href={modal.sourceUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" />GitHub</a>}</div>{modal.videoId && <div className="gameplay-video"><iframe src={`https://www.youtube-nocookie.com/embed/${modal.videoId}`} title="LastStand gameplay" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div>}<div className="project-tags">{modal.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="case-study-rows" lang={language}>{modal.details.map(item => <div key={item.label}><h3>{item.label}</h3><p>{item.text}</p></div>)}</div><p className="case-study-note" lang={language}>{modal.videoUrl ? text.cover : text.webCover}</p></div></> : null}
    </dialog>
  </>;
}
