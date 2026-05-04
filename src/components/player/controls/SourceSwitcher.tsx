'use client';

import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Layers, Check, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useUserPreferencesStore } from '@/lib/stores/preferencesStore';
import { SOURCES } from '@/lib/config/sources';
import { cn } from '@/lib/utils';

export function SourceSwitcher() {
  const activeSourceId = useUserPreferencesStore(state => state.activeSourceId);
  const setActiveSourceId = useUserPreferencesStore(state => state.setActiveSourceId);
  const activeSource = SOURCES.find(s => s.id === activeSourceId) || SOURCES[0];

  return (
    <div className="relative">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="group p-3 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 pr-5 shadow-2xl">
            <Layers
              size={20}
              className={cn(
                'transition-colors',
                activeSource.stability === 'stable' ? 'text-primary' : 'text-amber-500'
              )}
            />
            <div className="flex flex-col items-start leading-none gap-0.5">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Source</span>
              <span className="text-sm font-black uppercase tracking-wider">{activeSource.codename}</span>
            </div>
          </Menu.Button>
        </div>

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-300"
          enterFrom="transform opacity-0 scale-95 translate-y-2"
          enterTo="transform opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100 translate-y-0"
          leaveTo="transform opacity-0 scale-95 translate-y-2"
        >
          <Menu.Items className="absolute right-0 mt-4 w-72 origin-top-right rounded-3xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus:outline-none p-2 z-[300]">
            <div className="px-3 py-3 border-b border-white/5 mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Broadcasting Nodes</h3>
            </div>

            <div className="space-y-1">
              {SOURCES.map(source => (
                <Menu.Item key={source.id}>
                  {({ active }) => (
                    <button
                      onClick={() => setActiveSourceId(source.id)}
                      className={cn(
                        'w-full rounded-2xl p-3 flex items-start gap-4 transition-all text-left group/item',
                        active ? 'bg-white/5' : 'transparent',
                        activeSourceId === source.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'border border-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-1 p-2 rounded-xl transition-colors',
                          activeSourceId === source.id
                            ? 'bg-primary text-black'
                            : 'bg-zinc-800 text-zinc-400 group-hover/item:bg-zinc-700'
                        )}
                      >
                        {source.stability === 'stable' ? (
                          <Shield size={14} />
                        ) : source.stability === 'experimental' ? (
                          <Zap size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-sm font-bold uppercase tracking-tight',
                              activeSourceId === source.id ? 'text-primary' : 'text-zinc-300'
                            )}
                          >
                            {source.codename}
                          </span>
                          {activeSourceId === source.id && (
                            <motion.div layoutId="active-check">
                              <Check size={14} className="text-primary" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-0.5 line-clamp-1">
                          {source.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-500 font-mono">
                            {source.technicalName}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] uppercase tracking-widest font-black',
                              source.stability === 'stable' ? 'text-emerald-500/60' : 'text-amber-500/60'
                            )}
                          >
                            {source.stability}
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
