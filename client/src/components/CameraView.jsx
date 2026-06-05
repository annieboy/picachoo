import { useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';
import FilePicker from './FilePicker';

export default function CameraView({ guestName, onCapture }) {
  const {
    videoRef,
    cameraState,
    capturedBlob,
    flashVisible,
    startCamera,
    snapPhoto,
    retake,
    stopStream,
  } = useCamera();

  // snapPhoto is now async — wrap so onClick doesn't swallow rejections silently
  const handleSnap = () => { snapPhoto().catch(console.error); };

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  useEffect(() => {
    if (capturedBlob) onCapture(capturedBlob);
  }, [capturedBlob, onCapture]);

  const needsFallback = cameraState === 'denied' || cameraState === 'unavailable';
  const isActive    = cameraState === 'active';
  const isCapturing = cameraState === 'capturing';

  return (
    <div className="relative flex flex-col h-full bg-black">

      {/* ── Live video / loading placeholder ── */}
      {!needsFallback && (
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-fill absolute inset-0"
          />

          {/* Starting / capturing spinner overlay */}
          {(cameraState === 'starting' || isCapturing) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Spinner />
            </div>
          )}

          {/* Shutter flash */}
          {flashVisible && (
            <div className="absolute inset-0 bg-white animate-shutter-flash pointer-events-none" />
          )}

          {/* Guest name pill — top-left */}
          <div className="absolute top-safe-or-4 left-4 top-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold tracking-wide">
            {guestName}
          </div>

          {/* Viewfinder corner guides */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-8">
            {['top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-6 h-6 border-white/30 ${cls}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Fallback ── */}
      {needsFallback && (
        <div className="flex-1 flex items-center justify-center px-6">
          <FilePicker guestName={guestName} reason={cameraState} onFile={onCapture} />
        </div>
      )}

      {/* ── Bottom controls ── */}
      {!needsFallback && (
        <div
          className="flex items-center justify-center gap-10 px-8 py-8 bg-black"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          {/* Left placeholder — keeps shutter centred */}
          <div className="w-12 h-12" />

          {/* Shutter button */}
          <button
            disabled={!isActive}
            onClick={handleSnap}
            aria-label="Take photo"
            className="
              relative w-[76px] h-[76px] rounded-full
              flex items-center justify-center
              transition-transform duration-100
              active:scale-90
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none
            "
          >
            {/* Outer ring */}
            <span className="absolute inset-0 rounded-full border-[3px] border-white/80" />
            {/* Inner disc — slight gradient for depth */}
            <span
              className="block w-[58px] h-[58px] rounded-full transition-transform duration-100"
              style={{ background: 'linear-gradient(145deg, #ffffff, #e0e0e0)' }}
            />
            {/* Tap ripple hint when active */}
            {isActive && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-0 group-active:opacity-20 bg-white" />
            )}
          </button>

          {/* Gallery picker */}
          <button
            onClick={() => { stopStream(); onCapture(null); }}
            aria-label="Choose from gallery"
            className="
              w-12 h-12 flex items-center justify-center rounded-2xl
              bg-white/10 backdrop-blur-sm text-zinc-300
              active:scale-90 transition-transform border border-white/10
            "
          >
            <GalleryIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-10 h-10 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
