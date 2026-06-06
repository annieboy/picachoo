import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { setAuthToken, createCheckoutIntent, applyPromoCode } from '../api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ── Plan metadata ─────────────────────────────────────────────────────────────
const PLAN_META = {
  one_time_pass: {
    name:     'Pro Event Pass',
    price:    '£19',
    billing:  'One-time payment, no subscription',
    note:     'Valid for 30 days from purchase',
    features: ['Full-resolution originals', 'No browser compression', 'For one specific event'],
  },
  pro_annual: {
    name:     'Pro Annual Plan',
    price:    '£108',
    billing:  'Billed today, renews annually',
    note:     '£9 / month equivalent',
    features: ['Full-resolution across all events', 'No compression', 'Priority support'],
  },
  business_annual: {
    name:     'Business Annual Plan',
    price:    '£348',
    billing:  'Billed today, renews annually',
    note:     '£29 / month · billed £348/yr',
    features: ['Everything in Pro', 'Team & org management', 'Dedicated support & SLA'],
  },
};

// ── Checkout page ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const type    = searchParams.get('type');
  const eventId = searchParams.get('eventId');
  const plan    = PLAN_META[type];

  const [clientSecret,   setClientSecret]   = useState(null);
  const [userEmail,      setUserEmail]      = useState('');
  const [loading,        setLoading]        = useState(true);
  const [initError,      setInitError]      = useState('');
  const [hostEvents,     setHostEvents]     = useState(null);
  const [selectedEvent,  setSelectedEvent]  = useState(eventId ?? null);
  const [pickingEvent,   setPickingEvent]   = useState(false);

  useEffect(() => {
    if (!plan) { navigate('/pricing'); return; }

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const q = new URLSearchParams({ intent: type });
        if (eventId) q.set('eventId', eventId);
        navigate(`/dashboard?${q}`);
        return;
      }
      setAuthToken(session.access_token);
      setUserEmail(session.user.email ?? '');

      if (type === 'one_time_pass' && !eventId) {
        try {
          const res = await fetch('/api/hosts/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const d = await res.json();
            setHostEvents(d.events ?? []);
          } else {
            setHostEvents([]);
          }
        } catch {
          setHostEvents([]);
        }
        setPickingEvent(true);
        setLoading(false);
        return;
      }

      try {
        const { clientSecret: cs } = await createCheckoutIntent({ type, eventId: eventId ?? selectedEvent });
        setClientSecret(cs);
      } catch (err) {
        setInitError(err.message ?? 'Could not initialise checkout. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEventPicked(evId) {
    setSelectedEvent(evId);
    setPickingEvent(false);
    setLoading(true);
    try {
      const { clientSecret: cs } = await createCheckoutIntent({ type, eventId: evId });
      setClientSecret(cs);
    } catch (err) {
      setInitError(err.message ?? 'Could not initialise checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spinner />;

  if (initError) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-red-600 text-sm bg-red-50 px-5 py-3 rounded-xl">{initError}</p>
          <Link to="/pricing" className="text-violet-600 text-sm hover:underline">← Back to pricing</Link>
        </div>
      </PageShell>
    );
  }

  if (pickingEvent) {
    return (
      <PageShell>
        <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Which event is this pass for?</h1>
        <p className="text-gray-400 text-sm text-center mb-10">
          Select the event you want to unlock full-resolution uploads for
        </p>
        <div className="max-w-md mx-auto">
          {hostEvents && hostEvents.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <p className="text-gray-500 text-sm mb-4">Create an event in your dashboard first</p>
              <Link to="/dashboard" className="text-violet-600 text-sm font-semibold hover:underline">Go to dashboard →</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {(hostEvents ?? []).map(ev => (
                <li key={ev.id}>
                  <button
                    onClick={() => handleEventPicked(ev.id)}
                    className="w-full text-left flex items-center justify-between px-4 py-3.5 rounded-2xl border border-gray-100 hover:border-violet-300 hover:bg-violet-50 transition-colors group bg-white shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-violet-700">{ev.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{ev.status}</p>
                    </div>
                    <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageShell>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary:     '#6045f4',
      colorBackground:  '#ffffff',
      colorText:        '#1f1f2e',
      colorDanger:      '#ef4444',
      fontFamily:       'Inter, system-ui, sans-serif',
      spacingUnit:      '4px',
      borderRadius:     '12px',
      fontSizeBase:     '15px',
    },
    rules: {
      '.Input': { border: '1.5px solid #e5e7eb', padding: '12px 14px' },
      '.Input:focus': { border: '1.5px solid #6045f4', boxShadow: '0 0 0 3px rgba(107,92,231,0.15)' },
      '.Label': { fontSize: '13px', fontWeight: '500', color: '#4b5563', marginBottom: '6px' },
    },
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Secure checkout</h1>
      <p className="text-gray-400 text-sm text-center mb-10">
        Payments are secure and encrypted, so your details stay safe
      </p>

      <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Left: email + payment ───────────────────────────────────────── */}
        <div className="space-y-5">

          {/* 1. Email */}
          <Section number="1" title="Email">
            <p className="text-gray-900 text-sm font-medium">{userEmail}</p>
            <p className="mt-1 text-gray-400 text-xs flex items-center gap-1.5">
              <InfoIcon />
              A receipt will be sent to this address
            </p>
          </Section>

          {/* 2. Payment details */}
          <Section number="2" title="Payment details">
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                <PaymentForm plan={plan} type={type} />
              </Elements>
            )}
          </Section>
        </div>

        {/* ── Right: plan summary ─────────────────────────────────────────── */}
        <PlanSummary plan={plan} />
      </div>
    </PageShell>
  );
}

// ── Payment form (inside Elements context) ────────────────────────────────────

function PaymentForm({ plan, type }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [processing,   setProcessing]   = useState(false);
  const [ready,        setReady]        = useState(false);
  const [error,        setError]        = useState('');
  const [promoOpen,    setPromoOpen]    = useState(false);
  const [promoCode,    setPromoCode]    = useState('');
  const [promoResult,  setPromoResult]  = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const result = await applyPromoCode({ code: promoCode.trim(), type });
      setPromoResult({ valid: true, discount: result.discount, message: result.message });
    } catch {
      setPromoResult({ valid: false, message: 'Invalid promo code' });
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements || !ready) return;
    setProcessing(true);
    setError('');

    const successType = type === 'one_time_pass' ? 'pass' : 'subscription';

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?checkout=success&type=${successType}`,
      },
    });

    if (confirmErr) {
      setError(confirmErr.message ?? 'Payment failed. Please try again.');
      setProcessing(false);
    } else {
      navigate(`/dashboard?checkout=success&type=${successType}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!ready && (
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      )}
      <PaymentElement options={{ layout: 'tabs' }} onReady={() => setReady(true)} />

      <div className="space-y-2">
        {!promoOpen && (
          <button
            type="button"
            onClick={() => setPromoOpen(true)}
            className="text-xs text-gray-400 hover:text-violet-600 transition-colors"
          >
            Have a promo code?
          </button>
        )}
        {promoOpen && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-50"
            >
              {promoLoading ? '…' : 'Apply'}
            </button>
          </div>
        )}
        {promoResult && (
          <p className={`text-xs font-medium ${promoResult.valid ? 'text-emerald-600' : 'text-red-500'}`}>
            {promoResult.message}
          </p>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !ready || processing}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #6045f4 0%, #53e6d4 100%)' }}
      >
        {processing ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Processing payment…
          </span>
        ) : (
          `Pay ${plan.price}`
        )}
      </button>

      {/* Cancel transaction — prominent, below Pay button */}
      <button
        type="button"
        onClick={() => window.history.length > 1 ? window.history.back() : navigate('/dashboard')}
        className="w-full py-3.5 rounded-2xl font-semibold text-sm border transition-colors hover:bg-gray-50 active:bg-gray-100"
        style={{ color: '#6045f4', borderColor: '#e0deff', background: '#fff' }}
      >
        Cancel transaction
      </button>

      <p className="text-center text-gray-400 text-xs leading-relaxed">
        By completing this purchase you agree to our{' '}
        <Link to="/terms" className="underline hover:text-gray-600 transition-colors">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" className="underline hover:text-gray-600 transition-colors">Privacy Policy</Link>.
      </p>
    </form>
  );
}

