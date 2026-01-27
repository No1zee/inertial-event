"use client";

import { motion } from "framer-motion";
import { Content } from "@/lib/types/content";
import { Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/UI/button";
import { useState, useEffect } from "react";

interface AdultSwimHeroProps {
    item: Content;
}

export function AdultSwimHero({ item }: AdultSwimHeroProps) {
    const [phrase, setPhrase] = useState("");
    
    // Some dry, sarcastic phrases for the "Bump" style
    const phrases = [
        "Everything you want. None of what you need.",
        "It's late. Do you know where your life went?",
        "Watching this won't make you smarter. But it helps.",
        "Adult Swim. We're as confused as you are.",
        "Rick and Morty is here. The internet is happy now.",
        "Zero calories. No nutritional value. 100% content.",
        "Go to bed. Or don't. We're not your parents.",
        "This is television. Sort of.",
        "Reality is overrated. Have some cartoons.",
        "We spent five dollars on this background.",
        "JUST STARE BLANKLY.",
        "WASTE YOUR TIME WITH US.",
        "YOU ARE STILL WATCHING.",
        "THIS IS NOT A TEST. THIS IS NONSENSE.",
        "CARTOONS FOR PEOPLE WHO FORGOT HOW TO SLEEP."
    ];
    
    useEffect(() => {
        setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    }, []);

    if (!item) return null;

    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <section className="relative h-[72vh] md:h-[85vh] w-full bg-black flex items-center justify-center overflow-hidden font-sans">
            {/* Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            
            <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl">
                {/* Time/Schedule Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 text-zinc-600 font-mono text-xs tracking-widest uppercase cursor-default select-none whitespace-nowrap"
                >
                    <span>{currentTime}</span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <span>Live Stream Active</span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <span className="text-zinc-400">Next: Offbeat Live-Action</span>
                </motion.div>                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-12 relative"
                >
                    <motion.div 
                        animate={{ 
                            opacity: [1, 0.8, 1, 0.9, 1],
                            filter: ["brightness(1)", "brightness(1.5)", "brightness(1)", "brightness(1.2)", "brightness(1)"]
                        }}
                        transition={{ repeat: Infinity, duration: 2, times: [0, 0.1, 0.2, 0.3, 1] }}
                        className="text-white font-black text-3xl md:text-5xl tracking-tighter border-[4px] border-white px-6 py-2 inline-block select-none"
                    >
                        [adult swim]
                    </motion.div>
                    <div className="absolute -inset-1 border border-white/20 blur-sm pointer-events-none" />
                </motion.div>

                <div className="h-32 md:h-48 flex items-center justify-center mb-8">
                    <motion.h1 
                        key={phrase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1.5 }}
                        className="text-white text-2xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-snug max-w-2xl px-4"
                    >
                        {phrase}
                    </motion.h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="space-y-6"
                >
                    <div className="space-y-1">
                        <h2 className="text-zinc-600 text-xs md:text-sm uppercase tracking-[0.4em] font-black">Playing Tonight</h2>
                        <p className="text-white text-3xl md:text-5xl font-black tracking-tighter uppercase">{item.title}</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 pt-6">
                        <Link href={`/watch?id=${String(item.id).replace('tmdb_', '')}&type=${item.type}`}>
                            <Button className="bg-white text-black hover:bg-zinc-200 rounded-none px-10 py-7 text-xl font-black tracking-tighter h-auto transition-transform hover:scale-105 active:scale-95 shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
                                <Play size={24} fill="currentColor" className="mr-3" />
                                WATCH NOW
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Subtle floating elements (Optional branding) */}
            <div className="absolute bottom-8 left-8 text-zinc-900 font-black text-8xl md:text-9xl select-none pointer-events-none opacity-40">
                [as]
            </div>
            
            <div className="absolute top-8 right-8 text-zinc-900 font-black text-4xl select-none pointer-events-none opacity-40">
                LATE NIGHT
            </div>

            {/* Bottom Gradient for Rail Transition */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-20" />
        </section>
    );
}
