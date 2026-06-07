import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  setAuthToken, getOrCreateHost, createEvent,
  initiateOAuth,
  disconnectStorage, getStorageInfo,
  updateEvent, deleteEvent,
  updateHostProfile, deleteAccount, cancelSubscription,
  getCohosts, inviteCohost, removeCohost,
  activateCheckout,
  uploadWallAsset, deleteWallAsset,
} from '../api';
import QRCard from '../components/QRCard';
import { QRCodeSVG } from 'qrcode.react';

const ONBOARDING_KEY = id => `picachoo_onboarded_${id}`;

// ── Auth bootstrap ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
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

  // After authentication, handle ?intent= (from pricing CTA) and ?checkout= (from Stripe)
  useEffect(() => {
    if (authState !== 'authenticated' || !host) return;
    const params  = new URLSearchParams(window.location.search);
    const intent  = params.get('intent');
    const eventId = params.get('eventId');
    if (!intent) return;

    // Clear the intent param from URL without a navigation flash
    const clean = new URL(window.location.href);
    clean.searchParams.delete('intent');
    clean.searchParams.delete('eventId');
    window.history.replaceState({}, '', clean.toString());

    // Redirect to checkout
    const q = new URLSearchParams({ type: intent });
    if (eventId) q.set('eventId', eventId);
    navigate(`/checkout?${q}`);
  }, [authState, host, navigate]);

  if (authState === 'loading') return <LoadingScreen />;

  if (authState === 'unauthenticated') {
    return <SignInScreen error={authError} onClearError={() => setAuthError('')} />;
  }

  // New user onboarding: show plan picker on first sign-in with no events
  const isNewUser = events.length === 0 && !localStorage.getItem(ONBOARDING_KEY(host?.id));
  if (isNewUser && host) {
    return (
      <OnboardingScreen
        host={host}
        onContinueFree={() => {
          localStorage.setItem(ONBOARDING_KEY(host.id), '1');
          // force re-render without onboarding
          setHost(h => ({ ...h }));
        }}
      />
    );
  }

  return (
    <Dashboard
      session={session}
      host={host}
      setHost={setHost}
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
        redirectTo: `${window.location.origin}/dashboard`,
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
        <h1>Sign in or create your account</h1>
        <p className="auth-sub">Create events, share a QR code, and receive photos directly in your cloud storage — no app needed for your guests.</p>

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
                {loading ? 'Sending…' : 'Continue with email'}
              </button>
            </form>
          </>
        )}
      </div>
    </Shell>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const TIER_LABEL = {
  free:             { label: 'Free',             cls: 'tier-free' },
  pro:              { label: 'Pro',              cls: 'tier-pro'  },
  pro_annual:       { label: 'Pro Annual',       cls: 'tier-pro'  },
  business_annual:  { label: 'Business Annual',  cls: 'tier-pro'  },
};

