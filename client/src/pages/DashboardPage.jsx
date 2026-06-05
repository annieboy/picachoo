import { useState, useEffect } from 'react';
import { registerHost, createEvent, getHost, googleAuthUrl } from '../api';

const HOST_KEY = 'picachoo_host_id';

export default function DashboardPage() {
  const [hostId, setHostId]     = useState(() => localStorage.getItem(HOST_KEY) ?? '');
  const [host, setHost]         = useState(null);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Registration form
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName]   = useState('');

  // New event form
  const [eventName, setEventName] = useState('');

  // Load host data if we already have an id
  useEffect(() => {
    if (!hostId) return;
    getHost(hostId)
      .then(({ host, events }) => { setHost(host); setEvents(events); })
      .catch(() => { localStorage.removeItem(HOST_KEY); setHostId(''); });
  }, [hostId]);

  // Show success/error from OAuth redirect
  const params   = new URLSearchParams(window.location.search);
  const linked   = params.get('linked');
  const oauthErr = params.get('error');

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const h = await registerHost({ email: regEmail, displayName: regName });
      localStorage.setItem(HOST_KEY, h.id);
      setHostId(h.id);
      setHost(h);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!eventName.trim()) return;
    setError(''); setLoading(true);
    try {
      const ev = await createEvent({ hostId, name: eventName.trim() });
      setEvents(prev => [ev, ...prev]);
      setEventName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Not registered yet ──────────────────────────────────────────────────────
  if (!hostId) {
    return (
      <Shell>
        <h1>Welcome to Picachoo</h1>
        <p>Register to create events and link your Google Drive.</p>
        <form onSubmit={handleRegister}>
          <label>
            Email
            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
          </label>
          <label>
            Display name
            <input type="text" value={regName} onChange={e => setRegName(e.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register / Sign in'}
          </button>
        </form>
      </Shell>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <Shell>
      <h1>Dashboard</h1>
      <p>Signed in as <strong>{host?.email}</strong></p>
      <button onClick={() => { localStorage.removeItem(HOST_KEY); setHostId(''); setHost(null); setEvents([]); }}>
        Sign out
      </button>

      {linked === 'google' && <p className="success">✓ Google Drive linked successfully!</p>}
      {oauthErr && <p className="error">Google auth failed: {oauthErr}</p>}

      {/* ── Create event ── */}
      <section>
        <h2>Create a new event</h2>
        <form onSubmit={handleCreateEvent}>
          <label>
            Event name
            <input
              type="text"
              placeholder="e.g. Sarah & Tom's Wedding"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading || !eventName.trim()}>
            {loading ? 'Creating…' : 'Create event'}
          </button>
        </form>
      </section>

      {/* ── Events list ── */}
      <section>
        <h2>Your events</h2>
        {events.length === 0 && <p>No events yet.</p>}
        {events.map(ev => (
          <EventCard key={ev.id} event={ev} hostId={hostId} />
        ))}
      </section>
    </Shell>
  );
}

function EventCard({ event, hostId }) {
  const driveLinked = !!event.linked_provider;
  const guestUrl    = `${window.location.origin}/e/${event.join_code}`;

  return (
    <div className="event-card">
      <h3>{event.name}</h3>
      <p>Code: <strong>{event.join_code}</strong> &nbsp;·&nbsp; Status: {event.status}</p>
      <p>
        Guest link:{' '}
        <a href={guestUrl} target="_blank" rel="noreferrer">{guestUrl}</a>
      </p>

      {driveLinked ? (
        <p className="success">✓ Google Drive linked ({event.linked_account})</p>
      ) : (
        <a
          href={googleAuthUrl({ hostId, eventId: event.id })}
          className="btn-drive"
        >
          Connect Google Drive
        </a>
      )}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="dashboard-shell">
      <header>
        <span className="logo">pica<span>choo</span></span>
      </header>
      <main>{children}</main>
    </div>
  );
}
