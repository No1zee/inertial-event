export interface PlayerState {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
    playbackRate: number;
    quality: 'auto' | 'SD' | '720p' | '1080p' | '4K';
    isFullscreen: boolean;
    isPictureInPicture: boolean;
    subtitles: {
        enabled: boolean;
        language?: string;
        fontSize: 'small' | 'medium' | 'large';
        backgroundColor: string;
    };
    bufferedPercentage: number;
    isBuffering: boolean;
    error?: PlayerError;
}

export interface PlayerError {
    code: string;
    message: string;
    fatal: boolean;
    timestamp: Date;
}

export interface PlayerConfig {
    autoplay: boolean;
    loop: boolean;
    controls: boolean;
    width: number | string;
    height: number | string;
    poster?: string;
    preload: 'none' | 'metadata' | 'auto';
    controlsList: string[];
    keyboardShortcuts: boolean;
}

export interface PlaybackProgress {
    contentId: string;
    episode?: number;
    season?: number;
    currentTime: number;
    duration: number;
    watchedPercentage: number;
    lastWatched: Date;
}

export interface QualityLevel {
    name: string;
    bitrate: number;
    resolution: string;
    framerate?: number;
}
