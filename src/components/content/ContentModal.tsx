"use client";

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useModalStore } from '@/lib/store/modalStore';
import { Play, Plus, Check, X, Star, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useRouter } from 'next/navigation';
import { useWatchlistStore } from '@/lib/store/watchlistStore';
import { cn } from '@/lib/utils';
import { contentApi } from '@/lib/api/content';

export default function ContentModal() {
    const { isOpen, content, closeModal } = useModalStore();
    const router = useRouter();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
    const [detailedContent, setDetailedContent] = useState<any>(null);

    const inWatchlist = content ? isInWatchlist(String(content.id)) : false;

    // Reset detailed content when modal opens with new content
    useEffect(() => {
        if (isOpen && content) {
            setDetailedContent(content); // Show initial data immediately
            
            // Fetch full details if needed (e.g. for seasons, similar items)
            // Determine type safely
            const type = content.type || ((content as any).seasonsList?.length > 0 ? 'tv' : 'movie');
            const apiType = type === 'anime' ? 'tv' : type;

            contentApi.getDetails(content.id, apiType as 'movie' | 'tv').then(details => {
                 if (details) setDetailedContent(details);
            });
        }
    }, [isOpen, content]);

    if (!content) return null;

    const handlePlay = () => {
        closeModal();
        const type = content.type || ((content as any).seasonsList?.length > 0 ? 'tv' : 'movie');
        router.push(`/watch?id=${content.id}&type=${type}`);
    };

    const toggleWatchlist = () => {
        if (inWatchlist) {
            removeFromWatchlist(String(content.id));
        } else {
            addToWatchlist(content);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={closeModal} className="relative z-50">
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                {/* Modal Position */}
                <div className="fixed inset-0 overflow-y-auto w-screen p-4 sm:p-6 md:p-20 flex items-center justify-center">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95 translate-y-10"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100 translate-y-0"
                        leaveTo="opacity-0 scale-95 translate-y-10"
                    >
                        <Dialog.Panel className="w-full max-w-5xl bg-[#141414] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative">
                            {/* Close Button */}
                            <button 
                                onClick={closeModal}
                                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {/* Hero Section */}
                            <div className="relative aspect-video w-full">
                                <div className="absolute inset-0">
                                    <img 
                                        src={content.backdrop || content.poster} 
                                        alt={content.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                                </div>

                                <div className="absolute bottom-0 left-0 p-8 sm:p-12 w-full">
                                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 drop-shadow-lg tracking-tight">
                                        {content.title}
                                    </h2>

                                    <div className="flex items-center gap-4 text-sm sm:text-base font-medium text-zinc-300 mb-6">
                                        <span className="text-green-400 font-bold flex items-center gap-1">
                                            <Star size={16} fill="currentColor" />
                                            {Math.round((content.rating || 0) * 10)}% Match
                                        </span>
                                        <span>{content.releaseDate?.substring(0, 4)}</span>
                                        {detailedContent?.duration && (
                                            <span className="flex items-center gap-1">
                                                 <Clock size={16} /> {detailedContent.duration}m
                                            </span>
                                        )}
                                        <span className="border border-zinc-600 px-1.5 py-0.5 rounded text-xs uppercase bg-zinc-800/60">
                                            {content.type === 'tv' ? 'Series' : 'Movie'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button 
                                            size="lg" 
                                            onClick={handlePlay}
                                            className="bg-white text-black hover:bg-zinc-200 font-bold px-8 h-12 text-lg rounded-lg shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <Play size={20} fill="currentColor" className="mr-2" />
                                            Play
                                        </Button>

                                        <button
                                            onClick={toggleWatchlist}
                                            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-zinc-500 text-zinc-300 hover:border-white hover:text-white transition-colors bg-black/40 backdrop-blur-sm"
                                        >
                                            {inWatchlist ? <Check size={24} /> : <Plus size={24} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
                                <div className="md:col-span-2 space-y-6">
                                    {/* Synopsis */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-1 w-8 bg-red-600 rounded-full" />
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Synopsis</span>
                                        </div>
                                        <p className="text-lg text-zinc-200 leading-relaxed font-light">
                                            {content.description || "No description available."}
                                        </p>
                                    </div>

                                    {/* Cast ?? */}
                                    {detailedContent?.cast && detailedContent.cast.length > 0 && (
                                        <div className="pt-4">
                                            <span className="text-zinc-500 text-sm font-semibold mb-2 block">Starring</span>
                                            <div className="flex flex-wrap gap-2">
                                                {detailedContent.cast.slice(0, 5).map((c: any) => (
                                                    <span key={c.id} className="text-zinc-300 text-sm bg-zinc-800/50 px-3 py-1 rounded-full">
                                                        {c.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                                        <h3 className="text-white font-bold mb-4">Info</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Original Title</span>
                                                <span className="text-zinc-300 text-right">{content.title}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Release Date</span>
                                                <span className="text-zinc-300 text-right">{content.releaseDate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Status</span>
                                                <span className="text-zinc-300 capitalize">{content.status || 'Released'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Genres */}
                                    {content.genres && content.genres.length > 0 && (
                                        <div>
                                            <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-2 block">Genres</span>
                                            <div className="flex flex-wrap gap-2">
                                                {content.genres.map((g: string) => (
                                                    <span key={g} className="text-xs text-zinc-400 border border-zinc-700 px-2 py-1 rounded hover:border-zinc-500 transition-colors cursor-default">
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
