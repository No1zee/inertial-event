'use client';

import { useState, useEffect } from 'react';
import { useCollections, useCollectionActions, useLibrary } from '@/lib/stores/localDataStore';
import type { Content } from '@/lib/types/content';
import { ContentRail } from '@/components/content/ContentRail';
import { Trash2, Pin, PinOff, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollectionsPage() {
  const collections = useCollections();
  const library = useLibrary();
  const { deleteCollection, togglePin, createCollection } = useCollectionActions();

  const [mounted, setMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      createCollection({
        name: newName.trim(),
        isDefault: false,
        isPublic: false,
        pinned: false,
      });
      setNewName('');
      setIsCreating(false);
    }
  };

  // Helper to resolve content items for a collection
  const getCollectionItems = (itemIds: string[]) => {
    return itemIds
      .map(id => {
        const libItem = library.find(li => li.contentId === id);
        if (!libItem) return null;
        return {
          id: libItem.contentId,
          type: libItem.type,
          title: libItem.title,
          poster_path: libItem.poster,
          backdrop_path: libItem.backdrop,
        };
      })
      .filter(Boolean) as unknown as Content[];
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-zinc-950 p-8 pb-20 pt-24 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Collections</h1>
          <p className="text-zinc-500 mt-1 font-medium">Curate your own libraries and pin them to home.</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          New Collection
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreate}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 flex gap-4 items-center max-w-2xl shadow-2xl"
          >
            <input
              type="text"
              autoFocus
              placeholder="Collection Name (e.g., 'Oscar Winners')"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              type="submit"
              className="text-white bg-zinc-800 px-6 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-500 hover:text-white transition-colors px-4 py-3 font-medium"
            >
              Cancel
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Collections List */}
      {collections.filter(c => !c.isDefault || c.items.length > 0).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-zinc-500 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-lg font-medium">You haven&#39;t created any collections.</p>
          <button onClick={() => setIsCreating(true)} className="text-red-500 mt-2 font-bold hover:underline">
            Create one now
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {collections
            .filter(c => !c.isDefault || c.items.length > 0)
            .map(col => (
              <motion.div key={col.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{col.name}</h2>
                    <span className="text-[10px] font-black text-zinc-500 bg-white/5 px-2.5 py-1 rounded-md uppercase tracking-widest">
                      {col.items.length} Items
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePin(col.id)}
                      className={`p-2.5 rounded-xl transition-all border ${col.pinned ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-zinc-500 hover:bg-white/5 border-white/5'}`}
                      title={col.pinned ? 'Unpin from Home' : 'Pin to Home'}
                    >
                      {col.pinned ? <PinOff size={20} /> : <Pin size={20} />}
                    </button>
                    {!col.isDefault && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete '${col.name}'?`)) deleteCollection(col.id);
                        }}
                        className="p-2.5 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all"
                        title="Delete Collection"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {col.items.length > 0 ? (
                  <ContentRail title="" items={getCollectionItems(col.items)} />
                ) : (
                  <div className="h-32 flex items-center justify-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl text-zinc-500 text-sm font-medium">
                    Empty collection. Add items from the browse page.
                  </div>
                )}
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
