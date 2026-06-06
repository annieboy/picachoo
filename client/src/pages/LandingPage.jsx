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
      <Differentiators />
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
             style={{ paddingTop: '96px', paddingBottom: '80px' }}>

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
        Collect photos from everyone — straight into your cloud.
      </h1>

      {/* Sub-headline */}
      <p className="anim-fade-up anim-delay-1 text-center text-white/70 text-base sm:text-lg max-w-xl px-4 mt-3" style={{ lineHeight: 1.6 }}>
        Guests scan a QR code, snap photos, and they land directly in your album. Perfect for families, trips, schools, clubs, weddings, and events.
      </p>

      {/* Numbered steps */}
      <div className="anim-fade-up anim-delay-1 mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4">
        {[
          { n: '1', text: 'Scan a QR code',       grad: 'linear-gradient(135deg,#f472b6,#a78bfa)' },
          { n: '2', text: 'Snap &amp; contribute', grad: 'linear-gradient(135deg,#fb923c,#f472b6)' },
          { n: '3', text: 'Photos land in your cloud', grad: 'linear-gradient(135deg,#34d399,#06b6d4)' },
        ].map(({ n, text, grad }, i, arr) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: grad, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              color: '#fff', fontSize: 10, fontWeight: 800,
            }}>{n}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: text }} />
            {i < arr.length - 1 && (
              <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4, fontSize: 18, lineHeight: 1 }}>·</span>
            )}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="anim-fade-up anim-delay-2 mt-7 flex flex-col sm:flex-row gap-3 items-center">
        <Link to="/dashboard"
              className="px-8 py-4 text-base rounded-full font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
          Create your first event — free
        </Link>
        <a href="#how-it-works"
           className="text-white/60 text-sm font-semibold hover:text-white transition-colors">
          See how it works ↓
        </a>
      </div>

      {/* Hero animated scene */}
      <div className="anim-fade-up anim-delay-3 relative z-10 mt-10 w-full max-w-lg px-2 sm:px-0">
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

/*
 * Stage order: 0=QR, 1=Welcome, 2=Camera, 3=Joining, 4=LiveWall(TV), 5=Dashboard
 * Each stage: phone slides IN from right → holds → slides OUT to left → next stage slides in from right
 */
const STAGE_DURATIONS = [3400, 3000, 3000, 2800, 3800];
const TOTAL_STAGES = STAGE_DURATIONS.length;
const EXIT_MS = 420; /* slide-out duration before next stage mounts */

