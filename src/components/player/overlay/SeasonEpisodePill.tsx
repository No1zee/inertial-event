'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Season, SeasonEpisode } from '@/lib/types/content';

interface SeasonEpisodePillProps {
  currentSeason: number;
  currentEpisode: number;
  seasons: Season[];
  episodeDetails?: SeasonEpisode[];
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: string) => void;
}

export default function SeasonEpisodePill({
  currentSeason,
  currentEpisode,
  seasons,
  episodeDetails,
  onSeasonChange,
  onEpisodeChange,
}: SeasonEpisodePillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'season' | 'episode'>(currentSeason ? 'episode' : 'season');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSeason = seasons.find(s => s.season_number === currentSeason);
  const episodeCount = selectedSeason?.episode_count || 0;

  return (
    <div className="relative" ref={containerRef}>
      {/* Pill Trigger */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-3xl border transition-all duration-300",
          isOpen 
            ? "bg-white/15 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
            : "bg-white/5 border-white/10 hover:bg-white/10"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Season</span>
          <span className="text-sm font-black text-white">{currentSeason.toString().padStart(2, '0')}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Episode</span>
          <span className="text-sm font-black text-white">{currentEpisode.toString().padStart(2, '0')}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={cn("text-white/50 transition-transform duration-500", isOpen && "rotate-180")} 
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-4 w-[320px] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
          >
            {/* Header / Tabs */}
            <div className="flex p-2 gap-2 bg-white/5">
              <button
                onClick={() => setActiveTab('season')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'season' ? "bg-white text-black" : "text-white/50 hover:text-white"
                )}
              >
                Seasons
              </button>
              <button
                onClick={() => setActiveTab('episode')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'episode' ? "bg-white text-black" : "text-white/50 hover:text-white"
                )}
              >
                Episodes
              </button>
            </div>

            {/* List Area */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3">
              {activeTab === 'season' ? (
                <div className="grid grid-cols-2 gap-2">
                  {seasons
                    ?.filter(s => s.season_number > 0)
                    .map((s) => (
                    <button
                      key={s.id || s.season_number}
                      onClick={() => {
                        onSeasonChange(s.season_number);
                        setActiveTab('episode');
                      }}
                      className={cn(
                        "group relative flex flex-col p-4 rounded-2xl border transition-all duration-300",
                        s.season_number === currentSeason
                          ? "bg-white border-white text-black"
                          : "bg-white/5 border-white/5 text-white hover:border-white/20"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-50">Season</span>
                      <span className="text-xl font-black">{s.season_number}</span>
                      {s.season_number === currentSeason && (
                        <CheckCircle2 size={14} className="absolute top-3 right-3" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map((epNum) => {
                    const epDetail = episodeDetails?.find(ed => ed.episode_number === epNum);
                    const isSelected = epNum === currentEpisode;
                    const airDate = epDetail?.air_date ? new Date(epDetail.air_date) : null;
                    const isAired = airDate ? airDate <= new Date() : true;

                    return (
                      <button
                        key={epNum}
                        disabled={!isAired}
                        onClick={() => {
                          onEpisodeChange(epNum.toString());
                          setIsOpen(false);
                        }}
                        className={cn(
                          "group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 text-left",
                          isSelected
                            ? "bg-white border-white text-black"
                            : isAired 
                              ? "bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/20"
                              : "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl font-black text-xs",
                          isSelected ? "bg-black/10" : "bg-white/10"
                        )}>
                          {epNum}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-bold truncate">
                            {epDetail?.name || `Episode ${epNum}`}
                          </span>
                          {!isAired && (
                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-red-500 mt-1">
                              <Calendar size={10} /> Not Aired
                            </span>
                          )}
                        </div>
                        {isSelected ? <CheckCircle2 size={16} /> : isAired && <Play size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
