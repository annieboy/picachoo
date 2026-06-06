import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

const API_BASE      = import.meta.env.VITE_API_BASE ?? '';
const MAX_SIZE_MB   = 2.0;
const MAX_DIMENSION = 2048;

// Web-safe image types the server accepts natively — everything else gets
// re-encoded to JPEG (covers HEIC/HEIF from iPhone gallery, BMP, TIFF, etc.)
const NATIVE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function withRetry(fn, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try { return await fn(); } catch (err) {
      lastErr = err;
      const status = err.status ?? err?.response?.status;
      if (status && status >= 400 && status < 500) throw err;
      if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw lastErr;
}

async function compress(blob) {
  const file = blob instanceof File
    ? blob
    : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });

  const needsConvert = !NATIVE_TYPES.has(file.type);
  const needsResize  = file.size / 1024 / 1024 > MAX_SIZE_MB;

  // Skip compression only if already a small native-type image
  if (!needsConvert && !needsResize) return file;

  try {
    const out = await imageCompression(file, {
      maxSizeMB: MAX_SIZE_MB, maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true, fileType: 'image/jpeg',
    });
    return new File([out], out.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    // Compression failed (e.g. unsupported format on some browsers) — return original
    // and let the server handle it or reject it with a clear error
    return file;
  }
}

// Upload one file using whichever path the server indicates
async function uploadOne(file, guestName, eventCode, hostTier) {
  // Get a direct upload session
  let session = null;
  try {
    session = await withRetry(async () => {
      const res = await fetch(`${API_BASE}/api/events/${eventCode}/upload-session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guestName, mimeType: file.type || 'image/jpeg' }),
      });
      if (!res.ok) { const e = new Error('session'); e.status = res.status; throw e; }
      const data = await res.json().catch(() => ({}));
      return (data?.direct && data.uploadUrl) ? data : null;
    });
  } catch { /* fall through to server-side */ }

  if (session) {
    // Use server-resolved effective tier (pass + subscription checked server-side)
    const effectiveTier = session.hostTier ?? hostTier;
    const payload = effectiveTier === 'pro' ? file : await compress(file);
    const headers = { 'Content-Type': payload.type || 'image/jpeg' };
    if (session.provider === 'onedrive') {
      headers['Content-Range'] = `bytes 0-${payload.size - 1}/${payload.size}`;
    }

    const res = await withRetry(() => fetch(session.uploadUrl, { method: 'PUT', headers, body: payload }));
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = await res.json().catch(() => ({}));

    const recRes = await fetch(`${API_BASE}/api/events/${eventCode}/record-upload`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId: data.id, filename: session.filename, guestName }),
    });
    if (!recRes.ok) {
      const b = await recRes.json().catch(() => ({}));
      throw new Error(b.error ?? 'Failed to save photo');
    }
  } else {
    // Server-side path (Dropbox)
    const payload = await compress(file);
    const form    = new FormData();
    form.append('photo', payload, payload.name);
    form.append('guestName', guestName);
    const res = await withRetry(() =>
      fetch(`${API_BASE}/api/events/${eventCode}/upload`, { method: 'POST', body: form })
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
  }
}

export default function BatchUploadScreen({
  files, guestName, eventCode, eventName,
  hostTier = 'free',
  onSuccess, onError, onCancel,
}) {
  const [current,  setCurrent]  = useState(0);
  const [failed,   setFailed]   = useState(0);
  const [phase,    setPhase]    = useState('uploading'); // uploading | done
  const abortRef = useRef(false);
  const total    = files.length;

  useEffect(() => {
    abortRef.current = false;
    let failCount = 0;

    async function run() {
      for (let i = 0; i < total; i++) {
        if (abortRef.current) return;
        setCurrent(i + 1);
        try {
          await uploadOne(files[i], guestName, eventCode, hostTier);
        } catch {
          // One bad file doesn't kill the batch — count it and move on
          failCount++;
          setFailed(failCount);
        }
      }
      if (!abortRef.current) {
        if (failCount === total) {
          // Every single file failed — surface as an error
          onError(`All ${total} uploads failed. Check your connection and try again.`);
        } else {
          setPhase('done');
          setTimeout(onSuccess, 600);
        }
      }
    }

    run().catch(err => { if (!abortRef.current) onError(err.message); });
    return () => { abortRef.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = phase === 'done';
  const pct    = isDone ? 100 : Math.round(((current - 1) / total) * 100);
  const RADIUS = 54;
  const CIRC   = 2 * Math.PI * RADIUS;
  const dash   = CIRC * (pct / 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 gap-7"
         style={{ background: 'linear-gradient(140deg, #6045f4 0%, #7060f6 45%, #53e6d4 100%)' }}>

      {eventName && (
        <p className="text-white/60 text-xs uppercase tracking-[0.16em] font-semibold text-center">
          {eventName}
        </p>
      )}

      <div className="relative flex items-center justify-center">
        <div className="w-40 h-40 rounded-full flex items-center justify-center"
             style={{ background: 'rgba(255,255,255,0.15)' }}>
          <span className="text-4xl font-black text-white tabular-nums">
            {isDone ? '✓' : `${current}/${total}`}
          </span>
        </div>
        {!isDone && (
          <svg className="absolute -inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)]"
               viewBox="0 0 128 128" fill="none" aria-hidden="true">
            <circle cx="64" cy="64" r={RADIUS} stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle cx="64" cy="64" r={RADIUS}
              stroke="#fff" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`} strokeDashoffset={CIRC * 0.25}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
        )}
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-white text-lg font-bold">
          {isDone ? (failed > 0 ? 'Mostly done!' : 'All done!') : `Uploading photo ${current} of ${total}`}
        </p>
        <p className="text-white/60 text-xs tracking-wide">
          {isDone
            ? failed > 0
              ? `${total - failed} uploaded · ${failed} couldn't be sent`
              : `${total} photos uploaded`
            : 'Please wait…'}
        </p>
        {!isDone && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
            {hostTier === 'pro' ? '✦ Pro · Full resolution' : '◆ Standard quality'}
          </span>
        )}
      </div>

      <div className="w-full max-w-xs">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${pct}%`, background: '#fff' }} />
        </div>
      </div>

      {!isDone && (
        <button onClick={onCancel} className="text-white/50 text-sm active:text-white transition-colors">
          Cancel
        </button>
      )}
    </div>
  );
}
