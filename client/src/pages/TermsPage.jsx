import MarketingLayout from '../components/MarketingLayout';

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="bezl-hero relative pt-28 pb-20 px-6 text-center overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: '#000' }}>Terms of Service</h1>
        <p className="text-sm mt-3" style={{ color: '#555' }}>Last updated: June 2025</p>
        <div className="wave-bottom" />
      </div>

      <div className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-gray-100 p-8 md:p-10 space-y-8 text-gray-500 text-sm leading-relaxed">
            <div className="rounded-xl p-4 text-sm bg-violet-50 border border-violet-100 text-violet-700">
              <strong className="text-violet-800">Placeholder document.</strong> This draft should be reviewed by a qualified legal professional before Picachoo is made available to the public.
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
  { title: '1. Acceptance of terms', content: <p>By accessing or using the Picachoo service ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p> },
  { title: '2. Description of service', content: <p>Picachoo provides a platform that enables event hosts to collect photos from guests. Photos are uploaded directly to third-party cloud storage services (Google Drive, Microsoft OneDrive, Dropbox) connected by the host. Picachoo does not permanently store guest photos on its own servers.</p> },
  { title: '3. User accounts', content: <><p>Hosts must create an account to use the Service. You are responsible for maintaining the security of your account credentials.</p><p className="mt-2">Guests do not require an account to upload photos. Hosts are responsible for obtaining appropriate consent from guests before collecting their photos.</p></> },
  { title: '4. Content and ownership', content: <><p>You retain full ownership of all photos and content uploaded through the Service. By using the Service, you grant Picachoo a limited, non-exclusive licence to transmit content solely for the purpose of providing the Service.</p></> },
  { title: '5. Prohibited uses', content: <ul className="space-y-1 list-disc list-inside">{['Use the Service for any unlawful purpose','Upload content that infringes intellectual property rights','Upload explicit, harmful, or illegal content','Attempt to access systems or data you are not authorised to access','Resell or sublicence the Service without written permission'].map(i => <li key={i}>{i}</li>)}</ul> },
  { title: '6. Third-party services', content: <p>The Service integrates with third-party cloud storage providers. Your use of those services is subject to their respective terms of service and privacy policies.</p> },
  { title: '7. Limitation of liability', content: <p>To the maximum extent permitted by law, Picachoo shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p> },
  { title: '8. Changes to terms', content: <p>Picachoo reserves the right to update these Terms at any time. We will notify registered users of material changes by email.</p> },
  { title: '9. Contact', content: <p>For questions about these Terms, please contact us via the <a href="/contact" className="text-violet-600 hover:text-violet-700 underline">Contact page</a>.</p> },
];
