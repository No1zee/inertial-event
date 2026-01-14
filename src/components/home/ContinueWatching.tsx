"use client";

import { useLibraryStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";

export default function ContinueWatching() {
    const { watchHistory, removeFromWatchHistory } = useLibraryStore();
    const router = useRouter();

    // Filter: only in-progress (not completed), with progress > 5%
    const inProgress = watchHistory
        .filter(item => !item.completed && item.progress > 5)
        .sort((a, b) => b.lastWatched - a.lastWatched)
        .slice(0, 10); // Limit to 10 items

    if (inProgress.length === 0) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleClick = (item: typeof inProgress[0]) => {
        let url = item.media_type === 'movie'
            ? `/watch?id=${item.tmdbId}&type=movie`
            : `/watch?id=${item.tmdbId}&type=tv&season=${item.season || 1}&episode=${item.episode || 1}`;

        // If it was a torrent session, restore it
        if (item.magnet) {
            url += `&torrent=true&magnet=${encodeURIComponent(item.magnet)}`;
        }

        router.push(url);
    };

    return (
        <section className="mb-12 px-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Continue Watching
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {inProgress.map(item => (
                    <div
                        key={item.id}
                        className="relative flex-shrink-0 w-[280px] group cursor-pointer"
                        onClick={() => handleClick(item)}
                    >
                        {/* Poster */}
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-purple-500/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                            {item.poster_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                    No Image
                                </div>
                            )}

                            {/* Progress Bar Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                <div
                                    className="h-full bg-purple-600"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <p className="text-white/80 text-sm mb-1">
                                    {Math.round(item.progress)}% watched
                                </p>
                                <p className="text-white/60 text-xs">
                                    {formatTime(item.duration - item.currentTime)} remaining
                                </p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mt-3 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{item.title}</h3>
                                {item.media_type === 'tv' && (
                                    <p className="text-sm text-white/50">S{item.season}:E{item.episode}</p>
                                )}
                            </div>
                            {/* Remove Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromWatchHistory(item.id);
                                }}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                                title="Remove from Continue Watching"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
