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

/** Update the current host's display name. */
export function updateHostProfile({ displayName }) {
  return apiFetch('/api/hosts/me', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ displayName }),
  });
}

/** Permanently delete the current host's account and all their data. */
export function deleteAccount() {
  return apiFetch('/api/hosts/me', { method: 'DELETE' });
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

// ── Storage OAuth initiation ──────────────────────────────────────────────────
// JWT is sent in the Authorization header (never in the URL).
// Server creates a short-lived DB state token, returns the provider redirect URL.
// Client navigates to that URL — no sensitive data ever appears in the browser bar.

export function initiateOAuth({ provider, eventId, loginHint }) {
  return apiFetch('/api/auth/oauth-init', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ provider, eventId, loginHint }),
  }).then(d => d.redirectUrl);
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

// ── Co-hosts ──────────────────────────────────────────────────────────────────

export function getCohosts(eventId) {
  return apiFetch(`/api/events/${eventId}/cohosts`);
}

export function inviteCohost(eventId, email) {
  return apiFetch(`/api/events/${eventId}/cohosts`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  });
}

export function removeCohost(eventId, cohostId) {
  return apiFetch(`/api/events/${eventId}/cohosts/${cohostId}`, { method: 'DELETE' });
}

// ── Stripe checkout ───────────────────────────────────────────────────────────

/** Creates a Stripe Checkout session and returns the redirect URL.
 *  type: 'one_time_pass' | 'pro_annual' | 'business_annual'
 *  eventId: required for 'one_time_pass'
 */
/** Creates a Stripe payment intent / subscription and returns { clientSecret }.
 *  type: 'one_time_pass' | 'pro_annual' | 'business_annual'
 *  eventId: required for 'one_time_pass'
 */
export function createCheckoutIntent({ type, eventId }) {
  return apiFetch('/api/stripe/checkout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ type, eventId }),
  });
}

export function cancelSubscription() {
  return apiFetch('/api/stripe/cancel-subscription', { method: 'POST' });
}

export function applyPromoCode({ code, type }) {
  return apiFetch('/api/stripe/apply-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, type }),
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
