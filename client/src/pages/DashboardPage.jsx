import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  setAuthToken, getOrCreateHost, createEvent,
  googleAuthUrl, dropboxAuthUrl, oneDriveAuthUrl,
  linkGoogleDriveFromSession,
} from '../api';
import QRCard from '../components/QRCard';

// ── Auth bootstrap ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [authState, setAuthState] = useState('loading'); // loading | unauthenticated | authenticated
  const [session,   setSession]   = useState(null);
  const [host,      setHost]      = useState(null);
  const [events,    setEvents]    = useState([]);
  const [authError, setAuthError] = useState('');

  // Sync Supabase session → backend host record
  const syncHost = useCallback(async (sess) => {
    if (!sess) { setAuthState('unauthenticated'); return; }

    setAuthToken(sess.access_token);

    try {
      const { host, events } = await getOrCreateHost();
      setHost(host);
      setEvents(events);
      setSession(sess);
      setAuthState('authenticated');
    } catch (err) {
      setAuthError(err.message);
      setAuthState('unauthenticated');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => syncHost(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      syncHost(session);
    });

    return () => subscription.unsubscribe();
  }, [syncHost]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthToken(null);
    setHost(null); setEvents([]); setSession(null);
    setAuthState('unauthenticated');
  };

  // ── Routing by state ──────────────────────────────────────────────────────

  if (authState === 'loading') return <LoadingScreen />;

  if (authState === 'unauthenticated') {
    return <SignInScreen error={authError} onClearError={() => setAuthError('')} />;
  }

  return (
    <Dashboard
      session={session}
      host={host}
      events={events}
      setEvents={setEvents}
      signOut={signOut}
    />
  );
}

// ── Sign-in screen ────────────────────────────────────────────────────────────

