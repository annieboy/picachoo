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
        The easiest way to share photos and videos to your cloud.
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

/* Stage durations in ms */
const STAGE_DURATIONS = [3200, 3000, 2800, 2600, 3200, 3400];
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
    'Invite card shared',
    'Guests scan QR',
    'Guests join & enter name',
    'Camera opens & captures',
    'Photos fly to cloud',
    'Live wall goes live',
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

        {/* Phone mockup */}
        <div style={{
          width: 'min(220px, 72vw)', flexShrink: 0,
          background: '#0f0f14',
          borderRadius: 36,
          padding: '10px 8px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 32px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
          position: 'relative',
        }}>
          {/* Notch */}
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 70, height: 22, background: '#0f0f14',
            borderRadius: '0 0 14px 14px', zIndex: 10,
            boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.07)',
          }} />
          {/* Screen */}
          <div style={{
            borderRadius: 28, overflow: 'hidden',
            height: 'min(420px, 130vw)',
            background: 'linear-gradient(160deg,#1a1030 0%,#0d0820 100%)',
            position: 'relative',
          }}>
            {/* Picachoo logo always at top */}
            <div style={{
              position: 'absolute', top: 28, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5, zIndex: 5,
              opacity: stage === 0 ? 0 : 1, transition: 'opacity 0.4s',
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#6045f4,#53e6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="white" width="11" height="11"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em' }}>Picachoo</span>
            </div>

            {/* ── Stage 0: Invite Card ── */}
            <StageInvite active={stage === 0} entering={entering && stage === 0} />

            {/* ── Stage 1: QR Scan ── */}
            <StageQR active={stage === 1} entering={entering && stage === 1} />

            {/* ── Stage 2: People joining ── */}
            <StageJoining active={stage === 2} entering={entering && stage === 2} />

            {/* ── Stage 3: Welcome / Enter name ── */}
            <StageWelcome active={stage === 3} entering={entering && stage === 3} />

            {/* ── Stage 4 (inside phone): Camera shutter → photo flies out ── */}
            <StageCamera active={stage === 4} entering={entering && stage === 4} />

            {/* ── Stage 5: Live wall ── */}
            <StageLiveWall active={stage === 5} entering={entering && stage === 5} />
          </div>
          {/* Home bar */}
          <div style={{ height: 4, margin: '8px auto 2px', width: 60, borderRadius: 99, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* Right side: cloud / live wall context */}
        <div className="hidden md:flex" style={{ flex: 1, flexDirection: 'column', gap: 10 }}>
          {/* Cloud upload indicator (stages 4) */}
          <div style={{
            opacity: stage === 4 ? 1 : 0,
            transition: 'opacity 0.6s ease',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6045f4,#53e6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 10px rgba(96,69,244,0.15)',
            }}>
              <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>Your cloud storage</p>
            {['Google Drive', 'OneDrive', 'Dropbox'].map((s, i) => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '6px 10px',
                animation: `heroFadeIn 0.4s ease ${i * 0.25}s both`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Live wall grid (stage 5) */}
          <div style={{
            opacity: stage === 5 ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Event live wall</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
              {REAL_PHOTOS.slice(0, 4).map((src, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
                  animation: `wallPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.35}s both`,
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 8, padding: '6px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>47 photos uploaded live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Phone screen stages ──────────────────────────────────────────────────── */

function StageInvite({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Invite card */}
      <div style={{
        width: '100%', borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(145deg,#fffdf5,#fff9e8)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,220,100,0.4)',
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {/* Decorative top */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['#f472b6','#fb923c','#a78bfa'].map((c,i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#92400e', textAlign: 'center', lineHeight: 1.3 }}>
          CAPTURE AND SHARE MOMENTS
        </p>
        <p style={{ fontSize: 8, color: '#b45309', textAlign: 'center' }}>Phil &amp; Jane's Wedding</p>
        {/* QR code SVG */}
        <div style={{ padding: 8, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <QRCodeSVG size={80} />
        </div>
        <p style={{ fontSize: 7, color: '#92400e', textAlign: 'center', opacity: 0.7 }}>
          Scan to share your photos
        </p>
        <p style={{ fontSize: 7, color: '#b45309', fontWeight: 600 }}>picachoo.com</p>
      </div>
    </div>
  );
}

function StageQR({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 16px 16px',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      <div style={{ padding: 12, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <QRCodeSVG size={100} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'center' }}>
        Point your camera here to join
      </p>
      {/* Scanning line animation */}
      <div style={{ position: 'absolute', top: '50%', left: '16px', right: '16px', height: 2,
        background: 'linear-gradient(90deg,transparent,#53e6d4,transparent)',
        animation: 'scanLine 2s ease-in-out infinite',
      }} />
    </div>
  );
}

function StageJoining({ active, entering }) {
  if (!active) return null;
  const guests = ['Alex', 'Maria', 'Tom', 'Sophie', 'James'];
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      padding: '52px 14px 14px', gap: 6,
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        Guests joining…
      </p>
      {guests.map((name, i) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '7px 10px',
          animation: `heroFadeIn 0.4s ease ${i * 0.3}s both`,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg,${['#f472b6','#fb923c','#a78bfa','#34d399','#60a5fa'][i]},${['#a78bfa','#f472b6','#53e6d4','#60a5fa','#f472b6'][i]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{name[0]}</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600 }}>{name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
            <span style={{ color: '#34d399', fontSize: 9 }}>joined</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StageWelcome({ active, entering }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, padding: '52px 20px 20px',
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>You're invited to</p>
        <p style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginTop: 4, lineHeight: 1.2 }}>
          PHIL &amp; JANE'S<br/>WEDDING
        </p>
      </div>
      {/* Name input */}
      <div style={{
        width: '100%', padding: '9px 12px',
        background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)',
        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" width="13" height="13"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Enter your name</span>
      </div>
      {/* Open Camera button */}
      <button style={{
        width: '100%', padding: '11px 0',
        background: 'linear-gradient(135deg,#6045f4,#53e6d4)',
        border: 'none', borderRadius: 12, cursor: 'pointer',
        color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.03em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: '0 4px 16px rgba(96,69,244,0.5)',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="14" height="14">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        OPEN CAMERA
      </button>
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

function StageLiveWall({ active, entering }) {
  const [liveToggle, setLiveToggle] = useState(false);
  useEffect(() => {
    if (!active) { setLiveToggle(false); return; }
    const t = setTimeout(() => setLiveToggle(true), 900);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      padding: '52px 12px 12px', gap: 10,
      animation: entering ? 'slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'slideOutLeft 0.4s ease both',
    }}>
      {/* Toggle row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, padding: '8px 12px',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600 }}>Enable Live Wall</span>
        {/* Toggle switch */}
        <div onClick={() => setLiveToggle(v => !v)} style={{
          width: 36, height: 20, borderRadius: 99, cursor: 'pointer',
          background: liveToggle ? 'linear-gradient(135deg,#6045f4,#53e6d4)' : 'rgba(255,255,255,0.2)',
          transition: 'background 0.3s', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: liveToggle ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }} />
        </div>
      </div>

      {/* Live wall grid */}
      {liveToggle && (
        <div style={{
          flex: 1, borderRadius: 14, overflow: 'hidden',
          background: '#000', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
            <span style={{ color: '#fff', fontSize: 8, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>LIVE WALL</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, height: '100%', paddingTop: 22 }}>
            {REAL_PHOTOS.slice(0, 4).map((src, i) => (
              <div key={i} style={{
                overflow: 'hidden',
                animation: `wallPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.3}s both`,
              }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}
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
