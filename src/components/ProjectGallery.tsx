import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { ToolBrandIcon } from './ToolBrandIcon';
import type { Language } from './LocalizedCopy';
import { ProjectMotionCopy, ProjectMotionNumber } from './ProjectMotionText';
import { useMotionSettings } from './MotionSettings';
import { useIdleMotion } from './useIdleMotion';
import type { FlexCarouselHandle, FlexCarouselProps } from './react-bits/FlexCarousel';
import './project-gallery.css';

export type Project = {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  description: string;
  tags: string[];
  details: { label: string; text: string }[];
  status: string;
  liveUrl?: string;
  sourceUrl?: string;
  videoUrl?: string;
  videoId?: string;
};

type ProjectGalleryProps = {
  projects: Project[];
  language?: Language;
  staticDesign?: boolean;
  onOpen: (project: Project, trigger: HTMLElement) => void;
};

const futureSlots = [
  { id: 'future-01', cover: 'orbit', caption: 'An open canvas' },
  { id: 'future-02', cover: 'grid', caption: 'Room to explore' },
  { id: 'future-03', cover: 'fold', caption: 'The next chapter' },
] as const;

type GalleryPosition = { index: number; atStart: boolean; atEnd: boolean };

export function ProjectGallery({ projects, onOpen, language = 'en', staticDesign = false }: ProjectGalleryProps) {
  const thai = language === 'th';
  const { settings } = useMotionSettings();
  const { ref: galleryRef, reduced } = useIdleMotion<HTMLDivElement>();
  const rendererRef = useRef<FlexCarouselHandle>(null);
  const [Renderer, setRenderer] = useState<ComponentType<FlexCarouselProps> | null>(null);
  const preparedImages = useRef(new Map<string, HTMLImageElement>());
  const [coversReady, setCoversReady] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [presentationEnhanced, setPresentationEnhanced] = useState(false);
  const rendererReady = useRef(false);
  const galleryVisible = useRef(false);
  const enhanced = presentationEnhanced && !reduced && !webglUnavailable && !staticDesign;
  const trackRef = useRef<HTMLDivElement>(null);
  const instructionId = useId();
  const trackId = useId();
  const total = projects.length + futureSlots.length;
  const [position, setPosition] = useState<GalleryPosition>({ index: 0, atStart: true, atEnd: false });
  const positionRef = useRef(position);
  const items = useMemo(() => [
    ...projects.map(project => ({ src: project.image, alt: project.alt, title: project.title, subtitle: project.category })),
    ...futureSlots.map(slot => ({ src: `/assets/project-future-${slot.cover}.svg`, alt: slot.caption, title: thai ? 'โปรเจกต์ในอนาคต' : 'Future project' })),
  ], [projects, thai]);
  const coverKey = items.map(item => item.src).join('|');

  // Resource loading starts with the page. Shader construction has its own
  // scroll-quiet idle gate, and an offscreen warmup paints the final image once.
  useEffect(() => {
    if (reduced || staticDesign || webglUnavailable) return;
    let cancelled = false;
    void import('./react-bits/FlexCarousel').then(module => {
      if (!cancelled) setRenderer(() => module.default);
    }).catch(() => { if (!cancelled) setWebglUnavailable(true); });
    const sources = coverKey.split('|');
    void Promise.all(sources.map(src => new Promise<void>(resolve => {
      if (preparedImages.current.has(src)) { resolve(); return; }
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        void image.decode().catch(() => {}).then(() => {
          preparedImages.current.set(src, image);
          resolve();
        });
      };
      image.onerror = () => resolve();
      image.src = src;
    }))).then(() => { if (!cancelled) setCoversReady(true); });
    return () => { cancelled = true; };
  }, [coverKey, reduced, staticDesign, webglUnavailable]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const observer = new IntersectionObserver(([entry]) => {
      galleryVisible.current = entry.isIntersecting;
      // Never exchange renderers in front of the visitor. A late warmup is
      // adopted after leaving, ready for the next gallery visit.
      if (!entry.isIntersecting && rendererReady.current) {
        rendererRef.current?.syncTo(positionRef.current.index);
        setPresentationEnhanced(true);
      }
    });
    observer.observe(gallery);
    return () => observer.disconnect();
  }, [galleryRef]);

  useEffect(() => {
    if (reduced || staticDesign) {
      rendererReady.current = false;
      setPresentationEnhanced(false);
    }
  }, [reduced, staticDesign]);

  const updateActive = useCallback((index: number) => {
    const previous = positionRef.current;
    const next = { index, atStart: index === 0, atEnd: index === total - 1 };
    if (previous.index === next.index && previous.atStart === next.atStart && previous.atEnd === next.atEnd) return;
    positionRef.current = next;
    setPosition(next);
  }, [total]);
  const onRendererReady = useCallback(() => {
    rendererReady.current = true;
    if (!galleryVisible.current) setPresentationEnhanced(true);
  }, []);
  const onRendererUnavailable = useCallback(() => {
    rendererReady.current = false;
    setWebglUnavailable(true);
    setPresentationEnhanced(false);
  }, []);
  const onRendererChange = useCallback((index: number) => {
    if (enhanced) updateActive(index);
  }, [enhanced, updateActive]);

  useEffect(() => {
    if (!enhanced && rendererReady.current) rendererRef.current?.syncTo(position.index);
  }, [enhanced, position.index]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || enhanced) return;
    let frame = 0;
    const cards = Array.from(track.querySelectorAll<HTMLElement>('.pg-art-card'));
    const targetLeft = (card: HTMLElement) => card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    const updatePosition = () => {
      frame = 0;
      let index = 0;
      let distance = Infinity;
      cards.forEach((card, cardIndex) => {
        const nextDistance = Math.abs(targetLeft(card) - track.scrollLeft);
        if (nextDistance < distance) { index = cardIndex; distance = nextDistance; }
      });
      updateActive(index);
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(updatePosition); };
    const resize = () => {
      const showcase = track.parentElement;
      if (!showcase) return;
      const height = Math.min(showcase.clientHeight * 0.79, showcase.clientWidth * 0.9 / 1.5);
      track.style.setProperty('--pg-art-width', `${height * 1.5}px`);
      track.style.setProperty('--pg-art-height', `${height}px`);
      const current = cards[positionRef.current.index];
      if (current) track.scrollLeft = targetLeft(current);
      scheduleUpdate();
    };
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    const observer = new ResizeObserver(resize);
    observer.observe(track);
    resize();
    updatePosition();
    return () => {
      track.removeEventListener('scroll', scheduleUpdate);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [total, enhanced, staticDesign, updateActive]);

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(index, total - 1));
    if (enhanced) { rendererRef.current?.goTo(target); return; }
    const track = trackRef.current;
    const card = track?.querySelectorAll<HTMLElement>('.pg-art-card')[target];
    if (!track || !card) return;
    const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left, behavior: reduced ? 'instant' : 'smooth' });
  };

  const moveBy = (delta: number) => {
    if (enhanced) rendererRef.current?.step(delta);
    else goTo(positionRef.current.index + delta);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = positionRef.current.index;
    if (event.key === 'ArrowLeft') goTo(index - 1);
    else if (event.key === 'ArrowRight') goTo(index + 1);
    else if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(total - 1);
    else if (event.key === 'Enter' && projects[index]) onOpen(projects[index], event.currentTarget);
    else return;
    event.preventDefault();
  };

  const project = projects[position.index];
  const future = futureSlots[position.index - projects.length];
  const currentLabel = project?.title ?? (thai ? 'โปรเจกต์ในอนาคต' : 'Future project');
  const currentCategory = project?.category ?? (thai ? 'พื้นที่ว่าง · เร็ว ๆ นี้' : 'Empty slot · Coming later');
  const description = project?.description ?? (thai ? 'พื้นที่สำหรับไอเดียถัดไป โปรเจกต์ เรื่องราว และรายละเอียดใหม่ ๆ จะอยู่ที่นี่เมื่อพร้อม' : 'A little space for what comes next. A new project, its story, and the details will live here when they’re ready.');
  const caption = <>
    <span className="pg-number"><ProjectMotionNumber value={position.index + 1} /></span>
    <span className="pg-title"><strong><ProjectMotionCopy text={currentLabel} language={language} /></strong><span><ProjectMotionCopy text={currentCategory} language={language} /></span></span>
    {project ? <ArrowUpRight size={19} aria-hidden="true" /> : <Plus size={19} aria-hidden="true" />}
  </>;

  return <div className="project-gallery" ref={galleryRef} data-enhanced={enhanced || undefined} data-static-design={staticDesign || undefined}>
    <div className="pg-toolbar">
      <p className="pg-summary"><span>{String(projects.length).padStart(2, '0')} projects</span><span aria-hidden="true">/</span><span>03 open slots</span></p>
      <span className="pg-instruction" id={instructionId}>{thai ? 'ลากหรือใช้ลูกศรเพื่อสำรวจ' : 'Drag, swipe, or use the arrows to explore.'}<span className="pg-sr-only"> When the gallery is focused, use Left and Right arrow keys. Home goes to the first card and End goes to the last. Enter opens the selected project.</span></span>
    </div>

    <div className="pg-showcase" data-ready={enhanced || undefined}>
      <div
        className="pg-track pg-art-track"
        id={trackId}
        ref={trackRef}
        role="region"
        aria-label={thai ? 'แกลเลอรีโปรเจกต์' : 'Project gallery'}
        aria-roledescription="carousel"
        aria-describedby={instructionId}
        aria-hidden={enhanced || undefined}
        inert={enhanced}
        tabIndex={enhanced ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {projects.map((item, index) => <article className="pg-card pg-art-card" key={item.id} aria-label={`${index + 1} of ${total}: ${item.title}`}>
          <button className="pg-project-trigger" onClick={event => onOpen(item, event.currentTarget)} aria-label={`Explore ${item.title}`}>
            <span className="pg-cover">
              <img src={item.image} alt={item.alt} width="1200" height="800" loading="eager" decoding="async" />
              <span className="pg-status"><span aria-hidden="true" />{item.status}</span>
              <span className="pg-view" aria-hidden="true"><ArrowUpRight size={20} /></span>
            </span>
          </button>
        </article>)}
        {futureSlots.map((slot, index) => <article className="pg-card pg-art-card pg-card--future" key={slot.id} aria-label={`${projects.length + index + 1} of ${total}: Empty future project slot`}>
          <div className={`pg-cover pg-future-cover pg-future-cover--${slot.cover}`} aria-hidden="true">
            <span className="pg-status"><Plus size={9} />OPEN SLOT</span>
            <span className="pg-future-art"><span /><span /><span /></span>
            <span className="pg-future-cover-label">{slot.caption}</span>
            <span className="pg-future-cover-number">{String(projects.length + index + 1).padStart(2, '0')}</span>
          </div>
        </article>)}
      </div>
      {Renderer && coversReady && !reduced && !staticDesign && !webglUnavailable && <div className="pg-stage" aria-hidden={!enhanced || undefined} inert={!enhanced}>
        <Renderer
          ref={rendererRef}
          id={`${trackId}-visual`}
          items={items}
          preparedImages={preparedImages.current}
          prewarm
          initialIndex={positionRef.current.index}
          preset={settings.galleryPreset}
          speed={settings.gallerySpeed * settings.animationSpeed}
          bend={settings.galleryBend}
          intro="none"
          cardHeight={0.79}
          fit="landscape"
          gap={24}
          radius={16}
          liquid={0.28}
          focusOnClick={false}
          captureWheel={false}
          label={thai ? 'แกลเลอรีโปรเจกต์' : 'Project gallery'}
          descriptionId={instructionId}
          onChange={onRendererChange}
          onReady={onRendererReady}
          onUnavailable={onRendererUnavailable}
          onSelect={(index, _item, trigger) => { const selected = projects[index]; if (selected) onOpen(selected, trigger); }}
        />
      </div>}
      <div className="pg-controls" aria-label="Gallery controls">
        <button className="pg-nav" type="button" aria-label="Previous project" aria-controls={enhanced ? `${trackId}-visual` : trackId} disabled={position.atStart} onClick={() => moveBy(-1)}><ArrowLeft size={18} aria-hidden="true" /></button>
        <button className="pg-nav" type="button" aria-label="Next project" aria-controls={enhanced ? `${trackId}-visual` : trackId} disabled={position.atEnd} onClick={() => moveBy(1)}><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </div>

    <article className="pg-card pg-details" data-tone={position.index % 5} aria-label={`${position.index + 1} of ${total}: ${currentLabel}`}>
      <button className="pg-project-trigger pg-detail-trigger" disabled={!project} onClick={event => { if (project) onOpen(project, event.currentTarget); }} aria-label={project ? `Explore ${project.title}` : currentLabel}><span className="pg-caption">{caption}</span></button>
      <div className="pg-body">
        <p className="pg-description"><ProjectMotionCopy text={description} language={language} /></p>
        {project && <div className="pg-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
        {project && (project.liveUrl || project.sourceUrl || project.videoUrl) && <div className="pg-links">
          {project.videoUrl && <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="YouTube" />{thai ? 'ชมเกมเพลย์' : 'Watch gameplay'}<ArrowUpRight size={13} aria-hidden="true" /></a>}
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">{thai ? 'เปิดเว็บไซต์' : 'Visit website'} <ArrowUpRight size={13} aria-hidden="true" /></a>}
          {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" />Source code</a>}
        </div>}
        {future && <p className="pg-empty-note"><span aria-hidden="true" />{thai ? 'ยังไม่มีโปรเจกต์' : 'No project added yet'}</p>}
      </div>
    </article>

    <div className="pg-pagination" aria-label={thai ? 'เลือกโปรเจกต์' : 'Choose a project'}>
      {items.map((item, index) => <button key={item.src} type="button" className="pg-dot" aria-label={`${index + 1}: ${item.title}`} aria-controls={enhanced ? `${trackId}-visual` : trackId} aria-current={position.index === index ? 'true' : undefined} onClick={() => goTo(index)}><span /></button>)}
    </div>
    <div className="pg-footer">
      <div className="pg-progress-group">
        <span className="pg-position" role="status" aria-live="polite" aria-atomic="true"><span className="pg-sr-only">{currentLabel}. Gallery position </span><strong><ProjectMotionNumber value={position.index + 1} /></strong><span aria-hidden="true"> / </span><span className="pg-sr-only">of </span>{String(total).padStart(2, '0')}</span>
        <progress className="pg-progress" value={position.index + 1} max={total} aria-label="Project gallery position" />
      </div>
    </div>
  </div>;
}
