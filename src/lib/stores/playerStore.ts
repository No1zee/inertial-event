/**
 * Consolidated Player Store
 * Handles all media player state and controls
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Types
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  buffered: number;
  seekable: TimeRanges | null;
}

export interface AudioState {
  volume: number;
  muted: boolean;
  audioTrack: number | null;
}

export interface VideoState {
  quality: string;
  isFullscreen: boolean;
  pictureInPicture: boolean;
  subtitleTrack: number | null;
  subtitlesEnabled: boolean;
}

export interface UIState {
  showControls: boolean;
  showSettings: boolean;
  loading: boolean;
  error: string | null;
}

export interface PlayerMedia {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  poster?: string;
  season?: number;
  episode?: number;
  source?: string;
}

interface PlayerStore extends PlaybackState, AudioState, VideoState, UIState {
  // Current media
  currentMedia: PlayerMedia | null;
  
  // Actions - Playback
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  setBuffered: (buffered: number) => void;
  setSeekable: (seekable: TimeRanges | null) => void;
  
  // Actions - Audio
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setAudioTrack: (track: number | null) => void;
  toggleMute: () => void;
  
  // Actions - Video
  setQuality: (quality: string) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setPictureInPicture: (pip: boolean) => void;
  setSubtitleTrack: (track: number | null) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  toggleSubtitles: () => void;
  
  // Actions - UI
  setShowControls: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Media
  loadMedia: (media: PlayerMedia) => void;
  unloadMedia: () => void;
  
  // Actions - Reset
  resetPlayer: () => void;
  resetSession: () => void;
}

// Default values
const defaultPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  buffered: 0,
  seekable: null,
};

const defaultAudioState: AudioState = {
  volume: 1,
  muted: false,
  audioTrack: null,
};

const defaultVideoState: VideoState = {
  quality: 'auto',
  isFullscreen: false,
  pictureInPicture: false,
  subtitleTrack: null,
  subtitlesEnabled: true,
};

const defaultUIState: UIState = {
  showControls: true,
  showSettings: false,
  loading: false,
  error: null,
};

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        ...defaultPlaybackState,
        ...defaultAudioState,
        ...defaultVideoState,
        ...defaultUIState,
        currentMedia: null,

        // Playback actions
        setPlaying: (isPlaying) => {
          set({ isPlaying });
          // Auto-hide controls when playing
          if (isPlaying) {
            setTimeout(() => {
              const state = get();
              if (state.isPlaying) {
                set({ showControls: false });
              }
            }, 3000);
          }
        },
        
        setCurrentTime: (currentTime) => {
          const { duration } = get();
          set({ currentTime });
          
          // Update watch progress if media is loaded and duration is known
          if (get().currentMedia && duration > 0) {
            // This will trigger watch history update
            const progress = (currentTime / duration) * 100;
            if (progress > 5) { // Only update after 5% progress
              // Dispatch custom event for watch history tracking
              window.dispatchEvent(new CustomEvent('player:progress', {
                detail: { currentTime, duration, progress }
              }));
            }
          }
        },
        
        setDuration: (duration) => set({ duration }),
        setPlaybackRate: (playbackRate) => set({ playbackRate }),
        setBuffered: (buffered) => set({ buffered }),
        setSeekable: (seekable) => set({ seekable }),

        // Audio actions
        setVolume: (volume) => {
          // Unmute when volume is set above 0
          const muted = volume === 0 ? get().muted : false;
          set({ volume, muted });
        },
        
        setMuted: (muted) => set({ muted }),
        setAudioTrack: (audioTrack) => set({ audioTrack }),
        
        toggleMute: () => {
          set((state) => ({ muted: !state.muted }));
        },

        // Video actions
        setQuality: (quality) => set({ quality }),
        setFullscreen: (isFullscreen) => set({ isFullscreen }),
        setPictureInPicture: (pictureInPicture) => set({ pictureInPicture }),
        setSubtitleTrack: (subtitleTrack) => set({ subtitleTrack }),
        setSubtitlesEnabled: (subtitlesEnabled) => set({ subtitlesEnabled }),
        
        toggleSubtitles: () => {
          set((state) => ({ subtitlesEnabled: !state.subtitlesEnabled }));
        },

        // UI actions
        setShowControls: (showControls) => set({ showControls }),
        setShowSettings: (showSettings) => set({ showSettings }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // Media actions
        loadMedia: (media) => {
          set({ 
            currentMedia: media,
            error: null,
            loading: false,
            // Reset playback state for new media
            ...defaultPlaybackState,
          });
        },
        
        unloadMedia: () => {
          set({ 
            currentMedia: null,
            ...defaultPlaybackState,
            error: null,
            loading: false,
          });
        },

        // Reset actions
        resetPlayer: () => {
          set({
            ...defaultPlaybackState,
            ...defaultAudioState,
            ...defaultVideoState,
            ...defaultUIState,
            currentMedia: null,
          });
        },
        
        resetSession: () => {
          // Reset only session-based state (not persisted)
          set({
            ...defaultPlaybackState,
            ...defaultUIState,
            currentMedia: null,
            error: null,
            loading: false,
          });
        },
      }),
      {
        name: 'novastream-player',
        storage: createJSONStorage(() => sessionStorage), // Session-based persistence
        partialize: (state) => ({
          // Only persist preferences, not current state
          volume: state.volume,
          muted: state.muted,
          playbackRate: state.playbackRate,
          quality: state.quality,
          subtitlesEnabled: state.subtitlesEnabled,
          subtitleTrack: state.subtitleTrack,
          audioTrack: state.audioTrack,
        }),
      }
    )
  )
);

// Selectors for optimized subscriptions
export const usePlayerPlayback = () => 
  usePlayerStore((state) => ({
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    playbackRate: state.playbackRate,
    buffered: state.buffered,
  }), shallow);

export const usePlayerAudio = () => 
  usePlayerStore((state) => ({
    volume: state.volume,
    muted: state.muted,
    audioTrack: state.audioTrack,
  }), shallow);

export const usePlayerVideo = () => 
  usePlayerStore((state) => ({
    quality: state.quality,
    isFullscreen: state.isFullscreen,
    pictureInPicture: state.pictureInPicture,
    subtitleTrack: state.subtitleTrack,
    subtitlesEnabled: state.subtitlesEnabled,
  }), shallow);

export const usePlayerUI = () => 
  usePlayerStore((state) => ({
    showControls: state.showControls,
    showSettings: state.showSettings,
    loading: state.loading,
    error: state.error,
  }), shallow);

export const useCurrentMedia = () => 
  usePlayerStore((state) => state.currentMedia);

// Action selectors for cleaner imports
export const usePlayerActions = () => 
  usePlayerStore((state) => ({
    setPlaying: state.setPlaying,
    setCurrentTime: state.setCurrentTime,
    setVolume: state.setVolume,
    setMuted: state.setMuted,
    toggleMute: state.toggleMute,
    setQuality: state.setQuality,
    setFullscreen: state.setFullscreen,
    setShowControls: state.setShowControls,
    loadMedia: state.loadMedia,
    unloadMedia: state.unloadMedia,
    resetPlayer: state.resetPlayer,
  }));

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Enable debug logging for state changes
  usePlayerStore.subscribe(
    (state) => state,
    (state, prevState) => {
      console.log('🎬 Player Store changed:', {
        from: prevState,
        to: state,
        timestamp: new Date().toISOString(),
      });
    },
    { equalityFn: shallow }
  );
}