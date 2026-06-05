import MarketingLayout from '../components/MarketingLayout';

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Terms of Service</h1>
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
      <strong className="text-violet-300">Placeholder document.</strong> This is a draft Terms of Service. It should be reviewed and finalised by a qualified legal professional before Picachoo is made available to the public.
    </div>
  );
}

const sections = [
  {
    title: '1. Acceptance of terms',
    content: <p>By accessing or using the Picachoo service ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>,
  },
  {
    title: '2. Description of service',
    content: <p>Picachoo provides a platform that enables event hosts to collect photos from guests. Photos are uploaded directly to third-party cloud storage services (Google Drive, Microsoft OneDrive, Dropbox) connected by the host. Picachoo does not permanently store guest photos on its own servers.</p>,
  },
  {
    title: '3. User accounts',
    content: (
      <>
        <p>Hosts must create an account to use the Service. You are responsible for maintaining the security of your account credentials. Picachoo is not liable for any loss or damage arising from your failure to protect your account.</p>
        <p className="mt-2">Guests do not require an account to upload photos. Hosts are responsible for obtaining appropriate consent from guests before collecting their photos.</p>
      </>
    ),
  },
  {
    title: '4. Content and ownership',
    content: (
      <>
        <p>You retain full ownership of all photos and content uploaded through the Service. By using the Service, you grant Picachoo a limited, non-exclusive licence to transmit content solely for the purpose of providing the Service.</p>
        <p className="mt-2">Picachoo does not claim ownership of, nor any rights to use, any photos uploaded by guests through your events.</p>
      </>
    ),
  },
  {
    title: '5. Prohibited uses',
    content: (
      <ul className="space-y-1 list-disc list-inside">
        {[
          'Use the Service for any unlawful purpose',
          'Upload content that infringes intellectual property rights',
          'Upload explicit, harmful, or illegal content',
          'Attempt to access systems or data you are not authorised to access',
          'Resell or sublicence the Service without written permission',
        ].map(i => <li key={i}>{i}</li>)}
      </ul>
    ),
  },
  {
    title: '6. Third-party services',
    content: <p>The Service integrates with third-party cloud storage providers. Your use of those services is subject to their respective terms of service and privacy policies. Picachoo is not responsible for the availability, security, or practices of third-party services.</p>,
  },
  {
    title: '7. Limitation of liability',
    content: <p>To the maximum extent permitted by law, Picachoo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, even if advised of the possibility of such damages.</p>,
  },
  {
    title: '8. Changes to terms',
    content: <p>Picachoo reserves the right to update these Terms at any time. We will notify registered users of material changes by email. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>,
  },
  {
    title: '9. Contact',
    content: <p>For questions about these Terms, please contact us via the <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a>.</p>,
  },
];
