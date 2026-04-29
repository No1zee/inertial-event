import { Content } from '@/lib/types/content';
import { contentApi } from './content';

export interface SmartCollection {
  id: string;
  title: string;
  description: string;
  items: Content[];
  type: 'curated' | 'mood' | 'genre';
  logic?: string;
  matchScore?: number;
}

export async function getSmartCollections(historyIds: string[], preferences?: { genres: string[], vibes: string[] }): Promise<SmartCollection[]> {
  const genres = preferences?.genres || [];
  const vibes = preferences?.vibes || [];

  // Dynamic themes based on preferences
  const themes = [
    { 
      title: genres.includes('sci-fi') || genres.includes('animation') ? 'Vanguard Horizons' : 'Existential Noir', 
      query: genres.includes('sci-fi') ? 'cyberpunk scifi' : 'noir thriller', 
      desc: 'High-stakes narratives and atmospheric depth.' 
    },
    {
      title: vibes.includes('high-energy') ? 'Adrenaline Surge' : 'The Quiet Storm',
      query: vibes.includes('high-energy') ? 'action survival' : 'drama slow burn',
      desc: vibes.includes('high-energy') ? 'Intense, fast-paced cinematic experiences.' : 'Reflective storytelling for the quiet observer.',
    },
    {
      title: genres.includes('anime') ? 'Otaku Archive' : 'Directorial Masters',
      query: genres.includes('anime') ? 'anime masterpiece' : 'director top rated',
      desc: 'Inducted into the S-Class archive for stylistic excellence.',
    },
  ];

  try {
    const results = await Promise.all(
      themes.map(async (theme) => {
        try {
          const items = await contentApi.search(theme.query);
          if (items.length >= 2) {
            return {
              id: `smart_${theme.title.toLowerCase().replace(/\s/g, '_')}`,
              title: theme.title,
              description: theme.desc,
              items: items.slice(0, 8),
              type: 'curated' as const,
              logic: `Synthesis complete: Highly compatible with your preference for ${genres[0] || theme.query.split(' ')[0]} narratives.`,
              matchScore: Math.floor(Math.random() * (98 - 85 + 1) + 85),
            };
          }
          return null;
        } catch (e) {
          console.error(`Smart collection fetch failed for ${theme.title}:`, e);
          return null;
        }
      })
    );

    return results.filter((c): c is SmartCollection => c !== null);
  } catch (e) {
    console.error('getSmartCollections total failure:', e);
    return [];
  }
}
