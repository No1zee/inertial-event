"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ContentCard } from "./ContentCard";
import { ContentCardSkeleton } from "./ContentCardSkeleton";
import { cn } from "@/lib/utils";
import { Content } from "@/lib/types/content";

interface ContentRailProps {
    title: string;
    items?: Content[];
    railId?: string;
    aspectRatio?: "portrait" | "landscape" | "square";
}

export function ContentRail({ title, items, railId, aspectRatio = "portrait" }: ContentRailProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);

    const isLoading = items === undefined;
    const isEmpty = items !== undefined && items.length === 0;

    if (isEmpty) return null;

    const scroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        // Scroll by roughly 2-3 items or 80% of width
        const scrollAmount = container.clientWidth * 0.8;
        const newScrollLeft = direction === "right"
            ? container.scrollLeft + scrollAmount
            : container.scrollLeft - scrollAmount;

        container.scrollTo({
            left: newScrollLeft,
            behavior: "smooth"
        });

        if (direction === "right") setShowLeftArrow(true);
        if (newScrollLeft <= 0 && direction === "left") setShowLeftArrow(false);
    };

    return (
        <div className="space-y-4 group/rail py-4">
            <h2 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-wide flex items-center gap-3 group cursor-pointer w-fit px-4 sm:px-8 md:px-12 lg:px-16 hover:text-white">
                {title}
                {railId && (
                    <Link
                        href={`/browse/view-all?id=${railId}&title=${encodeURIComponent(title)}`}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded hover:bg-zinc-800 border border-white/5 opacity-0 group-hover:opacity-100 flex items-center hover:text-white"
                    >
                        Explore <ChevronRight size={10} className="ml-1" />
                    </Link>
                )}
            </h2>

            <div className="relative group/scroll">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className={cn(
                        "absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 disabled:opacity-0",
                        !showLeftArrow && "hidden"
                    )}
                >
                    <ChevronLeft className="text-white hover:scale-125" size={32} />
                </button>

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x px-4 sm:px-8 md:px-12 lg:px-16 scroll-smooth"
                    onScroll={(e) => setShowLeftArrow(e.currentTarget.scrollLeft > 0)}
                >
                    {isLoading ? (
                         <div className="w-full h-40 flex items-center justify-center gap-2 text-zinc-500">
                            {/* Simple text or skeleton */}
                            <div className="animate-pulse flex items-center gap-2">
                                <span className="text-sm font-medium tracking-wide">Loading...</span>
                            </div>
                         </div>
                    ) : (
                        items.map((item) => (
                            <div key={`${item.type}-${item.id}`}>
                                <ContentCard 
                                    item={item} 
                                    aspectRatio={aspectRatio}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/scroll:opacity-100"
                >
                    <ChevronRight className="text-white hover:scale-125" size={32} />
                </button>
            </div>
        </div>
    );
}
