import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ArrowUpRight, Film } from 'lucide-react';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

interface BrandBlockProps {
  text: string;
  subtext?: string;
  gradient?: string;
  icon?: React.ReactNode;
  bgImage?: string;
  onClick?: () => void;
}

export function BrandBlock({ text, subtext, bgImage, onClick }: BrandBlockProps) {
  const tickerItems = [
    'CODEC: AV1-MASTER',
    'BITRATE: 45MBPS',
    'COLOR-DEPTH: 12-BIT',
    'RESOLUTION: 3840x2160',
    'DYNAMIC-RANGE: HDR10+',
    'AUDIO: DOLBY-ATMOS',
    'LATENCY: <50MS',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative h-[600px] flex items-center justify-center overflow-hidden mx-10 lg:mx-24 rounded-[4rem] border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
    >
      {/* Architectural Grid (Subtle Institutional Pattern) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Background Image Layer */}
      {bgImage && (
        <OptimizedImage
          src={bgImage}
          alt=""
          fill
          className="absolute inset-0 object-cover object-center opacity-30 scale-105 pointer-events-none"
          sizes="(max-width: 1024px) 100vw, 80vw"
          priority={false}
        />
      )}

      {/* Cinematic Scrims (Institutional Mastering Layer) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-[hsl(var(--background))]/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_90%)]" />

      {/* Ambient Animated Glows (Atmospheric Glow) */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[hsl(var(--brand-primary))]/10 rounded-full blur-[140px]"
      />

      {/* Corner Bracket Accents (Archival Accents) */}
      <div className="absolute top-12 left-12 w-16 h-16 border-t border-l border-[hsl(var(--brand-wood))]/20 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-12 right-12 w-16 h-16 border-t border-r border-[hsl(var(--brand-wood))]/20 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-12 left-12 w-16 h-16 border-b border-l border-[hsl(var(--brand-wood))]/20 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-16 h-16 border-b border-r border-[hsl(var(--brand-wood))]/20 rounded-br-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-8 flex flex-col items-center">
        <header className="flex flex-col items-center gap-8 mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="group relative"
          >
            <div className="absolute -inset-4 bg-[hsl(var(--brand-primary))]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-5 rounded-full bg-white border border-[hsl(var(--border))] shadow-sm backdrop-blur-2xl">
              <Film className="w-10 h-10 text-red-600" />
            </div>
          </motion.div>
        </header>

        <div className="space-y-6">
          <PretextHeadline
            text={text}
            fontSize={72}
            fontWeight={900}
            lineHeight={0.8}
            className="text-[hsl(var(--brand-primary))] tracking-tighter uppercase font-playfair"
          />

          {subtext && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[hsl(var(--muted-foreground))] text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed"
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
            className="group relative px-10 py-5 rounded-full bg-red-600 text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 overflow-hidden shadow-lg shadow-red-600/20"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            <span>Explore The Archive</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.button>
        </footer>
      </div>

      {/* Technical Ticker Bottom (Playback Metrics) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/40 border-t border-[hsl(var(--border))] backdrop-blur-md flex items-center overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex gap-16 whitespace-nowrap px-8"
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[hsl(var(--brand-primary))]/40 rounded-full" />
              <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))] tracking-tighter">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Ticker */}
    </motion.div>
  );
}
