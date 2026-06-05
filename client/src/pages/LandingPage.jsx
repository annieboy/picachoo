import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function LandingPage() {
  return (
    <MarketingLayout>
      <Hero />
      <Logos />
      <HowItWorks />
      <Features />
      <LiveWall />
      <Pricing />
      <Testimonials />
      <FinalCTA />
    </MarketingLayout>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] bg-violet-600 -top-32 -left-32" style={{ animationDelay: '0s' }} />
      <div className="orb w-[400px] h-[400px] bg-violet-400 top-1/3 -right-24" style={{ animationDelay: '7s' }} />
      <div className="orb w-[300px] h-[300px] bg-indigo-500 bottom-0 left-1/3" style={{ animationDelay: '14s' }} />

      {/* Badge */}
      <div className="anim-fade-up relative z-10 mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          No app install required · Instant sharing
        </span>
      </div>

      {/* Headline */}
      <h1 className="anim-fade-up anim-delay-1 relative z-10 text-center text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl">
        Your memories,{' '}
        <span className="grad-text">straight to your cloud.</span>
      </h1>

      <p className="anim-fade-up anim-delay-2 relative z-10 mt-6 text-center text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
        Guests scan a QR code, snap or pick a photo, and it lands directly in your Google Drive, OneDrive, or Dropbox — in full resolution. No app, no account, no friction.
      </p>

      {/* CTAs */}
      <div className="anim-fade-up anim-delay-3 relative z-10 mt-10 flex flex-col sm:flex-row gap-3 items-center">
        <Link to="/dashboard"
              className="px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold transition-all duration-200 glow-violet hover:scale-[1.02] active:scale-95">
          Create a free event
        </Link>
        <a href="#how-it-works"
           className="px-8 py-4 rounded-2xl text-zinc-300 hover:text-white text-base font-semibold transition-colors flex items-center gap-2 glass">
          See how it works
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-60">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd"/>
          </svg>
        </a>
      </div>

      {/* Hero mockup */}
      <div className="anim-fade-up anim-delay-4 relative z-10 mt-16 w-full max-w-3xl">
        <div className="relative rounded-3xl overflow-hidden glow-violet"
             style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.15), rgba(5,5,7,0.9))', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="p-6 md:p-10">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 h-7 rounded-lg bg-zinc-800/60 flex items-center px-3">
                <span className="text-zinc-500 text-xs">picachoo.app/e/WEDDING2025</span>
              </div>
            </div>

            {/* Mock upload UI */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-zinc-900/60 p-6 flex flex-col items-center justify-center gap-4 border border-white/5 aspect-square">
                <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                  </svg>
                </div>
                <p className="text-white font-semibold text-sm">Tap to take photo</p>
                <p className="text-zinc-500 text-xs text-center">Or upload from gallery</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { name: 'Sarah_ceremony.jpg', size: '4.2 MB', status: 'done', pct: 100 },
                  { name: 'Mike_reception.jpg', size: '3.8 MB', status: 'uploading', pct: 67 },
                  { name: 'Anna_dance.jpg', size: '5.1 MB', status: 'queued', pct: 0 },
                ].map(f => (
                  <div key={f.name} className="rounded-xl glass p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      f.status === 'done' ? 'bg-emerald-500/20' : f.status === 'uploading' ? 'bg-violet-500/20' : 'bg-zinc-700/40'
                    }`}>
                      {f.status === 'done' ? (
                        <svg viewBox="0 0 20 20" fill="#34d399" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      ) : f.status === 'uploading' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" className="w-4 h-4 animate-spin"><circle cx="12" cy="12" r="9" strokeOpacity="0.2"/><path d="M12 3a9 9 0 019 9" strokeLinecap="round"/></svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="#52525b" className="w-4 h-4"><circle cx="10" cy="10" r="7"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{f.name}</p>
                      <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${f.pct}%`, background: f.status === 'done' ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#6d28d9,#a78bfa)' }} />
                      </div>
                    </div>
                    <span className="text-zinc-500 text-[10px] flex-shrink-0">{f.size}</span>
                  </div>
                ))}

                <div className="rounded-xl p-3 flex items-center gap-2"
                     style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <svg viewBox="0 0 20 20" fill="#a78bfa" className="w-4 h-4 flex-shrink-0"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
                  <span className="text-violet-300 text-xs font-medium">Saving to Google Drive…</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating stats */}
        <div className="absolute -bottom-4 left-4 md:left-8 glass rounded-xl px-4 py-2.5 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-xs font-semibold">24 photos uploaded</span>
        </div>
        <div className="absolute -top-4 right-4 md:right-8 glass rounded-xl px-4 py-2.5 flex items-center gap-2.5">
          <span className="text-violet-300 text-xs font-semibold">✦ Full resolution · Pro</span>
        </div>
      </div>
    </section>
  );
}

