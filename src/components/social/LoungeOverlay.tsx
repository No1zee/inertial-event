'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, X, Shield, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoungeOverlayProps {
  show: boolean;
  onClose: () => void;
  roomUrl: string;
}

export const LoungeOverlay: React.FC<LoungeOverlayProps> = ({
  show,
  onClose,
  roomUrl,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[120] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-8"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-2xl w-full bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl p-12 relative overflow-hidden"
          >
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
             
             <button 
               title="Close"
               onClick={onClose}
               className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
             >
                <X size={20} />
             </button>

             <div className="flex flex-col items-center text-center gap-8 relative z-10">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_50px_rgba(192,57,43,0.2)]">
                   <Users size={40} />
                </div>

                <div className="flex flex-col gap-2">
                   <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Cinematic Lounge</h2>
                   <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-[10px]">High-Fidelity Synchronized Watch Party</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                   <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-3">
                      <Globe size={20} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Visibility</span>
                      <span className="text-sm font-bold text-white">Encrypted / Public</span>
                   </div>
                   <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-3">
                      <Shield size={20} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Protection</span>
                      <span className="text-sm font-bold text-white">Aegis Sync Active</span>
                   </div>
                </div>

                <div className="w-full flex flex-col gap-4">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 text-left">Invitation Link</span>
                   <div className="flex items-center gap-3 bg-black rounded-2xl p-2 border border-white/5 ring-1 ring-white/10">
                      <div className="flex-1 px-4 text-zinc-400 text-sm font-mono truncate">
                         {roomUrl}
                      </div>
                      <button 
                        onClick={handleCopy}
                        className={cn(
                          "px-6 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95",
                          isCopied ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-zinc-200"
                        )}
                      >
                         {isCopied ? "Copied" : "Copy Link"}
                      </button>
                   </div>
                </div>

                <div className="flex flex-col gap-4 w-full pt-4 border-t border-white/5">
                   <button className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                      <Send size={20} fill="currentColor" />
                      Broadcast Invitation
                   </button>
                   <p className="text-[9px] text-zinc-700 font-medium leading-relaxed uppercase tracking-[0.1em]">
                      By initiating a lounge, you establish a real-time Aegis synchronization tunnel. <br/> All participants will be frame-locked to your master timeline.
                   </p>
                </div>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
