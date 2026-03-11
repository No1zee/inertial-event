"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, Heart } from "lucide-react";
import { Content } from "@/lib/types/content";

interface AuntiesHeroProps {
    item?: Content;
}

export function AuntiesHero({ item }: AuntiesHeroProps) {
    const router = useRouter();

    if (!item) return null;

    const handleWatch = () => {
        router.push(`/watch/${item.type}/${item.id}`);
    };

    return (
        <section className="relative h-[75vh] md:h-[88vh] w-full overflow-hidden">
            {/* Background Image with Warm Overlay */}
            <div className="absolute inset-0">
                {item.backdrop && (
                    <img
                        src={`https://image.tmdb.org/t/p/original${item.backdrop}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                )}
                {/* Warm Gold Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/40 via-transparent to-purple-900/20" />
            </div>

            {/* Content */}
            <div className="relative z-20 h-full flex items-center px-6 md:px-12 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl"
                >
                    {/* Channel Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-amber-500/20 rounded-xl px-5 py-3 mb-6"
                    >
                        <img src="/providers/aunties.svg" alt="Aunties Logo" className="w-8 h-8 object-contain" />
                        <span className="text-amber-200 text-lg font-serif tracking-widest uppercase italic">The Aunties' Choice</span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-amber-50 mb-4 leading-tight drop-shadow-2xl">
                        {item.title}
                    </h1>

                    <p className="text-zinc-300 text-base md:text-lg mb-8 line-clamp-3 leading-relaxed">
                        {item.description || "A heartwarming story for the whole family."}
                    </p>

                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleWatch}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-amber-900/50"
                        >
                            <Play className="w-5 h-5 fill-white" />
                            <span>Watch Now</span>
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </section>
    );
}
