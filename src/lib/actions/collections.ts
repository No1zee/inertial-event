'use server';

import { Content } from '@/lib/types/content';
import { searchContentServer } from './content';

export interface SmartCollection {
  id: string;
  title: string;
  description: string;
  items: Content[];
  type: 'curated' | 'mood' | 'genre';
}

export async function getSmartCollectionsServer(_historyIds: string[]): Promise<SmartCollection[]> {
  // In a real scenario, this would use an LLM or complex recommender
  // Here we simulate it by picking interesting themes based on "vibe"

  const collections: SmartCollection[] = [];

  // Default mood-based collections if no history
  const themes = [
    { title: 'Existential Noir', query: 'detective thriller noir', desc: 'Gritty narratives and psychological depth.' },
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
    const items = await searchContentServer(theme.query);
    if (items.length >= 4) {
      collections.push({
        id: `smart_${theme.title.toLowerCase().replace(/\s/g, '_')}`,
        title: theme.title,
        description: theme.desc,
        items: items.slice(0, 8),
        type: 'curated',
      });
    }
  }

  return collections;
}
