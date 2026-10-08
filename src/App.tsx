import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring, type Variants } from 'motion/react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Film, Gamepad2, Grid2X2, Lightbulb, X } from 'lucide-react';
import { ThemeTogglerButton } from './components/animate-ui/theme-toggler';
import { StarsBackground } from './components/animate-ui/stars-background';
import { PixelAvatar } from './components/PixelAvatar';
import { Typewriter } from './components/Typewriter';
import { ToolBrandIcon } from './components/ToolBrandIcon';
import { ScrollReveal as Depth } from './components/ScrollReveal';
import { AnimatedName } from './components/AnimatedName';
import { FooterConfetti } from './components/FooterConfetti';
import { LanguageControl, LocalizedCopy, type Language } from './components/LocalizedCopy';
import { copy, getProjects, toolkitRows, technologyRows } from './content';
import { ThemeLab } from './components/ThemeLab';
import { useSpecialTheme } from './components/useSpecialTheme';
import { SpecialThemeControl } from './components/SpecialThemeControl';
import { ScrambleWordmark } from './components/ScrambleWordmark';
import { CyclingAboutTitle } from './components/CyclingAboutTitle';
import { LoopingMarquee } from './components/LoopingMarquee';
import { ProjectGallery, type Project } from './components/ProjectGallery';
import { MotionSettingsDialog, FpsOverlay, useMotionSettings } from './components/MotionSettings';
import { useSectionNavigation } from './components/useSectionNavigation';
import { IdleGlare, ProfileCheck } from './components/IdleDetails';
import { PortfolioLoader } from './components/PortfolioLoader';
import { ExperienceStatus, GraduationYears } from './components/InformationMotion';
import { SectionTitle } from './components/SectionTitle';
import { PixelTrail } from './components/PixelTrail';
import { HeroPlayground } from './components/HeroPlayground';

type Theme = 'light' | 'dark';
const heroPart: Variants = {
  hidden: { opacity: 0, y: 48, rotateX: 28, rotateZ: -3, scale: .9 },
  shown: ({ delay, speed, reduced }: { delay: number; speed: number; reduced: boolean }) => ({
    opacity: 1, y: 0, rotateX: 0, rotateZ: 0, scale: 1,
    transition: reduced ? { duration: 0 } : {
      type: 'spring', stiffness: 105 * speed ** 2, damping: 16 * speed, mass: .85,
      delay: delay / speed, opacity: { duration: .48 / speed, delay: delay / speed },
    },
  }),
};
const navigation = [{ id: 'home', label: 'Home' }, { id: 'about', label: 'About' }, { id: 'projects', label: 'Projects' }, { id: 'contact', label: 'Contact' }];

