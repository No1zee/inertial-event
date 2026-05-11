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
  List,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Seekbar from './Seekbar';
import SeasonEpisodePill from './SeasonEpisodePill';
import { Season, SeasonEpisode } from '@/lib/types/content';


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
  type: 'movie' | 'tv' | 'anime' | 'local' | 'torrent' | 'series';
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
  onToggleTorrentFiles?: () => void;

  // UI Control
  hideBottom?: boolean;
  episodeDetails?: SeasonEpisode[];
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
  onToggleTorrentFiles,
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
      {/* --- BOTTOM CONTROLS & SELECTION --- */}
      <div
        className={cn(
          'mt-auto transition-transform duration-500 pointer-events-auto',
          show ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-linear-to-t from-black via-black/95 to-transparent pt-40 pb-10 px-8 flex flex-col gap-8">
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Zap size={18} className="text-emerald-500 fill-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      Stream Direct
                    </span>
                  </div>
                  {onToggleTorrentFiles && (
                    <button
                      onClick={onToggleTorrentFiles}
                      className="group flex items-center gap-2.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 shadow-xl"
                      aria-label="Select Torrent File"
                    >
                      <List size={18} className="text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest transition-colors">
                        Files
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {type === 'tv' && seasons && (
              <SeasonEpisodePill 
                currentSeason={currentSeasonNum}
                currentEpisode={currentEpisodeNum}
                seasons={seasons}
                episodeDetails={episodeDetails}
                onSeasonChange={(s) => onSeasonChange && onSeasonChange(s)}
                onEpisodeChange={(e) => onEpisodeChange && onEpisodeChange(e)}
              />
            )}
          </div>

          {!hideBottom && (
            <div className="space-y-6">
              <Seekbar currentTime={currentTime} duration={duration} onSeek={onSeek} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={onPrev}
                      disabled={!onPrev}
                      className={cn(
                        "p-3 rounded-xl transition-all duration-300",
                        onPrev 
                          ? "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-90" 
                          : "text-white/10 cursor-not-allowed"
                      )}
                      aria-label="Previous Episode"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    <button
                      onClick={onTogglePlay}
                      className="p-4 bg-white text-black rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                      aria-label={isPaused ? 'Play' : 'Pause'}
                    >
                      {isPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
                    </button>

                    <button
                      onClick={onNext}
                      disabled={!onNext}
                      className={cn(
                        "p-3 rounded-xl transition-all duration-300",
                        onNext 
                          ? "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-90" 
                          : "text-white/10 cursor-not-allowed"
                      )}
                      aria-label="Next Episode"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

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
                  {/* Source switching moved to PlaybackHeader for reduced UI density */}
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

