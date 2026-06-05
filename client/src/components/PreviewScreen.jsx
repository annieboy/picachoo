import { useEffect, useRef, useState } from 'react';

export default function PreviewScreen({ blob, onUpload, onRetake }) {
  const objectUrl = useRef(URL.createObjectURL(blob));
  const [dims, setDims] = useState(null);
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  function handleImgLoad(e) {
    setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#000' }}>
      {/* Full-screen photo */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={objectUrl.current}
          alt="Your photo preview"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={handleImgLoad}
        />
        {dims && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/60 tabular-nums">
            {dims.w} × {dims.h}
          </div>
        )}
      </div>

      {/* Bottom panel with Bezl gradient */}
      <div className="shrink-0 px-6 pt-10 pb-8 flex flex-col gap-4"
           style={{ background: 'linear-gradient(to top, #5B52E8 0%, rgba(91,82,232,0.9) 60%, transparent 100%)' }}>
        <button
          onClick={onUpload}
          className="w-full rounded-2xl py-4 text-lg font-bold text-white active:scale-95 transition-transform"
          style={{ background: '#fff', color: '#6B5CE7', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          Upload photo
        </button>
        <button
          onClick={onRetake}
          className="text-white/60 text-sm font-medium py-2 active:text-white transition-colors"
        >
          Retake
        </button>
      </div>
    </div>
  );
}