function Dashboard({ session, host, setHost, events, setEvents, signOut }) {
  const navigate    = useNavigate();
  const [tab,              setTab]             = useState('events');
  const [error,            setError]           = useState('');  // eslint-disable-line no-unused-vars
  const [showUpgrade,      setShowUpgrade]     = useState(false);
  const [filter,           setFilter]          = useState('all');
  const [search,           setSearch]          = useState('');
  const [showCreateModal,  setShowCreateModal] = useState(false);
  const [shareEvent,       setShareEvent]      = useState(null);

  const params        = new URLSearchParams(window.location.search);
  const linked        = params.get('linked');
  const oauthErr      = params.get('error');
  const checkoutOk    = params.get('checkout') === 'success';
  const checkoutType  = params.get('type');

  // After storage OAuth completes, clean the URL and reload events
  useEffect(() => {
    if (!linked) return;
    const clean = new URL(window.location.href);
    clean.searchParams.delete('linked');
    window.history.replaceState({}, '', clean.toString());
    // Reload events so the newly linked provider shows immediately
    getOrCreateHost().catch(() => {});
  }, [linked]); // eslint-disable-line react-hooks/exhaustive-deps

  // After checkout success (including Stripe hosted Checkout redirect-back)
  useEffect(() => {
    if (!checkoutOk) return;
    const sessionId = params.get('session_id');

    const clean = new URL(window.location.href);
    clean.searchParams.delete('checkout');
    clean.searchParams.delete('type');
    clean.searchParams.delete('session_id');
    window.history.replaceState({}, '', clean.toString());

    async function handleCheckoutReturn() {
      // If returning from hosted Checkout, activate immediately via session
      if (sessionId && checkoutType === 'subscription') {
        try {
          await activateCheckout({ type: checkoutType === 'subscription' ? 'pro_annual' : checkoutType, sessionId });
        } catch { /* webhook will still apply it */ }
      }
      // Poll briefly for host tier to update (webhook backup)
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const { host: fresh, events: freshEvents } = await getOrCreateHost();
          setHost(fresh);
          setEvents(freshEvents);
          if (fresh.tier !== 'free' || attempts >= 8) return;
        } catch { return; }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 1000);
    }
    handleCheckoutReturn();
  }, [checkoutOk]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEventUpdate(updated) {
    setEvents(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
  }

  function handleEventDelete(eventId) {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }

  const tier = host?.tier ?? 'free';
  const tierMeta = TIER_LABEL[tier] ?? TIER_LABEL.free;
  const isPro = tier !== 'free';

  const activeCount = events.filter(e => e.status === 'active').length;
  const pastCount   = events.filter(e => e.status !== 'active').length;
  const filteredEvents = events
    .filter(ev => filter === 'all' || (filter === 'active' ? ev.status === 'active' : ev.status !== 'active'))
    .filter(ev => !search.trim() || ev.name.toLowerCase().includes(search.toLowerCase()) || ev.join_code.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
    <Shell>
      {/* Top bar */}
      <div className="dash-topbar">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Avatar circle with user initials */}
          <div className="dash-avatar">
            {(host?.display_name ?? 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="dash-welcome">Good to see you, <strong>{host?.display_name?.split(' ')[0]}</strong></p>
            <p className="dash-email">{host?.email} <span className={`tier-badge ${tierMeta.cls}`}>{tierMeta.label}</span></p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className={`btn-ghost btn-sm${tab === 'account' ? ' btn-ghost-active' : ''}`} onClick={() => setTab(t => t === 'account' ? 'events' : 'account')}>Account</button>
          <button className="btn-ghost btn-sm" onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* Banners */}
      {checkoutOk && (
        <div className="banner-success">
          {checkoutType === 'pass'
            ? '✓ Pro Event Pass activated! Full-resolution uploads are unlocked for this event.'
            : '✓ Subscription activated! Full-resolution uploads are now unlocked across all your events.'}
        </div>
      )}
      {!isPro && (
        <div className="upgrade-banner">
          <div className="upgrade-banner-text">
            <strong>Upgrade to Pro</strong> — unlimited events, full-resolution originals (25 MB+), live photo wall, and priority support.
          </div>
          <button className="upgrade-banner-btn" onClick={() => setShowUpgrade(true)}>
            View plans
          </button>
        </div>
      )}
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

      {/* Account tab */}
      {tab === 'account' && (
        <AccountPanel host={host} setHost={setHost} signOut={signOut} onUpgrade={() => setShowUpgrade(true)} />
      )}

      {/* Events tab */}
      {tab === 'events' && (
        <>
          {/* Stats row */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-num">{events.length}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{events.reduce((s,e) => s + parseInt(e.photo_count||0,10), 0)}</span>
              <span className="stat-label">Photos collected</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{events.filter(e => e.linked_provider).length}</span>
              <span className="stat-label">Cloud connected</span>
            </div>
          </div>

          {/* Events list panel */}
          <div className="events-panel">

            {/* Toolbar: filter tabs + search + create button */}
            <div className="events-toolbar">
              <div className="filter-tabs">
                {[['all','All',events.length],['active','Active',activeCount],['past','Past',pastCount]].map(([key,label,count])=>(
                  <button key={key} className={`filter-tab${filter===key?' filter-tab--active':''}`} onClick={()=>setFilter(key)}>
                    {label} <span className="tab-count">{count}</span>
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                <div className="search-bar-wrap">
                  <SearchIcon />
                  <input className="search-bar-input" placeholder="Search by name or code" value={search} onChange={e=>setSearch(e.target.value)} />
                </div>
                <button className="btn-create-event" onClick={()=>setShowCreateModal(true)}>+ Create event</button>
              </div>
            </div>

            {/* Table header */}
            {filteredEvents.length > 0 && (
              <div className="events-table-head">
                <span>Event details</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
            )}

            {/* Rows */}
            {filteredEvents.length === 0 ? (
              <div className="events-empty-state">
                {search ? (
                  <p>No events matching &ldquo;<strong>{search}</strong>&rdquo;</p>
                ) : (
                  <>
                    <p>No events yet.</p>
                    <button className="btn-create-event" onClick={()=>setShowCreateModal(true)}>+ Create your first event</button>
                  </>
                )}
              </div>
            ) : filteredEvents.map(ev => (
              <EventRow
                key={ev.id}
                event={ev}
                isPro={isPro || (ev.is_premium_pass && ev.pass_expires_at && new Date(ev.pass_expires_at) > new Date())}
                token={session?.access_token}
                loginHint={session?.user?.app_metadata?.provider === 'google' ? session?.user?.email : undefined}
                onUpdate={handleEventUpdate}
                onDelete={handleEventDelete}
                onShare={()=>setShareEvent(ev)}
                onUpgrade={() => setShowUpgrade(true)}
              />
            ))}
          </div>
        </>
      )}
    </Shell>

    {showUpgrade && <UpgradeModal host={host} onClose={() => setShowUpgrade(false)} />}
    {showCreateModal && (
      <CreateEventModal
        onClose={()=>setShowCreateModal(false)}
        onCreated={ev=>{ setEvents(prev=>[ev,...prev]); setShowCreateModal(false); }}
      />
    )}
    {shareEvent && (
      <SharePanel
        event={shareEvent}
        onClose={()=>setShareEvent(null)}
      />
    )}
    </>
  );
}

// ── Onboarding screen (first sign-in) ─────────────────────────────────────────

function OnboardingScreen({ host, onContinueFree }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  async function handlePlan(type) {
    localStorage.setItem(ONBOARDING_KEY(host.id), '1');
    if (type === 'free') { onContinueFree(); return; }
    setLoading(type);
    const q = new URLSearchParams({ type });
    navigate(`/checkout?${q}`);
  }

  const plans = [
    {
      type:        'free',
      name:        'Free',
      price:       'Free',
      note:        'Always free',
      description: '1 event/month · Up to 10 participants · 2 MB per upload · Google Drive, OneDrive, Dropbox · QR code sharing',
      cta:         'Continue for free',
      popular:     false,
    },
    {
      type:        'pro_annual',
      name:        'Pro',
      price:       '£9',
      note:        '/mo · billed £108/yr',
      description: 'Unlimited events & guests · Full-resolution originals (25 MB+) · Live photo wall · No browser compression · Priority upload queue · Priority support · Google Drive, OneDrive, Dropbox',
      cta:         'Get Pro',
      popular:     true,
      badge:       'Most popular',
    },
    {
      type:        'business_annual',
      name:        'Business',
      price:       '£29',
      note:        '/mo · billed £348/yr',
      description: 'Everything in Pro · Multiple collaborators · Centralised photo repository · White-label branding · SSO & custom domain · Branded event page · Dedicated support & SLA',
      cta:         'Get Business',
      popular:     false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(140deg, #6045f4 0%, #7060f6 45%, #53e6d4 100%)' }}>
      <header className="px-6 pt-8 pb-0 flex items-center">
        <span className="font-black text-2xl text-white tracking-tight">
          pica<span style={{ color: '#c4b5fd' }}>choo</span>
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-2">
            Welcome, {host.display_name?.split(' ')[0]}!
          </h1>
          <p className="text-white/70 text-base max-w-md mx-auto">
            You're all set. Choose how you'd like to get started — you can always upgrade later.
          </p>
        </div>

        <div className="w-full max-w-4xl grid md:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div key={plan.type}
                 className={`rounded-2xl p-6 flex flex-col gap-4 relative ${
                   plan.popular
                     ? 'bg-white text-gray-900'
                     : 'text-white'
                 }`}
                 style={plan.popular ? {} : { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>

              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${plan.popular ? 'text-violet-400' : 'text-white/50'}`}>
                  {plan.name}
                </p>
                <p className={`text-4xl font-black mt-1 ${plan.popular ? 'text-gray-900' : 'text-white'}`}>
                  {plan.price}
                </p>
                <p className={`text-xs mt-1 font-medium ${plan.popular ? 'text-violet-600' : 'text-white/60'}`}>
                  {plan.note}
                </p>
              </div>

              <p className={`text-sm flex-1 ${plan.popular ? 'text-gray-500' : 'text-white/70'}`}>
                {plan.description}
              </p>

              <button
                onClick={() => handlePlan(plan.type)}
                disabled={loading === plan.type}
                className={`w-full py-3 rounded-full font-semibold text-sm transition-all disabled:opacity-60 ${
                  plan.popular
                    ? 'text-white'
                    : 'text-white border border-white/40 hover:bg-white/10'
                }`}
                style={plan.popular ? { background: 'linear-gradient(135deg, #6045f4, #53e6d4)' } : {}}
              >
                {loading === plan.type ? 'Redirecting…' : plan.cta}
              </button>

              {/* Skip link — only on the featured Pro Event Pass card */}
              {plan.popular && (
                <button
                  onClick={onContinueFree}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  Skip for now →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Account panel ─────────────────────────────────────────────────────────────

function AccountPanel({ host, setHost, signOut, onUpgrade }) {
  const navigate      = useNavigate();
  const [name,        setName]        = useState(host?.display_name ?? '');
  const [savingName,  setSavingName]  = useState(false);
  const [nameMsg,     setNameMsg]     = useState('');
  const [showDelete,  setShowDelete]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [deleteErr,   setDeleteErr]   = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [cancelMsg,     setCancelMsg]     = useState('');

  const tier     = host?.tier ?? 'free';
  const tierMeta = TIER_LABEL[tier] ?? TIER_LABEL.free;
  const isPro    = tier !== 'free';

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim() || name.trim() === host?.display_name) return;
    setSavingName(true); setNameMsg('');
    try {
      const { host: updated } = await updateHostProfile({ displayName: name.trim() });
      setHost(h => ({ ...h, ...updated }));
      setNameMsg('✓ Name updated');
      setTimeout(() => setNameMsg(''), 3000);
    } catch (err) {
      setNameMsg(err.message ?? 'Update failed');
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true); setDeleteErr('');
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      setDeleteErr(err.message ?? 'Delete failed. Please try again.');
      setDeleting(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true); setCancelMsg('');
    try {
      const { currentPeriodEnd } = await cancelSubscription();
      const date = currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;
      setCancelMsg(date ? `Cancelled. Your Pro access continues until ${date}.` : 'Subscription cancelled at period end.');
      setCancelConfirm(false);
    } catch (err) {
      setCancelMsg(err.message ?? 'Cancellation failed. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="dash-section" style={{ maxWidth: '560px' }}>
      <h2 style={{ marginBottom: '20px' }}>Account settings</h2>

      {/* Profile */}
      <div className="event-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Profile</h3>
        <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
            Display name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ display: 'block', marginTop: '4px', width: '100%' }}
            />
          </label>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
            Email address
            <input
              type="email"
              value={host?.email ?? ''}
              disabled
              style={{ display: 'block', marginTop: '4px', width: '100%', opacity: 0.6 }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" className="btn-primary" disabled={savingName || !name.trim() || name.trim() === host?.display_name}>
              {savingName ? 'Saving…' : 'Save changes'}
            </button>
            {nameMsg && (
              <span style={{ fontSize: '12px', color: nameMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                {nameMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Plan */}
      <div className="event-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Subscription plan</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={`tier-badge ${tierMeta.cls}`}>{tierMeta.label}</span>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {isPro
                ? 'Full-resolution uploads unlocked across all your events.'
                : 'Photos compressed to 2 MB per upload. Upgrade to unlock originals.'}
            </p>
          </div>
          {!isPro && (
            <button className="btn-primary" onClick={onUpgrade} style={{ flexShrink: 0, marginLeft: '16px' }}>
              Upgrade
            </button>
          )}
        </div>

        {/* Cancel subscription flow */}
        {isPro && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            {cancelMsg && (
              <p style={{ fontSize: '12px', color: cancelMsg.includes('failed') ? '#dc2626' : '#059669', marginBottom: '8px' }}>
                {cancelMsg}
              </p>
            )}
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Cancel subscription
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: '#374151' }}>
                  You'll keep Pro access until the end of your current billing period. Are you sure?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-ghost btn-sm" onClick={() => setCancelConfirm(false)} disabled={cancelling}>
                    Keep subscription
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: cancelling ? 0.5 : 1 }}
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="event-card" style={{ borderColor: '#fee2e2' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>Danger zone</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Permanently delete your account and all associated events and photo records.
          Files in your cloud storage are not deleted.
        </p>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Delete my account
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
            />
            {deleteErr && <p className="msg-error">{deleteErr}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost btn-sm" onClick={() => { setShowDelete(false); setDeleteInput(''); }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: deleteInput !== 'DELETE' ? 0.4 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Permanently delete account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event card (kept for reference, unused in new layout) ─────────────────────

function EventCard({ event, token, loginHint, onUpdate, onDelete }) {
  const [showQR,       setShowQR]       = useState(false);
  const [ev,           setEv]           = useState(event);
  const [toggling,     setToggling]     = useState(false);
  const [delConfirm,   setDelConfirm]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [mgmtError,    setMgmtError]    = useState('');
  const [copied,       setCopied]       = useState(false);
  const [wallPicker,        setWallPicker]        = useState(false);
  const [wallSaving,        setWallSaving]        = useState(false);
  const [uploadPicker,      setUploadPicker]      = useState(false);
  const [uploadSaving,      setUploadSaving]      = useState(false);

  const statusColors = { active: 'status-active', draft: 'status-draft', closed: 'status-closed' };
  const guestUrl = `${window.location.origin}/e/${ev.join_code}`;

  function handleDisconnected() {
    const updated = { ...ev, linked_provider: null, linked_account: null };
    setEv(updated);
    onUpdate?.(updated);
  }

  async function handleToggleStatus() {
    const next = ev.status === 'active' ? 'closed' : 'active';
    setToggling(true); setMgmtError('');
    try {
      const { event: updated } = await updateEvent(ev.id, { status: next });
      const merged = { ...ev, ...updated };
      setEv(merged);
      onUpdate?.(merged);
    } catch (err) {
      setMgmtError(err.message);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true); setMgmtError('');
    try {
      await deleteEvent(ev.id);
      onDelete?.(ev.id);
    } catch (err) {
      setMgmtError(err.message);
      setDelConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleWallMode(mode) {
    setWallSaving(true);
    try {
      const { event: updated } = await updateEvent(ev.id, { wallMode: mode });
      const merged = { ...ev, ...updated };
      setEv(merged);
      onUpdate?.(merged);
      setWallPicker(false);
    } catch (err) {
      setMgmtError(err.message);
    } finally {
      setWallSaving(false);
    }
  }

  async function handleUploadMode(mode) {
    setUploadSaving(true);
    try {
      const { event: updated } = await updateEvent(ev.id, { wallUploadMode: mode });
      const merged = { ...ev, ...updated };
      setEv(merged);
      onUpdate?.(merged);
      setUploadPicker(false);
    } catch (err) {
      setMgmtError(err.message);
    } finally {
      setUploadSaving(false);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ev.name,
          text: `Join ${ev.name} on Picachoo and share your photos!`,
          url:  guestUrl,
        });
      } catch (e) { /* user dismissed */ }
    } else {
      await navigator.clipboard.writeText(guestUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const photoCount   = parseInt(ev.photo_count ?? 0, 10);
  const lastPhotoAt  = ev.last_photo_at ? new Date(ev.last_photo_at) : null;
  const lastPhotoFmt = lastPhotoAt
    ? lastPhotoAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`event-card event-card--${ev.status}`}>
      {/* Card header */}
      <div className="event-card-header">
        <div style={{ flex:1, minWidth:0 }}>
          <h3 className="event-name">{ev.name}</h3>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
            <span className={`status-pill ${statusColors[ev.status] ?? ''}`}>{ev.status}</span>
            <span className="event-code">#{ev.join_code}</span>
          </div>
        </div>
        <div className="event-card-actions">
          <button className="action-btn" onClick={handleShare} title="Share event link">
            {copied ? <span style={{fontSize:11,fontWeight:700,color:'#059669'}}>Copied!</span> : <ShareIcon />}
          </button>
          <button className="action-btn" onClick={() => setShowQR(v => !v)} title="QR code">
            <QRIcon />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="event-stats-row">
        <div className="event-stat-chip">
          <PhotoCountIcon />
          <span>{photoCount === 0 ? 'No photos yet' : `${photoCount} photo${photoCount !== 1 ? 's' : ''}`}</span>
        </div>
        {lastPhotoFmt && (
          <div className="event-stat-chip">
            <ClockIcon />
            <span>Last: {lastPhotoFmt}</span>
          </div>
        )}
      </div>

      {/* Live wall row */}
      <div className="wall-row">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span className="wall-row-icon">📺</span>
          <a href={`/e/${ev.join_code}/wall`} target="_blank" rel="noreferrer" className="wall-link">Live Wall</a>
        </div>
        <button
          className={`wall-toggle-btn${ev.wall_mode !== 'off' ? ' wall-toggle-on' : ''}`}
          onClick={() => ev.wall_mode !== 'off' ? handleWallMode('off') : setWallPicker(true)}
          disabled={wallSaving}
        >
          <span className={`wall-toggle-dot${ev.wall_mode !== 'off' ? ' wall-toggle-dot-on' : ''}`} />
          {ev.wall_mode === 'off' ? 'Off' : ev.wall_mode === 'everyone' ? 'Everyone' : 'Host only'}
        </button>
      </div>

      {/* View picker */}
      {wallPicker && (
        <div className="wall-picker">
          <p className="wall-picker-label">Who can view the live wall?</p>
          <div className="wall-picker-options">
            <button className="wall-picker-opt" onClick={() => handleWallMode('everyone')} disabled={wallSaving}>
              <span className="wall-picker-opt-icon">🌐</span>
              <div>
                <strong>Everyone</strong>
                <p>Guests and host can see the live wall</p>
              </div>
            </button>
            <button className="wall-picker-opt" onClick={() => handleWallMode('host_only')} disabled={wallSaving}>
              <span className="wall-picker-opt-icon">🔒</span>
              <div>
                <strong>Host only</strong>
                <p>Only you can see the live wall</p>
              </div>
            </button>
          </div>
          <button className="wall-picker-cancel" onClick={() => setWallPicker(false)}>Cancel</button>
        </div>
      )}

      {/* Contribute control — only shown when wall is on */}
      {ev.wall_mode !== 'off' && (
        <>
          <div className="wall-section-row wall-section-row-sub">
            <span className="wall-sub-label">Who can contribute photos?</span>
            <button
              className={`wall-toggle-btn${ev.wall_upload_mode === 'host_only' ? ' wall-toggle-on' : ''}`}
              onClick={() => setUploadPicker(true)}
              disabled={uploadSaving}
            >
              <span className={`wall-toggle-dot${ev.wall_upload_mode === 'host_only' ? ' wall-toggle-dot-on' : ''}`} />
              {ev.wall_upload_mode === 'host_only' ? 'Host only' : 'Everyone'}
            </button>
          </div>

          {uploadPicker && (
            <div className="wall-picker">
              <p className="wall-picker-label">Who can add photos to the wall?</p>
              <div className="wall-picker-options">
                <button className="wall-picker-opt" onClick={() => handleUploadMode('everyone')} disabled={uploadSaving}>
                  <span className="wall-picker-opt-icon">👥</span>
                  <div>
                    <strong>Everyone</strong>
                    <p>All guests can submit photos to the live wall</p>
                  </div>
                </button>
                <button className="wall-picker-opt" onClick={() => handleUploadMode('host_only')} disabled={uploadSaving}>
                  <span className="wall-picker-opt-icon">🎛️</span>
                  <div>
                    <strong>Host only</strong>
                    <p>Only you can add photos — curated wall</p>
                  </div>
                </button>
              </div>
              <button className="wall-picker-cancel" onClick={() => setUploadPicker(false)}>Cancel</button>
            </div>
          )}
        </>
      )}

      {ev.linked_provider ? (
        <StorageStatus
          provider={ev.linked_provider}
          account={ev.linked_account}
          eventId={ev.id}
          onDisconnected={handleDisconnected}
        />
      ) : (
        <StoragePicker eventId={ev.id} loginHint={loginHint} />
      )}

      {/* Management controls */}
      <div className="event-mgmt">
        {!delConfirm ? (
          <>
            <button
              className={ev.status === 'active' ? 'event-close-btn' : 'event-reopen-btn'}
              onClick={handleToggleStatus}
              disabled={toggling || ev.status === 'draft'}
            >
              {toggling ? '…' : ev.status === 'active' ? 'Close event' : 'Reopen event'}
            </button>
            <button className="event-delete-btn" onClick={() => setDelConfirm(true)}>
              Delete
            </button>
          </>
        ) : (
          <div className="event-delete-confirm">
            <p>
              Delete <strong>{ev.name}</strong>?
              {photoCount > 0 && ` ${photoCount} photo record${photoCount !== 1 ? 's' : ''} will be removed (files in your cloud storage are kept).`}
            </p>
            <div className="event-delete-confirm-btns">
              <button className="btn-ghost btn-sm" onClick={() => setDelConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="event-delete-confirm-yes" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
        {mgmtError && <p className="msg-error">{mgmtError}</p>}
      </div>

      {showQR && <QRCard event={ev} />}
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────────────

function EventRow({ event, isPro, token, loginHint, onUpdate, onDelete, onShare, onUpgrade }) {
  const [ev, setEv] = useState(event);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mgmtError, setMgmtError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  function handleDisconnected() {
    const u = { ...ev, linked_provider: null, linked_account: null };
    setEv(u); onUpdate?.(u);
  }

  async function handleToggleStatus() {
    const next = ev.status === 'active' ? 'closed' : 'active';
    setToggling(true);
    try {
      const { event: u } = await updateEvent(ev.id, { status: next });
      const m = { ...ev, ...u }; setEv(m); onUpdate?.(m);
    } catch (err) { setMgmtError(err.message); }
    finally { setToggling(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try { await deleteEvent(ev.id); onDelete?.(ev.id); }
    catch (err) { setMgmtError(err.message); setDelConfirm(false); }
    finally { setDeleting(false); }
  }

  const photoCount = parseInt(ev.photo_count ?? 0, 10);
  const createdFmt = ev.created_at
    ? new Date(ev.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
    : null;
  const statusColors = { active:'status-active', draft:'status-draft', closed:'status-closed' };

  return (
    <>
      <div className={`event-row${expanded?' event-row--open':''}`}>
        {/* Left accent */}
        <div className={`event-row-accent event-row-accent--${ev.status}`} />

        {/* Details (clickable to expand) */}
        <div className="event-row-details" onClick={()=>setExpanded(v=>!v)}>
          <p className="event-row-name">{ev.name}</p>
          <p className="event-row-meta">
            #{ev.join_code}
            {createdFmt && <> · {createdFmt}</>}
            {photoCount > 0 && <> · {photoCount} photo{photoCount!==1?'s':''}</>}
          </p>
        </div>

        {/* Status */}
        <div className="event-row-status-col">
          <span className={`status-pill ${statusColors[ev.status]??''}`}>{ev.status}</span>
        </div>

        {/* Actions */}
        <div className="event-row-actions" onClick={e=>e.stopPropagation()}>
          <button className="row-action-btn" onClick={onShare} title="Share & QR"><ShareIcon /></button>
          {isPro
            ? <a href={`/e/${ev.join_code}/wall`} target="_blank" rel="noreferrer" className="row-action-btn" title="Live Wall"><TVIcon /></a>
            : <button className="row-action-btn row-action-btn--locked" onClick={onUpgrade} title="Live Wall · Pro feature"><TVIcon /><LockBadge /></button>
          }
          <div style={{position:'relative'}} ref={menuRef}>
            <button className="row-action-btn" onClick={()=>setMenuOpen(v=>!v)} title="More"><MoreIcon /></button>
            {menuOpen && (
              <div className="row-dropdown">
                <button onClick={()=>{setMenuOpen(false);setShowEdit(true);}}>Edit event</button>
                <button onClick={()=>{setMenuOpen(false);handleToggleStatus();}} disabled={toggling||ev.status==='draft'}>
                  {ev.status==='active'?'Close event':'Reopen event'}
                </button>
                <button className="row-dropdown--danger" onClick={()=>{setMenuOpen(false);setDelConfirm(true);}}>Delete event</button>
              </div>
            )}
          </div>
          <button className="row-action-btn row-chevron" onClick={()=>setExpanded(v=>!v)} title={expanded?'Collapse':'Expand'}>
            <ChevronIcon open={expanded} />
          </button>
        </div>
      </div>

      {/* Expanded body: wall + storage */}
      {expanded && (
        <div className="event-row-body">
          <WallControls ev={ev} setEv={setEv} onUpdate={onUpdate} isPro={isPro} onUpgrade={onUpgrade} />
          {ev.linked_provider
            ? <StorageStatus provider={ev.linked_provider} account={ev.linked_account} eventId={ev.id} onDisconnected={handleDisconnected} />
            : <StoragePicker eventId={ev.id} loginHint={loginHint} />
          }
          {mgmtError && <p className="msg-error">{mgmtError}</p>}
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditEventModal
          event={ev}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { const m = { ...ev, ...updated }; setEv(m); onUpdate?.(m); setShowEdit(false); }}
        />
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="event-row-body">
          <div className="event-delete-confirm">
            <p>Delete <strong>{ev.name}</strong>?{photoCount>0&&` ${photoCount} photo record${photoCount!==1?'s':''} will be removed (files in your cloud storage are kept).`}</p>
            <div className="event-delete-confirm-btns">
              <button className="btn-ghost btn-sm" onClick={()=>setDelConfirm(false)} disabled={deleting}>Cancel</button>
              <button className="event-delete-confirm-yes" onClick={handleDelete} disabled={deleting}>{deleting?'Deleting…':'Yes, delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── WallControls ──────────────────────────────────────────────────────────────

// Validate image dimensions in-browser before sending to server.
// Returns null if OK, or an error string.
async function validateImageDims(file, specW, specH) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const tol = 0.05;
      const wOk = Math.abs(img.naturalWidth  - specW) / specW <= tol;
      const hOk = Math.abs(img.naturalHeight - specH) / specH <= tol;
      if (!wOk || !hOk) {
        resolve(`Wrong dimensions: got ${img.naturalWidth} × ${img.naturalHeight} px, need ${specW} × ${specH} px (±5%).`);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve('Could not read image dimensions.'); };
    img.src = url;
  });
}

function WallBrandingUploader({ ev, setEv, onUpdate, type }) {
  const isBackground = type === 'background';
  const spec = isBackground
    ? { w: 1920, h: 1080, maxMB: 4, accept: 'image/jpeg,image/png,image/webp', label: '1920 × 1080 px · JPEG, PNG or WebP · max 4 MB' }
    : { w: 600,  h: 800,  maxMB: 2, accept: 'image/png',                       label: '600 × 800 px (3:4) · PNG with transparency · max 2 MB' };

  const currentUrl = isBackground ? ev.wall_background_url : ev.wall_frame_url;
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');

    // Client-side checks first — saves a round trip
    if (file.size > spec.maxMB * 1024 * 1024) {
      return setError(`File too large. Max ${spec.maxMB} MB.`);
    }
    const dimErr = await validateImageDims(file, spec.w, spec.h);
    if (dimErr) return setError(dimErr);

    setSaving(true);
    try {
      const { event: u } = await uploadWallAsset(ev.id, type, file);
      const m = { ...ev, ...u };
      setEv(m); onUpdate?.(m);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      const { event: u } = await deleteWallAsset(ev.id, type);
      const m = { ...ev, ...u };
      setEv(m); onUpdate?.(m);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="wall-branding-uploader">
      <div className="wall-branding-header">
        <span className="wall-sub-label">{isBackground ? 'Background image' : 'Photo frame overlay'}</span>
        {currentUrl ? (
          <div className="wall-branding-actions">
            <button className="wall-branding-change" onClick={() => inputRef.current?.click()} disabled={saving}>
              {saving ? 'Uploading…' : 'Change'}
            </button>
            <button className="wall-branding-remove" onClick={handleRemove} disabled={saving}>Remove</button>
          </div>
        ) : (
          <button className="wall-toggle-btn" onClick={() => inputRef.current?.click()} disabled={saving}>
            {saving ? 'Uploading…' : 'Upload'}
          </button>
        )}
      </div>
      {currentUrl && (
        <div className="wall-branding-preview">
          <img src={currentUrl} alt={type} />
        </div>
      )}
      <p className="wall-branding-spec">{spec.label}</p>
      {error && <p className="msg-error" style={{ marginTop: 4 }}>{error}</p>}
      <input ref={inputRef} type="file" accept={spec.accept} className="sr-only" onChange={handleFile} />
    </div>
  );
}

function WallControls({ ev, setEv, onUpdate, isPro, onUpgrade }) {
  const [wallPicker, setWallPicker] = useState(false);
  const [wallSaving, setWallSaving] = useState(false);
  const [uploadPicker, setUploadPicker] = useState(false);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleWallMode(mode) {
    setWallSaving(true);
    try {
      const { event: u } = await updateEvent(ev.id, { wallMode: mode });
      const m = { ...ev, ...u }; setEv(m); onUpdate?.(m); setWallPicker(false);
    } catch (err) { setError(err.message); }
    finally { setWallSaving(false); }
  }

  async function handleUploadMode(mode) {
    setUploadSaving(true);
    try {
      const { event: u } = await updateEvent(ev.id, { wallUploadMode: mode });
      const m = { ...ev, ...u }; setEv(m); onUpdate?.(m); setUploadPicker(false);
    } catch (err) { setError(err.message); }
    finally { setUploadSaving(false); }
  }

  // Free tier: show a locked upgrade prompt
  if (!isPro) {
    return (
      <div className="wall-section wall-section--locked">
        <div className="wall-locked-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📺</span>
            <span className="wall-locked-label">Live Wall</span>
            <span className="wall-locked-badge">Pro</span>
          </div>
          <button className="wall-locked-upgrade" onClick={onUpgrade}>
            Upgrade to unlock
          </button>
        </div>
        <p className="wall-locked-desc">
          Display a real-time photo stream on any screen. Available on Pro and Business plans.
        </p>
      </div>
    );
  }

  return (
    <div className="wall-section">
      <div className="wall-section-row">
        <a href={`/e/${ev.join_code}/wall`} target="_blank" rel="noreferrer" className="wall-link">
          <span>📺</span> Open Live Wall
        </a>
        <button
          className={`wall-toggle-btn${ev.wall_mode!=='off'?' wall-toggle-on':''}`}
          onClick={()=>ev.wall_mode!=='off'?handleWallMode('off'):setWallPicker(true)}
          disabled={wallSaving}
        >
          <span className={`wall-toggle-dot${ev.wall_mode!=='off'?' wall-toggle-dot-on':''}`}/>
          {ev.wall_mode==='off'?'Wall off':ev.wall_mode==='everyone'?'Visible to all':'Visible: host only'}
        </button>
      </div>
      {wallPicker && (
        <div className="wall-picker">
          <p className="wall-picker-label">Who can view the live wall?</p>
          <div className="wall-picker-options">
            <button className="wall-picker-opt" onClick={()=>handleWallMode('everyone')} disabled={wallSaving}><span className="wall-picker-opt-icon">🌐</span><div><strong>Everyone</strong><p>Guests and host can see the live wall</p></div></button>
            <button className="wall-picker-opt" onClick={()=>handleWallMode('host_only')} disabled={wallSaving}><span className="wall-picker-opt-icon">🔒</span><div><strong>Host only</strong><p>Only you can see the live wall</p></div></button>
          </div>
          <button className="wall-picker-cancel" onClick={()=>setWallPicker(false)}>Cancel</button>
        </div>
      )}
      {ev.wall_mode !== 'off' && (
        <>
          <div className="wall-section-row wall-section-row-sub">
            <span className="wall-sub-label">Who can contribute photos?</span>
            <button className={`wall-toggle-btn${ev.wall_upload_mode==='host_only'?' wall-toggle-on':''}`} onClick={()=>setUploadPicker(true)} disabled={uploadSaving}>
              <span className={`wall-toggle-dot${ev.wall_upload_mode==='host_only'?' wall-toggle-dot-on':''}`}/>
              {ev.wall_upload_mode==='host_only'?'Host only':'Everyone'}
            </button>
          </div>
          {uploadPicker && (
            <div className="wall-picker">
              <p className="wall-picker-label">Who can add photos to the wall?</p>
              <div className="wall-picker-options">
                <button className="wall-picker-opt" onClick={()=>handleUploadMode('everyone')} disabled={uploadSaving}><span className="wall-picker-opt-icon">👥</span><div><strong>Everyone</strong><p>All guests can submit photos to the live wall</p></div></button>
                <button className="wall-picker-opt" onClick={()=>handleUploadMode('host_only')} disabled={uploadSaving}><span className="wall-picker-opt-icon">🎛️</span><div><strong>Host only</strong><p>Only you can add photos — curated wall</p></div></button>
              </div>
              <button className="wall-picker-cancel" onClick={()=>setUploadPicker(false)}>Cancel</button>
            </div>
          )}
        </>
      )}
      {ev.wall_mode !== 'off' && (
        <div className="wall-branding-section">
          <WallBrandingUploader ev={ev} setEv={setEv} onUpdate={onUpdate} type="background" />
          <WallBrandingUploader ev={ev} setEv={setEv} onUpdate={onUpdate} type="frame" />
        </div>
      )}
      {error && <p className="msg-error">{error}</p>}
    </div>
  );
}

// ── EditEventModal ────────────────────────────────────────────────────────────

function EditEventModal({ event, onClose, onSaved }) {
  const [name,        setName]        = useState(event.name ?? '');
  const [description, setDescription] = useState(event.description ?? '');
  const [startsAt,    setStartsAt]    = useState(event.starts_at ? event.starts_at.slice(0, 16) : '');
  const [endsAt,      setEndsAt]      = useState(event.ends_at   ? event.ends_at.slice(0, 16)   : '');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(''); setSaving(true);
    try {
      const { event: updated } = await updateEvent(event.id, {
        name:        name.trim(),
        description: description.trim() || null,
        startsAt:    startsAt || null,
        endsAt:      endsAt   || null,
      });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h2 className="modal-title">Edit event</h2>
        <form onSubmit={handleSave}>
          <label className="modal-label">
            Event name
            <input ref={inputRef} type="text" className="modal-input" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label className="modal-label" style={{ marginTop: 12 }}>
            Description <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
            <textarea
              className="modal-input"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a short description visible to guests"
              style={{ resize: 'vertical', minHeight: 72 }}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <label className="modal-label">
              Start date &amp; time <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              <input type="datetime-local" className="modal-input" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            </label>
            <label className="modal-label">
              End date &amp; time <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              <input type="datetime-local" className="modal-input" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
            </label>
          </div>
          {error && <p className="msg-error" style={{ marginTop: 8 }}>{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-create-event" disabled={!name.trim() || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CreateEventModal ──────────────────────────────────────────────────────────

function CreateEventModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  useEffect(()=>{ inputRef.current?.focus(); },[]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(''); setCreating(true);
    try {
      const { event } = await createEvent({ name: name.trim() });
      onCreated(event);
    } catch (err) { setError(err.message); setCreating(false); }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-card">
        <h2 className="modal-title">Create your event</h2>
        <form onSubmit={handleCreate}>
          <label className="modal-label">
            Give your event a name
            <input ref={inputRef} type="text" className="modal-input" placeholder="Event name" value={name} onChange={e=>setName(e.target.value)} required />
          </label>
          {error && <p className="msg-error" style={{marginTop:8}}>{error}</p>}
          <div className="modal-privacy-note">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{width:14,height:14,flexShrink:0,color:'#6045f4'}}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            Anyone with the code or link can participate
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-create-event" disabled={!name.trim()||creating}>{creating?'Creating…':'Create event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SharePanel ────────────────────────────────────────────────────────────────

function SharePanel({ event, onClose }) {
  const [tab, setTab] = useState('share');
  const [copiedLink, setCopiedLink] = useState(false);
  const [coHostEmail, setCoHostEmail] = useState('');
  const [shareableLink, setShareableLink] = useState(false);
  const [cohosts, setCohosts] = useState([]);
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const guestUrl = `${window.location.origin}/e/${event.join_code}`;

  useEffect(() => {
    if (tab === 'collaborate') {
      getCohosts(event.id).then(d => setCohosts(d.cohosts ?? [])).catch(() => {});
    }
  }, [tab, event.id]);

  function copyLink() {
    navigator.clipboard.writeText(guestUrl).catch(()=>{});
    setCopiedLink(true);
    setTimeout(()=>setCopiedLink(false), 2000);
  }

  async function handleInvite(e) {
    e.preventDefault();
    const email = coHostEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true);
    setInviteError('');
    try {
      await inviteCohost(event.id, email);
      const d = await getCohosts(event.id);
      setCohosts(d.cohosts ?? []);
      setCoHostEmail('');
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    } catch (err) {
      setInviteError(err.message ?? 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(cohostId) {
    await removeCohost(event.id, cohostId).catch(() => {});
    setCohosts(prev => prev.filter(c => c.id !== cohostId));
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="share-panel">
        {/* Header */}
        <div className="share-panel-header">
          <div>
            <p className="share-panel-event-name">{event.name}</p>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
              <span className="share-panel-code">#{event.join_code}</span>
              <span className="share-panel-dot">·</span>
              <span className={`status-pill status-${event.status}`}>{event.status}</span>
            </div>
          </div>
          <button className="share-panel-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="share-tabs">
          <button className={`share-tab${tab==='share'?' share-tab--active':''}`} onClick={()=>setTab('share')}>Share with guests</button>
          <button className={`share-tab${tab==='collaborate'?' share-tab--active':''}`} onClick={()=>setTab('collaborate')}>Collaborate</button>
        </div>

        {/* Share with guests */}
        {tab === 'share' && (
          <div className="share-body">
            {/* Joining link */}
            <div className="share-row">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,color:'#6b7280'}}><path strokeLinecap="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path strokeLinecap="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <span className="share-row-label">Joining link</span>
              </div>
              <button className="share-copy-btn" onClick={copyLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                {copiedLink ? 'Copied!' : 'Copy joining link'}
              </button>
            </div>
            <p className="share-url-text">{guestUrl}</p>

            <div className="share-divider"/>

            {/* QR code */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,color:'#6b7280'}}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/></svg>
              <span className="share-row-label">QR code</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:20}}>
              <div style={{padding:10,background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',flexShrink:0}}>
                <QRInline value={guestUrl} size={120}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
                <button className="share-qr-btn" onClick={()=>navigator.clipboard.writeText(guestUrl).catch(()=>{})}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy QR code
                </button>
                <a href={guestUrl} download={`${event.join_code}-qr.png`} className="share-qr-btn" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><path strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download QR code
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Collaborate */}
        {tab === 'collaborate' && (
          <div className="share-body">
            <div className="collab-header">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18,color:'#1f1f2e'}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                <span className="collab-title">Add co-hosts</span>
              </div>
            </div>
            <p className="collab-sub">Invite others to help you with managing this event.</p>

            <div className="share-divider"/>

            {/* Shareable link toggle */}
            <div className="collab-toggle-row">
              <div>
                <p className="collab-toggle-label">Shareable link</p>
                <p className="collab-toggle-sub">Anyone with the link can help with this event.</p>
              </div>
              <button
                className={`toggle-switch${shareableLink?' toggle-switch--on':''}`}
                onClick={()=>setShareableLink(v=>!v)}
                aria-checked={shareableLink}
                role="switch"
              >
                <span className="toggle-knob"/>
              </button>
            </div>

            <div className="share-divider"/>

            {/* Email invite */}
            <form className="collab-invite-row" onSubmit={handleInvite}>
              <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,color:'#9ca3af',flexShrink:0}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M22 11h-4m2-2v4"/></svg>
                <input type="email" className="collab-email-input" placeholder="Email address" value={coHostEmail} onChange={e=>setCoHostEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn-invite" disabled={!coHostEmail.trim() || inviting}>
                {inviting ? 'Inviting…' : 'Invite'}
              </button>
            </form>

            {inviteError && <p className="msg-error" style={{marginTop:8}}>{inviteError}</p>}
            {inviteSent && <div className="banner-success" style={{marginTop:8}}>✓ Invited!</div>}

            {/* Co-host list */}
            {cohosts.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:4}}>
                {cohosts.map(c => (
                  <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#f9f9ff',borderRadius:10,border:'1px solid rgba(107,92,231,0.1)'}}>
                    <div>
                      <p style={{margin:0,fontSize:13,fontWeight:600,color:'#1f1f2e'}}>{c.email}</p>
                      <p style={{margin:0,fontSize:11,color:'#9ca3af'}}>{c.accepted_at ? 'Accepted' : 'Invited'}</p>
                    </div>
                    <button onClick={()=>handleRemove(c.id)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#9ca3af',display:'flex',alignItems:'center'}} title="Remove co-host">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── QRInline ──────────────────────────────────────────────────────────────────

function QRInline({ value, size = 120 }) {
  return <QRCodeSVG value={value} size={size} />;
}

// ── Upgrade modal ─────────────────────────────────────────────────────────────

const UPGRADE_PLANS = [
  {
    type:     'free',
    name:     'Free',
    price:    'Free',
    note:     'Always free',
    features: [
      '1 event per month',
      'Up to 10 participants',
      'Up to 2 MB per upload (compressed)',
      'Google Drive, OneDrive, Dropbox',
      'QR code sharing',
    ],
    cta:   'Current plan',
    badge: null,
  },
  {
    type:     'pro_annual',
    name:     'Pro',
    price:    '£9',
    note:     '/mo · billed £108/yr',
    features: [
      'Unlimited events',
      'Unlimited guests',
      'Full-resolution originals (25 MB+)',
      'No browser compression',
      'Live photo wall',
      'Priority upload queue',
      'Priority support',
      'Google Drive, OneDrive, Dropbox',
    ],
    cta:   'Get Pro',
    badge: 'Most popular',
  },
  {
    type:     'business_annual',
    name:     'Business',
    price:    '£29',
    note:     '/mo · billed £348/yr',
    features: [
      'Everything in Pro',
      'More than one collaborator',
      'Centralised photo repository',
      'White-label branding',
      'SSO & custom domain',
      'Branded event page',
      'Dedicated support & SLA',
    ],
    cta:   'Get Business',
    badge: null,
  },
];

function UpgradeModal({ onClose }) {
  const navigate = useNavigate();

  function choosePlan(type) {
    if (type === 'free') { onClose(); return; }
    onClose();
    navigate(`/checkout?type=${type}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,10,40,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center relative"
             style={{ background: 'linear-gradient(140deg, #6045f4 0%, #7060f6 45%, #53e6d4 100%)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Choose your plan</p>
          <h2 className="text-white text-2xl font-black tracking-tight">Simple, transparent pricing</h2>
          <p className="text-white/70 text-sm mt-2">Upgrade anytime. Cancel anytime. No hidden fees.</p>
        </div>

        {/* Plans */}
        <div className="p-6 grid md:grid-cols-3 gap-4">
          {UPGRADE_PLANS.map(plan => (
            <div
              key={plan.type}
              className={`relative rounded-2xl p-5 flex flex-col gap-3 border-2 transition-all hover:shadow-md ${
                plan.badge ? 'border-violet-500' : 'border-gray-100'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold text-white whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg, #6045f4, #53e6d4)' }}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{plan.name}</p>
                <p className="text-3xl font-black text-gray-900">{plan.price}
                  <span className="text-sm font-normal text-gray-400 ml-1">{plan.note}</span>
                </p>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4 mt-0.5 flex-shrink-0">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => choosePlan(plan.type)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={
                  plan.badge
                    ? { background: 'linear-gradient(135deg, #6045f4, #53e6d4)', color: '#fff' }
                    : { background: '#f4f3ff', color: '#6045f4' }
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
          <svg viewBox="0 0 20 20" fill="#34d399" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          Secure payment via Stripe · Cancel anytime
        </div>
      </div>
    </div>
  );
}

// ── Storage status (connected) ────────────────────────────────────────────────

const PROVIDER_META = {
  google_drive: {
    label:      'Google Drive',
    shortLabel: 'Drive',
    icon:       <DriveIcon />,
    folderNote: 'Photos are saved to a dedicated folder in your Google Drive.',
  },
  dropbox: {
    label:      'Dropbox',
    shortLabel: 'Dropbox',
    icon:       <DropboxIcon />,
    folderNote: 'Photos are saved to /Picachoo/<event name> in your Dropbox.',
  },
  onedrive: {
    label:      'OneDrive',
    shortLabel: 'OneDrive',
    icon:       <OneDriveIcon />,
    folderNote: 'Photos are saved to Picachoo/<event name> in your OneDrive.',
  },
};

// Maps our internal provider key to the DELETE endpoint path segment
const PROVIDER_ENDPOINT = {
  google_drive: 'google',
  dropbox:      'dropbox',
  onedrive:     'onedrive',
};

function StorageStatus({ provider, account, eventId, onDisconnected }) {
  const [confirming,    setConfirming]    = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error,         setError]         = useState('');
  const [storage,       setStorage]       = useState(null);  // null=loading | false=failed | object
  const [storageErr,    setStorageErr]    = useState('');

  const meta = PROVIDER_META[provider] ?? { label: provider, icon: <DriveIcon />, folderNote: '' };

  // Fetch quota lazily on mount
  useEffect(() => {
    let cancelled = false;
    getStorageInfo(eventId)
      .then(({ storage }) => { if (!cancelled) setStorage(storage); })
      .catch(err => { if (!cancelled) { setStorage(false); setStorageErr(err.message); } });
    return () => { cancelled = true; };
  }, [eventId]);

  async function handleDisconnect() {
    setDisconnecting(true); setError('');
    try {
      await disconnectStorage({ provider: PROVIDER_ENDPOINT[provider], eventId });
      onDisconnected();
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setDisconnecting(false);
    }
  }

  const levelColor = {
    ok:       { bar: '#34d399', text: '#34d399' },
    warning:  { bar: '#f59e0b', text: '#f59e0b' },
    critical: { bar: '#f87171', text: '#f87171' },
  };
  const colors = levelColor[storage?.level ?? 'ok'];

  return (
    <div className="storage-status">
      {/* Header: icon + name + account + folder link */}
      <div className="storage-status-header">
        <div className="storage-status-badge">
          {meta.icon}
          <div className="storage-status-text">
            <span className="storage-status-label">{meta.label} connected</span>
            {account && <span className="storage-status-account">{account}</span>}
          </div>
        </div>
        <div className="storage-status-actions">
          {storage?.folderUrl && (
            <a
              href={storage.folderUrl}
              target="_blank"
              rel="noreferrer"
              className="storage-folder-link"
              title={`Open ${meta.shortLabel} folder`}
            >
              <FolderIcon /> View files
            </a>
          )}
          <span className="storage-status-tick">✓</span>
        </div>
      </div>

      {/* Folder note */}
      <p className="storage-status-note">{meta.folderNote}</p>

      {/* Storage quota bar */}
      {storage === null && (
        <div className="storage-quota-loading">
          <div className="storage-quota-shimmer" />
        </div>
      )}

      {storage && storage !== false && (
        <div className="storage-quota">
          <div className="storage-quota-bar-track">
            <div
              className="storage-quota-bar-fill"
              style={{
                width:      `${Math.min(storage.pct, 100)}%`,
                background: colors.bar,
              }}
            />
          </div>
          <div className="storage-quota-labels">
            <span style={{ color: colors.text }}>
              {storage.level === 'critical' ? '⚠ ' : ''}
              {storage.usedFmt} used
              {storage.total > 0 ? ` of ${storage.totalFmt}` : ''}
            </span>
            {storage.total > 0 && (
              <span className="storage-quota-pct">{storage.pct}%</span>
            )}
          </div>
          {storage.level === 'critical' && (
            <p className="storage-quota-alert">
              Storage is almost full — guests may not be able to upload photos.
              Free up space or connect a different account.
            </p>
          )}
          {storage.level === 'warning' && (
            <p className="storage-quota-warn">
              Over 80% full — consider freeing up space soon.
            </p>
          )}
        </div>
      )}

      {storageErr && (
        <p className="storage-quota-fetch-err">Could not load storage info</p>
      )}

      {/* Disconnect error */}
      {error && <p className="msg-error">{error}</p>}

      {/* Disconnect flow */}
      {!confirming ? (
        <button className="storage-disconnect-btn" onClick={() => setConfirming(true)}>
          Switch storage provider
        </button>
      ) : (
        <div className="storage-confirm">
          <p className="storage-confirm-text">
            Disconnect {meta.shortLabel}? Existing photos won't be deleted,
            but new uploads will pause until you connect a provider.
          </p>
          <div className="storage-confirm-btns">
            <button className="btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={disconnecting}>
              Cancel
            </button>
            <button className="storage-confirm-disconnect" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting…' : 'Yes, disconnect'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoragePicker({ eventId, loginHint }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState('');

  async function connect(provider) {
    setLoading(provider); setError('');
    try {
      const redirectUrl = await initiateOAuth({ provider, eventId, loginHint });
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err.message ?? 'Failed to connect');
      setLoading(null);
    }
  }

  return (
    <div className="storage-picker">
      <p className="storage-picker-label">☁ Connect cloud storage to receive photos</p>
      {error && <p className="msg-error" style={{marginBottom:8}}>{error}</p>}
      <div className="storage-picker-btns">
        <button onClick={() => connect('google')} className="storage-provider-card" disabled={!!loading}>
          {loading === 'google' ? <span className="spin">↻</span> : <DriveIcon />}
          <span>Google Drive</span>
        </button>
        <button onClick={() => connect('dropbox')} className="storage-provider-card" disabled={!!loading}>
          {loading === 'dropbox' ? <span className="spin">↻</span> : <DropboxIcon />}
          <span>Dropbox</span>
        </button>
        <button onClick={() => connect('onedrive')} className="storage-provider-card" disabled={!!loading}>
          {loading === 'onedrive' ? <span className="spin">↻</span> : <OneDriveIcon />}
          <span>OneDrive</span>
        </button>
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
    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="drive-icon" aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg viewBox="0 0 43 40" xmlns="http://www.w3.org/2000/svg" className="drive-icon" aria-hidden="true">
      <path fill="#0061FF" d="M12.5 0L0 7.9l8.6 6.9L21 7.2 12.5 0zM0 21.7l12.5 7.9 8.5-7.2-8.6-6.9L0 21.7zM21 22.4l8.5 7.2L42 21.7l-12.4-6.2L21 22.4zM42 7.9L29.5 0 21 7.2l12.4 6.9L42 7.9zM21.1 23.9L12.5 31l-3.9-2.6v2.9l12.5 7.5 12.5-7.5v-2.9L29.5 31l-8.4-7.1z"/>
    </svg>
  );
}

function OneDriveIcon() {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="drive-icon" aria-hidden="true">
      <path fill="#1976d2" d="M28.2 18.5A12 12 0 0 0 17 11C10.4 11 5 16.4 5 23a12 12 0 0 0 .6 3.7A8.5 8.5 0 0 0 8.5 43h28a7.5 7.5 0 0 0 1.7-14.8A12 12 0 0 0 28.2 18.5z"/>
      <path fill="#42a5f5" d="M38.2 21.5A9 9 0 0 0 30 16a9 9 0 0 0-8.8 7.1A6 6 0 0 0 22 35h16a6 6 0 0 0 .2-12z" opacity=".85"/>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="drive-icon" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"/>
    </svg>
  );
}

function QRIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
    </svg>
  );
}

function PhotoCountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 16l5-5 4 4 3-3 6 6"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="drive-icon" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function TVIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}} aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>;
}

function LockBadge() {
  return <span className="lock-badge" aria-label="Pro feature">✦</span>;
}

function MoreIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14}} aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15,color:'#9ca3af'}} aria-hidden="true"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>;
}

function ChevronIcon({ open }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:13,height:13,transition:'transform 0.2s',transform:open?'rotate(180deg)':'rotate(0deg)'}} aria-hidden="true"><path strokeLinecap="round" d="M19 9l-7 7-7-7"/></svg>;
}

// ── Shared layout ─────────────────────────────────────────────────────────────

function Shell({ children }) {
  return (
    <div className="dash-shell">
      <header className="dash-header">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          pica<span>choo</span>
        </Link>
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
