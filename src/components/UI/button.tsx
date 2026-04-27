'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  state?: 'default' | 'loading' | 'success' | 'error';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', state = 'default', children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-[hsl(var(--brand-primary))] text-white hover:bg-[hsl(var(--brand-primary))]/90 shadow-lg hover:shadow-xl',
      secondary:
        'bg-[hsl(var(--surface-deep))] text-[hsl(var(--foreground))] border border-[hsl(var(--brand-primary))]/10 hover:bg-[hsl(var(--surface-muted))]',
      ghost:
        'bg-transparent text-[hsl(var(--foreground))]/60 hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))]',
      danger: 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20',
      outline:
        'bg-transparent border border-[hsl(var(--brand-primary))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-3 text-sm font-semibold',
      lg: 'px-8 py-4 text-base font-bold',
      icon: 'p-2 aspect-square flex items-center justify-center h-10 w-10',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative rounded-full inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={state === 'loading' || disabled}
        whileHover={state === 'default' && !disabled ? { scale: 1.02, y: -1 } : {}}
        whileTap={state === 'default' && !disabled ? { scale: 0.98 } : {}}
        layout
        {...(props as Record<string, unknown>)} // Cast to unknown record to avoid complex framer-motion type conflicts with ref
      >
        {state === 'loading' && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </motion.div>
        )}

        {children}

        {state === 'success' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 text-green-500">
            <Check size={18} />
          </motion.div>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
