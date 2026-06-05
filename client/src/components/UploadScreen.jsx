import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

const API_BASE      = import.meta.env.VITE_API_BASE ?? '';
const MAX_SIZE_MB   = 2.5;
const MAX_DIMENSION = 2048;

async function compressIfNeeded(blob, onProgress) {
  const sizeMB = blob.size / 1024 / 1024;
  if (sizeMB <= MAX_SIZE_MB) {
    return blob instanceof File ? blob : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
  }
  const file = blob instanceof File ? blob : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB, maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true, fileType: 'image/jpeg', onProgress,
  });
  return new File([compressed], compressed.name, { type: 'image/jpeg' });
}

function formatBytes(b) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${Math.round(b / 1e3)} KB`;
  return `${b} B`;
}

export default function UploadScreen({ blob, guestName, eventCode, eventName, onSuccess, onError, onRetake }) {
  const [phase,    setPhase]    = useState('init');    // init|compressing|uploading|recording|done
  const [progress, setProgress] = useState(0);
  const [label,    setLabel]    = useState('');        // step sub-label
  const [isDirect, setIsDirect] = useState(false);     // true = pro direct upload

  const abortRef   = useRef(false);
  const xhrRef     = useRef(null);
  const previewUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(previewUrl.current), []);

  useEffect(() => {
    abortRef.current = false;

    async function run() {
      // ── Step 1: check for a direct upload session (pro tier) ──────────────
      setPhase('init');
      let session = null;
      try {
        const res  = await fetch(`${API_BASE}/api/events/${eventCode}/upload-session`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ guestName, mimeType: blob.type || 'image/jpeg' }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.direct && data.uploadUrl) session = data;
        }
      } catch { /* network error — fall back */ }

      if (abortRef.current) return;

      if (session) {
        setIsDirect(true);
        await runDirect(session);
      } else {
        await runCompressed();
      }
    }

    // ── Direct upload (pro tier: Drive or OneDrive) ────────────────────────
    async function runDirect(session) {
      setPhase('uploading');
      setLabel(`${formatBytes(blob.size)} · Full quality`);

      const fileId = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable && !abortRef.current) {
            setProgress(Math.round((e.loaded / e.total) * 90));
          }
        });

        xhr.addEventListener('load', () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText || '{}');
              resolve(data.id ?? null);
            } catch { resolve(null); }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        });

        xhr.addEventListener('error',  () => { xhrRef.current = null; reject(new Error('Network error during upload')); });
        xhr.addEventListener('abort',  () => { xhrRef.current = null; reject(new Error('Upload cancelled')); });

        xhr.open('PUT', session.uploadUrl);

        // OneDrive upload sessions require Content-Range for the first (and only) chunk
        if (session.provider === 'onedrive') {
          xhr.setRequestHeader('Content-Range', `bytes 0-${blob.size - 1}/${blob.size}`);
        }
        xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg');
        xhr.send(blob);
      });

      if (abortRef.current) return;
      setProgress(95);
      setPhase('recording');
      setLabel('Saving…');

      const recRes = await fetch(`${API_BASE}/api/events/${eventCode}/record-upload`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileId, filename: session.filename, guestName }),
      });
      const recBody = await recRes.json().catch(() => ({}));
      if (!recRes.ok) throw new Error(recBody.error ?? 'Failed to save photo');

      setProgress(100);
      setPhase('done');
      setTimeout(onSuccess, 500);
    }

    // ── Compressed upload (free tier or Dropbox) ───────────────────────────
    async function runCompressed() {
      setPhase('compressing');
      setLabel('Optimising · Step 1 of 2');

      let file;
      try {
        const origMB = (blob.size / 1024 / 1024).toFixed(1);
        file = await compressIfNeeded(blob, pct => {
          if (!abortRef.current) setProgress(Math.round(pct * 0.5));
        });
        if (abortRef.current) return;
        const compMB = (file.size / 1024 / 1024).toFixed(1);
        if (parseFloat(origMB) > parseFloat(compMB)) {
          setLabel(`Compressed: ${origMB} MB → ${compMB} MB`);
        }
      } catch (err) {
        if (!abortRef.current) onError(`Compression failed: ${err.message}`);
        return;
      }

      if (abortRef.current) return;
      setPhase('uploading');
      setProgress(50);
      setLabel('Uploading · Step 2 of 2');

      let pct = 50;
      const timer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 5, 95);
        if (!abortRef.current) setProgress(Math.round(pct));
      }, 250);

      try {
        const form = new FormData();
        form.append('photo', file, file.name);
        form.append('guestName', guestName);
        const res  = await fetch(`${API_BASE}/api/events/${eventCode}/upload`, { method: 'POST', body: form });
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

    run().catch(err => { if (!abortRef.current) onError(err.message); });

    return () => {
      abortRef.current = true;
      xhrRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived render values ──────────────────────────────────────────────────

  const isCompressing = phase === 'compressing';
  const isUploading   = phase === 'uploading';
  const isRecording   = phase === 'recording';
  const isDone        = phase === 'done';
  const isInit        = phase === 'init';

  const pct = Math.round(progress);

  // Colour: amber = compressing / init; violet = uploading/recording; green = done
  const ringColor = isCompressing || isInit
    ? '#f59e0b'
    : isDone ? '#34d399' : '#7c3aed';

  const statusText =
    isInit        ? 'Preparing…'
    : isCompressing ? 'Preparing your photo…'
    : isUploading && isDirect ? 'Uploading full quality…'
    : isUploading   ? 'Uploading to cloud…'
    : isRecording   ? 'Saving…'
    : isDone        ? 'All done!'
    : '…';

  const RADIUS = 54;
  const CIRC   = 2 * Math.PI * RADIUS;
  const dash   = CIRC * (pct / 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-[#080809] px-6 gap-7">

      {eventName && (
        <p className="text-zinc-600 text-xs uppercase tracking-[0.16em] font-semibold text-center">
          {eventName}
        </p>
      )}

      {/* Circular progress + thumbnail */}
      <div className="relative flex items-center justify-center">
        <div className="w-40 h-40 rounded-full overflow-hidden ring-1 ring-white/10">
          <img src={previewUrl.current} alt="Your photo" className="w-full h-full object-cover" />
        </div>

        {!isDone && (
          <svg className="absolute -inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)]"
               viewBox="0 0 128 128" fill="none" aria-hidden="true">
            <circle cx="64" cy="64" r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            <circle cx="64" cy="64" r={RADIUS}
              stroke={ringColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`} strokeDashoffset={CIRC * 0.25}
              style={{ transition: 'stroke-dasharray 0.25s ease, stroke 0.4s ease' }}
            />
          </svg>
        )}

        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 animate-pop-in">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Percentage */}
      {!isDone && (
        <div className="text-center -mt-2">
          <p className="text-5xl font-bold tabular-nums tracking-tight"
             style={{ color: ringColor }}>
            {pct}%
          </p>
        </div>
      )}

      {/* Status + quality badge */}
      <div className="text-center space-y-1.5 -mt-2">
        <p className="text-white text-lg font-semibold">{statusText}</p>
        {label && !isDone && (
          <p className="text-zinc-600 text-xs tracking-wide">{label}</p>
        )}
        {isDirect && !isDone && (isUploading || isRecording) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
            ✦ Pro · Full resolution
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
               style={{
                 width:      `${pct}%`,
                 background: isCompressing || isInit
                   ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                   : isDone
                   ? 'linear-gradient(90deg, #059669, #34d399)'
                   : 'linear-gradient(90deg, #6d28d9, #a78bfa)',
               }} />
        </div>
      </div>

      <button onClick={onRetake}
              className="text-zinc-700 text-sm active:text-zinc-400 transition-colors">
        Cancel and retake
      </button>
    </div>
  );
}
