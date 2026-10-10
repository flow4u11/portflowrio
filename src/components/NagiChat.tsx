import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { ArrowUp, MessageCircle, RotateCcw, X } from 'lucide-react';
import { answerGuide, nagiKnowledge, nagiSuggestions, type NagiLanguage } from '../data/nagi-guide';
import './nagi-chat.css';

type Message = { id: number; role: 'user' | 'assistant'; text: string; language: NagiLanguage };
const copy = {
  en: { open: 'Ask Nagi', close: 'Close Nagi', guide: 'Website guide', ai: 'AI assistant', note: 'Guide mode · AI chat isn’t connected yet.', aiNote: 'AI mode · Messages are sent to the AI service.', placeholder: 'Ask about this website…', send: 'Send message', clear: 'Start a new conversation', switch: 'Switch Nagi to Thai', thinking: 'Thinking…', unavailable: 'AI is unavailable right now. Here’s the website guide instead.', label: 'Your question', suggestions: 'Suggested questions' },
  th: { open: 'คุยกับ Nagi', close: 'ปิด Nagi', guide: 'คู่มือเว็บ', ai: 'ผู้ช่วย AI', note: 'โหมดคู่มือ · ยังไม่ได้เชื่อมบริการ AI', aiNote: 'โหมด AI · ข้อความจะส่งไปยังบริการ AI', placeholder: 'ถามเกี่ยวกับเว็บนี้…', send: 'ส่งข้อความ', clear: 'เริ่มบทสนทนาใหม่', switch: 'เปลี่ยน Nagi เป็นภาษาอังกฤษ', thinking: 'กำลังคิด…', unavailable: 'ตอนนี้ AI ยังตอบไม่ได้ ขอแนะนำจากคู่มือเว็บแทนครับ', label: 'คำถามของคุณ', suggestions: 'คำถามแนะนำ' },
};

