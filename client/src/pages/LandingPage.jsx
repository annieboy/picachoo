import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function LandingPage() {
  return (
    <MarketingLayout heroNav>
      <Hero />
      <Logos />
      <HowItWorks />
      <Features />
      <LiveWall />
      <Pricing />
      <FinalCTA />
    </MarketingLayout>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { navigate('/join'); return; }
    setChecking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/events/by-code/${trimmed}`);
      if (res.ok) { navigate(`/e/${trimmed}`); }
      else { navigate(`/join?code=${trimmed}&error=1`); }
    } catch { navigate(`/join?code=${trimmed}&error=1`); }
    setChecking(false);
  }

  return (
    <section className="bezl-hero relative flex flex-col items-center px-6 overflow-hidden"
             style={{ minHeight: '88vh', paddingTop: '96px', paddingBottom: '64px' }}>

      {/* ── Two-tone join capsule (Slido-style) ── */}
      <div className="anim-fade-up mb-10" style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.25))' }}>
        <form onSubmit={handleJoin}
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'stretch',
                borderRadius: '9999px', overflow: 'hidden',
                border: '2.5px solid rgba(255,255,255,0.45)',
                height: '54px',
              }}>
          {/* Left: solid dark label */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 24px',
            background: 'rgba(20,10,60,0.65)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Joining an event?</span>
          </div>
          {/* Right: white input pill inset */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 6px 6px 16px',
            background: 'rgba(255,255,255,0.18)',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: '15px' }}>#</span>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Enter code here"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 500,
                width: '140px',
                caretColor: '#fff',
              }}
            />
            <button
              type="submit"
              aria-label="Join event"
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'transform 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {checking ? (
                <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#6045f4" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 3a9 9 0 019 9" stroke="#6045f4" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="#6045f4" style={{ width: 16, height: 16 }}>
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Headline */}
      <h1 className="anim-fade-up text-center text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-3xl">
        The easiest way to share photos and videos to your cloud.
      </h1>

      {/* Numbered steps — single horizontal line, no wrapping */}
      <div className="anim-fade-up anim-delay-1 mt-8 flex flex-nowrap items-center justify-center gap-3">
        {[
          { n: '1', text: 'Guests scan a QR code', grad: 'linear-gradient(135deg,#f472b6,#a78bfa)' },
          { n: '2', text: 'Snap a photo', grad: 'linear-gradient(135deg,#fb923c,#f472b6)' },
          { n: '3', text: 'It lands in your cloud', grad: 'linear-gradient(135deg,#34d399,#06b6d4)' },
        ].map(({ n, text, grad }, i, arr) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: grad, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              color: '#fff', fontSize: 11, fontWeight: 800,
            }}>{n}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>{text}</span>
            {i < arr.length - 1 && (
              <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6, fontSize: 18, lineHeight: 1 }}>·</span>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="anim-fade-up anim-delay-2 mt-8">
        <Link to="/dashboard"
              className="px-8 py-4 text-base rounded-full font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
          Get started for free
        </Link>
      </div>

      {/* Hero animated scene */}
      <div className="anim-fade-up anim-delay-3 relative z-10 mt-12 w-full max-w-5xl px-4">
        <HeroScene />
      </div>

      <div className="wave-bottom" />
    </section>
  );
}

/* ── Hero animated scene ─────────────────────────────────────────────────── */

const REAL_PHOTOS = [
  '/photos/friends.jpg',
  '/photos/wedding-sparklers.jpg',
  '/photos/confetti.jpg',
  '/photos/party.jpg',
  '/photos/wedding-celebration.jpg',
  '/photos/Picture8.jpg',
  '/photos/Picture9.jpg',
];

const GUEST_ROWS = [
  { src: '/photos/friends.jpg',           label: 'friends.jpg',   delay: 0   },
  { src: '/photos/wedding-sparklers.jpg', label: 'sparklers.jpg', delay: 1.0 },
  { src: '/photos/confetti.jpg',          label: 'confetti.jpg',  delay: 2.0 },
];

function HeroScene() {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 48px 1fr',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '16px',
        padding: '12px',
        backdropFilter: 'blur(16px)',
      }}>

        {/* LEFT: Guests snapping */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 1 }}>
            Guests snapping
          </p>
          {GUEST_ROWS.map((row, i) => (
            <GuestPhone key={i} src={row.src} label={row.label} delay={row.delay} />
          ))}
        </div>

        {/* CENTRE: Cloud hub with flying thumbnails */}
        <div style={{ position: 'relative', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="48" height="160" viewBox="0 0 48 160" style={{ position: 'absolute', inset: 0 }}>
            {[20, 80, 140].map((y, i) => (
              <path key={i} d={`M 0 ${y} Q 24 ${y} 24 80`}
                fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 5"/>
            ))}
            {[20, 80, 140].map((y, i) => (
              <path key={`r${i}`} d={`M 24 80 Q 24 ${y} 48 ${y}`}
                fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 5"/>
            ))}
          </svg>
          {/* Flying photo chips */}
          {REAL_PHOTOS.slice(0, 3).map((src, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: i % 2 === 0 ? 0 : 'auto', right: i % 2 === 1 ? 0 : 'auto',
              top: `${12 + i * 44}px`,
              width: 20, height: 20, borderRadius: 5,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              animation: `flyAcross 3s cubic-bezier(0.4,0,0.2,1) ${i * 0.9}s infinite`,
              border: '1.5px solid rgba(255,255,255,0.4)',
            }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          {/* Cloud centre */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%', zIndex: 2,
            background: 'linear-gradient(135deg,#6045f4,#53e6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 6px rgba(96,69,244,0.18), 0 4px 16px rgba(96,69,244,0.4)',
          }}>
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
            </svg>
          </div>
        </div>

        {/* RIGHT: Live wall + upload queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Live photo wall */}
          <div style={{
            borderRadius: 12,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '8px',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'ping 2s infinite', boxShadow: '0 0 5px #34d399' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>LIVE WALL</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {REAL_PHOTOS.slice(0, 6).map((src, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 6, overflow: 'hidden',
                  animation: `wallPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.4}s both`,
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Upload queue */}
          {[
            { name: 'ceremony.jpg',    done: true,  pct: 100, src: REAL_PHOTOS[0] },
            { name: 'first_dance.mp4', done: false, pct: 65,  src: REAL_PHOTOS[1] },
            { name: 'sparklers.jpg',   done: false, pct: 0,   src: REAL_PHOTOS[2] },
          ].map((f, i) => (
            <div key={f.name} style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '6px 8px',
              display: 'flex', alignItems: 'center', gap: 6,
              animation: `heroFadeIn 0.5s ease ${i * 0.4}s both`,
            }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }}>
                <img src={f.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                <div style={{ marginTop: 2, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${f.pct}%`, transition: 'width 0.3s',
                    background: f.done ? '#34d399' : 'linear-gradient(90deg,#6045f4,#53e6d4)',
                    animation: (!f.done && f.pct > 0) ? 'progressGrow 3s ease infinite' : 'none',
                  }} />
                </div>
              </div>
              <div style={{ flexShrink: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.done
                  ? <svg viewBox="0 0 20 20" fill="#34d399" width="12" height="12"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  : f.pct > 0
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="10" height="10" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="9" strokeOpacity="0.2"/><path d="M12 3a9 9 0 019 9" strokeLinecap="round"/></svg>
                    : <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge */}
      <div style={{
        position: 'absolute', bottom: -14, left: 20,
        background: '#fff', borderRadius: 10,
        padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', animation: 'ping 2s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>47 photos &amp; videos uploaded</span>
      </div>
    </div>
  );
}

function GuestPhone({ src, label, delay }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 10, padding: '6px 8px',
      animation: `heroFadeIn 0.6s ease ${delay}s both`,
    }}>
      <div style={{
        width: 26, height: 36, borderRadius: 5,
        border: '1.5px solid rgba(255,255,255,0.3)',
        flexShrink: 0, overflow: 'hidden', position: 'relative',
      }}>
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', inset: 0, background: 'white',
          animation: `shutterFlash 3.5s ease ${delay + 1.2}s infinite`,
          opacity: 0,
        }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
        <p style={{ color: '#53e6d4', fontSize: 9, marginTop: 1 }}>Uploading…</p>
      </div>
      <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: '#53e6d4', animation: `ping 1.5s ease ${delay}s infinite` }} />
    </div>
  );
}

