"use client";

import { useSettingsStore } from "@/lib/store/settingsStore";
import { useThemeStore } from "@/lib/store/themeStore";
import { Switch } from "@/components/UI/Switch";
import { Select } from "@/components/UI/Select";
import { Monitor, Volume2, Globe, Cpu, RotateCcw, Palette } from "lucide-react";

export default function SettingsPage() {
    const settings = useSettingsStore();
    const themeStore = useThemeStore();

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
                                value={settings.quality} 
                                onChange={(e) => settings.setQuality(e.target.value as any)}
                                options={qualityOptions}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Autoplay</label>
                            <p className="text-xs text-zinc-500 mb-3">Automatically play the next episode.</p>
                            <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                <span className="text-sm text-zinc-300">Enable Autoplay</span>
                                <Switch checked={settings.autoplay} onChange={settings.setAutoplay} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Hardware Acceleration</label>
                            <p className="text-xs text-zinc-500 mb-3">Use GPU for smoother playback (requires restart).</p>
                            <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                <span className="text-sm text-zinc-300">Enable Acceleration</span>
                                <Switch checked={settings.hardwareAcceleration} onChange={settings.setHardwareAcceleration} />
                            </div>
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
                            value={settings.audioLanguage} 
                            onChange={(e) => settings.setAudioLanguage(e.target.value)}
                            options={langOptions}
                         />
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-white mb-1">Subtitle Language</label>
                         <p className="text-xs text-zinc-500 mb-3">Preferred subtitle language.</p>
                         <div className="space-y-3">
                            <Select 
                                value={settings.subtitleLanguage} 
                                onChange={(e) => settings.setSubtitleLanguage(e.target.value)}
                                options={langOptions}
                                disabled={!settings.subtitleEnabled}
                            />
                            <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                <span className="text-sm text-zinc-300">Always Show Subtitles</span>
                                <Switch checked={settings.subtitleEnabled} onChange={settings.setSubtitleEnabled} />
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
                                { id: 'nova', name: 'Type Nova', colors: 'bg-zinc-900 border-rose-600' },
                                { id: 'ocean', name: 'Oceanic', colors: 'bg-slate-900 border-sky-500' },
                                { id: 'cyberpunk', name: 'Cyberpunk', colors: 'bg-[#1a0b2e] border-yellow-400' },
                                { id: 'oled', name: 'True Black', colors: 'bg-black border-white' },
                            ].map((themeItem) => (
                                <button
                                    key={themeItem.id}
                                    onClick={() => themeStore.setTheme(themeItem.id as any)}
                                    className={`
                                        relative p-4 rounded-xl border-2 text-left transition-all duration-200
                                        ${themeStore.theme === themeItem.id 
                                            ? 'border-primary bg-accent/20 ring-2 ring-primary/20' 
                                            : 'border-border bg-card hover:bg-accent/10 hover:border-accent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-6 h-6 rounded-full border ${themeItem.colors.split(' ')[1].replace('border-', 'bg-')}`}></div>
                                        <span className={`font-medium ${themeStore.theme === themeItem.id ? 'text-primary' : 'text-foreground'}`}>
                                            {themeItem.name}
                                        </span>
                                    </div>
                                    <div className={`h-2 w-full rounded-full opacity-30 ${themeItem.colors.split(' ')[0]}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger / Reset */}
             <section className="pt-8 border-top border-white/5">
                 <button 
                    onClick={settings.resetSettings}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-500 transition-colors"
                 >
                     <RotateCcw size={16} />
                     Reset to Defaults
                 </button>
             </section>
        </div>
    );
}
