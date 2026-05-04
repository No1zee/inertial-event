'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '../Common/PretextHeadline';
import { useRouter } from 'next/navigation';

export function AfricanCinematicUniverse() {
  const router = useRouter();

  const handleAdvance = () => {
    router.push('/channel/acu');
  };

  return (
    <section className="relative px-10 lg:px-24 py-24 overflow-hidden">
      {/* Background Heritage Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div 
          className="absolute inset-0 bg-repeat bg-center bg-[url(/patterns/acu-pattern.png)] bg-[length:400px]" 
        />
      </div>

      {/* Glow Accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/5 blur-[100px] rounded-full -z-10" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
        {/* Visual Showcase (The 'Lens') */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full lg:w-1/2 aspect-[4/5] md:aspect-square rounded-[4rem] overflow-hidden group/lens border border-white/5 shadow-2xl"
        >
          <OptimizedImage
            src="/images/acu_majesty.png"
            alt="African Cinematic Majesty"
            fill
            className="object-cover group-hover/lens:scale-105 transition-transform [transition-duration:2000ms] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          
          {/* Internal Overlay */}
          <div className="absolute inset-x-8 bottom-8 p-8 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">AFRICAN CINEMA</span>
            </div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
              Heritage <br/> Collection
            </h4>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
              Curating the most influential narratives <br/> across the continent.
            </p>
          </div>
        </motion.div>

        {/* Content & Mission */}
        <div className="w-full lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="px-4 py-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.3em]">
                New Era
              </div>
              <div className="h-[1px] w-12 bg-white/10" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                African Cinema
              </span>
            </div>

            <PretextHeadline
              text="ACU Collection"
              fontSize={64}
              fontWeight={900}
              letterSpacing="-0.04em"
              className="text-white mb-8 uppercase leading-[0.85]"
            />

            <p className="text-base text-zinc-500 font-medium leading-relaxed mb-10 border-l border-amber-500/30 pl-8 max-w-md">
              A unified frontier for African storytelling. Hand-picked stories, perfectly restored for the global stage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-all">
                <div className="text-amber-500"><Globe size={16} /></div>
                <div>
                  <h5 className="text-[10px] font-black text-white uppercase">Continental Cinema</h5>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-all">
                <div className="text-amber-500"><ShieldCheck size={16} /></div>
                <div>
                  <h5 className="text-[10px] font-black text-white uppercase">Film Heritage</h5>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAdvance}
              className="group flex items-center gap-4 px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-amber-500 hover:text-white transition-all shadow-2xl active:scale-95"
            >
              Explore Collection
              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
