import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getEvent, API_BASE } from '../api';

const INITIAL_LIMIT = 40;

async function fetchRecentPhotos(eventCode) {
  const res = await fetch(`${API_BASE}/api/events/${eventCode}/photos?limit=${INITIAL_LIMIT}`);
  if (!res.ok) throw new Error('Failed to load photos');
  const { photos } = await res.json();
  return photos.reverse(); // oldest → newest
}

// ── Distribute photos into N columns, shortest column first ──────────────────
function distributeColumns(photos, n) {
  const cols = Array.from({ length: n }, () => []);
  const heights = new Array(n).fill(0);
  for (const photo of photos) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(photo);
    // Use aspect ratio if available, default 4:3
    const ar = photo.aspect_ratio ?? 0.75;
    heights[shortest] += 1 / ar;
  }
  return cols;
}

function useColumnCount() {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1600) setCols(6);
      else if (w >= 1280) setCols(5);
      else if (w >= 900)  setCols(4);
      else if (w >= 600)  setCols(3);
      else                setCols(2);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WallPage() {
  const { eventCode } = useParams();
  const [event, setEvent]           = useState(null);
  const [photos, setPhotos]         = useState([]);
  const [newIds, setNewIds]         = useState(new Set());
  const [status, setStatus]         = useState('connecting');
  const [presentMode, setPresentMode] = useState(false);
  const [presentIdx, setPresentIdx]   = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerTimerRef = useRef(null);
  const channelRef = useRef(null);
  const colCount = useColumnCount();

  // ── Load event + photos ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getEvent(eventCode), fetchRecentPhotos(eventCode)])
      .then(([ev, initialPhotos]) => { setEvent(ev); setPhotos(initialPhotos); })
      .catch(() => setStatus('error'));
  }, [eventCode]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!event?.id) return;
    const channel = supabase
      .channel(`photos-wall-${event.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'photos',
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        const photo = payload.new;
        setPhotos(prev => prev.some(p => p.id === photo.id) ? prev : [...prev, photo]);
        setNewIds(prev => new Set([...prev, photo.id]));
        setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(photo.id); return s; }), 1200);
      })
      .subscribe(state => setStatus(state === 'SUBSCRIBED' ? 'live' : state === 'CHANNEL_ERROR' ? 'error' : 'connecting'));
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [event?.id]);

  // ── Presentation mode: auto-advance ───────────────────────────────────────
  useEffect(() => {
    if (!presentMode || photos.length === 0) return;
    const t = setInterval(() => {
      setPresentIdx(i => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(t);
  }, [presentMode, photos.length]);

  // ── Auto-hide header in presentation mode ─────────────────────────────────
  const showHeader = useCallback(() => {
    setHeaderVisible(true);
    clearTimeout(headerTimerRef.current);
    if (presentMode) {
      headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 3000);
    }
  }, [presentMode]);

  useEffect(() => {
    if (presentMode) {
      headerTimerRef.current = setTimeout(() => setHeaderVisible(false), 3000);
    } else {
      setHeaderVisible(true);
      clearTimeout(headerTimerRef.current);
    }
    return () => clearTimeout(headerTimerRef.current);
  }, [presentMode]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (presentMode) {
        if (e.key === 'ArrowRight' || e.key === ' ') setPresentIdx(i => (i + 1) % photos.length);
        if (e.key === 'ArrowLeft')  setPresentIdx(i => (i - 1 + photos.length) % photos.length);
        if (e.key === 'Escape')     setPresentMode(false);
      }
      if (lightboxPhoto && e.key === 'Escape') setLightboxPhoto(null);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [presentMode, photos.length, lightboxPhoto]);

  const enterPresentation = () => {
    const idx = photos.length > 0 ? photos.length - 1 : 0;
    setPresentIdx(idx);
    setPresentMode(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const exitPresentation = () => {
    setPresentMode(false);
    document.exitFullscreen?.().catch(() => {});
  };

  const displayedPhotos = [...photos].reverse(); // newest first
  const columns = distributeColumns(displayedPhotos, colCount);

  // ── Presentation mode view ─────────────────────────────────────────────────
  if (presentMode && photos.length > 0) {
    const current = displayedPhotos[presentIdx % displayedPhotos.length];
    const prev    = displayedPhotos[(presentIdx - 1 + displayedPhotos.length) % displayedPhotos.length];
    const next    = displayedPhotos[(presentIdx + 1) % displayedPhotos.length];

    return (
      <div
        className="fixed inset-0 bg-black z-50 flex flex-col"
        onMouseMove={showHeader}
        onClick={showHeader}
      >
        {/* Header */}
        <div className={`
          absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4
          bg-gradient-to-b from-black/90 to-transparent
          transition-opacity duration-500
          ${headerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-xl tracking-tight">
              pica<span className="text-violet-400">choo</span>
            </span>
            {event?.name && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-white font-semibold text-base truncate max-w-xs">{event.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={status} />
            <span className="text-zinc-400 text-xs uppercase tracking-wider">
              {presentIdx + 1} / {displayedPhotos.length}
            </span>
            <button
              onClick={exitPresentation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
              Exit
            </button>
          </div>
        </div>

        {/* Main image */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <img
            key={current?.id}
            src={current?.thumbnail_url}
            alt={`Photo by ${current?.guest_name}`}
            className="max-w-full max-h-full object-contain animate-present-in"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          />

          {/* Guest name */}
          {current?.guest_name && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
              {current.guest_name}
            </div>
          )}

          {/* Nav arrows */}
          <button
            onClick={() => setPresentIdx(i => (i - 1 + displayedPhotos.length) % displayedPhotos.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-105"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setPresentIdx(i => (i + 1) % displayedPhotos.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-105"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Filmstrip */}
        <div className={`
          flex gap-2 px-6 pb-4 pt-2 overflow-x-auto scrollbar-none justify-center
          transition-opacity duration-500
          ${headerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          {displayedPhotos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPresentIdx(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                i === presentIdx
                  ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-black scale-110'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <ProgressBar key={presentIdx} duration={5000} />
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-3.5
                         bg-gradient-to-b from-[#0a0a0f]/95 via-[#0a0a0f]/60 to-transparent backdrop-blur-md
                         border-b border-white/[0.04]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg font-bold tracking-tight flex-shrink-0">
            pica<span className="text-violet-400">choo</span>
          </span>
          {event?.name && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-white/80 font-medium text-sm truncate">{event.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <StatusDot status={status} />
            <span className="text-zinc-500 text-xs uppercase tracking-wider">
              {status === 'live' ? 'Live' : status === 'error' ? 'Offline' : 'Connecting…'}
            </span>
          </div>

          {photos.length > 0 && (
            <button
              onClick={enterPresentation}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                         bg-gradient-to-r from-violet-600 to-violet-500
                         hover:from-violet-500 hover:to-violet-400
                         text-white text-xs font-semibold tracking-wide
                         transition-all duration-200 shadow-lg shadow-violet-900/30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Present
            </button>
          )}
        </div>
      </header>

      {/* Grid */}
      {photos.length === 0 ? (
        <EmptyState eventName={event?.name} />
      ) : (
        <div className="pt-[60px] px-2 pb-8">
          <div
            className="flex gap-2 items-start"
            style={{ columnCount: colCount }}
          >
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-2 flex-1 min-w-0">
                {col.map(photo => (
                  <PhotoTile
                    key={photo.id}
                    photo={photo}
                    isNew={newIds.has(photo.id)}
                    onClick={() => setLightboxPhoto(photo)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      {/* Watermark */}
      <div className="fixed bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
        <span className="text-[10px] text-zinc-800 font-medium tracking-widest uppercase">
          picachoo.vercel.app/e/{eventCode}
        </span>
      </div>
    </div>
  );
}

// ── PhotoTile ─────────────────────────────────────────────────────────────────

function PhotoTile({ photo, isNew, onClick }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden bg-zinc-900 cursor-pointer
        group transition-all duration-300
        hover:shadow-2xl hover:shadow-violet-900/25 hover:-translate-y-0.5
        ${isNew ? 'animate-wall-in' : ''}
      `}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse"
             style={{ paddingBottom: '133%' }} />
      )}

      <img
        src={photo.thumbnail_url}
        alt={`Photo by ${photo.guest_name}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full block transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Overlay */}
      <div className="
        absolute inset-0
        bg-gradient-to-t from-black/60 via-transparent to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
      ">
        <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
          <p className="text-white text-xs font-semibold truncate drop-shadow">{photo.guest_name}</p>
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isNew && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full
                        bg-gradient-to-r from-violet-500 to-violet-400
                        text-white text-[9px] font-bold uppercase tracking-wide
                        shadow-lg shadow-violet-500/40 animate-pulse-dot">
          New
        </div>
      )}
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photo, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.thumbnail_url}
          alt={`Photo by ${photo.guest_name}`}
          className="block max-w-full max-h-[85vh] object-contain"
        />
        {photo.guest_name && (
          <div className="absolute bottom-0 inset-x-0 px-5 py-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm font-medium">{photo.guest_name}</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Presentation progress bar ─────────────────────────────────────────────────

function ProgressBar({ duration }) {
  return (
    <div className="absolute bottom-[88px] inset-x-6 h-0.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-violet-400 rounded-full"
        style={{ animation: `progress-fill ${duration}ms linear forwards` }}
      />
      <style>{`
        @keyframes progress-fill { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const colors = { live: 'bg-emerald-400', connecting: 'bg-amber-400', error: 'bg-red-500' };
  return (
    <span className={`w-2 h-2 rounded-full ${colors[status] ?? colors.connecting} ${status !== 'error' ? 'animate-pulse-dot' : ''}`} />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ eventName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-violet-800/20 border border-violet-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-violet-400">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-pulse-dot" />
      </div>
      <div className="space-y-2">
        <p className="text-white text-2xl font-bold tracking-tight">Waiting for photos…</p>
        <p className="text-zinc-500 text-sm max-w-xs">
          {eventName
            ? <>Guests at <span className="text-zinc-300 font-medium">{eventName}</span> can share photos by scanning the QR code.</>
            : 'Share the QR code with guests to start collecting photos.'}
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
        <span className="text-zinc-500 text-xs">Wall is live — photos appear instantly</span>
      </div>
    </div>
  );
}
