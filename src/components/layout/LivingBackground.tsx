"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const LivingBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020205] pointer-events-none">
            {/* Ambient Aura 1 - Reduced complexity */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{ willChange: "transform, opacity" }}
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] aura-blur bg-primary/30 rounded-full"
            />

            {/* Ambient Aura 2 - Smoother, less movement */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                style={{ willChange: "transform, opacity" }}
                className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] aura-blur bg-indigo-600/20 rounded-full"
            />

            {/* Ambient Aura 3 */}
            <motion.div
                animate={{
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
                style={{ willChange: "opacity" }}
                className="absolute top-[30%] right-[10%] w-[30%] h-[30%] aura-blur bg-purple-600/20 rounded-full"
            />

            {/* Static Grain Overlay (Removed animation) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
        </div>
    );
};
