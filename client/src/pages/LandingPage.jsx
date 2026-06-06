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

      {/* ── Two-tone Slido-style join capsule ── */}
      <form onSubmit={handleJoin}
            className="anim-fade-up flex items-center rounded-full overflow-hidden mb-10 shadow-xl"
            style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
        {/* Left: dark label */}
        <span className="px-5 py-2.5 text-white font-bold text-sm whitespace-nowrap"
              style={{ background: 'rgba(0,0,0,0.35)' }}>
          Joining an event?
        </span>
        {/* Right: light input area */}
        <div className="flex items-center px-3 gap-1.5"
             style={{ background: 'rgba(255,255,255,0.18)', minWidth: 0 }}>
          <span className="text-white/60 font-bold text-sm">#</span>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Enter code here"
            maxLength={12}
            autoCapitalize="characters"
            autoCorrect="off"
            className="bg-transparent text-white placeholder-white/50 font-medium text-sm focus:outline-none py-2.5"
            style={{ width: '130px' }}
          />
          <button type="submit"
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
                  style={{ background: '#fff' }}
                  aria-label="Join event">
            {checking ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#6045f4" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 3a9 9 0 019 9" stroke="#6045f4" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Headline */}
      <h1 className="anim-fade-up text-center text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05] max-w-4xl">
        Photos and memories,<br />
        straight to your cloud.
      </h1>

      {/* Numbered steps — single horizontal line */}
      <div className="anim-fade-up anim-delay-1 mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
        {[
          { n: '1', text: 'Guests scan a QR code', grad: 'linear-gradient(135deg,#f472b6,#a78bfa)' },
          { n: '2', text: 'Snap a photo', grad: 'linear-gradient(135deg,#fb923c,#f472b6)' },
          { n: '3', text: 'It lands in your Google Drive, OneDrive, or Dropbox', grad: 'linear-gradient(135deg,#34d399,#06b6d4)' },
        ].map(({ n, text, grad }, i, arr) => (
          <div key={n} className="flex items-center gap-2">
            <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: grad, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              {n}
            </span>
            <span className="text-white/85 text-sm font-medium whitespace-nowrap">{text}</span>
            {i < arr.length - 1 && (
              <span className="text-white/30 ml-2">·</span>
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

      {/* Hero mockup */}
      <div className="anim-fade-up anim-delay-3 relative z-10 mt-12 w-full max-w-3xl px-4">
        <div className="rounded-3xl overflow-hidden bg-white/10 border border-white/20 backdrop-blur-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
            <div className="flex-1 h-7 rounded-lg bg-white/10 flex items-center px-3">
              <span className="text-white/50 text-xs">picachoo.app/e/WEDDING2025</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-6 flex flex-col items-center justify-center gap-4 aspect-square">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-8 h-8 opacity-80">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">Tap to take photo</p>
              <p className="text-white/50 text-xs">Or upload from gallery</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { name: 'Sarah_ceremony.jpg', size: '4.2 MB', pct: 100, done: true },
                { name: 'Mike_reception.jpg', size: '3.8 MB', pct: 67,  done: false },
                { name: 'Anna_dance.jpg',     size: '5.1 MB', pct: 0,   done: false, queued: true },
              ].map(f => (
                <div key={f.name} className="rounded-xl bg-white/10 border border-white/15 p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${f.done ? 'bg-emerald-400/20' : f.queued ? 'bg-white/10' : 'bg-white/15'}`}>
                    {f.done ? <svg viewBox="0 0 20 20" fill="#34d399" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    : f.queued ? <div className="w-2 h-2 rounded-full bg-white/30" />
                    : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4 animate-spin opacity-70"><circle cx="12" cy="12" r="9" strokeOpacity="0.2"/><path d="M12 3a9 9 0 019 9" strokeLinecap="round"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{f.name}</p>
                    <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.done ? '#34d399' : 'rgba(255,255,255,0.7)' }} />
                    </div>
                  </div>
                  <span className="text-white/40 text-[10px] flex-shrink-0">{f.size}</span>
                </div>
              ))}
              <div className="rounded-xl bg-white/10 border border-white/20 p-3 flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4 flex-shrink-0 opacity-80"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                <span className="text-white/80 text-xs font-medium">Saving to Google Drive…</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-4 left-4 md:left-8 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-800 text-xs font-semibold">24 photos uploaded</span>
        </div>
        <div className="absolute -top-4 right-4 md:right-8 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
          <span className="text-xs font-semibold" style={{ color: '#6045f4' }}>✦ Full resolution · Pro</span>
        </div>
      </div>

      <div className="wave-bottom" />
    </section>
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
