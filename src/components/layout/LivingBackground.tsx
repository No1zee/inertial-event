"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const LivingBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020205] pointer-events-none">
            {/* Ambient Aura 1 */}
            <motion.div
                animate={{
                    x: [0, 100, -50],
                    y: [0, -50, 50],
                    scale: [1, 1.2, 0.9],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] aura-blur bg-primary/40 rounded-full"
            />

            {/* Ambient Aura 2 */}
            <motion.div
                animate={{
                    x: [0, -150, 100],
                    y: [0, 100, -80],
                    scale: [1, 1.3, 0.8],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] aura-blur bg-indigo-600/20 rounded-full"
            />

            {/* Ambient Aura 3 */}
            <motion.div
                animate={{
                    x: [0, 50, -30],
                    y: [0, 80, 20],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-[30%] right-[10%] w-[30%] h-[30%] aura-blur bg-purple-600/20 rounded-full"
            />

            {/* Scanline/Noise Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] animate-pulse pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
        </div>
    );
};
