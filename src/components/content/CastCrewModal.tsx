'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Loader2, Calendar, MapPin } from 'lucide-react';
import { useUIStore } from '@/lib/stores/uiStore';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';
import { OptimizedImage } from '../ui/OptimizedImage';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { ContentCard } from './ContentCard';

export const CastCrewModal: React.FC = () => {
  const { castModal, closeCastModal, openContentModal } = useUIStore(state => ({
    castModal: state.castModal,
    closeCastModal: state.closeCastModal,
    openContentModal: state.openContentModal,
  }));

  const [details, setDetails] = useState<any>(null);
  const [credits, setCredits] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (castModal.isOpen && castModal.personId) {
      setIsLoading(true);
      Promise.all([contentApi.getPersonDetails(castModal.personId), contentApi.getPersonCredits(castModal.personId)]).then(
        ([detailsData, creditsData]) => {
          setDetails(detailsData);
          setCredits(creditsData);
          setIsLoading(false);
        }
      );
    }
  }, [castModal.isOpen, castModal.personId]);

  if (!castModal.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 sm:p-6 md:p-12 lg:p-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCastModal}
          className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="relative w-full max-w-7xl h-full sm:h-[85vh] bg-[#050505] border border-white/5 sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
        >
          <button
            title="Close"
            onClick={closeCastModal}
            className="absolute top-8 right-8 z-[1210] p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-white/70 hover:text-white transition-all ring-1 ring-white/10"
          >
            <X size={24} />
          </button>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <Loader2 className="animate-spin text-red-600" size={64} />
              <span className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em] animate-pulse">
                Scanning Archive...
              </span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="relative">
                {/* Profile Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 p-10 lg:p-20">
                  <div className="lg:col-span-3">
                    <div className="aspect-[2/3] relative rounded-[2rem] overflow-hidden ring-1 ring-white/10 shadow-2xl group">
                      <OptimizedImage
                        src={
                          details?.profile_path
                            ? getOptimizedImageUrl(details.profile_path, 'h632')
                            : '/images/cast_placeholder.jpg'
                        }
                        alt={details?.name || ''}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-9 flex flex-col justify-center space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-[1px] w-8 bg-red-600" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">
                          Cinematic Individual
                        </span>
                      </div>
                      <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase italic">
                        {details?.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-8 text-zinc-400">
                      {details?.birthday && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                            Date of Origin
                          </span>
                          <div className="flex items-center gap-2 text-zinc-300 font-bold">
                            <Calendar size={14} className="text-red-500/60" />
                            {new Date(details.birthday).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      )}
                      {details?.place_of_birth && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                            Location
                          </span>
                          <div className="flex items-center gap-2 text-zinc-300 font-bold">
                            <MapPin size={14} className="text-red-500/60" />
                            {details.place_of_birth}
                          </div>
                        </div>
                      )}
                      {details?.known_for_department && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                            Discipline
                          </span>
                          <div className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-tight">
                            <Film size={14} className="text-red-500/60" />
                            {details.known_for_department}
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xl text-zinc-400 leading-relaxed font-light line-clamp-4 lg:line-clamp-none">
                      {details?.biography || 'Personnel biography currently undergoing classified encryption.'}
                    </p>
                  </div>
                </div>

                {/* Work History Grid */}
                <div className="px-10 lg:px-20 pb-20 space-y-10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="flex items-center gap-4">
                      <Film size={24} className="text-red-600" />
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                        Cinematic <span className="text-red-600">Archive</span>
                      </h3>
                    </div>
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                      {credits.length} Contributions
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                    {credits.map((item, index) => (
                      <motion.div
                        key={`${item.id}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                      >
                        <div 
                          onClick={() => {
                            closeCastModal();
                            openContentModal(item);
                          }}
                          className="cursor-pointer"
                        >
                          <ContentCard
                            item={item}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
