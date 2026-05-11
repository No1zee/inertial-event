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
        'bg-linear-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] text-white shadow-[0_0_var(--glow-spread)_rgba(var(--brand-primary-rgb),var(--glow-opacity))] hover:shadow-[0_0_calc(var(--glow-spread)*1.5)_rgba(var(--brand-primary-rgb),calc(var(--glow-opacity)*1.5))] border-t border-[var(--glass-highlight)] transition-all duration-300',
      secondary:
        'glass-card bg-[hsl(var(--surface-deep))]/50 text-[hsl(var(--foreground))] border border-[hsl(var(--brand-primary))]/10 hover:bg-[hsl(var(--surface-muted))] hover:border-[hsl(var(--brand-primary))]/30 hover:scale-[1.02]',
      ghost:
        'bg-transparent text-[hsl(var(--foreground))]/60 hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))] hover:scale-[1.02]',
      danger: 
        'bg-red-600 text-white hover:bg-red-500 shadow-[0_10px_30px_rgba(220,38,38,0.2)] border-t border-white/10',
      outline:
        'bg-transparent border border-[hsl(var(--brand-primary))]/20 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--brand-primary))]/5 hover:border-[hsl(var(--brand-primary))]/40 hover:scale-[1.02]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs font-medium',
      md: 'px-6 py-3 text-sm font-semibold',
      lg: 'px-10 py-4 text-base font-bold tracking-tight',
      icon: 'p-2.5 aspect-square flex items-center justify-center h-12 w-12',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative rounded-full inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={state === 'loading' || disabled}
        whileHover={state === 'default' && !disabled ? { y: -2 } : {}}
        initial={false}
        {...(props as Record<string, unknown>)}
      >
        {/* Shimmer Effect for Primary */}
        {variant === 'primary' && (
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute inset-0 w-[200%] h-full bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-[25deg] animate-shimmer" style={{ animationDuration: '3s' }} />
          </div>
        )}

        {/* Ambient Glow for Primary on Hover */}
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors duration-300" />
        )}

        {state === 'loading' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.div>
        ) : (
          <React.Fragment>
            {children}
            {state === 'success' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white">
                <Check size={18} strokeWidth={3} />
              </motion.div>
            )}
          </React.Fragment>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

