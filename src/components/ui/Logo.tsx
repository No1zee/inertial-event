'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

export function Logo({ className, size = 'md', showText = true, animated = true }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        whileHover={animated ? { 
          scale: 1.1,
          rotate: [0, -10, 10, 0],
          transition: { duration: 0.5 }
        } : {}}
        className={cn(
          'bg-linear-to-tr from-primary to-accent rounded-[var(--radius-theme)] flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-700',
          sizes[size]
        )}
      >
        <div className="relative flex items-center justify-center">
          <Play fill="white" className="w-[50%] h-[50%] text-white ml-0.5" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sparkles className="w-full h-full text-white/50" />
          </motion.div>
        </div>
      </motion.div>

      {showText && (
        <div className={cn('flex flex-col leading-none font-display', textSizes[size])}>
          <span className="font-black text-foreground uppercase tracking-tighter italic">
            NOVA<span className="text-primary">STREAM</span>
          </span>
        </div>
      )}
    </div>
  );
}
