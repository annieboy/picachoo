import { Link } from 'react-router-dom';
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
      <Testimonials />
      <FinalCTA />
    </MarketingLayout>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="bezl-hero relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-6 overflow-hidden">
      {/* Badge */}
      <div className="anim-fade-up relative z-10 mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          No app install · Instant photo sharing
        </span>
      </div>

      {/* Headline */}
      <h1 className="anim-fade-up anim-delay-1 relative z-10 text-center text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05] max-w-4xl">
        Your memories,<br />
        straight to your cloud.
      </h1>

      <p className="anim-fade-up anim-delay-2 relative z-10 mt-6 text-center text-white/75 text-lg md:text-xl max-w-2xl leading-relaxed">
        Guests scan a QR code, snap a photo, and it lands directly in your Google Drive, OneDrive, or Dropbox — in full resolution. No app. No account. No friction.
      </p>

      {/* CTAs */}
      <div className="anim-fade-up anim-delay-3 relative z-10 mt-10 flex flex-col sm:flex-row gap-3 items-center">
        <Link to="/dashboard" className="btn-white px-8 py-4 text-base">
          Create a free event
        </Link>
        <a href="#how-it-works" className="btn-outline-white px-8 py-4 text-base flex items-center gap-2">
          See how it works
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd"/>
          </svg>
        </a>
      </div>

      {/* Hero mockup */}
      <div className="anim-fade-up anim-delay-4 relative z-10 mt-16 w-full max-w-3xl px-4">
        <div className="rounded-3xl overflow-hidden bg-white/10 border border-white/20 backdrop-blur-sm p-6 md:p-10">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 mb-6">
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
            {/* Camera UI mock */}
            <div className="rounded-2xl bg-white/10 border border-white/15 p-6 flex flex-col items-center justify-center gap-4 aspect-square">
              <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-10 h-10 opacity-80">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">Tap to take photo</p>
              <p className="text-white/50 text-xs">Or upload from gallery</p>
            </div>

            {/* Upload progress mock */}
            <div className="flex flex-col gap-3">
              {[
                { name: 'Sarah_ceremony.jpg', size: '4.2 MB', pct: 100, done: true },
                { name: 'Mike_reception.jpg', size: '3.8 MB', pct: 67, done: false },
                { name: 'Anna_dance.jpg',     size: '5.1 MB', pct: 0,  done: false, queued: true },
              ].map(f => (
                <div key={f.name} className="rounded-xl bg-white/10 border border-white/15 p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${f.done ? 'bg-emerald-400/20' : f.queued ? 'bg-white/10' : 'bg-white/15'}`}>
                    {f.done ? (
                      <svg viewBox="0 0 20 20" fill="#34d399" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : f.queued ? (
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4 animate-spin opacity-70"><circle cx="12" cy="12" r="9" strokeOpacity="0.2"/><path d="M12 3a9 9 0 019 9" strokeLinecap="round"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{f.name}</p>
                    <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                           style={{ width: `${f.pct}%`, background: f.done ? '#34d399' : 'rgba(255,255,255,0.7)' }} />
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

        {/* Floating badges */}
        <div className="absolute -bottom-4 left-4 md:left-8 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-800 text-xs font-semibold">24 photos uploaded</span>
        </div>
        <div className="absolute -top-4 right-4 md:right-8 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
          <span className="text-xs font-semibold" style={{ color: '#6B5CE7' }}>✦ Full resolution · Pro</span>
        </div>
      </div>

      {/* White wave bottom */}
      <div className="wave-bottom" />
    </section>
  );
}

/* ── Logos ─────────────────────────────────────────────────────────────────── */
function Logos() {
  return (
    <section className="py-14 px-6 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-gray-400 text-xs font-semibold uppercase tracking-widest mb-8">
          Photos land directly in the clouds you already use
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
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-4">Simple by design</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            From QR to cloud in{' '}
            <span className="grad-text">10 seconds flat</span>
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
            We get out of the way and let the memories flow.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className="relative feature-card p-6 flex flex-col gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <span className="text-gray-300 text-xs font-bold tracking-widest">{s.n}</span>
                <h3 className="text-gray-900 font-bold text-base mt-1">{s.title}</h3>
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
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-4">Everything you need</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Built for{' '}
            <span className="grad-text">real events</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="feature-card p-6 flex flex-col gap-4">
              <div className="icon-badge w-11 h-11 flex items-center justify-center text-xl">
                {f.icon}
              </div>
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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-4">Live photo wall</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Watch the memories{' '}
              <span className="grad-text">roll in live</span>
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">
              Display a real-time photo mosaic on any screen. Every upload appears instantly — no refresh, no delay.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Auto-populating grid updates in real time',
                'Works on any screen — TV, tablet, laptop',
                'Guests love seeing their photo appear live',
                'Host controls display from the dashboard',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                  <svg viewBox="0 0 20 20" fill="#6B5CE7" className="w-5 h-5 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/dashboard" className="btn-purple px-7 py-3.5 inline-block text-sm">
                Try it at your next event
              </Link>
            </div>
          </div>

          {/* Wall mockup */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden p-3 bg-gray-50 border border-gray-100 shadow-lg">
              {photos.map((p, i) => (
                <div key={i} className="rounded-xl aspect-square relative overflow-hidden flex items-end"
                     style={{ background: p.color }}>
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
    <section id="pricing" className="py-24 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Start free.{' '}
            <span className="grad-text">Upgrade when ready.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="pricing-free p-8 flex flex-col gap-5">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Standard</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-5xl font-black text-gray-900">Free</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">For individuals and casual events.</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['Unlimited events & guests', 'Up to 2 MB compressed upload', 'Google Drive, OneDrive, Dropbox', 'Live photo wall', 'QR code sharing', 'Photo analytics'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <svg viewBox="0 0 20 20" fill="#6B5CE7" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="w-full py-3.5 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-sm text-center hover:border-violet-300 hover:text-violet-600 transition-colors">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="pricing-pro p-8 flex flex-col gap-5">
            <div className="inline-flex self-start">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white">Most popular</span>
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Pro</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-5xl font-black text-white">£9</span>
                <span className="text-white/60 text-base mb-2">/mo</span>
              </div>
              <p className="text-white/70 text-sm mt-2">For photographers and professional hosts.</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['Everything in Standard', 'Full-resolution originals (25 MB+)', 'No browser compression', 'Branded event pages', 'Priority upload queue', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-white text-sm">
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4 flex-shrink-0 opacity-80"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="btn-white w-full py-3.5 text-center text-sm">
              Start 14-day trial
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">No credit card required for Standard. Cancel Pro any time.</p>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────────── */
function Testimonials() {
  const quotes = [
    { text: '"We had 120 guests at our wedding. Every single one uploaded photos in minutes. No app download. Hundreds of beautiful originals straight to Drive."', author: 'Amara O.', role: 'Bride, Lagos' },
    { text: '"I\'ve run 30+ corporate events. Picachoo replaced our post-event \'email me your photos\' chase. The live wall had everyone buzzing."', author: 'Daniel K.', role: 'Events Manager' },
    { text: '"As a photographer I was sceptical about quality. Pro tier delivers full-res originals with no middleman touching my files. I\'m sold."', author: 'Sophie R.', role: 'Photographer, London' },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-grad text-xs font-semibold px-3 py-1.5 inline-block mb-4">Loved by hosts</span>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            Real events. <span className="grad-text">Real stories.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map(q => (
            <div key={q.author} className="testi-card p-6 flex flex-col gap-5">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="#6B5CE7" className="w-4 h-4 opacity-80"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic">{q.text}</p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <p className="text-gray-900 font-semibold text-sm">{q.author}</p>
                <p className="text-gray-400 text-xs">{q.role}</p>
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
    <section className="bezl-hero relative py-28 px-6 overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Get out of the way<br />and let the memories flow.
        </h2>
        <p className="mt-6 text-white/70 text-lg">
          Create your first event in 60 seconds. No credit card. No app store.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
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
