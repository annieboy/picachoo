import { useState, useCallback } from 'react';
import NameScreen from './components/NameScreen';
import CameraView from './components/CameraView';
import FilePicker from './components/FilePicker';
import UploadScreen from './components/UploadScreen';
import SuccessScreen from './components/SuccessScreen';

// Event code comes from the URL path: /events/:eventCode
// e.g. https://picachoo.app/events/WEDD24
function getEventCode() {
  const match = window.location.pathname.match(/\/events\/([A-Z0-9]+)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

// Persist the guest name in sessionStorage so they don't re-type it if they
// navigate back. Cleared when the tab closes.
const NAME_KEY = 'picachoo_guest_name';

const SCREENS = {
  NAME:    'name',
  CAMERA:  'camera',
  GALLERY: 'gallery',
  UPLOAD:  'upload',
  SUCCESS: 'success',
  ERROR:   'error',
};

export default function App() {
  const eventCode = getEventCode();

  const [screen, setScreen] = useState(() => {
    if (!eventCode) return SCREENS.ERROR;
    const saved = sessionStorage.getItem(NAME_KEY);
    return saved ? SCREENS.CAMERA : SCREENS.NAME;
  });

  const [guestName, setGuestName] = useState(
    () => sessionStorage.getItem(NAME_KEY) ?? '',
  );
  const [pendingBlob, setPendingBlob] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // ── Screen transitions ──────────────────────────────────────────────────────

  const handleNameConfirm = useCallback(name => {
    sessionStorage.setItem(NAME_KEY, name);
    setGuestName(name);
    setScreen(SCREENS.CAMERA);
  }, []);

  // CameraView calls this with a Blob after snap, or null to request gallery.
  const handleCapture = useCallback(blob => {
    if (!blob) {
      setScreen(SCREENS.GALLERY);
      return;
    }
    setPendingBlob(blob);
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleFileChosen = useCallback(file => {
    setPendingBlob(file);
    setScreen(SCREENS.UPLOAD);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setScreen(SCREENS.SUCCESS);
  }, []);

  const handleUploadError = useCallback(message => {
    setUploadError(message);
    setScreen(SCREENS.ERROR);
  }, []);

  const handleRetake = useCallback(() => {
    setPendingBlob(null);
    setScreen(SCREENS.CAMERA);
  }, []);

  const handleSnapAnother = useCallback(() => {
    setPendingBlob(null);
    setScreen(SCREENS.CAMERA);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    // Full-screen black shell — everything inside fills the viewport.
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
      {screen === SCREENS.NAME && (
        <NameScreen
          eventName={eventCode ? `Event: ${eventCode}` : undefined}
          onConfirm={handleNameConfirm}
        />
      )}

      {screen === SCREENS.CAMERA && (
        <CameraView
          guestName={guestName}
          onCapture={handleCapture}
        />
      )}

      {screen === SCREENS.GALLERY && (
        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <FilePicker
            guestName={guestName}
            reason="gallery"
            onFile={handleFileChosen}
          />
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
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          onRetake={handleRetake}
        />
      )}

      {screen === SCREENS.SUCCESS && (
        <SuccessScreen onSnapAnother={handleSnapAnother} />
      )}

      {screen === SCREENS.ERROR && (
        <ErrorScreen
          message={uploadError || (!eventCode ? 'No event code found in the URL.' : '')}
          onRetry={uploadError ? handleRetake : undefined}
        />
      )}
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-black px-6 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"
             className="w-8 h-8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-white text-lg font-semibold">Something went wrong</p>
        <p className="text-zinc-400 text-sm leading-snug">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            w-full max-w-xs rounded-2xl py-4 text-lg font-semibold
            bg-violet-500 text-white
            active:scale-95 transition-transform duration-100
          "
        >
          Try again
        </button>
      )}
    </div>
  );
}
