'use client';

import { Play, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Content } from '@/lib/types/content';
import { contentApi } from '@/lib/api/content';
import { useLocalDataStore, useLibraryActions } from '@/lib/stores/localDataStore';
import { useQueryClient } from '@tanstack/react-query';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface CinematicHeroProps {
  item: Content;
}

export function CinematicHero({ item }: CinematicHeroProps) {
  const queryClient = useQueryClient();
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryActions();
  const getResumeData = useLocalDataStore(state => state.getResumeData);

  const inLibrary = isInLibrary(String(item.id));
  const contentType = item.type || (item.seasonsList && item.seasonsList.length > 0 ? 'tv' : 'movie');

  if (!item) return null;

  const toggleLibrary = () => {
    if (inLibrary) {
      removeFromLibrary(String(item.id));
    } else {
      addToLibrary({
        contentId: String(item.id),
        type: contentType as 'movie' | 'tv' | 'anime' | 'series',
        title: item.title,
        poster: item.poster ?? undefined,
        backdrop: item.backdrop ?? undefined,
        favorite: false,
      });
    }
  };

  const resumeData = getResumeData(String(item.id));
  let playHref = `/watch?id=${item.id}&type=${contentType}`;

  if (resumeData) {
    const { season, episode, currentTime, completed } = resumeData;
    if (!completed) {
      playHref = `/watch?id=${item.id}&type=${contentType}${season ? `&season=${season}` : ''}${episode ? `&episode=${episode}` : ''}&progress=${currentTime}`;
    } else {
      playHref = `/watch?id=${item.id}&type=${contentType}&season=${season ?? 1}&episode=${(episode ?? 1) + 1}`;
    }
  }

  return (
    <section className="relative h-[65vh] md:h-[80vh] w-full overflow-hidden group">
      {/* Background Layer */}
      <div className="absolute inset-0">
        <OptimizedImage
          src={item.backdrop || item.poster}
          alt={item.title}
          fill
          priority
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform [transition-duration:20000ms] ease-linear group-hover:scale-105"
          sizes="100vw"
        />

        {/* Gradients */}
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#141414] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 to-transparent h-32" />
      </div>

      {/* Content - Left Aligned "Billboard" */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-16 pt-20">
        <div className="max-w-2xl space-y-6 animate-in slide-in-from-left duration-1000 fade-in">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
            {item.title}
          </h1>

          {/* Metadata Line */}
          <div className="flex items-center gap-3 text-sm md:text-base font-semibold text-zinc-300">
            <span className="text-red-600">{Math.round((item.rating || 0) * 10)}% Match</span>
            <span>{item.releaseDate?.substring(0, 4)}</span>
            <span className="border border-white/30 px-1.5 rounded text-xs">{item.isAdult ? '18+' : 'PG-13'}</span>
            {item.type === 'tv' && <span>Series</span>}
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-zinc-200 line-clamp-3 drop-shadow-lg max-w-xl font-medium">
            {item.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Link
              href={playHref}
              onMouseEnter={() => {
                const apiType = contentType === 'anime' ? 'tv' : contentType;
                queryClient.prefetchQuery({
                  queryKey: ['content', 'details', String(item.id), contentType],
                  queryFn: () => contentApi.getDetails(item.id, apiType as 'movie' | 'tv'),
                  staleTime: 10 * 60 * 1000,
                });
              }}
            >
              <Button
                size="lg"
                className="h-12 md:h-14 px-8 text-lg font-bold bg-white text-black hover:bg-white/90 rounded-md transition-transform hover:scale-105 active:scale-95"
              >
                <Play size={24} fill="currentColor" className="mr-2" />
                {resumeData && !resumeData.completed ? 'Resume' : 'Play'}
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="lg"
              aria-label={inLibrary ? 'Remove from my list' : 'Add to my list'}
              className="h-12 md:h-14 px-8 text-lg font-bold bg-white/20 text-white hover:bg-white/30 backdrop-blur-md rounded-md transition-transform hover:scale-105 active:scale-95 border-none"
              onClick={toggleLibrary}
            >
              {inLibrary ? <Check size={24} className="mr-2" /> : <Plus size={24} className="mr-2" />}
              My List
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

