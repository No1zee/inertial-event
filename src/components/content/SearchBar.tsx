'use client';

import React, { useState, useRef } from 'react';
import { Search, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string, aiMode?: boolean) => void;
  placeholder?: string;
  initialQuery?: string;
  initialAi?: boolean;
  loading?: boolean;
  variant?: 'default' | 'compact';
  onChange?: (query: string) => void;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search the archives...',
  initialQuery = '',
  initialAi = false,
  loading = false,
  variant = 'default',
  onChange,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isAi] = useState(initialAi);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), isAi);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative rounded-[2rem] border transition-all duration-700 flex items-center px-8 gap-6 shadow-2xl',
          variant === 'compact' ? 'h-16' : 'h-20',
          isAi
            ? 'bg-purple-500/[0.03] border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]'
            : 'bg-white/[0.03] border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]',
          'backdrop-blur-3xl group/bar focus-within:border-primary/40 focus-within:bg-white/[0.05]'
        )}
      >
        {/* Visual Indicator */}
        <div className="flex items-center gap-4 shrink-0">
          <AnimatePresence mode="wait">
            {isAi ? (
              <motion.div
                key="ai"
                initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 45, opacity: 0 }}
                className="text-purple-400"
              >
                <Sparkles size={24} className="stroke-[2px]" />
              </motion.div>
            ) : (
              <motion.div
                key="std"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-zinc-500 group-focus-within/bar:text-primary transition-colors"
              >
                <Search size={24} className="stroke-[2px]" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-[1px] h-6 bg-white/10" />
        </div>

        {/* Main Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange?.(e.target.value);
          }}
          placeholder={isAi ? 'Describe a vibe, mood, or complex concept...' : placeholder}
          data-testid="search-input"
          className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-white placeholder:text-zinc-600 placeholder:font-medium tracking-tight h-full"
        />

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Processing</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        )}

        {/* Execute Button */}
        <button
          type="submit"
          className="h-12 px-6 rounded-2xl bg-white text-black font-bold text-sm tracking-tight hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0 shadow-lg"
        >
          Request
          <ChevronRight size={16} />
        </button>
      </motion.form>

      {/* Oracle Discovery Suggestions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3 pt-6"
      >
        {[
          { label: 'High-Octane', vibe: 'high-octane' },
          { label: 'Cinematic Poetry', vibe: 'cinematic poetry' },
          { label: 'Cerebral Thriller', vibe: 'cerebral thriller' },
          { label: 'Aurelian Classic', vibe: 'aurelian classic' },
          { label: 'Cyberpunk Decay', vibe: 'cyberpunk decay' }
        ].map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => {
              setQuery(suggestion.vibe);
              onSearch(suggestion.vibe, true);
            }}
            className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 text-[10px] font-black text-zinc-500 hover:text-amber-500 uppercase tracking-widest transition-all duration-300"
          >
            {suggestion.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
