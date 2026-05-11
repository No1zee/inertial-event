'use client';

import {
  useUserPreferencesStore,
  usePreferencesActions,
  type Theme,
  type Quality,
} from '@/lib/stores/preferencesStore';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Monitor, Globe, RotateCcw, Palette } from 'lucide-react';

export default function SettingsPage() {
  const preferences = useUserPreferencesStore();
  const actions = usePreferencesActions();

  const qualityOptions = [
    { value: 'auto', label: 'Auto (Recommended)' },
    { value: '4k', label: '4K Ultra HD' },
    { value: '1080p', label: '1080p Full HD' },
    { value: '720p', label: '720p HD' },
    { value: '360p', label: '360p Data Saver' },
  ];

  const langOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
  ];

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your playback preferences and app behavior.</p>
      </div>

      {/* General / Player Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-xl font-semibold text-white border-b border-white/5 pb-2">
          <Monitor className="text-red-500" />
          <h2>Playback</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Default Quality</label>
              <p className="text-xs text-zinc-500 mb-3">Preferred streaming quality for new videos.</p>
              <Select
                value={preferences.defaultQuality}
                onChange={e => actions.setDefaultQuality(e.target.value as Quality)}
                options={qualityOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Autoplay</label>
              <p className="text-xs text-zinc-500 mb-3">Automatically play the next episode.</p>
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                <span className="text-sm text-zinc-300">Enable Autoplay</span>
                <Switch checked={preferences.autoPlay} onChange={actions.setAutoPlay} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Hardware Acceleration</label>
              <p className="text-xs text-zinc-500 mb-3">Use GPU for smoother playback (requires restart).</p>
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                <span className="text-sm text-zinc-300">Enable Acceleration</span>
                <Switch checked={preferences.hardwareAcceleration} onChange={actions.setHardwareAcceleration} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Advanced Diagnostics</label>
              <p className="text-xs text-zinc-500 mb-3">Show real-time engine logs during playback.</p>
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                <span className="text-sm text-zinc-300">Enable Monitoring</span>
                <Switch checked={preferences.diagnosticsEnabled} onChange={actions.setDiagnosticsEnabled} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Buffer Strategy</label>
              <p className="text-xs text-zinc-500 mb-3">Optimize engine for bandwidth or performance.</p>
              <Select
                value={preferences.bufferStrategy}
                onChange={e => actions.setBufferStrategy(e.target.value as any)}
                options={[
                  { value: 'standard', label: 'Standard (Balanced)' },
                  { value: 'aggressive', label: 'Aggressive (Pre-cache)' },
                  { value: 'minimal', label: 'Minimal (Data Saver)' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Language Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-xl font-semibold text-white border-b border-white/5 pb-2">
          <Globe className="text-blue-500" />
          <h2>Language</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Audio Language</label>
            <p className="text-xs text-zinc-500 mb-3">Preferred audio track language.</p>
            <Select
              value={preferences.audioLanguage}
              onChange={e => actions.setAudioLanguage(e.target.value)}
              options={langOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Subtitle Language</label>
            <p className="text-xs text-zinc-500 mb-3">Preferred subtitle language.</p>
            <div className="space-y-3">
              <Select
                value={preferences.subtitleLanguage}
                onChange={e => actions.setSubtitleLanguage(e.target.value)}
                options={langOptions}
                disabled={!preferences.subtitlesEnabled}
              />
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                <span className="text-sm text-zinc-300">Always Show Subtitles</span>
                <Switch checked={preferences.subtitlesEnabled} onChange={actions.setSubtitlesEnabled} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-xl font-semibold text-foreground border-b border-border pb-2">
          <Palette className="text-primary" />
          <h2>Appearance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">App Theme</label>
            <p className="text-xs text-muted-foreground mb-4">Choose your preferred visual style.</p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'Nova', name: 'Nova Stream', color: '#E50914', subtitle: 'Cinematic Dark' },
                { id: 'ocean', name: 'Oceanic', color: '#0EA5E9', subtitle: 'Deep Blue Calm' },
                { id: 'cyberpunk', name: 'Cyberpunk', color: '#FF00BB', subtitle: 'Neon Streets' },
                { id: 'oled', name: 'Pure OLED', color: '#FFFFFF', subtitle: 'True Black' },
                { id: 'heritage', name: 'Heritage', color: '#FFB700', subtitle: 'Royal Gold' },
                { id: 'aurora', name: 'Aurora', color: '#00FF80', subtitle: 'Northern Lights' },
                { id: 'titanium', name: 'Titanium', color: '#A9ADB6', subtitle: 'Industrial Steel' },
                { id: 'ghost', name: 'Ghost', color: '#F5F5F5', subtitle: 'Light Mode' },
              ].map(themeItem => (
                <button
                  key={themeItem.id}
                  onClick={() => actions.setTheme(themeItem.id as Theme)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${
                      preferences.theme === themeItem.id
                        ? 'border-primary bg-accent/20 ring-2 ring-primary/20'
                        : 'border-border bg-card hover:bg-accent/10 hover:border-accent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-5 h-5 rounded-full ring-1 ring-foreground/15"
                      style={{ backgroundColor: themeItem.color }}
                    />
                    <span
                      className={`font-medium text-sm ${preferences.theme === themeItem.id ? 'text-primary' : 'text-foreground'}`}
                    >
                      {themeItem.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground tracking-wider pl-8">
                    {themeItem.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Atmosphere Intensity</label>
              <p className="text-xs text-muted-foreground mb-4">Adjust the strength of the cinematic background aura.</p>
              
              <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={preferences.atmosphereIntensity || 0.6}
                  onChange={(e) => actions.setAtmosphereIntensity(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-black text-primary w-8 text-center">
                  {Math.round((preferences.atmosphereIntensity || 0.6) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Visual Boost</label>
              <p className="text-xs text-muted-foreground mb-4">Enhanced color grading and contrast for HDR-like feel.</p>
              <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border">
                <span className="text-sm text-foreground/70">Enable HDR Simulation</span>
                <Switch 
                  checked={preferences.visualBoost || false} 
                  onChange={actions.setVisualBoost} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danger / Reset */}
      <section className="pt-8 border-t border-white/5">
        <button
          onClick={actions.resetAllPreferences}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-500 transition-colors"
        >
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
      </section>
    </div>
  );
}
