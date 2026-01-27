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
import { AdultSwimHero } from './AdultSwimHero';
import { AuntiesHero } from './AuntiesHero';
import { useViralAdultSwim, useAdultSwimOriginals, useShorts, useAdultSwimDarkComedy, useAdultSwimHorror, useAdultSwimSciFi, useAdultSwimSatire, useAdultSwimCultClassics, useAdultSwimExperimental, useAdultSwimAnime, useAdultSwimAction, useAdultSwimMusic, useAdultSwimMidnight, useAdultSwimSurreal, useAdultSwimBritish, useAdultSwimRetro, useKoreanDramas, useAfricanMovies, useClassicSitcoms, useSoapOperas, useFamilyDramas, useTelenovelas, useBollywoodMovies, useFamilyComedies, useCookingShows, useRomanticMovies } from '@/hooks/queries/useContent';
import { BumpBlock } from './BumpBlock';
import { Top10Rail } from './Top10Rail';

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
    const { data: viralAdultSwim } = useViralAdultSwim();
    const { data: asAnimated } = useAdultSwimOriginals('animated');
    const { data: asLiveAction } = useAdultSwimOriginals('live-action');
    const { data: shorts } = useShorts();
    const { data: asDarkComedy } = useAdultSwimDarkComedy();
    const { data: asHorror } = useAdultSwimHorror();
    const { data: asSciFi } = useAdultSwimSciFi();
    const { data: asSatire } = useAdultSwimSatire();
    const { data: asCultClassics } = useAdultSwimCultClassics();
    const { data: asExperimental } = useAdultSwimExperimental();
    const { data: asAnime } = useAdultSwimAnime();
    const { data: asAction } = useAdultSwimAction();
    const { data: asMusic } = useAdultSwimMusic();
    const { data: asMidnight } = useAdultSwimMidnight();
    const { data: asSurreal } = useAdultSwimSurreal();
    const { data: asBritish } = useAdultSwimBritish();
    const { data: asRetro } = useAdultSwimRetro();
    
    // Aunties Channel Content
    const { data: koreanDramas } = useKoreanDramas();
    const { data: africanMovies } = useAfricanMovies();
    const { data: classicSitcoms } = useClassicSitcoms();
    const { data: soapOperas } = useSoapOperas();
    const { data: familyDramas } = useFamilyDramas();
    const { data: telenovelas } = useTelenovelas();
    const { data: bollywoodMovies } = useBollywoodMovies();
    const { data: familyComedies } = useFamilyComedies();
    const { data: cookingShows } = useCookingShows();
    const { data: romanticMovies } = useRomanticMovies();


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
    const isAdultSwim = id === '80';
    const isAunties = id === 'aunties'; // Aunties

    // Determine Background Gradient
    let bgGradient = 'bg-[#141414]';
    if (isDisney) bgGradient = 'bg-radial-disney'; 
    else if (isHulu) bgGradient = 'bg-gradient-to-b from-[#1CE783]/20 to-[#141414]';
    else if (isApple) bgGradient = 'bg-gradient-to-b from-black via-zinc-950 to-black';
    else if (isNetflix) bgGradient = 'bg-gradient-to-b from-black via-zinc-950 to-black';
    else if (isPrime) bgGradient = 'bg-gradient-to-b from-[#00A8E1]/20 to-[#0F171E]';
    else if (isAdultSwim) bgGradient = 'bg-black'; // Pure black for Adult Swim contrast
    else if (isAunties) bgGradient = 'bg-gradient-to-b from-amber-950/20 via-black to-purple-950/20'; // Warm gradient

    return (
        <div className={`min-h-screen pb-20 ${bgGradient} selection:bg-[var(--channel-color)] selection:text-white`} style={themeStyles}>
            {/* Load Provider Font */}
            {fontUrl && <link rel="stylesheet" href={fontUrl} />}
            
            {/* Brand Essence Overlays */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {isAdultSwim && (
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />
                )}
                {isAunties && (
                    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] mix-blend-multiply" />
                )}
            </div>

            {/* Custom Background for Disney (Radial) */}
            {isDisney && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1a1d29,_#0f1014)] -z-10" />
            )}

            {/* Adult Swim "Late Night" Grain */}
            {isAdultSwim && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            )}
            
            {trendingLoading ? (
                <div className="h-[70vh] w-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-500" style={{ color: provider.color }} size={40} />
                </div>
            ) : (
                // Use Specialized Hero for Adult Swim, Cinematic for others
                heroItems.length > 0 && (
                    isAdultSwim ? (
                    <AdultSwimHero item={heroItems[0]} />
                ) : isAunties ? (
                    <AuntiesHero item={heroItems[0]} />
                ) : (
                    <CinematicHero item={heroItems[0]} />
                )
                )
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
                {/* Netflix Top 10 */}
                {isNetflix && (
                    <Top10Rail title="Top 10 in the US Today" items={trending} />
                )}

                {/* Viral Hits for Adult Swim */}
                {isAdultSwim && (
                    <>
                        <ContentRail 
                            title="Viral Hits" 
                            items={viralAdultSwim} 
                            aspectRatio="portrait"
                            railId="adult-swim-viral"
                        />
                        <BumpBlock 
                            text="We spent the budget for this rail on a subscription to a cat magazine. We don't even have a cat."
                            subtext="[ADULT SWIM] NONSENSE"
                            alignment="left"
                        />
                    </>
                )}

                {/* Adult Swim Pillars */}
                {isAdultSwim && (
                    <>
                        <ContentRail 
                            title="Original Animated Series" 
                            items={asAnimated} 
                            railId="adult-swim-animated"
                        />
                        <ContentRail 
                            title="Dark Comedy & Satire" 
                            items={asDarkComedy} 
                            railId="adult-swim-dark-comedy"
                        />
                        <BumpBlock 
                            text="YOUR SENSE OF HUMOR IS BROKEN. WE LIKE THAT."
                            subtext="[ADULT SWIM] QUALITY ASSURANCE"
                            alignment="right"
                        />
                        <ContentRail 
                            title="Offbeat Live-Action" 
                            items={asLiveAction} 
                            railId="adult-swim-live"
                        />
                        <ContentRail 
                            title="Sci-Fi & Fantasy" 
                            items={asSciFi} 
                            railId="adult-swim-scifi"
                        />
                        <ContentRail 
                            title="Horror & Mystery" 
                            items={asHorror} 
                            railId="adult-swim-horror"
                        />
                        <BumpBlock 
                            text="STARE BLANKLY AT THE SCREEN. IT'S GOOD FOR YOUR POSTURE."
                            subtext="[ADULT SWIM] HEALTH TIPS"
                            alignment="center"
                        />
                        <ContentRail 
                            title="Satirical Masterpieces" 
                            items={asSatire} 
                            railId="adult-swim-satire"
                        />
                        <BumpBlock 
                            text="YOU ARE NOW WATCHING [ADULT SWIM]. ENJOY YOUR EYEBALLS WHILE YOU STILL HAVE THEM."
                            subtext="[ADULT SWIM] PSA"
                            alignment="center"
                        />
                        <ContentRail 
                            title="Cult Classics" 
                            items={asCultClassics} 
                            railId="adult-swim-cult"
                        />
                        <ContentRail 
                            title="Experimental & Weird" 
                            items={asExperimental} 
                            railId="adult-swim-experimental"
                        />
                        <ContentRail 
                            title="Mature Anime" 
                            items={asAnime} 
                            railId="adult-swim-anime"
                        />
                        <ContentRail 
                            title="Action-Packed" 
                            items={asAction} 
                            railId="adult-swim-action"
                        />
                        <ContentRail 
                            title="Music & Beats" 
                            items={asMusic} 
                            railId="adult-swim-music"
                        />
                        <BumpBlock 
                            text="IT'S 4AM. DO YOU KNOW WHERE YOUR BRAIN IS?"
                            subtext="[ADULT SWIM] MIDNIGHT"
                            alignment="right"
                        />
                        <ContentRail 
                            title="Midnight Munchies" 
                            items={asMidnight} 
                            railId="adult-swim-midnight"
                        />
                        <ContentRail 
                            title="Surrealist Nightmares" 
                            items={asSurreal} 
                            railId="adult-swim-surreal"
                        />
                        <BumpBlock 
                            text="THIS IS A TEST. IF THIS HAD BEEN AN ACTUAL EMERGENCY, YOU WOULD HAVE BEEN FED TO THE WOLVES."
                            subtext="TEST PATTERN"
                            alignment="center"
                        />
                        <ContentRail 
                            title="The British Invasion" 
                            items={asBritish} 
                            railId="adult-swim-british"
                        />
                        <ContentRail 
                            title="Retro Bumps & Classics" 
                            items={asRetro} 
                            railId="adult-swim-retro"
                        />
                        <ContentRail 
                            title="Shorts & Specials" 
                            items={shorts} 
                            aspectRatio="landscape" 
                            railId="adult-swim-shorts"
                        />
                    </>
                )}

                {/* Aunties Channel */}
                {isAunties && (
                    <>
                        <ContentRail 
                            title="K-Drama Favorites ❤️" 
                            items={koreanDramas} 
                            railId="aunties-korean"
                        />
                        <ContentRail 
                            title="Telenovelas & Spanish Drama 🌹" 
                            items={telenovelas} 
                            railId="aunties-telenovelas"
                        />
                        <div className="py-8 px-6 md:px-12 lg:px-16 bg-gradient-to-r from-amber-900/10 to-purple-900/10 border-y border-amber-500/20">
                            <p className="text-amber-100 text-center text-lg md:text-xl font-serif italic">
                                "Stories that bring families together, one episode at a time."
                            </p>
                        </div>
                        <ContentRail 
                            title="Bollywood Magic 🎬" 
                            items={bollywoodMovies} 
                            railId="aunties-bollywood"
                            aspectRatio="landscape"
                        />
                        <ContentRail 
                            title="African Cinema 🌍" 
                            items={africanMovies} 
                            railId="aunties-african"
                            aspectRatio="landscape"
                        />
                        <ContentRail 
                            title="Classic Sitcoms 😂" 
                            items={classicSitcoms} 
                            railId="aunties-sitcoms"
                        />
                        <ContentRail 
                            title="Family Comedies 👨‍👩‍👧" 
                            items={familyComedies} 
                            railId="aunties-comedies"
                        />
                        <ContentRail 
                            title="Soap Operas & Dramas 💫" 
                            items={soapOperas} 
                            railId="aunties-soaps"
                        />
                        <ContentRail 
                            title="Cooking & Lifestyle 🍳" 
                            items={cookingShows} 
                            railId="aunties-cooking"
                        />
                        <ContentRail 
                            title="Romance & Love Stories 💕" 
                            items={romanticMovies} 
                            railId="aunties-romance"
                            aspectRatio="landscape"
                        />
                        <ContentRail 
                            title="Family Dramas 👪" 
                            items={familyDramas} 
                            railId="aunties-family"
                        />
                    </>
                )}

                {/* Using landscape cards for Disney/Apple/Prime for premium feel */}
                {/* Always render trending rail, pass undefined if loading */}
                {!isNetflix && (
                    <ContentRail 
                        title={isDisney ? "Disney+ Originals" : isApple ? "Apple Originals" : `Trending on ${provider.name}`} 
                        items={trending} 
                        aspectRatio={isDisney || isApple || isPrime ? 'landscape' : 'portrait'} 
                        railId={`${provider.slug}-trending`}
                    />
                )}
                
                {visibleCount >= 1 && (
                    <ContentRail 
                        title={isDisney ? "Disney Classics" : "New Movies"} 
                        items={isDisney ? animation : newMovies} 
                        aspectRatio={isDisney ? 'landscape' : 'portrait'} 
                        railId={`${provider.slug}-new-movies`}
                    />
                )}
                
                {visibleCount >= 2 && (
                    <ContentRail 
                        title={isDisney ? "Pixar Favorites" : "New TV Shows"} 
                        items={isDisney ? familyMovies : newTV} 
                        aspectRatio={isDisney ? 'landscape' : 'portrait'} 
                        railId={`${provider.slug}-new-tv`}
                    />
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
