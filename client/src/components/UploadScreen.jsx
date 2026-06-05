import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/**
 * Immediately fires the upload on mount. Shows a spinner while in-flight,
 * then calls onSuccess() or onError(message) when done.
 */
export default function UploadScreen({ blob, guestName, eventCode, onSuccess, onError, onRetake }) {
  const [progress, setProgress] = useState(0); // 0-100 fake smooth progress
  const timerRef = useRef(null);

  useEffect(() => {
    // Animate progress smoothly so it doesn't feel stuck.
    // Real progress events are unreliable for small payloads, so we fake it up
    // to 85% and let the success callback jump it to 100.
    let pct = 0;
    timerRef.current = setInterval(() => {
      pct = Math.min(pct + Math.random() * 8, 85);
      setProgress(pct);
    }, 200);

    const formData = new FormData();
    // blob may be a raw Blob (from canvas snap) or a File (from file picker)
    const filename = blob.name ?? `photo_${Date.now()}.jpg`;
    formData.append('photo', blob, filename);
    formData.append('guestName', guestName);

    fetch(`${API_BASE}/api/events/${eventCode}/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(async res => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
        return body;
      })
      .then(() => {
        clearInterval(timerRef.current);
        setProgress(100);
        setTimeout(onSuccess, 300); // brief pause at 100%
      })
      .catch(err => {
        clearInterval(timerRef.current);
        onError(err.message);
      });

    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Thumbnail preview from the blob
  const previewUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(previewUrl.current), []);

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-black px-6 gap-8">
      {/* Photo thumbnail */}
      <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={previewUrl.current}
          alt="Your photo"
          className="w-full h-full object-cover"
        />
        {/* Dim overlay while uploading */}
        {progress < 100 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <SpinnerRing />
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="text-white text-lg font-semibold">
          {progress < 100 ? 'Uploading…' : 'Almost there…'}
        </p>
        <p className="text-zinc-400 text-sm">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Cancel / retake */}
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
