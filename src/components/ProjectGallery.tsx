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
  onOpen: (project: Project, trigger: HTMLElement) => void;
};

const futureSlots = [
  { id: 'future-01', cover: 'orbit', caption: 'An open canvas' },
  { id: 'future-02', cover: 'grid', caption: 'Room to explore' },
  { id: 'future-03', cover: 'fold', caption: 'The next chapter' },
] as const;

type GalleryPosition = { index: number; atStart: boolean; atEnd: boolean };

export function ProjectGallery({ projects, onOpen, language = 'en' }: ProjectGalleryProps) {
  const thai = language === 'th';
  const { settings } = useMotionSettings();
  const { ref: galleryRef, active, reduced } = useIdleMotion<HTMLDivElement>();
  const rendererRef = useRef<FlexCarouselHandle>(null);
  const [Renderer, setRenderer] = useState<ComponentType<FlexCarouselProps> | null>(null);
  const [webglReady, setWebglReady] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const enhanced = webglReady && !reduced && !webglUnavailable;
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

  useEffect(() => {
    if (!active || Renderer || webglUnavailable) return;
    let cancelled = false;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let lastScroll = performance.now();
    let loaded: ComponentType<FlexCarouselProps> | undefined;
    let importing = false;
    const initialise = () => {
      if (cancelled || document.hidden) return;
      if (loaded) { setRenderer(() => loaded!); return; }
      if (importing) return;
      importing = true;
      void import('./react-bits/FlexCarousel').then(module => {
        if (cancelled || document.hidden) return;
        loaded = module.default;
        // A resource response may arrive during another scroll; mounting the
        // renderer still waits for the same quiet period before shader setup.
        arm();
      }).catch(() => { if (!cancelled) setWebglUnavailable(true); });
    };
    const arm = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(initialise, Math.max(0, 220 - (performance.now() - lastScroll)));
    };
    const onScroll = () => { lastScroll = performance.now(); arm(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    arm();
    return () => {
      cancelled = true;
      clearTimeout(quietTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [active, Renderer, webglUnavailable]);

  useEffect(() => { if (reduced) setWebglReady(false); }, [reduced]);

  const updateActive = useCallback((index: number) => {
    const previous = positionRef.current;
    const next = { index, atStart: index === 0, atEnd: index === total - 1 };
    if (previous.index === next.index && previous.atStart === next.atStart && previous.atEnd === next.atEnd) return;
    positionRef.current = next;
    setPosition(next);
  }, [total]);
  const onRendererReady = useCallback(() => setWebglReady(true), []);
  const onRendererUnavailable = useCallback(() => { setWebglUnavailable(true); setWebglReady(false); }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || enhanced) return;
    let frame = 0;

    const updatePosition = () => {
      frame = 0;
      const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
      const atStart = track.scrollLeft <= 2;
      const atEnd = maximum - track.scrollLeft <= 2;
      const cards = Array.from(track.querySelectorAll<HTMLElement>('.pg-card'));
      let index = 0;
      let distance = Infinity;
      cards.forEach((card, cardIndex) => {
        const nextDistance = Math.abs(card.offsetLeft - track.scrollLeft);
        if (nextDistance < distance) {
          index = cardIndex;
          distance = nextDistance;
        }
      });
      // The final card aligns with the right edge when the gallery reaches its end.
      if (atEnd && !atStart) index = cards.length - 1;
      const previous = positionRef.current;
      if (previous.index !== index || previous.atStart !== atStart || previous.atEnd !== atEnd) {
        const next = { index, atStart, atEnd };
        positionRef.current = next;
        setPosition(next);
      }
    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updatePosition);
    };
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(track);
    const current = track.querySelectorAll<HTMLElement>('.pg-card')[positionRef.current.index];
    if (current) track.scrollLeft = Math.min(current.offsetLeft, Math.max(0, track.scrollWidth - track.clientWidth));
    updatePosition();
    return () => {
      track.removeEventListener('scroll', scheduleUpdate);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [total, enhanced]);

  const goTo = (index: number) => {
    if (enhanced) { rendererRef.current?.goTo(Math.max(0, Math.min(index, total - 1))); return; }
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>('.pg-card');
    const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
    if (!card) return;
    const left = Math.min(card.offsetLeft, Math.max(0, track.scrollWidth - track.clientWidth));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left, behavior: reducedMotion ? 'instant' : 'smooth' });
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
    else return;
    event.preventDefault();
  };

  const currentLabel = projects[position.index]?.title ?? 'Empty future project slot';

  return <div className="project-gallery" ref={galleryRef} data-enhanced={enhanced || undefined}>
    <div className="pg-toolbar">
      <p className="pg-summary"><span>{String(projects.length).padStart(2, '0')} projects</span><span aria-hidden="true">/</span><span>03 open slots</span></p>
      <span className="pg-instruction" id={instructionId}>{thai ? 'ลากหรือใช้ลูกศรเพื่อสำรวจ' : 'Drag, swipe, or use the arrows to explore.'}<span className="pg-sr-only"> When the gallery is focused, use Left and Right arrow keys. Home goes to the first card and End goes to the last.</span></span>
    </div>

    <div className="pg-showcase" data-ready={enhanced || undefined}>
      {Renderer && !reduced && !webglUnavailable && <div className="pg-stage" aria-hidden={!enhanced || undefined} inert={!enhanced}>
        <Renderer
          ref={rendererRef}
          id={`${trackId}-visual`}
          items={items}
          initialIndex={positionRef.current.index}
          preset={settings.galleryPreset}
          speed={settings.gallerySpeed * settings.animationSpeed}
          bend={settings.galleryBend}
          intro="bloom"
          cardHeight={0.79}
          fit="landscape"
          gap={24}
          radius={16}
          liquid={0.28}
          focusOnClick={false}
          captureWheel={false}
          label={thai ? 'แกลเลอรีโปรเจกต์' : 'Project gallery'}
          descriptionId={instructionId}
          onChange={updateActive}
          onReady={onRendererReady}
          onUnavailable={onRendererUnavailable}
          onSelect={(index, _item, trigger) => { const project = projects[index]; if (project) onOpen(project, trigger); }}
        />
      </div>}
      <div className="pg-controls" aria-label="Gallery controls">
        <button className="pg-nav" type="button" aria-label="Previous project" aria-controls={enhanced ? `${trackId}-visual` : trackId} disabled={position.atStart} onClick={() => moveBy(-1)}><ArrowLeft size={18} aria-hidden="true" /></button>
        <button className="pg-nav" type="button" aria-label="Next project" aria-controls={enhanced ? `${trackId}-visual` : trackId} disabled={position.atEnd} onClick={() => moveBy(1)}><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </div>

    <div
      className={`pg-track${enhanced ? ' pg-track--enhanced' : ''}`}
      id={trackId}
      ref={trackRef}
      role={enhanced ? 'group' : 'region'}
      aria-label={enhanced ? (thai ? 'รายละเอียดโปรเจกต์' : 'Project details') : 'Project gallery'}
      aria-roledescription={enhanced ? undefined : 'carousel'}
      aria-describedby={instructionId}
      tabIndex={enhanced ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {projects.map((project, index) => <article className="pg-card" key={project.id} hidden={enhanced && position.index !== index} aria-label={`${index + 1} of ${total}: ${project.title}`}>
        <button className="pg-project-trigger" onClick={event => onOpen(project, event.currentTarget)} aria-label={`Explore ${project.title}`}>
          <span className="pg-cover">
            <img src={project.image} alt={project.alt} width="1200" height="800" loading="lazy" decoding="async" />
            <span className="pg-status"><span aria-hidden="true" />{project.status}</span>
            <span className="pg-view" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </span>
          <span className="pg-caption">
            <span className="pg-number"><ProjectMotionNumber value={index + 1} enabled={!enhanced || position.index === index} /></span>
            <span className="pg-title"><strong>{project.title}</strong><span>{project.category}</span></span>
            <ArrowUpRight size={19} aria-hidden="true" />
          </span>
        </button>
        <div className="pg-body">
          <p className="pg-description"><ProjectMotionCopy text={project.description} language={language} enabled={!enhanced || position.index === index} /></p>
          <div className="pg-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          {(project.liveUrl || project.sourceUrl || project.videoUrl) && <div className="pg-links">
            {project.videoUrl && <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="YouTube" />{thai ? 'ชมเกมเพลย์' : 'Watch gameplay'}<ArrowUpRight size={13} aria-hidden="true" /></a>}
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">{thai ? 'เปิดเว็บไซต์' : 'Visit website'} <ArrowUpRight size={13} aria-hidden="true" /></a>}
            {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" />Source code</a>}
          </div>}
        </div>
      </article>)}

      {futureSlots.map((slot, index) => <article className="pg-card pg-card--future" key={slot.id} hidden={enhanced && position.index !== projects.length + index} aria-label={`${projects.length + index + 1} of ${total}: Empty future project slot`}>
        <div className={`pg-cover pg-future-cover pg-future-cover--${slot.cover}`} aria-hidden="true">
          <span className="pg-status"><Plus size={9} />OPEN SLOT</span>
          <span className="pg-future-art"><span /><span /><span /></span>
          <span className="pg-future-cover-label">{slot.caption}</span>
          <span className="pg-future-cover-number">{String(projects.length + index + 1).padStart(2, '0')}</span>
        </div>
        <div className="pg-caption">
          <span className="pg-number"><ProjectMotionNumber value={projects.length + index + 1} enabled={!enhanced || position.index === projects.length + index} /></span>
          <span className="pg-title"><strong>Future project</strong><span>Empty slot · Coming later</span></span>
          <Plus size={19} aria-hidden="true" />
        </div>
        <div className="pg-body">
          <p className="pg-description"><ProjectMotionCopy language={language} enabled={!enhanced || position.index === projects.length + index} text={thai ? 'พื้นที่สำหรับไอเดียถัดไป โปรเจกต์ เรื่องราว และรายละเอียดใหม่ ๆ จะอยู่ที่นี่เมื่อพร้อม' : 'A little space for what comes next. A new project, its story, and the details will live here when they’re ready.'} /></p>
          <p className="pg-empty-note"><span aria-hidden="true" />No project added yet</p>
        </div>
      </article>)}
    </div>

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
