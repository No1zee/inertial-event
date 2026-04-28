'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePreferencesActions } from '@/lib/stores/preferencesStore';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { setHasCompletedOnboarding } = usePreferencesActions();

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    router.push('/');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* Cinematic Background Blur */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black z-10" />
        <img 
          src="https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtecsozsPbSUS.jpg" 
          alt="Cinematic background" 
          className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
        />
      </div>

      {/* Main Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full max-w-2xl mx-auto p-12 md:p-20 rounded-[2rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] text-center flex flex-col items-center gap-10"
      >
        <div className="space-y-4">
          <PretextHeadline 
            text="INITIALIZING MAI WATCH" 
            fontSize={12}
            fontWeight={700}
            letterSpacing="0.4em"
            className="text-primary/60 uppercase" 
          />
          <PretextHeadline 
            text="Welcome to Mai Watch" 
            fontSize={48}
            fontWeight={900}
            letterSpacing="-0.02em"
            className="text-white" 
          />
        </div>

        <p className="text-zinc-400 font-medium text-lg leading-relaxed max-w-md mx-auto">
          The ultimate S-Class cinematic streaming architecture is now online and optimized for your network.
        </p>

        <Button 
          onClick={handleComplete}
          size="lg"
          className="h-14 px-10 rounded-full bg-white text-black font-bold tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center gap-3"
        >
          <ShieldCheck className="w-5 h-5" />
          Enter Sanctuary
        </Button>
      </motion.div>
    </div>
  );
}
