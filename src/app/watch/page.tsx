'use client';

import * as React from 'react';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import PostPlayOverlay from '@/components/player/overlay/PostPlayOverlay';

import { VidlinkPlayer } from '@/components/player/VidlinkPlayer';
import { DirectorBar } from '@/components/player/DirectorBar';
import { Button } from '@/components/ui/button';
import { useContentDetails, useSeasonDetails } from '@/hooks/queries/useContent';
import { EpisodeNavigator } from '@/components/content/EpisodeNavigator';
import { LoungeOverlay } from '@/components/social/LoungeOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';

function WatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get ID and Type from Query Params
  const id = searchParams.get('id');
  const type = (searchParams.get('type') as 'movie' | 'tv' | 'anime') || 'movie';
  const initialSeason = Number(searchParams.get('season')) || 1;
  const initialEpisode = Number(searchParams.get('episode')) || 1;

  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [showPostPlay, setShowPostPlay] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showEpisodeNavigator, setShowEpisodeNavigator] = useState(false);
  const [showLounge, setShowLounge] = useState(false);
  const { activeSourceId } = useUserPreferencesStore();

  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with URL if URL changes (back/forward nav)
  useEffect(() => {
    const s = Number(searchParams.get('season'));
    const e = Number(searchParams.get('episode'));
    if (s && s !== currentSeason) setCurrentSeason(s);
    if (e && e !== currentEpisode) setCurrentEpisode(e);
  }, [searchParams, currentSeason, currentEpisode]);



  // Redirect if no ID
  useEffect(() => {
    if (!id) {
      router.push('/');
    }
  }, [id, router]);

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
        // console.log('[MaiWatch] Activity detected via Aegis Relay');
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
  const { data: content, isLoading: contentLoading, error: contentError } = useContentDetails(id || '', type);

  // Watch history is now initialized natively in the player components to prevent race conditions

  // 2. Fetch Season Details
  const { data: seasonDetails } = useSeasonDetails(id || '', currentSeason, type !== 'movie');

  if (contentLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-12">
          <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-primary font-bold tracking-[0.4em] text-[10px] uppercase animate-pulse">
              Preparing Sanctuary
            </span>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest opacity-60">
              Retrieving Secure Stream Keys
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
            <h2 className="text-3xl font-bold text-white tracking-tighter">Stream Interrupted</h2>
            <p className="text-zinc-400 text-sm font-medium">
              The sanctuary could not establish a stable connection to this broadcast.
            </p>
          </div>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="h-14 px-10 rounded-2xl border-white/10 hover:bg-white hover:text-black transition-all"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            Return to Hub
          </Button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    // Fallback next logic: try to increment episode even if details are missing
    let nextSeason = currentSeason;
    let nextEpisode = currentEpisode + 1;

    if (seasonDetails) {
      if (nextEpisode > seasonDetails.episodes.length) {
        const nextSeasonExists = content?.seasonsList?.some(s => s.season_number === currentSeason + 1);
        if (nextSeasonExists || currentSeason < (content?.seasons || 0)) {
          nextSeason = currentSeason + 1;
          nextEpisode = 1;
        } else {
          return; // End of series
        }
      }
    }

    router.push(`/watch?id=${id}&type=${type}&season=${nextSeason}&episode=${nextEpisode}`);
  };

  const handlePrev = () => {
    let nextSeason = currentSeason;
    let nextEpisode = currentEpisode - 1;

    if (nextEpisode < 1) {
      if (currentSeason > 1) {
        const prevSeasonNum = currentSeason - 1;
        const prevSeason = content?.seasonsList?.find(s => s.season_number === prevSeasonNum);
        nextSeason = prevSeasonNum;
        nextEpisode = prevSeason?.episode_count || 1;
      } else {
        return; // Start of series
      }
    }

    router.push(`/watch?id=${id}&type=${type}&season=${nextSeason}&episode=${nextEpisode}`);
  };

  const hasNext =
    type !== 'movie' &&
    ((seasonDetails && currentEpisode < seasonDetails.episodes.length) ||
      content?.seasonsList?.some(s => s.season_number > currentSeason) ||
      currentSeason < (content?.seasons || 0) ||
      !seasonDetails); // Assume next exists if details are loading

  const hasPrev = type !== 'movie' && (currentEpisode > 1 || currentSeason > 1);

  const cleanTmdbId = id!.replace('tmdb_', '');

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col group/sanctum">
      {/* The Director Bar Overlay */}
      <DirectorBar
        show={showUI}
        title={content.title}
        subTitle={type !== 'movie' ? `Season ${currentSeason} • Episode ${currentEpisode}` : undefined}
        type={type}
        season={currentSeason}
        episode={currentEpisode}
        onBack={handleBack}
        onNext={type !== 'movie' ? handleNext : undefined}
        onPrev={type !== 'movie' ? handlePrev : undefined}
        hasNext={hasNext}
        hasPrev={hasPrev}
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

      {(type === 'tv' || type === 'anime') && content?.seasonsList && (
        <EpisodeNavigator 
          show={showEpisodeNavigator}
          onClose={() => setShowEpisodeNavigator(false)}
          tmdbId={cleanTmdbId}
          type={type}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onSelect={(s, e) => {
            setShowEpisodeNavigator(false);
            router.push(`/watch?id=${id}&type=${type}&season=${s}&episode=${e}${activeSourceId ? `&provider=${activeSourceId}` : ''}`);
          }}
          seasons={content.seasonsList}
        />
      )}

      <LoungeOverlay show={showLounge} onClose={() => setShowLounge(false)} roomUrl={typeof window !== 'undefined' ? window.location.href : ''} />

      {/* Custom Cursor Overlay (Directorial Touch) */}
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
