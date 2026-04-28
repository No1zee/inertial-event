'use client';

import { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import { type Content, type CastMember, type Season } from '@/lib/types/content';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Play, Plus, Check, X, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { contentApi } from '@/lib/api/content';
import { useLocalDataStore, useLibraryActions } from '@/lib/stores/localDataStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { shallow } from 'zustand/shallow';
import { useHydrated } from '@/hooks/useHydrated';
import { AtmosphericPreview } from './AtmosphericPreview';
import { PretextHeadline } from '../Common/PretextHeadline';
import { streamingOptimizer } from '@/services/streamingOptimizer';
import { usePlayerPreferences } from '@/lib/stores/preferencesStore';

interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  air_date: string;
  still_path: string | null;
  runtime: number | null;
}

interface TMDBSeasonResponse {
  episodes: TMDBEpisode[];
}

function EpisodeProgressBar({ percent }: { percent: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--width', `${percent}%`);
    }
  }, [percent]);

  if (percent <= 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
      <div ref={ref} className="h-full bg-primary dynamic-width" />
    </div>
  );
}

export default function ContentModal() {
  const { isOpen, content, providerId, closeModal, openCastModal } = useUIStore(
    state => ({
      isOpen: state.contentModal.isOpen,
      content: state.contentModal.content,
      providerId: state.contentModal.providerId,
      closeModal: state.closeContentModal,
      openCastModal: state.openCastModal,
    }),
    shallow
  );
  const router = useRouter();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryActions();
  const [detailedContent, setDetailedContent] = useState<Content | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'documentation' | 'episodes'>('overview');
  const [showPreview, setShowPreview] = useState(false);

  const isHydrated = useHydrated();
  const states = useLocalDataStore(state => state.contentState);
  const getResumeData = useLocalDataStore(state => state.getResumeData);
  const watchHistory = useLocalDataStore(state => state.watchHistory);
  const { audioLanguage } = usePlayerPreferences();

  const handlePrewarm = useCallback(() => {
    if (!content) return;
    const type = (content.type || (content.seasonsList && content.seasonsList.length > 0 ? 'tv' : 'movie')) as 'movie' | 'tv' | 'anime';
    streamingOptimizer.preloadSources(
      content.id,
      type,
      1,
      1,
      content.title,
      audioLanguage
    );
  }, [content, audioLanguage]);

  const inLibrary = content ? isInLibrary(String(content.id)) : false;

  // Reset and Fetch
  useEffect(() => {
    if (isHydrated && isOpen && content) {
      setDetailedContent(content);

      const type = content.type || (content.seasonsList && content.seasonsList.length > 0 ? 'tv' : 'movie');
      const apiType = type === 'anime' ? 'tv' : type;

      contentApi.getDetails(content.id, apiType as 'movie' | 'tv').then(details => {
        if (details) {
          setDetailedContent(details);
          if (details.seasonsList && details.seasonsList.length > 0) {
            const state = states[String(content.id)];
            if (state) {
              setSelectedSeason(state.lastWatchedSeason || details.seasonsList[0].season_number);
            } else {
              setSelectedSeason(details.seasonsList[0].season_number);
            }
          }
        }
      });

      contentApi.getRecommendations(content.id, apiType as 'movie' | 'tv').then(setRecommendations);

      // Trigger trailer preview after a 1.5s delay
      const previewTimer = setTimeout(() => {
        setShowPreview(true);
      }, 1500);

      return () => {
        clearTimeout(previewTimer);
        setShowPreview(false);
      };
    }
  }, [isHydrated, isOpen, content, states]);

  // Episodes fetch
  useEffect(() => {
    if (!isOpen || !content) return;
    const actualType = content.type || (content.seasonsList && content.seasonsList.length > 0 ? 'tv' : 'movie');
    if (actualType === 'tv' || actualType === 'anime') {
      setIsLoadingEpisodes(true);
      contentApi.getSeasonDetails(content.id, selectedSeason).then(data => {
        const seasonData = data as TMDBSeasonResponse;
        if (seasonData && seasonData.episodes) {
          setEpisodes(seasonData.episodes);
        }
        setIsLoadingEpisodes(false);
      });
    }
  }, [isOpen, content, selectedSeason]);

  const resumeData = content ? getResumeData(String(content.id)) : null;

  const handlePlay = useCallback(() => {
    if (!content) return;
    closeModal();
    const type = content.type || (content.seasonsList && content.seasonsList.length > 0 ? 'tv' : 'movie');
    const providerQuery = providerId ? `&provider=${providerId}` : '';

    if (resumeData) {
      const { season, episode, currentTime, completed } = resumeData;
      if (!completed) {
        router.push(
          `/watch?id=${content.id}&type=${type}${season ? `&season=${season}` : ''}${episode ? `&episode=${episode}` : ''}&progress=${currentTime}${providerQuery}`
        );
      } else {
        router.push(`/watch?id=${content.id}&type=${type}&season=${season ?? 1}&episode=${(episode ?? 1) + 1}${providerQuery}`);
      }
    } else {
      router.push(`/watch?id=${content.id}&type=${type}${providerQuery}`);
    }
  }, [closeModal, content, router, resumeData, providerId]);

  const toggleWatchlist = useCallback(() => {
    if (!content) return;
    if (inLibrary) {
      removeFromLibrary(String(content.id));
    } else {
      addToLibrary({
        contentId: String(content.id),
        type: content.type || 'movie',
        title: content.title,
        poster: content.poster,
        backdrop: content.backdrop,
        favorite: false,
      });
    }
  }, [inLibrary, content, removeFromLibrary, addToLibrary]);

  if (!isHydrated || !content) return null;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={closeModal} className="relative z-[1150]">
        {/* Backdrop with darker tint and blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto w-screen p-0 sm:p-4 md:p-12 lg:p-20 flex items-start justify-center pt-8">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-400"
            enterFrom="opacity-0 translate-y-24 scale-[0.9]"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-24 scale-[0.9]"
          >
            <Dialog.Panel data-testid="content-modal" className="w-full max-w-6xl bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative">
              {/* Close Button */}
              <button
                onClick={closeModal}
                title="Close modal"
                aria-label="Close modal"
                className="absolute top-6 right-6 z-[60] p-2.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-white/70 hover:text-white transition-all ring-1 ring-white/10"
              >
                <X size={20} />
              </button>

              {/* Hero Image Section */}
              <div className="relative aspect-[21/9] w-full group">
                <OptimizedImage
                  src={content.backdrop || content.poster || content.backdrop_path || content.poster_path}
                  alt={content.title}
                  fill
                  className="object-cover brightness-[0.85]"
                  priority
                />
                <AtmosphericPreview 
                  id={content.id} 
                  type={(content.type || (content.seasonsList && content.seasonsList.length > 0 ? 'tv' : 'movie')) as 'movie' | 'tv' | 'anime'} 
                  show={showPreview} 
                />
                
                {/* Trailer Hover Scrim */}
                <div 
                  className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center cursor-pointer"
                  onClick={handlePlay}
                  onMouseEnter={handlePrewarm}
                >
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl transition-colors duration-300"
                  >
                    <Play size={40} fill="currentColor" className="ml-2" />
                  </motion.div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 p-8 sm:p-14 w-full z-30">
                  <div className="flex items-end gap-6 mb-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      whileInView={showPreview ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0 }}
                      className="w-20 h-20 rounded-2xl bg-white text-black flex items-center justify-center shadow-cinematic cursor-pointer hover:bg-amber-500 hover:scale-110 transition-all duration-500"
                      onClick={handlePlay}
                      onMouseEnter={handlePrewarm}
                    >
                      <Play size={32} fill="currentColor" className="ml-1" />
                    </motion.div>

                    <PretextHeadline 
                      text={content.title}
                      fontSize={64}
                      fontWeight={900}
                      maxWidth={800}
                      shadow={{
                        color: 'rgba(0,0,0,0.6)',
                        blur: 40,
                        offsetX: 0,
                        offsetY: 15
                      }}
                      className="italic font-display uppercase leading-none"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <Button
                      size="lg"
                      onClick={handlePlay}
                      onMouseEnter={handlePrewarm}
                      className="bg-white text-black hover:bg-zinc-200 font-bold px-10 h-14 text-xl rounded-xl shadow-2xl transition-all"
                    >
                      <Play size={24} fill="currentColor" className="mr-3" />
                      {resumeData
                        ? resumeData.completed
                          ? `Watch S${resumeData.season ?? 1} E${(resumeData.episode ?? 1) + 1}`
                          : content.type === 'movie'
                            ? 'Resume'
                            : `Resume S${resumeData.season} E${resumeData.episode}`
                        : 'Play'}
                    </Button>

                    {resumeData && !resumeData.completed && (
                      <button
                        onClick={() => {
                          // Force play from beginning by passing a specific param or clearing history for this item
                          // For now, we'll just navigate to the watch page without progress
                          if (content.type === 'movie') {
                            router.push(`/watch?id=${content.id}&type=movie&progress=0`);
                          } else {
                            router.push(`/watch?id=${content.id}&type=${content.type}&season=${resumeData.season}&episode=${resumeData.episode}&progress=0`);
                          }
                          closeModal();
                        }}
                        className="h-14 px-8 flex items-center justify-center rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-all bg-black/20 backdrop-blur-xl font-bold uppercase tracking-widest text-sm"
                      >
                        Restart
                      </button>
                    )}

                    <button
                      onClick={toggleWatchlist}
                      className="w-14 h-14 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition-all bg-black/40 backdrop-blur-xl"
                    >
                      {inLibrary ? <Check size={28} /> : <Plus size={28} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="px-8 sm:px-14 border-b border-white/5 flex gap-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'py-6 text-sm font-black uppercase tracking-[0.2em] transition-all relative',
                    activeTab === 'overview' ? 'text-white' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  Overview
                  {activeTab === 'overview' && (
                    <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                  )}
                </button>

                {content.heritage && (
                  <button
                    onClick={() => setActiveTab('documentation')}
                    className={cn(
                      'py-6 text-sm font-black uppercase tracking-[0.2em] transition-all relative',
                      activeTab === 'documentation' ? 'text-amber-500' : 'text-white/40 hover:text-white/60'
                    )}
                  >
                    Heritage Documentation
                    {activeTab === 'documentation' && (
                      <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                    )}
                  </button>
                )}

                {(content.type === 'tv' || content.type === 'anime') && (
                  <button
                    onClick={() => setActiveTab('episodes')}
                    className={cn(
                      'py-6 text-sm font-black uppercase tracking-[0.2em] transition-all relative',
                      activeTab === 'episodes' ? 'text-white' : 'text-white/40 hover:text-white/60'
                    )}
                  >
                    Episodes
                    {activeTab === 'episodes' && (
                      <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                    )}
                  </button>
                )}
              </div>

              {/* Content Views */}
              <div className="px-8 sm:px-14 py-12">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-3 space-y-10">
                      <div className="flex flex-wrap items-center gap-4 text-zinc-400 font-medium">
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 font-black text-xs tracking-widest uppercase">
                          <Star size={14} fill="currentColor" className="mr-0.5" />
                          <span>MaiWatch Score // {content.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        
                        {(detailedContent?.ratings?.imdb || content.ratings?.imdb) && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-white/10 rounded text-white font-black text-[10px] tracking-widest uppercase">
                            <span className="text-zinc-500">IMDb</span>
                            <span className="text-amber-500">{detailedContent?.ratings?.imdb?.score || content.ratings?.imdb?.score}</span>
                          </div>
                        )}

                        {(detailedContent?.ratings?.rottenTomatoes || content.ratings?.rottenTomatoes) && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-white/10 rounded text-white font-black text-[10px] tracking-widest uppercase">
                            <span className="text-zinc-500">Rotten</span>
                            <span className="text-red-500">{detailedContent?.ratings?.rottenTomatoes?.score || content.ratings?.rottenTomatoes?.score}%</span>
                          </div>
                        )}

                        <span className="text-zinc-300 font-bold ml-2">{content.releaseDate?.substring(0, 4)}</span>
                        <span className="border border-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-zinc-300">
                          {content.type === 'tv' ? 'Series' : 'Movie'}
                        </span>
                      </div>

                      <p 
                        data-testid="modal-overview"
                        className="text-xl text-zinc-300 leading-relaxed font-light max-w-4xl"
                      >
                        {detailedContent?.description || content.description || detailedContent?.overview || content.overview || 'No description available.'}
                      </p>

                      {detailedContent?.cast && detailedContent.cast.length > 0 && (
                        <div className="space-y-6">
                          <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                            Cast // Featured
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                            {detailedContent.cast.map((c: CastMember) => (
                              <div
                                key={c.id}
                                className="group/cast space-y-3 cursor-pointer"
                                onClick={() => openCastModal(c.id, c.name)}
                              >
                                <div className="aspect-[4/5] relative rounded-lg overflow-hidden bg-zinc-900 ring-1 ring-white/5 group-hover/cast:ring-white/20 transition-all">
                                  <OptimizedImage
                                    src={c.profilePath || '/images/cast_placeholder.jpg'}
                                    alt={c.name}
                                    fill
                                    className="object-cover group-hover/cast:scale-105 transition-transform duration-500 grayscale group-hover/cast:grayscale-0"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/cast:opacity-100 transition-opacity" />
                                </div>
                                <div>
                                  <p className="text-white font-bold text-sm truncate">{c.name}</p>
                                  <p className="text-zinc-500 text-xs truncate font-medium tracking-tight">
                                    {c.character}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {recommendations.length > 0 && (
                        <div className="space-y-6 pt-12">
                          <div className="flex items-center gap-3">
                            <span className="text-primary text-xs font-black uppercase tracking-[0.3em]">
                              Neural Sync
                            </span>
                            <h3 className="text-white text-xs font-black uppercase tracking-widest">Matched Content</h3>
                          </div>
                          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8">
                            {recommendations.map(item => (
                              <div
                                key={item.id}
                                onClick={() => setDetailedContent(null)} // Trigger re-render with new content
                                className="w-40 shrink-0 group/rec cursor-pointer"
                              >
                                <div className="aspect-[2/3] relative rounded-lg overflow-hidden ring-1 ring-white/5 group-hover/rec:ring-primary/40 transition-all">
                                  <OptimizedImage
                                    src={item.poster || item.poster_path || item.backdrop || item.backdrop_path}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover/rec:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                </div>
                                <p className="text-[10px] font-bold text-white mt-3 truncate uppercase tracking-tighter opacity-60 group-hover/rec:opacity-100 transition-opacity">
                                  {item.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-12">
                      <div className="space-y-2">
                        <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Director</span>
                        <p className="text-zinc-300 font-bold">{detailedContent?.director || 'N/A'}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Genres</span>
                        <div className="flex flex-wrap gap-2">
                          {content.genres?.map(g => (
                            <span
                              key={g}
                              className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-white/5"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documentation' && content.heritage && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                          <h3 className="text-amber-500 text-xs font-black uppercase tracking-[0.3em]">
                            Cultural Insight // Documentation
                          </h3>
                          <div className="text-xl text-zinc-300 leading-relaxed font-light space-y-6 italic">
                            {content.heritage.culturalContext ? (
                              content.heritage.culturalContext.split('\n').map((para, i) => <p key={i}>{para}</p>)
                            ) : (
                              <p>Documentation is being curated for this title.</p>
                            )}
                          </div>
                        </div>

                        {content.heritage.accuracyVerified && (
                          <div className="flex items-center gap-6 p-8 rounded-xl bg-amber-500/5 border border-amber-500/20 shadow-2xl">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                              <Check size={32} strokeWidth={3} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-black text-white uppercase tracking-tight italic">
                                Verified Accurate
                              </h4>
                              <p className="text-sm text-zinc-400 font-medium">
                                This content has been cross-referenced for historical and cultural accuracy by African
                                Cinematic Universe historians.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-8">
                        <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 space-y-6">
                          <h4 className="text-zinc-500 text-xs font-black uppercase tracking-widest border-b border-white/5 pb-4">
                            Archives
                          </h4>
                          <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-amber-500/60 uppercase">
                                Regional Origins
                              </span>
                              <span className="text-sm text-white font-bold">
                                {content.heritage.regionalOrigins?.join(', ') || 'Pan-African'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-amber-500/60 uppercase">
                                Documentation ID
                              </span>
                              <span className="text-sm text-white font-mono uppercase tracking-tighter">
                                ACU-REF-{content.id.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 rounded-xl bg-amber-500 text-black space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            Director&apos;s Note
                          </h4>
                          <p className="text-sm font-bold leading-tight italic">
                            &ldquo;{content.heritage.curatorNote || 'A masterpiece of African vision and heritage.'}
                            &rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'episodes' &&
                  (content.type === 'tv' || content.type === 'anime') &&
                  detailedContent?.seasonsList && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-12">
                        <h3 className="text-3xl font-black text-white tracking-tight">Episodes</h3>
                        <select
                          value={selectedSeason}
                          onChange={e => setSelectedSeason(Number(e.target.value))}
                          className="bg-zinc-900 text-white px-6 py-3 rounded-xl border border-white/10 font-bold min-w-[160px]"
                          title="Select season"
                          aria-label="Select season"
                        >
                          {detailedContent.seasonsList.map((s: Season) => (
                            <option key={s.id} value={s.season_number}>
                              {s.name || `Season ${s.season_number}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isLoadingEpisodes ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                          <Loader2 className="animate-spin text-zinc-600" size={48} />
                          <span className="text-zinc-500 text-sm font-medium animate-pulse">Fetching episodes...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {episodes.map((ep: TMDBEpisode) => {
                            const historyItemId = `${content.id}-${content.type}-${selectedSeason}-${ep.episode_number}`;
                            const historyItem = watchHistory.find(h => h.id === historyItemId);
                            const progressPercent = historyItem?.progress || 0;
                            return (
                              <div
                                key={ep.id}
                                className="group/ep flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl transition-all hover:bg-white/5 cursor-pointer"
                                onClick={() => {
                                  closeModal();
                                  router.push(
                                    `/watch?id=${content.id}&type=${content.type}&season=${selectedSeason}&episode=${ep.episode_number}${providerId ? `&provider=${providerId}` : ''}`
                                  );
                                }}
                              >
                                <div className="text-xl font-bold text-zinc-600 w-8 text-center">
                                  {ep.episode_number}
                                </div>
                                <div className="relative aspect-video w-full sm:w-64 shrink-0 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                  <OptimizedImage
                                    src={
                                      ep.still_path
                                        ? getOptimizedImageUrl(ep.still_path, 'w500')
                                        : (content.backdrop || content.backdrop_path || content.poster || content.poster_path || '/images/hero_placeholder.jpg')
                                    }
                                    alt={ep.name}
                                    fill
                                    className="object-cover group-hover/ep:scale-110 transition-transform duration-700"
                                  />
                                  <EpisodeProgressBar percent={progressPercent} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-xl mb-3 text-white">{ep.name}</h4>
                                  <p className="text-zinc-400 text-sm line-clamp-2 font-light">
                                    {ep.overview || 'No description available.'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
