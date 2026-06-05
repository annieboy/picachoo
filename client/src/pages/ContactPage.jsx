import { useState } from 'react';
import MarketingLayout from '../components/MarketingLayout';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General enquiry', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    // Simulated submit — replace with real endpoint or Formspree
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setSubmitting(false);
  };

  return (
    <MarketingLayout>
      <div className="pt-28 pb-24 px-6 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-violet-600 -top-40 -left-40 opacity-10" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Contact</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              Let's <span className="grad-text">talk</span>
            </h1>
            <p className="mt-5 text-zinc-400 text-xl max-w-xl mx-auto">
              Questions, feedback, partnerships, or enterprise enquiries — we read every message.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-10">
            {/* Left info panel */}
            <div className="md:col-span-2 space-y-6">
              {[
                {
                  icon: '💬',
                  title: 'General enquiries',
                  desc: 'Questions about how Picachoo works, pricing, or getting started.',
                },
                {
                  icon: '🛠️',
                  title: 'Support',
                  desc: 'Having trouble with an event, upload, or cloud connection? We\'ll help.',
                },
                {
                  icon: '🤝',
                  title: 'Partnerships',
                  desc: 'Venues, event companies, and photography studios — let\'s talk.',
                },
                {
                  icon: '🏢',
                  title: 'Enterprise',
                  desc: 'Need custom branding, SSO, or volume pricing? We have options.',
                },
              ].map(c => (
                <div key={c.title} className="glass rounded-xl p-5 flex gap-4">
                  <span className="text-2xl mt-0.5">{c.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{c.title}</p>
                    <p className="text-zinc-500 text-sm mt-1 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              {sent ? (
                <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[400px]">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="text-white font-bold text-xl">Message sent!</h2>
                  <p className="text-zinc-400 text-sm max-w-xs">We'll get back to you within 1–2 business days.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Your name" type="text" placeholder="Jane Smith" required
                           value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                    <Field label="Email" type="email" placeholder="jane@example.com" required
                           value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Subject</label>
                    <select value={form.subject}
                            onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-violet-500"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {['General enquiry', 'Technical support', 'Billing', 'Partnership', 'Enterprise', 'Other'].map(o => (
                        <option key={o} value={o} style={{ background: '#18181b' }}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Message</label>
                    <textarea rows={5} required
                              placeholder="Tell us what's on your mind…"
                              value={form.message}
                              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                              className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>

                  <button type="submit" disabled={submitting}
                          className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

function Field({ label, type, placeholder, required, value, onChange }) {
  return (
    <div>
      <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</label>
      <input type={type} placeholder={placeholder} required={required} value={value}
             onChange={e => onChange(e.target.value)}
             className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-violet-500"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
    </div>
  );
}
