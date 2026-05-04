'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, User, Monitor, Database, Play, SkipForward, Volume2, Search, Info, Shield, Zap, Sparkles } from 'lucide-react';
import { useLayoutState, useLayoutActions } from '@/lib/stores/uiStore';
import { useUserPreferences, usePreferenceActions } from '@/lib/stores/localDataStore';
import { usePreferencesStore } from '@/lib/stores/preferencesStore';
import { useThemeStore, type Theme } from '@/lib/stores/themeStore';
import { useNotificationActions } from '@/lib/stores/uiStore';
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
  const { 
    pipVisualBoost, setPipVisualBoost, 
    visualBoost, setVisualBoost, 
    stillWatchingEnabled, setStillWatchingEnabled 
  } = usePreferencesStore();
  const [activeSection, setActiveSection] = React.useState<'profile' | 'playback' | 'visual' | 'network' | 'search' | 'system' | 'labs'>('playback');

  const handleUpdatePreference = (updates: Partial<ReturnType<typeof useUserPreferences>>) => {
    updatePreferences(updates);
    addNotification({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your settings have been saved.',
      duration: 3000,
    });
  };

  const sections = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'playback', label: 'Playback', icon: Play },
    { id: 'visual', label: 'Video & Display', icon: Monitor },
    { id: 'network', label: 'Data Usage', icon: Database },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'system', label: 'Advanced', icon: Shield },
    { id: 'labs', label: 'Experimental', icon: Zap },
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
                <Settings size={20} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Settings</h2>
              </div>

              <nav className="flex flex-col gap-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as typeof activeSection)}
                    title={`Go to ${section.label}`}
                    aria-label={`Go to ${section.label}`}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all',
                      activeSection === section.id
                        ? 'bg-primary text-black shadow-lg shadow-primary/20'
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
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-2 italic">Profile Privacy</h4>
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                          Locked profiles require a 4-digit Security PIN for access. This ensures your personal watchlist and viewing history remain private.
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
                      label="Video Previews"
                      description="Play silent video previews while browsing"
                      checked={preferences.autoplayPreviews}
                      onChange={(val: boolean) => updatePreferences({ autoplayPreviews: val })}
                      icon={Monitor}
                    />
                    <PreferenceToggle
                      label="Clear Dialogue"
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
                    <PreferenceToggle
                      label="Still Watching Check"
                      description="Periodically check if you are still watching"
                      checked={stillWatchingEnabled}
                      onChange={(val: boolean) => setStillWatchingEnabled(val)}
                      icon={Info}
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
                      label="Color Accuracy"
                      description="Adjust color gamut for higher fidelity"
                      checked={preferences.adaptiveColorSpace}
                      onChange={(val: boolean) => handleUpdatePreference({ adaptiveColorSpace: val })}
                      icon={Monitor}
                    />
                    <PreferenceToggle
                      label="System Sounds"
                      description="Enable tactile audio feedback in the interface"
                      checked={preferences.interfaceSounds}
                      onChange={(val: boolean) => handleUpdatePreference({ interfaceSounds: val })}
                      icon={Volume2}
                    />
                    <PreferenceToggle
                      label="Cinematic Visual Boost"
                      description="Enhance contrast and brightness for the entire player"
                      checked={visualBoost}
                      onChange={(val: boolean) => setVisualBoost(val)}
                      icon={Monitor}
                    />
                    <PreferenceToggle
                      label="PiP Visual Boost"
                      description="Boost brightness and contrast in Picture-in-Picture mode"
                      checked={pipVisualBoost}
                      onChange={(val: boolean) => setPipVisualBoost(val)}
                      icon={Monitor}
                    />

                    <div className="pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <Palette size={12} className="text-primary" />
                        App Theme
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { id: 'Nova', name: 'Nova Stream', color: '#E50914' },
                          { id: 'ocean', name: 'Oceanic', color: '#0EA5E9' },
                          { id: 'cyberpunk', name: 'Cyberpunk', color: '#FF00BB' },
                          { id: 'oled', name: 'Pure OLED', color: '#FFFFFF' },
                          { id: 'heritage', name: 'Heritage', color: '#FFB700' },
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
                              <motion.div
                                className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                initial={false}
                                animate={{ backgroundColor: t.color }}
                              />
                                {theme === t.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
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
                      label="Data Saver"
                      description="Reduce data usage and dashboard animations"
                      checked={preferences.dataSaver}
                      onChange={(val: boolean) => handleUpdatePreference({ dataSaver: val })}
                      icon={Database}
                    />
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-primary">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Playback Experience</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                        Your streaming quality is automatically optimized for your display. 
                        Data-Saver mode maintains cinematic clarity while reducing bandwidth consumption.
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'system' && (
                  <div className="space-y-12">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">System Settings</h4>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium mb-8 leading-relaxed max-w-xl">
                        Manage the core stability and session state of your NovaStream application.
                      </p>

                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            window.location.reload();
                          }}
                          className="w-full h-16 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-between px-6 group/refresh hover:border-white/20 transition-all"
                        >
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-zinc-400 group-hover/refresh:text-white transition-colors">
                               <Shield size={18} />
                             </div>
                             <div className="flex flex-col items-start">
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">Reload App</span>
                               <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">Restart the application</span>
                             </div>
                           </div>
                           <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-600 group-hover/refresh:text-white transition-all">
                             <SkipForward size={14} />
                           </div>
                        </button>
                      </div>
                    </div>

                    <div className="pt-8">
                      <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-3 mb-3 text-zinc-400">
                          <Info size={14} />
                          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Note</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                          NovaStream is a curated cinematic experience. Advanced controls are provided for app recovery and state stabilization. 
                          For experimental features, visit the <b>Experimental</b> section.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {activeSection === 'labs' && (
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-amber-500">
                        <Sparkles size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Beta Features</span>
                      </div>
                      <p className="text-xs text-amber-500/70 leading-relaxed font-medium">
                        These features are currently in testing. 
                        Enabling them may cause instability but offers a glimpse into future updates.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <PreferenceToggle
                        label="AV1 High Quality"
                        description="Prioritize next-gen AV1 encoding for higher detail"
                        checked={preferences.av1MasterStream}
                        onChange={(val: boolean) => updatePreferences({ av1MasterStream: val })}
                        icon={Play}
                        status={preferences.av1MasterStream ? 'ACTIVE' : 'OFF'}
                      />
                      <PreferenceToggle
                        label="Smooth Motion"
                        description="Experimental frame interpolation for action titles"
                        checked={preferences.ultraFluidPlayback}
                        onChange={(val: boolean) => updatePreferences({ ultraFluidPlayback: val })}
                        icon={Monitor}
                        status={preferences.ultraFluidPlayback ? 'ON' : 'OFF'}
                      />
                      <PreferenceToggle
                        label="Image Enhancement"
                        description="Improve visual quality using advanced processing"
                        checked={preferences.aiUpscaling}
                        onChange={(val: boolean) => updatePreferences({ aiUpscaling: val })}
                        icon={Sparkles}
                        status={preferences.aiUpscaling ? 'ACTIVE' : 'OFF'}
                      />
                    </div>
                    
                    <div className="pt-8">
                       <div className="flex flex-col gap-2 p-6 bg-zinc-900/30 rounded-2xl border border-white/5">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Diagnostics</span>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="flex flex-col">
                                <span className="text-[7px] font-bold text-zinc-600 uppercase">Version</span>
                                <span className="text-[10px] font-mono text-zinc-400">2.4.0-stable</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[7px] font-bold text-zinc-600 uppercase">Latency</span>
                                <span className="text-[10px] font-mono text-zinc-400">12ms</span>
                             </div>
                          </div>
                       </div>
                    </div>
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

interface PreferenceToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  icon: React.ElementType;
  status?: string;
}

const PreferenceToggle = ({ label, description, checked, onChange, icon: Icon, status }: PreferenceToggleProps) => (
  <div className="flex items-center justify-between gap-8 p-4 rounded-[1.5rem] bg-black/40 border border-white/5 hover:border-white/10 transition-all group">
    <div className="flex items-start gap-4">
      <div className="mt-1 w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{label}</span>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter opacity-70">{status || (checked ? 'ON' : 'OFF')}</span>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => onChange(!checked)}
        title={`Toggle ${label}`}
        aria-label={`Toggle ${label}: ${checked ? 'On' : 'Off'}`}
        className={cn(
          'w-12 h-6 rounded-full relative transition-all duration-300',
          checked ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : 'bg-zinc-800'
        )}
      >
        <motion.div
          animate={{ x: checked ? 26 : 4 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  </div>
);
