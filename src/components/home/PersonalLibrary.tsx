'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useActiveProfile } from '@/lib/stores/localDataStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { ShieldCheck, Zap, Heart, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PersonalLibrary() {
  const activeProfile = useActiveProfile();
  const isHydrated = useHydrated();

  if (!activeProfile || !isHydrated) return null;

  const stats = [
    { label: 'Taste Profile', value: '98.4%', icon: Target, color: 'text-amber-500', detail: 'RECOMMENDATION_ACCURACY' },
    { label: 'Viewing History', value: 'Active', icon: Zap, color: 'text-blue-500', detail: 'PROFILE_READY' },
    { label: 'Genre Interest', value: 'High', icon: Heart, color: 'text-red-500', detail: 'PREFERENCE_INDEX' },
  ];

  return (
    <section id="personal-library" className="px-10 lg:px-24 py-32 relative overflow-hidden bg-black/40">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] -mr-64 -mt-64" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div>
          <div className="flex items-center gap-5 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden group">
               <motion.div 
                 animate={{ y: [-20, 60] }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                 className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent w-full h-4"
               />
               <ShieldCheck size={28} className="relative z-10" />
            </div>
            <div>
              <PretextHeadline
                text="Personal Library"
                fontSize={36}
                fontWeight={900}
                letterSpacing="-0.03em"
                className="text-white uppercase leading-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Account Preferences</span>
              </div>
            </div>
          </div>

          <p className="text-zinc-400 text-lg font-light leading-relaxed mb-14 max-w-xl italic opacity-80">
            &quot;Your taste is your signature.&quot; Welcome to your library where every interaction
            helps refine your unique viewing experience.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
                className="p-8 rounded-[2rem] bg-black/40 border border-white/5 hover:border-amber-500/40 transition-all duration-500 group relative overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                   <stat.icon size={40} className={stat.color} />
                </div>
                
                <stat.icon className={cn("w-6 h-6 mb-6 transition-transform group-hover:scale-110 relative z-10", stat.color)} />
                <div className="text-3xl font-black text-white mb-2 relative z-10 tracking-tighter">{stat.value}</div>
                <div className="flex flex-col gap-1 relative z-10">
                   <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</div>
                   <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{stat.detail}</div>
                </div>
                
                <motion.div 
                   className="absolute bottom-0 left-0 h-1 bg-amber-500/20"
                   initial={{ width: 0 }}
                   whileInView={{ width: '100%' }}
                   transition={{ delay: idx * 0.2, duration: 1 }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative h-[500px] rounded-[4rem] overflow-hidden border border-white/5 bg-zinc-900/20 flex items-center justify-center group backdrop-blur-md shadow-2xl">
           {/* Data Visualization Grid */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]" />
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
           
           {/* Dynamic Data Particles */}
           {isHydrated && [...Array(8)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ 
                 y: [i * 50, (i * 70) % 400],
                 opacity: [0, 1, 0],
                 scale: [0.5, 1, 0.5]
               }}
               transition={{ 
                 duration: 4 + (i % 4),
                 repeat: Infinity,
                 ease: 'linear'
               }}
               className="absolute w-1 h-1 bg-amber-500/40 rounded-full blur-[1px]"
               initial={{ left: `${(i * 13) % 100}%` }}
             />
           ))}

           <div className="text-center relative z-10">
              <div className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.6em] mb-8 animate-pulse">Personalizing Experience</div>
              
              <div className="relative">
                 {/* Visualization Rings */}
                 <div className="w-56 h-56 rounded-full border border-amber-500/10 flex items-center justify-center p-6 relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 border-2 border-dashed border-amber-500/20 rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-4 border border-zinc-700 rounded-full"
                    />
                    
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center p-8 backdrop-blur-sm shadow-[inset_0_0_40px_rgba(245,158,11,0.1)]">
                       <ShieldCheck size={64} className="text-amber-500/40" />
                    </div>

                    {/* Scan Line */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-[2px] bg-amber-500/40 z-20 pointer-events-none shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                    />
                 </div>
              </div>

              <div className="mt-12 space-y-2">
                 <div className="text-white font-mono text-[10px] opacity-60 uppercase tracking-[0.2em]">
                    ID: {activeProfile.id.slice(0, 16).toUpperCase()}
                 </div>
                 <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-zinc-500 font-black text-[9px] uppercase tracking-widest">Active Profile</span>
                 </div>
              </div>
           </div>
           
           {/* UI Corner Deco */}
           <div className="absolute top-10 left-10 w-10 h-10 border-t-2 border-l-2 border-white/5" />
           <div className="absolute bottom-10 right-10 w-10 h-10 border-b-2 border-r-2 border-white/5" />
        </div>
      </div>
    </section>
  );
}
