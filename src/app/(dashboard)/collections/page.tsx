"use client";

import { useState, useEffect } from "react";
import { useCollectionStore } from "@/lib/store/collectionStore";
import { ContentRail } from "@/components/content/ContentRail";
import { Trash2, Pin, PinOff, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CollectionsPage() {
    const { collections, deleteCollection, togglePin, createCollection } = useCollectionStore();
    const [mounted, setMounted] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            createCollection(newName.trim());
            setNewName("");
            setIsCreating(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background p-8 pb-20 pt-24 space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Collections</h1>
                    <p className="text-muted-foreground mt-1">Curate your own libraries and pin them to home.</p>
                </div>
                
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} />
                    New Collection
                </button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {isCreating && (
                    <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCreate}
                        className="bg-card border border-border rounded-xl p-6 flex gap-4 items-center max-w-2xl"
                    >
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Collection Name (e.g., 'To Watch with Dad')" 
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <button type="submit" className="text-primary font-bold hover:underline">Create</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground">Cancel</button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Collections List */}
            {collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <p className="text-lg">You haven't created any collections.</p>
                    <button onClick={() => setIsCreating(true)} className="text-primary mt-2 hover:underline">Create one now</button>
                </div>
            ) : (
                <div className="space-y-12">
                    {collections.map((col) => (
                        <motion.div 
                            key={col.id} 
                            layout 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold text-foreground">{col.name}</h2>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {col.items.length} Items
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => togglePin(col.id)}
                                        className={`p-2 rounded-full transition-colors ${col.pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                                        title={col.pinned ? "Unpin from Home" : "Pin to Home"}
                                    >
                                        {col.pinned ? <PinOff size={20} /> : <Pin size={20} />}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (confirm(`Delete '${col.name}'?`)) deleteCollection(col.id);
                                        }}
                                        className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete Collection"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {col.items.length > 0 ? (
                                <ContentRail title="" items={col.items} />
                            ) : (
                                <div className="h-32 flex items-center justify-center bg-card/50 rounded-xl text-muted-foreground text-sm">
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
