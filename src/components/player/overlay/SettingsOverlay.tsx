'use client';

import React, { useState } from 'react';
import { X, ChevronRight, Check, Type, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';

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

type Tab = 'main' | 'audio' | 'subtitle' | 'subtitle-appearance' | 'quality' | 'speed';

function SettingsOverlay({
  show,
  onClose,
  tracks = [],
  audioTracks = [],
  qualities = [],
  playbackSpeed = 1,
  onTrackChange,
  onAudioTrackChange,
  onQualityChange,
  onSpeedChange,
}: SettingsOverlayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  
  const {
    subtitleSize, setSubtitleSize,
    subtitleColor, setSubtitleColor,
    subtitleFont, setSubtitleFont,
    subtitleOpacity, setSubtitleOpacity,
    diagnosticsEnabled, setDiagnosticsEnabled,
  } = useUserPreferencesStore();

  // React.useEffect(() => {
  //     console.log(`[SettingsOverlay] Rendered. Show=${show}`);
  // }, [show]);

  if (!show) {
    if (activeTab !== 'main') setTimeout(() => setActiveTab('main'), 300);
    return null;
  }

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const renderMain = () => (
    <div className="flex flex-col gap-2 min-w-[250px]">
      <h2 className="text-[hsl(var(--foreground))] text-lg font-bold mb-2 flex justify-between items-center">
        Settings
        <button onClick={onClose} aria-label="Close settings">
          <X className="w-5 h-5 text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--foreground))]" />
        </button>
      </h2>

      <button
        onClick={() => setActiveTab('quality')}
        disabled={qualities.length === 0}
        aria-label="Adjust video quality"
        className={`flex items-center justify-between p-3 rounded text-sm transition-colors ${qualities.length === 0 ? 'text-[hsl(var(--foreground))]/30 cursor-not-allowed' : 'hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]'}`}
      >
        <span>Quality</span>
        <div className="flex items-center gap-2 text-[hsl(var(--foreground))]/40">
          <span>{qualities.length > 0 ? qualities.find(q => q.active)?.label || 'Auto' : 'Auto'}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      <button
        onClick={() => setActiveTab('audio')}
        disabled={audioTracks.length === 0}
        aria-label="Adjust audio track"
        className={`flex items-center justify-between p-3 rounded text-sm transition-colors ${audioTracks.length === 0 ? 'text-[hsl(var(--foreground))]/30 cursor-not-allowed' : 'hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]'}`}
      >
        <span>Audio</span>
        <div className="flex items-center gap-2 text-[hsl(var(--foreground))]/40">
          <span>{audioTracks.length > 0 ? audioTracks.find(t => t.active)?.label || 'Default' : 'Default'}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {tracks.length > 0 && (
        <button
          onClick={() => setActiveTab('subtitle')}
          aria-label="Adjust subtitles"
          className="flex items-center justify-between p-3 rounded hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] text-sm transition-colors"
        >
          <span>Subtitles</span>
          <div className="flex items-center gap-2 text-[hsl(var(--foreground))]/40">
            <span>{tracks.find(t => t.active)?.label || 'Off'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      )}

      <button
        onClick={() => setActiveTab('subtitle-appearance')}
        aria-label="Customize subtitle appearance"
        className="flex items-center justify-between p-3 rounded hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] text-sm transition-colors"
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
          <span>Subtitle Appearance</span>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--foreground))]/40" />
      </button>

      <button
        onClick={() => setActiveTab('speed')}
        aria-label="Adjust playback speed"
        className="flex items-center justify-between p-3 rounded hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] text-sm transition-colors"
      >
        <span>Speed</span>
        <div className="flex items-center gap-2 text-[hsl(var(--foreground))]/40">
          <span>{playbackSpeed}x</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      <button
        onClick={() => setDiagnosticsEnabled(!diagnosticsEnabled)}
        aria-label="Toggle technical diagnostics"
        className="flex items-center justify-between p-3 rounded hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))] text-sm transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className={cn("transition-colors", diagnosticsEnabled ? "text-primary" : "text-zinc-500")} />
          <span>Nerd Stats</span>
        </div>
        <div className={cn(
          "w-8 h-4 rounded-full relative transition-colors duration-300",
          diagnosticsEnabled ? "bg-primary" : "bg-zinc-700"
        )}>
          <div className={cn(
            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
            diagnosticsEnabled ? "left-4" : "left-0.5"
          )} />
        </div>
      </button>
    </div>
  );

  const renderList = <T,>(
    title: string,
    items: T[],
    onSelect: (idx: number) => void,
    getLabel: (item: T) => string,
    getActive: (item: T, idx: number) => boolean
  ) => (
    <div className="flex flex-col gap-1 min-w-[250px] max-h-[60vh] overflow-y-auto">
      <h2 className="text-[hsl(var(--foreground))] text-lg font-bold mb-2 flex items-center gap-2">
        <button onClick={() => setActiveTab('main')} aria-label="Back to main settings">
          <X className="w-5 h-5 rotate-45" />
        </button>
        {title}
      </h2>
      {items.map((item, idx) => {
        const isActive = getActive(item, idx);
        return (
          <button
            key={idx}
            onClick={() => {
              onSelect(idx);
              setActiveTab('main');
            }}
            className={`flex items-center justify-between p-3 rounded text-sm transition-colors ${isActive ? 'bg-[hsl(var(--brand-primary))]/20 text-[hsl(var(--brand-primary))] font-medium' : 'hover:bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]/60'}`}
          >
            <span>{getLabel(item)}</span>
            {isActive && <Check className="w-4 h-4" />}
          </button>
        );
      })}
    </div>
  );

  const renderSubtitleAppearance = () => (
    <div className="flex flex-col gap-4 min-w-[320px] max-h-[70vh] overflow-y-auto p-2">
      <h2 className="text-[hsl(var(--foreground))] text-lg font-bold mb-2 flex items-center gap-2">
        <button onClick={() => setActiveTab('main')} aria-label="Back to main settings">
          <X className="w-5 h-5 rotate-45" />
        </button>
        Subtitle Appearance
      </h2>

      {/* Font Size */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[hsl(var(--foreground))]/40">
          <span>Size</span>
          <span>{subtitleSize}px</span>
        </div>
        <input
          type="range"
          title="Subtitle Size"
          aria-label="Subtitle Size"
          min="12"
          max="48"
          value={subtitleSize}
          onChange={(e) => setSubtitleSize(parseInt(e.target.value))}
          className="w-full h-1 bg-[hsl(var(--foreground))]/10 rounded-full appearance-none cursor-pointer accent-[hsl(var(--brand-primary))]"
        />
      </div>

      {/* Font Family */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--foreground))]/40">Font</span>
        <div className="grid grid-cols-2 gap-2">
          {(['Inter', 'Roboto', 'Outfit', 'system-ui'] as const).map((font) => (
            <button
              key={font}
              onClick={() => setSubtitleFont(font)}
              className={`p-2 rounded text-xs border transition-all dynamic-font ${subtitleFont === font ? 'bg-[hsl(var(--brand-primary))]/20 border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))]' : 'bg-[hsl(var(--surface-muted))] border-transparent text-[hsl(var(--foreground))]/60 hover:bg-[hsl(var(--surface-muted))]/80'}`}
              ref={el => el?.style.setProperty('--font-family', font === 'system-ui' ? 'sans-serif' : font)}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--foreground))]/40">Color</span>
        <div className="flex gap-2">
          {['#FFFFFF', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF'].map((color) => (
            <button
              key={color}
              onClick={() => setSubtitleColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform dynamic-bg-color active:scale-90 ${subtitleColor === color ? 'border-[hsl(var(--brand-primary))] scale-110' : 'border-transparent'}`}
              ref={el => el?.style.setProperty('--dynamic-color', color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Background Opacity */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[hsl(var(--foreground))]/40">
          <span>Background Opacity</span>
          <span>{Math.round(subtitleOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          title="Subtitle Background Opacity"
          aria-label="Subtitle Background Opacity"
          min="0"
          max="1"
          step="0.1"
          value={subtitleOpacity}
          onChange={(e) => setSubtitleOpacity(parseFloat(e.target.value))}
          className="w-full h-1 bg-[hsl(var(--foreground))]/10 rounded-full appearance-none cursor-pointer accent-[hsl(var(--brand-primary))]"
        />
      </div>

      {/* Preview */}
      <div className="mt-4 p-6 rounded-lg bg-black relative flex items-center justify-center overflow-hidden border border-[hsl(var(--foreground))]/10">
        <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-zinc-900 opacity-50" />
        <span 
          className="relative z-10 font-bold drop-shadow-lg text-center px-2 py-0.5 rounded dynamic-font dynamic-color dynamic-size dynamic-bg"
          ref={el => {
            if (!el) return;
            el.style.setProperty('--dynamic-size', `${subtitleSize}px`);
            el.style.setProperty('--dynamic-color', subtitleColor);
            el.style.setProperty('--font-family', subtitleFont === 'system-ui' ? 'sans-serif' : subtitleFont);
            el.style.setProperty('--dynamic-bg', `rgba(0,0,0,${subtitleOpacity * 0.8})`);
          }}
        >
          Cinematic Experience
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="absolute inset-0 z-[110] bg-black/40 backdrop-blur-md flex items-center justify-center cursor-default"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-label="Settings modal backdrop"
    >
      <div className="bg-[hsl(var(--surface-deep))] border border-[hsl(var(--brand-primary))]/10 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        {activeTab === 'main' && renderMain()}
        {activeTab === 'quality' &&
          renderList(
            'Quality',
            qualities,
            onQualityChange,
            q => q.label,
            q => q.active
          )}
        {activeTab === 'audio' &&
          renderList(
            'Audio',
            audioTracks,
            onAudioTrackChange,
            t => t.label,
            t => t.active
          )}
        {activeTab === 'subtitle' &&
          renderList(
            'Subtitles',
            [{ label: 'Off', active: !tracks.some(t => t.active) }, ...tracks],
            idx => onTrackChange(idx - 1),
            t => t.label,
            t => t.active
          )}
        {activeTab === 'speed' &&
          renderList(
            'Playback Speed',
            speeds,
            idx => onSpeedChange(speeds[idx]),
            s => s + 'x',
            s => s === playbackSpeed
          )}
        {activeTab === 'subtitle-appearance' && renderSubtitleAppearance()}
      </div>
    </div>
  );
}

export default React.memo(SettingsOverlay);

