import { useRef } from 'react';

const REASON_COPY = {
  denied:      { title: 'Camera access denied', hint: 'You can still share a photo from your gallery or camera app.' },
  unavailable: { title: 'No camera found',      hint: 'Use your photo gallery or native camera app below.' },
  gallery:     { title: 'Choose a photo',        hint: 'Select from your gallery or take a new one.' },
};

// onFile(file) for single, onFiles([file, ...]) for multiple (gallery mode)
export default function FilePicker({ guestName, reason = 'gallery', onFile, onFiles }) {
  const inputRef = useRef(null);
  const { title, hint } = REASON_COPY[reason] ?? REASON_COPY.gallery;
  const isGallery = reason === 'gallery';

  function handleChange(e) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (isGallery && onFiles && files.length > 1) {
      onFiles(files);
    } else {
      onFile?.(files[0]);
    }
    e.target.value = '';
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
        {reason === 'denied' ? <LockIcon /> : <PhotoIcon />}
      </div>

      <div className="space-y-1">
        <p className="text-white text-lg font-semibold">{title}</p>
        <p className="text-zinc-400 text-sm leading-snug">{hint}</p>
      </div>

      {/* Gallery mode: no capture, allow multiple. Camera fallback: single via capture */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        {...(isGallery ? { multiple: true } : { capture: 'environment' })}
        className="sr-only"
        onChange={handleChange}
        aria-label="Select photo"
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="
          w-full rounded-2xl py-4 text-lg font-semibold
          bg-violet-500 text-white
          active:scale-95 transition-transform duration-100
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-black
        "
      >
        Open camera / gallery
      </button>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         className="w-8 h-8 text-zinc-400">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         className="w-8 h-8 text-zinc-400">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
