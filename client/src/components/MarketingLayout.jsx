import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../marketing.css';

export default function MarketingLayout({ children, heroNav = false }) {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add('mkt');
    window.scrollTo(0, 0);
    return () => document.body.classList.remove('mkt');
  }, [location.pathname]);

  return (
    <div className="min-h-screen text-gray-900" style={{ background: '#fff', color: '#000' }}>
      <Nav heroNav={heroNav} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */

function Nav({ heroNav }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [open,      setOpen]      = useState(false);
  const [loggedIn,  setLoggedIn]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const white = false;   // hero is now light grey — always use dark nav
  const links = [
    { href: '/#features',     label: 'Features' },
    { href: '/pricing',       label: 'Pricing' },
    { href: '/about',         label: 'About' },
    { href: '/contact',       label: 'Contact' },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 nav-white`}>
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between" style={{ height: '68px' }}>
        {/* Logo */}
        <Link to="/" className="flex flex-col items-start leading-none">
          <span className="font-black text-2xl tracking-tight" style={{ color: '#000' }}>
            pica<span style={{ color: '#6045f4' }}>choo</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href}
               className="text-sm font-medium transition-colors"
               style={{ color: '#555' }}
               onMouseEnter={e => e.target.style.color = '#000'}
               onMouseLeave={e => e.target.style.color = '#555'}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <Link to="/dashboard" className="btn-purple px-5 py-2.5 text-sm">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/dashboard"
                    className="text-sm font-medium transition-colors"
                    style={{ color: '#555' }}>
                Sign in
              </Link>
              <Link to="/dashboard" className="btn-purple px-5 py-2.5 text-sm">
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" style={{ color: '#000' }}>
          {open
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
               className="text-gray-700 font-medium text-base py-1">
              {l.label}
            </a>
          ))}
          <hr className="border-gray-100" />
          <Link to="/dashboard" onClick={() => setOpen(false)}
                className="btn-purple w-full py-3.5 text-center text-sm">
            Get started free
          </Link>
        </div>
      )}
    </header>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer style={{ background: '#000', color: '#fff', marginTop: 0 }}>
      {/* Top CTA band */}
      <div style={{ background: 'linear-gradient(135deg,#6045f4,#53e6d4)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Ready to collect your event photos?
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 24 }}>
          Free to start. No credit card required.
        </p>
        <Link to="/dashboard" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 999,
          background: '#fff', color: '#6045f4', fontWeight: 800, fontSize: 15,
          textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'transform 0.15s',
        }}>
          Create your first event — free
        </Link>
      </div>

      {/* Links */}
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex flex-col items-start mb-4">
            <span className="font-black text-2xl tracking-tight" style={{ color: '#fff' }}>
              pica<span style={{ color: '#53e6d4' }}>choo</span>
            </span>
          </Link>
          <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7 }}>
            Your memories, straight to your cloud. No app needed, no quality lost.
          </p>
          {/* Brand colour swatches */}
          <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
            {['#6045f4','#53e6d4','#ff0038','#c6c6c6'].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
          </div>
        </div>

        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Product</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['/#features','Features'],['/#how-it-works','How it works'],['/pricing','Pricing'],['/dashboard','Dashboard']].map(([href,label]) => (
              <li key={href}><a href={href} style={{ color: '#888', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='#888'}>{label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Company</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['/about','About'],['/contact','Contact'],['/pricing','Upgrade']].map(([href,label]) => (
              <li key={href}><Link to={href} style={{ color: '#888', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='#888'}>{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Legal</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['/privacy','Privacy Policy'],['/terms','Terms of Service']].map(([href,label]) => (
              <li key={href}><Link to={href} style={{ color: '#888', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='#888'}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #222' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p style={{ color: '#555', fontSize: 12 }}>
            © {new Date().getFullYear()} Picachoo by{' '}
            <a href="https://www.firstguide.co.uk" target="_blank" rel="noopener noreferrer"
               style={{ color: '#888', textDecoration: 'underline' }}>First Guide Limited</a>.
            {' '}All rights reserved.
          </p>
          <p style={{ color: '#555', fontSize: 12 }}>Made with ♥ for photographers, planners &amp; memory-makers.</p>
        </div>
      </div>
    </footer>
  );
}
