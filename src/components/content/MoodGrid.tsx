'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Moon, Heart, Smile, Wind } from 'lucide-react';
import Link from 'next/link';

const MOODS = [
  { name: 'Adrenaline', icon: Zap, color: '#ff4b2b', genres: [28, 12], description: 'High-octane missions' },
  { name: 'Transcendence', icon: Sparkles, color: '#a18cd1', genres: [878, 14], description: 'Beyond reality' },
  { name: 'Deep Shadows', icon: Moon, color: '#2f3542', genres: [9648, 53], description: 'Unsolved enigmas' },
  { name: 'Heartbeat', icon: Heart, color: '#ff6b6b', genres: [18, 10749], description: 'Emotional journeys' },
  { name: 'Laughter', icon: Smile, color: '#feca57', genres: [35], description: 'Pure dopamine' },
  { name: 'Ethereal', icon: Wind, color: '#48dbfb', genres: [16], description: 'Fluid animation' },
];

export const MoodGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full">
      {MOODS.map((mood, i) => (
        <motion.div
          key={mood.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <Link 
            href={`/browse?mood=${mood.name.toLowerCase()}&genres=${mood.genres.join(',')}`}
            className="group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all overflow-hidden h-full"
          >
             {/* Dynamic Glow */}
             <motion.div 
               className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-[50px]"
               initial={false}
               animate={{ backgroundColor: mood.color }}
             />
             
             <motion.div 
               className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6"
               initial={false}
               animate={{ 
                 backgroundColor: `${mood.color}15`, 
                 color: mood.color, 
                 border: `1px solid ${mood.color}30` 
               }}
             >
                <mood.icon size={32} />
             </motion.div>

             <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-black text-white uppercase tracking-tighter italic">{mood.name}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{mood.description}</span>
             </div>

             {/* Hover Detail */}
             <motion.div 
               className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
               initial={false}
             >
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
             </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
