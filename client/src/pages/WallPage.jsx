import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getEvent, API_BASE } from '../api';

const INITIAL_LIMIT = 20;

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchRecentPhotos(eventCode) {
  const res = await fetch(`${API_BASE}/api/events/${eventCode}/photos?limit=${INITIAL_LIMIT}`);
  if (!res.ok) throw new Error('Failed to load photos');
  const { photos } = await res.json();
  // API returns newest-first; reverse so newest appears top-left in the grid
  return photos.reverse();
}

// ── Wall page ─────────────────────────────────────────────────────────────────

export default function WallPage() {
  const { eventCode } = useParams();
  const [event, setEvent]           = useState(null);
  const [photos, setPhotos]         = useState([]);   // oldest → newest
  const [newIds, setNewIds]         = useState(new Set()); // ids to animate
  const [status, setStatus]         = useState('connecting'); // connecting | live | error
  const channelRef = useRef(null);

  // ── 1. Load event name + initial photos ────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getEvent(eventCode),
      fetchRecentPhotos(eventCode),
    ])
      .then(([ev, initialPhotos]) => {
        setEvent(ev);
        setPhotos(initialPhotos);
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
      });
  }, [eventCode]);

  // ── 2. Subscribe to Supabase Realtime once we have the event id ────────────
  useEffect(() => {
    if (!event?.id) return;

    const channel = supabase
      .channel(`photos-wall-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const photo = payload.new;
          setPhotos(prev => {
            // Deduplicate in case the row arrives twice
            if (prev.some(p => p.id === photo.id)) return prev;
            return [...prev, photo];
          });
          // Mark as new so it animates in; remove the flag after animation
          setNewIds(prev => new Set([...prev, photo.id]));
          setTimeout(() => {
            setNewIds(prev => { const s = new Set(prev); s.delete(photo.id); return s; });
          }, 700);
        },
      )
      .subscribe((state) => {
        setStatus(state === 'SUBSCRIBED' ? 'live' : state === 'CHANNEL_ERROR' ? 'error' : 'connecting');
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [event?.id]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* ── Top bar ── */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between
                         px-6 py-4 bg-gradient-to-b from-black/80 to-transparent
                         backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">
            pica<span className="text-violet-400">choo</span>
          </span>
          {event?.name && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-white font-semibold text-lg truncate max-w-xs">
                {event.name}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            {status === 'live' ? 'Live' : status === 'error' ? 'Offline' : 'Connecting…'}
          </span>
        </div>
      </header>

      {/* ── Photo grid ── */}
      {photos.length === 0 ? (
        <EmptyState eventName={event?.name} />
      ) : (
        <div
          className="pt-20 pb-8 px-3"
          style={{
            columns: 'var(--wall-cols)',
            columnGap: '10px',
            '--wall-cols': '2',
          }}
        >
          {/* Newest photos at the top — array is oldest→newest so we reverse for display */}
          {[...photos].reverse().map(photo => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              isNew={newIds.has(photo.id)}
            />
          ))}

          {/* Responsive column count via a hidden style tag — avoids JS resize listener */}
          <style>{`
            @media (min-width: 640px)  { :root { --wall-cols: 3; } }
            @media (min-width: 1024px) { :root { --wall-cols: 4; } }
            @media (min-width: 1400px) { :root { --wall-cols: 5; } }
          `}</style>
        </div>
      )}

      {/* ── Bottom watermark ── */}
      <div className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-20">
        <span className="text-xs text-zinc-700 font-medium tracking-widest uppercase">
          picachoo.vercel.app/e/{eventCode}
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoTile({ photo, isNew }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`
        relative mb-[10px] rounded-xl overflow-hidden bg-zinc-900 break-inside-avoid
        transition-shadow duration-300 hover:shadow-2xl hover:shadow-violet-900/20
        ${isNew ? 'animate-fade-up' : ''}
        ${!loaded ? 'min-h-[160px]' : ''}
      `}
      style={isNew ? { animationFillMode: 'both' } : {}}
    >
      {/* Skeleton shimmer while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse rounded-xl" />
      )}

      <img
        src={photo.thumbnail_url}
        alt={`Photo by ${photo.guest_name}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`
          w-full block rounded-xl transition-opacity duration-500
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Guest name overlay on hover */}
      <div className="
        absolute inset-x-0 bottom-0 px-3 py-2
        bg-gradient-to-t from-black/70 to-transparent
        opacity-0 hover:opacity-100 transition-opacity duration-200
        rounded-b-xl
      ">
        <p className="text-white text-xs font-medium truncate">{photo.guest_name}</p>
      </div>

      {/* "New" badge — shown briefly on fresh arrivals */}
      {isNew && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full
                        bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wide
                        shadow-lg shadow-violet-500/40">
          New
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    live:       'bg-emerald-400 animate-pulse-dot',
    connecting: 'bg-amber-400 animate-pulse-dot',
    error:      'bg-red-500',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status] ?? colors.connecting}`} />;
}

function EmptyState({ eventName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
      <div className="text-7xl animate-pulse-dot">📸</div>
      <div className="space-y-2">
        <p className="text-white text-2xl font-bold">Waiting for photos…</p>
        <p className="text-zinc-500 text-base">
          {eventName
            ? <>Guests at <span className="text-zinc-300">{eventName}</span> can share photos by scanning the QR code.</>
            : 'Share the QR code with guests to start collecting photos.'
          }
        </p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
        <span className="text-zinc-500 text-sm">Wall is live — photos appear instantly</span>
      </div>
    </div>
  );
}
