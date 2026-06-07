import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import NameScreen        from '../components/NameScreen';
import CameraView        from '../components/CameraView';
import PreviewScreen     from '../components/PreviewScreen';
import UploadScreen      from '../components/UploadScreen';
import BatchUploadScreen from '../components/BatchUploadScreen';
import SuccessScreen     from '../components/SuccessScreen';
import { getEvent }      from '../api';

const NAME_KEY = 'picachoo_guest_name';

const SCREENS = {
  NAME: 'name', CAMERA: 'camera',
  PREVIEW: 'preview', BATCH: 'batch',
  UPLOAD: 'upload', SUCCESS: 'success', ERROR: 'error',
};

export default function GuestPage() {
  const { eventCode } = useParams();

  const [event,        setEvent]        = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError,   setEventError]   = useState('');
  const [screen,       setScreen]       = useState(() =>
    sessionStorage.getItem(NAME_KEY) ? SCREENS.CAMERA : SCREENS.NAME,
  );
  const [guestName,    setGuestName]    = useState(() => sessionStorage.getItem(NAME_KEY) ?? '');
  const [pendingBlob,  setPendingBlob]  = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [uploadError,  setUploadError]  = useState('');
  const [bgUpload,     setBgUpload]     = useState(null); // { blob, guestName } when uploading in background

  useEffect(() => {
    getEvent(eventCode)
      .then(setEvent)
      .catch(err => setEventError(err.message))
      .finally(() => setEventLoading(false));
  }, [eventCode]);

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
      setPendingBlob(files[0]);
      setScreen(SCREENS.UPLOAD);
    } else {
      setPendingFiles(files);
      setScreen(SCREENS.BATCH);
    }
  }, []);

  const handlePreviewUpload = useCallback(() => {
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleRetake = useCallback(() => {
    setPendingBlob(null);
    setPendingFiles(null);
    setScreen(SCREENS.CAMERA);
  }, []);

  const handleTakeAnother = useCallback(() => {
    // Keep the current upload running in background; go back to camera
    setBgUpload({ blob: pendingBlob, guestName });
    setPendingBlob(null);
    setScreen(SCREENS.CAMERA);
  }, [pendingBlob, guestName]);

  const uploadedBlobRef = useRef(null);

  const handleSuccess = useCallback(() => {
    uploadedBlobRef.current = pendingBlob;
    setPendingBlob(null);
    setPendingFiles(null);
    setScreen(SCREENS.SUCCESS);
  }, [pendingBlob]);

  const uploadsLocked = event && event.wall_upload_mode === 'host_only';

  // Wait for event data before showing NameScreen so the event name
  // doesn't flash from code → name after load
  if (eventLoading && screen === SCREENS.NAME) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
           style={{ background: 'linear-gradient(140deg,#6045f4 0%,#7060f6 45%,#53e6d4 100%)' }}>
        <svg className="w-10 h-10 animate-spin text-white/60" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

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
           style={{ background: 'linear-gradient(140deg,#6045f4 0%,#7060f6 45%,#53e6d4 100%)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/15">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
            <rect x="5" y="11" width="14" height="10" rx="2"/>
            <path d="M8 11V7a4 4 0 018 0v4"/>
          </svg>
        </div>
        <div className="space-y-2">
          {event?.name && (
            <p className="text-white/70"
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
    <div className="fixed inset-x-0 top-0 flex flex-col overflow-hidden bg-black"
         style={{ height: '100dvh' }}>
      {screen === SCREENS.NAME && (
        <NameScreen
          eventName={event?.name ?? eventCode}
          hostMessage={event?.description ?? ''}
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

      {screen === SCREENS.UPLOAD && pendingBlob && (
        <UploadScreen
          blob={pendingBlob}
          guestName={guestName}
          eventCode={eventCode}
          eventName={event?.name}
          hostTier={event?.effective_tier ?? event?.host_tier ?? 'free'}
          onSuccess={handleSuccess}
          onError={msg => { setUploadError(msg); setScreen(SCREENS.ERROR); }}
          onRetake={handleRetake}
          onTakeAnother={handleTakeAnother}
        />
      )}

      {screen === SCREENS.BATCH && pendingFiles && (
        <BatchUploadScreen
          files={pendingFiles}
          guestName={guestName}
          eventCode={eventCode}
          eventName={event?.name}
          hostTier={event?.effective_tier ?? event?.host_tier ?? 'free'}
          onSuccess={handleSuccess}
          onError={msg => { setUploadError(msg); setScreen(SCREENS.ERROR); }}
          onCancel={handleRetake}
        />
      )}

      {screen === SCREENS.SUCCESS && (
        <SuccessScreen
          eventName={event?.name}
          blob={uploadedBlobRef.current}
          onSnapAnother={() => { uploadedBlobRef.current = null; setPendingBlob(null); setPendingFiles(null); setScreen(SCREENS.CAMERA); }}
        />
      )}

      {/* Background upload — mounted hidden so the XHR keeps running while user takes another photo */}
      {bgUpload && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <UploadScreen
            blob={bgUpload.blob}
            guestName={bgUpload.guestName}
            eventCode={eventCode}
            eventName={event?.name}
            hostTier={event?.effective_tier ?? event?.host_tier ?? 'free'}
            onSuccess={() => setBgUpload(null)}
            onError={() => setBgUpload(null)}
            onRetake={() => setBgUpload(null)}
          />
        </div>
      )}

      {/* Floating pill shown on camera/preview when a background upload is in progress */}
      {bgUpload && (screen === SCREENS.CAMERA || screen === SCREENS.PREVIEW) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white"
             style={{ background: 'rgba(96,69,244,0.85)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Uploading previous photo…
        </div>
      )}

      {screen === SCREENS.ERROR && (
        <div className="flex flex-col items-center justify-center min-h-full bg-black px-6 gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="w-8 h-8">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-white text-lg font-semibold">Upload failed</p>
            <p className="text-zinc-400 text-sm leading-snug">{uploadError}</p>
          </div>
          <button onClick={handleRetake}
            className="w-full max-w-xs rounded-2xl py-4 text-lg font-semibold text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #6045f4, #53e6d4)' }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
