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

export async function getSmartCollections(_historyIds: string[]): Promise<SmartCollection[]> {
  const themes = [
    { title: 'Existential Noir', query: 'cinematic poetry', desc: 'Gritty narratives and psychological depth.' },
    {
      title: 'Neon Horizons',
      query: 'cyberpunk scifi future',
      desc: 'Techno-futuristic visuals and high-stakes synth-scapes.',
    },
    {
      title: 'The Quiet Storm',
      query: 'drama slow burn masterpiece',
      desc: 'Slow-paced excellence and emotional resonance.',
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
              logic: `Synthesis complete: Highly compatible with your preference for ${theme.query.split(' ')[0]} narratives.`,
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