/* ── Logos ─────────────────────────────────────────────────────────────────── */
function Logos() {
  return (
    <section className="py-8 px-6 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-gray-400 text-xs font-semibold uppercase tracking-widest mb-6">
          Works with your favourite cloud storage
        </p>
        <div className="flex items-center justify-center gap-10 flex-wrap">
          {[
            { name: 'Google Drive', color: '#4285F4' },
            { name: 'Microsoft OneDrive', color: '#0078D4' },
            { name: 'Dropbox', color: '#0061FE' },
          ].map(c => (
            <div key={c.name} className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${c.color}18`, border: `1px solid ${c.color}28` }}>
                <div className="w-4 h-4 rounded-sm" style={{ background: c.color }} />
              </div>
              <span className="text-gray-600 text-sm font-medium">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', icon: '📋', title: 'Create your event', desc: 'Sign up, connect your cloud storage, and name your event. Takes 60 seconds.' },
    { n: '02', icon: '📲', title: 'Share the QR code', desc: 'Print it, display it on a screen, or text the link. No app install for guests.' },
    { n: '03', icon: '📸', title: 'Guests snap & upload', desc: 'One tap to take a photo. Uploads directly to your cloud at full resolution.' },
    { n: '04', icon: '☁️', title: 'Your cloud, your folder', desc: 'Every image lands neatly in a named event folder. You own it, forever.' },
  ];

  return (
    <section id="how-it-works" className="py-14 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Simple by design</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            From QR to cloud in{' '}
            <span className="grad-text">10 seconds flat</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className="relative feature-card p-5 flex flex-col gap-3">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <span className="text-gray-300 text-xs font-bold tracking-widest">{s.n}</span>
                <h3 className="text-gray-900 font-bold text-base mt-0.5">{s.title}</h3>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-gray-200 text-xl z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────────────────────────────────────── */
function Features() {
  const features = [
    { icon: '🖼️', title: 'Full-resolution uploads', desc: 'Pro hosts get raw, uncompressed originals. Every pixel captured, nothing lost.' },
    { icon: '⚡', title: 'Direct-to-cloud uploads', desc: "Files fly straight to Google Drive or OneDrive — your guests' photos never touch our servers." },
    { icon: '📺', title: 'Live photo wall', desc: 'Real-time mosaic of every photo as it lands. Perfect for big screens at weddings and conferences.' },
    { icon: '📱', title: 'QR code sharing', desc: 'One scannable code. No SMS campaigns, no WhatsApp groups. Print it and forget it.' },
    { icon: '☁️', title: 'Multi-cloud flexibility', desc: 'Google Drive, Microsoft OneDrive, or Dropbox — the storage your team already uses.' },
    { icon: '📊', title: 'Analytics dashboard', desc: 'See photo counts, last upload times, and storage status across all your events.' },
  ];

  return (
    <section id="features" className="py-14 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Built for <span className="grad-text">collaboration</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="feature-card p-5 flex flex-col gap-3">
              <div className="icon-badge w-10 h-10 flex items-center justify-center text-xl">{f.icon}</div>
              <h3 className="text-gray-900 font-bold text-base">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Live Wall ────────────────────────────────────────────────────────────── */
function LiveWall() {
  const photos = [
    { color: '#e0d9ff' }, { color: '#d9f0f0' }, { color: '#fde8d8' },
    { color: '#d8f5e0' }, { color: '#f0e0ff' }, { color: '#d9ecff' },
    { color: '#fff0d9' }, { color: '#ffe0e0' }, { color: '#e0f5e9' },
  ];
  const names = ['Sarah K.', 'Marcus R.', 'Anna T.', 'James L.', 'Priya M.', 'Tom B.', 'Lily C.', 'Omar S.', 'Zoe P.'];

  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Live photo wall</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Watch the memories{' '}
              <span className="grad-text">roll in live</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg leading-relaxed">
              Display a real-time photo mosaic on any screen. Every upload appears instantly — no refresh, no delay.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                'Auto-populating grid updates in real time',
                'Works on any screen — TV, tablet, laptop',
                'Guests love seeing their photo appear live',
                'Host controls display from the dashboard',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                  <svg viewBox="0 0 20 20" fill="#6045f4" className="w-5 h-5 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link to="/dashboard" className="btn-purple px-7 py-3 inline-block text-sm">
                Try it at your next event
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden p-3 bg-gray-50 border border-gray-100 shadow-lg">
              {photos.map((p, i) => (
                <div key={i} className="rounded-xl aspect-square relative overflow-hidden flex items-end" style={{ background: p.color }}>
                  <span className="block text-[9px] font-semibold text-gray-500/60 p-1.5 truncate w-full">{names[i]}</span>
                  {i === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                      <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1.5 flex items-center gap-2 shadow-md border border-gray-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-800 text-xs font-semibold">9 photos · Live</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="pricing" className="py-14 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Start free. <span className="grad-text">Upgrade when ready.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="pricing-free p-7 flex flex-col gap-4">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Standard</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-5xl font-black text-gray-900">Free</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">For individuals and casual events.</p>
            </div>
            <ul className="space-y-2 flex-1">
              {['Unlimited events & guests', 'Up to 2 MB compressed upload', 'Google Drive, OneDrive, Dropbox', 'Live photo wall', 'QR code sharing', 'Photo analytics'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="w-full py-3 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-sm text-center hover:border-violet-300 hover:text-violet-600 transition-colors">
              Get started free
            </Link>
          </div>
          <div className="pricing-pro p-7 flex flex-col gap-4">
            <div className="inline-flex self-start">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white">Most popular</span>
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Pro</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-5xl font-black text-white">£9</span>
                <span className="text-white/60 text-base mb-2">/mo</span>
              </div>
              <p className="text-white/70 text-sm mt-1">For photographers and professional hosts.</p>
            </div>
            <ul className="space-y-2 flex-1">
              {['Everything in Standard', 'Full-resolution originals (25 MB+)', 'No browser compression', 'Branded event pages', 'Priority upload queue', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-white text-sm">
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4 flex-shrink-0 opacity-80"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="btn-white w-full py-3 text-center text-sm">
              Get started free
            </Link>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm mt-6">No credit card required for Standard. Cancel Pro any time.</p>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="bezl-hero relative py-20 px-6 overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Created for Collaboration<br />and Memorable Moments.
        </h2>
        <p className="mt-5 text-white/70 text-lg">
          Create your first event in 60 seconds. No credit card. No app store.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="btn-white px-10 py-4 text-lg">
            Start for free
          </Link>
          <Link to="/pricing" className="btn-outline-white px-10 py-4 text-lg">
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
