import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ArrowUpRight, Film, Archive, ShieldCheck } from 'lucide-react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { cn } from '@/lib/utils';

interface BrandBlockProps {
  text: string;
  subtext?: string;
  gradient?: string;
  icon?: React.ReactNode;
  bgImage?: string;
  onClick?: () => void;
  variant?: 'previews' | 'library' | 'personal';
}

export function BrandBlock({ text, subtext, bgImage, onClick, variant = 'previews' }: BrandBlockProps) {
  const tickerItems = {
    previews: [
      'STUDIO: ACTIVE',
      'QUALITY: ULTRA-HD',
      'STATUS: UPCOMING',
      'STREAM: READY',
      'BITRATE: OPTIMAL',
      'CONTENT: EXCLUSIVE',
      'VERSION: 2026',
    ],
    library: [
      'CATALOG: VERIFIED',
      'RESTORED: 4K',
      'CURATION: HUMAN-LED',
      'COLLECTION: GLOBAL',
      'HERITAGE: PRESERVED',
      'AVAILABILITY: INSTANT',
      'LIBRARY: LIVE',
    ],
    personal: [
      'PROFILE: ACTIVE',
      'ACCOUNT: SYNCED',
      'PREFERENCES: SAVED',
      'IDENTITY: SECURE',
      'WATCHLIST: UPDATED',
      'HISTORY: SYNCED',
      'ACCESS: PRIVATE',
    ],
  }[variant];

  const variantStyles = {
    previews: 'border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.05)]',
    library: 'border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.05)]',
    personal: 'border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]',
  }[variant];

  const Icon = {
    previews: Film,
    library: Archive,
    personal: ShieldCheck,
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative h-[350px] flex items-center justify-center overflow-hidden mx-10 lg:mx-24 rounded-[3rem] border bg-[hsl(var(--background))] group/block transition-all duration-700",
        variantStyles
      )}
    >
      {/* Architectural Grid (Subtle Institutional Pattern) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Blueprint Layer for Previews */}
      {variant === 'previews' && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-repeat" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,red_100%)]" />
        </div>
      )}

      {/* Background Image Layer */}
      {bgImage && (
        <OptimizedImage
          src={bgImage}
          alt=""
          fill
          className="absolute inset-0 object-cover object-center opacity-20 group-hover/block:opacity-30 scale-105 group-hover/block:scale-100 transition-all duration-1000 pointer-events-none"
          sizes="(max-width: 1024px) 100vw, 80vw"
          priority={false}
        />
      )}

      {/* Cinematic Scrims (Institutional Mastering Layer) */}
      <div className="absolute inset-0 bg-linear-to-t from-[hsl(var(--background))] via-transparent to-[hsl(var(--background))]/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_90%)]" />

      {/* Ambient Animated Glows (Atmospheric Glow) */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px]",
          variant === 'previews' ? "bg-red-500/10" : variant === 'library' ? "bg-purple-500/10" : "bg-amber-500/10"
        )}
      />

      {/* Corner Bracket Accents (Archival Accents) */}
      <div className="absolute top-12 left-12 w-16 h-16 border-t border-l border-white/5 rounded-tl-3xl pointer-events-none transition-all group-hover/block:border-white/20" />
      <div className="absolute top-12 right-12 w-16 h-16 border-t border-r border-white/5 rounded-tr-3xl pointer-events-none transition-all group-hover/block:border-white/20" />
      <div className="absolute bottom-12 left-12 w-16 h-16 border-b border-l border-white/5 rounded-bl-3xl pointer-events-none transition-all group-hover/block:border-white/20" />
      <div className="absolute bottom-12 right-12 w-16 h-16 border-b border-r border-white/5 rounded-br-3xl pointer-events-none transition-all group-hover/block:border-white/20" />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-8 flex flex-col items-center">
        <header className="flex flex-col items-center gap-8 mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="group relative"
          >
            <div className={cn(
              "absolute -inset-4 blur-xl rounded-full opacity-0 group-hover/block:opacity-100 transition-opacity duration-700",
              variant === 'previews' ? "bg-red-500/20" : variant === 'library' ? "bg-purple-500/20" : "bg-amber-500/20"
            )} />
            <div className="relative p-6 rounded-full bg-black/40 border border-white/10 shadow-2xl backdrop-blur-3xl group-hover/block:border-white/20 transition-colors">
              <Icon className={cn(
                "w-12 h-12 transition-all duration-500",
                variant === 'previews' ? "text-red-500" : variant === 'library' ? "text-purple-400" : "text-amber-500"
              )} />
            </div>
          </motion.div>
        </header>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.6em] mb-2",
              variant === 'previews' ? "text-red-500" : variant === 'library' ? "text-purple-400" : "text-amber-500"
            )}>
              {variant === 'previews' ? 'Previews' : variant === 'library' ? 'Library' : 'Personal'}
            </span>
            <PretextHeadline
              text={text}
              fontSize={82}
              fontWeight={900}
              lineHeight={0.8}
              className="text-white tracking-tighter uppercase font-playfair"
            />
          </div>

          {subtext && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[hsl(var(--muted-foreground))] text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mt-4"
            >
              {subtext}
            </motion.p>
          )}
        </div>

        <footer className="mt-14 flex flex-col items-center gap-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            aria-label={`Explore Archive: ${text}`}
            className={cn(
              "group relative px-12 py-6 rounded-full text-white font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-4 overflow-hidden shadow-2xl transition-all duration-500",
              variant === 'previews' ? "bg-red-600 shadow-red-600/20" : variant === 'library' ? "bg-purple-600 shadow-purple-600/20" : "bg-amber-600 shadow-amber-600/20"
            )}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            <span>Explore {variant === 'previews' ? 'Previews' : variant === 'library' ? 'Library' : 'Watchlist'}</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </motion.button>
        </footer>
      </div>

      {/* Technical Ticker Bottom (Playback Metrics) */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/60 border-t border-white/5 backdrop-blur-xl flex items-center overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-20 whitespace-nowrap px-10"
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                variant === 'previews' ? "bg-red-500" : variant === 'library' ? "bg-purple-500" : "bg-amber-500"
              )} />
              <span className="text-[10px] font-mono text-zinc-500 tracking-tighter uppercase">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

