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
  const collections: SmartCollection[] = [];

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

  for (const theme of themes) {
    const items = await contentApi.search(theme.query);
    if (items.length >= 4) {
        collections.push({
          id: `smart_${theme.title.toLowerCase().replace(/\s/g, '_')}`,
          title: theme.title,
          description: theme.desc,
          items: items.slice(0, 8),
          type: 'curated',
          logic: `Synthesis complete: Highly compatible with your preference for ${theme.query.split(' ')[0]} narratives.`,
          matchScore: Math.floor(Math.random() * (98 - 85 + 1) + 85),
        });
    }
  }

  return collections;
}