function SignInScreen({ error, onClearError }) {
  const [email,     setEmail]     = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [localErr,  setLocalErr]  = useState('');

  const params  = new URLSearchParams(window.location.search);
  const oauthErr = params.get('error');

  async function handleGoogleSignIn() {
    setLoading(true); setLocalErr('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Request drive.file so we can auto-link Drive after sign-in
        scopes: 'https://www.googleapis.com/auth/drive.file',
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setLocalErr(error.message); setLoading(false); }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setLocalErr('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setLocalErr(error.message);
    else setMagicSent(true);
    setLoading(false);
  }

  return (
    <Shell>
      <div className="auth-card">
        <div className="auth-logo">pica<span>choo</span></div>
        <h1>Welcome</h1>
        <p className="auth-sub">Sign in to create events and receive photos in your cloud storage.</p>

        {(error || oauthErr || localErr) && (
          <p className="msg-error">
            {error || localErr || (oauthErr === 'google_auth_denied' ? 'Google sign-in was cancelled.' : oauthErr)}
          </p>
        )}

        {magicSent ? (
          <div className="banner-success">
            ✓ Check your email — we sent a sign-in link to <strong>{email}</strong>.
          </div>
        ) : (
          <>
            {/* Google sign-in */}
            <button
              className="btn-google"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="auth-divider"><span>or</span></div>

            {/* Email magic link */}
            <form onSubmit={handleMagicLink}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); onClearError(); }}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <button type="submit" className="btn-primary" disabled={loading || !email.trim()}>
                {loading ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
          </>
        )}
      </div>
    </Shell>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ session, host, events, setEvents, signOut }) {
  const [eventName, setEventName] = useState('');
  const [creating,  setCreating]  = useState(false);
  const [error,     setError]     = useState('');

  const params   = new URLSearchParams(window.location.search);
  const linked   = params.get('linked');
  const oauthErr = params.get('error');

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!eventName.trim()) return;
    setError(''); setCreating(true);
    try {
      const { event } = await createEvent({ name: eventName.trim() });

      // If the host signed in with Google and a provider token is available,
      // auto-link Google Drive to the new event — no extra click needed.
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'google') {
        try {
          await linkGoogleDriveFromSession({
            eventId:      event.id,
            accessToken:  session.provider_token,
            refreshToken: session.provider_refresh_token ?? null,
            expiryDate:   session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          });
          event.linked_provider = 'google_drive';
          event.linked_account  = session.user.email;
        } catch (e) {
          console.warn('Auto-link Drive failed (non-fatal):', e.message);
        }
      }

      setEvents(prev => [event, ...prev]);
      setEventName('');
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  }

  return (
    <Shell>
      <div className="dash-topbar">
        <div>
          <p className="dash-welcome">Welcome back, <strong>{host?.display_name}</strong></p>
          <p className="dash-email">{host?.email}</p>
        </div>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </div>

      {linked === 'google'   && <div className="banner-success">✓ Google Drive connected!</div>}
      {linked === 'dropbox'  && <div className="banner-success">✓ Dropbox connected!</div>}
      {linked === 'onedrive' && <div className="banner-success">✓ OneDrive connected!</div>}
      {oauthErr && (
        <div className="banner-error">
          {oauthErr === 'dropbox_auth_denied'  ? 'Dropbox authorisation was cancelled.'  :
           oauthErr === 'onedrive_auth_denied' ? 'OneDrive authorisation was cancelled.' :
           'Google auth failed: ' + oauthErr}
        </div>
      )}

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
          <button type="submit" className="btn-primary" disabled={creating || !eventName.trim()}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
        {error && <p className="msg-error">{error}</p>}
      </section>

      <section className="dash-section">
        <h2>Your events {events.length > 0 && <span className="badge">{events.length}</span>}</h2>
        {events.length === 0
          ? <p className="empty-state">Create your first event above to get started.</p>
          : events.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              token={session?.access_token}
              loginHint={session?.user?.app_metadata?.provider === 'google' ? session?.user?.email : undefined}
            />
          ))
        }
      </section>
    </Shell>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, token, loginHint }) {
  const [showQR, setShowQR]     = useState(false);
  const [ev, setEv]             = useState(event);
  const provider = ev.linked_provider;

  const statusColors = { active: 'status-active', draft: 'status-draft', closed: 'status-closed' };

  return (
    <div className="event-card">
      <div className="event-card-header">
        <div>
          <h3>{ev.name}</h3>
          <span className={`status-pill ${statusColors[ev.status] ?? ''}`}>{ev.status}</span>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setShowQR(v => !v)}>
          {showQR ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      <a href={`/e/${ev.join_code}/wall`} target="_blank" rel="noreferrer" className="wall-link">
        <span>📺</span> Open Live Wall
      </a>

      {provider ? (
        <LinkedBadge provider={provider} account={ev.linked_account} />
      ) : (
        <StoragePicker eventId={ev.id} token={token} loginHint={loginHint} />
      )}

      {showQR && <QRCard event={ev} />}
    </div>
  );
}

// ── Storage components ────────────────────────────────────────────────────────

function LinkedBadge({ provider, account }) {
  const labels = { google_drive: 'Google Drive', dropbox: 'Dropbox', onedrive: 'OneDrive' };
  const icons  = { google_drive: <DriveIcon />, dropbox: <DropboxIcon />, onedrive: <OneDriveIcon /> };
  return (
    <p className="drive-linked">
      {icons[provider] ?? <DriveIcon />}
      {labels[provider] ?? provider} connected{account ? ` · ${account}` : ''}
    </p>
  );
}

function StoragePicker({ eventId, token, loginHint }) {
  return (
    <div className="storage-picker">
      <p className="storage-picker-label">Connect cloud storage to receive photos</p>
      <div className="storage-picker-btns">
        <a href={googleAuthUrl({ eventId, loginHint, token })} className="btn-drive">
          <DriveIcon /> Google Drive
        </a>
        <a href={dropboxAuthUrl({ eventId, token })} className="btn-dropbox">
          <DropboxIcon /> Dropbox
        </a>
        <a href={oneDriveAuthUrl({ eventId, token })} className="btn-onedrive">
          <OneDriveIcon /> OneDrive
        </a>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="drive-icon" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

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

function OneDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="drive-icon" aria-hidden="true">
      <path d="M10.5 18H4a3 3 0 0 1-.4-5.97A5 5 0 0 1 13.4 8.1 3.5 3.5 0 0 1 20 11a3 3 0 0 1-.5 5.95L10.5 18z"/>
    </svg>
  );
}

// ── Shared layout ─────────────────────────────────────────────────────────────

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

function LoadingScreen() {
  return (
    <Shell>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    </Shell>
  );
}
