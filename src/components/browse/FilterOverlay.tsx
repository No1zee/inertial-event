"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterState {
    genres: string[];
    type: 'movie' | 'tv' | 'all';
    sort: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';
}

interface FilterOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
}

const GENRES = [
    { id: "28,10759", name: "Action" },
    { id: "12,10759", name: "Adventure" },
    { id: "16", name: "Animation" },
    { id: "35", name: "Comedy" },
    { id: "80", name: "Crime" },
    { id: "99", name: "Documentary" },
    { id: "18", name: "Drama" },
    { id: "10751", name: "Family" },
    { id: "14,10765", name: "Fantasy" },
    { id: "36", name: "History" },
    { id: "27", name: "Horror" },
    { id: "10402", name: "Music" },
    { id: "9648", name: "Mystery" },
    { id: "10749", name: "Romance" },
    { id: "878,10765", name: "Sci-Fi" },
    { id: "53", name: "Thriller" },
];

const SORT_OPTIONS = [
    { id: "popularity.desc", name: "Most Popular" },
    { id: "vote_average.desc", name: "Highest Rated" },
    { id: "primary_release_date.desc", name: "Newest Releases" },
];

export function FilterOverlay({ isOpen, onClose, filters, setFilters }: FilterOverlayProps) {
    const toggleGenre = (id: string) => {
        const current = filters.genres;
        const next = current.includes(id)
            ? current.filter(g => g !== id)
            : [...current, id];
        setFilters({ ...filters, genres: next });
    };

    const resetFilters = () => {
        setFilters({
            genres: [],
            type: 'all',
            sort: 'popularity.desc'
        });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-[#141414] shadow-xl border-l border-white/10">
                                        <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                                            <Dialog.Title className="text-xl font-bold text-white">Filters</Dialog.Title>
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={resetFilters}
                                                    className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                                                >
                                                    Reset All
                                                </button>
                                                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 px-6 py-6 space-y-8">
                                            {/* Type */}
                                            <div>
                                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Content Type</h3>
                                                <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                                                    {(['all', 'movie', 'tv'] as const).map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setFilters({ ...filters, type: t })}
                                                            className={cn(
                                                                "flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize",
                                                                filters.type === t
                                                                    ? "bg-white text-black shadow-lg"
                                                                    : "text-zinc-400 hover:text-white"
                                                            )}
                                                        >
                                                            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sort */}
                                            <div>
                                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Sort By</h3>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {SORT_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setFilters({ ...filters, sort: opt.id as any })}
                                                            className={cn(
                                                                "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                                                                filters.sort === opt.id
                                                                    ? "bg-red-600/10 border-red-600 text-red-500"
                                                                    : "bg-zinc-900/50 border-white/5 text-zinc-300 hover:border-zinc-700"
                                                            )}
                                                        >
                                                            {opt.name}
                                                            {filters.sort === opt.id && <Check size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Genres */}
                                            <div>
                                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Genres</h3>
                                                <div className="grid grid-cols-2 gap-2 pb-10">
                                                    {GENRES.map((genre) => (
                                                        <button
                                                            key={genre.id}
                                                            onClick={() => toggleGenre(genre.id)}
                                                            className={cn(
                                                                "px-3 py-3 rounded-xl text-sm font-medium border transition-all text-left truncate relative group",
                                                                filters.genres.includes(genre.id)
                                                                    ? "bg-white text-black border-white shadow-lg"
                                                                    : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-zinc-700 hover:text-white"
                                                            )}
                                                        >
                                                            {genre.name}
                                                            {filters.genres.includes(genre.id) && (
                                                                <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-600 rounded-full" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md sticky bottom-0">
                                            <button
                                                onClick={onClose}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95"
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
