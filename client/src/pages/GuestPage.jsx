import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NameScreen        from '../components/NameScreen';
import CameraView        from '../components/CameraView';
import FilePicker        from '../components/FilePicker';
import PreviewScreen     from '../components/PreviewScreen';
import UploadScreen      from '../components/UploadScreen';
import BatchUploadScreen from '../components/BatchUploadScreen';
import SuccessScreen     from '../components/SuccessScreen';
import { getEvent }      from '../api';

const NAME_KEY = 'picachoo_guest_name';

const SCREENS = {
  NAME: 'name', CAMERA: 'camera', GALLERY: 'gallery',
  PREVIEW: 'preview', BATCH: 'batch',
  UPLOAD: 'upload', SUCCESS: 'success', ERROR: 'error',
};

export default function GuestPage() {
  const { eventCode } = useParams();

  const [event, setEvent]           = useState(null);
  const [eventError, setEventError] = useState('');
  const [screen, setScreen]         = useState(() =>
    sessionStorage.getItem(NAME_KEY) ? SCREENS.CAMERA : SCREENS.NAME,
  );
  const [guestName, setGuestName]     = useState(() => sessionStorage.getItem(NAME_KEY) ?? '');
  const [pendingBlob, setPendingBlob] = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    getEvent(eventCode)
      .then(setEvent)
      .catch(err => setEventError(err.message));
  }, [eventCode]);

  const handleNameConfirm = useCallback(name => {
    sessionStorage.setItem(NAME_KEY, name);
    setGuestName(name);
    setScreen(SCREENS.CAMERA);
  }, []);

  // Camera captured a single blob → go to preview
  const handleCapture = useCallback(blob => {
    if (!blob) { setScreen(SCREENS.GALLERY); return; }
    setPendingBlob(blob);
    setScreen(SCREENS.PREVIEW);
  }, []);

  // Gallery picked a single file → preview; multiple → batch
  const handleFileChosen = useCallback(file => {
    setPendingBlob(file);
    setScreen(SCREENS.PREVIEW);
  }, []);

  const handleFilesChosen = useCallback(files => {
    setPendingFiles(files);
    setScreen(SCREENS.BATCH);
  }, []);

  // Preview → Upload (confirmed by user or auto-upload countdown)
  const handlePreviewUpload = useCallback(() => {
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleRetake = useCallback(() => {
    setPendingBlob(null);
    setPendingFiles(null);
    setScreen(SCREENS.CAMERA);
  }, []);

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
        <CameraView guestName={guestName} onCapture={handleCapture} />
      )}

      {screen === SCREENS.GALLERY && (
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <FilePicker
            reason="gallery"
            onFile={handleFileChosen}
            onFiles={handleFilesChosen}
          />
          <button
            onClick={() => setScreen(SCREENS.CAMERA)}
            className="mt-6 text-zinc-500 text-sm underline underline-offset-2"
          >
            ← Back to camera
          </button>
        </div>
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
          hostTier={event?.host_tier ?? 'free'}
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
          hostTier={event?.host_tier ?? 'free'}
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
            className="w-full max-w-xs rounded-2xl py-4 text-lg font-semibold bg-violet-500 text-white active:scale-95 transition-transform">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
