import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

const API_BASE      = import.meta.env.VITE_API_BASE ?? '';
const MAX_SIZE_MB   = 2.5;
const MAX_DIMENSION = 2048;

async function compress(blob, onProgress) {
  const file = blob instanceof File
    ? blob
    : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });

  if (file.size / 1024 / 1024 <= MAX_SIZE_MB) return file;

  const out = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB, maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true, fileType: 'image/jpeg', onProgress,
  });
  return new File([out], out.name, { type: 'image/jpeg' });
}

function formatBytes(b) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${Math.round(b / 1e3)} KB`;
}

// XHR PUT with real upload progress; returns parsed JSON response body
function xhrPut(url, blob, headers = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText || '{}'));
      } else {
        reject(Object.assign(new Error(`Upload failed (${xhr.status})`), { xhr }));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.open('PUT', url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.send(blob);
    return xhr; // returned for abort (but we can't use it from here — see xhrRef pattern)
  });
}

export default function UploadScreen({
  blob, guestName, eventCode, eventName,
  hostTier = 'free',   // 'free' | 'pro' — controls whether to compress
  onSuccess, onError, onRetake,
}) {
  const [phase,    setPhase]    = useState('init');
  const [progress, setProgress] = useState(0);
  const [subLabel, setSubLabel] = useState('');
  const [isDirect, setIsDirect] = useState(false);

  const abortRef   = useRef(false);
  const xhrRef     = useRef(null);
  const previewUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(previewUrl.current), []);

  useEffect(() => {
    abortRef.current = false;

    async function run() {
      // ── 1. Get a direct upload session from the server ─────────────────
      // Drive & OneDrive always return a session; Dropbox returns direct:false.
      setPhase('init');

      let session = null;
      try {
        const res = await fetch(`${API_BASE}/api/events/${eventCode}/upload-session`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ guestName, mimeType: blob.type || 'image/jpeg' }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.direct && data.uploadUrl) session = data;
        }
      } catch { /* network hiccup — fall through to server-side path */ }

      if (abortRef.current) return;

      if (session) {
        setIsDirect(true);
        // Use server-resolved effective tier (pass + subscription checked server-side)
        await runDirect(session, session.hostTier ?? hostTier);
      } else {
        await runServerSide();
      }
    }

    // ── Direct-to-cloud path (Drive + OneDrive) ──────────────────────────
    // Free: compress first (quality tier)  |  Pro: raw original
    async function runDirect(session, resolvedTier) {
      const isPro = resolvedTier === 'pro';
      let payload = blob; // start with original

      if (!isPro) {
        // Free tier — compress in browser before sending
        setPhase('compressing');
        setSubLabel('Optimising quality…');
        try {
          const origMB = (blob.size / 1024 / 1024).toFixed(1);
          payload = await compress(blob, pct => {
            if (!abortRef.current) setProgress(Math.round(pct * 0.3)); // 0–30%
          });
          if (abortRef.current) return;
          const compMB = (payload.size / 1024 / 1024).toFixed(1);
          if (parseFloat(origMB) > parseFloat(compMB)) {
            setSubLabel(`${origMB} MB → ${compMB} MB`);
          }
        } catch (err) {
          if (!abortRef.current) onError(`Compression failed: ${err.message}`);
          return;
        }
      }

      if (abortRef.current) return;

      // Upload directly to Drive / OneDrive
      setPhase('uploading');
      setSubLabel(isPro
        ? `${formatBytes(blob.size)} · Full quality`
        : `${formatBytes(payload.size)} · Standard quality`,
      );

      const headers = { 'Content-Type': payload.type || 'image/jpeg' };
      if (session.provider === 'onedrive') {
        // OneDrive upload sessions require Content-Range for the PUT
        headers['Content-Range'] = `bytes 0-${payload.size - 1}/${payload.size}`;
      }

      let responseData;
      try {
        const startPct = isPro ? 0 : 30; // account for compression phase
        responseData = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable && !abortRef.current) {
              const raw = (e.loaded / e.total) * (isPro ? 90 : 60);
              setProgress(startPct + Math.round(raw));
            }
          });

          xhr.addEventListener('load', () => {
            xhrRef.current = null;
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText || '{}'));
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          });
          xhr.addEventListener('error', () => { xhrRef.current = null; reject(new Error('Network error')); });
          xhr.addEventListener('abort', () => { xhrRef.current = null; reject(new Error('Upload cancelled')); });

          xhr.open('PUT', session.uploadUrl);
          Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
          xhr.send(payload);
        });
      } catch (err) {
        if (!abortRef.current) onError(err.message);
        return;
      }

      if (abortRef.current) return;

      // Finalise: make public + write photos row
      setPhase('recording');
      setSubLabel('Saving…');
      setProgress(95);

      const fileId = responseData?.id;
      const recRes = await fetch(`${API_BASE}/api/events/${eventCode}/record-upload`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileId, filename: session.filename, guestName }),
      });
      const recBody = await recRes.json().catch(() => ({}));
      if (!recRes.ok) {
        if (!abortRef.current) onError(recBody.error ?? 'Failed to save photo');
        return;
      }

      setProgress(100);
      setPhase('done');
      setTimeout(onSuccess, 500);
    }

    // ── Server-side path (Dropbox, or session failure fallback) ──────────
    async function runServerSide() {
      setPhase('compressing');
      setSubLabel('Optimising · Step 1 of 2');

      let file;
      try {
        const origMB = (blob.size / 1024 / 1024).toFixed(1);
        file = await compress(blob, pct => {
          if (!abortRef.current) setProgress(Math.round(pct * 0.5));
        });
        if (abortRef.current) return;
        const compMB = (file.size / 1024 / 1024).toFixed(1);
        if (parseFloat(origMB) > parseFloat(compMB)) {
          setSubLabel(`Compressed: ${origMB} MB → ${compMB} MB`);
        }
      } catch (err) {
        if (!abortRef.current) onError(`Compression failed: ${err.message}`);
        return;
      }

      if (abortRef.current) return;
      setPhase('uploading');
      setProgress(50);
      setSubLabel('Uploading · Step 2 of 2');

      // Fake progress ticker (FormData upload has no progress events via fetch)
      let pct = 50;
      const ticker = setInterval(() => {
        pct = Math.min(pct + Math.random() * 5, 95);
        if (!abortRef.current) setProgress(Math.round(pct));
      }, 250);

      try {
        const form = new FormData();
        form.append('photo', file, file.name);
        form.append('guestName', guestName);
        const res  = await fetch(`${API_BASE}/api/events/${eventCode}/upload`, { method: 'POST', body: form });
        clearInterval(ticker);
        if (abortRef.current) return;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
        setProgress(100);
        setPhase('done');
        setTimeout(onSuccess, 500);
      } catch (err) {
        clearInterval(ticker);
        if (!abortRef.current) onError(err.message);
      }
    }

    run().catch(err => { if (!abortRef.current) onError(err.message); });

    return () => {
      abortRef.current = true;
      xhrRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────

  const isCompressing = phase === 'compressing';
  const isDone        = phase === 'done';
  const isWarm        = phase === 'uploading' || phase === 'recording';
  const pct           = Math.round(progress);

  const ringColor = isCompressing || phase === 'init'
    ? '#f59e0b'
    : isDone ? '#34d399' : '#7c3aed';

  const statusText =
    phase === 'init'        ? 'Preparing…'
    : isCompressing          ? 'Preparing your photo…'
    : phase === 'uploading'  ? 'Uploading…'
    : phase === 'recording'  ? 'Saving…'
    : isDone                 ? 'All done!'
    : '…';

  const RADIUS = 54;
  const CIRC   = 2 * Math.PI * RADIUS;
  const dash   = CIRC * (pct / 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 gap-7"
         style={{ background: 'linear-gradient(140deg, #5B52E8 0%, #7B65EE 45%, #29BFBF 100%)' }}>

      {eventName && (
        <p className="text-white/60 text-xs uppercase tracking-[0.16em] font-semibold text-center">
          {eventName}
        </p>
      )}

      {/* Ring + thumbnail */}
      <div className="relative flex items-center justify-center">
        <div className="w-40 h-40 rounded-full overflow-hidden ring-2 ring-white/20">
          <img src={previewUrl.current} alt="Your photo" className="w-full h-full object-cover" />
        </div>

        {!isDone && (
          <svg className="absolute -inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)]"
               viewBox="0 0 128 128" fill="none" aria-hidden="true">
            <circle cx="64" cy="64" r={RADIUS} stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle cx="64" cy="64" r={RADIUS}
              stroke="#fff" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`} strokeDashoffset={CIRC * 0.25}
              style={{ transition: 'stroke-dasharray 0.25s ease' }}
            />
          </svg>
        )}

        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 animate-pop-in">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Percentage */}
      {!isDone && (
        <p className="text-5xl font-black tabular-nums tracking-tight -mt-2 text-white">
          {pct}%
        </p>
      )}

      {/* Status */}
      <div className="text-center space-y-1.5 -mt-2">
        <p className="text-white text-lg font-bold">{statusText}</p>

        {subLabel && !isDone && (
          <p className="text-white/60 text-xs tracking-wide">{subLabel}</p>
        )}

        {isDirect && isWarm && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
            {hostTier === 'pro' ? '✦ Pro · Full resolution' : '◆ Standard quality'}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${pct}%`, background: '#fff' }} />
        </div>
      </div>

      <button onClick={onRetake} className="text-white/50 text-sm active:text-white transition-colors">
        Cancel and retake
      </button>
    </div>
  );
}
