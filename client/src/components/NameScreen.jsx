import { useState, useEffect } from 'react';

const BG = { background: 'linear-gradient(140deg, #6045f4 0%, #7060f6 45%, #53e6d4 100%)' };

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsIOS(ios);
    setIsStandalone(standalone);
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { deferredPrompt, isIOS, isStandalone, triggerInstall };
}

export default function NameScreen({ eventName, onConfirm }) {
  const [name, setName] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const trimmed = name.trim();
  const { deferredPrompt, isIOS, isStandalone, triggerInstall } = useInstallPrompt();
  const showBanner = !isStandalone && !dismissed && (isIOS || !!deferredPrompt);

  return (
    <div className="relative flex flex-col min-h-full overflow-hidden" style={BG}>

      {/* Highlight overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />

      {/* PWA install banner */}
      {showBanner && (
        <div className="relative z-10 mx-4 mt-4 flex items-start gap-3 rounded-2xl px-4 py-3"
             style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
          <span className="text-lg mt-0.5">📲</span>
          <div className="flex-1 min-w-0">
            {isIOS ? (
              <p className="text-white text-sm leading-snug">
                <span className="font-semibold">Add to Home Screen</span> — tap{' '}
                <span className="inline-flex items-center gap-0.5 font-semibold">Share <ShareIcon /></span>{' '}
                then "Add to Home Screen" for the best experience.
              </p>
            ) : (
              <p className="text-white text-sm leading-snug">
                <span className="font-semibold">Install Picachoo</span> for quick access without a browser.
              </p>
            )}
          </div>
          {!isIOS && deferredPrompt && (
            <button onClick={triggerInstall}
                    className="shrink-0 text-xs font-semibold text-white border border-white/40 rounded-lg px-3 py-1.5 active:scale-95 transition-transform">
              Install
            </button>
          )}
          <button onClick={() => setDismissed(true)} aria-label="Dismiss"
                  className="shrink-0 text-white/70 hover:text-white transition-colors text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">

        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-black tracking-tight text-white">
            pica<span style={{ color: '#c4b5fd' }}>choo</span>
          </span>
          <p className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">made for memorable moments</p>
        </div>

        {/* Welcome copy */}
        <div className="mb-10 text-center space-y-3 w-full max-w-sm">
          <p className="text-white/60 text-xs uppercase tracking-[0.18em] font-semibold">
            You're invited to
          </p>
          <h1 className="text-white text-3xl font-black leading-tight tracking-tight px-2">
            {eventName || 'This Event'}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Share your photos and help capture the memories.
          </p>
        </div>

        {/* Name form */}
        <div className="w-full max-w-sm space-y-3">
          <p className="text-white/70 text-sm font-medium text-center">
            What should we call you?
          </p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && trimmed && onConfirm(trimmed)}
            placeholder="Your name"
            maxLength={50}
            autoFocus
            className="w-full rounded-2xl px-5 py-4 text-lg text-white placeholder:text-white/30 focus:outline-none transition-all caret-white"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              WebkitAppearance: 'none',
            }}
          />

          <button
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
            className="w-full rounded-2xl py-4 text-base font-bold flex items-center justify-center gap-2.5 text-white transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: '#fff',
              color: '#6045f4',
              boxShadow: trimmed ? '0 6px 24px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <CameraIcon />
            Open Camera
          </button>
        </div>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 inline">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
