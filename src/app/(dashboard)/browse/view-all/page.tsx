"use client";

import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { contentApi } from "@/lib/api/content";
import { ContentCard } from "@/components/content/ContentCard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Content } from "@/lib/types/content";
import { motion, AnimatePresence } from "framer-motion";

export default function ViewAllPage() {
    const searchParams = useSearchParams();
    const railId = searchParams.get("id");
    const title = searchParams.get("title") || "Explore";
    const [scrolled, setScrolled] = useState(false);
    
    // Scroll listener for glassmorphic header
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const { ref, inView } = useInView({ threshold: 0 });

    const fetchContent = async ({ pageParam = 1 }) => {
        if (!railId) return [];

        switch (railId) {
            case "trending": return contentApi.getTrending(pageParam);
            case "popular_tv": return contentApi.getPopularTV(pageParam);
            case "scifi": return contentApi.getByGenre(878, 'movie', pageParam);
            case "action": return contentApi.getByGenre(28, 'movie', pageParam);
            case "cbm": return contentApi.discover({ with_keywords: '9715', sort_by: 'revenue.desc', page: pageParam }, 'movie');
            case "a24": return contentApi.discover({ with_companies: '41077', sort_by: 'popularity.desc', page: pageParam }, 'movie');
            case "romcom": return contentApi.discover({ with_genres: '10749,35', sort_by: 'popularity.desc', page: pageParam }, 'movie');
            case "short": return contentApi.getShortAndSweet(pageParam);
            case "feelgood": return contentApi.getFeelGood(pageParam);
            case "horror": return contentApi.getByGenre(27, 'movie', pageParam);
            case "anime": return contentApi.discover({ with_keywords: '210024', sort_by: 'popularity.desc', page: pageParam }, 'tv');
            case "docu": return contentApi.getByGenre(99, 'movie', pageParam);

            // TV Mappings
            case "day1": return contentApi.getDayOneDrops('tv', pageParam);
            case "fresh": return contentApi.getFresh('tv', pageParam);
            case "bangers": return contentApi.getBangers('tv', pageParam);
            case "underrated": return contentApi.getUnderrated('tv', pageParam);
            case "classics": return contentApi.getClassics('tv', pageParam);
            case "drama": return contentApi.getByGenre(18, 'tv', pageParam);
            case "comedy": return contentApi.getByGenre(35, 'tv', pageParam);
            case "crime": return contentApi.getByGenre(80, 'tv', pageParam);
            case "bg_scifi": return contentApi.getByGenre(10765, 'tv', pageParam);
            case "reality": return contentApi.getByGenre(10764, 'tv', pageParam);

            case "popular_movies": return contentApi.discover({ sort_by: 'popularity.desc', page: pageParam }, 'movie');
            case "top_rated_movies": return contentApi.discover({ sort_by: 'vote_average.desc', 'vote_count.gte': 1000, page: pageParam }, 'movie');

            default: return [];
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ["view-all", railId],
        queryFn: fetchContent,
        getNextPageParam: (lastPage, allPages) => lastPage.length > 0 ? allPages.length + 1 : undefined,
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5 
    });

    useEffect(() => {
        if (inView && hasNextPage) fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage]);

    const items = data?.pages.flat() || [];

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen relative bg-black selection:bg-red-500/30 selection:text-white">
            {/* AMBIENT CINEMATIC BACKDROP */}
            <div className="fixed inset-0 pointer-events-none z-0">
                 <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[180px] opacity-40 mix-blend-screen animate-pulse duration-[10s]" />
                 <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-red-900/10 rounded-full blur-[200px] opacity-30 mix-blend-screen" />
                 <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0a0a0a]/90 to-black" />
            </div>

            {/* STICKY GLASS HEADER */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out border-b ${
                scrolled 
                ? "bg-black/70 backdrop-blur-xl border-white/5 py-4 shadow-2xl shadow-black/50" 
                : "bg-transparent border-transparent py-6"
            }`}>
                <div className="px-6 md:px-16 flex items-center gap-6 max-w-[2400px] mx-auto">
                    <Link href="/browse" className="group relative p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300">
                        <ChevronLeft size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-0.5">Browsing</span>
                        <motion.h1 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 tracking-tight"
                        >
                            {title}
                        </motion.h1>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="relative z-10 pt-32 md:pt-40 px-6 md:px-16 pb-32 max-w-[2400px] mx-auto">
                
                {status === 'pending' ? (
                     // HIGH-FIDELITY SKELETON
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-12">
                         {[...Array(12)].map((_, i) => (
                             <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-900/50 animate-pulse ring-1 ring-white/5" />
                         ))}
                     </div>
                ) : (
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-12 perspective-1000"
                    >
                        {items.map((item: Content, i: number) => (
                            <motion.div key={`${item.id}-${i}`} variants={itemAnim} className="group relative">
                                <ContentCard item={item} />
                                {/* Glow Effect on Card Hover comes from Card itself, but we add layout spacing here */}
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* INFINITE SCROLL LOADER */}
                <div ref={ref} className="h-40 flex items-center justify-center mt-20">
                    {isFetchingNextPage ? (
                        <div className="relative">
                            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            <div className="absolute inset-0 blur-lg bg-white/20 animate-pulse" />
                        </div>
                    ) : hasNextPage ? (
                        <span className="text-zinc-600 text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Loading More</span>
                    ) : items.length > 0 ? (
                        <div className="flex flex-col items-center gap-2 opacity-30 mt-10">
                            <div className="h-px w-20 bg-gradient-to-r from-transparent via-white to-transparent" />
                            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-zinc-400">End of Content</span>
                        </div>
                    ) : (
                        status !== 'pending' && <span className="text-zinc-500 font-light">No content found in this category.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
