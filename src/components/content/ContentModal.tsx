import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { useRouter } from 'next/navigation';

export const ContentModal = () => {
    const { isModalOpen, modalContent, closeModal } = useUIStore();
    const router = useRouter();

    if (!modalContent) return null;

    const handlePlay = () => {
        closeModal();
        router.push(`/watch/${modalContent.id}?type=${modalContent.type || 'movie'}`);
    };

    return (
        <Dialog.Root open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl bg-zinc-950 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 p-0 outline-none">
                    <div className="relative aspect-video w-full">
                        <img
                            src={modalContent.backdrop || modalContent.poster}
                            alt={modalContent.title}
                            className="h-full w-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                        <div className="absolute top-0 right-0 p-4">
                            <button
                                onClick={closeModal} // Fix: Directly call closeModal
                                className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-xl">{modalContent.title}</h2>

                            <div className="flex items-center gap-3 text-sm font-medium text-zinc-300">
                                <span className="text-green-400 font-bold">{Math.round((modalContent.rating || 0) * 10)}% Match</span>
                                <span>{modalContent.releaseDate?.substring(0, 4)}</span>
                                <span className="uppercase border border-white/20 px-1.5 rounded bg-black/40 text-[10px]">{modalContent.type}</span>
                            </div>

                            <p className="text-lg text-zinc-200 line-clamp-3 max-w-2xl leading-relaxed">
                                {modalContent.description}
                            </p>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={handlePlay}
                                    className="flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-bold text-black transition-transform hover:scale-105 active:scale-95 hover:bg-zinc-200"
                                >
                                    <Play fill="currentColor" size={20} />
                                    Play
                                </button>
                                <button className="flex items-center gap-2 rounded-lg bg-zinc-800/80 backdrop-blur-md px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 border border-white/10">
                                    More Info
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Potential Cast/Recommendations Section could go here below the fold */}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ContentModal;
