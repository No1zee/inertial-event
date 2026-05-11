'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  useActiveProfile,
  useLibrary,
  useWatchHistory,
  useCollections,
  useLocalDataStore,
} from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import {
  ShieldCheck,
  Heart,
  Clock,
  Film,
  Tv,
  Star,
  TrendingUp,
  BookOpen,
  Layers,
  ChevronRight,
  Play,
  Sparkles,
  BarChart3,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Sub-components ──────────────────────────────── */

const StatCard = React.memo(function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  accent: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22 } }
      }}
      className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 backdrop-blur-xl transition-all duration-500 group overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className={cn('absolute inset-0 rounded-2xl', accent)} />
      </div>
      <Icon size={18} className="text-zinc-500 group-hover:text-white transition-colors mb-4 relative z-10" />
      <div className="text-2xl font-black text-white tracking-tight relative z-10">{value}</div>
      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.25em] mt-1 relative z-10">{label}</div>
    </motion.div>
  );
});

const GenreBar = React.memo(function GenreBar({ genre, pct, color, delay }: { genre: string; pct: number; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex items-center gap-3"
    >
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider w-20 text-right shrink-0 truncate">
        {genre}
      </span>
      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[10px] font-black text-zinc-400 w-10 tabular-nums">{pct}%</span>
    </motion.div>
  );
});

const LibraryItemCard = React.memo(function LibraryItemCard({
  poster,
  title,
  type,
  idx,
  onClick,
}: {
  poster: string;
  title: string;
  type: string;
  idx: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.06, y: -4 }}
      onClick={onClick}
      className="relative shrink-0 w-[130px] aspect-[2/3] rounded-xl overflow-hidden border border-white/[0.06] hover:border-amber-500/40 cursor-pointer group transition-all duration-500 shadow-lg"
    >
      <OptimizedImage
        src={getOptimizedImageUrl(poster, 'w342')}
        alt={title}
        fill
        className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        sizes="130px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 inset-x-0 p-3">
        <div className="text-[9px] font-black text-white uppercase tracking-tight truncate drop-shadow-lg">
          {title}
        </div>
        <div className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
          {type === 'tv' ? 'Series' : type === 'anime' ? 'Anime' : 'Movie'}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-10 h-10 rounded-full bg-amber-500/90 flex items-center justify-center shadow-xl shadow-amber-500/30">
          <Play size={16} fill="black" className="text-black ml-0.5" />
        </div>
      </div>
    </motion.div>
  );
});

