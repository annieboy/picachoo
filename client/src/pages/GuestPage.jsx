import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NameScreen        from '../components/NameScreen';
import CameraView        from '../components/CameraView';
import PreviewScreen     from '../components/PreviewScreen';
import BatchUploadScreen from '../components/BatchUploadScreen';
import { getEvent }      from '../api';
import { uploadFile }    from '../lib/uploadFile';

const NAME_KEY = 'picachoo_guest_name';
const SCREENS  = { NAME: 'name', CAMERA: 'camera', PREVIEW: 'preview', BATCH: 'batch' };

let nextId = 1;

export default function GuestPage() {
  const { eventCode } = useParams();

  const [event,       setEvent]       = useState(null);
  const [eventError,  setEventError]  = useState('');
  const [screen,      setScreen]      = useState(() =>
    sessionStorage.getItem(NAME_KEY) ? SCREENS.CAMERA : SCREENS.NAME,
  );
  const [guestName,    setGuestName]    = useState(() => sessionStorage.getItem(NAME_KEY) ?? '');
  const [pendingBlob,  setPendingBlob]  = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);

  // Background upload queue: [{ id, progress, status: 'uploading'|'done'|'error', error }]
  const [uploads, setUploads] = useState([]);
  const controllersRef = useRef({});

  useEffect(() => {
    getEvent(eventCode).then(setEvent).catch(err => setEventError(err.message));
  }, [eventCode]);

  const updateUpload = useCallback((id, patch) =>
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u)),
  []);

  const startBackgroundUpload = useCallback((blob) => {
    const id  = nextId++;
    const ctrl = new AbortController();
    controllersRef.current[id] = ctrl;

    setUploads(prev => [...prev, { id, progress: 0, status: 'uploading' }]);

    uploadFile({
      blob, guestName, eventCode,
      hostTier: event?.effective_tier ?? event?.host_tier ?? 'free',
      onProgress: pct => updateUpload(id, { progress: pct }),
      signal: ctrl.signal,
    })
      .then(() => {
        updateUpload(id, { status: 'done', progress: 100 });
        delete controllersRef.current[id];
        // Auto-remove after 3 s
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 3000);
      })
      .catch(err => {
        if (err.message === 'Cancelled') return;
        updateUpload(id, { status: 'error', error: err.message });
        delete controllersRef.current[id];
      });
  }, [guestName, eventCode, event, updateUpload]);

  // ── Screen handlers ────────────────────────────────────────────────────────

  const handleNameConfirm = useCallback(name => {
    sessionStorage.setItem(NAME_KEY, name);
    setGuestName(name);
    setScreen(SCREENS.CAMERA);
  }, []);

  const handleCapture = useCallback(blob => {
    setPendingBlob(blob);
    setScreen(SCREENS.PREVIEW);
  }, []);

  const handleGalleryFiles = useCallback(files => {
    if (files.length === 1) {
      startBackgroundUpload(files[0]);
      setScreen(SCREENS.CAMERA);
    } else {
      setPendingFiles(files);
      setScreen(SCREENS.BATCH);
    }
  }, [startBackgroundUpload]);

  // User confirmed preview → upload in background, back to camera immediately
  const handlePreviewUpload = useCallback(() => {
    if (pendingBlob) startBackgroundUpload(pendingBlob);
    setPendingBlob(null);
    setScreen(SCREENS.CAMERA);
  }, [pendingBlob, startBackgroundUpload]);

  const handleRetake = useCallback(() => {
    setPendingBlob(null);
    setPendingFiles(null);
    setScreen(SCREENS.CAMERA);
  }, []);

  const dismissError = useCallback((id) =>
    setUploads(prev => prev.filter(u => u.id !== id)),
  []);

  const uploadsLocked = event && event.wall_upload_mode === 'host_only';

  if (eventError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black px-6 gap-4 text-center">
        <p className="text-5xl">📷</p>
        <p className="text-white text-xl font-semibold">Event not found</p>
        <p className="text-zinc-400 text-sm">{eventError}</p>
      </div>
    );
  }

  if (uploadsLocked && screen !== SCREENS.NAME) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-8 gap-6 text-center"
           style={{ background: 'linear-gradient(140deg,#5B52E8 0%,#7B65EE 45%,#29BFBF 100%)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/15">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
            <rect x="5" y="11" width="14" height="10" rx="2"/>
            <path d="M8 11V7a4 4 0 018 0v4"/>
          </svg>
        </div>
        <div className="space-y-2">
          {event?.name && (
            <p className="text-white/70 text-sm"
               style={{ fontFamily: "'Caveat',cursive", fontSize: '1.3rem', fontWeight: 700 }}>
              {event.name}
            </p>
          )}
          <p className="text-white text-2xl font-black">Uploads closed</p>
          <p className="text-white/60 text-sm leading-relaxed">
            The host has paused photo contributions for this event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">

      {screen === SCREENS.NAME && (
        <NameScreen
          eventName={event?.name ?? eventCode}
          onConfirm={handleNameConfirm}
        />
      )}

      {screen === SCREENS.CAMERA && (
        <CameraView
          eventName={event?.name}
          onCapture={handleCapture}
          onGalleryFiles={handleGalleryFiles}
        />
      )}

      {screen === SCREENS.PREVIEW && pendingBlob && (
        <PreviewScreen
          blob={pendingBlob}
          eventName={event?.name}
          onUpload={handlePreviewUpload}
          onRetake={handleRetake}
        />
      )}

      {screen === SCREENS.BATCH && pendingFiles && (
        <BatchUploadScreen
          files={pendingFiles}
          guestName={guestName}
          eventCode={eventCode}
          eventName={event?.name}
          hostTier={event?.effective_tier ?? event?.host_tier ?? 'free'}
          onSuccess={() => { setPendingFiles(null); setScreen(SCREENS.CAMERA); }}
          onError={() => { setPendingFiles(null); setScreen(SCREENS.CAMERA); }}
          onCancel={handleRetake}
        />
      )}

      {/* ── Floating upload status pill ── */}
      {uploads.length > 0 && screen === SCREENS.CAMERA && (
        <UploadPill uploads={uploads} onDismiss={dismissError} />
      )}
    </div>
  );
}

