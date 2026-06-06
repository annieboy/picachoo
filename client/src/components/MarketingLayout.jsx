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
    <div className="min-h-screen bg-white text-gray-900">
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

  const white = heroNav && !scrolled;   // transparent-on-gradient mode
  const links = [
    { href: '/#features',     label: 'Features' },
    { href: '/pricing',       label: 'Pricing' },
    { href: '/about',         label: 'About' },
    { href: '/contact',       label: 'Contact' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-white' : heroNav ? 'nav-transparent' : 'nav-white'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-start leading-none">
          <span className={`font-black text-3xl tracking-tight ${white ? 'text-white' : 'text-gray-900'}`}>
            pica<span style={{ color: white ? '#c4b5fd' : '#6045f4' }}>choo</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href}
               className={`text-base font-medium transition-colors ${
                 white ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900'
               }`}>
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
                    className={`text-sm font-medium transition-colors ${
                      white ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}>
                Sign in / Sign up
              </Link>
              <Link to="/dashboard" className="btn-purple px-5 py-2.5 text-sm">
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className={`md:hidden p-2 transition-colors ${white ? 'text-white' : 'text-gray-700'}`}>
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
    <footer className="bg-gray-50 border-t border-gray-100 mt-0">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex flex-col items-start mb-4">
            <span className="font-black text-2xl text-gray-900 tracking-tight">
              pica<span style={{ color: '#6045f4' }}>choo</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your memories, straight to your cloud. No apps, no logins, no quality lost.
          </p>
        </div>

        <div>
          <p className="text-gray-900 font-semibold text-sm mb-4">Product</p>
          <ul className="space-y-2.5">
            {[['/#features','Features'],['/#how-it-works','How it works'],['/pricing','Pricing'],['/dashboard','Dashboard']].map(([href,label]) => (
              <li key={href}><a href={href} className="text-gray-500 hover:text-gray-800 text-sm transition-colors">{label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-gray-900 font-semibold text-sm mb-4">Company</p>
          <ul className="space-y-2.5">
            {[['/about','About'],['/contact','Contact'],['/pricing','Upgrade']].map(([href,label]) => (
              <li key={href}><Link to={href} className="text-gray-500 hover:text-gray-800 text-sm transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-gray-900 font-semibold text-sm mb-4">Legal</p>
          <ul className="space-y-2.5">
            {[['/privacy','Privacy Policy'],['/terms','Terms of Service']].map(([href,label]) => (
              <li key={href}><Link to={href} className="text-gray-500 hover:text-gray-800 text-sm transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Picachoo. All rights reserved.</p>
          <p className="text-gray-400 text-xs">Made with ♥ for photographers, planners &amp; memory-makers.</p>
        </div>
      </div>
    </footer>
  );
}
