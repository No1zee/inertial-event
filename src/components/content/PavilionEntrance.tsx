'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AnimatePresence } from 'framer-motion';

interface PavilionEntranceProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function PavilionEntrance({ isActive, onComplete }: PavilionEntranceProps) {
  const topShutterRef = useRef<HTMLDivElement>(null);
  const bottomShutterRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      const tl = gsap.timeline({
        onComplete: onComplete,
      });

      // Set initial state
      gsap.set([topShutterRef.current, bottomShutterRef.current], { height: 0 });
      gsap.set(logoRef.current, { opacity: 0, scale: 0.8 });

      // Animate shutters closing
      tl.to([topShutterRef.current, bottomShutterRef.current], {
        height: '50%',
        duration: 0.8,
        ease: 'expo.inOut',
      })
        // Reveal ACU Logo/Text
        .to(logoRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        })
        // Hold
        .to({}, { duration: 1 })
        // Animate shutters opening
        .to(logoRef.current, {
          opacity: 0,
          scale: 1.2,
          duration: 0.3,
          ease: 'expo.in',
        })
        .to([topShutterRef.current, bottomShutterRef.current], {
          height: 0,
          duration: 0.8,
          ease: 'expo.inOut',
        });
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* Top Shutter */}
          <div ref={topShutterRef} className="absolute top-0 left-0 w-full bg-[hsl(24,25%,4%)] border-b border-amber-500/20" />

          {/* Bottom Shutter */}
          <div
            ref={bottomShutterRef}
            className="absolute bottom-0 left-0 w-full bg-[hsl(24,25%,4%)] border-t border-amber-500/20"
          />

          {/* Logo/Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div ref={logoRef} className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-display font-black text-amber-500 uppercase italic tracking-tighter">
                African Cinematic <br />
                <span className="text-white">Universe</span>
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-amber-500/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60">
                  Heritage Portal
                </span>
                <div className="h-px w-12 bg-amber-500/30" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
