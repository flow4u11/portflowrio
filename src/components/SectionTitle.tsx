import { useIdleMotion } from './useIdleMotion';
import './section-title.css';

/** Word stagger inspired by Split Text, using only bounded compositor motion. */
export function SectionTitle({ id, first, last }: { id: string; first: string; last: string }) {
  const { ref, active, reduced } = useIdleMotion<HTMLHeadingElement>();
  const words = first.split(' ');
  return <h2 ref={ref} id={id} className="section-word-title" data-visible={active || reduced}>
    <span className="idle-motion-sr-only">{first} {last}</span>
    <span aria-hidden="true">{words.map((word, index) => <span className="section-title-word" key={word} style={{ transitionDelay: `${240 + index * 85}ms` }}><span className="title-hover-word">{word}</span>{index < words.length - 1 ? '\u00a0' : ''}</span>)}<br /><i className="section-title-word" style={{ transitionDelay: `${240 + words.length * 85}ms` }}><span className="title-hover-word">{last}</span></i></span>
  </h2>;
}
