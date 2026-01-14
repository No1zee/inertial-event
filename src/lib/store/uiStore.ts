import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    sidebarOpen: boolean;
    theme: 'dark' | 'light' | 'system';
    searchQuery: string;
    isSearchOpen: boolean;

    // Modal State
    modalContent: any | null; // using any temporarily to avoid circular deps, ideal is Content
    isModalOpen: boolean;

    // Actions
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setTheme: (theme: 'dark' | 'light' | 'system') => void;
    setSearchQuery: (query: string) => void;
    setSearchOpen: (open: boolean) => void;
    openModal: (content: any) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            theme: 'dark', // Default to dark for premium feel
            searchQuery: '',
            isSearchOpen: false,

            // Modal State
            modalContent: null,
            isModalOpen: false,

            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setTheme: (theme) => set({ theme }),
            setSearchQuery: (searchQuery) => set({ searchQuery }),
            setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),

            // Modal Actions
            openModal: (content) => set({ isModalOpen: true, modalContent: content }),
            closeModal: () => set({ isModalOpen: false, modalContent: null }),
        }),
        {
            name: 'novastream-ui-storage',
            partialize: (state) => ({
                sidebarOpen: state.sidebarOpen,
                theme: state.theme
            }),
        }
    )
);
