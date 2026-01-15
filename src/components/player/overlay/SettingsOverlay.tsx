"use client";

import React, { useState } from 'react';
import { X, ChevronRight, Check } from "lucide-react";

interface SettingsOverlayProps {
    show: boolean;
    onClose: () => void;
    tracks: { label: string; language: string; active: boolean }[];
    audioTracks: { label: string; language: string; active: boolean }[];
    qualities: { label: string; height: number; active: boolean }[];
    playbackSpeed: number;
    onTrackChange: (index: number) => void;
    onAudioTrackChange: (index: number) => void;
    onQualityChange: (index: number) => void;
    onSpeedChange: (speed: number) => void;
}

type Tab = 'main' | 'audio' | 'subtitle' | 'quality' | 'speed';

export default function SettingsOverlay({
    show, onClose,
    tracks = [], audioTracks = [], qualities = [], playbackSpeed = 1,
    onTrackChange, onAudioTrackChange, onQualityChange, onSpeedChange
}: SettingsOverlayProps) {
    const [activeTab, setActiveTab] = useState<Tab>('main');

    if (!show) {
        if (activeTab !== 'main') setTimeout(() => setActiveTab('main'), 300);
        return null;
    }

    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

    const renderMain = () => (
        <div className="flex flex-col gap-2 min-w-[250px]">
            <h2 className="text-white text-lg font-bold mb-2 flex justify-between items-center">
                Settings
                <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
            </h2>

            <button onClick={() => setActiveTab('quality')} disabled={qualities.length === 0} className={`flex items-center justify-between p-3 rounded text-sm transition-colors ${qualities.length === 0 ? 'text-white/30 cursor-not-allowed' : 'hover:bg-white/10 text-white'}`}>
                <span>Quality</span>
                <div className="flex items-center gap-2 text-zinc-400">
                    <span>{qualities.length > 0 ? (qualities.find(q => q.active)?.label || 'Auto') : 'Auto'}</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </button>

            <button onClick={() => setActiveTab('audio')} disabled={audioTracks.length === 0} className={`flex items-center justify-between p-3 rounded text-sm transition-colors ${audioTracks.length === 0 ? 'text-white/30 cursor-not-allowed' : 'hover:bg-white/10 text-white'}`}>
                <span>Audio</span>
                <div className="flex items-center gap-2 text-zinc-400">
                    <span>{audioTracks.length > 0 ? (audioTracks.find(t => t.active)?.label || 'Default') : 'Default'}</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </button>

            {tracks.length > 0 && (
                <button onClick={() => setActiveTab('subtitle')} className="flex items-center justify-between p-3 rounded hover:bg-white/10 text-white text-sm transition-colors">
                    <span>Subtitles</span>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <span>{tracks.find(t => t.active)?.label || 'Off'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </button>
            )}

            <button onClick={() => setActiveTab('speed')} className="flex items-center justify-between p-3 rounded hover:bg-white/10 text-white text-sm transition-colors">
                <span>Speed</span>
                <div className="flex items-center gap-2 text-zinc-400">
                    <span>{playbackSpeed}x</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </button>
        </div>
    );

    const renderList = (title: string, items: any[], onSelect: (idx: number) => void, getLabel: (item: any) => string, getActive: (item: any, idx: number) => boolean) => (
        <div className="flex flex-col gap-1 min-w-[250px] max-h-[60vh] overflow-y-auto">
            <h2 className="text-white text-lg font-bold mb-2 flex items-center gap-2">
                <button onClick={() => setActiveTab('main')}><X className="w-5 h-5 rotate-45" /></button>
                {title}
            </h2>
            {items.map((item, idx) => {
                const isActive = getActive(item, idx);
                return (
                    <button
                        key={idx}
                        onClick={() => { onSelect(idx); setActiveTab('main'); }}
                        className={`flex items-center justify-between p-3 rounded text-sm transition-colors ${isActive ? 'bg-white/20 text-white font-medium' : 'hover:bg-white/10 text-zinc-300'}`}
                    >
                        <span>{getLabel(item)}</span>
                        {isActive && <Check className="w-4 h-4" />}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
                {activeTab === 'main' && renderMain()}
                {activeTab === 'quality' && renderList("Quality", qualities, onQualityChange, (q) => q.label, (q) => q.active)}
                {activeTab === 'audio' && renderList("Audio", audioTracks, onAudioTrackChange, (t) => t.label, (t) => t.active)}
                {activeTab === 'subtitle' && renderList("Subtitles", [{ label: 'Off', active: !tracks.some(t => t.active) }, ...tracks], (idx) => onTrackChange(idx - 1), (t) => t.label, (t) => t.active)}
                {activeTab === 'speed' && renderList("Playback Speed", speeds, (idx) => onSpeedChange(speeds[idx]), (s) => s + 'x', (s) => s === playbackSpeed)}
            </div>
        </div>
    );
}
