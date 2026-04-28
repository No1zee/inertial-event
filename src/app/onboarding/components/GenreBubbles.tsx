'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

interface Genre {
  id: string;
  name: string;
  icon: string;
}

interface GenreBubblesProps {
  genres: Genre[];
  weights: Record<string, number>;
  onWeightChange: (id: string, newWeight: number) => void;
}

export function GenreBubbles({ genres, weights, onWeightChange }: GenreBubblesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAction = (id: string, delta: number) => {
    const current = weights[id] || 0;
    const next = Math.max(0, Math.min(5, current + delta));
    onWeightChange(id, next);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center"
    >
      {/* Central Construct Circle */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/5 animate-[spin_60s_linear_infinite]" />
      <div className="absolute inset-[10%] rounded-full border border-white/5 animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute inset-[20%] rounded-full border border-white/10" />

      {/* Bubbles Container */}
      <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-4 p-8">
        {genres.map((genre, index) => {
          const weight = weights[genre.id] || 0;
          const size = 60 + weight * 25; // Base 60px + 25px per weight level
          
          return (
            <motion.div
              key={genre.id}
              layout
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                width: size,
                height: size,
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20 
              }}
              className="relative group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(genre.id, 1);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                // Since single click already fired, we need to go down by 2 to offset the single click + the intended decrease
                // Actually, let's just use a simple button overlay for minus to be safe and accessible, 
                // but for the 'cool' effect we'll use double click logic if possible.
                handleAction(genre.id, -2);
              }}
            >
              <motion.div 
                className={`w-full h-full rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-500 shadow-2xl relative overflow-hidden ${
                  weight > 0 
                    ? 'bg-primary border-none shadow-primary/20' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Glow Effect for High Weight */}
                {weight > 3 && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                )}

                <span className="text-xl md:text-2xl" style={{ fontSize: `${14 + weight * 4}px` }}>
                  {genre.icon}
                </span>
                <span 
                  className={`font-black uppercase tracking-tighter text-center leading-none px-2 ${
                    weight > 0 ? 'text-black' : 'text-zinc-500'
                  }`}
                  style={{ fontSize: `${Math.max(6, 8 + weight * 1)}px` }}
                >
                  {genre.name}
                </span>

                {/* Minus Indicator on Hover */}
                {weight > 0 && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center">
                      <Minus size={10} className={weight > 0 ? 'text-black' : 'text-white'} />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Weight Indicator Particles */}
              <AnimatePresence>
                {weight > 0 && Array.from({ length: weight }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-primary z-10"
                    style={{ 
                      transform: `rotate(${i * 45}deg) translateY(-${size/2}px)` 
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Instruction Overlay */}
      <div className="absolute -bottom-12 left-0 right-0 text-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          Click to amplify <span className="text-primary mx-2">•</span> Double-click to reduce
        </p>
      </div>
    </div>
  );
}
