export interface LinearChannel {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  genres: number[]; // TMDB genre IDs
  contentTypes: ('movie' | 'tv')[];
}

export const LINEAR_CHANNELS: LinearChannel[] = [
  {
    id: 'ch-action',
    name: 'Action Pulse',
    slug: 'action-pulse',
    description: 'High-octane adrenaline, 24/7.',
    color: '#ff4b2b',
    genres: [28, 12], // Action, Adventure
    contentTypes: ['movie'],
  },
  {
    id: 'ch-african',
    name: 'African Cinema',
    slug: 'african-cinema',
    description: 'Curated masterpieces from the continent.',
    color: '#ffa502',
    genres: [18], // Drama (TMDB doesn't have an African genre, we'll filter by country in the fetcher)
    contentTypes: ['movie', 'tv'],
  },
  {
    id: 'ch-anime',
    name: 'Anime Edge',
    slug: 'anime-edge',
    description: 'The pulse of Japanese animation.',
    color: '#70a1ff',
    genres: [16], // Animation
    contentTypes: ['tv'],
  },
  {
    id: 'ch-mystery',
    name: 'Mystery Midnight',
    slug: 'mystery-midnight',
    description: 'Deep shadows and unsolved enigmas.',
    color: '#2f3542',
    genres: [9648, 53], // Mystery, Thriller
    contentTypes: ['movie'],
  },
  {
    id: 'ch-archives',
    name: 'The Archives',
    slug: 'the-archives',
    description: 'Timeless classics that defined cinema.',
    color: '#ced6e0',
    genres: [18, 36], // Drama, History
    contentTypes: ['movie'],
  },
];
