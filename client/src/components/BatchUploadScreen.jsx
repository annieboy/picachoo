import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

const API_BASE      = import.meta.env.VITE_API_BASE ?? '';
const MAX_SIZE_MB   = 2.5;
const MAX_DIMENSION = 2048;

async function compressIfNeeded(blob) {
  const sizeMB = blob.size / 1024 / 1024;
  const file   = blob instanceof File ? blob : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
  if (sizeMB <= MAX_SIZE_MB) return file;
  return imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB, maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true, fileType: 'image/jpeg',
  });
}

async function uploadOne(file, guestName, eventCode) {
  const compressed = await compressIfNeeded(file);
  const form = new FormData();
  form.append('photo', compressed, compressed.name);
  form.append('guestName', guestName);
  const res  = await fetch(`${API_BASE}/api/events/${eventCode}/upload`, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
}

export default function BatchUploadScreen({ files, guestName, eventCode, eventName, onSuccess, onError, onCancel }) {
  const [current,  setCurrent]  = useState(0);
  const [phase,    setPhase]    = useState('uploading'); // uploading | done
  const abortRef = useRef(false);

  const total = files.length;

  useEffect(() => {
    abortRef.current = false;

    async function run() {
      for (let i = 0; i < total; i++) {
        if (abortRef.current) return;
        setCurrent(i);
        try {
          await uploadOne(files[i], guestName, eventCode);
        } catch (err) {
          if (!abortRef.current) onError(err.message);
          return;
        }
      }
      if (!abortRef.current) {
        setPhase('done');
        setTimeout(onSuccess, 600);
      }
    }

    run();
    return () => { abortRef.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct  = phase === 'done' ? 100 : Math.round(((current) / total) * 100);
  const RADIUS = 54;
  const CIRC   = 2 * Math.PI * RADIUS;
  const dash   = CIRC * (pct / 100);
  const isDone = phase === 'done';

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-[#080809] px-6 gap-7">
      {eventName && (
        <p className="text-zinc-600 text-xs uppercase tracking-[0.16em] font-semibold text-center">
          {eventName}
        </p>
      )}

      {/* Ring */}
      <div className="relative flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-4xl font-bold text-violet-400 tabular-nums">
            {isDone ? '✓' : `${current + 1}/${total}`}
          </span>
        </div>
        {!isDone && (
          <svg className="absolute -inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)]" viewBox="0 0 128 128" fill="none" aria-hidden="true">
            <circle cx="64" cy="64" r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            <circle
              cx="64" cy="64" r={RADIUS}
              stroke="#7c3aed" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`} strokeDashoffset={CIRC * 0.25}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-white text-lg font-semibold">
          {isDone ? 'All done!' : `Uploading photo ${current + 1} of ${total}`}
        </p>
        <p className="text-zinc-600 text-xs tracking-wide">
          {isDone ? `${total} photos uploaded` : 'Please wait…'}
        </p>
      </div>

      <div className="w-full max-w-xs">
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6d28d9, #a78bfa)' }}
          />
        </div>
      </div>

      {!isDone && (
        <button onClick={onCancel} className="text-zinc-700 text-sm active:text-zinc-400 transition-colors">
          Cancel
        </button>
      )}
    </div>
  );
}
