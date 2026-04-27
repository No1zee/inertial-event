'use client';

import React from 'react';

/**
 * Institutional Living Background (v2)
 *
 * Performance Wins:
 * 1. Uses pure CSS keyframe animations (zero main-thread JS overhead).
 * 2. GPU-accelerated transforms (translate3d/scale3d).
 * 3. Atomic compositing layers via will-change.
 */
export const LivingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020205] pointer-events-none">
      {/* Ambient Aura 1 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] aura-blur bg-primary/30 rounded-full animate-pulse-slow will-change-transform opacity-40" />

      {/* Ambient Aura 2 */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] aura-blur bg-indigo-600/20 rounded-full animate-float-slow will-change-transform opacity-30" />

      {/* Ambient Aura 3 */}
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] aura-blur bg-purple-600/15 rounded-full animate-pulse-gentle will-change-opacity" />

      {/* Static Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.svg')] bg-repeat" />

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale3d(1, 1, 1);
            opacity: 0.3;
          }
          50% {
            transform: scale3d(1.15, 1.15, 1);
            opacity: 0.5;
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
          }
          50% {
            transform: translate3d(5%, 2%, 0) scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes pulse-gentle {
          0%,
          100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.35;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 15s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 12s ease-in-out infinite;
        }
        .aura-blur {
          filter: blur(120px);
        }
      `}</style>
    </div>
  );
};