/* ── Logos ────────────────────────────────────────────────────────────────── */

function Logos() {
  return (
    <section className="py-12 px-6 border-y border-white/5">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-zinc-600 text-xs font-semibold uppercase tracking-widest mb-8">
          Photos land directly in the clouds you already use
        </p>
        <div className="flex items-center justify-center gap-10 flex-wrap">
          {[
            { name: 'Google Drive', color: '#4285F4' },
            { name: 'Microsoft OneDrive', color: '#0078D4' },
            { name: 'Dropbox', color: '#0061FE' },
          ].map(c => (
            <div key={c.name} className="flex items-center gap-2.5 opacity-50 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${c.color}20`, border: `1px solid ${c.color}30` }}>
                <div className="w-4 h-4 rounded-sm" style={{ background: c.color }} />
              </div>
              <span className="text-zinc-400 text-sm font-medium">{c.name}</span>
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
      n: '01',
      title: 'Create your event',
      desc: 'Sign up, connect your cloud storage (Google Drive, OneDrive, or Dropbox), and name your event. Takes 60 seconds.',
      icon: '📋',
    },
    {
      n: '02',
      title: 'Share the QR code',
      desc: 'Print it, display it on a screen, or text the link. No app install required for guests. If they can scan a menu, they can use Picachoo.',
      icon: '📲',
    },
    {
      n: '03',
      title: 'Guests snap & upload',
      desc: 'One tap to take a photo. It uploads directly to your cloud at full resolution — bypassing our servers entirely.',
      icon: '📸',
    },
    {
      n: '04',
      title: 'Your photos, your folder',
      desc: 'Every image lands neatly organised in a named event folder in your storage. You own it, forever.',
      icon: '☁️',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            From QR to cloud in{' '}
            <span className="grad-text">10 seconds flat</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto">
            We get out of the way and let the memories flow.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative glass rounded-2xl p-6 flex flex-col gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <span className="text-zinc-600 text-xs font-bold tracking-widest">{s.n}</span>
                <h3 className="text-white font-bold text-base mt-1">{s.title}</h3>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-zinc-700 text-lg z-10">→</div>
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
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
      ),
      title: 'Full-resolution uploads',
      desc: 'Pro hosts get raw, uncompressed originals. Every pixel captured, nothing lost to a server pipeline.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
        </svg>
      ),
      title: 'Direct-to-cloud uploads',
      desc: "Files fly straight to Google Drive or OneDrive — your guests' photos never touch our servers.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      title: 'Live photo wall',
      desc: 'Display a real-time mosaic of every photo as it lands. Perfect for big screens at weddings, conferences, and parties.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"/>
        </svg>
      ),
      title: 'QR code sharing',
      desc: 'One scannable code. No SMS campaigns, no WhatsApp groups, no chasing people. Print it and forget it.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
        </svg>
      ),
      title: 'Multi-cloud flexibility',
      desc: 'Google Drive, Microsoft OneDrive, or Dropbox — choose the storage your team already uses.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
        </svg>
      ),
      title: 'Analytics dashboard',
      desc: 'See photo counts, last upload times, and storage status across all your events at a glance.',
    },
  ];

  return (
    <section id="features" className="py-24 px-6 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600 top-0 right-0 opacity-10" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Built for{' '}
            <span className="grad-text">real events</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 group">
              <div className="icon-ring w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
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
    { color: '#1e1b4b', label: 'Sarah K.' },
    { color: '#14532d', label: 'Marcus R.' },
    { color: '#422006', label: 'Anna T.' },
    { color: '#1e3a5f', label: 'James L.' },
    { color: '#2d1b69', label: 'Priya M.' },
    { color: '#1c1917', label: 'Tom B.' },
    { color: '#0c2340', label: 'Lily C.' },
    { color: '#1a0a2e', label: 'Omar S.' },
    { color: '#0f2417', label: 'Zoe P.' },
  ];

  return (
    <section className="py-24 px-6 bg-zinc-950/50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Live photo wall</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Watch the memories{' '}
              <span className="grad-text">roll in live</span>
            </h2>
            <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
              Display a real-time photo mosaic on any screen. Every upload from every guest appears instantly — no refresh, no delay. The wall is the party.
            </p>
            <ul className="mt-6 space-y-3">
              {['Auto-populating grid updates in real time', 'Works on any screen — TV, tablet, laptop', 'Guests love seeing their photo appear live', 'Host controls display from the dashboard'].map(item => (
                <li key={item} className="flex items-start gap-3 text-zinc-400 text-sm">
                  <svg viewBox="0 0 20 20" fill="#7c3aed" className="w-5 h-5 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors">
                Try it at your next event
              </Link>
            </div>
          </div>

          {/* Wall mockup */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden glow-violet p-1"
                 style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              {photos.map((p, i) => (
                <div key={i} className="rounded-xl aspect-square relative overflow-hidden"
                     style={{ background: p.color, animationDelay: `${i * 0.15}s` }}>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <span className="block text-[9px] font-semibold text-white/60 truncate">{p.label}</span>
                  </div>
                  {i === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-xs font-semibold">9 photos · Live</span>
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
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Start free.{' '}
            <span className="grad-text">Upgrade when you're ready.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <PricingCard
            name="Standard"
            price="Free"
            description="Perfect for casual events and trying it out."
            features={[
              'Unlimited events',
              'Unlimited guests',
              'Up to 2 MB compressed upload',
              'Google Drive, OneDrive, Dropbox',
              'Live photo wall',
              'QR code sharing',
              'Photo analytics',
            ]}
            cta="Get started free"
            ctaLink="/dashboard"
            popular={false}
          />
          <PricingCard
            name="Pro"
            price="£9"
            period="/month"
            description="For professional photographers and serious hosts."
            features={[
              'Everything in Standard',
              'Full-resolution originals (25 MB+)',
              'No browser compression',
              'Priority upload queue',
              'Branded event pages',
              'Advanced analytics',
              'Priority support',
            ]}
            cta="Start Pro trial"
            ctaLink="/pricing"
            popular={true}
          />
        </div>

        <p className="text-center text-zinc-600 text-sm mt-8">
          No credit card required for Standard. Cancel Pro any time.
        </p>
      </div>
    </section>
  );
}

function PricingCard({ name, price, period, description, features, cta, ctaLink, popular }) {
  return (
    <div className={`rounded-2xl p-8 flex flex-col gap-6 relative ${popular ? 'pricing-popular' : 'glass'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white">Most popular</span>
        </div>
      )}

      <div>
        <p className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">{name}</p>
        <div className="flex items-end gap-1 mt-2">
          <span className="text-5xl font-black text-white">{price}</span>
          {period && <span className="text-zinc-500 text-base mb-2">{period}</span>}
        </div>
        <p className="text-zinc-500 text-sm mt-2">{description}</p>
      </div>

      <ul className="space-y-2.5 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-zinc-300 text-sm">
            <svg viewBox="0 0 20 20" fill={popular ? '#a78bfa' : '#52525b'} className="w-4 h-4 mt-0.5 flex-shrink-0">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link to={ctaLink}
            className={`w-full py-3.5 rounded-xl text-center font-semibold text-sm transition-all duration-200 ${
              popular
                ? 'bg-violet-600 hover:bg-violet-500 text-white glow-sm hover:scale-[1.02]'
                : 'glass text-zinc-300 hover:text-white hover:border-zinc-600'
            }`}>
        {cta}
      </Link>
    </div>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────────── */

function Testimonials() {
  const quotes = [
    {
      text: '"We had 120 guests at our wedding. Every single one uploaded photos in minutes. No app download. No excuses. Just hundreds of beautiful RAW images straight to my Drive."',
      author: 'Amara O.',
      role: 'Bride, Lagos',
    },
    {
      text: '"I\'ve run 30+ corporate events. Picachoo replaced our post-event \'email me your photos\' chase. The live wall had everyone buzzing."',
      author: 'Daniel K.',
      role: 'Events Manager',
    },
    {
      text: '"As a photographer I was sceptical about quality. Pro tier delivers full-res originals with no middleman touching my files. I\'m sold."',
      author: 'Sophie R.',
      role: 'Photographer, London',
    },
  ];

  return (
    <section className="py-24 px-6 bg-zinc-950/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Loved by hosts</p>
          <h2 className="text-4xl font-black tracking-tight">
            Real events. <span className="grad-text">Real stories.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map(q => (
            <div key={q.author} className="glass rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="#7c3aed" className="w-4 h-4"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed italic">{q.text}</p>
              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-white font-semibold text-sm">{q.author}</p>
                <p className="text-zinc-600 text-xs">{q.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600 top-0 left-1/2 -translate-x-1/2 opacity-15" />
      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
          Get out of the way<br />
          <span className="grad-text-warm">and let the memories flow.</span>
        </h2>
        <p className="mt-6 text-zinc-400 text-lg">
          Create your first event in 60 seconds. No credit card. No app store.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard"
                className="px-10 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-lg font-bold transition-all glow-violet hover:scale-[1.02] active:scale-95">
            Start for free
          </Link>
          <Link to="/pricing"
                className="px-10 py-4 rounded-2xl glass text-zinc-300 hover:text-white text-lg font-semibold transition-colors">
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
