'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Play, Clock, LayoutGrid, List } from 'lucide-react';
import { contentApi } from '@/lib/api/content';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '../Common/PretextHeadline';

interface EpisodeNavigatorProps {
  show: boolean;
  onClose: () => void;
  tmdbId: string;
  type: 'tv' | 'anime';
  currentSeason: number;
  currentEpisode: number;
  onSelect: (season: number, episode: number) => void;
  seasons: any[];
}

export function EpisodeNavigator({
  show,
  onClose,
  tmdbId,
  type,
  currentSeason,
  currentEpisode,
  onSelect,
  seasons
}: EpisodeNavigatorProps) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const watchHistory = useLocalDataStore(state => state.watchHistory);

  useEffect(() => {
    if (show) {
      setIsLoading(true);
      contentApi.getSeasonDetails(tmdbId, selectedSeason).then((data: any) => {
        if (data && data.episodes) {
          setEpisodes(data.episodes);
        }
        setIsLoading(false);
      });
    }
  }, [show, tmdbId, selectedSeason]);

  const filteredEpisodes = episodes.filter(ep => 
    ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep.episode_number.toString() === searchQuery
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/5">
            <div className="flex items-center gap-12">
              <PretextHeadline
                text="Reel Index"
                fontSize={32}
                fontWeight={900}
                letterSpacing="-0.04em"
                className="text-white uppercase italic"
              />
              
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <Search size={18} className="text-white/40" />
                <input 
                  type="text"
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white font-bold text-sm w-64 placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Switch to Grid View"
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-black" : "text-white/40 hover:text-white")}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="Switch to List View"
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-black" : "text-white/40 hover:text-white")}
                >
                  <List size={18} />
                </button>
              </div>

              <button 
                onClick={onClose}
                title="Close"
                aria-label="Close Reel Index"
                className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Season Sidebar */}
            <div className="w-64 border-r border-white/5 p-6 overflow-y-auto no-scrollbar">
              <PretextHeadline
                text="Production Arcs"
                fontSize={10}
                fontWeight={900}
                letterSpacing="0.4em"
                className="text-zinc-500 uppercase mb-6 block"
              />
              <div className="flex flex-col gap-2">
                {seasons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeason(s.season_number)}
                    title={`Switch to Season ${s.season_number}`}
                    aria-label={`Switch to Season ${s.season_number}`}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-all group",
                      selectedSeason === s.season_number 
                        ? "bg-primary text-white shadow-xl shadow-primary/20" 
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="font-black uppercase italic tracking-tighter text-sm">Season {s.season_number}</span>
                    <ChevronRight size={16} className={cn("transition-transform", selectedSeason === s.season_number ? "translate-x-0" : "-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                  </button>
                ))}
              </div>
            </div>

            {/* Episodes Grid/List */}
            <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
                  />
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm animate-pulse">Syncing Playback Data...</span>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
                    : "flex flex-col gap-4"
                )}>
                  {filteredEpisodes.map((ep) => {
                    const isCurrent = selectedSeason === currentSeason && ep.episode_number === currentEpisode;
                    const historyId = `${tmdbId}-${type}-${selectedSeason}-${ep.episode_number}`;
                    const history = watchHistory.find(h => h.id === historyId);
                    const progress = history?.progress || 0;

                    return (
                      <motion.div
                        key={ep.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onSelect(selectedSeason, ep.episode_number)}
                        onKeyDown={(e) => e.key === 'Enter' && onSelect(selectedSeason, ep.episode_number)}
                        role="button"
                        tabIndex={0}
                        title={`Play Episode ${ep.episode_number}: ${ep.name}`}
                        aria-label={`Play Episode ${ep.episode_number}: ${ep.name}`}
                        className={cn(
                          "group/ep cursor-pointer relative",
                          viewMode === 'grid' ? "flex flex-col gap-4" : "flex items-center gap-8 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5"
                        )}
                      >
                        <div className={cn(
                          "relative rounded-3xl overflow-hidden ring-1 ring-white/10 group-hover/ep:ring-primary/50 transition-all",
                          viewMode === 'grid' ? "aspect-video w-full" : "aspect-video w-64 shrink-0"
                        )}>
                          <OptimizedImage 
                            src={ep.still_path ? getOptimizedImageUrl(ep.still_path, 'w500') : '/images/hero_placeholder.jpg'}
                            alt={ep.name}
                            fill
                            className="object-cover group-hover/ep:scale-110 transition-transform duration-700"
                          />
                          
                          {/* Progress Bar */}
                          {progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                          )}

                          {/* Current Indicator */}
                          {isCurrent && (
                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center border-4 border-primary">
                              <div className="bg-primary text-white p-4 rounded-full shadow-2xl">
                                <Play size={32} fill="currentColor" />
                              </div>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Episode {ep.episode_number}</span>
                            {progress >= 95 && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Completed</span>}
                            {progress > 0 && progress < 95 && (
                              <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                                <Clock size={10} />
                                <span>{Math.round(progress)}%</span>
                              </div>
                            )}
                          </div>
                          <h4 className={cn("font-black text-white uppercase italic tracking-tighter truncate", viewMode === 'grid' ? "text-xl" : "text-2xl")}>
                            {ep.name}
                          </h4>
                          <p className="text-zinc-500 text-xs line-clamp-2 mt-2 leading-relaxed font-medium">
                            {ep.overview || 'Synopsis unavailable for this sequence.'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
