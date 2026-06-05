import { useState, useEffect } from 'react';
import { registerHost, createEvent, getHost, googleAuthUrl, dropboxAuthUrl } from '../api';
import QRCard from '../components/QRCard';

const HOST_KEY = 'picachoo_host_id';

export default function DashboardPage() {
  const [hostId, setHostId]   = useState(() => localStorage.getItem(HOST_KEY) ?? '');
  const [host, setHost]       = useState(null);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName]   = useState('');
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    if (!hostId) return;
    getHost(hostId)
      .then(({ host, events }) => { setHost(host); setEvents(events); })
      .catch(() => { localStorage.removeItem(HOST_KEY); setHostId(''); });
  }, [hostId]);

  const params   = new URLSearchParams(window.location.search);
  const linked   = params.get('linked');   // 'google' | 'dropbox'
  const oauthErr = params.get('error');

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const h = await registerHost({ email: regEmail, displayName: regName });
      localStorage.setItem(HOST_KEY, h.id);
      setHostId(h.id); setHost(h);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!eventName.trim()) return;
    setError(''); setLoading(true);
    try {
      const ev = await createEvent({ hostId, name: eventName.trim() });
      setEvents(prev => [ev, ...prev]);
      setEventName('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function signOut() {
    localStorage.removeItem(HOST_KEY);
    setHostId(''); setHost(null); setEvents([]);
  }

  // ── Registration ─────────────────────────────────────────────────────────────
  if (!hostId) {
    return (
      <Shell>
        <div className="auth-card">
          <div className="auth-logo">pica<span>choo</span></div>
          <h1>Welcome</h1>
          <p className="auth-sub">Create events and receive photos directly to your cloud storage.</p>
          <form onSubmit={handleRegister}>
            <label>
              Email
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                placeholder="you@example.com" required />
            </label>
            <label>
              Your name
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                placeholder="Jane Smith" required />
            </label>
            {error && <p className="msg-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'One moment…' : 'Get started →'}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Top bar */}
      <div className="dash-topbar">
        <div>
          <p className="dash-welcome">Welcome back, <strong>{host?.display_name}</strong></p>
          <p className="dash-email">{host?.email}</p>
        </div>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </div>

      {/* OAuth feedback banners */}
      {linked === 'google' && (
        <div className="banner-success">✓ Google Drive connected successfully!</div>
      )}
      {linked === 'dropbox' && (
        <div className="banner-success">✓ Dropbox connected successfully!</div>
      )}
      {oauthErr && (
        <div className="banner-error">
          {oauthErr === 'dropbox_auth_denied' ? 'Dropbox authorisation was cancelled.' : 'Google auth failed: ' + oauthErr}
        </div>
      )}

      {/* Create event */}
      <section className="dash-section">
        <h2>New event</h2>
        <form className="create-form" onSubmit={handleCreateEvent}>
          <input
            type="text"
            placeholder="e.g. Sarah & Tom's Wedding"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading || !eventName.trim()}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </form>
        {error && <p className="msg-error">{error}</p>}
      </section>

      {/* Events */}
      <section className="dash-section">
        <h2>Your events {events.length > 0 && <span className="badge">{events.length}</span>}</h2>
        {events.length === 0
          ? <p className="empty-state">Create your first event above to get started.</p>
          : events.map(ev => <EventCard key={ev.id} event={ev} hostId={hostId} />)
        }
      </section>
    </Shell>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, hostId }) {
  const [showQR, setShowQR] = useState(false);
  const provider = event.linked_provider; // 'google_drive' | 'dropbox' | null

  const statusColors = {
    active: 'status-active',
    draft:  'status-draft',
    closed: 'status-closed',
  };

  return (
    <div className="event-card">
      {/* Header row */}
      <div className="event-card-header">
        <div>
          <h3>{event.name}</h3>
          <span className={`status-pill ${statusColors[event.status] ?? ''}`}>
            {event.status}
          </span>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setShowQR(v => !v)}>
          {showQR ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {/* Wall link */}
      <a href={`/e/${event.join_code}/wall`} target="_blank" rel="noreferrer" className="wall-link">
        <span>📺</span> Open Live Wall
      </a>

      {/* Storage section */}
      {provider ? (
        <LinkedBadge provider={provider} account={event.linked_account} />
      ) : (
        <StoragePicker hostId={hostId} eventId={event.id} />
      )}

      {/* QR panel */}
      {showQR && <QRCard event={event} />}
    </div>
  );
}

// ── Connected badge ───────────────────────────────────────────────────────────

function LinkedBadge({ provider, account }) {
  const isDropbox = provider === 'dropbox';
  return (
    <p className="drive-linked">
      {isDropbox ? <DropboxIcon /> : <DriveIcon />}
      {isDropbox ? 'Dropbox' : 'Google Drive'} connected
      {account ? ` · ${account}` : ''}
    </p>
  );
}

// ── Storage picker (shown when nothing is connected) ──────────────────────────

function StoragePicker({ hostId, eventId }) {
  return (
    <div className="storage-picker">
      <p className="storage-picker-label">Connect cloud storage to start receiving photos</p>
      <div className="storage-picker-btns">
        <a href={googleAuthUrl({ hostId, eventId })} className="btn-drive">
          <DriveIcon /> Google Drive
        </a>
        <a href={dropboxAuthUrl({ hostId, eventId })} className="btn-dropbox">
          <DropboxIcon /> Dropbox
        </a>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function DriveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="drive-icon" aria-hidden="true">
      <path d="M6.28 3l5.72 9.9L6.28 21H2l5.72-9.9L2 3h4.28zM22 21h-4.28l-5.72-9.9L17.72 3H22l-5.72 9.9L22 21zm-8.14-9.9L8.14 3h7.72l5.72 9.9-5.72 9.9H8.14l5.72-9.9z"/>
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="drive-icon" aria-hidden="true">
      <path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4L6 2zm12 0l-6 4 6 4-6 4 6 4 6-4-6-4 6-4-6-4zM6 16.5L12 20l6-3.5-6-4-6 4z"/>
    </svg>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ children }) {
  return (
    <div className="dash-shell">
      <header className="dash-header">
        <span className="logo">pica<span>choo</span></span>
      </header>
      <main className="dash-main">{children}</main>
    </div>
  );
}
