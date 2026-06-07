import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getEvent, setAuthToken, deletePhoto, API_BASE } from '../api';

const PAGE_SIZE  = 24;
const WALL_CAP   = 24; // photos visible on the live wall at any one time

async function fetchPhotos(eventCode, offset = 0) {
  const res = await fetch(`${API_BASE}/api/events/${eventCode}/photos?limit=${PAGE_SIZE}&offset=${offset}`);
  if (!res.ok) throw new Error('Failed to load photos');
  return res.json(); // { photos, hasMore }
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

// Distribute photos into N balanced columns (height-aware)
function distributeColumns(photos, n) {
  const cols = Array.from({ length: n }, () => []);
  const heights = new Array(n).fill(0);
  for (const photo of photos) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(photo);
    const ar = photo.aspect_ratio ?? 0.75;
    heights[shortest] += 1 / ar;
  }
  return cols;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WallPage() {
  const { eventCode }       = useParams();
  const [searchParams]      = useSearchParams();
  const wallToken           = searchParams.get('v') ?? undefined;
  const [event, setEvent]             = useState(null);
  const [photos, setPhotos]           = useState([]);
  const [newIds, setNewIds]           = useState(new Set());
  const [status, setStatus]           = useState('connecting');
  const [presentMode, setPresentMode] = useState(false);
  const [presentIdx, setPresentIdx]   = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [uiVisible, setUiVisible]     = useState(true);
  const [isHost, setIsHost]           = useState(false);
  const [hostChecked, setHostChecked] = useState(false);
  const uiTimerRef  = useRef(null);
  const channelRef  = useRef(null);
  const colCount    = useColumnCount();

  // Check if the current Supabase session belongs to this event's host
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setHostChecked(true); return; }
      setAuthToken(session.access_token);
      try {
        const res = await fetch(`${API_BASE}/api/hosts/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { events: hostEvents } = await res.json();
          if (hostEvents?.some(e => e.join_code === eventCode.toUpperCase())) {
            setIsHost(true);
          }
        }
      } catch { /* not a host */ }
      finally { setHostChecked(true); }
    });
  }, [eventCode]);

  useEffect(() => {
    Promise.all([getEvent(eventCode, wallToken), fetchPhotos(eventCode)])
      .then(([ev, { photos: initial }]) => {
        setEvent(ev);
        setPhotos([...initial].reverse()); // oldest → newest
      })
      .catch(() => setStatus('error'));
  }, [eventCode, wallToken]);

  useEffect(() => {
    if (!event?.id) return;
    const channel = supabase
      .channel(`photos-wall-${event.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'photos',
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        const photo = payload.new;
        setPhotos(prev => {
          if (prev.some(p => p.id === photo.id)) return prev;
          const next = [...prev, photo];
          // Keep only the newest WALL_CAP photos to avoid unbounded growth
          return next.length > WALL_CAP ? next.slice(next.length - WALL_CAP) : next;
        });
        setNewIds(prev => new Set([...prev, photo.id]));
        setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(photo.id); return s; }), 1200);
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'photos',
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        const deletedId = payload.old?.id;
        if (deletedId) {
          setPhotos(prev => prev.filter(p => p.id !== deletedId));
          setLightboxPhoto(prev => prev?.id === deletedId ? null : prev);
        }
      })
      .subscribe(state =>
        setStatus(state === 'SUBSCRIBED' ? 'live' : state === 'CHANNEL_ERROR' ? 'error' : 'connecting')
      );
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [event?.id]);

  // Slideshow interval — pro events use the host's chosen speed, free locks to 6s
  const intervalMs = (() => {
    const isPro = ['pro', 'pro_annual', 'business_annual'].includes(event?.host_tier ?? event?.effective_tier);
    const secs  = isPro ? (event?.presentation_interval_secs ?? 6) : 6;
    return Math.min(Math.max(secs, 3), 30) * 1000;
  })();

  // Auto-advance in presentation mode
  useEffect(() => {
    if (!presentMode || photos.length === 0) return;
    const t = setInterval(() => setPresentIdx(i => (i + 1) % photos.length), intervalMs);
    return () => clearInterval(t);
  }, [presentMode, photos.length, intervalMs]);

  // Auto-hide controls in presentation mode
  const nudgeUi = useCallback(() => {
    setUiVisible(true);
    clearTimeout(uiTimerRef.current);
    if (presentMode) {
      uiTimerRef.current = setTimeout(() => setUiVisible(false), 3500);
    }
  }, [presentMode]);

  useEffect(() => {
    if (presentMode) {
      uiTimerRef.current = setTimeout(() => setUiVisible(false), 3500);
    } else {
      setUiVisible(true);
      clearTimeout(uiTimerRef.current);
    }
    return () => clearTimeout(uiTimerRef.current);
  }, [presentMode]);

  // Keyboard nav
  useEffect(() => {
    const handle = (e) => {
      if (presentMode) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          setPresentIdx(i => (i + 1) % photos.length);
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setPresentIdx(i => (i - 1 + photos.length) % photos.length);
        }
        if (e.key === 'Escape') setPresentMode(false);
      }
      if (lightboxPhoto && e.key === 'Escape') setLightboxPhoto(null);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [presentMode, photos.length, lightboxPhoto]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    try {
      await deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (lightboxPhoto?.id === photoId) setLightboxPhoto(null);
    } catch { /* silently ignore */ }
  }, [lightboxPhoto]);

  const enterPresentation = () => {
    setPresentIdx(photos.length - 1); // start with newest
    setPresentMode(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const exitPresentation = () => {
    setPresentMode(false);
    document.exitFullscreen?.().catch(() => {});
  };

  const displayedPhotos = [...photos].reverse(); // newest first
  const columns = distributeColumns(displayedPhotos, colCount);

  const wallBg    = event?.wall_background_url;
  const wallFrame = event?.wall_frame_url;

  // ── Host-only wall: block non-hosts ────────────────────────────────────────
  // Wait for the host check to resolve before deciding — avoids a flash for the host.
  if (event?.wall_mode === 'host_only' && hostChecked && !isHost && !event?.wall_access_granted) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center bg-[#080810]">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
            <rect x="5" y="11" width="14" height="10" rx="2"/>
            <path d="M8 11V7a4 4 0 018 0v4"/>
          </svg>
        </div>
        <div className="space-y-2">
          {event?.name && <p className="text-white/50 text-base font-medium">{event.name}</p>}
          <p className="text-white text-2xl font-black">Wall is private</p>
          <p className="text-white/40 text-sm leading-relaxed">This live wall is only visible to the host.</p>
        </div>
      </div>
    );
  }

  // ── Presentation mode ──────────────────────────────────────────────────────
  if (presentMode && photos.length > 0) {
    const current = displayedPhotos[presentIdx % displayedPhotos.length];

    return (
      <div
        className="fixed inset-0 bg-black overflow-hidden z-50"
        onMouseMove={nudgeUi}
        onClick={nudgeUi}
      >
        {/* Custom background or blurred photo backdrop */}
        {wallBg ? (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${wallBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ) : (
          <div
            key={`bg-${current?.id}`}
            className="absolute inset-0 scale-110 animate-present-in"
            style={{
              backgroundImage: `url(${current?.thumbnail_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(32px) brightness(0.35) saturate(1.4)',
            }}
          />
        )}

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/60 pointer-events-none" />

        {/* Top bar */}
        <div className={`
          absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4
          bg-gradient-to-b from-black/70 to-transparent
          transition-all duration-500
          ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-white font-bold text-lg tracking-tight">
              pica<span className="text-violet-400">choo</span>
            </span>
            {event?.name && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-white/70 font-medium text-sm truncate">{event.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusDot status={status} />
              <span className="text-white/40 text-xs tabular-nums">
                {presentIdx + 1} <span className="text-white/20">/</span> {displayedPhotos.length}
              </span>
            </div>
            <button
              onClick={exitPresentation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold tracking-wide transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
              Exit
            </button>
          </div>
        </div>

        {/* Main photo — constrained to 3:4 so frame aligns exactly with photo edges */}
        <div className="absolute inset-0 flex items-center justify-center px-16 py-20">
          <div
            className="relative rounded-2xl overflow-hidden animate-present-in"
            style={{
              aspectRatio: '3 / 4',
              maxHeight: '100%',
              maxWidth: '100%',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            <img
              key={current?.id}
              src={current?.thumbnail_url}
              alt={`Photo by ${current?.guest_name}`}
              className="w-full h-full object-cover"
            />
            {wallFrame && (
              <img
                src={wallFrame}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Guest name badge */}
        {current?.guest_name && (
          <div className={`
            absolute bottom-28 inset-x-0 flex justify-center
            transition-all duration-500
            ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}
          `}>
            <div className="px-5 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-sm font-semibold tracking-wide shadow-lg">
              {current.guest_name}
            </div>
          </div>
        )}

        {/* Nav arrows */}
        <button
          onClick={e => { e.stopPropagation(); setPresentIdx(i => (i - 1 + displayedPhotos.length) % displayedPhotos.length); }}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
            bg-black/40 hover:bg-black/70 backdrop-blur-sm
            flex items-center justify-center text-white
            transition-all duration-300 hover:scale-105
            ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); setPresentIdx(i => (i + 1) % displayedPhotos.length); }}
          className={`
            absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
            bg-black/40 hover:bg-black/70 backdrop-blur-sm
            flex items-center justify-center text-white
            transition-all duration-300 hover:scale-105
            ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Filmstrip + progress bar */}
        <div className={`
          absolute bottom-0 inset-x-0 pb-4 pt-3
          bg-gradient-to-t from-black/80 to-transparent
          transition-all duration-500
          ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
        `}>
          {/* Progress bar */}
          <div className="mx-6 mb-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              key={presentIdx}
              className="h-full bg-white/60 rounded-full"
              style={{ animation: `progress-fill ${intervalMs / 1000}s linear forwards` }}
            />
          </div>

          {/* Filmstrip */}
          <div className="flex gap-1.5 px-4 justify-center overflow-x-auto scrollbar-none">
            {displayedPhotos.map((p, i) => (
              <button
                key={p.id}
                onClick={e => { e.stopPropagation(); setPresentIdx(i); }}
                className={`
                  flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200
                  ${i === presentIdx
                    ? 'w-12 h-12 ring-2 ring-white ring-offset-1 ring-offset-black scale-110 opacity-100'
                    : 'w-10 h-10 opacity-40 hover:opacity-70'}
                `}
              >
                <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <style>{`@keyframes progress-fill { from { width:0% } to { width:100% } }`}</style>
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3
                         bg-[#080810]/90 backdrop-blur-md border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base font-bold tracking-tight flex-shrink-0">
            pica<span className="text-violet-400">choo</span>
          </span>
          {event?.name && (
            <>
              <span className="text-zinc-700 flex-shrink-0">·</span>
              <span className="text-white/70 font-medium text-sm truncate">{event.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <StatusDot status={status} />
            <span className="hidden sm:block text-zinc-600 text-xs uppercase tracking-wider">
              {status === 'live' ? 'Live' : status === 'error' ? 'Offline' : 'Connecting…'}
            </span>
          </div>

          {photos.length > 0 && (
            <button
              onClick={enterPresentation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-violet-600 hover:bg-violet-500
                         text-white text-xs font-semibold tracking-wide
                         transition-all duration-200 shadow-lg shadow-violet-900/40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Present
            </button>
          )}
        </div>
      </header>

      {/* Custom background */}
      {wallBg && (
        <div className="fixed inset-0 -z-10"
             style={{ backgroundImage: `url(${wallBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}

      {/* Masonry grid */}
      {photos.length === 0 ? (
        <EmptyState eventName={event?.name} />
      ) : (
        <div className="pt-[52px] px-1.5 pb-8">
          <div className="flex gap-1.5">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1.5 flex-1 min-w-0">
                {col.map(photo => (
                  <PhotoTile
                    key={photo.id}
                    photo={photo}
                    frameUrl={wallFrame}
                    isNew={newIds.has(photo.id)}
                    isHost={isHost}
                    onClick={() => setLightboxPhoto(photo)}
                    onDelete={() => handleDeletePhoto(photo.id)}
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
          isHost={isHost}
          onClose={() => setLightboxPhoto(null)}
          onDelete={() => handleDeletePhoto(lightboxPhoto.id)}
        />
      )}

      {/* Watermark */}
      <div className="fixed bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
        <span className="text-[9px] text-white/10 font-medium tracking-widest uppercase">
          picachoo.vercel.app/e/{eventCode}
        </span>
      </div>
    </div>
  );
}

// ── PhotoTile ─────────────────────────────────────────────────────────────────

function PhotoTile({ photo, isNew, frameUrl, isHost, onClick, onDelete }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-lg overflow-hidden bg-zinc-900 cursor-pointer
        group transition-transform duration-200 hover:scale-[1.01]
        hover:shadow-xl hover:shadow-black/60 hover:z-10
        ${isNew ? 'animate-wall-in' : ''}
      `}
    >
      {!loaded && (
        <div
          className="bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse"
          style={{ paddingBottom: '133%' }}
        />
      )}

      <img
        src={photo.thumbnail_url}
        alt={`Photo by ${photo.guest_name}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full block transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2.5">
          <p className="text-white text-[11px] font-semibold truncate">{photo.guest_name}</p>
        </div>
      </div>

      {/* Host delete button */}
      {isHost && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1.5 right-1.5 z-30 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm
                     flex items-center justify-center opacity-0 group-hover:opacity-100
                     hover:bg-red-600 transition-all duration-150"
          title="Remove from wall"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Frame overlay — PNG with transparency, sits above photo */}
      {frameUrl && (
        <img
          src={frameUrl}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />
      )}

      {isNew && (
        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full z-20
                        bg-violet-500 text-white text-[9px] font-bold uppercase tracking-wide
                        shadow-md shadow-violet-500/50 animate-pulse-dot">
          New
        </div>
      )}
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photo, isHost, onClose, onDelete }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${photo.thumbnail_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.25) saturate(1.3)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative max-w-5xl max-h-[90vh] flex items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.thumbnail_url}
          alt={`Photo by ${photo.guest_name}`}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
        {photo.guest_name && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-semibold whitespace-nowrap">
            {photo.guest_name}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {isHost && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 backdrop-blur-sm text-white text-xs font-semibold transition-all z-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Remove from wall
        </button>
      )}
    </div>
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const colors = { live: 'bg-emerald-400', connecting: 'bg-amber-400', error: 'bg-red-500' };
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] ?? colors.connecting} ${status !== 'error' ? 'animate-pulse-dot' : ''}`} />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ eventName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-violet-400">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#080810] animate-pulse-dot" />
      </div>
      <div className="space-y-2">
        <p className="text-white text-xl font-bold">Waiting for photos…</p>
        <p className="text-zinc-600 text-sm max-w-[280px] leading-relaxed">
          {eventName
            ? <>Guests at <span className="text-zinc-400 font-medium">{eventName}</span> can share photos by scanning the QR code.</>
            : 'Share the QR code with guests to start collecting photos.'}
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
        <span className="text-zinc-600 text-xs">Wall is live — photos appear instantly</span>
      </div>
    </div>
  );
}
