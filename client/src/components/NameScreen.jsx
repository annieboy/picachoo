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

export default function NameScreen({ eventName, hostMessage, onConfirm }) {
  const [name, setName] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const trimmed = name.trim();
  const { deferredPrompt, isIOS, isStandalone, triggerInstall } = useInstallPrompt();
  const showBanner = !isStandalone && !dismissed && (isIOS || !!deferredPrompt);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={BG}>

      {/* Compact PWA install banner */}
      {showBanner && (
        <div className="shrink-0 mx-4 mt-3 flex items-center gap-2 rounded-2xl px-4 py-2.5"
             style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <div className="flex-1 min-w-0">
            {isIOS ? (
              <p className="text-white/80 text-xs leading-snug">
                Tap <span className="inline-flex items-center gap-0.5 font-semibold text-white">
                  <ShareIcon />{' '}Share
                </span>{' '}then <strong className="text-white">"Add to Home Screen"</strong> for the best experience.
              </p>
            ) : (
              <p className="text-white/80 text-xs leading-snug">
                <button onClick={triggerInstall} className="font-semibold text-white underline underline-offset-2">
                  Install Picachoo
                </button>{' '}for quick access without a browser.
              </p>
            )}
          </div>
          <button onClick={() => setDismissed(true)} aria-label="Dismiss"
                  className="shrink-0 text-white/40 hover:text-white/70 text-base leading-none px-1">
            ×
          </button>
        </div>
      )}

      {/* Main — vertically centred, no internal scroll */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden"
           style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

        {/* Wordmark */}
        <div className="mb-4 text-center">
          <span className="text-2xl font-black tracking-tight text-white">
            pica<span style={{ color: '#53e6d4' }}>choo</span>
          </span>
        </div>

        {/* Invitation */}
        <div className="mb-6 text-center space-y-2 w-full max-w-sm">
          <p className="text-white/60 text-xs uppercase tracking-[0.18em] font-semibold">
            You're invited to
          </p>
          <h1 className="text-white font-black leading-tight tracking-tight px-2"
              style={{ fontSize: 'clamp(1.6rem, 7vw, 2.2rem)' }}>
            {eventName || 'This Event'}
          </h1>
          {hostMessage ? (
            <div className="mt-1 mx-auto max-w-xs rounded-2xl px-4 py-3 text-center"
                 style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Message from host</p>
              <p className="text-white/90 text-sm leading-relaxed">{hostMessage}</p>
            </div>
          ) : (
            <p className="text-white/60 text-sm leading-relaxed">
              Share your photos and help capture the memories.
            </p>
          )}
        </div>

        {/* Name form */}
        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && trimmed && onConfirm(trimmed)}
            placeholder="Enter name to proceed"
            maxLength={50}
            autoFocus
            className="w-full rounded-2xl px-5 py-4 text-base text-white placeholder:text-white/40 focus:outline-none transition-all caret-white"
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

        {/* Footer */}
        <p className="mt-6 text-white/25 text-[10px] font-semibold tracking-widest uppercase">
          Photobook
        </p>
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
