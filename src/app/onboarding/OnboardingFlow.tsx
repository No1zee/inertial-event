'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Check,
  Zap
} from 'lucide-react';
import { usePreferencesActions } from '@/lib/stores/preferencesStore';
import { useProfileActions } from '@/lib/stores/localDataStore';
import { useThemeStore, Theme } from '@/lib/stores/themeStore';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { cn } from '@/lib/utils';

const GENRES = [
  { id: 'action', name: 'Action', icon: '💥', isTop: true },
  { id: 'comedy', name: 'Comedy', icon: '😂', isTop: true },
  { id: 'drama', name: 'Drama', icon: '🎭', isTop: true },
  { id: 'sci-fi', name: 'Sci-Fi', icon: '🛸', isTop: true },
  { id: 'thriller', name: 'Thriller', icon: '🔪', isTop: true },
  { id: 'animation', name: 'Animation', icon: '🎨', isTop: true },
  { id: 'horror', name: 'Horror', icon: '👻' },
  { id: 'documentary', name: 'Docs', icon: '📽️' },
  { id: 'adventure', name: 'Adventure', icon: '⛰️' },
  { id: 'crime', name: 'Crime', icon: '🕵️' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'mystery', name: 'Mystery', icon: '🔍' },
  { id: 'romance', name: 'Romance', icon: '❤️' },
  { id: 'war', name: 'War', icon: '🎖️' },
  { id: 'western', name: 'Western', icon: '🤠' },
  { id: 'kids', name: 'Kids', icon: '👶' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'reality', name: 'Reality', icon: '📺' },
  { id: 'soap', name: 'Soap', icon: '🧼' },
  { id: 'talk', name: 'Talk', icon: '💬' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'anime', name: 'Anime', icon: '🗾' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🦾' },
  { id: 'noir', name: 'Neo-Noir', icon: '🕶️' },
  { id: 'space', name: 'Space Opera', icon: '🌌' },
  { id: 'supernatural', name: 'Supernatural', icon: '🔮' },
];

const AVATARS = [
  { seed: 'Felix', color: 'b6e3f4' },
  { seed: 'Aneka', color: 'c0aede' },
  { seed: 'Caleb', color: 'd1d4f9' },
  { seed: 'Buddy', color: 'ffd5dc' },
  { seed: 'Jasper', color: 'ffebae' },
  { seed: 'Lucky', color: 'c1f4e5' },
  { seed: 'Milo', color: 'd0f4b6' },
  { seed: 'Oliver', color: 'f4d8b6' },
  { seed: 'Peanut', color: 'f4b6b6' },
  { seed: 'Pumpkin', color: 'f4b6f0' },
].map(a => `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.seed}&backgroundColor=${a.color}`);

const VIBES = [
  { id: 'chilled', name: 'Chilled Out', desc: 'Relaxing, slow-paced stories for a quiet night.' },
  { id: 'high-energy', name: 'High Energy', desc: 'Intense, fast-paced action and thrillers.' },
  { id: 'thought-provoking', name: 'Deep & Thought-Provoking', desc: 'Complex stories that stay with you long after.' },
  { id: 'dark-gritty', name: 'Dark & Gritty', desc: 'Raw, realistic, and intense underworld atmospheres.' },
  { id: 'lighthearted', name: 'Lighthearted & Fun', desc: 'Easy watching, feel-good stories and laughs.' },
  { id: 'epic', name: 'Epic & Grand', desc: 'Massive scale, legendary tales, and big visuals.' },
];

const THEMES: { id: Theme; name: string; desc: string; colors: string[] }[] = [
  { id: 'Nova', name: 'Nova Stream', desc: 'The classic cinematic experience. Deep blacks and secondary accents.', colors: ['#000000', '#E50914'] },
  { id: 'ocean', name: 'Oceanic', desc: 'Cool and deep. Midnight blues with teal highlights.', colors: ['#0A192F', '#0EA5E9'] },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Vibrant and intense. Neon purples and electric cyan.', colors: ['#0D0221', '#FF00BB'] },
  { id: 'oled', name: 'Pure OLED', desc: 'Minimum distraction. Absolute black and pristine white.', colors: ['#000000', '#FFFFFF'] },
  { id: 'heritage', name: 'Heritage', desc: 'Warm and earthy. Gold accents on deep umber.', colors: ['#1A140F', '#FFB700'] },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedTheme, _setSelectedTheme] = useState<Theme>('Nova');
  
  const setSelectedTheme = (t: Theme) => {
    _setSelectedTheme(t);
    setTheme(t);
  };
  
  const { 
    setHasCompletedOnboarding, 
    setPreferredGenres, 
    setGenreWeights,
    setPreferredVibes 
  } = usePreferencesActions();
  const { createProfile, setActiveProfile, updateProfile } = useProfileActions();
  const { setTheme } = useThemeStore();

  const handleNext = () => setStep(s => s + 1);

  const handleComplete = (isGuest = false) => {
    console.log('🏁 [AG] Completing onboarding...', { isGuest, profileName });
    
    // Set theme immediately
    if (!isGuest) {
      setTheme(selectedTheme);
    }

    // Set to completion splash first
    setStep(5);
    
    setTimeout(() => {
      try {
        if (isGuest) {
          const guestId = createProfile({
            name: 'Guest',
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            isKids: false,
            isLocked: false,
            isGuest: true,
            preferences: { genres: [], vibes: [] }
          });
          setActiveProfile(guestId);
        } else {
          const genreWeights: Record<string, number> = {};
          selectedGenres.forEach(id => { genreWeights[id] = 1; });

          updateProfile('primary', {
            name: profileName || 'User',
            avatar: selectedAvatar,
            preferences: {
              genres: selectedGenres,
              genreWeights: genreWeights,
              vibes: selectedVibes,
              theme: selectedTheme
            }
          });
          setActiveProfile('primary');
        }
        
        setPreferredGenres(isGuest ? [] : selectedGenres);
        const finalWeights: Record<string, number> = {};
        selectedGenres.forEach(id => { finalWeights[id] = 1; });
        setGenreWeights(isGuest ? {} : finalWeights);
        setPreferredVibes(isGuest ? [] : selectedVibes);
        setHasCompletedOnboarding(true);
        router.push('/');
      } catch (error) {
        console.error('❌ [AG] Onboarding completion failed:', error);
      }
    }, 2000); // 2 second reward moment
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleVibe = (id: string) => {
    setSelectedVibes(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden p-6">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black z-10" />
        <motion.img 
          key={step}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2 }}
          src={step === 0 ? "https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtecsozsPbSUS.jpg" : "https://image.tmdb.org/t/p/original/vI6z3N706LNE7787QW5Z67Fpao0.jpg"} 
          alt="Cinematic background" 
          className="w-full h-full object-cover blur-3xl"
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-20 w-full max-w-2xl mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col items-center text-center gap-10"
          >
            <div className="space-y-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Welcome</span>
              <PretextHeadline 
                text="Your Personal Cinema" 
                fontSize={56}
                fontWeight={900}
                letterSpacing="-0.04em"
                className="text-white uppercase" 
              />
            </div>
            
            <p className="text-zinc-500 text-lg max-w-md leading-relaxed font-medium">
              Cinema the way it was meant to be seen. Tailored to your taste, with every frame optimized for your screen.
            </p>

            <Button 
              onClick={handleNext}
              className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              Continue
              <ArrowRight size={20} />
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-20 w-full max-w-2xl mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col items-center gap-12"
          >
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Profile Setup</span>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Who&apos;s watching?</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Step 1 of 4</span>
                <div className="h-1 w-24 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-1/4 bg-primary rounded-full" />
                </div>
              </div>
            </div>
            <p className="text-zinc-500 text-sm font-medium -mt-6">Choose a name (max 12 chars) and a custom avatar for your account.</p>

            <div className="w-full space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Your Name</label>
                <input 
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl px-6 text-xl font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Avatar</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Bottts Series</span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {AVATARS.map((avatar, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 group ${
                        selectedAvatar === avatar ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' : 'border-white/5 opacity-80 grayscale-0 hover:border-white/30 hover:opacity-100'
                      }`}
                    >
                      <OptimizedImage src={avatar} alt={`Avatar ${i}`} fill className="object-cover" />
                      {selectedAvatar === avatar && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <Check size={20} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full">
               <button 
                onClick={() => handleComplete(true)}
                className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors flex-1 text-center"
              >
                Skip to Guest
              </button>
              <Button 
                onClick={handleNext}
                disabled={!profileName.trim() || profileName.length > 12}
                className="flex-[2] h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {profileName.length > 12 ? 'Name Too Long' : 'Continue'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="genres"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-20 w-full max-w-2xl mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col gap-10"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Personalize</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Favorite Genres</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Step 2 of 4</span>
                <div className="h-1 w-24 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-2/4 bg-primary rounded-full" />
                </div>
              </div>
            </div>

            <p className="text-zinc-500 text-sm font-medium">Pick at least 3 to improve your recommendations.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {GENRES.filter(g => showAllGenres || g.isTop).map(genre => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={cn(
                    "h-14 rounded-xl border transition-all flex items-center justify-between px-4 group",
                    selectedGenres.includes(genre.id) 
                      ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' 
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {selectedGenres.includes(genre.id) && <Check size={12} strokeWidth={4} />}
                    <span className="font-bold text-[10px] uppercase tracking-widest truncate">{genre.name}</span>
                  </div>
                  <span className="text-lg group-hover:scale-125 transition-transform">{genre.icon}</span>
                </button>
              ))}
              
              {!showAllGenres && (
                <button
                  onClick={() => setShowAllGenres(true)}
                  className="h-14 rounded-xl border border-white/5 bg-white/5 text-zinc-500 hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  See All
                </button>
              )}
            </div>

            <div className="flex gap-4 w-full pt-4">
               <Button 
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 h-16 rounded-2xl border-white/5 text-zinc-500 font-black uppercase tracking-widest"
              >
                Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={selectedGenres.length < 3}
                className="flex-[2] h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
              >
                {selectedGenres.length < 3 ? `${selectedGenres.length} of 3 selected` : 'Continue'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="vibes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-20 w-full max-w-2xl mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col gap-10"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Personalize</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Tonight&apos;s Mood</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Step 3 of 4</span>
                <div className="h-1 w-24 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-3/4 bg-primary rounded-full" />
                </div>
              </div>
            </div>

            <p className="text-zinc-500 text-sm font-medium">How do you want to feel tonight? Pick one to personalize your feed.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIBES.map(vibe => (
                <button
                  key={vibe.id}
                  onClick={() => toggleVibe(vibe.id)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex flex-col items-start gap-1 text-left group",
                    selectedVibes.includes(vibe.id) 
                      ? 'bg-primary text-black border-primary' 
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">{vibe.name}</span>
                    {selectedVibes.includes(vibe.id) ? (
                      <Check size={16} strokeWidth={4} />
                    ) : (
                      <Zap size={16} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium leading-tight",
                    selectedVibes.includes(vibe.id) ? 'text-black/60' : 'text-zinc-500'
                  )}>
                    {vibe.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 w-full pt-4">
               <Button 
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 h-16 rounded-2xl border-white/5 text-zinc-600 font-black uppercase tracking-widest text-[10px] hover:text-white"
              >
                Back
              </Button>
              <Button 
                onClick={() => setStep(4)}
                className="flex-[2] h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Continue
                <ArrowRight size={20} />
              </Button>
            </div>
            
            <button 
              onClick={() => handleComplete()}
              className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors text-center"
            >
              Skip for now
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="themes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-20 w-full max-w-2xl mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col gap-10"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Visuals</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Choose Your Identity</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Step 4 of 4</span>
                <div className="h-1 w-24 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-full bg-primary rounded-full" />
                </div>
              </div>
            </div>

            <p className="text-zinc-500 text-sm font-medium">Select a visual theme for your cinematic journey. You can change this later.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={cn(
                    "p-6 rounded-2xl border transition-all flex flex-col items-start gap-3 group relative overflow-hidden",
                    selectedTheme === theme.id 
                      ? 'bg-white/10 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' 
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn(
                      "font-black text-sm uppercase tracking-widest transition-colors",
                      selectedTheme === theme.id ? 'text-white' : 'text-zinc-400'
                    )}>
                      {theme.name}
                    </span>
                    <div className="flex gap-1.5">
                      {theme.colors.map((c, i) => (
                        <motion.div 
                          key={i} 
                          className="w-3 h-3 rounded-full border border-white/10" 
                          initial={false}
                          animate={{ backgroundColor: c }} 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500 leading-tight text-left">
                    {theme.desc}
                  </span>
                  
                  {selectedTheme === theme.id && (
                    <motion.div 
                      layoutId="activeTheme"
                      className="absolute right-0 top-0 bottom-0 w-1 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4 w-full pt-4">
               <Button 
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1 h-16 rounded-2xl border-white/5 text-zinc-600 font-black uppercase tracking-widest text-[10px] hover:text-white"
              >
                Back
              </Button>
              <Button 
                onClick={() => handleComplete()}
                className="flex-[2] h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Complete Setup
                <ShieldCheck size={20} />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div 
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-20 w-full max-w-md mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col items-center text-center gap-8"
          >
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)]">
              <ShieldCheck size={48} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <PretextHeadline 
                text="Profile Ready" 
                fontSize={32}
                fontWeight={900}
                className="text-white uppercase" 
              />
              <p className="text-zinc-500 font-medium">Identity verified. Personalizing your cinematic universe...</p>
            </div>
            
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1,
                    delay: i * 0.2
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