export default function App() {
  const reduced = useReducedMotion() ?? false;
  const { settings } = useMotionSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { navigate, navigating } = useSectionNavigation({ reduced, speed: settings.animationSpeed });
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
  const [heroReady, setHeroReady] = useState(false);
  const [heroEntered, setHeroEntered] = useState(false);
  const finishLoading = useCallback(() => setLoading(false), []);
  const finishLoaderExit = useCallback(() => setHeroEntered(true), []);
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
    document.body.classList.toggle('scroll-locked', loading || !heroEntered || modal !== null);
    return () => document.body.classList.remove('scroll-locked');
  }, [loading, heroEntered, modal]);

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
    closeTimer.current = setTimeout(finishModalClose, 250 / settings.animationSpeed);
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
    <AnimatePresence onExitComplete={finishLoaderExit}>{loading ? <PortfolioLoader reduced={reduced} onComplete={finishLoading} /> : null}</AnimatePresence>
    <div className="portfolio-page" inert={loading || !heroEntered || undefined}>
      <StarsBackground className="page-stars" starColor={theme === 'dark' ? '#d5d8ed' : '#6d7b9c'} factor={0} pointerEvents={false}><div className="navigation-warp" aria-hidden="true">{[8, 20, 32, 44, 56, 68, 80, 92].map((left, index) => <i key={left} style={{ left: `${left}%`, top: `${24 + index % 3 * 25}%`, rotate: `${(left - 50) * -.5}deg` }} />)}</div></StarsBackground>
      <div id="header-sentinel" aria-hidden="true" />
      <a className="skip-link" href="#home">Skip to content</a>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <button type="button" className="wordmark wordmark-settings" onClick={() => setSettingsOpen(true)} aria-label={language === 'th' ? 'เปิดการตั้งค่า' : 'Open motion settings'} aria-haspopup="dialog"><ScrambleWordmark settingsHint /></button>
        <nav aria-label="Main navigation">{navigation.map(item => <a key={item.id} href={`#${item.id}`} className={item.id === 'home' ? 'nav-home' : undefined} onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); if (!transitioning) navigate({ ...item, keyboard: event.detail === 0 }); }} aria-current={activeSection === item.id ? 'location' : undefined}>{activeSection === item.id && <motion.span className="nav-indicator" layoutId="active-navigation" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 160 * settings.animationSpeed ** 2, damping: 25 * settings.animationSpeed }} aria-hidden="true" />}<span className="nav-label">{item.label}</span></a>)}</nav>
        <div className="header-controls"><LanguageControl language={language} onChange={setLanguage} /><SpecialThemeControl active={specialTheme} onExit={exitSpecial} language={language} disabled={transitioning || navigating}><ThemeTogglerButton theme={theme} onThemeChange={setTheme} disabled={transitioning || navigating} className="theme-control" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} /></SpecialThemeControl></div>
        <motion.div className="page-progress" style={{ scaleX: pageProgress }} aria-hidden="true" />
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <HeroPlayground enabled={heroEntered && heroReady} language={language}>
          <motion.div ref={heroRef} className="hero-profile" inert={!heroReady} initial="hidden" animate={heroEntered && (heroVisible || reduced) ? 'shown' : 'hidden'}>
            <motion.div variants={heroPart} custom={{ delay: .16, speed: settings.animationSpeed, reduced }} className="profile-frame"><PixelAvatar className="profile-avatar" defaultSrc="/assets/profile-anime.png" hoverSrc="/assets/profile-photo.png" /><ProfileCheck /><span className="profile-corner profile-corner--one" aria-hidden="true">+</span><span className="profile-corner profile-corner--two" aria-hidden="true">+</span></motion.div>
            <motion.h1 variants={heroPart} custom={{ delay: .38, speed: settings.animationSpeed, reduced }} id="hero-title"><AnimatedName>Chayathorn Chianpolsane</AnimatedName></motion.h1>
            <motion.p variants={heroPart} custom={{ delay: .62, speed: settings.animationSpeed, reduced }} className="hero-role"><Typewriter /></motion.p>
            <motion.div variants={heroPart} custom={{ delay: .82, speed: settings.animationSpeed, reduced }} className="hero-tags"><span>UX/UI</span><span className="tag-dot" aria-hidden="true">·</span><span>Game design</span><span className="tag-dot" aria-hidden="true">·</span><span>Visual craft</span></motion.div>
          </motion.div>
          <motion.a variants={heroPart} initial="hidden" animate={heroEntered && (heroVisible || reduced) ? 'shown' : 'hidden'} custom={{ delay: 1.02, speed: settings.animationSpeed, reduced }} onAnimationComplete={() => { if (heroEntered) setHeroReady(true); }} href="#about" className="explore-button" inert={!heroReady} onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate({ id: 'about', label: 'About', keyboard: event.detail === 0 }); }}><span>Explore my world</span><ArrowDown aria-hidden="true" size={15} /><IdleGlare /></motion.a>
          </HeroPlayground>
        </section>

        <section className="section about-section" id="about" aria-labelledby="about-title">
          <Depth><p className="eyebrow"><span>01</span> About me</p></Depth>
          <div className="about-layout">
            <Depth className="about-introduction"><CyclingAboutTitle id="about-title" /><p className="about-lead"><LocalizedCopy text={text.lead} language={language} /></p><Depth delay={300} flat><div className="study-strip"><div><strong>Bangkok University</strong><span>Games and Interactive Media</span></div><span className="year-label" lang={language}>{text.present}</span></div></Depth><Depth delay={380} flat><dl className="personal-details" lang={language}><div><dt>{text.country}</dt><dd><LocalizedCopy text={text.countryValue} language={language} /></dd></div><div className="personal-school"><dt>{text.school}</dt><dd><LocalizedCopy text={text.schoolValue} language={language} /><GraduationYears /></dd></div></dl></Depth></Depth>
            <div className="about-story"><Depth delay={240}><p className="about-copy"><LocalizedCopy text={text.design} language={language} /></p></Depth><Depth delay={280}><p className="about-copy"><LocalizedCopy text={text.learning} language={language} /></p></Depth><Depth delay={320}><p className="about-copy"><LocalizedCopy text={text.leisure} language={language} /></p></Depth><Depth delay={260}><p className="about-copy theme-story" lang={language}>{text.themeBefore}<ThemeLab onActivate={activateSpecial} language={language} />{text.themeAfter}</p></Depth><Depth delay={300}><div className="interest-row"><span><Grid2X2 size={15} aria-hidden="true" />UX/UI design</span><span><Lightbulb size={15} aria-hidden="true" />Game lighting</span><span><Gamepad2 size={15} aria-hidden="true" />FPS games</span><span><Film size={15} aria-hidden="true" />Visual storytelling</span></div></Depth></div>
          </div>
          {[{ label: 'My creative toolkit', id: 'toolkit', rows: toolkitRows }, { label: 'The technology behind my projects', id: 'technology', rows: technologyRows }].map(collection => <Depth flat key={collection.id}><div className={`tools-block tools-block--${collection.id}`}><p className="eyebrow">{collection.label}</p><div className="toolkit-lanes">{collection.rows.map((items, index) => <div className="toolkit-lane" key={index}><LoopingMarquee label={`${collection.id === 'toolkit' ? 'Creative toolkit' : 'Project technology'}, row ${index + 1}`} contentClassName="tool-list" direction={index ? 'right' : 'left'} durationSeconds={48 + index * 8}>{items.map(tool => <div className="tool-item" key={tool}><ToolBrandIcon name={tool} /><span>{tool}</span></div>)}</LoopingMarquee></div>)}</div></div></Depth>)}
        </section>

        <section className="section projects-section" id="projects" aria-labelledby="projects-title">
          <Depth><div className="section-heading"><div><p className="eyebrow"><span>02</span> Selected projects</p><SectionTitle id="projects-title" first="Ideas taking" last="shape." /></div><p className="section-intro"><LocalizedCopy text={text.projectIntro} language={language} /></p></div></Depth>
          <div className="showcase-renderer"><ProjectGallery projects={projects} onOpen={openModal} language={language} staticDesign={specialTheme} /></div>
        </section>

        <section className="section contact-section" id="contact" aria-labelledby="contact-title">
          <Depth><div className="contact-content"><p className="eyebrow"><span>03</span> Let’s connect</p><SectionTitle id="contact-title" first="Good things start" last="with a hello." /><p><LocalizedCopy text={text.contact} language={language} /></p><button className="contact-button" onClick={event => openModal('contact', event.currentTarget)}>{text.hello} <ArrowUpRight size={18} aria-hidden="true" /><IdleGlare /></button><span className="contact-note"><ExperienceStatus language={language} /></span></div></Depth>
          <Depth><div className="social-links"><a href="mailto:flowxyzy@gmail.com"><ToolBrandIcon name="Gmail" /><span>flowxyzy@gmail.com</span></a><a href="https://discord.com/users/845863458628567050" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Discord" /><span>flow4u</span></a><a href="https://github.com/flow4u11" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" /><span>flow4u11</span></a><a href="https://fastwork.co/user/flow4u?source=web_marketplace_profile-menu_profile" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Fastwork" /><span>Fastwork</span></a><a href="https://www.instagram.com/flow3u/" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Instagram" /><span>flow3u</span></a></div></Depth>
        </section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><a className="wordmark" href="#home" aria-label="flowrio, back to home"><ScrambleWordmark /></a><p>© {new Date().getFullYear()} · Made with curiosity.</p><p className="design-credit"><LocalizedCopy text={text.footer} language={language} /></p></div>{!loading && <FooterConfetti />}<a className="back-to-top" href="#home" onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate({ id: 'home', label: 'Home', keyboard: event.detail === 0 }); }}>Back to top <ArrowUp size={13} aria-hidden="true" /></a></footer>
    </div>
    <PixelTrail enabled={heroEntered} />
    <FpsOverlay />
    <MotionSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} language={language} />

    <dialog ref={dialogRef} className={`detail-dialog ${modal === 'contact' ? 'detail-dialog--contact' : ''}`} aria-labelledby="dialog-title" data-closing={dialogClosing || undefined} onClose={onDialogClose} onCancel={event => { event.preventDefault(); closeModal(); }} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'dialog-out') finishModalClose(); }} onPointerDown={event => { const rect = event.currentTarget.getBoundingClientRect(); outsideDown.current = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; }} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; if (outsideDown.current && outside) closeModal(); outsideDown.current = false; }}>
      <button className="dialog-close" onClick={closeModal} aria-label={text.close}><X size={18} /></button>
      {modal === 'contact' ? <div className="contact-dialog-content"><p className="eyebrow">Let’s make a connection</p><h2 id="dialog-title">Let’s <i>talk.</i></h2><p><LocalizedCopy text={text.contactDialog} language={language} /></p><div className="contact-channels"><a href="mailto:flowxyzy@gmail.com"><ToolBrandIcon name="Gmail" /><span><strong>Gmail</strong>flowxyzy@gmail.com</span><ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://github.com/flow4u11" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" /><span><strong>GitHub</strong>flow4u11</span><ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://fastwork.co/user/flow4u?source=web_marketplace_profile-menu_profile" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Fastwork" /><span><strong>Fastwork</strong>flow4u</span><ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://www.instagram.com/flow3u/" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Instagram" /><span><strong>Instagram</strong>flow3u</span><ArrowUpRight size={16} aria-hidden="true" /></a><div className="discord-channel"><a href="https://discord.com/users/845863458628567050" target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="Discord" /><span><strong>Discord</strong>flow4u</span><ArrowUpRight size={16} aria-hidden="true" /></a><button onClick={copyDiscord} aria-label={language === 'th' ? 'คัดลอกชื่อ Discord' : 'Copy Discord username'}>{copied ? <Check size={16} aria-hidden="true" /> : text.copy}</button></div></div><span className="copy-status" aria-live="polite">{copied ? text.copied : text.copyHint}</span></div> : modal ? <><img className="dialog-cover" src={modal.image} alt={modal.alt} width="1200" height="800" /><div className="dialog-content"><p className="eyebrow">{modal.status}</p><h2 id="dialog-title">{modal.title}</h2><p lang={language}>{modal.description}</p><div className="project-links">{modal.videoUrl && <a href={modal.videoUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="YouTube" />{text.video}<ArrowUpRight size={14} aria-hidden="true" /></a>}{modal.liveUrl && <a href={modal.liveUrl} target="_blank" rel="noopener noreferrer">{text.visit}<ArrowUpRight size={14} aria-hidden="true" /></a>}{modal.sourceUrl && <a href={modal.sourceUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" />GitHub</a>}</div>{modal.videoId && <div className="gameplay-video"><iframe src={`https://www.youtube-nocookie.com/embed/${modal.videoId}`} title="LastStand gameplay" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen /></div>}<div className="project-tags">{modal.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="case-study-rows" lang={language}>{modal.details.map(item => <div key={item.label}><h3>{item.label}</h3><p>{item.text}</p></div>)}</div><p className="case-study-note" lang={language}>{modal.videoUrl ? text.cover : text.webCover}</p></div></> : null}
    </dialog>
  </>;
}
