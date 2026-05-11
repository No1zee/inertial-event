import React from 'react';
import { FileText, Play, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TorrentFile {
  name: string;
  length: number;
  index: number;
}

interface TorrentMetadata {
  name: string;
  infoHash: string;
  files: TorrentFile[];
}

interface TorrentFileSelectorProps {
  metadata: TorrentMetadata;
  onSelect: (index: number) => void;
  onClose: () => void;
  currentIndex?: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const TorrentFileSelector: React.FC<TorrentFileSelectorProps> = ({
  metadata,
  onSelect,
  onClose,
  currentIndex,
}) => {
  // Sort files: put video-like files at the top, then sort by size or name
  const isVideo = (name: string) => /\.(mp4|mkv|avi|mov|m4v)$/i.test(name);
  
  const sortedFiles = [...metadata.files].sort((a, b) => {
    const aVideo = isVideo(a.name);
    const bVideo = isVideo(b.name);
    if (aVideo && !bVideo) return -1;
    if (!aVideo && bVideo) return 1;
    return b.length - a.length; // Default to largest first
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-full overflow-hidden flex flex-col shadow-2xl shadow-black"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white line-clamp-1">{metadata.name}</h2>
              <p className="text-zinc-400 text-sm">Select a file to play from this pack</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sortedFiles.map((file) => {
            const active = currentIndex === file.index;
            const videoFile = isVideo(file.name);

            return (
              <button
                key={file.index}
                onClick={() => onSelect(file.index)}
                aria-label={`Select ${file.name}${active ? ' (Current Selection)' : ''}`}
                className={`w-full group flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  active
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                    : 'bg-zinc-800/30 border-transparent hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >

                <div className={`p-2 rounded-lg ${active ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-zinc-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400'}`}>
                  {active ? <Play size={18} fill="currentColor" /> : <Play size={18} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 border border-zinc-700">
                      {formatSize(file.length)}
                    </span>
                    {!videoFile && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-500/70">
                        May not be playable
                      </span>
                    )}
                  </div>
                </div>

                {active && (
                  <div className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                    Now Playing
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center gap-3">
          <Info size={16} className="text-zinc-500 flex-shrink-0" />
          <p className="text-xs text-zinc-500">
            NovaStream automatically prioritizes the largest video file in the pack.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TorrentFileSelector;
