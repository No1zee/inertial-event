import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Content } from '@/lib/types/content';
import { v4 as uuidv4 } from 'uuid';

export interface Collection {
    id: string;
    name: string;
    description?: string;
    items: Content[];
    pinned: boolean;
    createdAt: number;
}

interface CollectionState {
    collections: Collection[];
    createCollection: (name: string, description?: string) => void;
    deleteCollection: (id: string) => void;
    togglePin: (id: string) => void;
    
    addItemToCollection: (collectionId: string, item: Content) => void;
    removeItemFromCollection: (collectionId: string, itemId: number | string) => void;
    
    // Checkers
    isInCollection: (collectionId: string, itemId: number | string) => boolean;
}

export const useCollectionStore = create<CollectionState>()(
    persist(
        (set, get) => ({
            collections: [],
            
            createCollection: (name, description) => {
                const newCollection: Collection = {
                    id: uuidv4(),
                    name,
                    description,
                    items: [],
                    pinned: false,
                    createdAt: Date.now(),
                };
                set((state) => ({ collections: [...state.collections, newCollection] }));
            },

            deleteCollection: (id) => {
                set((state) => ({ collections: state.collections.filter(c => c.id !== id) }));
            },

            togglePin: (id) => {
                set((state) => ({
                    collections: state.collections.map(c => 
                        c.id === id ? { ...c, pinned: !c.pinned } : c
                    )
                }));
            },

            addItemToCollection: (collectionId, item) => {
                set((state) => ({
                    collections: state.collections.map(c => {
                        if (c.id !== collectionId) return c;
                        // Avoid duplicates
                        if (c.items.some(i => String(i.id) === String(item.id))) return c;
                        return { ...c, items: [item, ...c.items] };
                    })
                }));
            },

            removeItemFromCollection: (collectionId, itemId) => {
                set((state) => ({
                    collections: state.collections.map(c => {
                        if (c.id !== collectionId) return c;
                        return { ...c, items: c.items.filter(i => String(i.id) !== String(itemId)) };
                    })
                }));
            },

            isInCollection: (collectionId, itemId) => {
                const col = get().collections.find(c => c.id === collectionId);
                if (!col) return false;
                return col.items.some(i => String(i.id) === String(itemId));
            }
        }),
        {
            name: 'novastream-collections',
        }
    )
);
