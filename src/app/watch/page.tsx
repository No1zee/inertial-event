'use client';

import * as React from 'react';
import { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Play } from 'lucide-react';
import PostPlayOverlay from '@/components/player/overlay/PostPlayOverlay';

import dynamic from 'next/dynamic';
import { PlaybackHeader } from '@/components/player/PlaybackHeader';

const VidlinkPlayer = dynamic(() => import('@/components/player/VidlinkPlayer').then(mod => mod.VidlinkPlayer), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full flex items-center justify-center bg-black">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
});
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useContentDetails, useSeasonDetails } from '@/hooks/queries/useContent';
import { Content, SeasonDetails } from '@/lib/types/content';
import { EpisodeNavigator } from '@/components/content/EpisodeNavigator';
import { LoungeOverlay } from '@/components/social/LoungeOverlay';
import { motion, AnimatePresence } from 'framer-motion';


function WatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get ID and Type from Query Params
  const id = searchParams.get('id');
  const type = (searchParams.get('type') as 'movie' | 'tv' | 'anime' | 'series') || 'movie';
  const initialSeason = Number(searchParams.get('season')) || 1;
  const initialEpisode = Number(searchParams.get('episode')) || 1;
  const source = searchParams.get('source');

  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [showPostPlay, setShowPostPlay] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showEpisodeNavigator, setShowEpisodeNavigator] = useState(false);
  const [showLounge, setShowLounge] = useState(false);


  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Guard against double-fires from concurrent countdown auto-advance + manual button click
  const isNavigatingRef = useRef(false);

  // Sync state with URL if URL changes (back/forward nav)
  useEffect(() => {
    const s = Number(searchParams.get('season'));
    const e = Number(searchParams.get('episode'));
    if (s && s !== currentSeason) setCurrentSeason(s);
    if (e && e !== currentEpisode) setCurrentEpisode(e);
  }, [searchParams, currentSeason, currentEpisode]);

  // Unified Navigation Utility — zero-remount via state mutation + silent URL sync
  const navigateToEpisode = React.useCallback((s: number, e: number) => {
    setCurrentSeason(s);
    setCurrentEpisode(e);
    isNavigatingRef.current = false; // release guard after state update
    // Sync the URL silently without triggering a router navigation / remount
    const params = new URLSearchParams(searchParams.toString());
    params.set('season', s.toString());
    params.set('episode', e.toString());
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/watch?${params.toString()}`);
    }
  }, [searchParams]);

  // Redirect if no ID or missing params (Canonical Enforcement)
  useEffect(() => {
    if (!id) {
      router.push('/');
      return;
    }

    // Force canonical URL for TV/Anime if params are missing
    if (type !== 'movie' && (!searchParams.get('season') || !searchParams.get('episode'))) {
      navigateToEpisode(currentSeason, currentEpisode);
    }
  }, [id, type, searchParams, currentSeason, currentEpisode, navigateToEpisode, router]);

  const handleBack = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.push('/');
    } else {
      router.back();
    }
  }, [router]);

  // Handle UI Auto-hide logic
  useEffect(() => {
    const handleMouseMove = (e?: Event | CustomEvent) => {
      if (e?.type === 'AG_WAKE') {
        // console.log('[NovaStream] Activity detected via Aegis Relay');
      }

      setShowUI(true);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => {
        setShowUI(false);
      }, 5000); // Increased to 5s for better visibility
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      } else if (e.key.toLowerCase() === 'i' || e.key === ' ') {
        handleMouseMove();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('AG_WAKE', handleMouseMove as EventListener);

    handleMouseMove(); // Initial show

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('AG_WAKE', handleMouseMove as EventListener);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [handleBack]);

  // 1. Fetch Content Details
  const { data: contentData, isLoading: contentLoading, error: contentError } = useContentDetails(id || '', type);
  const content = contentData as Content | null;

  // 2. Fetch Season Details
  const { data: seasonData } = useSeasonDetails(id || '', currentSeason, type, type !== 'movie');
  const seasonDetails = seasonData as SeasonDetails | null;

  const handleNext = React.useCallback(() => {
    if (type === 'movie') return;
    // Idempotency guard — prevents double-fire from simultaneous countdown expiry + button click
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    let nextSeason = currentSeason;
    let nextEpisode = currentEpisode + 1;

    // Institutional Boundary Detection
    const totalSeasons = content?.seasons || content?.seasonsList?.length || 0;
    
    // 1. Primary Check: Precise Season Details (Full Episode List)
    if (seasonDetails?.episodes?.length) {
      const episodesInThisSeason = seasonDetails.episodes.length;
      
      if (nextEpisode > episodesInThisSeason) {
        if (currentSeason < totalSeasons) {
          nextSeason = currentSeason + 1;
          nextEpisode = 1;
        } else {
          isNavigatingRef.current = false;
          setShowPostPlay(true); // Series completed — show recommendations
          return;
        }
      }
    } 
    // 2. Secondary Check: seasonsList metadata fallback
    else if (content?.seasonsList) {
      const currentSeasonMeta = content.seasonsList.find(s => s.season_number === currentSeason);
      if (currentSeasonMeta && nextEpisode > currentSeasonMeta.episode_count) {
        if (currentSeason < totalSeasons) {
          nextSeason = currentSeason + 1;
          nextEpisode = 1;
        } else {
          isNavigatingRef.current = false;
          setShowPostPlay(true);
          return;
        }
      }
    }
    // 3. Season-crossing fallback: if current season count unknown but more seasons exist, go to next S E1
    else if (currentSeason < totalSeasons) {
      // Optimistic: assume current season ended and jump to S+1 E1
      // This only fires when seasonDetails has not yet loaded.
      nextSeason = currentSeason + 1;
      nextEpisode = 1;
    }

    navigateToEpisode(nextSeason, nextEpisode);
  }, [currentSeason, currentEpisode, seasonDetails, content, navigateToEpisode, type]);

  const handlePrev = React.useCallback(() => {
    if (type === 'movie') return;

    let nextSeason = currentSeason;
    let nextEpisode = currentEpisode - 1;

    if (nextEpisode < 1) {
      if (currentSeason > 1) {
        const prevSeasonNum = currentSeason - 1;
        const prevSeason = content?.seasonsList?.find(s => s.season_number === prevSeasonNum);
        nextSeason = prevSeasonNum;
        nextEpisode = prevSeason?.episode_count || 1; 
      } else {
        console.log('[NovaStream] Boundary reached: Start of series');
        return;
      }
    }

    navigateToEpisode(nextSeason, nextEpisode);
  }, [currentSeason, currentEpisode, content, navigateToEpisode, type]);

  const hasNext = React.useMemo(() => {
    if (type === 'movie') return false;
    
    // 1. Check current season boundary
    if (seasonDetails && seasonDetails.episodes) {
      if (currentEpisode < seasonDetails.episodes.length) return true;
    } else if (content?.seasonsList) {
      const currentS = content.seasonsList.find(s => s.season_number === currentSeason);
      if (currentS && currentEpisode < currentS.episode_count) return true;
    }

    // 2. Check series boundary (is there a next season?)
    const totalSeasons = content?.seasons || content?.seasonsList?.length || 0;
    if (currentSeason < totalSeasons) return true;

    // 3. Last Resort: Optimistic leap (if we are in a TV show and don't have metadata, assume next exists)
    if (!seasonDetails && !content) return true;

    return false;
  }, [type, seasonDetails, currentEpisode, currentSeason, content]);

  // Compute authoritative next episode coords for PostPlayOverlay & CinematicEndCredits
  const nextEpisodeCoords = useMemo(() => {
    if (type === 'movie') return null;
    const s = currentSeason;
    const e = currentEpisode;
    const totalSeasons = content?.seasons || content?.seasonsList?.length || 0;
    if (seasonDetails?.episodes?.length) {
      if (e < seasonDetails.episodes.length) return { season: s, episode: e + 1 };
      if (s < totalSeasons) return { season: s + 1, episode: 1 };
      return null; // series end
    }
    if (content?.seasonsList) {
      const cur = content.seasonsList.find(m => m.season_number === s);
      if (cur && e < cur.episode_count) return { season: s, episode: e + 1 };
      if (s < totalSeasons) return { season: s + 1, episode: 1 };
      return null;
    }
    return { season: s, episode: e + 1 }; // optimistic
  }, [type, currentSeason, currentEpisode, seasonDetails, content]);

  const hasPrev = type !== 'movie' && (currentEpisode > 1 || currentSeason > 1);

  if (contentLoading && !source) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-black overflow-hidden">
        {/* Cinematic Backdrop during loading */}
        {content?.backdrop && (
          <div className="absolute inset-0 opacity-40">
            <OptimizedImage
              src={content.backdrop}
              alt="Loading backdrop"
              fill
              className="object-cover blur-[50px] scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col items-center gap-10">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border border-white/5 rounded-full animate-pulse flex items-center justify-center">
                <Play size={24} className="text-white opacity-40 fill-white" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="space-y-1">
              <span className="text-primary font-black tracking-[0.6em] text-[12px] uppercase block">
                Establishing Link
              </span>
              <h2 className="text-white/40 text-xl font-display uppercase tracking-widest italic">
                {content?.title || 'Initializing'}
              </h2>
            </div>
            
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
              Synchronizing Buffers
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (contentError || !content) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="text-center space-y-8 max-w-md px-6">
          <AlertCircle className="h-16 w-16 text-red-500/20 mx-auto" strokeWidth={1} />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tighter">Playback Interrupted</h2>
            <p className="text-zinc-400 text-sm font-medium">
              The platform could not establish a stable connection to this content.
            </p>
          </div>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="h-14 px-10 rounded-2xl border-white/10 hover:bg-white hover:text-black transition-all"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }


  const cleanTmdbId = id!.replace('tmdb_', '');

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col group/player">
      {/* The Playback Header Overlay */}
      <PlaybackHeader
        show={showUI}
        title={content?.title || 'Loading...'}
        subTitle={type !== 'movie' ? `Season ${currentSeason} • Episode ${currentEpisode}` : undefined}
        type={type as any}
        season={currentSeason}
        episode={currentEpisode}
        hasNext={!!hasNext}
        hasPrev={!!hasPrev}
        onNext={handleNext}
        onPrev={handlePrev}
        onBack={handleBack}
        onLogClick={() => setShowEpisodeNavigator(true)}
        onLoungeClick={() => setShowLounge(true)}
      />

      {/* Main Player Component */}
      <main className="flex-1 w-full relative z-[100] overflow-hidden min-h-0">
        <VidlinkPlayer
          tmdbId={cleanTmdbId}
          type={type}
          season={currentSeason}
          episode={currentEpisode}
          content={content}
          onNext={type !== 'movie' ? handleNext : undefined}
          onPrev={type !== 'movie' ? handlePrev : undefined}
          onBack={handleBack}
          hasNext={!!hasNext}
          hasPrev={!!hasPrev}
          onSeasonChange={(s) => navigateToEpisode(s, 1)}
          onEpisodeChange={(e) => navigateToEpisode(currentSeason, Number(e))}
          showUI={showUI}
          initialSource={source}
        />
      </main>

      {/* Navigation Overlay (Optional - Hidden by default) */}
      <AnimatePresence>
        {showPostPlay && (
          <PostPlayOverlay
            show={showPostPlay}
            onClose={() => setShowPostPlay(false)}
            currentId={cleanTmdbId}
            type={type}
            nextEpisode={nextEpisodeCoords}
            onPlay={(nid, ntype, ns, ne) => {
              setShowPostPlay(false);
              if (ns && ne) {
                router.push(`/watch?id=${nid}&type=${ntype}&season=${ns}&episode=${ne}`);
              } else {
                router.push(`/watch?id=${nid}&type=${ntype}`);
              }
            }}
          />
        )}
      </AnimatePresence>

      {(type === 'tv' || type === 'anime' || type === 'series') && content?.seasonsList && (
        <EpisodeNavigator 
          show={showEpisodeNavigator}
          onClose={() => setShowEpisodeNavigator(false)}
          tmdbId={cleanTmdbId}
          type={type}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onSelect={(s, e) => {
            setShowEpisodeNavigator(false);
            navigateToEpisode(s, e);
          }}
          seasons={content.seasonsList}
        />
      )}

      <LoungeOverlay show={showLounge} onClose={() => setShowLounge(false)} roomUrl={typeof window !== 'undefined' ? window.location.href : ''} />

      {/* Custom Cursor Overlay */}
      <motion.div
        animate={{ opacity: showUI ? 0 : 1 }}
        className="absolute inset-0 z-[300] cursor-none pointer-events-none"
      />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-black">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}

