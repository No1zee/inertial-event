'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Info, Map, Music, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PretextHeadline } from '@/components/Common/PretextHeadline';


interface XRayOverlayProps {
  show: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cast: any[];
  trivia: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scenes?: any[];
}

export const XRayOverlay: React.FC<XRayOverlayProps> = ({
  show,
  onClose,
  cast,
  trivia,
}) => {
  const [activeView, setActiveView] = React.useState<'main' | 'map' | 'timeline'>('main');
  const [selectedPerson, setSelectedPerson] = React.useState<XRayOverlayProps['cast'][0] | null>(null);

  const locations = [
    { name: 'Cinematic Sanctuary HQ', coords: '40.7128° N, 74.0060° W', description: 'Primary production hub for establishing sequences.' },
    { name: 'Aegis Outpost', coords: '34.0522° N, 118.2437° W', description: 'Location for high-octane tactical narrative beats.' },
    { name: 'Sanctum Delta', coords: '51.5074° N, 0.1278° W', description: 'Atmospheric backdrop for the third act reveals.' },
  ];

  const renderMain = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 h-full overflow-hidden">
      {/* Cast Section */}
      <div className="flex flex-col gap-8 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">
            <Users size={14} className="text-primary" />
            <span>In this Scene</span>
          </div>
          <button 
            onClick={() => setActiveView('timeline')}
            className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
          >
            Full Timeline
          </button>
        </div>
        
        <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar pb-20">
          {(cast || []).slice(0, 8).map((person, i) => (
            <motion.div 
              key={person.id || i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedPerson(person)}
              className="group flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0 relative bg-zinc-800">
                {person.profile_path ? (
                  <OptimizedImage src={`https://image.tmdb.org/t/p/w200${person.profile_path}`} alt={person.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-xl uppercase">
                    {person.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden">
                <PretextHeadline 
                  text={person.name} 
                  fontSize={14} 
                  fontWeight={700} 
                  className="text-white"
                />
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest truncate mt-1">{person.character}</span>
              </div>
              <ChevronRight size={14} className="ml-auto text-zinc-600 group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trivia / Behind the Scenes */}
      <div className="lg:col-span-2 flex flex-col gap-8 overflow-hidden">
        <div className="flex items-center gap-3 text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">
          <Info size={14} className="text-primary" />
          <span>Director&apos;s Insights</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto no-scrollbar pb-20">
          {trivia.length > 0 ? trivia.map((text, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-8 rounded-3xl bg-linear-to-br from-white/[0.05] to-transparent border border-white/5 relative group"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                {i + 1}
              </div>
              <p className="text-zinc-300 text-lg leading-relaxed font-light mt-4 italic">
                &quot;{text}&quot;
              </p>
            </motion.div>
          )) : (
            <div className="col-span-2 p-12 text-center border border-dashed border-white/10 rounded-3xl">
              <p className="text-zinc-500 uppercase tracking-[0.2em] font-black text-xs">No trivia available for this segment.</p>
            </div>
          )}

          {/* Geography / Music Context (Feature 4 / Feature 8) */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Map size={18} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tactical Geography</span>
              </div>
              <span className="text-[9px] font-bold text-amber-500/50 border border-amber-500/20 px-2 py-0.5 rounded">FEATURE 4</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              This production utilized real-time location tracking for the establishing shots, mapping the narrative journey across 4 distinct global coordinates.
            </p>
            <button 
              onClick={() => setActiveView('map')}
              className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 hover:text-amber-500 transition-colors"
            >
              View Mission Map <ChevronRight size={14} />
            </button>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music size={18} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Acoustic Identity</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The soundscape features custom procedural synthesis and high-fidelity orchestral scores designed to emphasize the dramatic tension.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="flex flex-col gap-12 h-full overflow-hidden">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveView('main')}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
          title="Back to Main View"
          aria-label="Back to Main View"
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Acoustic & Visual Narrative</span>
          <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Character Appearance Timeline</h3>
        </div>
      </div>

      <div className="flex flex-col gap-8 flex-1 overflow-y-auto no-scrollbar pb-32">
         {cast.slice(0, 10).map((person, i) => (
           <motion.div
             key={person.id || i}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.1 }}
             onClick={() => setSelectedPerson(person)}
             className="relative p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6 group hover:bg-white/[0.05] transition-all cursor-pointer"
           >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-primary/40 transition-all shrink-0">
                    {person.profile_path ? (
                      <OptimizedImage src={`https://image.tmdb.org/t/p/w200${person.profile_path}`} alt={person.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600 font-bold text-2xl uppercase">
                        {person.name?.charAt(0)}
                      </div>
                    )}
                 </div>
                 <div className="flex flex-col min-w-0 overflow-hidden">
                    <PretextHeadline 
                      text={person.name} 
                      fontSize={20} 
                      fontWeight={700} 
                      letterSpacing="-0.02em" 
                      className="text-white" 
                    />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">{person.character}</span>
                 </div>
                 <div className="ml-auto flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Screen Time:</span>
                    <span className="text-xs font-mono text-primary font-bold">{Math.floor(Math.random() * 40) + 10}m</span>
                 </div>
              </div>

              {/* Timeline Visualization */}
              <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden">
                 <div className="absolute inset-0 bg-white/5" />
                 {/* Mock Appearance Blocks */}
                 <div className="absolute h-full bg-primary/40 rounded-full left-[10%] w-[15%]" />
                 <div className="absolute h-full bg-primary/40 rounded-full left-[40%] w-[20%]" />
                 <div className="absolute h-full bg-primary rounded-full shadow-[0_0_10px_rgba(192,57,43,0.5)] left-[75%] w-[10%]" />
              </div>
              <div className="flex justify-between items-center text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                 <span>00:00:00</span>
                 <span>Midpoint</span>
                 <span>Conclusion</span>
              </div>
           </motion.div>
         ))}
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="flex flex-col gap-12 h-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveView('main')}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
          title="Back to Main View"
          aria-label="Back to Main View"
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Global Trajectory</span>
          <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Production Mission Map</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1 overflow-hidden">
        {/* Mock Map Visualization */}
        <div className="relative rounded-[3rem] overflow-hidden border border-white/10 bg-zinc-900/50 group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
               {/* Animated Coordinates Grid */}
               <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-amber-500/20" />
                  ))}
               </div>
               
               {/* Location Markers */}
               {locations.map((loc, i) => (
                 <motion.div
                   key={i}
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ delay: 0.5 + i * 0.2 }}
                   className="absolute flex flex-col items-center gap-2"
                   style={{ 
                     top: `${20 + i * 25}%`, 
                     left: `${30 + i * 20}%` 
                   }}
                 >
                    <div className="w-4 h-4 bg-amber-500 rounded-full animate-ping absolute" />
                    <div className="w-4 h-4 bg-amber-500 rounded-full relative z-10 border-2 border-black" />
                    <div className="px-3 py-1 bg-black/80 backdrop-blur-md border border-amber-500/20 rounded-lg whitespace-nowrap">
                       <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{loc.name}</span>
                    </div>
                 </motion.div>
               ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Coordinate</span>
                <span className="text-[10px] font-black text-amber-500 tracking-tighter">SECURE LINK ESTABLISHED</span>
             </div>
             <p className="text-xl font-bold text-white font-mono tracking-tighter">40.7128° N, 74.0060° W</p>
          </div>
        </div>

        {/* Location Details */}
        <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar pr-4 pb-20">
           {locations.map((loc, i) => (
             <motion.div
               key={i}
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 0.8 + i * 0.1 }}
               className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all group"
             >
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{loc.name}</h4>
                   <span className="text-[10px] font-mono text-zinc-500">{loc.coords}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed italic">
                   &quot;{loc.description}&quot;
                </p>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="absolute inset-0 z-[80] bg-black/40 flex flex-col p-12 sm:p-24 overflow-hidden"
        >
           <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                 <div className="w-1.5 h-8 bg-primary rounded-full" />
                 <PretextHeadline
                    text="Director's Cut Context"
                    fontSize={36}
                    fontWeight={900}
                    letterSpacing="-0.05em"
                    className="text-white uppercase"
                 />
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-bold uppercase tracking-widest text-xs transition-all"
              >
                Return to Stream
              </button>
           </div>

           {activeView === 'main' ? renderMain() : activeView === 'map' ? renderMap() : renderTimeline()}

           {/* Cast Bio Overlay (Feature 16) */}
           <AnimatePresence>
             {selectedPerson && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 z-[90] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-12"
               >
                  <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                     <div className="aspect-3/4 rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                        {selectedPerson.profile_path ? (
                          <OptimizedImage src={`https://image.tmdb.org/t/p/original${selectedPerson.profile_path}`} alt={selectedPerson.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-black text-6xl">
                             {selectedPerson.name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-8 left-8 right-8">
                           <PretextHeadline 
                             text={selectedPerson.name} 
                             fontSize={36} 
                             fontWeight={900} 
                             className="text-white uppercase" 
                           />
                           <p className="text-primary font-bold uppercase tracking-widest text-xs mt-2">{selectedPerson.character}</p>
                        </div>
                     </div>

                     <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-3">
                           <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Active Profile</span>
                           </div>
                        </div>
                        <h3 className="text-5xl font-black text-white uppercase tracking-tighter">Biographical Insights</h3>
                        <p className="text-zinc-400 text-lg leading-relaxed font-light">
                           Extensive performance history and cinematic contributions identified. Profile suggests a high-fidelity alignment with the current directorial vision.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Primary Role</span>
                              <span className="text-white font-bold">{selectedPerson.character}</span>
                           </div>
                           <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Cinematic Standing</span>
                              <span className="text-white font-bold italic">PROMINENT</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 pt-8">
                           <a 
                             href={`https://www.themoviedb.org/person/${selectedPerson.id}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex-1 py-4 bg-white text-black text-center font-black uppercase tracking-widest text-xs rounded-xl hover:scale-105 transition-all"
                           >
                             Explore Full Bio
                           </a>
                           <button 
                             onClick={() => setSelectedPerson(null)}
                             className="flex-1 py-4 bg-white/5 border border-white/10 text-white text-center font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all"
                           >
                             Dismiss
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

