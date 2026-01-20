"use client";

import { cn } from "@/lib/utils";

interface RatingsProps {
    ratings?: {
        imdb?: { score: number; votes?: number };
        rottenTomatoes?: { score: number; state: 'fresh' | 'rotten' | 'certified' };
    };
    className?: string;
}

export function RatingsBadges({ ratings, className }: RatingsProps) {
    if (!ratings) return null;

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {/* IMDb Badge */}
            {ratings.imdb && ratings.imdb.score > 0 && (
                <div className="flex items-center gap-1.5 bg-[#F5C518] text-black px-1.5 py-0.5 rounded font-bold text-xs">
                    <span className="tracking-tighter">IMDb</span>
                    <span className="bg-black/10 px-1 rounded text-[10px] min-w-[20px] text-center">
                        {ratings.imdb.score.toFixed(1)}
                    </span>
                </div>
            )}

            {/* Rotten Tomatoes Badge */}
            {ratings.rottenTomatoes && ratings.rottenTomatoes.score > 0 && (
                <div className="flex items-center gap-1.5">
                    {ratings.rottenTomatoes.state === 'certified' && (
                         // Using CSS/emoji for now, ideally SVG
                         <span className="text-lg" title="Certified Fresh">🍅</span>
                    )}
                    {ratings.rottenTomatoes.state === 'fresh' && (
                         <span className="text-lg" title="Fresh">🍅</span>
                    )}
                    {ratings.rottenTomatoes.state === 'rotten' && (
                         <span className="text-lg" title="Rotten">🦠</span> 
                    )}
                    <span className="font-bold text-sm text-zinc-200">
                        {ratings.rottenTomatoes.score}%
                    </span>
                </div>
            )}
        </div>
    );
}
