import MarketingLayout from '../components/MarketingLayout';

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="bezl-hero relative pt-28 pb-20 px-6 text-center overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-white/60 text-sm mt-3">Last updated: June 2025</p>
        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-gray-100 p-8 md:p-10 space-y-8 text-gray-500 text-sm leading-relaxed">
            <div className="rounded-xl p-4 text-sm bg-violet-50 border border-violet-100 text-violet-700">
              <strong className="text-violet-800">Placeholder document.</strong> This draft should be reviewed by a qualified legal professional, and may need to comply with GDPR, UK GDPR, CCPA, or other applicable regulations.
            </div>
            {sections.map(s => (
              <section key={s.title}>
                <h2 className="text-gray-900 font-bold text-base mb-3">{s.title}</h2>
                {s.content}
              </section>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

const sections = [
  { title: '1. Who we are', content: <p>Picachoo ("we", "us", "our") operates the photo-sharing platform at picachoo.app. This policy explains how we collect, use, and protect personal data when you use our Service.</p> },
  { title: '2. Data we collect', content: <><p><strong className="text-gray-700">Hosts:</strong> Email address, display name, and authentication data (via Google or magic link). We also store encrypted OAuth tokens to connect your cloud storage accounts.</p><p className="mt-2"><strong className="text-gray-700">Guests:</strong> We collect only the name you provide before uploading. No email, no account, no persistent identifier.</p><p className="mt-2"><strong className="text-gray-700">Usage data:</strong> Standard server logs retained for a maximum of 30 days for security and debugging.</p></> },
  { title: '3. How we use your data', content: <ul className="space-y-1 list-disc list-inside">{['To authenticate host accounts and maintain sessions','To route uploads to the correct cloud storage destination','To display photo analytics on the host dashboard','To send transactional emails (account confirmation, password reset)','To improve the Service and diagnose technical issues'].map(i => <li key={i}>{i}</li>)}</ul> },
  { title: '4. Photos and cloud storage', content: <><p>Guest photos are transmitted directly to third-party cloud storage connected by the host. Picachoo does not permanently store photo files on its own infrastructure.</p><p className="mt-2">We store only metadata: the file ID, guest name, thumbnail URL, and upload timestamp — solely for display in the analytics dashboard.</p></> },
  { title: '5. Third-party services', content: <p>We use Supabase for authentication and database hosting, and Vercel for API hosting. Cloud storage providers (Google, Microsoft, Dropbox) process data under your direct relationship with them.</p> },
  { title: '6. Data retention', content: <p>Host account data is retained while your account is active. Event and photo metadata is retained until you delete the event. You may request full account deletion by contacting us.</p> },
  { title: '7. Your rights', content: <><p>Depending on your jurisdiction, you may have rights to access, rectify, erase, or port your personal data. Contact us via the <a href="/contact" className="text-violet-600 hover:text-violet-700 underline">Contact page</a> to exercise these rights.</p><p className="mt-2">For EU/UK users: you have the right to lodge a complaint with your supervisory authority.</p></> },
  { title: '8. Cookies', content: <p>We use strictly necessary cookies for session management. We do not use tracking or advertising cookies.</p> },
  { title: '9. Security', content: <p>OAuth tokens are encrypted at rest using AES-256-GCM. All data is transmitted over HTTPS/TLS.</p> },
  { title: '10. Changes', content: <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email.</p> },
  { title: '11. Contact', content: <p>For privacy-related questions, please contact us via the <a href="/contact" className="text-violet-600 hover:text-violet-700 underline">Contact page</a>.</p> },
];
