import React from 'react';
import { ContentCardSkeleton } from '@/components/content/ContentCardSkeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-zinc-950 p-8 pt-24 space-y-12 animate-in fade-in duration-500">
            {/* Hero Skeleton */}
            <div className="h-[40vh] w-full rounded-3xl bg-zinc-900 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
            </div>

            {/* Content Rails Skeletons */}
            <div className="space-y-10">
                {[1, 2].map((rail) => (
                    <div key={rail} className="space-y-4">
                        <div className="h-8 w-48 bg-zinc-900 rounded-lg animate-pulse ml-0 md:ml-4 lg:ml-8" />
                        <div className="flex gap-4 overflow-hidden px-0 md:px-4 lg:px-8">
                            {[1, 2, 3, 4, 5, 6].map((card) => (
                                <ContentCardSkeleton key={card} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
