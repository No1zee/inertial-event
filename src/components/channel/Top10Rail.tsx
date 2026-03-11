"use client";

import { motion } from "framer-motion";
import { Content } from "@/lib/types/content";
import { ContentCard } from "../content/ContentCard";

interface Top10RailProps {
    title: string;
    items?: Content[];
}

export function Top10Rail({ title, items }: Top10RailProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="space-y-4 py-8">
            <h2 className="text-2xl md:text-3xl font-black text-white px-4 md:px-12 tracking-tight">
                {title}
            </h2>
            
            <div className="flex gap-12 overflow-x-auto pb-8 scrollbar-hide px-4 md:px-12">
                {items.slice(0, 10).map((item, index) => (
                    <div key={item.id} className="relative flex-shrink-0 flex items-end group">
                        {/* Number Indicator */}
                        <div className="absolute -left-10 bottom-0 z-0">
                            <span className="text-[12rem] font-black leading-none text-zinc-800/50 outline-zinc-500 drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] select-none">
                                {index + 1}
                            </span>
                        </div>
                        
                        {/* Card */}
                        <div className="relative z-10 w-40 md:w-48 ml-4 transition-transform group-hover:scale-105 duration-300">
                            <ContentCard item={item} aspectRatio="portrait" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