function UploadPill({ uploads, onDismiss }) {
  const uploading = uploads.filter(u => u.status === 'uploading');
  const errors    = uploads.filter(u => u.status === 'error');
  const done      = uploads.filter(u => u.status === 'done');

  const avgProgress = uploading.length
    ? Math.round(uploading.reduce((s, u) => s + u.progress, 0) / uploading.length)
    : 0;

  return (
    <div
      className="absolute z-30 flex flex-col gap-2"
      style={{
        bottom: 'calc(max(2.5rem, env(safe-area-inset-bottom)) + 8rem)',
        left: '50%', transform: 'translateX(-50%)',
        pointerEvents: errors.length ? 'auto' : 'none',
      }}
    >
      {/* Uploading pill */}
      {uploading.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
            <path className="opacity-90" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <span className="text-white text-xs font-semibold tabular-nums">
            {uploading.length > 1 ? `${uploading.length} uploading` : 'Uploading'} · {avgProgress}%
          </span>
        </div>
      )}

      {/* Done pill */}
      {done.length > 0 && uploading.length === 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <span className="text-green-400 text-xs">✓</span>
          <span className="text-white text-xs font-semibold">
            {done.length === 1 ? 'Photo uploaded!' : `${done.length} photos uploaded!`}
          </span>
        </div>
      )}

      {/* Error pills */}
      {errors.map(u => (
        <div key={u.id}
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
          style={{ background: 'rgba(200,30,30,0.7)', border: '1px solid rgba(255,100,100,0.3)' }}
        >
          <span className="text-white text-xs font-semibold flex-1">Upload failed</span>
          <button onClick={() => onDismiss(u.id)} className="text-white/70 text-xs ml-1 active:text-white">✕</button>
        </div>
      ))}
    </div>
  );
}
