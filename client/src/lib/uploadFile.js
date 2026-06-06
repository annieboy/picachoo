import imageCompression from 'browser-image-compression';

const API_BASE      = import.meta.env.VITE_API_BASE ?? '';
const MAX_SIZE_MB   = 2.5;
const MAX_DIMENSION = 2048;

async function compress(blob) {
  const file = blob instanceof File
    ? blob
    : new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
  if (file.size / 1024 / 1024 <= MAX_SIZE_MB) return file;
  const out = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB, maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true, fileType: 'image/jpeg',
  });
  return new File([out], out.name, { type: 'image/jpeg' });
}

/**
 * Upload a single blob.
 * @param {{ blob, guestName, eventCode, hostTier, onProgress, signal }} opts
 * onProgress(pct: 0–100)
 * Returns { ok: true } or throws.
 */
export async function uploadFile({ blob, guestName, eventCode, hostTier = 'free', onProgress, signal }) {
  const report = p => { if (!signal?.aborted) onProgress?.(p); };

  // 1. Try direct upload session (Drive / OneDrive)
  report(5);
  let session = null;
  try {
    const res = await fetch(`${API_BASE}/api/events/${eventCode}/upload-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName, mimeType: blob.type || 'image/jpeg' }),
      signal,
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.direct && data.uploadUrl) session = data;
    }
  } catch { /* fall through */ }

  if (signal?.aborted) return;

  if (session) {
    const isPro = (session.hostTier ?? hostTier) === 'pro';
    let payload = blob;

    if (!isPro) {
      report(10);
      payload = await compress(blob);
      if (signal?.aborted) return;
    }

    report(isPro ? 10 : 35);

    const headers = { 'Content-Type': payload.type || 'image/jpeg' };
    if (session.provider === 'onedrive')
      headers['Content-Range'] = `bytes 0-${payload.size - 1}/${payload.size}`;

    const startPct = isPro ? 10 : 35;
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (signal) signal.addEventListener('abort', () => xhr.abort());
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) report(startPct + Math.round((e.loaded / e.total) * (isPro ? 80 : 55)));
      });
      xhr.addEventListener('load', () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve(JSON.parse(xhr.responseText || '{}'))
          : reject(new Error(`Upload failed (${xhr.status})`)),
      );
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Cancelled')));
      xhr.open('PUT', session.uploadUrl);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.send(payload);
    });

    if (signal?.aborted) return;
    report(95);

    const recRes = await fetch(`${API_BASE}/api/events/${eventCode}/record-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: undefined, filename: session.filename, guestName }),
      signal,
    });
    const recBody = await recRes.json().catch(() => ({}));
    if (!recRes.ok) throw new Error(recBody.error ?? 'Failed to save');
    report(100);
    return { ok: true };
  }

  // 2. Server-side path (Dropbox / fallback)
  report(10);
  const file = await compress(blob);
  if (signal?.aborted) return;
  report(40);

  const form = new FormData();
  form.append('photo', file, file.name);
  form.append('guestName', guestName);
  const res  = await fetch(`${API_BASE}/api/events/${eventCode}/upload`, { method: 'POST', body: form, signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
  report(100);
  return { ok: true };
}
