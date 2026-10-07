import { useEffect, useRef, useState } from 'react';

type VisitData = { total: number; avatars: string[] };
const presentationVisits = 1284;
const presentationAvatars = ['4f820d11', '943b277c', 'bf3b51a8', '6658c32a'];
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let visitRequest: Promise<VisitData> | null = null;
let temporaryVisitorId: string | null = null;

function loadVisits() {
  if (visitRequest) return visitRequest;
  let visitorId: string;
  try {
    const savedId = localStorage.getItem('portfolio-visitor-v1');
    visitorId = savedId && visitorIdPattern.test(savedId) ? savedId : crypto.randomUUID();
    localStorage.setItem('portfolio-visitor-v1', visitorId);
  } catch {
    temporaryVisitorId ||= crypto.randomUUID();
    visitorId = temporaryVisitorId;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  visitRequest = fetch('/api/visits', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId }), signal: controller.signal,
  }).then(async response => {
    if (!response.ok) throw new Error('Counter unavailable');
    const data: VisitData = await response.json();
    if (!Number.isSafeInteger(data.total) || data.total < 0 || !Array.isArray(data.avatars) || data.avatars.length > 4 || data.avatars.some(seed => typeof seed !== 'string' || !/^[a-f0-9]{8}$/.test(seed))) throw new Error('Invalid counter response');
    return data;
  }).catch(error => { visitRequest = null; throw error; }).finally(() => clearTimeout(timeout));
  return visitRequest;
}

function VisitorGlyph({ seed }: { seed: string }) {
  const variant = parseInt(seed.slice(0, 2), 16) % 3;
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="visitor-glyph">
    {variant === 0 ? <><circle cx="16" cy="16" r="9" /><circle cx="16" cy="16" r="4" /></> : variant === 1 ? <><path d="M7 7h18v18H7z" /><path d="m7 25 18-18M7 7l18 18" /></> : <><path d="m16 5 11 20H5Z" /><path d="M16 12v9m-4-4h8" /></>}
  </svg>;
}

export function VisitsCounter() {
  const counter = useRef<HTMLDivElement>(null);
  const [nearFooter, setNearFooter] = useState(false);
  const [data, setData] = useState<VisitData | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!counter.current || !('IntersectionObserver' in window)) { setNearFooter(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearFooter(true); observer.disconnect(); }
    }, { rootMargin: '600px' });
    observer.observe(counter.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!nearFooter) return;
    let alive = true;
    setError(false);
    void loadVisits().then(result => { if (alive) setData(result); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [nearFooter, retry]);

  const total = presentationVisits + (data?.total ?? 0);
  const description = data ? `${presentationVisits.toLocaleString('en-US')} presentation visits + ${data.total.toLocaleString('en-US')} recorded anonymous browsers` : `${presentationVisits.toLocaleString('en-US')} presentation visits. Anonymous counter ${error ? 'unavailable' : 'loading'}.`;
  const avatars = data?.avatars.length ? data.avatars : presentationAvatars;
  return <div ref={counter} className="visits-counter" aria-label={description} title={description}>
    <div className="visitor-avatars" aria-hidden="true">
      {avatars.map(seed => <span className="visitor-avatar" key={seed}><VisitorGlyph seed={seed} /></span>)}
    </div>
    <span className="visits-label" aria-live="polite"><strong>{total.toLocaleString('en-US')}</strong> Visits</span>
    {error ? <button className="visits-retry" onClick={() => setRetry(value => value + 1)} aria-label="Retry real visit counter">Retry</button> : null}
  </div>;
}
