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
        setTimeout(onSuccess, 400);
      } catch (err) {
        clearInterval(timer);
        if (!abortRef.current) onError(err.message);
      }
    }

    run();
    return () => { abortRef.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const previewUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(previewUrl.current), []);

  const isCompressing = phase === 'compressing';
  const statusLabel   = isCompressing ? 'Preparing your photo…' : phase === 'uploading' ? 'Sending to Drive…' : 'Done!';
  const stepLabel     = isCompressing ? 'Optimising · Step 1 of 2' : 'Uploading · Step 2 of 2';

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-black px-6 gap-6">

      {/* Event context */}
      {eventName && (
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium text-center">
          {eventName}
        </p>
      )}

      {/* Thumbnail with spinner overlay */}
      <div className="relative w-52 h-52 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <img src={previewUrl.current} alt="Your photo" className="w-full h-full object-cover" />

        {/* Blurred dark overlay */}
        {phase !== 'done' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            {/* Stylised dual-ring spinner */}
            <div className="relative w-14 h-14">
              <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="24" stroke="white" strokeOpacity="0.1" strokeWidth="4"/>
                <path d="M28 4 A24 24 0 0 1 52 28" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <svg className="absolute inset-0 w-full h-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]" viewBox="0 0 56 56" fill="none">
                <path d="M28 52 A24 24 0 0 1 4 28" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"/>
              </svg>
            </div>
            <p className="text-white text-xs font-medium">{Math.round(progress)}%</p>
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="text-white text-lg font-semibold">{statusLabel}</p>
        <p className="text-zinc-500 text-xs tracking-wide">{sizeInfo || stepLabel}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-1.5">
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompressing ? 'bg-amber-400' : 'bg-violet-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Cancel */}
      <button
        onClick={onRetake}
        className="text-zinc-600 text-sm underline underline-offset-2 active:text-zinc-400 transition-colors"
      >
        Cancel and retake
      </button>
    </div>
  );
}
