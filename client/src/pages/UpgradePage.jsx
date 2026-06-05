import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function UpgradePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <div className="bezl-hero relative pt-28 pb-24 px-6 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-6">
          ✦ Picachoo Pro
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Unlock full-resolution<br />photography
        </h1>
        <p className="mt-5 text-white/70 text-xl max-w-xl mx-auto">
          Go Pro and every guest's camera delivers its full 25 MB+ original — straight to your cloud, untouched.
        </p>
        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-xl mx-auto">
          {/* Pro card */}
          <div className="pricing-pro rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Pro plan</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-5xl font-black text-white">£9</span>
                  <span className="text-white/60 mb-2">/month</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white/40 text-sm line-through">£12/mo</span>
                <p className="text-emerald-300 text-xs font-semibold">Save 25%</p>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Full-resolution originals (25 MB+)',
                'No browser compression — raw pixels only',
                'Unlimited events & guests',
                'Live photo wall',
                'Branded event pages',
                'Priority upload queue',
                'Advanced analytics',
                'Priority email support',
              ].map(f => (
                <li key={f} className="flex items-center gap-3 text-white text-sm">
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4 flex-shrink-0 opacity-80"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="btn-white block w-full py-4 text-center text-base">
              Upgrade to Pro — £9/mo
            </Link>
            <p className="text-center text-white/50 text-xs mt-3">14-day free trial · Cancel any time</p>
          </div>

          {/* Comparison */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-8">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="p-6 text-center">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Standard</p>
                <div className="text-4xl font-black text-gray-300 mb-2">2 MB</div>
                <p className="text-gray-400 text-xs">Browser-compressed</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B5CE7' }}>Pro ✦</p>
                <div className="text-4xl font-black grad-text mb-2">25 MB+</div>
                <p className="text-gray-500 text-xs">Raw original</p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm">
            Stay on Standard?{' '}
            <Link to="/dashboard" className="underline underline-offset-2 hover:text-gray-700 transition-colors">
              Go to dashboard
            </Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
