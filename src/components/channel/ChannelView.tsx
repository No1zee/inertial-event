"use client";

import { useEffect, useState, useRef } from 'react';
import { useProviderContent, useProviderGenre, useProviderClassics, useProviderUnderrated } from '@/hooks/queries/useContent';
import { getProviderById } from '@/lib/constants/providers';
import { Hero } from '@/components/content/Hero';
import { CinematicHero } from './CinematicHero';
import { ContentRail } from '@/components/content/ContentRail';
import { useInView } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Content } from '@/lib/types/content';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store/uiStore';
import { DisneyBrandRail } from './DisneyBrandRail';

export default function ChannelView({ id }: { id: string }) {
    const provider = getProviderById(id);
    const router = useRouter();

    const { getChannelState, setChannelState } = useUIStore();
    
    // Initialize state from store
    const savedState = provider ? getChannelState(provider.id) : { visibleCount: 2, scrollPos: 0 };
    const [visibleCount, setVisibleCount] = useState(savedState.visibleCount);
    
    // Persist visibleCount
    useEffect(() => {
        if (provider) {
            setChannelState(provider.id, { visibleCount });
        }
    }, [visibleCount, provider, setChannelState]);

    // Scroll Persistence


    const bottomRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(bottomRef);

    useEffect(() => {
        if (!provider) {
            router.push('/');
        }
    }, [provider, router]);

    // Data Fetching
    const { data: trending, isLoading: trendingLoading } = useProviderContent(id, 'movie', 'popularity.desc');
    const { data: newMovies } = useProviderContent(id, 'movie', 'primary_release_date.desc');
    const { data: newTV } = useProviderContent(id, 'tv', 'first_air_date.desc');
    const { data: topRated } = useProviderContent(id, 'movie', 'vote_average.desc');
    
    // Genre Rails
    const { data: actionMovies } = useProviderGenre(id, 28, 'movie');
    const { data: comedyMovies } = useProviderGenre(id, 35, 'movie');
    const { data: sciFiMovies } = useProviderGenre(id, 878, 'movie');
    const { data: dramaTV } = useProviderGenre(id, 18, 'tv');
    const { data: horrorMovies } = useProviderGenre(id, 27, 'movie');
    const { data: documentaries } = useProviderGenre(id, 99, 'movie');
    const { data: familyMovies } = useProviderGenre(id, 10751, 'movie');
    const { data: animation } = useProviderGenre(id, 16, 'movie');
    
    // Expanded Rails
    const { data: classics } = useProviderClassics(id, 'movie');
    const { data: underrated } = useProviderUnderrated(id, 'movie');
    // We already have newTV, let's add Popular TV specifically
    const { data: popularTV } = useProviderContent(id, 'tv', 'popularity.desc');


    // Derived Hero Items
    const [heroItems, setHeroItems] = useState<Content[]>([]);

    // Scroll Persistence: Restore
    useEffect(() => {
        if (!provider || trendingLoading) return;
        
        // Small timeout to allow Layout/DOM to stabilize after data load
        const t = setTimeout(() => {
            const state = getChannelState(provider.id);
            if (state.scrollPos > 0) {
                window.scrollTo({ top: state.scrollPos, behavior: 'instant' });
            }
        }, 150);

        return () => clearTimeout(t);
    }, [provider, trendingLoading, getChannelState]);

    // Scroll Persistence: Save on Unmount/Change
    useEffect(() => {
        if (!provider) return;
        
        return () => {
            setChannelState(provider.id, { scrollPos: window.scrollY });
        };
    }, [provider, setChannelState]);

    
    useEffect(() => {
        if (trending && trending.length > 0) {
            setHeroItems(trending.slice(0, 5));
        }
    }, [trending]);

    useEffect(() => {
        if (isInView && visibleCount < 12) {
            setTimeout(() => setVisibleCount(prev => prev + 1), 500);
        }
    }, [isInView]);

    if (!provider) return null;

    // Dynamic Theme Styles
    const themeStyles = {
        '--channel-color': provider.color,
        fontFamily: provider.font ? `"${provider.font}", sans-serif` : 'inherit',
    } as React.CSSProperties;

    // Construct Font URL
    const fontUrl = provider.font ? `https://fonts.googleapis.com/css2?family=${provider.font.replace(/\s+/g, '+')}:wght@400;700;900&display=swap` : null;

    // Provider Specific Configs
    const isDisney = id === '337'; // Disney+
    const isApple = id === '350'; // Apple TV+
    const isNetflix = id === '8'; // Netflix
    const isPrime = id === '9'; // Prime
    const isHulu = id === '15'; // Hulu

    // Determine Background Gradient
    let bgGradient = 'bg-[#141414]';
    if (isDisney) bgGradient = 'bg-radial-disney'; // Need to add to tailwind or use arbitrary
    else if (isHulu) bgGradient = 'bg-gradient-to-b from-[#1CE783]/20 to-[#141414]';
    else if (isApple) bgGradient = 'bg-zinc-950';
    else if (isNetflix) bgGradient = 'bg-black';
    else if (isPrime) bgGradient = 'bg-gradient-to-b from-[#00A8E1]/20 to-[#0F171E]';

    return (
        <div className={`min-h-screen pb-20 ${bgGradient} selection:bg-[var(--channel-color)] selection:text-white`} style={themeStyles}>
            {/* Load Provider Font */}
            {fontUrl && <link rel="stylesheet" href={fontUrl} />}
            
            {/* Custom Background for Disney (Radial) */}
            {isDisney && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1a1d29,_#0f1014)] -z-10" />
            )}
            
            {trendingLoading ? (
                <div className="h-[70vh] w-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-500" style={{ color: provider.color }} size={40} />
                </div>
            ) : (
                // Use Cinematic Hero for Channels
                heroItems.length > 0 && <CinematicHero item={heroItems[0]} />
            )}

            <div className="relative z-10 -mt-12 sm:-mt-24 space-y-8 md:space-y-10 pb-24">
                
                {/* Brand Header */}
                <div className="px-4 md:px-12 flex items-center space-x-6 mb-8">
                    <div 
                        className="h-12 w-1.5 rounded-full" 
                        style={{ backgroundColor: provider.color, boxShadow: `0 0 15px ${provider.color}` }}
                    />
                    <div className="flex flex-col justify-center">
                        <img 
                            src={provider.logo} 
                            alt={`${provider.name} Collection`}
                            className="h-10 sm:h-14 lg:h-16 w-auto object-contain select-none drop-shadow-lg"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const span = document.getElementById(`fallback-${provider.id}`);
                                if (span) span.style.display = 'block';
                            }}
                        />
                        <h1 
                            id={`fallback-${provider.id}`} 
                            className="text-4xl font-black text-white tracking-tighter hidden"
                            style={{ display: 'none' }} 
                        >
                            {provider.name}
                        </h1>
                    </div>
                </div>

                {/* DISNEY BRAND RAIL */}
                {isDisney && <DisneyBrandRail />}

                {/* CONTENT RAILS */}
                {/* Using landscape cards for Disney/Apple/Prime for premium feel */}
                {/* Always render trending rail, pass undefined if loading */}
                <ContentRail title={`Trending on ${provider.name}`} items={trending} aspectRatio={isDisney || isApple || isPrime ? 'landscape' : 'portrait'} />
                
                {visibleCount >= 1 && (
                    <ContentRail title="New Movies" items={newMovies} aspectRatio="portrait" />
                )}
                
                {visibleCount >= 2 && (
                    <ContentRail title="New TV Shows" items={newTV} aspectRatio={isDisney ? 'landscape' : 'portrait'} />
                )}

                {visibleCount >= 3 && (
                    <ContentRail title="Top Rated Gems" items={topRated} aspectRatio={isApple ? 'landscape' : 'portrait'} />
                )}

                {visibleCount >= 4 && (
                    <ContentRail title="Action & Adventure" items={actionMovies} />
                )}

                {visibleCount >= 5 && (
                    <ContentRail title="Laugh Out Loud" items={comedyMovies} />
                )}

                {visibleCount >= 6 && (
                    <ContentRail title="Sci-Fi Worlds" items={sciFiMovies} />
                )}

                {visibleCount >= 7 && (
                    <ContentRail title="Bingeworthy Dramas" items={dramaTV} />
                )}
                
                {visibleCount >= 8 && (
                    <ContentRail title="Chills & Thrills" items={horrorMovies} />
                )}

                {visibleCount >= 9 && (
                    <ContentRail title="Animation" items={animation} />
                )}

                {visibleCount >= 10 && (
                    <ContentRail title="Real Stories" items={documentaries} aspectRatio="landscape" />
                )}

                {visibleCount >= 11 && (
                    <ContentRail title="Family Fun" items={familyMovies} />
                )}

                {visibleCount >= 12 && (
                    <ContentRail title="Modern Classics" items={classics} aspectRatio="portrait" />
                )}

                {visibleCount >= 13 && (
                    <ContentRail title="Underrated Gems" items={underrated} />
                )}
                
                {visibleCount >= 14 && (
                     <ContentRail title="Popular Series" items={popularTV} aspectRatio={isDisney ? 'landscape' : 'portrait'} />
                )}

                {/* Sentinel */}
                {visibleCount < 15 && (
                    <div ref={bottomRef} className="h-20 w-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-zinc-800" />
                    </div>
                )}
            </div>
        </div>
    );
}
