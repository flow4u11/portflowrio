import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { ToolBrandIcon } from './ToolBrandIcon';
import { LocalizedCopy, type Language } from './LocalizedCopy';
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
  const trackRef = useRef<HTMLDivElement>(null);
  const instructionId = useId();
  const trackId = useId();
  const total = projects.length + futureSlots.length;
  const [position, setPosition] = useState<GalleryPosition>({ index: 0, atStart: true, atEnd: false });
  const positionRef = useRef(position);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
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
    updatePosition();
    return () => {
      track.removeEventListener('scroll', scheduleUpdate);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [total]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>('.pg-card');
    const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
    if (!card) return;
    const left = Math.min(card.offsetLeft, Math.max(0, track.scrollWidth - track.clientWidth));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left, behavior: reducedMotion ? 'instant' : 'smooth' });
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

  return <div className="project-gallery">
    <div className="pg-toolbar">
      <p className="pg-summary"><span>{String(projects.length).padStart(2, '0')} projects</span><span aria-hidden="true">/</span><span>03 open slots</span></p>
      <span className="pg-instruction" id={instructionId}>Swipe or use the arrows to explore.<span className="pg-sr-only"> When the gallery is focused, use Left and Right arrow keys. Home goes to the first card and End goes to the last.</span></span>
    </div>

    <div
      className="pg-track"
      id={trackId}
      ref={trackRef}
      role="region"
      aria-label="Project gallery"
      aria-roledescription="carousel"
      aria-describedby={instructionId}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {projects.map((project, index) => <article className="pg-card" key={project.id} aria-label={`${index + 1} of ${total}: ${project.title}`}>
        <button className="pg-project-trigger" onClick={event => onOpen(project, event.currentTarget)} aria-label={`Explore ${project.title}`}>
          <span className="pg-cover">
            <img src={project.image} alt={project.alt} width="1200" height="800" loading="lazy" decoding="async" />
            <span className="pg-status"><span aria-hidden="true" />{project.status}</span>
            <span className="pg-view" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </span>
          <span className="pg-caption">
            <span className="pg-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="pg-title"><strong>{project.title}</strong><span>{project.category}</span></span>
            <ArrowUpRight size={19} aria-hidden="true" />
          </span>
        </button>
        <div className="pg-body">
          <p className="pg-description"><LocalizedCopy text={project.description} language={language} /></p>
          <div className="pg-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          {(project.liveUrl || project.sourceUrl || project.videoUrl) && <div className="pg-links">
            {project.videoUrl && <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="YouTube" />{thai ? 'ชมเกมเพลย์' : 'Watch gameplay'}<ArrowUpRight size={13} aria-hidden="true" /></a>}
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">{thai ? 'เปิดเว็บไซต์' : 'Visit website'} <ArrowUpRight size={13} aria-hidden="true" /></a>}
            {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer"><ToolBrandIcon name="GitHub" />Source code</a>}
          </div>}
        </div>
      </article>)}

      {futureSlots.map((slot, index) => <article className="pg-card pg-card--future" key={slot.id} aria-label={`${projects.length + index + 1} of ${total}: Empty future project slot`}>
        <div className={`pg-cover pg-future-cover pg-future-cover--${slot.cover}`} aria-hidden="true">
          <span className="pg-status"><Plus size={9} />OPEN SLOT</span>
          <span className="pg-future-art"><span /><span /><span /></span>
          <span className="pg-future-cover-label">{slot.caption}</span>
          <span className="pg-future-cover-number">{String(projects.length + index + 1).padStart(2, '0')}</span>
        </div>
        <div className="pg-caption">
          <span className="pg-number">{String(projects.length + index + 1).padStart(2, '0')}</span>
          <span className="pg-title"><strong>Future project</strong><span>Empty slot · Coming later</span></span>
          <Plus size={19} aria-hidden="true" />
        </div>
        <div className="pg-body">
          <p className="pg-description"><LocalizedCopy language={language} text={thai ? 'พื้นที่สำหรับไอเดียถัดไป โปรเจกต์ เรื่องราว และรายละเอียดใหม่ ๆ จะอยู่ที่นี่เมื่อพร้อม' : 'A little space for what comes next. A new project, its story, and the details will live here when they’re ready.'} /></p>
          <p className="pg-empty-note"><span aria-hidden="true" />No project added yet</p>
        </div>
      </article>)}
    </div>

    <div className="pg-footer">
      <div className="pg-progress-group">
        <span className="pg-position" role="status" aria-live="polite" aria-atomic="true"><span className="pg-sr-only">{currentLabel}. Gallery position </span><strong>{String(position.index + 1).padStart(2, '0')}</strong><span aria-hidden="true"> / </span><span className="pg-sr-only">of </span>{String(total).padStart(2, '0')}</span>
        <progress className="pg-progress" value={position.index + 1} max={total} aria-label="Project gallery position" />
      </div>
      <div className="pg-controls" aria-label="Gallery controls">
        <button className="pg-nav" type="button" aria-label="Previous project" aria-controls={trackId} disabled={position.atStart} onClick={() => goTo(positionRef.current.index - 1)}><ArrowLeft size={17} aria-hidden="true" /></button>
        <button className="pg-nav" type="button" aria-label="Next project" aria-controls={trackId} disabled={position.atEnd} onClick={() => goTo(positionRef.current.index + 1)}><ArrowRight size={17} aria-hidden="true" /></button>
      </div>
    </div>
  </div>;
}
