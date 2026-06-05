import { useState } from 'react';

export default function NameScreen({ eventName, onConfirm }) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-black">

      {/* Camera emoji + wordmark */}
      <div className="mb-8 text-center space-y-3">
        <div className="text-5xl">📸</div>
        <div>
          <span className="text-3xl font-bold tracking-tight text-white">
            pica<span className="text-violet-400">choo</span>
          </span>
        </div>
      </div>

      {/* Welcoming message */}
      <div className="mb-8 text-center space-y-2">
        {eventName ? (
          <>
            <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium">
              You're invited to
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight px-4">
              {eventName}
            </h1>
            <p className="text-zinc-400 text-sm leading-snug">
              Share your photos and help capture the memories. ✨
            </p>
          </>
        ) : (
          <p className="text-zinc-300 text-base">Share your photos from today.</p>
        )}
      </div>

      {/* Name input */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-center text-zinc-300 text-sm font-medium">
          What's your name?
        </p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && trimmed && onConfirm(trimmed)}
          placeholder="e.g. Alice"
          maxLength={50}
          autoFocus
          className="
            w-full rounded-2xl border border-zinc-700 bg-zinc-900
            px-4 py-4 text-lg text-white placeholder:text-zinc-600
            focus:outline-none focus:ring-2 focus:ring-violet-500
            caret-violet-400
          "
        />
        <button
          disabled={!trimmed}
          onClick={() => onConfirm(trimmed)}
          className="
            w-full rounded-2xl py-4 text-base font-semibold
            bg-violet-500 text-white
            disabled:opacity-25 disabled:cursor-not-allowed
            active:scale-95 transition-transform duration-100
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-black
          "
        >
          Open camera →
        </button>
      </div>
    </div>
  );
}
