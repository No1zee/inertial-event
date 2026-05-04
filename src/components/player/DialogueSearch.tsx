'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Clock, X, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '../Common/PretextHeadline';
export interface DialogueItem {
  text: string;
  time: number;
  context?: string;
  type?: string;
}

interface DialogueSearchProps {
  show: boolean;
  onClose: () => void;
  onJump: (time: number) => void;
  subtitles: DialogueItem[];
}

export const DialogueSearch: React.FC<DialogueSearchProps> = ({
  show,
  onClose,
  onJump,
}) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'dialogue' | 'semantic'>('dialogue');
  
  // Mock results
  const dialogueResults = [
    { text: "We have to go back to the sanctuary.", time: 450, context: "Chapter 4: The Return" },
    { text: "The director's cut is almost ready.", time: 1200, context: "Chapter 12: Finalization" },
    { text: "NovaStream provides high-fidelity entertainment.", time: 1800, context: "Chapter 18: The Reveal" },
  ].filter(r => r.text.toLowerCase().includes(query.toLowerCase()) && query.length > 2);

  const semanticResults = [
    { text: "Emotional Act II Turning Point", time: 2400, context: "Cinematic Intensity: High", type: "Cinematic Concept" },
    { text: "Strategic Narrative Pivot", time: 1500, context: "Cinematic Intensity: Medium", type: "Cinematic Concept" },
    { text: "Establishing High-Contrast Sequence", time: 100, context: "Cinematic Intensity: Low", type: "Cinematic Concept" },
  ].filter(r => r.text.toLowerCase().includes(query.toLowerCase()) && query.length > 2);

  const results = searchMode === 'dialogue' ? dialogueResults : semanticResults;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="absolute top-0 right-0 w-[450px] h-full z-[110] bg-[#050505]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col p-12 shadow-[-50px_0_100px_rgba(0,0,0,0.8)]"
        >
           <div className="flex items-center justify-between mb-12">
               <div className="flex flex-col">
                  <div className="flex items-center gap-3 text-zinc-500 mb-2">
                     <Terminal size={14} />
                     <PretextHeadline
                        text="Active Script Analysis"
                        fontSize={10}
                        fontWeight={700}
                        letterSpacing="0.3em"
                        className="text-zinc-500 uppercase"
                     />
                  </div>
                  <PretextHeadline
                    text="Dialogue Archive"
                    fontSize={32}
                    fontWeight={900}
                    letterSpacing="-0.04em"
                    className="text-white uppercase italic"
                  />
               </div>
              <button 
                title="Close"
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
           </div>

           {/* Mode Selector */}
           <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
              <button 
                onClick={() => setSearchMode('dialogue')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  searchMode === 'dialogue' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                Dialogue
              </button>
              <button 
                onClick={() => setSearchMode('semantic')}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  searchMode === 'semantic' ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                Atmospheric Search
              </button>
           </div>

           <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                autoFocus
                type="text"
                placeholder={searchMode === 'dialogue' ? "Search for a spoken line..." : "Search for a mood, concept, or scene..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-700 focus:border-primary/50 focus:bg-white/[0.08] transition-all outline-none font-medium"
              />
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
              {results.length > 0 ? (
                results.map((result, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onJump(result.time)}
                    className="w-full p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-left group transition-all"
                  >
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 rounded text-[9px] font-black text-primary uppercase tracking-widest">
                           <Clock size={10} />
                           {Math.floor(result.time / 60)}:{String(result.time % 60).padStart(2, '0')}
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{result.context}</span>
                     </div>
                     <p className="text-zinc-300 text-sm leading-relaxed font-medium group-hover:text-white transition-colors italic">
                        &quot;{result.text}&quot;
                     </p>
                  </motion.button>
                ))
              ) : query.length > 2 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-zinc-600">
                   <Search size={40} className="opacity-20" />
                   <p className="text-xs font-black uppercase tracking-[0.2em]">No {searchMode} matches found</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 text-zinc-700">
                   {searchMode === 'dialogue' ? <Play size={40} className="opacity-20" /> : <Terminal size={40} className="opacity-20" />}
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
                      {searchMode === 'dialogue' ? "Type to search through script history" : "Atmospheric discovery powered by Directorial-X"}
                   </p>
                </div>
              )}
           </div>

           {/* Analysis Badge */}
           <div className="mt-auto pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 px-4 py-3 bg-zinc-500/5 rounded-xl border border-zinc-500/10">
                 <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Script Frame Synchronized</span>
              </div>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
