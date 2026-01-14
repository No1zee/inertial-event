"use client";

import React from 'react';

export default function PostPlayOverlay({ showNextEpisode, onPlayNext, onCancel }: any) {
    if (!showNextEpisode) return null;
    return (
        <div className="absolute inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center gap-4">
            <h2 className="text-white text-2xl">Up Next</h2>
            <div className="flex gap-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/10">Cancel</button>
                <button onClick={onPlayNext} className="px-6 py-2 rounded-full bg-white text-black hover:bg-gray-200">Play Next</button>
            </div>
        </div>
    );
}
