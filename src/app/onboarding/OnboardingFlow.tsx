'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  User, 
  Camera, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Check,
  Film,
  Tv,
  Zap
} from 'lucide-react';
import { usePreferencesActions } from '@/lib/stores/preferencesStore';
import { useLocalDataStore, useProfileActions } from '@/lib/stores/localDataStore';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

const GENRES = [
  { id: 'action', name: 'Action', icon: '💥' },
  { id: 'adventure', name: 'Adventure', icon: '⛰️' },
  { id: 'animation', name: 'Animation', icon: '🎨' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'crime', name: 'Crime', icon: '🕵️' },
  { id: 'documentary', name: 'Docs', icon: '📽️' },
  { id: 'drama', name: 'Drama', icon: '🎭' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'horror', name: 'Horror', icon: '👻' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'mystery', name: 'Mystery', icon: '🔍' },
  { id: 'romance', name: 'Romance', icon: '❤️' },
  { id: 'sci-fi', name: 'Sci-Fi', icon: '🛸' },
  { id: 'thriller', name: 'Thriller', icon: '🔪' },
  { id: 'war', name: 'War', icon: '🎖️' },
  { id: 'western', name: 'Western', icon: '🤠' },
  { id: 'kids', name: 'Kids', icon: '👶' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'reality', name: 'Reality', icon: '📺' },
  { id: 'soap', name: 'Soap', icon: '🧼' },
  { id: 'talk', name: 'Talk', icon: '💬' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
];

const VIBES = [
  { id: 'chilled', name: 'Chilled Out', desc: 'Relaxing, slow-paced stories for a quiet night.' },
  { id: 'high-energy', name: 'High Energy', desc: 'Intense, fast-paced action and thrillers.' },
  { id: 'thought-provoking', name: 'Deep & Thought-Provoking', desc: 'Complex stories that stay with you long after.' },
  { id: 'dark-gritty', name: 'Dark & Gritty', desc: 'Raw, realistic, and intense underworld atmospheres.' },
  { id: 'lighthearted', name: 'Lighthearted & Fun', desc: 'Easy watching, feel-good stories and laughs.' },
  { id: 'epic', name: 'Epic & Grand', desc: 'Massive scale, legendary tales, and big visuals.' },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profileName, setProfileName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  
  const { setHasCompletedOnboarding, setPreferredGenres, setPreferredVibes } = usePreferencesActions();
  const { createProfile, setActiveProfile, profiles } = useLocalDataStore();
  const { updateProfile } = useProfileActions();

  const handleNext = () => setStep(s => s + 1);

  const handleComplete = (isGuest = false) => {
    // 1. If it's a guest, create a new profile and set it as active
    if (isGuest) {
      const guestId = createProfile({
        name: 'Guest',
        avatar: '/avatars/default.png',
        isKids: false,
        isLocked: false,
        isGuest: true,
        preferences: {
          genres: [],
          vibes: []
        }
      });
      
      setActiveProfile(guestId);
    } else {
      // 2. If it's a real user, update the 'primary' profile with their choices
      updateProfile('primary', {
        name: profileName || 'User',
        preferences: {
          genres: selectedGenres,
          vibes: selectedVibes
        }
      });
      setActiveProfile('primary');
    }
    
    // 3. Save global preferences for fallback
    setPreferredGenres(isGuest ? [] : selectedGenres);
    setPreferredVibes(isGuest ? [] : selectedVibes);
    setHasCompletedOnboarding(true);
    
    // 4. Navigate home
    router.push('/');
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
              <PretextHeadline 
                text="GETTING STARTED" 
                fontSize={12}
                fontWeight={900}
                letterSpacing="0.5em"
                className="text-primary uppercase" 
              />
              <PretextHeadline 
                text="Your Personal Cinema" 
                fontSize={56}
                fontWeight={900}
                letterSpacing="-0.04em"
                className="text-white uppercase" 
              />
            </div>
            
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Experience cinema the way it was meant to be seen. Tailored to your taste, with every frame optimized for your screen.
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
            <div className="text-center space-y-2">
              <PretextHeadline 
                text="Account Setup" 
                fontSize={12}
                fontWeight={900}
                letterSpacing="0.4em"
                className="text-primary uppercase" 
              />
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Create Account</h2>
            </div>

            <div className="w-full space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border border-white/10 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                   <User size={48} className="text-zinc-700" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                   </div>
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Profile Picture</span>
              </div>
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
            </div>

            <div className="flex gap-4 w-full">
               <Button 
                onClick={() => handleComplete(true)}
                variant="outline"
                className="flex-1 h-16 rounded-2xl border-white/5 text-zinc-500 font-black uppercase tracking-widest"
              >
                Guest Mode
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!profileName.trim()}
                className="flex-[2] h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="preferences"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-20 w-full max-w-4xl mx-auto p-12 rounded-[3rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col gap-12"
          >
            <div className="text-center space-y-2">
              <PretextHeadline 
                text="Personalize" 
                fontSize={12}
                fontWeight={900}
                letterSpacing="0.4em"
                className="text-primary uppercase" 
              />
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Pick your vibes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               {/* Genres */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 ml-2">
                    <Film size={16} className="text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Favorite Genres</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {GENRES.map(genre => (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.id)}
                        className={`h-14 rounded-xl border transition-all flex items-center justify-between px-4 ${
                          selectedGenres.includes(genre.id) 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-bold text-sm uppercase tracking-wider">{genre.name}</span>
                        <span className="text-lg">{genre.icon}</span>
                      </button>
                    ))}
                  </div>
               </div>

               {/* Vibes */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 ml-2">
                    <Zap size={16} className="text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cinematic Vibes</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {VIBES.map(vibe => (
                      <button
                        key={vibe.id}
                        onClick={() => toggleVibe(vibe.id)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-start gap-1 text-left ${
                          selectedVibes.includes(vibe.id) 
                            ? 'bg-primary text-black border-primary' 
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-black text-xs uppercase tracking-widest">{vibe.name}</span>
                          {selectedVibes.includes(vibe.id) && <Check size={14} />}
                        </div>
                        <span className={`text-[10px] ${selectedVibes.includes(vibe.id) ? 'text-black/60' : 'text-zinc-600'}`}>{vibe.desc}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex gap-4 w-full">
               <Button 
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 h-16 rounded-2xl border-white/5 text-zinc-500 font-black uppercase tracking-widest"
              >
                Back
              </Button>
              <Button 
                onClick={handleComplete}
                className="flex-[2] h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Start Watching
                <ShieldCheck size={20} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
