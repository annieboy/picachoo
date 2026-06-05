import { useState, useEffect } from 'react';

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
    <div className="relative flex flex-col min-h-full bg-[#080809] overflow-hidden">

      {/* Subtle radial glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      {/* ── PWA install banner ── */}
      {showBanner && (
        <div className="relative z-10 mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
          <span className="text-lg mt-0.5">📲</span>
          <div className="flex-1 min-w-0">
            {isIOS ? (
              <p className="text-violet-300 text-sm leading-snug">
                <span className="font-semibold">Add to Home Screen</span> — tap{' '}
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  Share <ShareIcon />
                </span>{' '}
                then "Add to Home Screen" for the best experience.
              </p>
            ) : (
              <p className="text-violet-300 text-sm leading-snug">
                <span className="font-semibold">Install EventSnap</span> for quick access without a browser.
              </p>
            )}
          </div>
          {!isIOS && deferredPrompt && (
            <button
              onClick={triggerInstall}
              className="shrink-0 text-xs font-semibold text-violet-300 border border-violet-500/40 rounded-lg px-3 py-1.5 active:scale-95 transition-transform"
            >
              Install
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 text-violet-500 hover:text-violet-300 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main card ── */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">

        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold tracking-tight text-white">
            pica<span className="text-violet-400">choo</span>
          </span>
        </div>

        {/* Welcome copy */}
        <div className="mb-10 text-center space-y-3 w-full max-w-sm">
          <p className="text-zinc-500 text-xs uppercase tracking-[0.18em] font-semibold">
            You're invited to
          </p>
          <h1 className="text-white text-3xl font-bold leading-tight tracking-tight px-2">
            {eventName || 'This Event'}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Share your photos and help capture the memories.
          </p>
        </div>

        {/* Name form */}
        <div className="w-full max-w-sm space-y-3">
          <p className="text-zinc-400 text-sm font-medium text-center">
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
            className="
              w-full rounded-2xl border border-white/8 bg-white/5
              px-5 py-4 text-lg text-white placeholder:text-zinc-600
              focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/40
              caret-violet-400 transition-all
            "
            style={{ WebkitAppearance: 'none' }}
          />

          {/* CTA button with camera icon */}
          <button
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
            className="
              w-full rounded-2xl py-4 text-base font-semibold
              flex items-center justify-center gap-2.5
              text-white transition-all duration-150
              disabled:opacity-25 disabled:cursor-not-allowed
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:ring-offset-2 focus:ring-offset-[#080809]
            "
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              boxShadow: trimmed ? '0 6px 24px rgba(109,40,217,0.4)' : 'none',
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
