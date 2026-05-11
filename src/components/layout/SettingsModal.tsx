'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, User, Monitor, Database, Play, SkipForward, Volume2, Search, Info, Shield, Zap, Sparkles, Activity } from 'lucide-react';
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
    stillWatchingEnabled, setStillWatchingEnabled,
    diagnosticsEnabled, setDiagnosticsEnabled,
    bufferStrategy, setBufferStrategy,
    atmosphereIntensity, setAtmosphereIntensity,
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
            className="relative w-full max-w-5xl h-[600px] bg-[hsl(var(--background))] border border-[hsl(var(--foreground)/.05)] rounded-[3rem] shadow-2xl overflow-hidden flex"
          >
            {/* Sidebar */}
            <div className="w-64 bg-[hsl(var(--foreground)/.03)] border-r border-[hsl(var(--foreground)/.05)] p-8 flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--foreground))] opacity-80">Settings</h2>
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
                        : 'text-[hsl(var(--foreground)/.4)] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/.03)]'
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
              <header className="p-8 border-b border-[hsl(var(--foreground)/.05)] flex items-center justify-between">
                <h3 className="text-xl font-black text-[hsl(var(--foreground))] uppercase tracking-tighter">
                  {sections.find(s => s.id === activeSection)?.label}
                </h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  title="Close"
                  aria-label="Close Settings"
                  className="p-2 text-[hsl(var(--foreground)/.4)] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeSection === 'profile' && (
                  <div className="max-w-2xl mx-auto py-4">
                    <ProfileSwitcher />
                    
                    <div className="mt-12 p-8 rounded-[2.5rem] bg-[hsl(var(--foreground)/.02)] border border-[hsl(var(--foreground)/.05)] flex items-start gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[hsl(var(--foreground))] uppercase tracking-tighter mb-2 italic">Profile Privacy</h4>
                        <p className="text-xs text-[hsl(var(--foreground)/.5)] font-medium leading-relaxed">
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
                    <PreferenceToggle
                      label="Stream Diagnostics"
                      description="Overlay real-time stream health and bitrates"
                      checked={diagnosticsEnabled}
                      onChange={(val: boolean) => setDiagnosticsEnabled(val)}
                      icon={Activity}
                    />
                    
                    <div className="p-4 rounded-[1.5rem] bg-[hsl(var(--foreground)/.03)] border border-[hsl(var(--foreground)/.05)] space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--foreground)/.03)] border border-[hsl(var(--foreground)/.05)] flex items-center justify-center text-[hsl(var(--foreground)/.4)]">
                          <Zap size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[hsl(var(--foreground))] uppercase tracking-widest mb-1">Buffer Strategy</span>
                          <span className="text-[10px] font-bold text-[hsl(var(--foreground)/.4)] uppercase tracking-tighter opacity-70">Optimize for your connection</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {(['standard', 'aggressive', 'minimal'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setBufferStrategy(s)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                              bufferStrategy === s 
                                ? "bg-primary text-black" 
                                : "bg-[hsl(var(--foreground)/.03)] text-[hsl(var(--foreground)/.4)] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--foreground)/.05)]"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
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

                    <div className="p-6 rounded-[2rem] bg-[hsl(var(--foreground)/.03)] border border-[hsl(var(--foreground)/.05)] space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--foreground)/.05)] flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
                            <Sparkles size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[hsl(var(--foreground))] uppercase tracking-widest mb-1">Atmosphere Intensity</span>
                            <span className="text-[10px] font-bold text-[hsl(var(--foreground)/.4)] uppercase tracking-tighter opacity-70">Adjust background aura depth</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-primary tabular-nums">{(atmosphereIntensity * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="px-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={atmosphereIntensity}
                          onChange={(e) => setAtmosphereIntensity(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[hsl(var(--foreground)/.05)] rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                        />
                        <div className="flex justify-between mt-3">
                          <span className="text-[8px] font-black text-[hsl(var(--foreground)/.2)] uppercase tracking-widest">Subtle</span>
                          <span className="text-[8px] font-black text-[hsl(var(--foreground)/.2)] uppercase tracking-widest">Immersive</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--foreground)/.4)]">
                        <Palette size={12} className="text-primary" />
                        App Theme
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { id: 'Nova', name: 'Nova Stream', color: '#E50914', subtitle: 'Cinematic Dark' },
                          { id: 'ocean', name: 'Oceanic', color: '#0EA5E9', subtitle: 'Deep Blue Calm' },
                          { id: 'cyberpunk', name: 'Cyberpunk', color: '#FF00BB', subtitle: 'Neon Streets' },
                          { id: 'oled', name: 'Pure OLED', color: '#FFFFFF', subtitle: 'True Black' },
                          { id: 'heritage', name: 'Heritage', color: '#FFB700', subtitle: 'Royal Gold' },
                          { id: 'aurora', name: 'Aurora', color: '#00FF80', subtitle: 'Northern Lights' },
                          { id: 'titanium', name: 'Titanium', color: '#A9ADB6', subtitle: 'Industrial Steel' },
                          { id: 'ghost', name: 'Ghost', color: '#F5F5F5', subtitle: 'Light Mode' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTheme(t.id as Theme);
                              handleUpdatePreference({ theme: t.id });
                            }}
                            className={cn(
                              'flex flex-col gap-2 p-4 rounded-[1.5rem] border transition-all text-left group/theme',
                              theme === t.id
                                ? 'bg-[hsl(var(--foreground)/.05)] border-[hsl(var(--foreground)/.2)]'
                                : 'bg-transparent border-[hsl(var(--foreground)/.05)] hover:bg-[hsl(var(--foreground)/.03)] hover:border-[hsl(var(--foreground)/.1)]'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <motion.div
                                className="w-4 h-4 rounded-full ring-1 ring-[hsl(var(--foreground)/.15)]"
                                initial={false}
                                animate={{ backgroundColor: t.color }}
                              />
                                {theme === t.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                            </div>
                            <div className="flex flex-col">
                              <span className={cn(
                                'text-[10px] font-bold uppercase tracking-widest transition-colors',
                                theme === t.id ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--foreground)/.4)] group-hover/theme:text-[hsl(var(--foreground)/.7)]'
                              )}>
                                {t.name}
                              </span>
                              <span className="text-[8px] font-medium text-[hsl(var(--foreground)/.25)] tracking-wider">
                                {t.subtitle}
                              </span>
                            </div>
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
                    <div className="p-6 rounded-2xl bg-[hsl(var(--foreground)/.03)] border border-[hsl(var(--foreground)/.05)] flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-primary">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Playback Experience</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground)/.4)] leading-relaxed font-medium">
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
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[hsl(var(--foreground))]">System Settings</h4>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground)/.4)] font-medium mb-8 leading-relaxed max-w-xl">
                        Manage the core stability and session state of your NovaStream application.
                      </p>

                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            window.location.reload();
                          }}
                          className="w-full h-16 bg-[hsl(var(--foreground)/.03)] border border-[hsl(var(--foreground)/.05)] rounded-2xl flex items-center justify-between px-6 group/refresh hover:border-[hsl(var(--foreground)/.15)] transition-all"
                        >
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-[hsl(var(--background))] flex items-center justify-center text-[hsl(var(--foreground)/.4)] group-hover/refresh:text-[hsl(var(--foreground))] transition-colors">
                               <Shield size={18} />
                             </div>
                             <div className="flex flex-col items-start">
                               <span className="text-[10px] font-black text-[hsl(var(--foreground))] uppercase tracking-widest">Reload App</span>
                               <span className="text-[8px] font-bold text-[hsl(var(--foreground)/.2)] uppercase tracking-tighter">Restart the application</span>
                             </div>
                           </div>
                           <div className="w-8 h-8 rounded-full border border-[hsl(var(--foreground)/.05)] flex items-center justify-center text-[hsl(var(--foreground)/.2)] group-hover/refresh:text-[hsl(var(--foreground))] transition-all">
                             <SkipForward size={14} />
                           </div>
                        </button>
                      </div>
                    </div>

                     <div className="pt-8">
                       <div className="p-6 rounded-[2rem] bg-[hsl(var(--foreground)/.02)] border border-[hsl(var(--foreground)/.05)]">
                         <div className="flex items-center gap-3 mb-3 text-[hsl(var(--foreground)/.4)]">
                           <Info size={14} />
                           <span className="text-[8px] font-black uppercase tracking-[0.2em]">Note</span>
                         </div>
                         <p className="text-[10px] text-[hsl(var(--foreground)/.5)] leading-relaxed font-medium">
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
                        <div className="flex flex-col gap-2 p-6 bg-[hsl(var(--foreground)/.02)] rounded-2xl border border-[hsl(var(--foreground)/.05)]">
                           <span className="text-[8px] font-black text-[hsl(var(--foreground)/.4)] uppercase tracking-widest">Diagnostics</span>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                 <span className="text-[7px] font-bold text-[hsl(var(--foreground)/.2)] uppercase">Version</span>
                                 <span className="text-[10px] font-mono text-[hsl(var(--foreground)/.4)]">2.4.0-stable</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[7px] font-bold text-[hsl(var(--foreground)/.2)] uppercase">Latency</span>
                                 <span className="text-[10px] font-mono text-[hsl(var(--foreground)/.4)]">12ms</span>
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
  <div className="flex items-center justify-between gap-8 p-4 rounded-[1.5rem] bg-[hsl(var(--foreground)/.03)] border border-[hsl(var(--foreground)/.05)] hover:border-[hsl(var(--foreground)/.1)] transition-all group">
    <div className="flex items-start gap-4">
      <div className="mt-1 w-10 h-10 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--foreground)/.05)] flex items-center justify-center text-[hsl(var(--foreground)/.4)] group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-[hsl(var(--foreground))] uppercase tracking-widest mb-1">{label}</span>
        <span className="text-[10px] font-bold text-[hsl(var(--foreground)/.4)] uppercase tracking-tighter opacity-70">{status || (checked ? 'ON' : 'OFF')}</span>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => onChange(!checked)}
        title={`Toggle ${label}`}
        aria-label={`Toggle ${label}: ${checked ? 'On' : 'Off'}`}
        className={cn(
          'w-12 h-6 rounded-full relative transition-all duration-300',
          checked ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : 'bg-[hsl(var(--foreground)/.1)]'
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
