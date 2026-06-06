import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MarketingLayout from '../components/MarketingLayout';

// ── Billing toggle ────────────────────────────────────────────────────────────

function BillingToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-gray-200 bg-gray-50 shadow-sm">
      {['one_time', 'annual'].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none"
          style={value === v
            ? { background: 'linear-gradient(135deg, #5B52E8, #29BFBF)', color: '#fff', boxShadow: '0 2px 10px rgba(91,82,232,0.35)' }
            : { color: '#6b7280' }
          }
        >
          {v === 'one_time' ? 'One time' : 'Monthly (Billed Annually)'}
        </button>
      ))}
    </div>
  );
}

// ── Checkout helper ───────────────────────────────────────────────────────────

function useCheckout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  async function startCheckout(type, eventId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const q = new URLSearchParams({ intent: type });
      if (eventId) q.set('eventId', eventId);
      navigate(`/dashboard?${q}`);
      return;
    }
    setLoading(type);
    const q = new URLSearchParams({ type });
    if (eventId) q.set('eventId', eventId);
    navigate(`/checkout?${q}`);
    setLoading(null);
  }

  return { startCheckout, loading, error: '' };
}

// ── Main pricing page ─────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState('one_time');
  const { startCheckout, loading, error } = useCheckout();

  const isOneTime = billing === 'one_time';

  return (
    <MarketingLayout>

      {/* Hero banner */}
      <div className="bezl-hero relative pt-28 pb-24 px-6 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-6">
          Pricing
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-white/70 text-xl max-w-xl mx-auto mb-10">
          {isOneTime
            ? 'One-time passes for single events. No subscription needed.'
            : 'Annual plans for power users. Save compared to monthly.'}
        </p>

        {/* Toggle */}
        <div className="flex justify-center">
          <BillingToggle value={billing} onChange={setBilling} />
        </div>

        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">

          {error && (
            <div className="mb-8 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* ── Plans grid ─────────────────────────────────────────────────── */}
          <div className={`grid gap-5 mb-20 ${isOneTime ? 'md:grid-cols-3' : 'md:grid-cols-3'}`}>

            {/* Standard — same in both modes */}
            <Plan
              name="Standard"
              badge={null}
              price="Free"
              priceNote={null}
              description="For individuals and casual events."
              features={[
                'Unlimited events',
                'Unlimited guests',
                'Up to 2 MB per upload (compressed)',
                'Google Drive, OneDrive, Dropbox',
                'Live photo wall',
                'QR code sharing',
              ]}
              unavailable={['Full-resolution originals', 'Branded event pages', 'Priority support']}
              cta="Get started free"
              onCta={() => window.location.href = '/dashboard'}
              ctaLoading={false}
              popular={false}
            />

            {/* Pro — changes per billing mode */}
            <Plan
              name="Pro"
              badge={isOneTime ? 'Best for Weddings & Galas' : 'Most popular'}
              price={isOneTime ? '£19' : '£9'}
              priceNote={isOneTime ? '/ event pass' : '/mo · Billed annually (£108 upfront)'}
              description={isOneTime
                ? 'Full-resolution uploads for one event. Valid 30 days.'
                : 'For photographers and professional hosts. Cancel anytime.'}
              features={[
                'Everything in Standard',
                'Full-resolution originals (25 MB+)',
                'No browser compression',
                'Priority upload queue',
                'Branded event pages',
                'Priority support',
              ]}
              unavailable={[]}
              cta={isOneTime ? 'Get One-Time Pass' : 'Get Pro Annual'}
              onCta={() => isOneTime ? startCheckout('one_time_pass') : startCheckout('pro_annual')}
              ctaLoading={loading === (isOneTime ? 'one_time_pass' : 'pro_annual')}
              popular={true}
            />

            {/* Enterprise / Business */}
            <Plan
              name={isOneTime ? 'Enterprise' : 'Business / Orgs'}
              badge={null}
              price={isOneTime ? 'Custom' : '£29'}
              priceNote={isOneTime ? null : '/mo · Billed annually (£348 upfront)'}
              description={isOneTime
                ? 'For venues, agencies, and large events.'
                : 'For teams, field crews, venues, and unified corporate photo repositories.'}
              features={isOneTime
                ? ['Everything in Pro', 'White-label branding', 'Custom domain', 'SSO & team management', 'SLA guarantee', 'Dedicated success manager']
                : ['Everything in Pro', 'Team management', 'Centralised photo repository', 'White-label branding', 'SSO & custom domain', 'Dedicated support & SLA']
              }
              unavailable={[]}
              cta={isOneTime ? 'Contact Sales' : 'Get Business Annual'}
              onCta={() => isOneTime
                ? window.location.href = '/contact'
                : startCheckout('business_annual')
              }
              ctaLoading={loading === 'business_annual'}
              popular={false}
            />
          </div>

          {/* ── Comparison table ──────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-16">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-gray-900 font-bold text-xl">Full comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-4 text-gray-500 font-semibold">Feature</th>
                    <th className="px-6 py-4 text-gray-600 font-semibold text-center">Standard</th>
                    <th className="px-6 py-4 font-semibold text-center" style={{ color: '#6B5CE7' }}>Pro</th>
                    <th className="px-6 py-4 text-gray-600 font-semibold text-center">
                      {isOneTime ? 'Enterprise' : 'Business'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Max upload size', '2 MB', '25 MB+', 'Unlimited'],
                    ['Events', 'Unlimited', 'Unlimited', 'Unlimited'],
                    ['Guests per event', 'Unlimited', 'Unlimited', 'Unlimited'],
                    ['Storage providers', '3', '3', 'Custom'],
                    ['Live photo wall', '✓', '✓', '✓'],
                    ['QR code sharing', '✓', '✓', '✓'],
                    ['Analytics', 'Basic', 'Advanced', 'Custom'],
                    ['Branded pages', '—', '✓', '✓'],
                    ['Custom domain', '—', '—', '✓'],
                    ['Support', 'Community', 'Priority email', isOneTime ? '24/7 dedicated' : 'Dedicated + SLA'],
                  ].map(([label, std, pro, ent]) => (
                    <tr key={label} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-gray-600">{label}</td>
                      <td className="px-6 py-3.5 text-gray-500 text-center">{std}</td>
                      <td className="px-6 py-3.5 text-center font-medium" style={{ color: '#6B5CE7' }}>{pro}</td>
                      <td className="px-6 py-3.5 text-gray-500 text-center">{ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── FAQ ─────────────────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-3">
              {[
                { q: 'Do guests need to create an account?', a: 'Never. Guests just scan a QR code, enter their name, and upload. No app, no account required.' },
                { q: 'What is a one-time event pass?', a: 'A £19 pass unlocks full-resolution uploads for a single event for 30 days from purchase. Perfect for weddings, galas, or any one-off event.' },
                { q: 'How does the annual plan work?', a: 'You pay upfront for the year (£108 for Pro, £348 for Business). Full-resolution uploads are unlocked across all your events for 12 months.' },
                { q: 'What does "full-resolution" mean?', a: 'On Standard, photos are compressed to ~2 MB before upload. On Pro (pass or annual), the original file is uploaded without any compression — exactly as captured.' },
                { q: 'Where do photos actually go?', a: 'Photos upload directly to your cloud storage — organised into a named event folder. Picachoo never stores your photos.' },
                { q: 'Can I upgrade or cancel at any time?', a: 'Annual plans can be cancelled before renewal. One-time passes are non-refundable but are valid for 30 days from purchase.' },
              ].map(f => (
                <details key={f.q} className="border border-gray-100 rounded-xl group">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                    <span className="text-gray-800 font-medium text-sm">{f.q}</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────

function Plan({ name, badge, price, priceNote, description, features, unavailable, cta, onCta, ctaLoading, popular }) {
  return (
    <div className={`rounded-2xl p-7 flex flex-col gap-5 relative ${popular ? 'pricing-pro text-white' : 'pricing-free'}`}>

      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${popular ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
            {badge}
          </span>
        </div>
      )}

      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${popular ? 'text-white/70' : 'text-gray-400'}`}>{name}</p>
        <div className="flex items-end gap-1 mt-1.5 flex-wrap">
          <span className={`text-4xl font-black leading-none ${popular ? 'text-white' : 'text-gray-900'}`}>{price}</span>
        </div>
        {priceNote && (
          <p className={`text-xs mt-1.5 font-medium ${popular ? 'text-white/70' : 'text-violet-600'}`}>{priceNote}</p>
        )}
        <p className={`text-sm mt-2 ${popular ? 'text-white/70' : 'text-gray-500'}`}>{description}</p>
      </div>

      <ul className="space-y-2 flex-1">
        {features.map(t => (
          <li key={t} className={`flex items-start gap-2 text-sm ${popular ? 'text-white' : 'text-gray-600'}`}>
            <svg viewBox="0 0 20 20" fill={popular ? 'white' : '#6B5CE7'} className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-80">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {t}
          </li>
        ))}
        {unavailable.map(t => (
          <li key={t} className={`flex items-start gap-2 text-sm ${popular ? 'text-white/30' : 'text-gray-300'}`}>
            <svg viewBox="0 0 20 20" fill={popular ? 'rgba(255,255,255,0.2)' : '#d1d5db'} className="w-4 h-4 mt-0.5 flex-shrink-0">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            {t}
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        disabled={ctaLoading}
        className={`w-full py-3.5 rounded-full text-center font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          popular
            ? 'btn-white'
            : 'border-2 border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-600 transition-colors'
        }`}
      >
        {ctaLoading ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4"/>
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            Redirecting…
          </span>
        ) : cta}
      </button>
    </div>
  );
}
