"use client";

import { useEffect, useState, useRef } from 'react';
import { useProviderContent, useProviderGenre, useProviderClassics, useProviderUnderrated, useProviderNewReleases } from '@/hooks/queries/useContent';
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
import { RankedRail } from '@/components/content/RankedRail';

export default function ChannelView({ id }: { id: string }) {
    const provider = getProviderById(id);
    const router = useRouter();
    const { getChannelState, setChannelState } = useUIStore();

    // Streamer-specific defaults for "Premium" experience
    const isApple = id === '350';
    const isDisney = id === '337';
    const isPremium = isApple || isDisney || id === '1899' || id === '9'; // Max, Prime
    
    // Initialize state from store
    const savedState = provider ? getChannelState(provider.id) : { visibleCount: isPremium ? 4 : 2, scrollPos: 0 };
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
    // Data Fetching
    const providerType = (provider.type as 'provider' | 'network') || 'provider';

    const { data: trending, isLoading: trendingLoading } = useProviderContent(id, 'movie', 'popularity.desc', providerType);
    const { data: newMovies } = useProviderNewReleases(id, 'movie', providerType);
    const { data: newTV } = useProviderNewReleases(id, 'tv', providerType);
    const { data: topRated } = useProviderContent(id, 'movie', 'vote_average.desc', providerType);
    
    // Determine default media type (Networks like Adult Swim are TV-focused)
    const defaultMediaType = providerType === 'network' ? 'tv' : 'movie';

    // Genre Rails (Dynamic Media Type)
    // 10759 = Action & Adventure (TV), 28 = Action (Movie)
    const actionGenreId = (providerType === 'network' && defaultMediaType === 'tv') ? 10759 : 28;
    const { data: actionItems } = useProviderGenre(id, actionGenreId, defaultMediaType, 'popularity.desc', providerType);

    const { data: comedyItems } = useProviderGenre(id, 35, defaultMediaType, 'popularity.desc', providerType);
    
    // 10765 = Sci-Fi & Fantasy (TV), 878 = Science Fiction (Movie)
    const sciFiGenreId = (providerType === 'network' && defaultMediaType === 'tv') ? 10765 : 878;
    const { data: sciFiItems } = useProviderGenre(id, sciFiGenreId, defaultMediaType, 'popularity.desc', providerType);
    
    const { data: dramaTV } = useProviderGenre(id, 18, 'tv', 'popularity.desc', providerType);
    const { data: horrorItems } = useProviderGenre(id, 27, 'movie', 'popularity.desc', providerType); // Horror is mostly movies
    const { data: documentaries } = useProviderGenre(id, 99, 'movie', 'popularity.desc', providerType);
    const { data: familyMovies } = useProviderGenre(id, 10751, 'movie', 'popularity.desc', providerType);
    const { data: animationItems } = useProviderGenre(id, 16, defaultMediaType, 'popularity.desc', providerType);
    
    // Expanded Rails
    const { data: classics } = useProviderClassics(id, defaultMediaType, providerType);
    const { data: underrated } = useProviderUnderrated(id, defaultMediaType, providerType);
    // We already have newTV, let's add Popular TV specifically
    const { data: popularTV } = useProviderContent(id, 'tv', 'popularity.desc', providerType);

    // Apple Specific Curated
    const { data: appleOriginals } = useProviderContent(id, 'tv', 'vote_average.desc', providerType);
    const { data: mysteryItems } = useProviderGenre(id, 9648, 'movie', 'popularity.desc', providerType);
    const { data: sciFiMovies } = useProviderGenre(id, 878, 'movie', 'vote_average.desc', providerType);
    const { data: appleDramas } = useProviderGenre(id, 18, 'tv', 'vote_average.desc', providerType);


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
    const isNetflix = id === '8'; // Netflix
    const isPrime = id === '9'; // Prime
    const isHulu = id === '15'; // Hulu
    const isMax = id === '1899'; // Max
    const isPeacock = id === '386'; // Peacock
    const isAdultSwim = id === '80'; // Adult Swim

    // Determine Background Gradient & Selection Theme
    let bgGradient = 'bg-[#141414] selection:bg-[var(--channel-color)] selection:text-white';
    
    if (isDisney) {
        bgGradient = 'bg-radial-disney selection:bg-white selection:text-black';
    } 
    else if (isHulu) {
        bgGradient = 'bg-gradient-to-b from-[#1CE783]/10 via-[#141414] to-black selection:bg-[#1CE783] selection:text-black';
    } 
    else if (isApple) {
        bgGradient = 'bg-black selection:bg-[#007AFF] selection:text-white';
    } 
    else if (isNetflix) {
        bgGradient = 'bg-gradient-to-b from-[#b81d24]/20 to-black selection:bg-[#E50914] selection:text-white';
    } 
    else if (isAdultSwim) {
        bgGradient = 'bg-black text-white selection:bg-[#39FF14] selection:text-black';
    } 
    else if (isPrime) {
        bgGradient = 'bg-gradient-to-b from-[#00A8E1]/20 to-[#0F171E] selection:bg-[#00A8E1] selection:text-white';
    }
    else if (isMax) {
        bgGradient = 'bg-gradient-to-b from-[#002BE7]/20 to-black selection:bg-[#002BE7] selection:text-white';
    }
    else if (isPeacock) {
        bgGradient = 'bg-black selection:bg-white selection:text-black';
    }

    const getViewAllUrl = (railId: string, mediaType: 'movie' | 'tv', genreId?: number) => {
        const query = new URLSearchParams({
            id: railId,
            providerId: id,
            providerType,
            type: mediaType,
        });
        if (genreId) query.set('genreId', genreId.toString());
        return `/browse/view-all?${query.toString()}`;
    };

    return (
        <div className={`min-h-screen pb-20 ${bgGradient} selection:bg-[var(--channel-color)] selection:text-white`} style={themeStyles}>
            {/* Load Provider Font */}
            {fontUrl && <link rel="stylesheet" href={fontUrl} />}
            
            {/* Custom Background for Disney (Radial) */}
            {isDisney && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1a1d29,_#0f1014)] -z-10" />
            )}
            
            {/* Adult Swim: Bump Aesthetic Overlay (Subtle) */}
            {isAdultSwim && (
                <div className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-5 z-0" 
                     style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+")' }} 
                />
            )}
            
            {trendingLoading ? (
                <div className="h-[70vh] w-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-500" style={{ color: provider.color }} size={40} />
                </div>
            ) : (
                // Use Cinematic Hero for Channels
                heroItems.length > 0 && <CinematicHero content={heroItems} />
            )}

            <div className="relative z-10 -mt-12 sm:-mt-24 space-y-8 md:space-y-10 pb-24">
                
                {/* Brand Header */}
                <div className="px-4 md:px-12 flex items-center space-x-6 mb-8">
                    <div 
                        className="h-12 w-1.5 rounded-full" 
                        style={{ backgroundColor: provider.color, boxShadow: `0 0 15px ${provider.color}` }}
                    />
                    <div className="flex flex-col justify-center">
                        {isAdultSwim ? (
                             <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter shadow-md select-none">
                                [adult swim]
                            </h1>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>

                {/* DISNEY BRAND RAIL */}
                {isDisney && <DisneyBrandRail />}

                {/* CONTENT RAILS */}
                {/* CONTENT RAILS */}
                {/* Using landscape cards for Disney/Apple/Prime/Max for premium feel */}
                {/* Always render trending rail, pass undefined if loading */}
                {/* Content Rails */}
                {/* Content Rails */}
                <ContentRail 
                    title={`Trending on ${provider.name}`} 
                    items={trending} 
                    viewAllHref={getViewAllUrl('trending', 'movie')}
                    aspectRatio={isDisney || isApple || isPrime || isMax || isPeacock ? 'landscape' : 'portrait'} 
                />
                
                {providerType === 'network' ? (
                     // Network Specific Layout (TV Focused)
                     <>
                        <ContentRail 
                            title="New Episodes" 
                            items={newTV} 
                            viewAllHref={getViewAllUrl('new_tv', 'tv')}
                            aspectRatio="landscape" 
                        />
                        
                        {isAdultSwim ? (
                            <div className="py-12 my-8 bg-[#FF4D4D] text-black -mx-4 md:-mx-12 px-4 md:px-12">
                                <div className="mb-6">
                                    <h2 className="text-5xl font-black tracking-tighter uppercase mb-2">All Shows</h2>
                                    <p className="font-bold text-xl uppercase tracking-widest">[Animation & Comedy]</p>
                                </div>
                                <div className="[&_h3]:text-black [&_p]:text-black/70">
                                    <ContentRail 
                                        title="" 
                                        items={animationItems} 
                                        viewAllHref={getViewAllUrl('animation', 'tv', 16)}
                                        aspectRatio="portrait" 
                                    />
                                </div>
                            </div>
                        ) : (
                            <ContentRail 
                                title="Animation Hits" 
                                items={animationItems} 
                                viewAllHref={getViewAllUrl('animation', 'tv', 16)}
                                aspectRatio="portrait" 
                            />
                        )}

                        <ContentRail 
                            title="Fan Favorites" 
                            items={popularTV} 
                            viewAllHref={getViewAllUrl('popular_tv', 'tv')}
                            aspectRatio="portrait" 
                        /> 
                         {/* Action, Comedy etc */}
                        <ContentRail 
                            title="Action & Adventure" 
                            items={actionItems} 
                            viewAllHref={getViewAllUrl('action', 'tv', 10759)}
                        />
                        <ContentRail 
                            title="Comedy" 
                            items={comedyItems} 
                            viewAllHref={getViewAllUrl('comedy', 'tv', 35)}
                        />
                        <ContentRail 
                            title="Sci-Fi & Fantasy" 
                            items={sciFiItems} 
                            viewAllHref={getViewAllUrl('bg_scifi', 'tv', 10765)}
                        />
                     </>
                ) : (
                    // Standard Streamer Layout
                    <>
                        {isApple && <RankedRail title="Top 10 on Apple TV+" items={trending} className="py-8" />}
                        
                        <ContentRail 
                            title={isApple ? "Apple Originals" : "New Movies"} 
                            items={isApple ? appleOriginals : newMovies} 
                            viewAllHref={getViewAllUrl(isApple ? 'apple_originals' : 'new_movies', isApple ? 'tv' : 'movie')}
                            aspectRatio={isApple ? "landscape" : "portrait"} 
                        />
                        <ContentRail 
                            title="New TV Shows" 
                            items={newTV} 
                            viewAllHref={getViewAllUrl('new_tv', 'tv')}
                            aspectRatio={isDisney || isMax || isPeacock || isApple ? 'landscape' : 'portrait'} 
                        />
                        <ContentRail 
                            title="Top Rated Gems" 
                            items={topRated} 
                            viewAllHref={getViewAllUrl('top_rated', 'movie')}
                            aspectRatio={isApple || isMax ? 'landscape' : 'portrait'} 
                        />
                        <ContentRail 
                            title="Action & Adventure" 
                            items={actionItems} 
                            viewAllHref={getViewAllUrl('action', defaultMediaType, actionGenreId)}
                        />
                        <ContentRail 
                            title="Laugh Out Loud" 
                            items={comedyItems} 
                            viewAllHref={getViewAllUrl('comedy', defaultMediaType, 35)}
                        />
                        <ContentRail 
                            title="Sci-Fi & Fantasy" 
                            items={isApple ? sciFiMovies : sciFiItems} 
                            viewAllHref={getViewAllUrl('scifi', isApple ? 'movie' : defaultMediaType, isApple ? 878 : sciFiGenreId)}
                            aspectRatio={isApple ? 'landscape' : 'portrait'} 
                        />
                        {isApple && <ContentRail title="Award-Winning Dramas" items={appleDramas} viewAllHref={getViewAllUrl('drama', 'tv', 18)} aspectRatio="portrait" />}
                        {isApple && <ContentRail title="Mystery & Suspense" items={mysteryItems} viewAllHref={getViewAllUrl('mystery', 'movie', 9648)} />}
                    </>
                )}

                {visibleCount >= 7 && (
                    <ContentRail title="Bingeworthy Dramas" items={dramaTV} viewAllHref={getViewAllUrl('drama', 'tv', 18)} />
                )}
                
                {visibleCount >= 8 && (
                    <ContentRail title="Chills & Thrills" items={horrorItems} viewAllHref={getViewAllUrl('horror', 'movie', 27)} />
                )}

                {visibleCount >= 9 && (
                    <ContentRail title="Animation" items={animationItems} viewAllHref={getViewAllUrl('animation', defaultMediaType, 16)} />
                )}

                {visibleCount >= 10 && (
                    <ContentRail title="Real Stories" items={documentaries} viewAllHref={getViewAllUrl('docu', 'movie', 99)} aspectRatio="landscape" />
                )}

                {visibleCount >= 11 && (
                    <ContentRail title="Family Fun" items={familyMovies} viewAllHref={getViewAllUrl('family', 'movie', 10751)} />
                )}

                {visibleCount >= 12 && (
                    <ContentRail title="Modern Classics" items={classics} viewAllHref={getViewAllUrl('classics', defaultMediaType)} aspectRatio="portrait" />
                )}

                {visibleCount >= 13 && (
                    <ContentRail title="Underrated Gems" items={underrated} viewAllHref={getViewAllUrl('underrated', defaultMediaType)} />
                )}
                
                {visibleCount >= 14 && (
                     <ContentRail title="Popular Series" items={popularTV} viewAllHref={getViewAllUrl('popular_tv', 'tv')} aspectRatio={isDisney ? 'landscape' : 'portrait'} />
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
