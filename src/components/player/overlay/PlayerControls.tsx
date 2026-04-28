import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  HeartHandshake,
  Heart,
  Download,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PictureInPicture,
  Zap,
  Maximize,
  Settings,
  Cast,
  Shuffle,
  Search,
  Info,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Seekbar from './Seekbar';
import { Season } from '@/lib/types/content';

interface EpisodeDetail {
  episode_number: number;
  air_date?: string;
  name?: string;
  overview?: string;
  still_path?: string;
}

// Local Helper
const _formatTimeLocal = (seconds: number) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface PlayerControlsProps {
  show: boolean;
  title: string;
  subTitle?: string;
  backUrl?: string; // Explicit back path override
  currentTime: number;
  duration: number;
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  isSaved: boolean;
  downloadUrl: string | null;

  // Series Specific
  type: 'movie' | 'tv' | 'anime' | 'local' | 'torrent';
  isTorrent?: boolean;
  season: string;
  episode: string;
  seasons?: Season[];

  // Actions
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleLibrary: () => void;
  onDownload: () => void;
  onToggleSettings: () => void;
  onTogglePiP: () => void;
  onToggleCast: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeasonChange?: (s: number) => void;
  onEpisodeChange?: (e: string) => void;
  onToggleFullscreen: () => void;
  onToggleLounge: () => void;
  onToggleSource?: () => void;
  onToggleXRay?: () => void;
  onToggleDialogueSearch: () => void;

  // UI Control
  hideBottom?: boolean;
  episodeDetails?: EpisodeDetail[];
}

