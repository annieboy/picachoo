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

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      {/* ── Fullscreen video ── */}
      {!needsFallback && (
        <>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Shutter flash */}
          {flashVisible && (
            <div className="absolute inset-0 bg-white pointer-events-none animate-shutter-flash"
                  />
          )}

          {/* Starting overlay */}
          {cameraState === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <CameraSpinner />
            </div>
          )}

          {/* ── Top bar ── */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 z-10"
               style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>

            {/* Guest name pill */}
            <div className="px-3 py-1.5 rounded-full text-white text-xs font-semibold tracking-wide"
                 style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
              {guestName}
            </div>

            {/* Flash toggle — only on devices that support it */}
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={torchOn
                  ? { background: '#FACC15', color: '#000' }
                  : { background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#fff' }}
                aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
              >
                <FlashIcon on={torchOn} />
              </button>
            )}
          </div>

          {/* Viewfinder corners */}
          <div aria-hidden className="pointer-events-none absolute inset-10 z-10">
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-7 h-7 border-white/50 ${cls}`} />
            ))}
          </div>

          {/* ── Bottom controls ── */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-8"
            style={{
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
              paddingTop: '2rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }}
          >
            {/* Flip camera */}
            <button
              onClick={flipCamera}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              aria-label="Flip camera"
            >
              <FlipIcon />
            </button>

            {/* Shutter */}
            <button
              disabled={!isActive}
              onClick={handleSnap}
              aria-label="Take photo"
              className="relative w-[78px] h-[78px] rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 focus:outline-none"
            >
              <span className="absolute inset-0 rounded-full border-[3.5px] border-white" />
              <span className="block w-[62px] h-[62px] rounded-full bg-white" />
            </button>

            {/* Gallery */}
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Choose from gallery"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform overflow-hidden border-2 border-white/30"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
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
        </>
      )}

      {/* ── Fallback (denied / unavailable) ── */}
      {needsFallback && (
        <div className="flex flex-col items-center justify-center h-full px-8 gap-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.1)' }}>
            {cameraState === 'denied' ? <LockIcon /> : <NoCameraIcon />}
          </div>
          <div>
            <p className="text-white text-lg font-semibold mb-1">
              {cameraState === 'denied' ? 'Camera access denied' : 'Camera unavailable'}
            </p>
            <p className="text-white/50 text-sm leading-snug">
              {cameraState === 'denied'
                ? 'Allow camera access in your browser settings, or upload a photo instead.'
                : 'Use your photo gallery or native camera app below.'}
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs rounded-2xl py-4 text-base font-semibold text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #5B52E8, #29BFBF)' }}
          >
            Choose from gallery
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
      )}
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
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8 opacity-60">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function NoCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8 opacity-60">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
