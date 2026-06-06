import { useEffect, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';

export default function CameraView({ guestName, onCapture, onGalleryFiles }) {
  const {
    videoRef, cameraState, capturedBlob, flashVisible,
    startCamera, snapPhoto, stopStream,
    flipCamera, torchOn, torchSupported, toggleTorch,
  } = useCamera();

  const fileInputRef = useRef(null);

  useEffect(() => { startCamera(); return stopStream; }, [startCamera, stopStream]);
  useEffect(() => { if (capturedBlob) onCapture(capturedBlob); }, [capturedBlob, onCapture]);

  const handleSnap = () => snapPhoto().catch(console.error);

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';
    stopStream();
    onGalleryFiles(files);
  }

  const needsFallback = cameraState === 'denied' || cameraState === 'unavailable';
  const isActive      = cameraState === 'active';
  const isStarting    = cameraState === 'starting';

  return (
    <div className="flex flex-col h-full bg-black select-none">

      {/* ── Top status bar ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3"
           style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <span className="text-white/70 text-sm font-semibold tracking-wide truncate max-w-[60%]">
          {guestName}
        </span>
        {/* Flash toggle */}
        {torchSupported && (
          <button
            onClick={toggleTorch}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={torchOn
              ? { background: '#FACC15', color: '#000' }
              : { background: 'rgba(255,255,255,0.12)', color: '#fff' }}
            aria-label={torchOn ? 'Flash off' : 'Flash on'}
          >
            <FlashIcon on={torchOn} />
          </button>
        )}
      </div>

      {/* ── Viewfinder (4:3 portrait, framed) ── */}
      <div className="shrink-0 w-full relative overflow-hidden"
           style={{ aspectRatio: '3/4' }}>

        {!needsFallback && (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Shutter flash */}
            {flashVisible && (
              <div className="absolute inset-0 bg-white pointer-events-none animate-shutter-flash" />
            )}

            {/* Starting spinner */}
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <CameraSpinner />
              </div>
            )}

            {/* Viewfinder corner guides */}
            <div aria-hidden className="pointer-events-none absolute inset-6">
              {[
                'top-0 left-0 border-t-2 border-l-2',
                'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2',
                'bottom-0 right-0 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-7 h-7 border-white/50 ${cls}`} />
              ))}
            </div>
          </>
        )}

        {needsFallback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-900">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10">
              {cameraState === 'denied' ? <LockIcon /> : <NoCameraIcon />}
            </div>
            <p className="text-white text-base font-semibold">
              {cameraState === 'denied' ? 'Camera access denied' : 'Camera unavailable'}
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              {cameraState === 'denied'
                ? 'Allow camera in browser settings, or upload from your gallery.'
                : 'Use your photo gallery below.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex-1 flex flex-col justify-center"
           style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

        {/* Mode label */}
        <p className="text-center text-white/50 text-xs font-semibold uppercase tracking-widest mb-5">
          Photo
        </p>

        <div className="flex items-center justify-between px-10">

          {/* Flip camera */}
          <button
            onClick={flipCamera}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="Flip camera"
          >
            <FlipIcon />
          </button>

          {/* Shutter */}
          <button
            disabled={!isActive}
            onClick={handleSnap}
            aria-label="Take photo"
            className="relative w-[82px] h-[82px] rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 focus:outline-none"
          >
            <span className="absolute inset-0 rounded-full border-[4px] border-white" />
            <span className="block w-[66px] h-[66px] rounded-full bg-white" />
          </button>

          {/* Gallery */}
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Choose from gallery"
            className="w-14 h-14 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform border-2 border-white/20"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <GalleryIcon />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleGalleryChange}
          />
        </div>

        {/* Gallery CTA for fallback */}
        {needsFallback && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mx-8 mt-6 rounded-2xl py-4 text-base font-semibold text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #5B52E8, #29BFBF)' }}
          >
            Choose from gallery
          </button>
        )}
      </div>
    </div>
  );
}

function CameraSpinner() {
  return (
    <svg className="w-10 h-10 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function FlashIcon({ on }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7 opacity-60">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function NoCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7 opacity-60">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