function Reply({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return <p className="nagi-reply">{parts.map((part, index) => /^\s+$/.test(part) ? part : <span key={index} style={{ '--word-delay': `${Math.min(index, 12) * 24}ms` } as CSSProperties}>{part}</span>)}</p>;
}

/** Conversation is held only in memory; the guide is usable without an AI provider. */
export function NagiChat({ language: pageLanguage, suspended = false }: { language: NagiLanguage; suspended?: boolean }) {
  const id = useId();
  const [language, setLanguage] = useState(pageLanguage);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mode, setMode] = useState<'guide' | 'ai'>('guide');
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const text = copy[language];
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const request = useRef<AbortController | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const close = useCallback((restore = true) => {
    request.current?.abort();
    request.current = null;
    busyRef.current = false;
    setBusy(false);
    if (closeTimer.current) return;
    const finish = () => {
      dialog.current?.close(); setOpen(false); setClosing(false); closeTimer.current = null;
      if (restore) launcher.current?.focus({ preventScroll: true });
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    setClosing(true);
    closeTimer.current = setTimeout(finish, 160);
  }, []);
  useEffect(() => { setLanguage(pageLanguage); }, [pageLanguage]);
  useEffect(() => { if (suspended && open) close(false); }, [suspended, open, close]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);
  useEffect(() => {
    if (!open) return;
    dialog.current?.show();
    // Focus the close button, rather than opening a mobile keyboard immediately.
    dialog.current?.querySelector<HTMLButtonElement>('.nagi-close')?.focus({ preventScroll: true });
    const status = new AbortController();
    void fetch('/api/nagi', { signal: status.signal }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (!status.signal.aborted) setMode(data.mode === 'ai' ? 'ai' : 'guide');
    }).catch(() => { /* The local guide works offline. */ });
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    };
    const visibility = () => { if (document.hidden) request.current?.abort(); };
    document.addEventListener('keydown', escape, true);
    document.addEventListener('visibilitychange', visibility);
    return () => { status.abort(); document.removeEventListener('keydown', escape, true); document.removeEventListener('visibilitychange', visibility); };
  }, [open, close]);
  useEffect(() => { const node = log.current; if (node) node.scrollTop = node.scrollHeight; }, [messages, busy, open]);

  const send = async (question: string, topicId?: string) => {
    const trimmed = question.trim().slice(0, 1200);
    if (!trimmed || busyRef.current || closing) return;
    const reply = answerGuide(trimmed, language);
    const user: Message = { id: ++counter.current, role: 'user', text: trimmed, language: reply.language };
    const history = [...messages, user].slice(-30);
    setMessages(history); setValue(''); setNotice('');
    const suggested = topicId && nagiKnowledge.topics.find(topic => topic.id === topicId);
    if (mode === 'guide' || suggested) {
      setMessages([...history, { id: ++counter.current, role: 'assistant', text: suggested ? suggested.answer[language] : reply.text, language: suggested ? language : reply.language }]);
      return;
    }
    busyRef.current = true; setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 22_000);
    try {
      const context = history.slice(-8).map(({ role, text }) => ({ role, content: text.slice(0, 1200) }));
      while (context.reduce((total, message) => total + message.content.length, 0) > 6000) context.shift();
      const response = await fetch('/api/nagi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ language: reply.language, messages: context }) });
      if (!response.ok) throw new Error('Unavailable');
      const result = await response.json();
      if (typeof result.text !== 'string' || result.text.length > 8000) throw new Error('Invalid response');
      if (mounted.current && request.current === controller && !controller.signal.aborted) {
        setMessages(previous => [...previous, { id: ++counter.current, role: 'assistant', text: result.text, language: reply.language }]);
        if (result.mode === 'guide') setMode('guide');
      }
    } catch {
      if (mounted.current && request.current === controller) {
        setNotice(copy[reply.language].unavailable);
        setMessages(previous => [...previous, { id: ++counter.current, role: 'assistant', text: reply.text, language: reply.language }]);
      }
    } finally {
      clearTimeout(timeout);
      if (mounted.current && request.current === controller) { request.current = null; busyRef.current = false; setBusy(false); }
    }
  };
  return <div className="nagi" data-suspended={suspended || undefined} lang={language}>
    <button ref={launcher} className="nagi-launcher" type="button" aria-label={text.open} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? `${id}-dialog` : undefined} disabled={suspended} onClick={() => { if (open) close(); else { setClosing(false); setOpen(true); } }}><MessageCircle size={20} aria-hidden="true" /><span>Nagi</span></button>
    {open && <dialog ref={dialog} id={`${id}-dialog`} className="nagi-panel" data-closing={closing || undefined} aria-labelledby={`${id}-title`} aria-describedby={`${id}-note`} onCancel={event => { event.preventDefault(); close(); }}>
      <header className="nagi-header"><span className="nagi-symbol"><MessageCircle size={20} aria-hidden="true" /></span><div><h2 id={`${id}-title`}>Nagi</h2><p>{text[mode]}</p></div><button className="nagi-language" aria-label={text.switch} onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}>{language === 'en' ? 'TH' : 'EN'}</button><button className="nagi-close" aria-label={text.close} onClick={() => close()}><X size={20} aria-hidden="true" /></button></header>
      <p className="nagi-note" id={`${id}-note`}>{mode === 'ai' ? text.aiNote : text.note}</p>
      <div ref={log} className="nagi-log" role="log" aria-live="polite" aria-relevant="additions" aria-label={language === 'th' ? 'บทสนทนากับ Nagi' : 'Conversation with Nagi'}>
        <div className="nagi-message" data-role="assistant"><p>{nagiKnowledge.welcome[language]}</p></div>
        {messages.map(message => <div className="nagi-message" data-role={message.role} key={message.id} lang={message.language}>{message.role === 'assistant' ? <Reply text={message.text} /> : <p>{message.text}</p>}</div>)}
        {busy && <p className="nagi-thinking" role="status">{text.thinking}</p>}
      </div>
      <div className="nagi-suggestions" aria-label={text.suggestions}>{nagiSuggestions.map(topicId => {
        const topic = nagiKnowledge.topics.find(item => item.id === topicId)!;
        return <button key={topicId} disabled={busy || closing} onClick={() => void send(topic.question[language], topicId)}>{topic.question[language]}</button>;
      })}</div>
      {notice && <p className="nagi-notice" role="status">{notice}</p>}
      <form className="nagi-form" onSubmit={event => { event.preventDefault(); void send(value); }}>
        <label className="idle-motion-sr-only" htmlFor={`${id}-input`}>{text.label}</label>
        <textarea ref={input} id={`${id}-input`} rows={1} maxLength={1200} value={value} placeholder={text.placeholder} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(value); } }} />
        <button className="nagi-send" type="submit" disabled={!value.trim() || busy || closing} aria-label={text.send}><ArrowUp size={20} aria-hidden="true" /></button>
      </form>
      <button className="nagi-clear" disabled={busy || closing || !messages.length} onClick={() => { setMessages([]); setNotice(''); input.current?.focus({ preventScroll: true }); }}><RotateCcw size={12} aria-hidden="true" />{text.clear}</button>
    </dialog>}
  </div>;
}
