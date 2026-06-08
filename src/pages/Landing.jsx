import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ────────────────────────────────────────────────────────────
   Utility: count-up hook
──────────────────────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(tick);
          else setValue(target);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return [value, ref];
}

/* ────────────────────────────────────────────────────────────
   Utility: fade-up on scroll
──────────────────────────────────────────────────────────── */
function useFadeUp(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        observer.disconnect();
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return ref;
}

/* ────────────────────────────────────────────────────────────
   Sub-components
──────────────────────────────────────────────────────────── */

/* Chat Widget — typewriter AI response */
function ChatWidget() {
  const [phase, setPhase] = useState(0);
  // 0 = user msg, 1 = rag label, 2 = typing, 3 = done
  const aiText =
    "Newton's Second Law states that the acceleration of an object is directly proportional to the net force acting upon it, and inversely proportional to its mass — expressed as F = ma.";
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 2) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(aiText.slice(0, i + 1));
      i++;
      if (i >= aiText.length) { clearInterval(interval); setPhase(3); }
    }, 22);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div
      style={{
        background: '#181826',
        border: '1px solid #474754',
        boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(189,157,255,0.06)',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: 'rgba(71,71,84,0.18)',
          borderBottom: '1px solid #474754',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6e84', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5a623', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
        <span
          className="font-fira ml-auto"
          style={{ fontSize: '0.62rem', color: '#aba9b9', letterSpacing: '0.07em' }}
        >
          tutor-ai · session:8f3c · subject:Science
        </span>
      </div>

      {/* Messages */}
      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* User bubble */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div
            className="font-fira"
            style={{
              width: 26, height: 26, fontSize: '0.58rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: 'rgba(189,157,255,0.12)', color: '#bd9dff',
              border: '1px solid rgba(189,157,255,0.28)', marginTop: 2,
            }}
          >
            USR
          </div>
          <div
            style={{
              fontSize: '0.84rem', padding: '10px 14px',
              background: 'rgba(189,157,255,0.07)',
              border: '1px solid rgba(189,157,255,0.13)',
              color: '#e9e6f7',
            }}
          >
            Explain Newton's Second Law
          </div>
        </div>

        {/* RAG label */}
        {phase >= 1 && (
          <div style={{ paddingLeft: 36 }}>
            <div
              className="font-fira"
              style={{
                fontSize: '0.62rem', color: '#aba9b9', letterSpacing: '0.05em',
                background: 'rgba(71,71,84,0.22)', borderLeft: '2px solid #a88cfb',
                border: '1px solid rgba(71,71,84,0.45)', borderLeftWidth: 2,
                padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <span className="rag-pulse" style={{ width: 5, height: 5, background: '#a88cfb', borderRadius: '50%', display: 'inline-block' }} />
              RAG CONTEXT INJECTED · 3 chunks · physics.json
            </div>
          </div>
        )}

        {/* AI bubble */}
        {phase >= 2 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div
              className="font-fira"
              style={{
                width: 26, height: 26, fontSize: '0.58rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: 'rgba(168,140,251,0.09)', color: '#a88cfb',
                border: '1px solid rgba(168,140,251,0.22)', marginTop: 2,
              }}
            >
              AI
            </div>
            <div
              style={{
                fontSize: '0.84rem', lineHeight: 1.6, padding: '10px 14px',
                background: 'rgba(13,13,24,0.7)',
                border: '1px solid rgba(71,71,84,0.4)',
                color: '#c8c0e8',
              }}
            >
              {displayedText}
              {phase <= 2 && (
                <span
                  className="cursor-blink"
                  style={{
                    display: 'inline-block', width: 2, height: '1em',
                    background: '#bd9dff', verticalAlign: 'text-bottom', marginLeft: 1,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Difficulty escalation label */}
        {phase >= 3 && (
          <div style={{ paddingLeft: 36, paddingBottom: 4 }}>
            <div
              className="font-fira"
              style={{
                fontSize: '0.62rem', color: '#ff97b2', letterSpacing: '0.05em',
                background: 'rgba(255,151,178,0.05)', borderLeft: '2px solid #ff97b2',
                border: '1px solid rgba(255,151,178,0.22)', borderLeftWidth: 2,
                padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <span className="rag-pulse" style={{ width: 5, height: 5, background: '#ff97b2', borderRadius: '50%', display: 'inline-block' }} />
              REPLY QUALITY: HIGH · followUpDifficulty → HARD
            </div>
          </div>
        )}
      </div>

      {/* SSE footer */}
      <div
        className="font-fira"
        style={{
          borderTop: '1px solid #474754', padding: '8px 16px',
          fontSize: '0.6rem', color: '#aba9b9', letterSpacing: '0.05em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span className="rag-pulse" style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
        SSE stream · text/event-stream · Groq llama-3.3-70b-versatile · 312 tokens
      </div>
    </div>
  );
}

/* Stat counter item */
function StatItem({ target, label, delay = 0, borderRight = true }) {
  const [value, ref] = useCountUp(target, 800 + delay);
  return (
    <div
      ref={ref}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '0 24px',
        borderRight: borderRight ? '1px solid #474754' : 'none',
      }}
    >
      <div className="font-fira" style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)', color: '#bd9dff', fontWeight: 500, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.68rem', color: '#aba9b9', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, textAlign: 'center' }}>
        {label}
      </div>
    </div>
  );
}

/* Difficulty ladder */
function DifficultyLadder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {[
        { label: 'EASY',   color: '#4ade80', bg: 'rgba(74,222,128,0.06)',   border: 'rgba(74,222,128,0.3)' },
        { label: 'MEDIUM', color: '#f5a623', bg: 'rgba(245,166,35,0.06)',   border: 'rgba(245,166,35,0.3)' },
        { label: 'HARD',   color: '#bd9dff', bg: 'rgba(189,157,255,0.08)', border: 'rgba(189,157,255,0.5)', glow: true },
      ].map((d, i) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span className="font-fira" style={{ color: '#aba9b9', fontSize: '0.7rem' }}>→</span>}
          <span
            className={`font-fira${d.glow ? ' diff-glow' : ''}`}
            style={{
              fontSize: '0.64rem', letterSpacing: '0.1em', padding: '5px 12px',
              border: `1px solid ${d.border}`, background: d.bg, color: d.color,
            }}
          >
            {d.label}{d.glow ? ' ●' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

/* MCQ preview */
function QuizPreview() {
  const opts = [
    { label: 'A', text: 'F = mv', state: 'neutral' },
    { label: 'B', text: 'F = ma', state: 'correct' },
    { label: 'C', text: 'F = m/a', state: 'neutral' },
    { label: 'D', text: 'F = a/m', state: 'wrong' },
  ];
  const stateStyle = {
    neutral: { bg: 'transparent', border: '#474754', color: '#e9e6f7' },
    correct: { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.35)', color: '#4ade80' },
    wrong:   { bg: 'rgba(255,110,132,0.05)', border: 'rgba(255,110,132,0.3)', color: '#ff6e84' },
  };
  return (
    <div>
      <div className="font-fira" style={{ fontSize: '0.62rem', color: '#a88cfb', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
        CONTEXT-AWARE · 5 MCQ · 2E + 2M + 1H
      </div>
      <div style={{ background: 'rgba(13,13,24,0.6)', border: '1px solid #474754', padding: '14px', marginBottom: 10 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e9e6f7', marginBottom: 12, lineHeight: 1.5 }}>
          Which expression correctly represents Newton's Second Law?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {opts.map(o => (
            <div
              key={o.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: '0.78rem', padding: '7px 10px',
                border: `1px solid ${stateStyle[o.state].border}`,
                background: stateStyle[o.state].bg,
                color: stateStyle[o.state].color,
              }}
            >
              <span className="font-fira" style={{ fontSize: '0.7rem', width: 18, flexShrink: 0, opacity: 0.7 }}>{o.label}</span>
              {o.text}
              {o.state === 'correct' && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {o.state === 'wrong'   && <span style={{ marginLeft: 'auto' }}>✗</span>}
            </div>
          ))}
        </div>
      </div>
      <button
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.74rem', fontWeight: 600,
          color: '#a88cfb', background: 'transparent',
          border: '1px solid rgba(168,140,251,0.35)', padding: '7px 16px',
          cursor: 'pointer', letterSpacing: '0.04em',
        }}
      >
        AI Explanation ↗
      </button>
    </div>
  );
}

/* Architecture node */
function ArchNode({ label, value, highlight }) {
  return (
    <div
      style={{
        flexShrink: 0, padding: '14px 18px', minWidth: 120, textAlign: 'center',
        border: `1px solid ${highlight ? 'rgba(189,157,255,0.38)' : '#474754'}`,
        background: highlight ? 'rgba(189,157,255,0.04)' : '#181826',
      }}
    >
      <div className="font-fira" style={{ fontSize: '0.6rem', color: '#aba9b9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: highlight ? '#bd9dff' : '#e9e6f7' }}>
        {value}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Landing Component
──────────────────────────────────────────────────────────── */
export default function Landing() {
  const fc0 = useFadeUp(0);
  const fc1 = useFadeUp(100);
  const fc2 = useFadeUp(180);
  const fc3 = useFadeUp(260);

  const archRef = useRef(null);
  const [archVisible, setArchVisible] = useState(false);
  useEffect(() => {
    const el = archRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setArchVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: '#0d0d18', color: '#e9e6f7', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 60px',
        borderBottom: '1px solid rgba(71,71,84,0.4)',
        background: 'rgba(13,13,24,0.88)',
        backdropFilter: 'blur(14px)',
      }}>
        <div className="font-fira" style={{ fontSize: '0.9rem', color: '#bd9dff', letterSpacing: '0.08em' }}>
          TUTOR<span style={{ color: '#aba9b9' }}>—</span>AI
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['Features', 'Architecture', 'Stack'].map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              style={{ color: '#aba9b9', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#e9e6f7'}
              onMouseLeave={e => e.target.style.color = '#aba9b9'}
            >
              {l}
            </a>
          ))}
        </div>
        <a
          href="https://github.com/piyushkumar0707/TUTOR-AI"
          target="_blank" rel="noopener noreferrer"
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.82rem', fontWeight: 700,
            letterSpacing: '0.05em', color: '#0d0d18', background: '#bd9dff',
            padding: '9px 22px', textDecoration: 'none', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#a88cfb'}
          onMouseLeave={e => e.currentTarget.style.background = '#bd9dff'}
        >
          View on GitHub ↗
        </a>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '110px 60px 70px',
        position: 'relative',
        overflow: 'hidden',
        gap: 48,
      }}>
        {/* Subtle violet bloom */}
        <div style={{
          position: 'absolute', top: '50%', left: '35%',
          transform: 'translate(-50%,-50%)',
          width: 720, height: 720,
          background: 'radial-gradient(circle, rgba(189,157,255,0.042) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        {/* Left */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            className="font-fira"
            style={{ fontSize: '0.7rem', color: '#bd9dff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span style={{ display: 'inline-block', width: 24, height: 1, background: '#bd9dff' }} />
            Production-grade AI tutoring
          </div>

          <h1
            className="font-playfair"
            style={{ fontSize: 'clamp(3rem,5vw,4.4rem)', fontStyle: 'italic', fontWeight: 700, lineHeight: 1.08, color: '#e9e6f7', marginBottom: 24 }}
          >
            Your smartest<br />
            <span style={{ color: '#bd9dff' }}>study session.</span>
          </h1>

          <p style={{ fontSize: '1rem', color: '#aba9b9', maxWidth: 440, lineHeight: 1.72, marginBottom: 36 }}>
            <strong style={{ color: '#e9e6f7', fontWeight: 600 }}>RAG-powered AI tutoring.</strong> Adaptive difficulty.
            Context-aware quizzes. PDF assignments. All in one session — with
            real SSE streaming and a knowledge engine that never mocks its answers.
          </p>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/piyushkumar0707/TUTOR-AI"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.88rem',
                fontWeight: 700, letterSpacing: '0.04em',
                color: '#0d0d18', background: '#bd9dff',
                padding: '13px 28px', textDecoration: 'none', transition: 'background 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#a88cfb'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#bd9dff'; e.currentTarget.style.transform = 'none'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.338c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
              View on GitHub
            </a>
            <a
              href="https://tutor-ai-nu.vercel.app/"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.88rem',
                fontWeight: 600, letterSpacing: '0.04em',
                color: '#aba9b9', background: 'transparent',
                border: '1px solid #474754', padding: '13px 28px', textDecoration: 'none',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e9e6f7'; e.currentTarget.style.borderColor = '#bd9dff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#aba9b9'; e.currentTarget.style.borderColor = '#474754'; }}
            >
              Live Demo ↗
            </a>
            <Link
              to="/onboarding"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.88rem',
                fontWeight: 600, letterSpacing: '0.04em',
                color: '#bd9dff', background: 'transparent',
                border: '1px solid rgba(189,157,255,0.35)', padding: '13px 28px', textDecoration: 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(189,157,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Try the App →
            </Link>
          </div>
        </div>

        {/* Right — Chat Widget */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <ChatWidget />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════ */}
      <section id="stats" style={{
        background: '#181826',
        borderTop: '1px solid #474754',
        borderBottom: '1px solid #474754',
        padding: '52px 60px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          <StatItem target={25}  label="Source Documents"    borderRight />
          <StatItem target={200} label="Word Chunks"         delay={120} borderRight />
          <StatItem target={3}   label="Context Hits / Query" delay={240} borderRight />
          <StatItem target={4}   label="Assignment Types"    delay={360} borderRight={false} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" style={{ padding: '100px 60px' }}>
        <div style={{ marginBottom: 56 }}>
          <div className="font-fira" style={{ fontSize: '0.7rem', color: '#bd9dff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            Core Modules
          </div>
          <h2 className="font-playfair" style={{ fontStyle: 'italic', fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700, color: '#e9e6f7', lineHeight: 1.2 }}>
            Four systems. One session.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: 1,
          background: '#474754',
          border: '1px solid #474754',
        }}>

          {/* 01 AI Chat */}
          <div ref={fc0} style={{ background: '#181826', padding: '40px 36px', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.borderTop = '2px solid #bd9dff'; e.currentTarget.style.paddingTop = '38px'; }}
            onMouseLeave={e => { e.currentTarget.style.borderTop = 'none'; e.currentTarget.style.paddingTop = '40px'; }}
          >
            <div className="font-fira" style={{ fontSize: '0.62rem', color: '#474754', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>01 · AI CHAT</div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: '#e9e6f7', marginBottom: 10 }}>Adaptive AI Tutor</div>
            <p style={{ fontSize: '0.86rem', color: '#aba9b9', lineHeight: 1.65, marginBottom: 24 }}>
              SSE streaming delivers tokens as they arrive — no fake loaders, no polling.
              Before every Groq call, the RAG engine pulls the top-3 knowledge chunks from MongoDB.
              The backend classifies each reply quality and escalates difficulty across the session.
            </p>
            <DifficultyLadder />
            <p style={{ fontSize: '0.8rem', color: '#aba9b9', lineHeight: 1.6, marginBottom: 18 }}>
              The tutor genuinely gets harder as you improve. Reply classification happens
              server-side on every exchange — not a timer, not random.
            </p>
            <div
              className="font-fira"
              style={{ fontSize: '0.64rem', color: '#aba9b9', letterSpacing: '0.06em', padding: '8px 12px', background: 'rgba(71,71,84,0.15)', borderLeft: '2px solid #a88cfb', display: 'inline-block' }}
            >
              SSE · text/event-stream · RAG top-k=3 · 5 subjects
            </div>
          </div>

          {/* 02 Quiz */}
          <div ref={fc1} style={{ background: '#181826', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}>
            <div className="font-fira" style={{ fontSize: '0.62rem', color: '#474754', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>02 · QUIZ MODULE</div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: '#e9e6f7', marginBottom: 10 }}>Context-Aware Quizzes</div>
            <p style={{ fontSize: '0.86rem', color: '#aba9b9', lineHeight: 1.65, marginBottom: 20 }}>
              Launched from chat, the quiz pulls the last 6 messages as context —
              questions are about what was just discussed. Every explanation is RAG-injected.
            </p>
            <QuizPreview />
          </div>

          {/* 03 PDF */}
          <div ref={fc2} style={{ background: '#181826', padding: '40px 36px', position: 'relative', overflow: 'hidden' }}>
            <div className="font-fira" style={{ fontSize: '0.62rem', color: '#474754', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>03 · PDF GENERATOR</div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: '#e9e6f7', marginBottom: 10 }}>Assignment Generator</div>
            <p style={{ fontSize: '0.86rem', color: '#aba9b9', lineHeight: 1.65, marginBottom: 24 }}>
              Four document types structured on Bloom's taxonomy. Generated by llama-3.3-70b-versatile
              with coordinate-based layout — explicit x/y positions, zero element overlap.
              Streamed as binary PDF via chunked transfer encoding.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { t: 'WORKSHEET',    c: '#bd9dff', bg: 'rgba(189,157,255,0.06)', b: 'rgba(189,157,255,0.3)' },
                { t: 'ESSAY',        c: '#ff97b2', bg: 'rgba(255,151,178,0.05)', b: 'rgba(255,151,178,0.3)' },
                { t: 'PROBLEM SET',  c: '#67e8f9', bg: 'rgba(103,232,249,0.05)', b: 'rgba(103,232,249,0.3)' },
                { t: 'COMPREHENSION',c: '#fbbf24', bg: 'rgba(251,191,36,0.05)',  b: 'rgba(251,191,36,0.3)' },
              ].map(p => (
                <span key={p.t} className="font-fira" style={{ fontSize: '0.64rem', letterSpacing: '0.08em', padding: '5px 12px', border: `1px solid ${p.b}`, background: p.bg, color: p.c }}>
                  {p.t}
                </span>
              ))}
            </div>
            <div className="font-fira" style={{ fontSize: '0.64rem', color: '#aba9b9', letterSpacing: '0.06em', padding: '8px 12px', background: 'rgba(71,71,84,0.15)', borderLeft: '2px solid #a88cfb', display: 'inline-block' }}>
              llama-3.3-70b-versatile · coordinate-based layout · binary stream · PDFKit
            </div>
          </div>

          {/* 04 RAG Engine */}
          <div ref={fc3} style={{ background: '#181826', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}>
            <div className="font-fira" style={{ fontSize: '0.62rem', color: '#474754', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>04 · RAG ENGINE</div>
            <div style={{ fontSize: '1.18rem', fontWeight: 700, color: '#e9e6f7', marginBottom: 10 }}>Knowledge Index</div>
            <p style={{ fontSize: '0.86rem', color: '#aba9b9', lineHeight: 1.65, marginBottom: 20 }}>
              25 source documents across 5 subjects, chunked into 200-word segments.
              MongoDB{' '}
              <code className="font-fira" style={{ color: '#a88cfb', fontSize: '0.8em' }}>$text</code>{' '}
              search with keyword-regex fallback. Non-blocking — always returns{' '}
              <code className="font-fira" style={{ color: '#aba9b9', fontSize: '0.8em' }}>''</code>{' '}
              on failure so the LLM call is never gated.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {['Mathematics', 'Science', 'History', 'Coding', 'English'].map(s => (
                <span
                  key={s}
                  style={{
                    fontSize: '0.74rem', fontWeight: 500, padding: '6px 14px',
                    border: '1px solid #474754', background: 'rgba(71,71,84,0.12)',
                    color: '#e9e6f7', cursor: 'default', transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#bd9dff'; e.currentTarget.style.color = '#bd9dff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#474754'; e.currentTarget.style.color = '#e9e6f7'; }}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="font-fira" style={{ fontSize: '0.64rem', color: '#aba9b9', lineHeight: 1.9, letterSpacing: '0.04em' }}>
              <span style={{ color: '#bd9dff' }}>25</span> docs ·{' '}
              <span style={{ color: '#bd9dff' }}>200</span>-word chunks ·{' '}
              MongoDB <span style={{ color: '#a88cfb' }}>$text</span> search +{' '}
              <span style={{ color: '#a88cfb' }}>regex</span> fallback · never blocks LLM
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          ARCHITECTURE
      ══════════════════════════════════════════ */}
      <section id="architecture" ref={archRef} style={{ padding: '80px 60px', borderTop: '1px solid #474754' }}>
        <div style={{ marginBottom: 36 }}>
          <div className="font-fira" style={{ fontSize: '0.7rem', color: '#bd9dff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            Request Pipeline
          </div>
          <h2 className="font-playfair" style={{ fontStyle: 'italic', fontSize: 'clamp(1.6rem,2.5vw,2.2rem)', fontWeight: 700, color: '#e9e6f7' }}>
            How a single query flows.
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { label: 'Client',        value: 'React 19',       hl: false },
            { arrow: true },
            { label: 'Transport',     value: 'SSE stream',     hl: false },
            { arrow: true },
            { label: 'RAG Lookup',    value: 'MongoDB · top-3', hl: true },
            { arrow: true },
            { label: 'Context Inject',value: 'Prompt builder', hl: true },
            { arrow: true },
            { label: 'Inference',     value: 'Groq LLaMA',     hl: false },
            { arrow: true },
            { label: 'Classifier',    value: 'Difficulty ++',  hl: true },
            { arrow: true },
            { label: 'Output',        value: 'Token stream',   hl: false },
          ].map((n, i) => {
            if (n.arrow) return (
              <div
                key={i}
                className="font-fira"
                style={{
                  flexShrink: 0, width: 32, textAlign: 'center', color: '#474754', fontSize: '0.9rem',
                  opacity: archVisible ? 1 : 0, transition: `opacity 0.4s ease ${i * 55}ms`,
                }}
              >→</div>
            );
            return (
              <div
                key={i}
                style={{
                  flexShrink: 0, padding: '14px 18px', minWidth: 118, textAlign: 'center',
                  border: `1px solid ${n.hl ? 'rgba(189,157,255,0.38)' : '#474754'}`,
                  background: n.hl ? 'rgba(189,157,255,0.04)' : '#181826',
                  opacity: archVisible ? 1 : 0,
                  transform: archVisible ? 'translateY(0)' : 'translateY(12px)',
                  transition: `opacity 0.42s ease ${i * 55}ms, transform 0.42s ease ${i * 55}ms`,
                }}
              >
                <div className="font-fira" style={{ fontSize: '0.58rem', color: '#aba9b9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{n.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: n.hl ? '#bd9dff' : '#e9e6f7' }}>{n.value}</div>
              </div>
            );
          })}
        </div>

        <p className="font-fira" style={{ fontSize: '0.64rem', color: '#474754', marginTop: 16, letterSpacing: '0.06em' }}>
          RAG lookup is async and non-blocking. If it fails, the pipeline continues with '' context — the LLM call is never gated.
        </p>
      </section>

      {/* ══════════════════════════════════════════
          TECH STACK
      ══════════════════════════════════════════ */}
      <section id="stack" style={{ background: '#181826', borderTop: '1px solid #474754', padding: '56px 60px' }}>
        <div className="font-fira" style={{ fontSize: '0.7rem', color: '#bd9dff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Stack</div>
        <h2 className="font-playfair" style={{ fontStyle: 'italic', fontSize: '1.6rem', fontWeight: 700, color: '#e9e6f7', marginBottom: 28 }}>
          Every layer, visible.
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['React 19','Node.js','Express 5','MongoDB','Groq SDK','llama-3.3-70b-versatile','SSE','text/event-stream','RAG','$text search','PDFKit',"Bloom's Taxonomy",'JWT Auth','Vercel'].map(t => (
            <span
              key={t}
              className="font-fira"
              style={{
                fontSize: '0.72rem', letterSpacing: '0.06em', color: '#aba9b9',
                border: '1px solid #474754', padding: '6px 14px', transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#bd9dff'; e.currentTarget.style.borderColor = 'rgba(189,157,255,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#aba9b9'; e.currentTarget.style.borderColor = '#474754'; }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid #474754',
        padding: '36px 60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div className="font-fira" style={{ fontSize: '0.68rem', color: '#aba9b9', letterSpacing: '0.05em' }}>
          <span style={{ color: '#bd9dff' }}>React 19</span> ·{' '}
          <span style={{ color: '#bd9dff' }}>Express 5</span> ·{' '}
          <span style={{ color: '#bd9dff' }}>MongoDB</span> ·{' '}
          <span style={{ color: '#bd9dff' }}>Groq</span> ·{' '}
          <span style={{ color: '#bd9dff' }}>SSE</span> ·{' '}
          <span style={{ color: '#bd9dff' }}>RAG</span> ·{' '}
          <span style={{ color: '#bd9dff' }}>PDFKit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="font-fira" style={{ fontSize: '0.62rem', color: '#ff97b2', border: '1px solid rgba(255,151,178,0.3)', padding: '4px 12px', letterSpacing: '0.08em', background: 'rgba(255,151,178,0.04)' }}>
            SIH 2025
          </span>
          <a href="https://github.com/piyushkumar0707/TUTOR-AI" target="_blank" rel="noopener noreferrer"
            style={{ color: '#aba9b9', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#bd9dff'}
            onMouseLeave={e => e.currentTarget.style.color = '#aba9b9'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.338c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
            GitHub ↗
          </a>
          <a href="https://tutor-ai-nu.vercel.app/" target="_blank" rel="noopener noreferrer"
            style={{ color: '#aba9b9', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#bd9dff'}
            onMouseLeave={e => e.currentTarget.style.color = '#aba9b9'}
          >
            Live Demo ↗
          </a>
        </div>
      </footer>

    </div>
  );
}
