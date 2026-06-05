import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function UpgradePage() {
  return (
    <MarketingLayout>
      <div className="pt-28 pb-24 px-6 relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-violet-600 top-0 left-1/2 -translate-x-1/2 opacity-15" />

        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
               style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}>
            ✦ Picachoo Pro
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Unlock full-resolution<br />
            <span className="grad-text">photography</span>
          </h1>

          <p className="mt-6 text-zinc-400 text-xl leading-relaxed">
            Go Pro and every guest's camera delivers its full 25 MB+ original — straight to your cloud, untouched.
          </p>

          {/* Pro card */}
          <div className="mt-12 pricing-popular rounded-3xl p-8 text-left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-violet-300 text-sm font-semibold uppercase tracking-widest">Pro plan</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-5xl font-black text-white">£9</span>
                  <span className="text-zinc-400 mb-2">/month</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 text-sm line-through">£12/mo</span>
                <p className="text-emerald-400 text-xs font-semibold">Save 25%</p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                ['Full-resolution originals (25 MB+)', true],
                ['No browser compression — raw pixels only', true],
                ['Unlimited events & guests', true],
                ['Live photo wall', true],
                ['Branded event pages', true],
                ['Priority upload queue', true],
                ['Advanced analytics', true],
                ['Priority email support', true],
              ].map(([feat]) => (
                <li key={feat} className="flex items-center gap-3 text-zinc-200 text-sm">
                  <svg viewBox="0 0 20 20" fill="#a78bfa" className="w-4 h-4 flex-shrink-0">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>

            <Link to="/dashboard"
                  className="block w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-center font-bold text-lg transition-all glow-violet hover:scale-[1.01]">
              Upgrade to Pro — £9/mo
            </Link>
            <p className="text-center text-zinc-500 text-xs mt-3">14-day free trial · Cancel any time</p>
          </div>

          {/* Comparison callout */}
          <div className="mt-8 glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-white/5">
              <div className="p-6 text-center">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Standard</p>
                <div className="text-4xl font-black text-zinc-600 mb-2">2 MB</div>
                <p className="text-zinc-600 text-xs">Browser-compressed</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-3">Pro ✦</p>
                <div className="text-4xl font-black grad-text mb-2">25 MB+</div>
                <p className="text-zinc-400 text-xs">Raw original</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-zinc-600 text-sm">
            Stay on Standard?{' '}
            <Link to="/dashboard" className="text-zinc-500 hover:text-white underline underline-offset-2 transition-colors">
              Go to dashboard
            </Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
