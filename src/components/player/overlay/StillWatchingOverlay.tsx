'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Home } from 'lucide-react';

interface StillWatchingOverlayProps {
  show: boolean;
  onContinue: () => void;
  onExit: () => void;
}

export default function StillWatchingOverlay({ show, onContinue, onExit }: StillWatchingOverlayProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!show) {
      setCountdown(30);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, onExit]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-md w-full text-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white tracking-tight">Still watching?</h2>
              <p className="text-zinc-400 text-lg">
                We&apos;ll pause your session soon to save bandwidth and your spot.
              </p>
            </div>

            <div className="relative h-32 flex items-center justify-center">
              <div className="text-6xl font-black text-white/10 absolute inset-0 flex items-center justify-center select-none">
                {countdown}
              </div>
              <div className="relative z-10 w-24 h-24 border-4 border-white/5 rounded-full flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 border-4 border-red-600 rounded-full transition-all duration-1000"
                  initial={false}
                  animate={{
                    clipPath: `inset(${100 - (countdown / 30) * 100}% 0 0 0)`,
                    opacity: 0.5,
                  }}
                />
                <span className="text-3xl font-bold text-white">{countdown}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={onContinue}
                size="lg"
                className="h-16 text-lg font-bold bg-white text-black hover:bg-zinc-200 rounded-2xl group transition-all"
              >
                <Play className="mr-2 h-6 w-6 fill-black group-hover:scale-110 transition-transform" />
                Yes, Continue Playing
              </Button>

              <Button
                onClick={onExit}
                variant="ghost"
                size="lg"
                className="h-16 text-lg font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl"
              >
                <Home className="mr-2 h-5 w-5" />
                No, I&apos;m Done
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
