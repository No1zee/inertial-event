import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChannelUIState {
    scrollPos: number;
    visibleCount: number;
}

interface UIStore {
    // Sidebar State
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;

    // Map channelId -> State
    channelStates: Record<string, ChannelUIState>;
    setChannelState: (channelId: string, state: Partial<ChannelUIState>) => void;
    getChannelState: (channelId: string) => ChannelUIState;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set, get) => ({
            // Sidebar Implementation
            sidebarOpen: false,
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

            channelStates: {},
            setChannelState: (channelId, newState) => set((state) => ({
                channelStates: {
                    ...state.channelStates,
                    [channelId]: {
                        ...(state.channelStates[channelId] || { scrollPos: 0, visibleCount: 2 }), // Default values
                        ...newState
                    }
                }
            })),
            getChannelState: (channelId) => {
                return get().channelStates[channelId] || { scrollPos: 0, visibleCount: 2 };
            }
        }),
        {
            name: 'ui-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ sidebarOpen: state.sidebarOpen, channelStates: state.channelStates }), // explicitly select what to persist
        }
    )
);
