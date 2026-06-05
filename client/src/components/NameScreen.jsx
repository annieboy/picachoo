import { useState } from 'react';

export default function NameScreen({ eventName, onConfirm }) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-black">
      {/* Wordmark */}
      <div className="mb-10 text-center">
        <span className="text-4xl font-bold tracking-tight text-white">
          pica<span className="text-violet-400">choo</span>
        </span>
        {eventName && (
          <p className="mt-2 text-sm text-zinc-400 truncate max-w-xs">{eventName}</p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-zinc-300 text-base leading-snug">
          What should we put on your photos?
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
            w-full rounded-2xl border border-zinc-700 bg-zinc-900
            px-4 py-4 text-lg text-white placeholder:text-zinc-500
            focus:outline-none focus:ring-2 focus:ring-violet-500
            caret-violet-400
          "
        />

        <button
          disabled={!trimmed}
          onClick={() => onConfirm(trimmed)}
          className="
            w-full rounded-2xl py-4 text-lg font-semibold
            bg-violet-500 text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            active:scale-95 transition-transform duration-100
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-black
          "
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}
