'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Palmtree } from 'lucide-react';

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
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        whileHover={animated ? { scale: 1.05 } : {}}
        className={cn(
          'bg-white rounded-full flex items-center justify-center shadow-md border border-[hsl(var(--border))]',
          sizes[size]
        )}
      >
        <div className="relative flex items-center justify-center">
          <Palmtree className="w-[70%] h-[70%] text-primary -rotate-12 absolute -translate-x-1" />
          <Palmtree className="w-[70%] h-[70%] text-primary rotate-12 absolute translate-x-1" />
        </div>
      </motion.div>

      {showText && (
        <div className={cn('flex flex-col leading-none font-display', textSizes[size])}>
          <span className="font-black text-primary uppercase tracking-tight">
            Nova<span className="text-white">Stream</span>
          </span>
        </div>
      )}
    </div>
  );
}
