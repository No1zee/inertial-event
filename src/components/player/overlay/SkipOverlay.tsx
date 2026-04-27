'use client';

import React from 'react';

interface SkipOverlayProps {
  showIntro: boolean;
  showCredits: boolean;
  onSkipIntro: () => void;
  onSkipCredits: () => void;
}

export default function SkipOverlay({ showIntro, showCredits, onSkipIntro, onSkipCredits }: SkipOverlayProps) {
  if (!showIntro && !showCredits) return null;
  return (
    <div className="absolute bottom-32 right-8 z-[65] flex flex-col gap-3">
      {showIntro && (
        <button
          onClick={onSkipIntro}
          className="bg-[hsl(var(--surface-deep))]/80 hover:bg-[hsl(var(--surface-deep))] backdrop-blur-md text-[hsl(var(--brand-primary))] px-6 py-2.5 rounded-full border border-[hsl(var(--brand-primary))]/20 transition-all font-medium text-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          Skip Intro
        </button>
      )}
      {showCredits && (
        <button
          onClick={onSkipCredits}
          className="bg-[hsl(var(--surface-deep))]/80 hover:bg-[hsl(var(--surface-deep))] backdrop-blur-md text-[hsl(var(--brand-primary))] px-6 py-2.5 rounded-full border border-[hsl(var(--brand-primary))]/20 transition-all font-medium text-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          Skip Credits
        </button>
      )}
    </div>
  );
}
