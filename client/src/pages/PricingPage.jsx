import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function PricingPage() {
  return (
    <MarketingLayout>
      {/* Hero banner */}
      <div className="bezl-hero relative pt-28 pb-20 px-6 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-6">
          Pricing
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
          Simple, honest pricing
        </h1>
        <p className="mt-4 text-white/70 text-xl max-w-xl mx-auto">
          Start free. Upgrade when you need full-resolution quality.
        </p>
        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-5 mb-20">
            <Plan name="Standard" price="Free" description="For individuals and casual events."
              features={[
                { t: 'Unlimited events', ok: true },
                { t: 'Unlimited guests', ok: true },
                { t: 'Up to 2 MB per upload', ok: true },
                { t: 'Google Drive, OneDrive, Dropbox', ok: true },
                { t: 'Live photo wall', ok: true },
                { t: 'QR code sharing', ok: true },
                { t: 'Photo analytics', ok: true },
                { t: 'Full-resolution originals', ok: false },
                { t: 'Branded event pages', ok: false },
                { t: 'Priority support', ok: false },
              ]}
              cta="Get started free" ctaLink="/dashboard" popular={false} />
            <Plan name="Pro" price="£9" period="/mo" description="For photographers and professional hosts."
              features={[
                { t: 'Everything in Standard', ok: true },
                { t: 'Full-resolution originals (25 MB+)', ok: true },
                { t: 'No browser compression', ok: true },
                { t: 'Google Drive, OneDrive, Dropbox', ok: true },
                { t: 'Live photo wall', ok: true },
                { t: 'QR code sharing', ok: true },
                { t: 'Photo analytics', ok: true },
                { t: 'Branded event pages', ok: true },
                { t: 'Priority upload queue', ok: true },
                { t: 'Priority support', ok: true },
              ]}
              cta="Start 14-day trial" ctaLink="/dashboard" popular={true} />
            <Plan name="Enterprise" price="Custom" description="For venues, agencies, and large events."
              features={[
                { t: 'Everything in Pro', ok: true },
                { t: 'White-label branding', ok: true },
                { t: 'Custom domain', ok: true },
                { t: 'SSO & team management', ok: true },
                { t: 'SLA guarantee', ok: true },
                { t: 'Dedicated success manager', ok: true },
                { t: 'Onboarding & training', ok: true },
                { t: 'Volume pricing', ok: true },
                { t: '24/7 support', ok: true },
                { t: 'Custom storage integrations', ok: true },
              ]}
              cta="Contact us" ctaLink="/contact" popular={false} />
          </div>

          {/* Comparison table */}
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
                    <th className="px-6 py-4 text-gray-600 font-semibold text-center">Enterprise</th>
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
                    ['Support', 'Community', 'Priority email', '24/7 dedicated'],
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

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-3">
              {[
                { q: 'Do guests need to create an account?', a: 'Never. Guests just scan a QR code, enter their name, and upload. No app, no account.' },
                { q: 'Where do photos actually go?', a: 'Photos upload directly to your cloud storage — organised into a named event folder. Picachoo never stores your photos.' },
                { q: 'What does "full-resolution" mean on Pro?', a: 'On Standard, photos are compressed to ~2 MB before upload. On Pro, the original file is uploaded without any compression.' },
                { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. Your tier takes effect immediately on upgrade. On downgrade, it applies at the next billing cycle.' },
                { q: 'Is there a limit on events or guests?', a: "Both tiers support unlimited events and unlimited guests." },
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

function Plan({ name, price, period, description, features, cta, ctaLink, popular }) {
  return (
    <div className={`rounded-2xl p-7 flex flex-col gap-5 relative ${popular ? 'pricing-pro text-white' : 'pricing-free'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white whitespace-nowrap">Most popular</span>
        </div>
      )}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${popular ? 'text-white/70' : 'text-gray-400'}`}>{name}</p>
        <div className="flex items-end gap-1 mt-1.5">
          <span className={`text-4xl font-black ${popular ? 'text-white' : 'text-gray-900'}`}>{price}</span>
          {period && <span className={`text-sm mb-1 ${popular ? 'text-white/60' : 'text-gray-400'}`}>{period}</span>}
        </div>
        <p className={`text-sm mt-1.5 ${popular ? 'text-white/70' : 'text-gray-500'}`}>{description}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map(f => (
          <li key={f.t} className={`flex items-start gap-2 text-sm ${!f.ok ? (popular ? 'text-white/30' : 'text-gray-300') : (popular ? 'text-white' : 'text-gray-600')}`}>
            {f.ok
              ? <svg viewBox="0 0 20 20" fill={popular ? 'white' : '#6B5CE7'} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${popular ? 'opacity-80' : ''}`}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              : <svg viewBox="0 0 20 20" fill={popular ? 'rgba(255,255,255,0.2)' : '#d1d5db'} className="w-4 h-4 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            }
            {f.t}
          </li>
        ))}
      </ul>
      <Link to={ctaLink}
            className={`w-full py-3.5 rounded-full text-center font-semibold text-sm transition-all ${
              popular ? 'btn-white' : 'border-2 border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-600 transition-colors'
            }`}>
        {cta}
      </Link>
    </div>
  );
}
