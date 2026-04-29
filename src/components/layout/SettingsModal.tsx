'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, User, Monitor, Database, Play, SkipForward, Volume2, Search, Info, Shield } from 'lucide-react';
import { useLayoutState, useLayoutActions } from '@/lib/stores/uiStore';
import { useUserPreferences, usePreferenceActions } from '@/lib/stores/localDataStore';
import { useThemeStore, type Theme } from '@/store/themeStore';
import { useNotificationActions, useUIStore } from '@/lib/stores/uiStore';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher';
import { useHydrated } from '@/lib/hooks/useHydrated';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen } = useLayoutState();
  const { setSettingsOpen } = useLayoutActions();
  const { theme, setTheme } = useThemeStore();
  const { addNotification } = useNotificationActions();
  const preferences = useUserPreferences();
  const { updatePreferences } = usePreferenceActions();
  const [activeSection, setActiveSection] = React.useState<'profile' | 'playback' | 'visual' | 'network' | 'search'>('playback');

  const handleUpdatePreference = (updates: any) => {
    updatePreferences(updates);
    addNotification({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your cinematic environment has been optimized.',
      duration: 3000,
    });
  };

  const sections = [
    { id: 'profile', label: 'Vault Profile', icon: User },
    { id: 'playback', label: 'Playback Engine', icon: Play },
    { id: 'visual', label: 'Visual Engine', icon: Monitor },
    { id: 'network', label: 'Network & Data', icon: Database },
    { id: 'search', label: 'Search Intelligence', icon: Search },
  ];

  const isHydrated = useHydrated();

  return (
    <AnimatePresence mode="wait">
      {isHydrated && isSettingsOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[600px] bg-zinc-950 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden flex"
          >
            {/* Sidebar */}
            <div className="w-64 bg-zinc-900/50 border-r border-white/5 p-8 flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-red-600" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Core Control</h2>
              </div>

              <nav className="flex flex-col gap-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    title={`Go to ${section.label}`}
                    aria-label={`Go to ${section.label}`}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
                      activeSection === section.id
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <section.icon size={14} />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {sections.find(s => s.id === activeSection)?.label}
                </h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  title="Close"
                  aria-label="Close Settings"
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeSection === 'profile' && (
                  <div className="max-w-2xl mx-auto py-4">
                    <ProfileSwitcher />
                    
                    <div className="mt-12 p-8 rounded-[2.5rem] bg-zinc-900/30 border border-white/5 flex items-start gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-2 italic">Neural Shield Active</h4>
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                          Locked profiles require a 4-digit Neural PIN for access. This ensures your private archives and viewing metrics remain isolated within your personal vault space.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'playback' && (
                  <div className="space-y-8">
                    <PreferenceToggle
                      label="Auto-play Next Episode"
                      description="Automatically launch the next segment after credits"
                      checked={preferences.autoplayNext}
                      onChange={(val: boolean) => updatePreferences({ autoplayNext: val })}
                      icon={SkipForward}
                    />
                    <PreferenceToggle
                      label="Atmospheric Previews"
                      description="Play silent video previews while browsing rails"
                      checked={preferences.autoplayPreviews}
                      onChange={(val: boolean) => updatePreferences({ autoplayPreviews: val })}
                      icon={Monitor}
                    />
                    <PreferenceToggle
                      label="Dialogue Boost"
                      description="Enhance vocal frequencies for clearer speech"
                      checked={preferences.dialogueBoost}
                      onChange={(val: boolean) => updatePreferences({ dialogueBoost: val })}
                      icon={Volume2}
                    />
                    <PreferenceToggle
                      label="Skip Intros & Recaps"
                      description="Automatically bypass repetitive sequences"
                      checked={preferences.skipIntros}
                      onChange={(val: boolean) => handleUpdatePreference({ skipIntros: val, skipRecaps: val })}
                      icon={SkipForward}
                    />
                  </div>
                )}

                {activeSection === 'visual' && (
                  <div className="space-y-8">
                    <PreferenceToggle
                      label="OLED Deep Black"
                      description="Optimize interface for OLED/MicroLED high-contrast displays"
                      checked={preferences.oledOptimization}
                      onChange={(val: boolean) => updatePreferences({ oledOptimization: val })}
                      icon={Monitor}
                    />
                    <PreferenceToggle
                      label="Adaptive Color Space"
                      description="Dynamically adjust gamut for cinematic accuracy"
                      checked={preferences.adaptiveColorSpace}
                      onChange={(val: boolean) => handleUpdatePreference({ adaptiveColorSpace: val })}
                      icon={Monitor}
                    />
                    <PreferenceToggle
                      label="Interface Soundscapes"
                      description="Enable tactile procedural audio feedback"
                      checked={preferences.interfaceSounds}
                      onChange={(val: boolean) => handleUpdatePreference({ interfaceSounds: val })}
                      icon={Volume2}
                    />

                    <div className="pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <Palette size={12} className="text-red-500" />
                        App Theme
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { id: 'Mai', name: 'Mai Default', color: '#dc2626' },
                          { id: 'ocean', name: 'Oceanic', color: '#0ea5e9' },
                          { id: 'cyberpunk', name: 'Cyberpunk', color: '#facc15' },
                          { id: 'oled', name: 'True Black', color: '#ffffff' },
                          { id: 'heritage', name: 'Heritage', color: '#8b5cf6' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id as Theme);
                              handleUpdatePreference({ theme: t.id });
                            }}
                            className={cn(
                              'flex flex-col gap-3 p-4 rounded-[1.5rem] border transition-all text-left group/theme',
                              theme === t.id
                                ? 'bg-white/5 border-white/20'
                                : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                style={{ backgroundColor: t.color }}
                              />
                              {theme === t.id && <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
                            </div>
                            <span className={cn(
                              'text-[10px] font-bold uppercase tracking-widest transition-colors',
                              theme === t.id ? 'text-white' : 'text-zinc-500 group-hover/theme:text-zinc-300'
                            )}>
                              {t.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'network' && (
                  <div className="space-y-8">
                    <PreferenceToggle
                      label="Data-Saver Engine"
                      description="Prioritize AV1/HEVC compression and reduce dashboard motion"
                      checked={preferences.dataSaver}
                      onChange={(val: boolean) => handleUpdatePreference({ dataSaver: val })}
                      icon={Database}
                    />
                    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-red-500">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Network Optimization</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                        Server-side encoding is managed by Vercel Edge. Data-Saver mode reduces bandwidth consumption by
                        40% while maintaining cinematic clarity.
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'search' && (
                  <div className="space-y-8">
                    <PreferenceToggle
                      label="High-Fidelity Search"
                      description="Enable deep semantic indexing and neural result matching"
                      checked={preferences.highFidelitySearch}
                      onChange={(val: boolean) => handleUpdatePreference({ highFidelitySearch: val })}
                      icon={Search}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PreferenceToggle = ({ label, description, checked, onChange, icon: Icon }: any) => (
  <div className="flex items-center justify-between gap-8 p-2 group">
    <div className="flex items-start gap-4">
      <div className="mt-1 w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-red-500 group-hover:border-red-500/20 transition-all duration-300">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white tracking-tight">{label}</span>
        <span className="text-xs text-zinc-500 font-medium">{description}</span>
      </div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      title={`Toggle ${label}`}
      aria-label={`Toggle ${label}: ${checked ? 'On' : 'Off'}`}
      className={cn(
        'w-12 h-6 rounded-full relative transition-all duration-300',
        checked ? 'bg-red-600' : 'bg-zinc-800'
      )}
    >
      <motion.div
        animate={{ x: checked ? 26 : 4 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  </div>
);
