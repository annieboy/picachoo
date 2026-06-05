import { useEffect, useRef } from 'react';

export default function PreviewScreen({ blob, onUpload, onRetake }) {
  const objectUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

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
