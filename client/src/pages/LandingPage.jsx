import { useState, useEffect, useRef } from 'react';
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

      {/* ── Two-tone join capsule ── */}
      <div className="anim-fade-up mb-8 w-full max-w-sm md:max-w-none md:w-auto"
           style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.25))' }}>
        <form onSubmit={handleJoin}
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'stretch',
                borderRadius: '9999px', overflow: 'hidden',
                border: '2.5px solid rgba(255,255,255,0.45)',
                height: '52px', width: '100%',
              }}>
          {/* Left label — hidden on very small screens */}
          <div className="hidden sm:flex" style={{
            alignItems: 'center',
            padding: '0 20px',
            background: 'rgba(20,10,60,0.65)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Joining an event?</span>
          </div>
          {/* Input side */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 6px 6px 14px',
            background: 'rgba(255,255,255,0.18)',
            flex: 1,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>#</span>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Enter event code"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '15px', fontWeight: 500,
                minWidth: 0, flex: 1, caretColor: '#fff',
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
      <h1 className="anim-fade-up text-center text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-3xl px-2">
        The easiest way to collect photos from everyone into your cloud storage.
      </h1>

      {/* Numbered steps — wrap gracefully on mobile */}
      <div className="anim-fade-up anim-delay-1 mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4">
        {[
          { n: '1', text: 'Guests scan a QR code', grad: 'linear-gradient(135deg,#f472b6,#a78bfa)' },
          { n: '2', text: 'Snap a photo', grad: 'linear-gradient(135deg,#fb923c,#f472b6)' },
          { n: '3', text: 'It lands in your cloud', grad: 'linear-gradient(135deg,#34d399,#06b6d4)' },
        ].map(({ n, text, grad }, i, arr) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: grad, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              color: '#fff', fontSize: 10, fontWeight: 800,
            }}>{n}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>{text}</span>
            {i < arr.length - 1 && (
              <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4, fontSize: 18, lineHeight: 1 }}>·</span>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="anim-fade-up anim-delay-2 mt-7">
        <Link to="/dashboard"
              className="px-8 py-4 text-base rounded-full font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
          Get started for free
        </Link>
      </div>

      {/* Hero animated scene */}
      <div className="anim-fade-up anim-delay-3 relative z-10 mt-10 w-full max-w-2xl px-2 sm:px-4">
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

/* Stage durations ms — invite, QR, welcome, camera, uploading, live wall, dashboard */
const STAGE_DURATIONS = [3200, 3000, 2800, 2800, 2800, 3600, 3400];
const TOTAL_STAGES = STAGE_DURATIONS.length;

function HeroScene() {
  const [stage, setStage] = useState(0);
  const [entering, setEntering] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    setEntering(true);
    timerRef.current = setTimeout(() => {
      setEntering(false);
      setTimeout(() => {
        setStage(s => (s + 1) % TOTAL_STAGES);
      }, 400);
    }, STAGE_DURATIONS[stage] - 400);
    return () => clearTimeout(timerRef.current);
  }, [stage]);

  const stageLabels = [
    'Invite card',
    'Guests scan QR',
    'Welcome screen',
    'Camera captures',
    'Guests uploading',
    'Live wall',
    'Event dashboard',
  ];

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Stage indicator pills */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {stageLabels.map((label, i) => (
          <div key={i} title={label} style={{
            height: 4, borderRadius: 99,
            width: i === stage ? 28 : 8,
            background: i === stage ? '#fff' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* Phone + side elements */}
      <div className="phone-story-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, width: '100%', maxWidth: 680 }}>

        {/* Left side: context cards */}
        <div className="hidden md:flex" style={{ flex: 1, flexDirection: 'column', gap: 10, opacity: stage >= 4 ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          {stage >= 4 && REAL_PHOTOS.slice(0, 3).map((src, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, padding: '8px 10px',
              animation: `heroFadeIn 0.5s ease ${i * 0.3}s both`,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600 }}>Guest {i + 1}</p>
                <div style={{ marginTop: 3, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    background: 'linear-gradient(90deg,#6045f4,#53e6d4)',
                    animation: 'progressGrow 2.5s ease infinite',
                  }} />
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#53e6d4" strokeWidth="2.5" width="14" height="14" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" strokeOpacity="0.2"/>
                <path d="M12 3a9 9 0 019 9" strokeLinecap="round"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Phone mockup — light theme like Slido */}
        <div style={{
          width: 'min(200px, 68vw)', flexShrink: 0,
          background: '#e8e8ee',
          borderRadius: 38,
          padding: '10px 7px 14px',
          boxShadow: '0 2px 0 #bbb, 0 24px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.08)',
          position: 'relative',
        }}>
          {/* Dynamic island */}
          <div style={{
            margin: '0 auto 6px', width: 72, height: 24,
            background: '#1a1a1a', borderRadius: 99, position: 'relative', zIndex: 10,
          }} />
          {/* Screen */}
          <div style={{
            borderRadius: 26, overflow: 'hidden',
            height: 'min(400px, 124vw)',
            background: '#f5f5f7',
            position: 'relative',
          }}>
            {/* Status bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 28,
              background: stage === 3 ? 'transparent' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 14px', zIndex: 6, transition: 'background 0.3s',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#1a1a1a' }}>9:41</span>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <div style={{ width: 12, height: 7, borderRadius: 2, border: '1px solid #1a1a1a', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '1px 1px 1px 1px', background: '#1a1a1a', borderRadius: 1, width: '70%' }} />
                </div>
              </div>
            </div>

            {/* Picachoo top bar (shown on non-camera screens) */}
            <div style={{
              position: 'absolute', top: 28, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5, zIndex: 5, height: 36,
              background: '#fff',
              borderBottom: '1px solid #f0f0f0',
              opacity: (stage === 0 || stage === 3) ? 0 : 1, transition: 'opacity 0.3s',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: 5, background: 'linear-gradient(135deg,#6045f4,#53e6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="white" width="10" height="10"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <span style={{ color: '#1a1a1a', fontWeight: 800, fontSize: 12 }}>Picachoo</span>
            </div>

            {/* ── Stage 0: Invite Card ── */}
            <StageInvite active={stage === 0} entering={entering && stage === 0} />
            {/* ── Stage 1: QR Scan ── */}
            <StageQR active={stage === 1} entering={entering && stage === 1} />
            {/* ── Stage 2: Welcome / Enter name ── */}
            <StageWelcome active={stage === 2} entering={entering && stage === 2} />
            {/* ── Stage 3: Camera ── */}
            <StageCamera active={stage === 3} entering={entering && stage === 3} />
            {/* ── Stage 4: Guests uploading ── */}
            <StageJoining active={stage === 4} entering={entering && stage === 4} />
            {/* ── Stage 6: Dashboard (event card) ── */}
            <StageDashboard active={stage === 6} entering={entering && stage === 6} />
            {/* ── Stage 5: Live wall shown as TV screen below ── */}
          </div>
          {/* Home indicator */}
          <div style={{ height: 4, margin: '8px auto 0', width: 56, borderRadius: 99, background: 'rgba(0,0,0,0.2)' }} />
        </div>

        {/* Right side: cloud context (stage 4) */}
        <div className="hidden md:flex" style={{ flex: 1, flexDirection: 'column', gap: 10 }}>
          <div style={{
            opacity: stage === 4 ? 1 : 0,
            transition: 'opacity 0.6s ease',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6045f4,#53e6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(96,69,244,0.18)',
            }}>
              <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>Saved to your cloud</p>
            {['Google Drive', 'OneDrive', 'Dropbox'].map((s, i) => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '6px 10px',
                animation: `heroFadeIn 0.4s ease ${i * 0.25}s both`,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stage 5: Live Wall TV screen ── */}
      {stage === 5 && (
        <div style={{ width: '100%', maxWidth: 560, animation: 'heroFadeIn 0.5s ease both' }}>
          <TVScreen />
        </div>
      )}
    </div>
  );
}

/* ── Phone screen stages ──────────────────────────────────────────────────── */

function StageInvite({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 18,
      background: '#f5f5f7',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Invite card — brand gradient top, warm body */}
      <div style={{
        width: '100%', borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(96,69,244,0.25)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Brand header */}
        <div style={{
          width: '100%', padding: '14px 16px 10px',
          background: 'linear-gradient(135deg,#6045f4,#53e6d4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="white" width="9" height="9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            </div>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>Picachoo</span>
          </div>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            CAPTURE &amp; SHARE MOMENTS
          </p>
        </div>
        {/* Body */}
        <div style={{
          background: '#fff', width: '100%', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#6045f4', textAlign: 'center' }}>Phil &amp; Jane's Wedding</p>
          <div style={{ padding: 8, background: '#f8f7ff', borderRadius: 10, border: '1px solid #ede9fe' }}>
            <QRCodeSVG size={72} />
          </div>
          <p style={{ fontSize: 7, color: '#888', textAlign: 'center' }}>Scan to share your photos instantly</p>
          <div style={{ padding: '4px 10px', borderRadius: 99, background: 'linear-gradient(135deg,#6045f4,#53e6d4)' }}>
            <span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>picachoo.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageQR({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 20px 20px',
      background: '#f5f5f7',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' }}>Scan to join the event</p>
      <div style={{ padding: 12, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(96,69,244,0.15)', border: '1px solid #ede9fe' }}>
        <QRCodeSVG size={96} />
      </div>
      <p style={{ color: '#888', fontSize: 9, textAlign: 'center' }}>Point your camera here</p>
      <div style={{ position: 'absolute', top: '44%', left: '20px', right: '20px', height: 2,
        background: 'linear-gradient(90deg,transparent,#6045f4,#53e6d4,transparent)',
        animation: 'scanLine 2s ease-in-out infinite', borderRadius: 99,
      }} />
    </div>
  );
}

function StageWelcome({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#f5f5f7',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Purple brand top band */}
      <div style={{
        background: 'linear-gradient(135deg,#6045f4,#7060f6,#53e6d4)',
        padding: '36px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Welcome to</p>
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }}>
          PHIL &amp; JANE'S<br/>WEDDING
        </p>
      </div>
      {/* White body */}
      <div style={{
        flex: 1, background: '#fff', padding: '18px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        borderRadius: '0 0 26px 26px',
      }}>
        {/* Name input */}
        <div style={{
          padding: '9px 12px', borderRadius: 12,
          background: '#f5f5f7', border: '1.5px solid #e5e5ea',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" width="13" height="13"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ color: '#bbb', fontSize: 11 }}>Enter your name</span>
        </div>
        {/* Open Camera CTA */}
        <button style={{
          padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#6045f4,#53e6d4)',
          color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(96,69,244,0.35)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="13" height="13">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          OPEN CAMERA
        </button>
      </div>
    </div>
  );
}

function StageJoining({ active, entering }) {
  if (!active) return null;
  const guests = [
    { name: 'Alex',   photo: REAL_PHOTOS[0] },
    { name: 'Maria',  photo: REAL_PHOTOS[2] },
    { name: 'Tom',    photo: REAL_PHOTOS[3] },
    { name: 'Sophie', photo: REAL_PHOTOS[4] },
  ];
  const colors = ['#6045f4','#f472b6','#fb923c','#34d399'];
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#f5f5f7',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Header bar */}
      <div style={{
        height: 64, background: '#fff', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'flex-end', padding: '0 14px 10px',
      }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>Uploading to cloud</p>
      </div>
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'hidden' }}>
        {guests.map((g, i) => (
          <div key={g.name} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', borderRadius: 12, padding: '8px 10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            animation: `heroFadeIn 0.4s ease ${i * 0.28}s both`,
          }}>
            {/* Tiny photo thumbnail */}
            <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0, border: `2px solid ${colors[i]}22` }}>
              <img src={g.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a' }}>{g.name}</p>
              <div style={{ marginTop: 3, height: 3, borderRadius: 99, background: '#f0f0f0', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg,#6045f4,#53e6d4)`,
                  animation: 'progressGrow 2.5s ease infinite',
                }} />
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6045f4" strokeWidth="2.5" width="12" height="12" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" strokeOpacity="0.2"/>
              <path d="M12 3a9 9 0 019 9" strokeLinecap="round"/>
            </svg>
          </div>
        ))}
        {/* Cloud dest badge */}
        <div style={{
          marginTop: 4, padding: '8px 12px', borderRadius: 12,
          background: 'linear-gradient(135deg,rgba(96,69,244,0.08),rgba(83,230,212,0.08))',
          border: '1px solid rgba(96,69,244,0.15)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg viewBox="0 0 24 24" fill="#6045f4" width="14" height="14"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#6045f4' }}>Saving to your cloud…</span>
        </div>
      </div>
    </div>
  );
}

function StageCamera({ active, entering }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setFlash(true), 1800);
    return () => { clearTimeout(t); setFlash(false); };
  }, [active]);

  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Camera viewfinder — real photo as background */}
      <img src={REAL_PHOTOS[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Viewfinder overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
      {/* Corner guides */}
      {[{top:20,left:20},{top:20,right:20},{bottom:60,left:20},{bottom:60,right:20}].map((pos,i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 18, height: 18,
          borderTop: i < 2 ? '2px solid #fff' : 'none',
          borderBottom: i >= 2 ? '2px solid #fff' : 'none',
          borderLeft: i % 2 === 0 ? '2px solid #fff' : 'none',
          borderRight: i % 2 === 1 ? '2px solid #fff' : 'none',
          borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
        }} />
      ))}
      {/* Shutter button */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: flash ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
          transition: 'background 0.1s',
        }} />
      </div>
      {/* Flash overlay */}
      {flash && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', animation: 'shutterFlash 0.4s ease both' }} />
      )}
      {/* Flying photo chip after flash */}
      {flash && (
        <div style={{
          position: 'absolute', bottom: 20, right: 16,
          width: 36, height: 36, borderRadius: 8, overflow: 'hidden',
          border: '2px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          animation: 'flyOut 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
        }}>
          <img src={REAL_PHOTOS[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}

/* ── TV / big-screen Live Wall ───────────────────────────────────────────── */
function TVScreen() {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 0 rgba(0,0,0,0.35), 0 24px 60px rgba(0,0,0,0.5)',
      background: '#0a0a0a',
      border: '3px solid #1a1a1a',
    }}>
      {/* Top bar — exactly like the WallPage screenshot */}
      <div style={{
        background: '#0a0a0a',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Left: pica·choo wordmark + event name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#6045f4' }}>pica</span>
            <span style={{ color: '#53e6d4' }}>choo</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>Phil &amp; Jane's Wedding</span>
        </div>
        {/* Right: LIVE indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
          <span style={{ color: '#34d399', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>

      {/* Photo grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 2, background: '#000',
      }}>
        {REAL_PHOTOS.slice(0, 4).map((src, i) => (
          <div key={i} style={{
            aspectRatio: '4/3', overflow: 'hidden',
            animation: `wallPop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.2}s both`,
            position: 'relative',
          }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Photo count badge on first */}
            {i === 0 && (
              <div style={{
                position: 'absolute', bottom: 6, left: 6,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                borderRadius: 6, padding: '2px 7px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>47 photos</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TV stand */}
      <div style={{ height: 8, background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
        <div style={{ width: 48, height: 4, background: '#222', borderRadius: '0 0 4px 4px' }} />
      </div>
    </div>
  );
}

/* ── Dashboard event card stage ──────────────────────────────────────────── */
function StageDashboard({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#f5f5f7', overflowY: 'hidden',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Top nav */}
      <div style={{
        height: 52, background: '#fff', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', padding: '0 14px',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#6045f4' }}>pica</span><span style={{ color: '#53e6d4' }}>choo</span>
        </span>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6045f4,#53e6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>H</span>
        </div>
      </div>

      {/* Section header */}
      <div style={{ padding: '10px 12px 4px' }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Your Events <span style={{ background: '#6045f4', color: '#fff', borderRadius: 99, padding: '0 4px', marginLeft: 3, fontSize: 7 }}>1</span>
        </p>
      </div>

      {/* Event card */}
      <div style={{ margin: '0 10px', animation: 'heroFadeIn 0.4s ease 0.1s both' }}>
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid #ede9fe',
          boxShadow: '0 2px 12px rgba(96,69,244,0.08)',
          overflow: 'hidden',
        }}>
          {/* Event title row */}
          <div style={{ padding: '10px 12px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>Phil &amp; Jane's Wedding</p>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" width="11" height="11"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6045f4" strokeWidth="2.5" width="10" height="10"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, padding: '2px 7px', borderRadius: 99, background: '#dcfce7', fontSize: 8, fontWeight: 700, color: '#16a34a' }}>
              ● ACTIVE
            </span>
          </div>

          <div style={{ height: 1, background: '#f5f5f7', margin: '0 12px' }} />

          {/* Stats row */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#6045f4' }}>47</p>
              <p style={{ fontSize: 7, color: '#888' }}>Photos</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>12</p>
              <p style={{ fontSize: 7, color: '#888' }}>Guests</p>
            </div>
          </div>

          {/* Drive connected banner */}
          <div style={{
            margin: '0 10px 10px',
            background: 'linear-gradient(135deg,rgba(96,69,244,0.07),rgba(83,230,212,0.07))',
            border: '1px solid rgba(96,69,244,0.15)',
            borderRadius: 10, padding: '8px 10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 24 24" fill="#6045f4" width="12" height="12"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#6045f4' }}>Google Drive connected</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 7.5, color: '#888', marginBottom: 5 }}>Photos are saved to a dedicated folder.</p>
            {/* Storage bar */}
            <div style={{ height: 3, borderRadius: 99, background: '#e5e7eb', overflow: 'hidden', marginBottom: 3 }}>
              <div style={{ height: '100%', width: '46%', borderRadius: 99, background: 'linear-gradient(90deg,#6045f4,#53e6d4)' }} />
            </div>
            <p style={{ fontSize: 7, color: '#888' }}>7.4 GB of 16.1 GB used</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Simple QR code SVG placeholder */
function QRCodeSVG({ size = 80 }) {
  const cell = size / 10;
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,0],
    [1,1,1,1,1,1,1,0,1,0],
    [0,0,0,0,0,0,0,0,1,1],
    [1,0,1,1,0,1,0,1,0,1],
    [0,1,0,0,1,0,1,1,1,0],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white"/>
      {pattern.map((row, r) =>
        row.map((bit, c) => bit ? (
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111"/>
        ) : null)
      )}
    </svg>
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
