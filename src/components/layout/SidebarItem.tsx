'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  href: string;
  isActive: boolean;
  isOpen: boolean;
  onClick?: () => void;
  count?: number;
  customIcon?: React.ReactNode;
  isApp?: boolean;
  hoverColor?: string;
}

export function SidebarItem({
  label,
  icon: Icon,
  href,
  isActive,
  isOpen,
  onClick,
  count,
  customIcon,
  hoverColor,
  isApp,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        'relative flex items-center group/item transition-all duration-300 outline-none',
        isOpen ? 'px-6 py-3' : 'justify-center py-4 px-0',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary',
        isApp && 'my-1'
      )}
      style={
        !isActive && hoverColor
          ? {
              // @ts-expect-error - CSS variable for hover color
              '--item-hover-color': hoverColor,
            }
          : {}
      }
    >
      {/* Active Indicator Needles */}
      {isActive && !isApp && (
        <motion.div
          layoutId="activeNeedle"
          className="absolute left-0 w-1 h-3/5 bg-primary rounded-r-full shadow-[0_0_15px_hsla(var(--brand-primary),0.2)]"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Hover/Active Background */}
      <div
        className={cn(
          'absolute inset-x-2 inset-y-1 rounded-2xl transition-all duration-500',
          'bg-primary/5 opacity-0 group-hover/item:opacity-100',
          isActive && 'bg-primary/5 opacity-100',
          isApp && 'rounded-xl border border-transparent group-hover/item:border-primary/10',
          isApp && isActive && 'border-primary/20 bg-primary/[0.07]',
          hoverColor && 'group-hover/item:bg-[var(--item-hover-color)]/10',
          isApp && hoverColor && 'group-hover/item:border-[var(--item-hover-color)]/20'
        )}
      />

      {/* App Glow (Studio Specific) */}
      {isApp && isActive && hoverColor && (
        <motion.div
          className="absolute inset-x-2 inset-y-1 rounded-xl opacity-20 blur-md pointer-events-none"
          initial={false}
          animate={{ backgroundColor: hoverColor }}
        />
      )}

      {/* Icon / Brand Logo */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center transition-all duration-500',
          isActive ? 'scale-110' : 'group-hover/item:scale-110',
          !isOpen && 'w-10 h-10',
          isApp && 'w-8 h-8 rounded-lg overflow-hidden',
          isApp && !isActive && 'opacity-70 group-hover/item:opacity-100'
        )}
      >
        {customIcon ? (
          customIcon
        ) : (
          <Icon
            strokeWidth={isActive ? 2.5 : 1.5}
            className={cn(
              'w-5 h-5 transition-colors duration-500',
              isActive ? 'text-primary filter drop-shadow-[0_0_8px_hsla(var(--brand-primary),0.3)]' : 'text-inherit',
              hoverColor && 'group-hover/item:text-[var(--item-hover-color)]'
            )}
          />
        )}
      </div>

      {/* Label (Pretext) */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="ml-4 flex-1"
        >
          <div className="flex items-center justify-between">
            <PretextHeadline
              text={label}
              className={cn(
                'text-[12px] font-bold tracking-[0.05em] uppercase transition-colors duration-500',
                isActive ? 'text-primary' : 'text-inherit',
                hoverColor && 'group-hover/item:text-[var(--item-hover-color)]',
                isApp && 'font-black'
              )}
            />
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-bold text-primary/60 border border-primary/10',
                  hoverColor &&
                    'group-hover/item:bg-[var(--item-hover-color)]/20 group-hover/item:text-[var(--item-hover-color)] group-hover/item:border-[var(--item-hover-color)]/20'
                )}
              >
                {count}
              </span>
            )}
            {isApp && label === 'African Cinematic Universe' && (
              <div
                className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_#EAB308]"
                title="Heritage Certified"
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Tooltip for Collapsed State */}
      {!isOpen && (
        <div
          className={cn(
            'absolute left-full ml-4 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-primary shadow-xl opacity-0 group-hover/item:opacity-100 translate-x-2 group-hover/item:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100]',
            hoverColor &&
              'text-[var(--item-hover-color)] border-[var(--item-hover-color)]/20 shadow-[var(--item-hover-color)]/10'
          )}
        >
          {label}
        </div>
      )}
    </Link>
  );
}
