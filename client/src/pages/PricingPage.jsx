import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function PricingPage() {
  return (
    <MarketingLayout>
      <div className="pt-28 pb-24 px-6 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-violet-600 -top-40 -left-40 opacity-10" />
        <div className="orb w-[400px] h-[400px] bg-violet-400 top-1/2 -right-40 opacity-10" style={{ animationDelay: '10s' }} />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Pricing</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              Simple, honest <span className="grad-text">pricing</span>
            </h1>
            <p className="mt-5 text-zinc-400 text-xl max-w-xl mx-auto">
              Start free. Upgrade when you need full-resolution quality and power-host features.
            </p>
          </div>

          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            <Plan
              name="Standard"
              price="Free"
              description="For individuals and casual events."
              features={[
                { t: 'Unlimited events', ok: true },
                { t: 'Unlimited guests', ok: true },
                { t: 'Up to 2 MB per upload (compressed)', ok: true },
                { t: 'Google Drive, OneDrive, Dropbox', ok: true },
                { t: 'Live photo wall', ok: true },
                { t: 'QR code sharing', ok: true },
                { t: 'Photo analytics', ok: true },
                { t: 'Full-resolution originals', ok: false },
                { t: 'Branded event pages', ok: false },
                { t: 'Priority support', ok: false },
              ]}
              cta="Get started free"
              ctaLink="/dashboard"
              popular={false}
            />
            <Plan
              name="Pro"
              price="£9"
              period="/mo"
              description="For photographers and professional hosts."
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
              cta="Start 14-day trial"
              ctaLink="/dashboard"
              popular={true}
            />
            <Plan
              name="Enterprise"
              price="Custom"
              description="For venues, agencies, and large-scale events."
              features={[
                { t: 'Everything in Pro', ok: true },
                { t: 'White-label branding', ok: true },
                { t: 'Custom domain', ok: true },
                { t: 'SSO & team management', ok: true },
                { t: 'SLA guarantee', ok: true },
                { t: 'Dedicated success manager', ok: true },
                { t: 'Onboarding & training', ok: true },
                { t: 'Custom storage integrations', ok: true },
                { t: 'Volume pricing', ok: true },
                { t: '24/7 support', ok: true },
              ]}
              cta="Contact us"
              ctaLink="/contact"
              popular={false}
            />
          </div>

          {/* Comparison table */}
          <div className="glass rounded-2xl overflow-hidden mb-16">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-white font-bold text-xl">Full comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-zinc-500 font-semibold">Feature</th>
                    <th className="px-6 py-4 text-zinc-400 font-semibold text-center">Standard</th>
                    <th className="px-6 py-4 text-violet-300 font-semibold text-center">Pro</th>
                    <th className="px-6 py-4 text-zinc-400 font-semibold text-center">Enterprise</th>
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
                    <tr key={label} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-3.5 text-zinc-400">{label}</td>
                      <td className="px-6 py-3.5 text-zinc-500 text-center">{std}</td>
                      <td className="px-6 py-3.5 text-violet-300 text-center font-medium">{pro}</td>
                      <td className="px-6 py-3.5 text-zinc-500 text-center">{ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Do guests need to create an account?',
                  a: 'Never. Guests just scan a QR code, enter their name, and upload. No app, no account, no friction.',
                },
                {
                  q: 'Where do photos actually go?',
                  a: 'Photos upload directly to your cloud storage (Google Drive, OneDrive, or Dropbox) — organised into a named event folder. Picachoo never stores your photos.',
                },
                {
                  q: 'What does "full-resolution" mean on Pro?',
                  a: 'On Standard, photos are compressed in the browser to ~2 MB before upload. On Pro, the original file is uploaded without any compression — straight from the camera sensor.',
                },
                {
                  q: 'Can I upgrade or downgrade at any time?',
                  a: 'Yes. Your tier takes effect immediately on upgrade. On downgrade, it applies at the next billing cycle.',
                },
                {
                  q: 'Is there a limit on how many events I can run?',
                  a: "Both tiers support unlimited events and unlimited guests. We don't cap usage.",
                },
              ].map(f => (
                <details key={f.q} className="glass rounded-xl group">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                    <span className="text-white font-medium text-sm">{f.q}</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">{f.a}</div>
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
    <div className={`rounded-2xl p-7 flex flex-col gap-5 relative ${popular ? 'pricing-popular' : 'glass'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white whitespace-nowrap">Most popular</span>
        </div>
      )}
      <div>
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">{name}</p>
        <div className="flex items-end gap-1 mt-1.5">
          <span className="text-4xl font-black text-white">{price}</span>
          {period && <span className="text-zinc-500 text-sm mb-1">{period}</span>}
        </div>
        <p className="text-zinc-500 text-sm mt-1.5">{description}</p>
      </div>

      <ul className="space-y-2 flex-1">
        {features.map(f => (
          <li key={f.t} className={`flex items-start gap-2 text-sm ${f.ok ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {f.ok
              ? <svg viewBox="0 0 20 20" fill={popular ? '#a78bfa' : '#52525b'} className="w-4 h-4 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              : <svg viewBox="0 0 20 20" fill="#3f3f46" className="w-4 h-4 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            }
            {f.t}
          </li>
        ))}
      </ul>

      <Link to={ctaLink}
            className={`w-full py-3.5 rounded-xl text-center font-semibold text-sm transition-all ${
              popular
                ? 'bg-violet-600 hover:bg-violet-500 text-white glow-sm'
                : 'glass text-zinc-300 hover:text-white'
            }`}>
        {cta}
      </Link>
    </div>
  );
}
