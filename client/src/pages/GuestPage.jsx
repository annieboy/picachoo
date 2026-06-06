import { useState, useCallback, useEffect } from 'react';
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
  const [eventError,   setEventError]   = useState('');
  const [screen,       setScreen]       = useState(() =>
    sessionStorage.getItem(NAME_KEY) ? SCREENS.CAMERA : SCREENS.NAME,
  );
  const [guestName,    setGuestName]    = useState(() => sessionStorage.getItem(NAME_KEY) ?? '');
  const [pendingBlob,  setPendingBlob]  = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [uploadError,  setUploadError]  = useState('');

  useEffect(() => {
    getEvent(eventCode).then(setEvent).catch(err => setEventError(err.message));
  }, [eventCode]);

  const handleNameConfirm = useCallback(name => {
    sessionStorage.setItem(NAME_KEY, name);
    setGuestName(name);
    setScreen(SCREENS.CAMERA);
  }, []);

  // Camera snapped a photo → show preview (user can retake or upload)
  const handleCapture = useCallback(blob => {
    setPendingBlob(blob);
    setScreen(SCREENS.PREVIEW);
  }, []);

  // Gallery files selected → skip preview, upload immediately
  const handleGalleryFiles = useCallback(files => {
    if (files.length === 1) {
      setPendingBlob(files[0]);
      setScreen(SCREENS.UPLOAD);
    } else {
      setPendingFiles(files);
      setScreen(SCREENS.BATCH);
    }
  }, []);

  // Preview confirmed → upload
  const handlePreviewUpload = useCallback(() => {
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleRetake = useCallback(() => {
    setPendingBlob(null);
    setPendingFiles(null);
    setScreen(SCREENS.CAMERA);
  }, []);

  // After upload: return directly to camera (not a blocking success screen)
  const handleSuccess = useCallback(() => {
    setPendingBlob(null);
    setPendingFiles(null);
    setScreen(SCREENS.SUCCESS);
  }, []);

  if (eventError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black px-6 gap-4 text-center">
        <p className="text-5xl">📷</p>
        <p className="text-white text-xl font-semibold">Event not found</p>
        <p className="text-zinc-400 text-sm">{eventError}</p>
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
          guestName={guestName}
          eventName={event?.name}
          onCapture={handleCapture}
          onGalleryFiles={handleGalleryFiles}
        />
      )}

      {screen === SCREENS.PREVIEW && pendingBlob && (
        <PreviewScreen
          blob={pendingBlob}
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
          onSnapAnother={() => { setPendingBlob(null); setPendingFiles(null); setScreen(SCREENS.CAMERA); }}
        />
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
            style={{ background: 'linear-gradient(135deg, #5B52E8, #29BFBF)' }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
