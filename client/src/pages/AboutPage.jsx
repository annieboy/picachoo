import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';

export default function AboutPage() {
  return (
    <MarketingLayout>
      <div className="pt-28 pb-24 px-6 relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-violet-600 -top-60 -right-40 opacity-10" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-20">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Our story</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Built because{' '}
              <span className="grad-text">we were frustrated</span>
            </h1>
            <p className="mt-6 text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Every wedding photographer, every events manager, every host has lived this pain: "Just email me your photos." Nobody does. Picachoo is the fix.
            </p>
          </div>

          {/* Origin story */}
          <div className="glass rounded-3xl p-8 md:p-12 mb-16">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-black text-white mb-5">The problem we solved</h2>
                <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
                  <p>
                    You spend months planning an event. Hundreds of guests. Hundreds of cameras. Thousands of potential memories — and you end up with 30 photos from two people who bothered to email them.
                  </p>
                  <p>
                    Existing solutions asked guests to download an app, create an account, or use some clunky web form that munched their photos through a server and returned compressed thumbnails.
                  </p>
                  <p>
                    We built Picachoo to get out of the way entirely. Scan. Snap. Done. Your cloud. Your files.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Events hosted', value: '500+' },
                  { label: 'Photos uploaded', value: '120K+' },
                  { label: 'Average time to first upload', value: '< 30s' },
                  { label: 'Guest app installs required', value: '0' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <span className="text-zinc-500 text-sm">{s.label}</span>
                    <span className="text-white font-bold text-lg grad-text">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-black text-white text-center mb-10">What we believe</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: '🔒',
                  title: 'Your memories belong to you',
                  desc: "We never store your photos. They go direct to your cloud, in a folder you control, forever. No lock-in.",
                },
                {
                  icon: '⚡',
                  title: 'Friction is the enemy',
                  desc: "If there's a form to fill, an app to install, or an account to create — you've already lost guests. We remove every barrier.",
                },
                {
                  icon: '📸',
                  title: 'Quality is non-negotiable',
                  desc: "The 4K sensor in every modern phone deserves to be used fully. We built Pro to deliver raw originals without compromise.",
                },
              ].map(v => (
                <div key={v.title} className="glass rounded-2xl p-6 text-center">
                  <span className="text-4xl block mb-4">{v.icon}</span>
                  <h3 className="text-white font-bold text-base mb-2">{v.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black text-white mb-4">A small team, big ambition</h2>
            <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
              We're a small product team who love photography, events, and well-crafted software. We build Picachoo as the tool we wish existed.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center rounded-2xl p-10"
               style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.05))', border: '1px solid rgba(124,58,237,0.25)' }}>
            <h2 className="text-2xl font-black text-white mb-3">Ready to try it?</h2>
            <p className="text-zinc-400 mb-6">Free forever for Standard. No credit card.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/dashboard"
                    className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors glow-sm">
                Create your first event
              </Link>
              <Link to="/contact"
                    className="px-8 py-3.5 rounded-xl glass text-zinc-300 hover:text-white font-semibold transition-colors">
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
