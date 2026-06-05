import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../marketing.css';

export default function MarketingLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add('mkt');
    return () => document.body.classList.remove('mkt');
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <Nav currentPath={location.pathname} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Nav({ currentPath }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/#features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'nav-blur' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center glow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            pica<span className="text-violet-400">choo</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href}
               className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/dashboard"
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
            Sign in
          </Link>
          <Link to="/dashboard"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors glow-sm">
            Get started free
          </Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)}
                className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden nav-blur border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
               className="text-zinc-300 hover:text-white text-base font-medium transition-colors py-1">
              {l.label}
            </a>
          ))}
          <hr className="mkt" />
          <Link to="/dashboard" onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl bg-violet-600 text-white text-center font-semibold">
            Get started free
          </Link>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-bold">pica<span className="text-violet-400">choo</span></span>
          </Link>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Your memories, straight to your cloud. No apps, no logins, no quality lost.
          </p>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-4">Product</p>
          <ul className="space-y-2.5">
            {[['/#features','Features'],['/#how-it-works','How it works'],['/pricing','Pricing'],['/dashboard','Dashboard']].map(([href,label]) => (
              <li key={href}><a href={href} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">{label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-4">Company</p>
          <ul className="space-y-2.5">
            {[['/about','About'],['/contact','Contact'],['/pricing','Upgrade']].map(([href,label]) => (
              <li key={href}><Link to={href} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-4">Legal</p>
          <ul className="space-y-2.5">
            {[['/privacy','Privacy Policy'],['/terms','Terms of Service']].map(([href,label]) => (
              <li key={href}><Link to={href} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} Picachoo. All rights reserved.</p>
          <p className="text-zinc-600 text-xs">Made with ♥ for photographers, planners &amp; memory-makers.</p>
        </div>
      </div>
    </footer>
  );
}
