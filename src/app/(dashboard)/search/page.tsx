'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { contentApi } from '@/lib/api/content';
import { Content } from '@/lib/types/content';
import { ContentCard } from '@/components/content/ContentCard';
import { SearchBar } from '@/components/content/SearchBar';
import { SearchX, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PretextHeadline } from '@/components/Common/PretextHeadline';
import { Button } from '@/components/ui/button';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const aiModeParam = searchParams.get('ai') === 'true';

  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (q: string, _aiMode: boolean) => {
    if (!q) return;
    setLoading(true);
    try {
      const data = await contentApi.searchContent(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      fetchResults(query, aiModeParam);
    }
  }, [query, aiModeParam, fetchResults]);

  const handleSearch = (newQuery: string, aiMode?: boolean) => {
    const params = new URLSearchParams();
    params.set('q', newQuery);
    if (aiMode) params.set('ai', 'true');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="p-12 md:p-20 pt-32 min-h-screen max-w-[1920px] mx-auto flex flex-col">
      {/* Search Hub Header */}
      <div className="flex flex-col items-center mb-24 space-y-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <PretextHeadline 
            text="Search Sanctuary" 
            fontSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 48 : 80}
            fontWeight={900}
            letterSpacing="-0.05em"
            className="text-white" 
          />
          <PretextHeadline 
            text="The Discovery Engine" 
            fontSize={10}
            fontWeight={700}
            letterSpacing="0.5em"
            className="text-zinc-500 uppercase" 
          />
        </motion.div>

        <SearchBar onSearch={handleSearch} initialQuery={query} initialAi={aiModeParam} loading={loading} />
      </div>

      {/* Atmospheric Backdrop (Dynamic) */}
      <AnimatePresence>
        {results[0] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0"
          >
            <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black" />
            <Image 
              src={`https://image.tmdb.org/t/p/original${results[0].backdrop || results[0].backdrop_path}`}
              className="w-full h-full object-cover blur-[100px] scale-110"
              alt=""
              fill
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Canvas */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40 gap-8"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-2 border-primary/10 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-t-2 border-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-primary animate-pulse w-8 h-8" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-white font-bold tracking-[0.4em] text-[10px] uppercase">Sanctuary Scanning</span>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                  Synchronizing Broadcast Streams
                </p>
              </div>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-12"
            >
              <div className="flex items-end justify-between border-b border-white/[0.03] pb-10">
                <div className="space-y-2">
                  <PretextHeadline
                    text="Query Response"
                    fontSize={10}
                    fontWeight={700}
                    letterSpacing="0.3em"
                    className="text-zinc-600 uppercase"
                  />
                  <div className="flex items-baseline gap-3">
                    <span className="text-zinc-500 font-medium italic">Record found for</span>
                    <PretextHeadline
                      text={`"${query}"`}
                      fontSize={32}
                      fontWeight={900}
                      letterSpacing="-0.02em"
                      className="text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-5 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {results.length} Nodes Found
                  </div>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-white"
                  >
                    <Filter size={18} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-8 gap-y-12 pb-32">
                {results.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <ContentCard item={item} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : query ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-40 text-zinc-500 gap-10"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative p-12 rounded-full bg-zinc-900/50 border border-white/5 shadow-2xl backdrop-blur-3xl">
                  <SearchX size={80} className="text-zinc-800 stroke-[1.5px]" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white tracking-tighter">Transmission Lost</h2>
                <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest max-w-sm leading-relaxed">
                  Could not locate nodes matching your request in the central archives.
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => handleSearch(query, true)}
                    className="h-12 px-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all"
                  >
                    <Sparkles size={16} className="mr-3" />
                    Try AI Intelligence Augmentation
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-40 gap-10"
            >
              <div className="text-center space-y-4">
                <div className="h-1 w-12 bg-primary/30 mx-auto rounded-full" />
                <h2 className="text-xl font-bold text-zinc-400 tracking-tighter uppercase">
                  Directorial Feed Awaiting Command
                </h2>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed opacity-60">
                  Initialize the console to extract media nodes from across the global network.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-black">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

