"use client";

import React from 'react';

export default function SettingsOverlay({ show, onClose }: any) {
    if (!show) return null;
    return (
        <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-lg">
                <h2 className="text-white text-xl mb-4">Settings</h2>
                <button onClick={onClose} className="text-white/70 hover:text-white">Close</button>
            </div>
        </div>
    );
}
