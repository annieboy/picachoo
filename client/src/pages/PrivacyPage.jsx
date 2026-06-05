import MarketingLayout from '../components/MarketingLayout';

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Privacy Policy</h1>
            <p className="text-zinc-500 text-sm mt-3">Last updated: June 2025</p>
          </div>

          <div className="glass rounded-2xl p-8 md:p-10 space-y-8 text-zinc-400 text-sm leading-relaxed">
            <Notice />

            {sections.map(s => (
              <section key={s.title}>
                <h2 className="text-white font-bold text-base mb-3">{s.title}</h2>
                <div className="space-y-2">{s.content}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

function Notice() {
  return (
    <div className="rounded-xl p-4 text-sm"
         style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
      <strong className="text-violet-300">Placeholder document.</strong> This is a draft Privacy Policy. It should be reviewed and finalised by a qualified legal professional, and may need to comply with GDPR, UK GDPR, CCPA, or other applicable regulations depending on your jurisdiction.
    </div>
  );
}

const sections = [
  {
    title: '1. Who we are',
    content: <p>Picachoo ("we", "us", "our") operates the photo-sharing platform at picachoo.app. This policy explains how we collect, use, and protect personal data when you use our Service.</p>,
  },
  {
    title: '2. Data we collect',
    content: (
      <>
        <p><strong className="text-zinc-300">Hosts:</strong> Email address, display name, and authentication data (via Google or magic link). We also store encrypted OAuth tokens to connect your cloud storage accounts.</p>
        <p className="mt-2"><strong className="text-zinc-300">Guests:</strong> We collect only the name you provide before uploading. No email, no account, no persistent identifier.</p>
        <p className="mt-2"><strong className="text-zinc-300">Usage data:</strong> Standard server logs (IP addresses, request timestamps) for security and debugging purposes. These are retained for a maximum of 30 days.</p>
      </>
    ),
  },
  {
    title: '3. How we use your data',
    content: (
      <ul className="space-y-1 list-disc list-inside">
        {[
          'To authenticate host accounts and maintain sessions',
          'To route uploads to the correct cloud storage destination',
          'To display photo analytics on the host dashboard',
          'To send transactional emails (account confirmation, password reset)',
          'To improve the Service and diagnose technical issues',
        ].map(i => <li key={i}>{i}</li>)}
      </ul>
    ),
  },
  {
    title: '4. Photos and cloud storage',
    content: (
      <>
        <p>Guest photos are transmitted directly to third-party cloud storage (Google Drive, OneDrive, or Dropbox) connected by the host. Picachoo does not permanently store photo files on its own infrastructure.</p>
        <p className="mt-2">We store only metadata: the file ID, guest name, thumbnail URL (where available), and upload timestamp — solely for display in the analytics dashboard.</p>
      </>
    ),
  },
  {
    title: '5. Third-party services',
    content: <p>We use Supabase for authentication and database hosting, and Vercel for API hosting. Each service has its own privacy policy. Cloud storage providers (Google, Microsoft, Dropbox) process data under your direct relationship with them.</p>,
  },
  {
    title: '6. Data retention',
    content: <p>Host account data is retained while your account is active. Event and photo metadata is retained until you delete the event from your dashboard. You may request full account deletion by contacting us.</p>,
  },
  {
    title: '7. Your rights',
    content: (
      <>
        <p>Depending on your jurisdiction, you may have rights to access, rectify, erase, or port your personal data. To exercise these rights, please contact us via the <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a>.</p>
        <p className="mt-2">For EU/UK users: we process data on the lawful basis of contract performance and legitimate interests. You have the right to lodge a complaint with your supervisory authority.</p>
      </>
    ),
  },
  {
    title: '8. Cookies',
    content: <p>We use strictly necessary cookies for session management. We do not use tracking or advertising cookies. You can disable cookies in your browser, though this may affect authentication functionality.</p>,
  },
  {
    title: '9. Security',
    content: <p>OAuth tokens are encrypted at rest using AES-256-GCM. All data is transmitted over HTTPS/TLS. We follow industry best practices to protect your data, though no system is perfectly secure.</p>,
  },
  {
    title: '10. Changes to this policy',
    content: <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. The date at the top of this page reflects when it was last updated.</p>,
  },
  {
    title: '11. Contact',
    content: <p>For privacy-related questions or requests, please contact us via the <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a>.</p>,
  },
];
