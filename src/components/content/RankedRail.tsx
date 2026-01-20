"use client";

import React, { useRef } from "react";
import { Content } from "@/lib/types/content";
import { ContentCard } from "./ContentCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankedRailProps {
  title: string;
  items: Content[];
  className?: string;
}

export function RankedRail({ title, items, className }: RankedRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={cn("group/rail relative", className)}>
      <div className="px-4 md:px-12 mb-4 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {title}
        </h2>
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-30 w-12 md:w-16 bg-gradient-to-r from-black to-transparent opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center text-white"
          aria-label="Scroll left"
        >
          <ChevronLeft size={40} />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory px-4 md:px-12 gap-6 pb-4"
        >
          {items.slice(0, 10).map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="relative min-w-[280px] md:min-w-[320px] snap-start flex items-end pt-12"
            >
              {/* Giant Numeral */}
              <span 
                className={cn(
                  "absolute left-0 bottom-[-10px] text-[180px] md:text-[220px] font-black leading-none select-none z-0",
                  "text-transparent stroke-white/20 stroke-2",
                  "tracking-tighter italic"
                )}
                style={{ 
                  WebkitTextStroke: "2px rgba(255, 255, 255, 0.2)",
                  transform: "translateX(-40%)" 
                }}
              >
                {index + 1}
              </span>

              {/* Content Card with Z-Index over Numeral */}
              <div className="relative z-10 w-full ml-12 transform hover:scale-105 transition-transform duration-300">
                <ContentCard 
                  item={item} 
                  aspectRatio="portrait" 
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-30 w-12 md:w-16 bg-gradient-to-l from-black to-transparent opacity-0 group-hover/rail:opacity-100 transition-opacity flex items-center justify-center text-white"
          aria-label="Scroll right"
        >
          <ChevronRight size={40} />
        </button>
      </div>
    </div>
  );
}
