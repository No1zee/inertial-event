'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PROVIDERS } from '@/lib/constants/providers';

export function StudioRail() {
  const router = useRouter();

  // Include all providers in the studio rail
  const studios = PROVIDERS;

  return (
    <div className="px-4 md:px-12 mb-16">
      <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mb-6 px-2">Featured Studios</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {studios.map(studio => (
          <button
            key={studio.id}
            onClick={() => router.push(`/channel/${studio.slug}`)}
            title={studio.name}
            aria-label={studio.name}
            className={cn(
              'relative aspect-[16/7] rounded-2xl overflow-hidden cursor-pointer group outline-none',
              'border border-white/5 bg-zinc-900/40 backdrop-blur-xl',
              'hover:scale-[1.05] hover:border-white/20 transition-all duration-500',
              'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
              studio.slug === 'hulu' && 'hover:shadow-[0_0_30px_rgba(28,231,131,0.15)]',
              studio.slug === 'netflix' && 'hover:shadow-[0_0_30px_rgba(229,9,20,0.15)]',
              studio.slug === 'disney' && 'hover:shadow-[0_0_30px_rgba(17,60,207,0.15)]'
            )}
          >
            {/* Background subtle color glow */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-[var(--brand-color)]"
              style={{ '--brand-color': studio.color } as React.CSSProperties}
            />

            {/* Animated Mesh / Noise Layer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none mix-blend-overlay">
              <div className="absolute inset-0 bg-[url('/noise.svg')] bg-repeat animate-pulse" />
            </div>

            {/* Logo */}
            <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 z-10">
              <div className="relative w-full h-full flex items-center justify-center">
                <OptimizedImage
                  src={studio.logo}
                  alt={studio.name}
                  fill
                  className="object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>
            </div>

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Bottom Brand Bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[var(--brand-color)]"
              style={{ '--brand-color': studio.color } as React.CSSProperties}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
