import { useEffect, useRef, useState } from 'react';

export default function PreviewScreen({ blob, onUpload, onRetake }) {
  const objectUrl = useRef(URL.createObjectURL(blob));
  const [dims, setDims] = useState(null);
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  // Read actual pixel dimensions once the img element loads
  function handleImgLoad(e) {
    setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Full-screen photo */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={objectUrl.current}
          alt="Your photo preview"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={handleImgLoad}
        />
        {/* Resolution badge — confirms full-res capture on supporting devices */}
        {dims && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/60 tabular-nums">
            {dims.w} × {dims.h}
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent px-6 pt-10 pb-8 flex flex-col gap-4">
        <button
          onClick={onUpload}
          className="w-full rounded-2xl py-4 text-lg font-semibold text-white active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #a78bfa)' }}
        >
          Upload photo
        </button>

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
