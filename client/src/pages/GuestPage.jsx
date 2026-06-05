import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import NameScreen    from '../components/NameScreen';
import CameraView    from '../components/CameraView';
import FilePicker    from '../components/FilePicker';
import UploadScreen  from '../components/UploadScreen';
import SuccessScreen from '../components/SuccessScreen';

const NAME_KEY = 'picachoo_guest_name';

const SCREENS = {
  NAME:    'name',
  CAMERA:  'camera',
  GALLERY: 'gallery',
  UPLOAD:  'upload',
  SUCCESS: 'success',
  ERROR:   'error',
};

export default function GuestPage() {
  // eventCode comes from the URL: /e/:eventCode
  const { eventCode } = useParams();

  const [screen, setScreen]     = useState(() =>
    sessionStorage.getItem(NAME_KEY) ? SCREENS.CAMERA : SCREENS.NAME,
  );
  const [guestName, setGuestName]   = useState(() => sessionStorage.getItem(NAME_KEY) ?? '');
  const [pendingBlob, setPendingBlob] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const handleNameConfirm = useCallback(name => {
    sessionStorage.setItem(NAME_KEY, name);
    setGuestName(name);
    setScreen(SCREENS.CAMERA);
  }, []);

  const handleCapture = useCallback(blob => {
    if (!blob) { setScreen(SCREENS.GALLERY); return; }
    setPendingBlob(blob);
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleFileChosen = useCallback(file => {
    setPendingBlob(file);
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleRetake = useCallback(() => {
    setPendingBlob(null);
    setScreen(SCREENS.CAMERA);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
      {screen === SCREENS.NAME && (
        <NameScreen
          eventName={eventCode}
          onConfirm={handleNameConfirm}
        />
      )}

      {screen === SCREENS.CAMERA && (
        <CameraView guestName={guestName} onCapture={handleCapture} />
      )}

      {screen === SCREENS.GALLERY && (
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <FilePicker reason="gallery" onFile={handleFileChosen} />
          <button
            onClick={() => setScreen(SCREENS.CAMERA)}
            className="mt-6 text-zinc-500 text-sm underline underline-offset-2"
          >
            ← Back to camera
          </button>
        </div>
      )}

      {screen === SCREENS.UPLOAD && pendingBlob && (
        <UploadScreen
          blob={pendingBlob}
          guestName={guestName}
          eventCode={eventCode}
          onSuccess={() => setScreen(SCREENS.SUCCESS)}
          onError={msg => { setUploadError(msg); setScreen(SCREENS.ERROR); }}
          onRetake={handleRetake}
        />
      )}

      {screen === SCREENS.SUCCESS && (
        <SuccessScreen onSnapAnother={() => { setPendingBlob(null); setScreen(SCREENS.CAMERA); }} />
      )}

      {screen === SCREENS.ERROR && (
        <div className="flex flex-col items-center justify-center min-h-full bg-black px-6 gap-6 text-center">
          <p className="text-white text-lg font-semibold">Something went wrong</p>
          <p className="text-zinc-400 text-sm">{uploadError}</p>
          <button
            onClick={handleRetake}
            className="w-full max-w-xs rounded-2xl py-4 text-lg font-semibold bg-violet-500 text-white active:scale-95 transition-transform"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
