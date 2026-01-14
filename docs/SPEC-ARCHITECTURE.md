# NovaStream Architecture (SPEC-ARCHITECTURE)

## 1. Modules & Responsibilities

### `sourceService`
- **Responsibilities**: Fetches streaming sources from Vidlink, Consumet, and internal mirrors. Handles URL expiration and provides health-checked stream pairs.
- **Contract**: Accepts content metadata; returns a list of `StreamSource`.

### `torrentEngine`
- **Responsibilities**: Manages the Electron lifecycle of WebTorrent streams. Handles magnet link resolution, sequential piece priority, and provides local HTTP server for VJS.
- **Contract**: Accepts magnet URI; emits stream progress and local streaming URL.

### `subtitleService`
- **Responsibilities**: Merges external `.vtt` endpoints with provider-supplied subtitles. Handles character encoding normalization.
- **Contract**: Returns `SubtitleTrack[]` for a given content ID.

### `animePlaybackService`
- **Responsibilities**: Orchestrates the anime-specific watch flow, including AniSkip integration and multi-season episode tracking.
- **Contract**: Extends base playback with skip-range logic.

### `moviePlaybackService`
- **Responsibilities**: High-fidelity resolution for movies, prioritizing high-bitrate torrents and A24-specific editorial sources.
- **Contract**: Returns movie-specific source hierarchy.

## 2. Shared Types

```typescript
export interface Content {
  id: string;
  tmdbId?: number;
  title: string;
  type: 'movie' | 'series' | 'anime';
  backdropUrl: string;
  posterUrl: string;
  genres: string[];
  year: number;
}

export interface Episode {
  id: string;
  contentId: string;
  season: number;
  episodeNumber: number;
  title: string;
  thumbnailUrl?: string;
}

export interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'torrent';
  provider: string;
  headers?: Record<string, string>;
}

export interface SubtitleTrack {
  lang: string;
  url: string;
  label: string;
}

export interface WatchProgress {
  contentId: string;
  episodeId?: string;
  position: number; // seconds
  duration: number;
  updatedAt: string;
}
```

## 3. Backend Route Map

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/content/trending` | No | Hybrid TMDB/Internal trending. |
| GET | `/api/content/:id/watch` | Yes | Unified watch metadata & skip ranges. |
| POST | `/api/user/progress` | Yes | Heartbeat for watch persistence. |
| GET | `/api/sources` | No | Backend source resolution proxy. |
