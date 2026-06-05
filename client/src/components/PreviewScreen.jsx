import { useEffect, useRef, useState } from 'react';

const AUTO_UPLOAD_KEY = 'picachoo_auto_upload';
const COUNTDOWN_SEC   = 3;

export default function PreviewScreen({ blob, onUpload, onRetake }) {
  const [autoUpload, setAutoUpload] = useState(
    () => localStorage.getItem(AUTO_UPLOAD_KEY) === 'true',
  );
  const [countdown, setCountdown] = useState(autoUpload ? COUNTDOWN_SEC : null);
  const objectUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  // Auto-upload countdown
  useEffect(() => {
    if (!autoUpload) { setCountdown(null); return; }
    setCountdown(COUNTDOWN_SEC);
    let remaining = COUNTDOWN_SEC;
    const iv = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) { clearInterval(iv); onUpload(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [autoUpload]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAutoUpload() {
    const next = !autoUpload;
    localStorage.setItem(AUTO_UPLOAD_KEY, String(next));
    setAutoUpload(next);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Full-screen photo */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={objectUrl.current}
          alt="Your photo preview"
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>

      {/* Bottom panel */}
      <div className="shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent px-6 pt-10 pb-8 flex flex-col gap-4">

        {/* Auto-upload toggle */}
        <button
          onClick={toggleAutoUpload}
          className="flex items-center gap-2 text-sm self-center"
          style={{ color: autoUpload ? '#a78bfa' : '#52525b' }}
        >
          <span
            className="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200"
            style={{ background: autoUpload ? '#7c3aed' : '#3f3f46' }}
          >
            <span
              className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200"
              style={{ transform: autoUpload ? 'translateX(16px)' : 'translateX(0)' }}
            />
          </span>
          Auto-upload after snap
        </button>

        {/* Upload button */}
        <button
          onClick={onUpload}
          className="w-full rounded-2xl py-4 text-lg font-semibold text-white active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #a78bfa)' }}
        >
          {autoUpload && countdown !== null
            ? `Uploading in ${countdown}…`
            : 'Upload photo'}
        </button>

        {/* Retake */}
        <button
          onClick={onRetake}
          className="text-zinc-400 text-sm font-medium py-2 active:text-white transition-colors"
        >
          Retake
        </button>
      </div>
    </div>
  );
}
