import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

import { contentApi } from '@/lib/api/content';
// ... imports

export const ContentModal = () => {
    const { isModalOpen, modalContent, closeModal } = useUIStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<'overview' | 'episodes' | 'related'>('overview');
    const [selectedSeason, setSelectedSeason] = React.useState(1);
    const [fullDetails, setFullDetails] = React.useState<any>(null);
    const [showHeroOverlay, setShowHeroOverlay] = React.useState(true);
    const [episodes, setEpisodes] = React.useState<any[]>([]);

    const content = fullDetails || modalContent;

    React.useEffect(() => {
        if (isModalOpen && modalContent) {
            setActiveTab('overview');
            setSelectedSeason(1);
            setFullDetails(null); // Reset
            setShowHeroOverlay(true);

            // Fetch full details (cast, seasons, recommendations)
            const type = modalContent.type || 'movie';
            contentApi.getDetails(modalContent.id, type).then(data => {
                if (data) setFullDetails(data);
            });
        }
    }, [isModalOpen, modalContent]);

    React.useEffect(() => {
        if (isModalOpen && content && (content.type === 'tv' || (content as any).seasonsList?.length > 0)) {
            setEpisodes([]); // Clear previous
            contentApi.getSeasonDetails(content.id, selectedSeason).then(data => {
                if (data && data.episodes) {
                    setEpisodes(data.episodes);
                }
            });
        }
    }, [isModalOpen, content?.id, selectedSeason]);

    React.useEffect(() => {
        if (content?.trailer) {
            const timer = setTimeout(() => setShowHeroOverlay(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [content?.trailer]);

    if (!content) return null;

    const handlePlay = () => {
        closeModal();
        const type = content.type || ((content as any).seasonsList?.length > 0 ? 'tv' : 'movie');
        // Play S1E1 by default for TV if not specified, or resume logic later
        router.push(`/watch/${content.id}?type=${type}&season=1&episode=1`);
    };

    const handleEpisodeClick = (seasonNum: number, episodeNum: number) => {
        closeModal();
        const type = content.type || 'tv';
        router.push(`/watch/${content.id}?type=${type}&season=${seasonNum}&episode=${episodeNum}`);
    };

    const isTV = content.type === 'tv' || (content.seasonsList && content.seasonsList.length > 0);

    return (
        <Dialog.Root open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] md:w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl bg-zinc-950/90 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 p-0 outline-none max-h-[90vh] flex flex-col">
                    <Dialog.Description className="sr-only">
                        Details for {content.title}
                    </Dialog.Description>

                    {/* Hero Header */}
                    <div className="relative w-full aspect-video md:aspect-[2.4/1] bg-black shrink-0">
                        {content.trailer ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${content.trailer}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${content.trailer}`}
                                className="w-full h-full opacity-60 pointer-events-none scale-125"
                                allow="autoplay; encrypted-media"
                            />
                        ) : (
                            <img
                                src={content.backdrop || content.poster}
                                alt={content.title}
                                className="w-full h-full object-cover opacity-60"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={closeModal}
                                className="rounded-full bg-black/40 p-2 text-white hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className={cn(
                                "absolute bottom-0 left-0 p-4 md:p-8 space-y-2 md:space-y-4 max-w-3xl transition-opacity duration-1000",
                                showHeroOverlay ? "opacity-100" : "opacity-0 hover:opacity-100"
                            )}
                        >
                            <Dialog.Title className="text-2xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-xl line-clamp-1">
                                {content.title}
                            </Dialog.Title>

                            <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-zinc-300">
                                <span className="text-green-400 font-bold">{Math.round((content.rating || 0) * 10)}% Match</span>
                                <span>{content.releaseDate?.substring(0, 4)}</span>
                                <span className="uppercase border border-white/20 px-1.5 rounded bg-white/10 text-[10px]">{content.type || (isTV ? 'TV' : 'MOVIE')}</span>
                                {content.duration && <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>}
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <button
                                    onClick={handlePlay}
                                    className="flex items-center gap-2 rounded-lg bg-white px-6 md:px-8 py-2 md:py-3 font-bold text-black transition-transform hover:scale-105 active:scale-95 hover:bg-zinc-200 text-sm md:text-base"
                                >
                                    <Play fill="currentColor" size={20} />
                                    Play
                                </button>
                                <button className="flex items-center gap-2 rounded-lg bg-zinc-800/80 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 font-medium text-white transition-colors hover:bg-zinc-700 border border-white/10 text-sm md:text-base">
                                    + My List
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950/50 backdrop-blur-xl">
                        <div className="p-4 md:p-8">

                            {/* Tabs */}
                            <div className="flex items-center gap-8 border-b border-white/10 mb-6 text-sm font-medium text-zinc-400">
                                <button
                                    className={cn("pb-4 border-b-2 transition-colors", activeTab === 'overview' ? "text-white border-white" : "border-transparent hover:text-white")}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Overview
                                </button>
                                {isTV && (
                                    <button
                                        className={cn("pb-4 border-b-2 transition-colors", activeTab === 'episodes' ? "text-white border-white" : "border-transparent hover:text-white")}
                                        onClick={() => setActiveTab('episodes')}
                                    >
                                        Episodes
                                    </button>
                                )}
                                <button
                                    className={cn("pb-4 border-b-2 transition-colors", activeTab === 'related' ? "text-white border-white" : "border-transparent hover:text-white")}
                                    onClick={() => setActiveTab('related')}
                                >
                                    More Like This
                                </button>
                            </div>

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-6">
                                        <p className="text-lg text-zinc-300 leading-relaxed">
                                            {content.description}
                                        </p>

                                        {/* Cast */}
                                        {content.cast && content.cast.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-white font-semibold">Cast</h3>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                                    {content.cast.slice(0, 10).map((actor) => (
                                                        <div key={actor.id} className="space-y-1 text-center group cursor-pointer">
                                                            <div className="aspect-square rounded-full overflow-hidden bg-zinc-800 border border-white/5">
                                                                <img
                                                                    src={actor.profilePath || "/images/placeholder.png"}
                                                                    alt={actor.name}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                />
                                                            </div>
                                                            <div className="text-xs text-white font-medium truncate">{actor.name}</div>
                                                            <div className="text-[10px] text-zinc-500 truncate">{actor.character}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6 text-sm text-zinc-400">
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase mb-1">Genres</span>
                                            <div className="flex flex-wrap gap-2">
                                                {content.genres.map(g => (
                                                    <span key={g} className="text-white bg-white/5 px-2 py-1 rounded border border-white/5">{g}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase mb-1">Status</span>
                                            <span className="text-white">{content.status}</span>
                                        </div>
                                        {/* Could add Network, production companies, etc here */}
                                    </div>
                                </div>
                            )}

                            {/* Episodes Tab */}
                            {activeTab === 'episodes' && isTV && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-white font-semibold text-lg">Seasons</h3>
                                        <select
                                            value={selectedSeason}
                                            onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                            className="bg-zinc-800 text-white rounded px-3 py-1.5 border border-white/10 outline-none focus:border-white/30"
                                        >
                                            {content.seasonsList?.filter((s: any) => s.season_number > 0).map((s: any) => (
                                                <option key={s.id} value={s.season_number}>{s.name} ({s.episode_count} Episodes)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {episodes.length > 0 ? (
                                            episodes.map((ep: any) => (
                                                <div
                                                    key={ep.id}
                                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/5"
                                                    onClick={() => handleEpisodeClick(selectedSeason, ep.episode_number)}
                                                >
                                                    <div className="w-8 text-center text-zinc-500 font-mono text-lg group-hover:text-white transition-colors">{ep.episode_number}</div>
                                                    <div className="aspect-video w-32 bg-zinc-800 rounded overflow-hidden relative shrink-0">
                                                        {ep.still_path ? (
                                                            <img
                                                                src={`http://localhost:3000/tmdb-img/w500/${ep.still_path}`}
                                                                alt={ep.name}
                                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                                <Play size={20} className="text-zinc-600" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Play size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-medium group-hover:text-green-400 transition-colors truncate">{ep.name}</h4>
                                                        <p className="text-sm text-zinc-500 line-clamp-2">{ep.overview || "No description available."}</p>
                                                    </div>
                                                    <div className="text-zinc-500 text-sm whitespace-nowrap">{ep.runtime ? `${ep.runtime}m` : ''}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-zinc-500 text-center py-8">Loading episodes...</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Related Tab */}
                            {activeTab === 'related' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {content.recommendations?.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="group relative aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden cursor-pointer"
                                            onClick={() => {
                                                closeModal();
                                                setTimeout(() => useUIStore.getState().openModal(item), 100);
                                            }}
                                        >
                                            <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play className="text-white fill-white" size={32} />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                                                <p className="text-white text-xs font-bold truncate">{item.title}</p>
                                                <p className="text-zinc-400 text-[10px]">{item.releaseDate?.substring(0, 4)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!content.recommendations || content.recommendations.length === 0) && (
                                        <p className="col-span-full text-zinc-500 text-center py-8">No specific recommendations found.</p>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ContentModal;
