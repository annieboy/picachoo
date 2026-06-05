export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

// ── Auth header ───────────────────────────────────────────────────────────────
// Call setAuthToken() with the Supabase access token after sign-in.
// All authenticated API calls pick it up automatically.
let _token = null;
export function setAuthToken(token) { _token = token; }

function authHeaders() {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res  = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

// ── Host ──────────────────────────────────────────────────────────────────────

/** Creates or fetches the host record that maps to the signed-in Supabase user. */
export function getOrCreateHost() {
  return apiFetch('/api/hosts/me');
}

// ── Events ────────────────────────────────────────────────────────────────────

export function createEvent({ name }) {
  return apiFetch('/api/events/create', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name }),
  });
}

export function getEvent(eventCode) {
  return apiFetch(`/api/events/by-code/${eventCode}`).then(d => d.event);
}

export function updateEvent(eventId, patch) {
  return apiFetch(`/api/events/${eventId}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  });
}

export function deleteEvent(eventId) {
  return apiFetch(`/api/events/${eventId}`, { method: 'DELETE' });
}

// ── Storage OAuth URLs ────────────────────────────────────────────────────────
// These are browser-redirect URLs — the JWT is NOT sent as a header (it's a
// navigation, not a fetch). Instead the backend verifies ownership via
// the Supabase session cookie set by signInWithOAuth.
// We pass the JWT as a query param on the redirect so the backend can verify.

export function googleAuthUrl({ eventId, loginHint, token }) {
  const t = token ?? _token ?? '';
  const params = new URLSearchParams({ eventId });
  if (loginHint) params.set('loginHint', loginHint);
  // Embed the JWT so the redirect can be authenticated without a session cookie
  if (t) params.set('token', t);
  return `${API_BASE}/api/auth/google?${params}`;
}

export function dropboxAuthUrl({ eventId, token }) {
  const t = token ?? _token ?? '';
  const params = new URLSearchParams({ eventId });
  if (t) params.set('token', t);
  return `${API_BASE}/api/auth/dropbox?${params}`;
}

export function oneDriveAuthUrl({ eventId, token }) {
  const t = token ?? _token ?? '';
  const params = new URLSearchParams({ eventId });
  if (t) params.set('token', t);
  return `${API_BASE}/api/auth/onedrive?${params}`;
}

// ── Storage info ──────────────────────────────────────────────────────────────
export function getStorageInfo(eventId) {
  return apiFetch(`/api/storage/${eventId}/info`);
}

// ── Storage disconnect ────────────────────────────────────────────────────────
// provider: 'google' | 'dropbox' | 'onedrive'
export function disconnectStorage({ provider, eventId }) {
  return apiFetch(`/api/auth/${provider}`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ eventId }),
  });
}

// ── Google Drive auto-link ────────────────────────────────────────────────────
// Called after creating an event when the host signed in with Google.
// provider_token comes from the Supabase session (drive.file scope was requested).
export function linkGoogleDriveFromSession({ eventId, accessToken, refreshToken, expiryDate }) {
  return apiFetch('/api/auth/google/link-from-session', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ eventId, accessToken, refreshToken, expiryDate }),
  });
}
