"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import { ContentCard } from "./ContentCard";
import { cn } from "@/lib/utils";

import { Content } from "@/lib/types/content";

interface ContentRailProps {
    title: string;
    items?: Content[];
}

export function ContentRail({ title, items = [] }: ContentRailProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);

    const scroll = (direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
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

    // Placeholder items with strict type support
    const displayItems: Content[] = items.length > 0 ? items : Array(10).fill(null).map((_, i) => ({
        id: `mock-${i}`,
        title: "Loading...",
        description: "",
        poster: "/images/placeholder.png",
        backdrop: "/images/hero_placeholder.jpg",
        rating: 0,
        releaseDate: "2024",
        type: 'movie',
        genres: [],
        status: 'completed',
        isAdult: false
    }));

    return (
        <div className="space-y-4 group/rail">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 group cursor-pointer w-fit px-4 lg:px-0">
                {title}
                <div className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    See All <ChevronRight size={12} className="ml-1" />
                </div>
            </h2>

            <div className="relative group/scroll">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll("left")}
                    className={cn(
                        "absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 disabled:opacity-0",
                        !showLeftArrow && "hidden"
                    )}
                >
                    <ChevronLeft className="text-white hover:scale-125 transition-transform" size={32} />
                </button>

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x px-4 lg:px-0 scroll-smooth"
                    onScroll={(e) => setShowLeftArrow(e.currentTarget.scrollLeft > 0)}
                >
                    {displayItems.map((item) => (
                        <ContentCard key={item.id} item={item} />
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300"
                >
                    <ChevronRight className="text-white hover:scale-125 transition-transform" size={32} />
                </button>
            </div>
        </div>
    );
}
