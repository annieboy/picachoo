import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <div className="bezl-hero relative pt-28 pb-20 px-6 text-center overflow-hidden">
        <span className="section-eyebrow mb-6">
          Our story
        </span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight" style={{ color: '#000' }}>
          Built because<br />we were frustrated
        </h1>
        <p className="mt-5 text-xl max-w-2xl mx-auto" style={{ color: '#555' }}>
          Every host has lived the pain: "Just email me your photos." Nobody does. Picachoo is the fix.
        </p>
        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Origin */}
          <div className="rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 mb-16">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-5">The problem we solved</h2>
                <div className="space-y-4 text-gray-500 text-base leading-relaxed">
                  <p>You spend months planning an event. Hundreds of guests. Hundreds of cameras. Thousands of potential memories — and you end up with 30 photos from two people who bothered to email them.</p>
                  <p>Existing solutions asked guests to download an app, create an account, or use a clunky web form that compressed their photos through a server.</p>
                  <p>We built Picachoo to get completely out of the way. Scan. Snap. Done. Your cloud. Your files.</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Events hosted', value: '500+' },
                  { label: 'Photos uploaded', value: '120K+' },
                  { label: 'Avg time to first upload', value: '< 30s' },
                  { label: 'Guest app installs required', value: '0' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500 text-sm">{s.label}</span>
                    <span className="font-bold text-lg grad-text">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-black text-gray-900 text-center mb-10">What we believe</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: '🔒', title: 'Your memories belong to you', desc: "We never store your photos. They go direct to your cloud, in a folder you control, forever. No lock-in." },
                { icon: '⚡', title: 'Friction is the enemy', desc: "If there's a form to fill, an app to install, or an account to create — you've already lost guests." },
                { icon: '📸', title: 'Quality is non-negotiable', desc: "The 4K sensor in every modern phone deserves to be used fully. Pro delivers raw originals without compromise." },
              ].map(v => (
                <div key={v.title} className="feature-card p-6 text-center">
                  <span className="text-4xl block mb-4">{v.icon}</span>
                  <h3 className="text-gray-900 font-bold text-base mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-4">A small team, big ambition</h2>
            <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
              We're a small product team who love photography, events, and well-crafted software. We build Picachoo as the tool we wish existed.
            </p>
          </div>

          {/* CTA */}
          <div className="relative rounded-3xl p-10 text-center overflow-hidden"
               style={{ background: 'linear-gradient(135deg,#6045f4 0%,#7060f6 50%,#53e6d4 100%)', boxShadow: '0 16px 48px rgba(96,69,244,0.25)' }}>
            <h2 className="text-2xl font-black text-white mb-3">Ready to try it?</h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>Free forever for Standard. No credit card.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/dashboard" className="btn-white px-8 py-3.5 text-sm">Create your first event</Link>
              <Link to="/contact" className="btn-outline-white px-8 py-3.5 text-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#fff'; e.currentTarget.style.color='#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'; e.currentTarget.style.color='#fff'; }}>
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
