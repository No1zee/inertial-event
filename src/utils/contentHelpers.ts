import { Content, MinifiedContent } from '@/lib/types/content';

/**
 * Strips a Content object down to essential fields for storage.
 * Removes large arrays like seasonsList, cast, recommendations, etc.
 */
export const minifyContent = (content: Content): MinifiedContent => {
  return {
    id: String(content.id),
    title: content.title,
    type: content.type,
    poster: content.poster,
    backdrop: content.backdrop,
    // Keep progress data
    progress: content.progress,
    duration: content.duration,
    lastWatched: content.lastWatched || Date.now(),
    season: content.season,
    episode: content.episode,
    // Keep ratings if available as they are small
    rating: content.rating,
    // Explicitly exclude: seasonsList, cast, recommendations, similar
  };
};
