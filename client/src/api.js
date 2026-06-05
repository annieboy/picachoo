// Central place for all API calls — always points to the live Vercel backend.
// VITE_API_BASE is set to "" in production (same origin) and can be overridden
// locally via client/.env if needed.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function registerHost({ email, displayName }) {
  const res = await fetch(`${API_BASE}/api/hosts/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to register host');
  return data.host; // { id, email, display_name }
}

export async function createEvent({ hostId, name }) {
  const res = await fetch(`${API_BASE}/api/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to create event');
  return data.event; // { id, join_code, guestUrl, ... }
}

export async function getEvent(eventCode) {
  // Guest-facing lookup by join_code — no auth needed
  const res = await fetch(`${API_BASE}/api/events/by-code/${eventCode}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Event not found');
  return data.event; // { id, name, join_code, status }
}

export async function getHost(hostId) {
  const res = await fetch(`${API_BASE}/api/hosts/${hostId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load host');
  return data; // { host, events[] }
}

// Returns the Google OAuth URL for linking Drive to an event.
export function googleAuthUrl({ hostId, eventId }) {
  return `${API_BASE}/api/auth/google?hostId=${hostId}&eventId=${eventId}`;
}

// Returns the Dropbox OAuth URL for linking Dropbox to an event.
export function dropboxAuthUrl({ hostId, eventId }) {
  return `${API_BASE}/api/auth/dropbox?hostId=${hostId}&eventId=${eventId}`;
}
