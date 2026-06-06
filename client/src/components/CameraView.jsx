import { useEffect, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';

export default function CameraView({ eventName, onCapture, onGalleryFiles }) {
  const {
    videoRef, cameraState, capturedBlob, flashVisible,
    startCamera, snapPhoto, stopStream,
    flipCamera, torchOn, torchSupported, toggleTorch,
    zoom, zoomRange, applyZoom,
  } = useCamera();

  const fileInputRef = useRef(null);
  const pinchRef     = useRef({ active: false, startDist: 0, startZoom: 1 });

  useEffect(() => { startCamera(); return stopStream; }, [startCamera, stopStream]);
  useEffect(() => { if (capturedBlob) onCapture(capturedBlob); }, [capturedBlob, onCapture]);

  const hasZoom = zoomRange.max > zoomRange.min;

  function handleTouchStart(e) {
    if (e.touches.length !== 2 || !hasZoom) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchRef.current = { active: true, startDist: Math.hypot(dx, dy), startZoom: zoom };
  }
  function handleTouchMove(e) {
    if (!pinchRef.current.active || e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const scale = Math.hypot(dx, dy) / pinchRef.current.startDist;
    applyZoom(Math.min(zoomRange.max, Math.max(zoomRange.min, pinchRef.current.startZoom * scale)));
  }
  function handleTouchEnd() { pinchRef.current.active = false; }

  const zoomLevels = hasZoom
    ? [1, 2, Math.min(5, zoomRange.max)].filter((v, i, a) => v <= zoomRange.max && a.indexOf(v) === i)
    : [];

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
    <div
      className="relative w-full h-full bg-black select-none overflow-hidden touch-none"
      style={{ minHeight: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Viewfinder */}
      {!needsFallback && (
        <>
          <div style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            right: 0,
            height: 'calc(100vw * 4 / 3)',
            maxHeight: 'calc(100dvh - 52px - 112px)',
            overflow: 'hidden',
          }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

            {/* Title + torch overlaid inside the viewfinder */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center px-4 pt-3 pb-2"
                 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}>
              {eventName && (
                <span
                  className="text-white truncate max-w-[70vw] text-center"
                  style={{ fontFamily: "'Caveat','Segoe Script',cursive", fontSize: '1.4rem', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}
                >
                  {eventName}
                </span>
              )}
              {torchSupported && (
                <button onClick={toggleTorch}
                  className="absolute right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all active:scale-90"
                  style={torchOn ? { background: '#FACC15', color: '#000' } : { background: 'rgba(0,0,0,0.35)', color: '#fff' }}>
                  <FlashIcon on={torchOn} />
                </button>
              )}
            </div>
          </div>

          {flashVisible && (
            <div className="absolute inset-0 bg-white pointer-events-none z-30 animate-shutter-flash" />
          )}
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
              <CameraSpinner />
            </div>
          )}
        </>
      )}

      {/* Permission fallback */}
      {needsFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10">
            {cameraState === 'denied' ? <LockIcon /> : <NoCameraIcon />}
          </div>
          <p className="text-white text-base font-semibold">
            {cameraState === 'denied' ? 'Camera access denied' : 'Camera unavailable'}
          </p>
          <p className="text-white/50 text-xs leading-relaxed max-w-xs">
            {cameraState === 'denied'
              ? 'Allow camera access in your browser settings, or upload from gallery.'
              : 'Select photos from your gallery below.'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg,#6045f4,#53e6d4)' }}
          >
            Choose from gallery
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', paddingTop: '1rem',
                 background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      >
        {hasZoom && isActive && (
          <div className="flex items-center gap-1">
            {zoomLevels.map(level => {
              const active = Math.abs(zoom - level) < 0.3;
              return (
                <button key={level} onClick={() => applyZoom(level)}
                  className="w-9 h-9 flex items-center justify-center text-sm font-bold transition-all active:scale-90"
                  style={active ? { color: '#fff' } : { color: 'rgba(255,255,255,0.45)' }}>
                  {level === 1 ? '1×' : `${level}×`}
                </button>
              );
            })}
          </div>
        )}

        {/* Flip · Shutter · Gallery */}
        <div className="flex items-center justify-between w-full px-10">
          <button onClick={flipCamera}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            <FlipIcon />
          </button>

          <button disabled={!isActive} onClick={() => snapPhoto().catch(console.error)}
            className="relative flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 focus:outline-none"
            style={{ width: 80, height: 80 }}>
            <span className="absolute inset-0 rounded-full border-[3.5px] border-white/80" />
            <span className="block w-[64px] h-[64px] rounded-full bg-white" />
          </button>

          <button onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            <GalleryIcon />
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleGalleryChange} />
    </div>
  );
}

function CameraSpinner() {
  return (
    <svg className="w-10 h-10 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}
function FlashIcon({ on }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  );
}
function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 16l5-5 4 4 3-3 6 6"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7 opacity-60">
      <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>
    </svg>
  );
}
function NoCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7 opacity-60">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
