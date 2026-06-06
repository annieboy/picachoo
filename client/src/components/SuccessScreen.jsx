import { useEffect, useRef, useState } from 'react';

const CONFETTI_COLORS = ['#fff', '#c4b5fd', '#a5f3fc', '#fbbf24', '#f472b6', '#34d399'];
const PIECES = Array.from({ length: 18 }, (_, i) => ({
  left:  `${((i * 37 + 11) % 100)}%`,
  delay: `${(i * 55) % 400}ms`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size:  i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
  shape: i % 2 === 0 ? 'rounded-sm' : 'rounded-full',
}));

const BG = { background: 'linear-gradient(140deg, #6045f4 0%, #7060f6 45%, #53e6d4 100%)' };

// Save blob to device gallery.
// iOS Safari: Web Share API → native share sheet → "Save to Photos"
// Android / desktop: <a download> → Downloads folder
async function saveToGallery(blob) {
  const isVideo = blob.type?.startsWith('video/');
  const ext  = isVideo ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
  const name = `picachoo-${Date.now()}.${ext}`;
  const file = new File([blob], name, { type: blob.type });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: name });
    return;
  }

  const url = URL.createObjectURL(file);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default function SuccessScreen({ eventName, blob, onSnapAnother }) {
  const headingRef = useRef(null);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handleSave() {
    if (!blob || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      await saveToGallery(blob);
      setSaveState('saved');
    } catch (err) {
      // AbortError = user dismissed share sheet — treat as cancel, not error
      setSaveState(err.name === 'AbortError' ? 'idle' : 'error');
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full px-6 gap-8 overflow-hidden" style={BG}>

      {/* Highlight */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />

      {/* Confetti */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32">
        {PIECES.map((p, i) => (
          <span key={i}
                className={`absolute top-0 animate-confetti-fall ${p.shape}`}
                style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, animationDelay: p.delay, animationFillMode: 'both' }} />
        ))}
      </div>

      {/* Check circle */}
      <div className="animate-pop-in relative z-10">
        <svg viewBox="0 0 80 80" className="w-24 h-24" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" />
          <circle cx="40" cy="40" r="34" fill="rgba(255,255,255,0.15)" />
          <path className="check-path animate-draw-check" d="M24 41 l12 12 l20 -22"
                fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Copy */}
      <div className="text-center space-y-2 animate-pop-in relative z-10" style={{ animationDelay: '0.1s' }}>
        <h1 ref={headingRef} tabIndex={-1}
            className="text-white text-3xl font-black tracking-tight focus:outline-none">
          Photo shared!
        </h1>
        <p className="text-white/70 text-base leading-snug">
          {eventName
            ? <>Saved to <span className="text-white font-semibold">{eventName}</span> ✨</>
            : "It's heading straight to the host's cloud. ✨"
          }
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 animate-pop-in relative z-10 w-full max-w-xs" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={onSnapAnother}
          className="w-full rounded-2xl py-4 text-lg font-bold active:scale-95 transition-transform duration-100 focus:outline-none"
          style={{ background: '#fff', color: '#6045f4', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}
        >
          Take another photo
        </button>

        {blob && (
          <button
            onClick={handleSave}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className="w-full rounded-2xl py-3.5 text-base font-semibold active:scale-95 transition-transform duration-100 focus:outline-none disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
          >
            {saveState === 'saving' ? 'Saving…'
              : saveState === 'saved' ? 'Saved to gallery ✓'
              : saveState === 'error' ? 'Could not save — tap to retry'
              : 'Save to my gallery'}
          </button>
        )}

      </div>
    </div>
  );
}
