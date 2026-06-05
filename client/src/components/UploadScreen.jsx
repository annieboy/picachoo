import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const MAX_SIZE_MB   = 2.5;
const MAX_DIMENSION = 2048;

async function compressIfNeeded(blob, onProgress) {
  const sizeMB = blob.size / 1024 / 1024;
  if (sizeMB <= MAX_SIZE_MB) {
    return new File([blob], blob.name ?? `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
  }
  const file = blob instanceof File ? blob : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: 'image/jpeg',
    onProgress,
  });
  return new File([compressed], compressed.name, { type: 'image/jpeg' });
}

export default function UploadScreen({ blob, guestName, eventCode, eventName, onSuccess, onError, onRetake }) {
  const [phase, setPhase]       = useState('compressing');
  const [progress, setProgress] = useState(0);
  const [sizeInfo, setSizeInfo]  = useState('');
  const abortRef = useRef(false);
  const previewUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(previewUrl.current), []);

  useEffect(() => {
    abortRef.current = false;

    async function run() {
      // Phase 1: compress
      let file;
      try {
        const originalMB = (blob.size / 1024 / 1024).toFixed(1);
        file = await compressIfNeeded(blob, pct => {
          if (!abortRef.current) setProgress(Math.round(pct * 0.5));
        });
        if (abortRef.current) return;
        const compressedMB = (file.size / 1024 / 1024).toFixed(1);
        if (parseFloat(originalMB) > parseFloat(compressedMB)) {
          setSizeInfo(`${originalMB} MB → ${compressedMB} MB`);
        }
      } catch (err) {
        if (!abortRef.current) onError(`Compression failed: ${err.message}`);
        return;
      }

      // Phase 2: upload
      if (abortRef.current) return;
      setPhase('uploading');
      setProgress(50);

      let pct = 50;
      const timer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 5, 95);
        if (!abortRef.current) setProgress(Math.round(pct));
      }, 250);

      try {
        const formData = new FormData();
        formData.append('photo', file, file.name);
        formData.append('guestName', guestName);
        const res = await fetch(`${API_BASE}/api/events/${eventCode}/upload`, { method: 'POST', body: formData });
        clearInterval(timer);
        if (abortRef.current) return;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
        setProgress(100);
        setPhase('done');
        setTimeout(onSuccess, 500);
      } catch (err) {
        clearInterval(timer);
        if (!abortRef.current) onError(err.message);
      }
    }

    run();
    return () => { abortRef.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isCompressing = phase === 'compressing';
  const isDone        = phase === 'done';
  const pct           = Math.round(progress);

  const statusLabel = isCompressing ? 'Preparing your photo…'
    : isDone        ? 'All done!'
    : 'Uploading to Drive…';

  const stepLabel = sizeInfo
    ? `Compressed: ${sizeInfo}`
    : isCompressing ? 'Optimising  ·  Step 1 of 2'
    : 'Uploading  ·  Step 2 of 2';

  // SVG ring progress
  const RADIUS = 54;
  const CIRC   = 2 * Math.PI * RADIUS;
  const dash   = CIRC * (pct / 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-[#080809] px-6 gap-7">

      {/* Event label */}
      {eventName && (
        <p className="text-zinc-600 text-xs uppercase tracking-[0.16em] font-semibold text-center">
          {eventName}
        </p>
      )}

      {/* Circular progress + thumbnail */}
      <div className="relative flex items-center justify-center">
        {/* Photo thumbnail */}
        <div className="w-40 h-40 rounded-full overflow-hidden ring-1 ring-white/10">
          <img src={previewUrl.current} alt="Your photo" className="w-full h-full object-cover" />
        </div>

        {/* SVG ring */}
        {!isDone && (
          <svg
            className="absolute -inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)]"
            viewBox="0 0 128 128"
            fill="none"
            aria-hidden="true"
          >
            {/* Track */}
            <circle cx="64" cy="64" r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            {/* Progress arc */}
            <circle
              cx="64" cy="64" r={RADIUS}
              stroke={isCompressing ? '#f59e0b' : '#7c3aed'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={CIRC * 0.25}
              style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.4s ease' }}
            />
          </svg>
        )}

        {/* Done check */}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 animate-pop-in">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Big percentage */}
      {!isDone && (
        <div className="text-center -mt-2">
          <p
            className="text-5xl font-bold tabular-nums tracking-tight"
            style={{ color: isCompressing ? '#f59e0b' : '#a78bfa' }}
          >
            {pct}%
          </p>
        </div>
      )}

      {/* Status text */}
      <div className="text-center space-y-1 -mt-2">
        <p className="text-white text-lg font-semibold">{statusLabel}</p>
        <p className="text-zinc-600 text-xs tracking-wide">{stepLabel}</p>
      </div>

      {/* Linear bar */}
      <div className="w-full max-w-xs">
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: isCompressing
                ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                : 'linear-gradient(90deg, #6d28d9, #a78bfa)',
            }}
          />
        </div>
      </div>

      {/* Cancel */}
      <button
        onClick={onRetake}
        className="text-zinc-700 text-sm active:text-zinc-400 transition-colors"
      >
        Cancel and retake
      </button>
    </div>
  );
}