const PlayerControls = memo(function PlayerControls({
  show,
  title,
  subTitle,
  backUrl,
  currentTime,
  duration,
  isPaused,
  volume,
  isMuted,
  isSaved,
  downloadUrl,
  type,
  isTorrent,
  season,
  episode,
  seasons,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleLibrary,
  onDownload,
  onToggleSettings,
  onTogglePiP,
  onToggleCast,
  onNext,
  onPrev,
  onSeasonChange,
  onEpisodeChange,
  onToggleFullscreen,
  onToggleLounge,
  onToggleSource,
  onToggleXRay,
  onToggleDialogueSearch,
  hideBottom,
  episodeDetails,
}: PlayerControlsProps) {
  const router = useRouter();
  const currentSeasonNum = parseInt(season);
  const currentEpisodeNum = parseInt(episode);

  const _handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      // Unconditional back logic: Try history first, fallback to home
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }
  };

  // Safe Electron Check
  const isElectron =
    typeof window !== 'undefined' &&
    ((window as typeof window & { electron?: unknown }).electron ||
      (window as typeof window & { process?: { versions?: { electron?: string } } }).process?.versions?.electron);

  return (
    <div
      className={cn(
        'absolute inset-0 z-[100] flex flex-col justify-between transition-opacity duration-300 pointer-events-none',
        show ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* --- CINEMATIC HEADER (UNCONDITIONAL BACK & NAV) --- */}
      <div
        className={cn(
          'absolute top-0 inset-x-0 p-8 pt-12 bg-gradient-to-b from-black via-black/80 to-transparent transition-all duration-500 pointer-events-auto flex items-start justify-between z-50',
          show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <div className="flex items-center gap-8">
          {/* Unconditional Back Button */}
          <button
            onClick={_handleBack}
            className="group flex items-center gap-3 p-2 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
            aria-label="Go Back"
          >
            <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary transition-colors shadow-2xl">
              <ChevronLeft size={28} className="text-white group-hover:text-black" strokeWidth={3} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 group-hover:text-white transition-colors">
                Return
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-white/20">Exit Sanctuary</span>
            </div>
          </button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-white font-black text-3xl uppercase tracking-tighter drop-shadow-2xl line-clamp-1">
                {title}
              </h1>
              {isElectron && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Aegis Native</span>
                </div>
              )}
            </div>
            {subTitle && (
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-[2px] bg-primary rounded-full animate-pulse" />
                <p className="text-white/60 text-xs uppercase tracking-[0.3em] font-bold">{subTitle}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Navigation Buttons (Always Available) */}
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
            <button
              onClick={onPrev}
              className={cn(
                'p-3 rounded-xl transition-all active:scale-90 flex items-center gap-2',
                onPrev ? 'bg-white/5 text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed opacity-30'
              )}
              disabled={!onPrev}
              aria-label="Play previous episode"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </button>

            <div className="w-[1px] h-8 bg-white/10" />

            <button
              onClick={onNext}
              className={cn(
                'px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3',
                onNext
                  ? 'bg-primary text-black shadow-[0_0_40px_rgba(192,57,43,0.4)] hover:scale-105'
                  : 'bg-white/5 text-white/20 cursor-not-allowed opacity-30'
              )}
              disabled={!onNext}
              aria-label="Play next episode"
            >
              Next Episode <ChevronRight size={18} strokeWidth={4} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-0 z-40 flex flex-col bg-black/10 transition-opacity duration-500 pointer-events-none',
          show ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex-1 flex flex-col justify-between py-12 px-12">
          {/* Header Spacer */}
          <div className="h-40" />

          {/* Resume Progress Hint */}
          <div
            className={cn(
              'mt-auto transition-all duration-700 delay-300',
              show ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
            )}
          >
            {currentTime > 0 && currentTime < 30 && (
              <div className="flex items-center gap-4 p-6 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] self-start pointer-events-auto shadow-2xl">
                <div className="p-4 bg-primary/20 rounded-full shadow-[0_0_20px_rgba(192,57,43,0.2)]">
                  <Play size={24} className="text-primary fill-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-black text-primary">
                    Resuming Playback
                  </span>
                  <span className="text-white/40 text-[9px] font-medium uppercase tracking-[0.2em]">
                    Sanctuary restored to your last position
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM CONTROLS & SELECTION --- */}
      <div
        className={cn(
          'mt-auto transition-transform duration-500 pointer-events-auto',
          show ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-40 pb-10 px-8 flex flex-col gap-8">
          {/* Metadata & Quick Selection Row */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onToggleLibrary}
                aria-label={isSaved ? 'Remove from Library' : 'Add to Library'}
                className={cn(
                  'p-3.5 rounded-2xl backdrop-blur-md transition-all shadow-xl',
                  isSaved ? 'bg-primary text-black' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                {isSaved ? <HeartHandshake size={22} fill="currentColor" /> : <Heart size={22} />}
              </button>
              <button
                disabled={!downloadUrl}
                onClick={onDownload}
                className={cn(
                  'p-3.5 rounded-2xl backdrop-blur-md transition-all shadow-xl',
                  downloadUrl
                    ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    : 'bg-white/5 text-white/10 cursor-not-allowed'
                )}
                aria-label={downloadUrl ? 'Download this stream' : 'Download unavailable'}
              >
                <Download size={22} />
              </button>
              {(type === 'torrent' || isTorrent) && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Zap size={18} className="text-emerald-500 fill-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    Stream Direct
                  </span>
                </div>
              )}
            </div>

            {type === 'tv' && seasons && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
                <select
                  aria-label="Select Season"
                  className="bg-transparent text-white font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-white/5 px-4 py-3 appearance-none text-center min-w-[5rem]"
                  value={currentSeasonNum}
                  onChange={e => onSeasonChange && onSeasonChange(Number(e.target.value))}
                >
                  {seasons
                    .filter(s => s.season_number > 0)
                    .map(s => (
                      <option key={s.id} value={s.season_number} className="bg-zinc-950">
                        Season {s.season_number}
                      </option>
                    ))}
                </select>
                <div className="w-[1px] h-6 bg-white/10" />
                <select
                  aria-label="Select Episode"
                  className="bg-transparent text-white font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-white/5 px-4 py-3 appearance-none text-center min-w-[5rem]"
                  value={currentEpisodeNum}
                  onChange={e => onEpisodeChange && onEpisodeChange(e.target.value)}
                >
                  {(() => {
                    const seasonData = seasons.find(s => s.season_number === currentSeasonNum);
                    const count = seasonData?.episode_count || 1;
                    return Array.from({ length: count }, (_, i) => i + 1).map(epNum => {
                      const epDetail = episodeDetails?.find(ed => ed.episode_number === epNum);
                      const airDate = epDetail?.air_date ? new Date(epDetail.air_date) : null;
                      const isAired = airDate ? airDate <= new Date() : true;
                      return (
                        <option
                          key={epNum}
                          value={epNum}
                          className={cn('bg-zinc-950', isAired ? 'text-white' : 'text-zinc-600')}
                          disabled={!isAired}
                        >
                          Episode {epNum}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>
            )}
          </div>

          {!hideBottom && (
            <div className="space-y-6">
              <Seekbar currentTime={currentTime} duration={duration} onSeek={onSeek} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button
                    onClick={onTogglePlay}
                    className="p-4 bg-white text-black rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-2xl"
                    aria-label={isPaused ? 'Play' : 'Pause'}
                  >
                    {isPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
                  </button>

                  <div className="flex items-center gap-4 group/vol">
                    <button 
                      onClick={onToggleMute} 
                      className="text-white/60 hover:text-white transition-colors"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      data-testid="volume-button"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <input
                      type="range"
                      title="Volume"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={e => onVolumeChange(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full shadow-lg"
                    />
                  </div>

                  <div className="flex items-center gap-3 ml-4 text-white/40 font-mono text-sm tracking-tighter">
                    <span className="text-white/80">{_formatTimeLocal(currentTime)}</span>
                    <span className="opacity-20">/</span>
                    <span>{_formatTimeLocal(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={onToggleDialogueSearch}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="Search Dialogue and Semantic Moments"
                  >
                    <Search size={22} />
                  </button>
                  <button
                    onClick={onToggleXRay}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="View Director's Cut X-Ray Context"
                  >
                    <Info size={22} />
                  </button>
                  {onToggleSource && (
                    <button
                      onClick={onToggleSource}
                      className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      aria-label="Switch Content Source"
                    >
                      <Shuffle size={22} />
                    </button>
                  )}
                  <button
                    onClick={onToggleLounge}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="Initialize Cinematic Lounge Watch Party"
                  >
                    <Users size={22} />
                  </button>
                  <button
                    onClick={onToggleSettings}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="Player Settings"
                  >
                    <Settings size={22} />
                  </button>
                  <button
                    onClick={onToggleCast}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="Cast to External Device"
                  >
                    <Cast size={22} />
                  </button>
                  <button
                    onClick={onTogglePiP}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="Enter Picture-in-Picture Mode"
                  >
                    <PictureInPicture size={22} />
                  </button>
                  <button
                    onClick={onToggleFullscreen}
                    className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    aria-label="Toggle Fullscreen"
                    data-testid="fullscreen-button"
                  >
                    <Maximize size={22} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PlayerControls;
