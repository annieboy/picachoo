import { useState } from 'react';
import MarketingLayout from '../components/MarketingLayout';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General enquiry', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setSubmitting(false);
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <div className="bezl-hero relative pt-28 pb-20 px-6 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-6">
          Contact
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">Let's talk</h1>
        <p className="mt-4 text-white/70 text-xl max-w-xl mx-auto">We read every message. Usually reply within one business day.</p>
        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10">
          {/* Info */}
          <div className="md:col-span-2 space-y-4">
            {[
              { icon: '💬', title: 'General enquiries', desc: 'Questions about how Picachoo works, pricing, or getting started.' },
              { icon: '🛠️', title: 'Support', desc: "Having trouble with an event, upload, or cloud connection? We'll help." },
              { icon: '🤝', title: 'Partnerships', desc: 'Venues, event companies, and photography studios — let\'s talk.' },
              { icon: '🏢', title: 'Enterprise', desc: 'Need custom branding, SSO, or volume pricing? We have options.' },
            ].map(c => (
              <div key={c.title} className="feature-card p-5 flex gap-4">
                <span className="text-2xl mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{c.title}</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="text-gray-900 font-black text-xl">Message sent!</h2>
                <p className="text-gray-500 text-sm max-w-xs">We'll get back to you within 1–2 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Your name" type="text" placeholder="Jane Smith" required value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                  <Field label="Email" type="email" placeholder="jane@example.com" required value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Subject</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                          className="w-full rounded-xl px-4 py-3 text-gray-800 text-sm outline-none border border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 bg-white transition-colors">
                    {['General enquiry', 'Technical support', 'Billing', 'Partnership', 'Enterprise', 'Other'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Message</label>
                  <textarea rows={5} required placeholder="Tell us what's on your mind…"
                            value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                            className="w-full rounded-xl px-4 py-3 text-gray-800 text-sm outline-none border border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 resize-none transition-colors" />
                </div>
                <button type="submit" disabled={submitting}
                        className="btn-purple w-full py-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

function Field({ label, type, placeholder, required, value, onChange }) {
  return (
    <div>
      <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{label}</label>
      <input type={type} placeholder={placeholder} required={required} value={value} onChange={e => onChange(e.target.value)}
             className="w-full rounded-xl px-4 py-3 text-gray-800 text-sm outline-none border border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-colors" />
    </div>
  );
}
