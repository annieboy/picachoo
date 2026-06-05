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

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  // Once we have a blob, hand it up immediately — no second confirmation needed.
  useEffect(() => {
    if (capturedBlob) onCapture(capturedBlob);
  }, [capturedBlob, onCapture]);

  const needsFallback = cameraState === 'denied' || cameraState === 'unavailable';

  return (
    <div className="relative flex flex-col h-full bg-black">

      {/* ── Live video / loading placeholder ─────────────────────── */}
      {!needsFallback && (
        <div className="relative flex-1 overflow-hidden">
          {/* Video fills the viewport */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-fill absolute inset-0"
          />

          {/* Starting spinner overlay */}
          {cameraState === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Spinner />
            </div>
          )}

          {/* White shutter flash */}
          {flashVisible && (
            <div className="absolute inset-0 bg-white animate-shutter-flash pointer-events-none" />
          )}

          {/* Guest name pill — top-left */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
            {guestName}
          </div>
        </div>
      )}

      {/* ── Fallback ──────────────────────────────────────────────── */}
      {needsFallback && (
        <div className="flex-1 flex items-center justify-center px-6">
          <FilePicker
            guestName={guestName}
            reason={cameraState}
            onFile={onCapture}
          />
        </div>
      )}

      {/* ── Bottom controls bar ───────────────────────────────────── */}
      {!needsFallback && (
        <div className="flex items-center justify-center gap-8 px-6 py-8 bg-black">
          {/* Retake / placeholder (left) */}
          <div className="w-12 h-12" />

          {/* Shutter button */}
          <button
            disabled={cameraState !== 'active'}
            onClick={snapPhoto}
            aria-label="Take photo"
            className="
              relative w-20 h-20 rounded-full
              border-4 border-white
              flex items-center justify-center
              active:scale-90 transition-transform duration-100
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus:ring-4 focus:ring-white/50
            "
          >
            <span className="block w-14 h-14 rounded-full bg-white" />
          </button>

          {/* Switch to file picker (right) */}
          <button
            onClick={() => {
              stopStream();
              /* Trigger FilePicker by switching state — done via parent prop */
              onCapture(null); // null signals "open gallery instead"
            }}
            aria-label="Choose from gallery"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-300 active:scale-90 transition-transform"
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
