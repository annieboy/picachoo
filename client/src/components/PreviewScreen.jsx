import { useEffect, useRef } from 'react';

export default function PreviewScreen({ blob, onUpload, onRetake }) {
  const objectUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  const isVideo = blob.type?.startsWith('video/');

  return (
    <div className="flex flex-col h-full bg-black select-none">

      {/* ── Photo / Video fills all remaining space ── */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        {isVideo ? (
          <video
            src={objectUrl.current}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay loop muted playsInline
          />
        ) : (
          <img
            src={objectUrl.current}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* ── Bottom bar: Retake (left) · Upload (right) ── */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4 bg-black"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {/* Retake */}
        <button
          onClick={onRetake}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          aria-label="Retake"
        >
          <span className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
            <RetakeIcon />
          </span>
          <span className="text-white/50 text-[11px] font-medium">Retake</span>
        </button>

        {/* Upload */}
        <button
          onClick={onUpload}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          aria-label="Upload"
        >
          <span className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#5B52E8,#29BFBF)' }}>
            <UploadIcon />
          </span>
          <span className="text-white/50 text-[11px] font-medium">Upload</span>
        </button>
      </div>
    </div>
  );
}

function RetakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 4v6h6"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M5 12l7-7 7 7"/><path d="M12 5v14"/>
    </svg>
  );
}