const CollectionCard = React.memo(function CollectionCard({
  name,
  count,
  idx,
  onClick,
  previews = [],
}: {
  name: string;
  count: number;
  idx: number;
  onClick: () => void;
  previews?: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.08 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 cursor-pointer group transition-all duration-500 overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <Layers size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
        {previews.length > 0 && (
          <div className="flex -space-x-3 group-hover:-space-x-1 transition-all duration-500">
            {previews.map((p, i) => (
              <div 
                key={i} 
                className="w-10 h-14 rounded-md overflow-hidden border border-black/40 shadow-xl"
                style={{ zIndex: 3 - i, transform: `rotate(${i * 4 - 4}deg)` }}
              >
                <OptimizedImage 
                  src={getOptimizedImageUrl(p, 'w92')} 
                  alt="Preview" 
                  fill 
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm font-black text-white uppercase tracking-tight relative z-10">{name}</div>
      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1 relative z-10">
        {count} {count === 1 ? 'title' : 'titles'}
      </div>
    </motion.div>
  );
});

const LibrarySkeleton = () => (
  <div className="px-10 lg:px-24 py-28 animate-pulse">
    <div className="h-10 w-64 bg-white/5 rounded-lg mb-10" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-20">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-white/5 rounded-2xl" />
      ))}
    </div>
    <div className="h-40 w-full bg-white/5 rounded-3xl" />
  </div>
);

/* ─── Main Component ──────────────────────────────── */

export function PersonalLibrary() {
  const activeProfile = useActiveProfile();
  const isHydrated = useHydrated();
  const library = useLibrary();
  const watchHistory = useWatchHistory();
  const collections = useCollections();
  const getFavorites = useLocalDataStore(s => s.getFavorites);
  const router = useRouter();

  const favorites = useMemo(() => (typeof getFavorites === 'function' ? getFavorites() : []), [getFavorites]);

  /* ── Derived Stats ── */
  const stats = useMemo(() => {
    const totalItems = library.length;
    const movieCount = library.filter(i => i.type === 'movie').length;
    const tvCount = library.filter(i => i.type === 'tv' || i.type === 'anime').length;
    const favCount = favorites.length;
    const totalMinutes = watchHistory.reduce((acc, h) => acc + (h.duration || 0) / 60, 0);
    const hours = Math.floor(totalMinutes / 60);
    const completedCount = watchHistory.filter(h => h.completed).length;

    return { totalItems, movieCount, tvCount, favCount, hours, completedCount };
  }, [library, watchHistory, favorites]);

  /* ── Genre DNA ── */
  const genreDNA = useMemo(() => {
    const counts: Record<string, number> = {};
    [...library, ...watchHistory].forEach(item => {
      (item.genres || []).forEach((g: string) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = sorted[0]?.[1] || 1;
    const COLORS = [
      'bg-amber-500',
      'bg-blue-500',
      'bg-rose-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-cyan-500',
    ];
    return sorted.map(([genre, count], i) => ({
      genre,
      pct: Math.round((count / max) * 100),
      color: COLORS[i % COLORS.length],
    }));
  }, [library, watchHistory]);

  /* ── Smart Collections ── */
  const smartCollections = useMemo(() => {
    const list = [];
    
    const inProgress = watchHistory
      .filter(h => !h.completed && h.progress > 5)
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 10);
    
    if (inProgress.length > 0) {
      list.push({
        id: 'smart-in-progress',
        name: 'In Progress',
        count: inProgress.length,
        items: inProgress.map(i => i.contentId),
        previews: inProgress.slice(0, 3).map(i => i.poster || ''),
        type: 'smart'
      });
    }

    const topRated = library
      .filter(i => (i.userRating || 0) >= 4)
      .slice(0, 10);
    
    if (topRated.length > 0) {
      list.push({
        id: 'smart-top-rated',
        name: 'Top Rated',
        count: topRated.length,
        items: topRated.map(i => i.contentId),
        previews: topRated.slice(0, 3).map(i => i.poster || ''),
        type: 'smart'
      });
    }

    if (genreDNA.length > 0) {
      const topGenre = genreDNA[0].genre;
      const genreItems = library.filter(i => (i.genres || []).includes(topGenre));
      if (genreItems.length >= 3) {
        list.push({
          id: `smart-genre-${topGenre}`,
          name: `${topGenre} Collection`,
          count: genreItems.length,
          items: genreItems.map(i => i.contentId),
          previews: genreItems.slice(0, 3).map(i => i.poster || ''),
          type: 'smart'
        });
      }
    }

    return list;
  }, [watchHistory, library, genreDNA]);

  /* ── Recent Additions ── */
  const recentItems = useMemo(
    () =>
      [...library]
        .sort((a, b) => b.addedAt - a.addedAt)
        .slice(0, 12),
    [library]
  );

  /* ── Activity (last 7 days) ── */
  const weekActivity = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString('en', { weekday: 'short' }), count: 0 };
    });
    const now = Date.now();
    watchHistory.forEach(h => {
      const age = (now - h.lastWatched) / (1000 * 60 * 60 * 24);
      const idx = 6 - Math.floor(age);
      if (idx >= 0 && idx < 7) days[idx].count++;
    });
    return days;
  }, [watchHistory]);
  const maxDayCount = Math.max(...weekActivity.map(d => d.count), 1);

  if (!activeProfile || !isHydrated) return <LibrarySkeleton />;

  const hasLibrary = library.length > 0;
  const hasHistory = watchHistory.length > 0;

  return (
    <section id="personal-library" className="px-10 lg:px-24 py-28 relative overflow-hidden">
      {/* BG Decor */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-amber-500/[0.04] rounded-full blur-[180px] -mr-72 -mt-72 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[140px] -ml-48 -mb-48 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="relative z-10 space-y-20">
        {/* ━━ Header ━━ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden">
              <motion.div
                animate={{ y: [-20, 60] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent w-full h-4"
              />
              <ShieldCheck size={28} className="relative z-10" />
            </div>
            <div>
              <PretextHeadline
                text="Personal Library"
                fontSize={36}
                fontWeight={900}
                letterSpacing="-0.03em"
                className="text-white uppercase leading-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                  {activeProfile.name}&apos;s Collection
                </span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/watchlist')}
            className="h-10 px-6 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-500 transition-all duration-300 flex items-center gap-2"
          >
            View Full Library <ChevronRight size={14} />
          </button>
        </div>

        {/* ━━ Stats Grid ━━ */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <StatCard icon={BookOpen} value={stats.totalItems} label="In Library" accent="bg-amber-500/5" />
          <StatCard icon={Film} value={stats.movieCount} label="Movies" accent="bg-blue-500/5" />
          <StatCard icon={Tv} value={stats.tvCount} label="Series" accent="bg-violet-500/5" />
          <StatCard icon={Heart} value={stats.favCount} label="Favorites" accent="bg-rose-500/5" />
          <StatCard icon={Clock} value={`${stats.hours}h`} label="Watch Time" accent="bg-emerald-500/5" />
          <StatCard icon={Star} value={stats.completedCount} label="Completed" accent="bg-cyan-500/5" />
        </motion.div>

        {/* ━━ Recently Added ━━ */}
        {hasLibrary && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={14} className="text-amber-500/60" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                Recently Added
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {recentItems.map((item, idx) => (
                <LibraryItemCard
                  key={item.id}
                  poster={item.poster || ''}
                  title={item.title}
                  type={item.type}
                  idx={idx}
                  onClick={() => router.push(`/watch?id=${item.contentId}&type=${item.type}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ━━ Middle Row: Genre DNA + Activity ━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Genre DNA */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={16} className="text-amber-500/60" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Genre DNA</span>
            </div>
            {genreDNA.length > 0 ? (
              <div className="space-y-3">
                {genreDNA.map((g, i) => (
                  <GenreBar key={g.genre} genre={g.genre} pct={g.pct} color={g.color} delay={i * 0.06} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
                <TrendingUp size={20} className="mb-2 opacity-40" />
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                  Watch more to build your profile
                </span>
              </div>
            )}
          </div>

          {/* Weekly Activity */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <Flame size={16} className="text-amber-500/60" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">This Week</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-28">
              {weekActivity.map((day, i) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className={cn(
                      'w-full rounded-lg transition-colors duration-500',
                      day.count > 0 ? 'bg-amber-500/60 hover:bg-amber-500' : 'bg-white/[0.04]'
                    )}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${Math.max((day.count / maxDayCount) * 100, 8)}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                  />
                  <span className="text-[8px] font-bold text-zinc-600 uppercase">{day.label}</span>
                </div>
              ))}
            </div>
            {hasHistory && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                  {watchHistory.filter(h => {
                    const age = (Date.now() - h.lastWatched) / (1000 * 60 * 60 * 24);
                    return age < 7;
                  }).length}{' '}
                  sessions this week
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-amber-500/70 uppercase tracking-wider">Active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ━━ Favorites Showcase ━━ */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Heart size={14} className="text-rose-500/60" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Favorites</span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {favorites.slice(0, 8).map((item, idx) => (
                <LibraryItemCard
                  key={item.id}
                  poster={item.poster || ''}
                  title={item.title}
                  type={item.type}
                  idx={idx}
                  onClick={() => router.push(`/watch?id=${item.contentId}&type=${item.type}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ━━ Collections Preview ━━ */}
        {(collections.filter(c => c.items.length > 0 || !c.isDefault).length > 0 || smartCollections.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers size={14} className="text-zinc-500" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Collections</span>
              </div>
              <button
                onClick={() => router.push('/collections')}
                className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1"
              >
                Manage <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Smart Collections first */}
              {smartCollections.map((col, idx) => (
                <CollectionCard
                  key={col.id}
                  name={col.name}
                  count={col.count}
                  idx={idx}
                  previews={col.previews}
                  onClick={() => router.push('/collections')}
                />
              ))}

              {/* User Collections */}
              {collections
                .filter(c => c.items.length > 0 || !c.isDefault)
                .slice(0, 4)
                .map((col, idx) => {
                  // Resolve previews for user collections
                  const colItems = col.items.map(id => library.find(l => l.contentId === id)).filter(Boolean);
                  const previews = colItems.slice(0, 3).map(i => i?.poster || '');

                  return (
                    <CollectionCard
                      key={col.id}
                      name={col.name}
                      count={col.items.length}
                      idx={smartCollections.length + idx}
                      previews={previews}
                      onClick={() => router.push('/collections')}
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* ━━ Empty State ━━ */}
        {!hasLibrary && !hasHistory && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[3rem] border border-dashed border-white/[0.06] p-16 flex flex-col items-center justify-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <BookOpen size={32} className="text-amber-500/40" />
            </div>
            <PretextHeadline
              text="Your Library Awaits"
              fontSize={28}
              fontWeight={900}
              letterSpacing="-0.03em"
              className="text-white uppercase mb-3"
            />
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
              Start watching and adding titles to build your personal library. Every interaction shapes your unique
              viewing profile.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-8 h-12 px-8 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95 shadow-xl shadow-amber-500/20"
            >
              Start Exploring
            </button>
          </motion.div>
        )}

        {/* ━━ Profile Identity Footer ━━ */}
        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
              Profile: {activeProfile.name}
            </span>
            <span className="text-[8px] font-mono text-zinc-700 uppercase">
              ID: {activeProfile.id.slice(0, 12).toUpperCase()}
            </span>
          </div>
          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
            NovaStream Library v2
          </span>
        </div>
      </div>
    </section>
  );
}
