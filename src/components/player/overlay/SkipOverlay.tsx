"use client";

import React from 'react';

export default function SkipOverlay({ showIntro, showCredits, onSkipIntro, onSkipCredits }: any) {
    if (!showIntro && !showCredits) return null;
    return (
        <div className="absolute bottom-32 right-8 z-[65]">
            {showIntro && (
                <button onClick={onSkipIntro} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 transition-all">
                    Skip Intro
                </button>
            )}
            {showCredits && (
                <button onClick={onSkipCredits} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 transition-all">
                    Skip Credits
                </button>
            )}
        </div>
    );
}
