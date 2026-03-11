"use client";

import { motion } from "framer-motion";

interface BumpBlockProps {
    text: string;
    subtext?: string;
    alignment?: "left" | "center" | "right";
}

export function BumpBlock({ text, subtext, alignment = "left" }: BumpBlockProps) {
    const alignClass = {
        left: "text-left items-start",
        center: "text-center items-center",
        right: "text-right items-end"
    }[alignment];

    return (
        <div className={`w-full py-16 px-6 md:px-12 lg:px-16 flex flex-col ${alignClass} bg-black/40 backdrop-blur-sm border-y border-white/5`}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl"
            >
                <p className="text-white text-xl md:text-2xl font-medium tracking-tight leading-relaxed mb-4">
                    {text}
                </p>
                {subtext && (
                    <p className="text-zinc-600 text-xs md:text-sm font-black uppercase tracking-[0.3em]">
                        {subtext}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
