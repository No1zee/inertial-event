'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { X, Wifi, Globe, Zap, Server, CheckCircle2, Signal, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SourceItem {
  url: string;
  type: string;
  quality?: string;
  provider?: string;
}

interface SourceSwitcherProps {
  show: boolean;
  sources: SourceItem[];
  activeSourceUrl: string;
  onSelect: (source: SourceItem) => void;
  onClose: () => void;
}

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'hls':
      return <Zap size={16} className="text-emerald-400" />;
    case 'mp4':
      return <Signal size={16} className="text-blue-400" />;
    case 'torrent':
    case 'yts':
    case 'webtorrent':
      return <Shield size={16} className="text-purple-400" />;
    case 'embed':
      return <Globe size={16} className="text-amber-400" />;
    default:
      return <Server size={16} className="text-white/40" />;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'hls':
      return { label: 'NATIVE HLS', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
    case 'mp4':
      return { label: 'DIRECT MP4', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' };
    case 'torrent':
    case 'yts':
    case 'webtorrent':
      return { label: 'SWARM STREAM', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' };
    case 'embed':
      return { label: 'EMBED', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
    default:
      return { label: type.toUpperCase(), color: 'bg-white/5 text-white/40 border-white/10' };
  }
};

const SourceSwitcher = memo(function SourceSwitcher({
  show,
  sources,
  activeSourceUrl,
  onSelect,
  onClose,
}: SourceSwitcherProps) {
  // Categorize sources
  const nativeSources = sources.filter(s => 
    s.type === 'hls' || 
    s.type === 'mp4' || 
    s.type === 'torrent' || 
    s.type === 'yts' || 
    s.type === 'webtorrent'
  );
  const embedSources = sources.filter(s => s.type === 'embed');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-2xl"
          onClick={e => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl mx-8 bg-zinc-950/95 border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 rounded-xl">
                    <Wifi size={18} className="text-white/60" />
                  </div>
                  <h2 className="text-white font-black text-lg uppercase tracking-tighter">Stream Sources</h2>
                </div>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-bold ml-12">
                  {sources.length} available · {nativeSources.length} native
                </p>
              </div>
              <button
                onClick={onClose}
                title="Close Source Switcher"
                aria-label="Close Source Switcher"
                className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Source List */}
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Native Sources (HLS / MP4) */}
              {nativeSources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em]">
                      Direct Streams — Netflix Buffer
                    </span>
                  </div>
                  {nativeSources.map((source, idx) => {
                    const badge = getTypeBadge(source.type);
                    const isActive = source.url === activeSourceUrl;
                    return (
                      <button
                        key={`native-${idx}`}
                        onClick={() => onSelect(source)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group',
                          isActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                        )}
                      >
                        <div
                          className={cn(
                            'p-3 rounded-xl transition-colors',
                            isActive ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
                          )}
                        >
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm truncate">
                              {source.provider || `Server ${idx + 1}`}
                            </span>
                            {isActive && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
                          </div>
                          <span className="text-white/30 text-[10px] font-medium truncate block">
                            {source.quality || 'Auto'} · {source.type.toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full border flex-shrink-0',
                            badge.color
                          )}
                        >
                          {badge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Embed Sources */}
              {embedSources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe size={12} className="text-amber-500" />
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em]">
                      Embed Servers — Browser Fallback
                    </span>
                  </div>
                  {embedSources.map((source, idx) => {
                    const badge = getTypeBadge(source.type);
                    const isActive = source.url === activeSourceUrl;
                    return (
                      <button
                        key={`embed-${idx}`}
                        onClick={() => onSelect(source)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group',
                          isActive
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                        )}
                      >
                        <div
                          className={cn(
                            'p-3 rounded-xl transition-colors',
                            isActive ? 'bg-amber-500/20' : 'bg-white/5 group-hover:bg-white/10'
                          )}
                        >
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm truncate">
                              {source.provider || `Embed ${idx + 1}`}
                            </span>
                            {isActive && <CheckCircle2 size={14} className="text-amber-400 flex-shrink-0" />}
                          </div>
                          <span className="text-white/30 text-[10px] font-medium truncate block">
                            {source.quality || 'Auto'} · Browser Player
                          </span>
                        </div>
                        <span
                          className={cn(
                            'px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full border flex-shrink-0',
                            badge.color
                          )}
                        >
                          {badge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {sources.length === 0 && (
                <div className="text-center py-12">
                  <Server size={32} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 text-xs uppercase tracking-widest font-bold">No sources available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-white/5 bg-white/[0.02]">
              <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold text-center">
                Native streams use the 5-minute pre-buffer for zero-lag playback
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default SourceSwitcher;
