"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Plus, Info, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/lib/types/content";

interface ContentCardProps {
    item: Content;
    aspectRatio?: "portrait" | "landscape";
    showDetails?: boolean;
}

import { useUIStore } from "@/lib/store/uiStore";

export function ContentCard({ item, aspectRatio = "portrait" }: ContentCardProps) {
    const isPortrait = aspectRatio === "portrait";
    const { openModal } = useUIStore();

    // Animation variants
    const cardVariants = {
        rest: { scale: 1, y: 0, zIndex: 0, transition: { duration: 0.3, ease: "easeInOut" } },
        hover: { scale: 1.05, y: -8, zIndex: 50, boxShadow: "var(--glow-nova)", transition: { duration: 0.3, ease: "easeOut" } }
    };

    const overlayVariants = {
        rest: { opacity: 0, y: 10 },
        hover: { opacity: 1, y: 0, transition: { duration: 0.2, delay: 0.1 } }
    };

    return (
        <motion.div
            className={cn(
                "relative rounded-xl overflow-hidden bg-zinc-900 cursor-pointer group border border-white/5 shrink-0",
                isPortrait ? "w-[160px] md:w-[200px] aspect-[2/3]" : "w-[260px] aspect-video"
            )}
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={cardVariants}
            onClick={() => openModal(item)}
        >
            {/* Poster Image with Zoom Effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <motion.img
                    src={item.poster || "/images/placeholder.png"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    variants={{ rest: { scale: 1 }, hover: { scale: 1.1 } }}
                    transition={{ duration: 0.5 }}
                />
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
                    variants={{ rest: { opacity: 0.6 }, hover: { opacity: 0.9 } }}
                />
            </div>

            {/* Content Overlay */}
            <motion.div
                className="absolute inset-0 p-4 flex flex-col justify-end"
                variants={overlayVariants}
            >
                <div className="space-y-2">
                    {/* Play/Add Buttons */}
                    <div className="flex gap-2 pb-2">
                        <motion.button
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200"
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Direct play if play button clicked
                                const type = item.type || ((item as any).seasonsList?.length > 0 ? 'tv' : 'movie');
                                window.location.href = `/watch/${item.id}?type=${type}`;
                            }}
                        >
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                        </motion.button>
                        <motion.button
                            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/20"
                            whileTap={{ scale: 0.9 }}
                        >
                            <Plus size={18} />
                        </motion.button>
                    </div>

                    {/* Text Metadata */}
                    <div>
                        <h3 className="font-bold text-white text-base leading-tight line-clamp-2 drop-shadow-md">
                            {item.title}
                        </h3>
                        {/* ... existing metadata ... */}
                        <div className="flex items-center gap-2 mt-2 text-xs font-medium text-zinc-300">
                            <span className="text-green-400 font-bold">{Math.round((item.rating || 0) * 10)}% Match</span>
                            <span>•</span>
                            <span>{item.releaseDate?.substring(0, 4) || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