// ── Plan summary sidebar ──────────────────────────────────────────────────────

function PlanSummary({ plan }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm md:sticky md:top-8">
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">Plan summary</p>

      <h3 className="text-gray-900 font-black text-xl mb-1">{plan.name}</h3>
      <p className="text-violet-600 text-xs font-semibold mb-5">{plan.note}</p>

      <hr className="border-gray-100 mb-5" />

      <ul className="space-y-3 mb-6">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
            <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-80">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <hr className="border-gray-100 mb-4" />

      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span>Subtotal</span>
        <span className="font-medium text-gray-900">{plan.price}</span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-gray-900">Total due today</span>
        <span className="font-black text-gray-900 text-xl">{plan.price}</span>
      </div>
      <p className="text-gray-400 text-xs mb-4">{plan.billing}</p>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50">
        <svg viewBox="0 0 20 20" fill="#6045f4" className="w-4 h-4 flex-shrink-0">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
        <span className="text-gray-600 text-xs font-medium">Secure payment · Cancel anytime</span>
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function PageShell({ children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ background: '#f8f7ff' }}>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-black text-xl tracking-tight text-gray-900">
            pica<span style={{ color: '#6045f4' }}>choo</span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="#back"
              onClick={e => { e.preventDefault(); window.history.length > 1 ? window.history.back() : navigate('/dashboard'); }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </a>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="#34d399" className="w-4 h-4">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs text-gray-500 font-medium">Secure checkout</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </div>
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-4">
        <span className="text-gray-400 mr-1">{number}.</span> {title}
      </h2>
      {children}
    </div>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="#6045f4" className="w-3.5 h-3.5 flex-shrink-0">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
    </svg>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f7ff' }}>
      <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#e9e6ff" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#6045f4" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
