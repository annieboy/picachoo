import { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';

export default function CameraView({ eventName, onCapture, onGalleryFiles }) {
  const {
    videoRef, cameraState, capturedBlob, flashVisible,
    startCamera, snapPhoto, stopStream,
    flipCamera, torchOn, torchSupported, toggleTorch,
    zoom, zoomRange, applyZoom,
  } = useCamera();

  const fileInputRef = useRef(null);
  const mediaRecRef  = useRef(null);
  const recordChunks = useRef([]);
  const pinchRef     = useRef({ active: false, startDist: 0, startZoom: 1 });

  const [mode,       setMode]       = useState('photo');
  const [recording,  setRecording]  = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const timerRef     = useRef(null);

  useEffect(() => { startCamera(); return stopStream; }, [startCamera, stopStream]);
  useEffect(() => { if (capturedBlob) onCapture(capturedBlob); }, [capturedBlob, onCapture]);

  // ── Pinch-to-zoom ──────────────────────────────────────────────────────────
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
    const dist  = Math.hypot(dx, dy);
    const scale = dist / pinchRef.current.startDist;
    const next  = Math.min(zoomRange.max, Math.max(zoomRange.min, pinchRef.current.startZoom * scale));
    applyZoom(next);
  }
  function handleTouchEnd() { pinchRef.current.active = false; }

  // ── Zoom button levels ─────────────────────────────────────────────────────
  const zoomLevels = hasZoom
    ? [1, 2, Math.min(5, zoomRange.max)].filter((v, i, a) => v <= zoomRange.max && a.indexOf(v) === i)
    : [];

  // ── Gallery ────────────────────────────────────────────────────────────────
  function handleGalleryChange(e) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';
    stopStream();
    onGalleryFiles(files);
  }

  // ── Video recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    if (!stream) return;
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4'
                   : MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
                   : 'video/webm';
    const mr = new MediaRecorder(stream, { mimeType });
    recordChunks.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) recordChunks.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(recordChunks.current, { type: mimeType });
      stopStream();
      onCapture(blob);
    };
    mr.start(250);
    mediaRecRef.current = mr;
    setRecording(true);
    setRecordSecs(0);
    timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
  }, [videoRef, stopStream, onCapture]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    mediaRecRef.current?.stop();
    setRecording(false);
    setRecordSecs(0);
  }, []);

  function handleModeChange(m) {
    if (recording) stopRecording();
    setMode(m);
  }

  function handleShutter() {
    if (mode === 'video') recording ? stopRecording() : startRecording();
    else snapPhoto().catch(console.error);
  }

  function fmtSecs(s) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  const needsFallback = cameraState === 'denied' || cameraState === 'unavailable';
  const isActive      = cameraState === 'active';
  const isStarting    = cameraState === 'starting';

  return (
    /* Full-screen, no-scroll container */
    <div
      className="relative w-full h-full bg-black select-none overflow-hidden touch-none"
      style={{ minHeight: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Full-screen video ── */}
      {!needsFallback && (
        <>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {flashVisible && (
            <div className="absolute inset-0 bg-white pointer-events-none animate-shutter-flash" />
          )}
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <CameraSpinner />
            </div>
          )}
        </>
      )}

      {/* ── Permission / hardware error ── */}
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
            style={{ background: 'linear-gradient(135deg,#5B52E8,#29BFBF)' }}
          >
            Choose from gallery
          </button>
        </div>
      )}

      {/* ── Top bar (overlaid) ── */}
      <div
        className="absolute inset-x-0 top-0 z-20 flex items-center justify-center px-5"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.5rem' }}
      >
        {/* Event name — centred handwriting */}
        {eventName && (
          <span
            className="text-white drop-shadow-lg truncate max-w-[70vw] text-center"
            style={{
              fontFamily: "'Caveat', 'Segoe Script', cursive",
              fontSize: '1.4rem',
              fontWeight: 700,
              textShadow: '0 1px 8px rgba(0,0,0,0.55)',
            }}
          >
            {eventName}
          </span>
        )}

        {/* Flash / timer — absolute right so they don't offset the centred name */}
        <div className="absolute right-4 flex items-center gap-2">
          {recording && (
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold tabular-nums">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {fmtSecs(recordSecs)}
            </span>
          )}
          {torchSupported && !recording && (
            <button
              onClick={toggleTorch}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all active:scale-90"
              style={torchOn ? { background: '#FACC15', color: '#000' } : { background: 'rgba(0,0,0,0.35)', color: '#fff' }}
              aria-label={torchOn ? 'Flash off' : 'Flash on'}
            >
              <FlashIcon on={torchOn} />
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom controls (overlaid) ── */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))', paddingTop: '1rem',
                 background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      >
        {/* Zoom level buttons */}
        {hasZoom && isActive && !recording && (
          <div className="flex items-center gap-2">
            {zoomLevels.map(level => {
              const active = Math.abs(zoom - level) < 0.3;
              return (
                <button
                  key={level}
                  onClick={() => applyZoom(level)}
                  className="px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm transition-all active:scale-90"
                  style={active
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)' }
                    : { background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                >
                  {level === 1 ? '1×' : level === 2 ? '2×' : `${level}×`}
                </button>
              );
            })}
          </div>
        )}

        {/* Mode toggle — Photo / Video */}
        {!needsFallback && (
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm p-1 rounded-full">
            {['photo', 'video'].map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                style={mode === m
                  ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                  : { color: 'rgba(255,255,255,0.45)' }}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Main controls row: flip · shutter · gallery */}
        <div className="flex items-center justify-between w-full px-10">

          {/* Flip */}
          <button
            onClick={flipCamera}
            disabled={recording}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-30 backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }}
            aria-label="Flip camera"
          >
            <FlipIcon />
          </button>

          {/* Shutter */}
          <button
            disabled={!isActive}
            onClick={handleShutter}
            aria-label={mode === 'video' ? (recording ? 'Stop' : 'Record') : 'Snap'}
            className="relative flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 focus:outline-none"
            style={{ width: 80, height: 80 }}
          >
            {mode === 'photo' ? (
              <>
                <span className="absolute inset-0 rounded-full border-[3.5px] border-white/80" />
                <span className="block w-[64px] h-[64px] rounded-full bg-white" />
              </>
            ) : recording ? (
              <>
                <span className="absolute inset-0 rounded-full border-[3.5px] border-red-500" />
                <span className="block w-8 h-8 rounded-lg bg-red-500" />
              </>
            ) : (
              <>
                <span className="absolute inset-0 rounded-full border-[3.5px] border-white/80" />
                <span className="block w-[64px] h-[64px] rounded-full bg-red-500" />
              </>
            )}
          </button>

          {/* Gallery */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={recording}
            aria-label="Gallery"
            className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-30 backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }}
          >
            <GalleryIcon />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={handleGalleryChange}
      />
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
    <svg viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