function HeroScene() {
  const [stage, setStage]     = useState(0);
  const [exiting, setExiting] = useState(false);
  const timerRef              = useRef(null);

  useEffect(() => {
    setExiting(false);
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setStage(s => (s + 1) % TOTAL_STAGES);
      }, EXIT_MS);
    }, STAGE_DURATIONS[stage] - EXIT_MS);
    return () => clearTimeout(timerRef.current);
  }, [stage]);

  const stageLabels = ['QR scan', 'Welcome', 'Camera', 'Uploading', 'Live wall'];
  const showMonitor = stage === 4;
  /* key changes → React remounts the element → CSS entry animation fires again */
  const phoneKey    = `phone-${stage}-${exiting ? 'out' : 'in'}`;

  const phoneAnim = exiting
    ? 'phoneSlideOut 0.42s cubic-bezier(0.4,0,0.8,0.2) both'
    : 'phoneSlideIn  0.55s cubic-bezier(0.34,1.35,0.64,1) both';

  /* camera stage has dark status bar */
  /* QR (0), Welcome (1), and Camera (2) all have dark/gradient backgrounds */
  const darkBar = stage === 0 || stage === 1 || stage === 2;

  /*
   * Fixed-size stage viewport so phone + monitor occupy identical space.
   * Phone is centred inside; monitor fills the full width.
   * overflow:hidden clips the slide-in/out so nothing bleeds outside.
   */
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

      {/* Stage indicator pills */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {stageLabels.map((label, i) => (
          <div key={i} title={label} style={{
            height: 4, borderRadius: 99,
            width: i === stage ? 24 : 7,
            background: i === stage ? '#fff' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* Stage viewport — fixed size matching the monitor width */}
      <div style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* tall enough for phone + its shadow, same for monitor */
        minHeight: 'min(320px, 100vw)',
      }}>

        {/* ── Phone (stages 0–3, 5) ── */}
        {!showMonitor && (
          <div
            key={phoneKey}
            style={{
              width: 'min(170px, 54vw)',
              flexShrink: 0,
              background: 'linear-gradient(160deg,#e2e2e8 0%,#cacad2 100%)',
              borderRadius: 36,
              padding: '9px 6px 11px',
              boxShadow: '0 2px 0 rgba(0,0,0,0.2), 0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(0,0,0,0.1)',
              animation: phoneAnim,
            }}>
            {/* Dynamic island */}
            <div style={{ margin: '0 auto 6px', width: 58, height: 19, background: '#111', borderRadius: 99 }} />
            {/* Screen */}
            <div style={{
              borderRadius: 24, overflow: 'hidden',
              height: 'min(290px, 90vw)',
              background: '#f5f5f7',
              position: 'relative',
            }}>
              {/* Status bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 22,
                background: darkBar ? 'transparent' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 12px', zIndex: 8,
              }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: darkBar ? '#fff' : '#1a1a1a' }}>9:41</span>
                <div style={{ width: 10, height: 6, borderRadius: 2, border: `1.5px solid ${darkBar ? '#fff' : '#1a1a1a'}`, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 1, left: 1, bottom: 1, borderRadius: 1, background: darkBar ? '#fff' : '#1a1a1a', width: '65%' }} />
                </div>
              </div>

              {/* Picachoo nav bar (hidden on QR, welcome, camera — they have their own full-screen brand header) */}
              {stage !== 0 && stage !== 1 && stage !== 2 && (
                <div style={{
                  position: 'absolute', top: 22, left: 0, right: 0, height: 30,
                  background: '#fff', borderBottom: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 4, zIndex: 7,
                }}>
                  <div style={{ width: 13, height: 13, borderRadius: 4, background: 'linear-gradient(135deg,#6045f4,#53e6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="white" width="8" height="8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800 }}>
                    <span style={{ color: '#6045f4' }}>Pica</span><span style={{ color: '#1a1a1a' }}>choo</span>
                  </span>
                </div>
              )}

              <StageQR      active={stage === 0} />
              <StageWelcome active={stage === 1} />
              <StageCamera  active={stage === 2} />
              <StageJoining active={stage === 3} />
            </div>
            {/* Home bar */}
            <div style={{ height: 3, margin: '6px auto 0', width: 46, borderRadius: 99, background: 'rgba(0,0,0,0.18)' }} />
          </div>
        )}

        {/* ── Monitor / TV screen (stage 4) ── */}
        {showMonitor && (
          <div style={{
            width: '100%',
            animation: exiting
              ? 'monitorSlideOut 0.42s cubic-bezier(0.4,0,0.8,0.2) both'
              : 'monitorSlideIn  0.55s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <TVScreen />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Phone screen stages ──────────────────────────────────────────────────── */

function StageInvite({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 18,
      background: '#f5f5f7',
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

function StageQR({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      background: 'linear-gradient(160deg,#6045f4 0%,#7060f6 50%,#53e6d4 100%)',
      padding: '52px 20px 20px',
    }}>
      {/* Logo */}
      <p style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 2 }}>
        <span style={{ color: '#fff' }}>pica</span><span style={{ color: '#a5f3e8' }}>choo</span>
      </p>
      <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
        made for memorable moments
      </p>
      {/* QR card */}
      <div style={{
        padding: 10, background: '#fff', borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        position: 'relative',
      }}>
        <QRCodeSVG size={90} />
        <div style={{
          position: 'absolute', left: 10, right: 10, height: 1.5,
          background: 'linear-gradient(90deg,transparent,#6045f4,#53e6d4,transparent)',
          animation: 'scanLine 2s ease-in-out infinite', borderRadius: 99,
        }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8, textAlign: 'center', marginTop: 4 }}>
        Scan to join and share photos
      </p>
    </div>
  );
}

function StageWelcome({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#6045f4 0%,#7060f6 50%,#53e6d4 100%)',
      padding: '52px 16px 20px',
      gap: 0,
    }}>
      {/* Logo */}
      <p style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 2 }}>
        <span style={{ color: '#fff' }}>pica</span><span style={{ color: '#a5f3e8' }}>choo</span>
      </p>
      <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
        made for memorable moments
      </p>
      {/* Invited label */}
      <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>
        you're invited to
      </p>
      {/* Event name */}
      <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.15, marginBottom: 6 }}>
        Phil &amp; Jane's<br/>Wedding
      </p>
      <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
        Share your photos and help<br/>capture the memories.
      </p>
      {/* Name input */}
      <div style={{
        width: '100%', padding: '9px 12px', borderRadius: 99,
        background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" width="11" height="11"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>Enter name to proceed</span>
      </div>
      {/* Open Camera */}
      <div style={{
        width: '100%', padding: '9px 12px', borderRadius: 99,
        background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" width="11" height="11">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>Open Camera</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 14 }}>
        photobook</p>
    </div>
  );
}

function StageJoining({ active }) {
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

function StageCamera({ active }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setFlash(true), 1800);
    return () => { clearTimeout(t); setFlash(false); };
  }, [active]);

  if (!active) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
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

/* ── Monitor / Live Wall screen ─────────────────────────────────────────── */
function TVScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Monitor bezel */}
      <div style={{
        width: '100%',
        background: '#1c1c1e',
        borderRadius: 16,
        padding: '8px 8px 10px',
        boxShadow: '0 0 0 1.5px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Screen */}
        <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000' }}>

          {/* Top bar — logo left, LIVE right */}
          <div style={{
            background: '#0a0a0a',
            padding: '9px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em' }}>
                <span style={{ color: '#6045f4' }}>pica</span><span style={{ color: '#53e6d4' }}>choo</span>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600 }}>Phil &amp; Jane's Wedding</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', animation: 'ping 1.5s infinite' }} />
              <span style={{ color: '#34d399', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
          </div>

          {/* Photo wall — 2 rows × 3 cols (smaller photos as user asked) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 3, padding: 3,
            background: '#0a0a0a',
          }}>
            {REAL_PHOTOS.slice(0, 6).map((src, i) => (
              <div key={i} style={{
                aspectRatio: '4/3', overflow: 'hidden', borderRadius: 6, position: 'relative',
                animation: `wallPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.15}s both`,
              }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Guest name overlay on a couple */}
                {i < 2 && (
                  <div style={{
                    position: 'absolute', bottom: 5, left: 5,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    borderRadius: 5, padding: '2px 6px',
                  }}>
                    <span style={{ color: '#fff', fontSize: 8, fontWeight: 600 }}>{['Alex','Maria'][i]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            background: '#0a0a0a', padding: '7px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              picachoo.vercel.app/e/WEDDING25
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }}>47 photos</span>
          </div>
        </div>
      </div>

      {/* Monitor neck */}
      <div style={{
        width: 3, height: 18, background: 'linear-gradient(180deg,#2a2a2e,#1a1a1c)',
        boxShadow: '1px 0 0 rgba(255,255,255,0.05)',
      }} />
      {/* Monitor base */}
      <div style={{
        width: 120, height: 12, borderRadius: '0 0 12px 12px',
        background: 'linear-gradient(180deg,#2a2a2e,#1c1c1e)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
      }} />
    </div>
  );
}

/* ── Dashboard event card stage ──────────────────────────────────────────── */
function StageDashboard({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#f5f5f7', overflowY: 'hidden',
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
          Photos go straight into the storage you already use
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
    {
      n: '01', icon: '☁️',
      title: 'Connect your cloud',
      desc: 'Link Google Drive, OneDrive, or Dropbox. Picachoo creates a dedicated folder for your event automatically.',
    },
    {
      n: '02', icon: '🔗',
      title: 'Share a QR code or link',
      desc: 'Print it, display it on screen, or drop it in a message. Anyone can join instantly — no app download, no sign-up.',
    },
    {
      n: '03', icon: '📸',
      title: 'Guests snap & contribute',
      desc: 'One tap opens the camera. Photos upload directly to your storage at the quality you choose.',
    },
    {
      n: '04', icon: '🎉',
      title: 'Relive & display memories',
      desc: 'Every photo lands in your folder, yours to keep forever. Stream them live on a photo wall at your event.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Simple by design</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Set up in under{' '}
            <span className="grad-text">60 seconds</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
            No app installs. No platform lock-in. Your photos, in your storage, from everyone who was there.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className="relative feature-card p-6 flex flex-col gap-3">
              <div className="icon-badge w-11 h-11 flex items-center justify-center text-2xl">{s.icon}</div>
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

/* ── Use Cases ────────────────────────────────────────────────────────────── */
function Features() {
  const useCases = [
    {
      icon: '👨‍👩‍👧‍👦',
      title: 'Families',
      desc: 'Stop chasing photos after every gathering. Everyone contributes, and all the memories live in one shared place — in your cloud, not someone else\'s app.',
    },
    {
      icon: '✈️',
      title: 'Trips & Friend Groups',
      desc: 'Collect every angle from the whole group, automatically. No more "can you send me your photos?" messages weeks later.',
    },
    {
      icon: '💍',
      title: 'Weddings & Events',
      desc: 'Guests contribute candid moments you\'d never capture yourself — and watch them appear live on screen as the night unfolds.',
    },
    {
      icon: '🏫',
      title: 'Schools & Clubs',
      desc: 'Build community galleries without the admin. Each event creates its own folder. Share with everyone, own it forever.',
    },
    {
      icon: '📸',
      title: 'Photography Communities',
      desc: 'Gather shots from multiple contributors, display them live, and elevate your service with a professional photo wall experience.',
    },
    {
      icon: '🎤',
      title: 'Conferences & Meetups',
      desc: 'Capture the energy of the room. Attendees contribute photos in real time while the live wall keeps the buzz going on screen.',
    },
  ];

  return (
    <section id="features" className="py-16 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Who it's for</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Built for <span className="grad-text">every occasion</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
            Wherever people gather and memories are made, Picachoo makes sure you collect them all.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {useCases.map(f => (
            <div key={f.title} className="feature-card p-6 flex flex-col gap-3">
              <div className="icon-badge w-11 h-11 flex items-center justify-center text-2xl">{f.icon}</div>
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
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-4">Live photo wall</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Guests see their photo<br />
              <span className="grad-text">appear live on screen</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg leading-relaxed">
              Display a real-time photo wall on any TV, projector, or screen. Every upload appears the moment it lands — no refresh, no delay, no friction.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Real-time updates — photos appear within seconds',
                'Display on any screen: TV, laptop, or projector',
                'Guests love seeing their shot go live instantly',
                'Toggle on or off from your host dashboard',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                  <svg viewBox="0 0 20 20" fill="#6045f4" className="w-5 h-5 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/dashboard" className="btn-purple px-8 py-3.5 inline-block text-sm font-bold">
                Try it at your next event →
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden p-3 bg-gray-900 shadow-2xl">
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
            <div className="absolute -top-3 left-4 right-4 bg-gray-900 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-bold">
                <span className="text-violet-400">pica</span><span className="text-teal-300">choo</span>
                <span className="text-gray-500 mx-2">·</span>
                <span className="text-gray-300 font-semibold">Phil &amp; Jane's Wedding</span>
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold tracking-wide">LIVE</span>
              </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1.5 flex items-center gap-2 shadow-md border border-gray-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-800 text-xs font-semibold">47 photos live</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Differentiators ──────────────────────────────────────────────────────── */
function Differentiators() {
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Why Picachoo</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Photos stay <span className="grad-text">yours, forever</span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">
            Unlike other sharing apps, Picachoo doesn't hold your photos hostage. They flow directly into storage you already own.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: '🔐',
              title: 'Direct-to-cloud ownership',
              desc: 'Photos belong to you, not us. They\'re uploaded straight to your Google Drive, OneDrive, or Dropbox — in a named event folder, ready to share or archive.',
              tag: 'You own your data',
            },
            {
              icon: '📲',
              title: 'Zero friction for guests',
              desc: 'No app download. No account. Guests scan a QR code, enter their name, and start contributing in seconds. The simpler it is, the more photos you collect.',
              tag: 'Just scan & shoot',
            },
          ].map(d => (
            <div key={d.title} className="feature-card p-7 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="icon-badge w-12 h-12 flex items-center justify-center text-2xl">{d.icon}</div>
                <span className="badge-grad text-xs font-bold px-3 py-1">{d.tag}</span>
              </div>
              <h3 className="text-gray-900 font-black text-xl">{d.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="pricing" className="py-16 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-3">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Start free. <span className="grad-text">Upgrade when ready.</span>
          </h2>
          <p className="mt-3 text-gray-500 text-base max-w-md mx-auto">
            No credit card required. No hidden fees. Cancel any time.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="pricing-free p-7 flex flex-col gap-5">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Standard</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-5xl font-black text-gray-900">Free</span>
              </div>
              <p className="text-gray-500 text-sm mt-1.5">For families, friends, and casual events.</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Unlimited events & unlimited guests',
                'Optimised photo uploads (up to 2.5 MB)',
                'Google Drive, OneDrive & Dropbox',
                'Live photo wall',
                'QR code & event link sharing',
                'Event dashboard & photo count',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-gray-600 text-sm">
                  <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4 flex-shrink-0 mt-0.5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="w-full py-3.5 rounded-full border-2 border-gray-200 text-gray-700 font-bold text-sm text-center hover:border-violet-300 hover:text-violet-600 transition-colors">
              Get started for free
            </Link>
          </div>
          {/* Pro */}
          <div className="pricing-pro p-7 flex flex-col gap-5">
            <div className="inline-flex self-start">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white tracking-wide">Most popular</span>
            </div>
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Pro</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-5xl font-black text-white">£9</span>
                <span className="text-white/50 text-base mb-2">/mo</span>
              </div>
              <p className="text-white/70 text-sm mt-1.5">For photographers and professional event hosts.</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                'Everything in Standard',
                'Full-resolution originals — no compression',
                'Direct-to-cloud at 25 MB+ per photo',
                'Branded event pages',
                'Priority upload queue',
                'Priority support',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-white text-sm">
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="btn-white w-full py-3.5 text-center text-sm font-bold">
              Start free — upgrade later
            </Link>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm mt-6">No credit card required. Cancel Pro any time.</p>
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
          Every moment captured.<br />Every photo in your cloud.
        </h2>
        <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
          Picachoo lets groups contribute photos directly into your cloud storage through a QR code — with optional live displays for events. Set up in 60 seconds.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="btn-white px-10 py-4 text-base font-bold">
            Create your first event — free
          </Link>
          <Link to="/pricing" className="btn-outline-white px-10 py-4 text-base font-bold">
            See pricing
          </Link>
        </div>
        <p className="mt-5 text-white/40 text-sm">No credit card. No app download for guests. No platform lock-in.</p>
      </div>
    </section>
  );
}
