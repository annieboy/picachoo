import { useEffect, useRef } from 'react';

export default function PreviewScreen({ blob, onUpload, onRetake }) {
  const objectUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  return (
    <div className="flex flex-col h-full bg-black select-none">

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3"
           style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button
          onClick={onRetake}
          className="text-white/70 text-sm font-medium active:text-white transition-colors"
        >
          Retake
        </button>
        <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Preview</span>
        <div className="w-12" /> {/* spacer */}
      </div>

      {/* ── Photo at same 3:4 aspect as viewfinder ── */}
      <div className="shrink-0 w-full relative overflow-hidden bg-zinc-900"
           style={{ aspectRatio: '3/4' }}>
        <img
          src={objectUrl.current}
          alt="Your photo"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex-1 flex flex-col justify-center items-center gap-4 px-10"
           style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">
          Use this photo?
        </p>
        <button
          onClick={onUpload}
          className="w-full max-w-xs rounded-2xl py-4 text-base font-bold text-white active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #5B52E8, #29BFBF)' }}
        >
          Upload photo
        </button>
        <button
          onClick={onRetake}
          className="text-white/50 text-sm font-medium active:text-white/80 transition-colors py-2"
        >
          Retake
        </button>
      </div>
    </div>
  );
}
