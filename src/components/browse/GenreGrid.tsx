"use client";

import Link from "next/link";
import { Ghost, Sword, Heart, Smile, Rocket, Search, Music, Trophy, Globe, Zap, Clapperboard } from "lucide-react";

const GENRES = [
    { id: 28, name: "Action", icon: Sword, color: "from-red-500/20 to-orange-500/20" },
    { id: 35, name: "Comedy", icon: Smile, color: "from-yellow-400/20 to-orange-400/20" },
    { id: 18, name: "Drama", icon: Clapperboard, color: "from-blue-500/20 to-purple-500/20" },
    { id: 878, name: "Sci-Fi", icon: Rocket, color: "from-indigo-500/20 to-cyan-500/20" },
    { id: 27, name: "Horror", icon: Ghost, color: "from-zinc-500/20 to-red-900/20" },
    { id: 10749, name: "Romance", icon: Heart, color: "from-pink-500/20 to-rose-500/20" },
    { id: 16, name: "Animation", icon: Zap, color: "from-green-500/20 to-emerald-500/20" },
    { id: 99, name: "Documentary", icon: Globe, color: "from-amber-500/20 to-yellow-600/20" },
    { id: 10402, name: "Music", icon: Music, color: "from-fuchsia-500/20 to-pink-600/20" },
    { id: 37, name: "Western", icon: Trophy, color: "from-orange-700/20 to-red-800/20" },
];

export function GenreGrid({ selectedGenres, onToggleGenre }: { selectedGenres: string[], onToggleGenre: (id: string) => void }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(String(genre.id));
                const Icon = genre.icon;
                
                return (
                    <button
                        key={genre.id}
                        onClick={() => onToggleGenre(String(genre.id))}
                        className={`
                            relative h-20 rounded-xl overflow-hidden group transition-all duration-300
                            flex items-center justify-center gap-3 border
                            ${isSelected 
                                ? 'bg-white text-black border-white scale-[1.02] shadow-xl' 
                                : 'bg-zinc-900/50 hover:bg-zinc-800 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                            }
                        `}
                    >
                        {/* Background Gradient */}
                        {!isSelected && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        )}

                        <Icon size={24} className={`relative z-10 transition-transform duration-300 ${!isSelected && 'group-hover:scale-110'}`} />
                        <span className="relative z-10 font-bold text-lg tracking-tight">{genre.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
