import { useEffect, useRef } from 'react';

export default function PreviewScreen({ blob, onUpload, onRetake, eventName }) {
  const objectUrl = useRef(URL.createObjectURL(blob));
  useEffect(() => () => URL.revokeObjectURL(objectUrl.current), []);

  const isVideo = blob.type?.startsWith('video/');

  async function saveToGallery() {
    const ext  = isVideo ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
    const name = `picachoo-${Date.now()}.${ext}`;
    const file = new File([blob], name, { type: blob.type });

    // iOS Safari 15+ and Android Chrome: Web Share API with files triggers
    // the native share sheet where user can "Save to Photos / Downloads".
    // This is the only path that reaches the iOS Camera Roll from a web app.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        return;
      } catch (err) {
        // AbortError = user dismissed share sheet — that's fine, still upload
        if (err.name !== 'AbortError') throw err;
      }
    }

    // Android / desktop fallback: programmatic <a download> saves to Downloads
    const url = URL.createObjectURL(file);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      // small delay so the browser has time to start the download before revoke
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function handleUpload() {
    // Fire-and-forget: save attempt must not block the upload flow
    saveToGallery().catch(() => {});
    onUpload();
  }

  return (
    <div className="flex flex-col h-full bg-black select-none">

      {/* ── Preview area ── */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {isVideo ? (
          /* Video: full screen */
          <video src={objectUrl.current} className="absolute inset-0 w-full h-full object-cover"
                 autoPlay loop muted playsInline />
        ) : (
          /* Photo: 3:4 frame — naturally clipped by flex-1 container */
          <div style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            right: 0,
            height: 'calc(100vw * 4 / 3)',
            overflow: 'hidden',
          }}>
            <img src={objectUrl.current} alt="Preview"
                 style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

            {/* Event name overlaid inside the photo box */}
            {eventName && (
              <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-3 pb-2"
                   style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}>
                <span
                  className="text-white drop-shadow-lg"
                  style={{ fontFamily: "'Caveat','Segoe Script',cursive", fontSize: '1.4rem', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}
                >
                  {eventName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom controls: Retake · Shutter-style Upload · (spacer) ── */}
      <div
        className="shrink-0 flex items-center justify-between px-10 py-4 bg-black"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Retake — left */}
        <button
          onClick={onRetake}
          className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
          aria-label="Retake"
        >
          <span className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
            <RetakeIcon />
          </span>
          <span className="text-white/50 text-[11px] font-medium">Retake</span>
        </button>

        {/* Upload — centre, shutter-sized */}
        <button
          onClick={handleUpload}
          aria-label="Upload photo"
          className="relative flex items-center justify-center active:scale-90 transition-transform focus:outline-none"
          style={{ width: 80, height: 80 }}
        >
          <span className="absolute inset-0 rounded-full border-[3.5px] border-white/70" />
          <span className="flex items-center justify-center w-[64px] h-[64px] rounded-full"
                style={{ background: 'linear-gradient(135deg,#6045f4,#53e6d4)' }}>
            <UploadIcon />
          </span>
        </button>

        {/* Spacer — keeps shutter centred */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}

function RetakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 4v6h6"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
         strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M5 12l7-7 7 7"/><path d="M12 5v14"/>
    </svg>
  );
}
