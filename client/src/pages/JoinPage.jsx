import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function JoinPage() {
  const navigate         = useNavigate();
  const [params]         = useSearchParams();
  const [code,  setCode] = useState((params.get('code') ?? '').toUpperCase());
  const [error, setError] = useState(params.get('error') === '1' ? 'That code didn\'t match any event. Check the code and try again.' : '');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/events/by-code/${trimmed}`);
      if (res.ok) {
        navigate(`/e/${trimmed}`);
      } else {
        setError('That code didn\'t match any event. Check the code and try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error — please try again.');
      setLoading(false);
    }
  }

  function handleChange(e) {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    setError('');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ebebed' }}>

      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="font-black text-xl tracking-tight" style={{ color: '#000' }}>
          pica<span style={{ color: '#6045f4' }}>choo</span>
        </Link>
        <Link to="/dashboard"
              className="text-sm font-medium transition-colors"
              style={{ color: '#555' }}
              onMouseEnter={e => e.target.style.color = '#000'}
              onMouseLeave={e => e.target.style.color = '#555'}>
          Host login →
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
             style={{ background: 'linear-gradient(135deg,#6045f4,#53e6d4)', boxShadow: '0 8px 24px rgba(96,69,244,0.3)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
          </svg>
        </div>

        <h1 className="text-3xl font-black text-center mb-2" style={{ color: '#000' }}>Join an event</h1>
        <p className="text-base text-center mb-10 max-w-sm" style={{ color: '#555' }}>
          Enter the event code shown on the QR card or shared by the host
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          {/* Code input */}
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold select-none"
                  style={{ color: '#6045f4' }}>#</span>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="Enter event code"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              style={{
                all: 'unset',
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: '40px',
                paddingRight: '60px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderRadius: '16px',
                background: '#fff',
                border: error ? '2px solid #ff0038' : '2px solid #c6c6c6',
                color: '#000',
                fontWeight: 700,
                fontSize: '18px',
                caretColor: '#6045f4',
              }}
            />
            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{ background: '#53e6d4' }}
              aria-label="Join"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.2)" strokeWidth="3"/>
                  <path d="M12 3a9 9 0 019 9" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="#000" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                 style={{ background: 'rgba(255,0,56,0.07)', border: '1px solid rgba(255,0,56,0.2)' }}>
              <svg viewBox="0 0 20 20" fill="#ff0038" className="w-4 h-4 mt-0.5 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm leading-snug" style={{ color: '#ff0038' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#6045f4', color: '#fff', boxShadow: '0 4px 16px rgba(96,69,244,0.3)' }}
          >
            {loading ? 'Looking up event…' : 'Join event'}
          </button>
        </form>

        <p className="mt-8 text-sm text-center" style={{ color: '#888' }}>
          Hosting an event?{' '}
          <Link to="/dashboard"
                style={{ color: '#6045f4', textDecoration: 'underline' }}>
            Sign in here
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: '#aaa' }}>© {new Date().getFullYear()} Picachoo</p>
      </div>
    </div>
  );
}
