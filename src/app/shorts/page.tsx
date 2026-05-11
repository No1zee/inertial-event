'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';
import { ChevronLeft, Volume2, VolumeX, Bookmark, Share2, Play, Info, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

import { DiscoveryTrailerPlayer } from '@/components/shorts/DiscoveryTrailerPlayer';

function ShortsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const { data: shorts, isLoading } = useQuery<Content[]>({
    queryKey: ['shorts_feed'],
    queryFn: () => contentApi.getShortsFeed(1),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (shorts && initialId) {
      const index = shorts.findIndex(s => s.id === initialId);
      if (index !== -1) {
        setActiveIndex(index);
        // Scroll to that index
        const container = scrollRef.current;
        if (container) {
          container.scrollTo({ top: index * window.innerHeight, behavior: 'instant' });
        }
      }
    }
  }, [shorts, initialId]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollPos = scrollRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollPos / windowHeight);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  if (isLoading || !shorts) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-t-2 border-amber-500 animate-spin" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] animate-pulse">
            Tuning into the pulse...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[1000] overflow-hidden">
      {/* Header Overlays */}
      <div className="absolute top-0 left-0 right-0 z-50 p-8 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 transition-all active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex items-center gap-4 pointer-events-auto">
           <button 
            onClick={() => setMuted(!muted)}
            className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Scroll Feed */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {shorts.map((item, index) => (
          <ShortsSlide 
            key={item.id} 
            item={item} 
            isActive={activeIndex === index}
            muted={muted}
          />
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        {shorts.slice(0, 10).map((_, idx) => (
          <div 
            key={idx}
            className={cn(
              "w-1 transition-all duration-500 rounded-full",
              activeIndex === idx ? "h-8 bg-amber-500" : "h-2 bg-white/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default function ShortsPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-t-2 border-amber-500 animate-spin" />
      </div>
    }>
      <ShortsContent />
    </Suspense>
  );
}

const ShortsSlide = ({ item, isActive, muted }: { item: Content; isActive: boolean; muted: boolean }) => {
  const router = useRouter();
  const [trailerReady, setTrailerReady] = useState(false);
  
  return (
    <div className="h-full w-full snap-start relative bg-zinc-950 flex items-center justify-center">
      {/* Background Visual (Fallback to Image if video fails/isn't available) */}
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src={item.poster || item.backdrop || ''}
          alt={item.title}
          fill
          className={cn(
            "object-cover transition-all duration-1000",
            isActive ? "scale-105 opacity-40 blur-sm" : "scale-100 opacity-20 blur-xl"
          )}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/60" />
      </div>

      {/* Video / Trailer Area */}
      <div className="relative z-10 w-full max-w-[500px] aspect-9/16 bg-black shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-[2rem] border border-white/10">
        <div className="w-full h-full relative">
          {item.trailer ? (
            <DiscoveryTrailerPlayer 
              trailerKey={item.trailer}
              isActive={isActive}
              muted={muted}
              onReady={() => setTrailerReady(true)}
            />
          ) : (
             <OptimizedImage
                src={item.backdrop || item.poster || ''}
                alt={item.title}
                fill
                className="object-cover animate-slow-zoom"
              />
          )}

          {/* Loading / Fallback UI */}
          {(!trailerReady || !item.trailer) && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 backdrop-blur-md flex items-center justify-center border border-amber-500/40 text-amber-500">
                  <Play size={32} fill="currentColor" className="ml-1 animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] opacity-80">
                  {item.trailer ? "Tuning Pulse..." : "Preview Unavailable"}
                </span>
              </div>
            </div>
          )}

          {/* Interaction Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-10 bg-linear-to-t from-black via-black/80 to-transparent z-20">
             <div className="flex items-end justify-between gap-6">
                <div className="flex-1">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-3 block">
                        Trending Now
                    </span>
                    <PretextHeadline
                        text={item.title}
                        fontSize={32}
                        fontWeight={900}
                        letterSpacing="-0.04em"
                        className="text-white uppercase mb-4 leading-none"
                    />
                    <p className="text-[12px] text-zinc-400 line-clamp-2 leading-relaxed mb-8">
                        {item.description}
                    </p>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push(`/watch?id=${item.id}&type=${item.type}`)}
                            className="h-14 px-8 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-[0.1em] flex items-center gap-3 hover:scale-105 transition-all active:scale-95 pointer-events-auto"
                        >
                            <Play size={16} fill="currentColor" />
                            Watch Now
                        </button>
                        <button className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <ActionButton icon={Bookmark} label="Save" />
                    <ActionButton icon={Share2} label="Share" />
                    <ActionButton icon={Info} label="More" onClick={() => router.push(`/browse/${item.type}/${item.id}`)} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center gap-2 group pointer-events-auto"
    >
        <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white group-hover:bg-white/20 transition-all">
            <Icon size={24} />
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
    </button>
);

