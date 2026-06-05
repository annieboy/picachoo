import { useEffect, useRef } from 'react';

// Colours for the confetti burst
const CONFETTI_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#f87171',
];

// Deterministic confetti pieces — position fixed at build time so rerenders
// don't scramble them mid-animation.
const PIECES = Array.from({ length: 18 }, (_, i) => ({
  left:  `${((i * 37 + 11) % 100)}%`,
  delay: `${(i * 55) % 400}ms`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size:  i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
  shape: i % 2 === 0 ? 'rounded-sm' : 'rounded-full',
}));

export default function SuccessScreen({ onSnapAnother }) {
  const headingRef = useRef(null);

  // Auto-focus so screen-readers announce the result
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full bg-black px-6 gap-8 overflow-hidden">

      {/* ── Confetti ───────────────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32">
        {PIECES.map((p, i) => (
          <span
            key={i}
            className={`absolute top-0 animate-confetti-fall ${p.shape}`}
            style={{
              left:             p.left,
              width:            p.size,
              height:           p.size,
              backgroundColor:  p.color,
              animationDelay:   p.delay,
              animationFillMode: 'both',
            }}
          />
        ))}
      </div>

      {/* ── Animated check circle ──────────────────────────────────── */}
      <div className="animate-pop-in">
        <svg viewBox="0 0 80 80" className="w-24 h-24" aria-hidden="true">
          {/* Circle */}
          <circle cx="40" cy="40" r="36" fill="none" stroke="#7c3aed" strokeWidth="4" />
          {/* Filled background */}
          <circle cx="40" cy="40" r="34" fill="#7c3aed" fillOpacity="0.15" />
          {/* Animated check */}
          <path
            className="check-path animate-draw-check"
            d="M24 41 l12 12 l20 -22"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Copy ───────────────────────────────────────────────────── */}
      <div className="text-center space-y-2 animate-pop-in" style={{ animationDelay: '0.1s' }}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-white text-3xl font-bold tracking-tight focus:outline-none"
        >
          Photo shared!
        </h1>
        <p className="text-zinc-400 text-base leading-snug">
          It's heading straight to the host's Google Drive. ✨
        </p>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <button
        onClick={onSnapAnother}
        className="
          w-full max-w-xs rounded-2xl py-4 text-lg font-semibold
          bg-violet-500 text-white
          active:scale-95 transition-transform duration-100
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-black
          animate-pop-in
        "
        style={{ animationDelay: '0.2s' }}
      >
        Snap another
      </button>
    </div>
  );
}
