import { createWithEqualityFn } from 'zustand/traditional';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

export type PlayerQuality = 'auto' | '4k' | '1080p' | '720p' | '480p' | '360p';
export type BufferState = 'none' | 'loading' | 'buffered' | 'stalled';

interface StreamInfo {
  url: string;
  quality: PlayerQuality;
  provider: string;
  latency: number;
}

interface BufferStats {
  state: BufferState;
  bufferedDuration: number;
  bandwidth: number;
  quality: PlayerQuality;
  timeToBuffer: number;
}

interface TransitionConfig {
  autoAdvance: boolean;
  countdownSeconds: number;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
}

interface PlayerState {
  currentContentId: string | null;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPictureInPicture: boolean;

  bufferStats: BufferStats;
  streamInfo: StreamInfo | null;
  transitionConfig: TransitionConfig;

  autoPlay: boolean;
  playbackSpeed: number;
  skipIntro: boolean;
  skipCredits: boolean;
  introEndTime: number;
  creditsStartTime: number;

  preloadedNextEpisode: boolean;
  nextEpisodePreloadStarted: number | null;

  setPlayerState: (state: Partial<PlayerState>) => void;
  setBufferStats: (stats: Partial<BufferStats>) => void;
  setStreamInfo: (info: StreamInfo | null) => void;
  setTransitionConfig: (config: Partial<TransitionConfig>) => void;
  startPreloadNextEpisode: () => void;
  completePreloadNextEpisode: () => void;
  resetPlayer: () => void;
}

const defaultBufferStats: BufferStats = {
  state: 'buffered',
  bufferedDuration: 0,
  bandwidth: 0,
  quality: 'auto',
  timeToBuffer: 0,
};

const defaultTransitionConfig: TransitionConfig = {
  autoAdvance: true,
  countdownSeconds: 5,
  crossfadeEnabled: true,
  crossfadeDuration: 2000,
};

export const usePlayerStore = createWithEqualityFn<PlayerState>()(
  subscribeWithSelector(set => ({
    currentContentId: null,
    currentTime: 0,
    duration: 0,
    isBuffering: false,
    isPaused: true,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isPictureInPicture: false,

    bufferStats: defaultBufferStats,
    streamInfo: null,
    transitionConfig: defaultTransitionConfig,

    autoPlay: true,
    playbackSpeed: 1,
    skipIntro: true,
    skipCredits: false,
    introEndTime: 85,
    creditsStartTime: 0,

    preloadedNextEpisode: false,
    nextEpisodePreloadStarted: null,

    setPlayerState: newState => set(state => ({ ...state, ...newState })),

    setBufferStats: stats =>
      set(state => ({
        bufferStats: { ...state.bufferStats, ...stats },
      })),

    setStreamInfo: info => set({ streamInfo: info }),

    setTransitionConfig: config =>
      set(state => ({
        transitionConfig: { ...state.transitionConfig, ...config },
      })),

    startPreloadNextEpisode: () =>
      set({
        preloadedNextEpisode: false,
        nextEpisodePreloadStarted: Date.now(),
      }),

    completePreloadNextEpisode: () =>
      set({
        preloadedNextEpisode: true,
        nextEpisodePreloadStarted: null,
      }),

    resetPlayer: () =>
      set({
        currentContentId: null,
        currentTime: 0,
        duration: 0,
        isBuffering: false,
        isPaused: true,
        volume: 1,
        isMuted: false,
        isFullscreen: false,
        isPictureInPicture: false,
        bufferStats: defaultBufferStats,
        streamInfo: null,
        preloadedNextEpisode: false,
        nextEpisodePreloadStarted: null,
      }),
  }))
);

export const useBufferStats = () => usePlayerStore(state => state.bufferStats, shallow);
export const useStreamInfo = () => usePlayerStore(state => state.streamInfo, shallow);
export const useTransitionConfig = () => usePlayerStore(state => state.transitionConfig, shallow);
export const useIsBuffering = () => usePlayerStore(state => state.isBuffering, shallow);
export const usePlaybackState = () =>
  usePlayerStore(
    state => ({
      currentTime: state.currentTime,
      duration: state.duration,
      isPaused: state.isPaused,
      isBuffering: state.isBuffering,
    }),
    shallow
  );
