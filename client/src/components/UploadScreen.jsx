import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const MAX_SIZE_MB = 2.5;   // well under Vercel's 4.5 MB body limit
const MAX_DIMENSION = 2048; // px — preserves plenty of detail for photos

/**
 * Compresses a Blob/File to under MAX_SIZE_MB.
 * - If the file is already small enough, returns it unchanged.
 * - Uses browser-image-compression which does all work on a canvas worker
 *   thread so the UI stays responsive.
 * Returns a File so it carries a sensible filename into FormData.
 */
async function compressIfNeeded(blob, onProgress) {
  const sizeMB = blob.size / 1024 / 1024;

  if (sizeMB <= MAX_SIZE_MB) {
    // Already small enough — still normalise to a File with a clean name
    return new File(
      [blob],
      blob.name ?? `photo_${Date.now()}.jpg`,
      { type: blob.type || 'image/jpeg' },
    );
  }

  const compressed = await imageCompression(
    // imageCompression requires a File, not a bare Blob
    blob instanceof File ? blob : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' }),
    {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      fileType: 'image/jpeg',
      onProgress,           // 0-100, called during compression
    },
  );

  return new File([compressed], compressed.name, { type: 'image/jpeg' });
}

export default function UploadScreen({ blob, guestName, eventCode, onSuccess, onError, onRetake }) {
  // phase: 'compressing' | 'uploading' | 'done'
  const [phase, setPhase]       = useState('compressing');
  const [progress, setProgress] = useState(0);
  const [sizeInfo, setSizeInfo]  = useState('');
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    async function run() {
      // ── Phase 1: compress ──────────────────────────────────────────────────
      let file;
      try {
        const originalMB = (blob.size / 1024 / 1024).toFixed(1);
        file = await compressIfNeeded(blob, pct => {
          if (!abortRef.current) setProgress(Math.round(pct * 0.5)); // compress = 0-50%
        });
        if (abortRef.current) return;

        const compressedMB = (file.size / 1024 / 1024).toFixed(1);
        // Only show size info if we actually compressed
        if (parseFloat(originalMB) > parseFloat(compressedMB)) {
          setSizeInfo(`${originalMB} MB → ${compressedMB} MB`);
        }
      } catch (err) {
        if (!abortRef.current) onError(`Compression failed: ${err.message}`);
        return;
      }

      // ── Phase 2: upload ────────────────────────────────────────────────────
      if (abortRef.current) return;
      setPhase('uploading');
      setProgress(50);

      // Fake-smooth the remaining 50-95% while the fetch is in-flight
      let pct = 50;
      const timer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 5, 95);
        if (!abortRef.current) setProgress(Math.round(pct));
      }, 250);

      try {
        const formData = new FormData();
        formData.append('photo', file, file.name);
        formData.append('guestName', guestName);

        const res = await fetch(`${API_BASE}/api/events/${eventCode}/upload`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(timer);
        if (abortRef.current) return;

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);

        setProgress(100);
        setPhase('done');
        setTimeout(onSuccess, 350);
      } catch (err) {
        clearInterval(timer);
        if (!abortRef.current) onError(err.message);
      }
    }

    run();
    return () => { abortRef.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Thumbnail preview — created once, revoked on unmount
  const previewUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(previewUrl.current), []);

  const statusLabel =
    phase === 'compressing' ? 'Preparing photo…' :
    phase === 'uploading'   ? 'Uploading…'        :
                              'Almost there…';

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-black px-6 gap-8">

      {/* Thumbnail */}
      <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={previewUrl.current}
          alt="Your photo"
          className="w-full h-full object-cover"
        />
        {phase !== 'done' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <SpinnerRing />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="text-center space-y-1">
        <p className="text-white text-lg font-semibold">{statusLabel}</p>
        <p className="text-zinc-400 text-sm">
          {sizeInfo || `${Math.round(progress)}%`}
        </p>
      </div>

      {/* Progress bar — two-phase colour */}
      <div className="w-full max-w-xs h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            phase === 'compressing' ? 'bg-amber-400' : 'bg-violet-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase label */}
      <p className="text-zinc-600 text-xs tracking-wide uppercase">
        {phase === 'compressing' ? 'Step 1 of 2 — Optimising' : 'Step 2 of 2 — Sending'}
      </p>

      {/* Cancel */}
      <button
        onClick={onRetake}
        className="text-zinc-500 text-sm underline underline-offset-2 active:text-zinc-300"
      >
        Cancel and retake
      </button>
    </div>
  );
}

function SpinnerRing() {
  return (
    <svg className="w-12 h-12 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
