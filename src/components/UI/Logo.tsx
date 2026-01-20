"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    animated?: boolean;
}

export function Logo({ className, size = 'md', showText = true, animated = true }: LogoProps) {
    const sizes = {
        sm: 'w-6 h-6 text-sm',
        md: 'w-8 h-8 text-lg',
        lg: 'w-10 h-10 text-xl',
        xl: 'w-16 h-16 text-3xl',
    };

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-9 h-9',
        xl: 'w-14 h-14',
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <motion.div 
                whileHover={animated ? { scale: 1.05, rotate: -5 } : {}}
                className={cn(
                    "bg-gradient-to-br from-red-500 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20",
                    sizes[size].split(' ')[0],
                    sizes[size].split(' ')[1]
                )}
            >
                <span className="font-bold text-white italic">N</span>
            </motion.div>
            
            {showText && (
                <span className={cn(
                    "font-bold tracking-tight text-white",
                    size === 'sm' && 'text-sm',
                    size === 'md' && 'text-xl',
                    size === 'lg' && 'text-2xl',
                    size === 'xl' && 'text-4xl'
                )}>
                    Nova<span className="text-red-600">Stream</span>
                </span>
            )}
        </div>
    );
}
