/**
 * NovaStream State Management Architecture
 * 
 * This document outlines the refactored state management strategy for NovaStream,
 * providing clear separation of concerns and consistent patterns.
 * 
 * STATE MANAGEMENT LAYERS:
 * 
 * 1. Server State (React Query)
 *    - API calls, caching, background updates
 *    - Content data, sources, user data from server
 *    - Location: @/hooks/queries/
 * 
 * 2. Client State (Zustand)
 *    - UI state, preferences, ephemeral state
 *    - Player state, modals, theme, settings
 *    - Location: @/lib/stores/
 * 
 * STORE CLASSIFICATION:
 * 
 * ├── Server State (React Query)
 * │   ├── Content Queries - Movie/TV/Anime data
 * │   ├── Source Queries - Streaming sources
 * │   └── User Queries - Authentication, profiles
 * │
 * ├── Client State (Zustand)
 * │   ├── UI State - Modals, sidebar, layout
 * │   ├── Player State - Video player controls
 * │   ├── User Preferences - Settings, theme, language
 * │   ├── Session State - Temporary app state
 * │   └── Local Data - Watch history, library (persisted)
 * │
 * └── Persistence Strategy
 *     ├── localStorage - User preferences, settings
 *     ├── sessionStorage - Temporary player state
 *     ├── Memory - Ephemeral UI state
 *     └── Server - Watch history sync (future)
 */

// STATE USAGE PATTERNS:

/**
 * WHEN TO USE REACT QUERY:
 * 
 * ✅ Server data that comes from APIs
 * ✅ Data that should be cached and background refreshed
 * ✅ Data that can become stale
 * ✅ Pagination, infinite scrolling
 * ✅ Mutations that invalidate other queries
 * 
 * Examples:
 * - Content lists (trending, popular, etc.)
 * - Movie/TV show details
 * - Streaming sources
 * - User authentication status
 * - Search results
 */

/**
 * WHEN TO USE ZUSTAND:
 * 
 * ✅ UI state that doesn't come from server
 * ✅ User preferences and settings
 * ✅ Complex client-side state logic
 * ✅ State that needs to be shared across components
 * ✅ Player controls and state
 * ✅ Modal and sidebar state
 * 
 * Examples:
 * - Player volume, playback rate, current time
 * - Theme selection, language preferences
 * - Modal open/close states
 * - Sidebar collapsed/expanded
 * - Current playing item (client-side only)
 */

// STORE NAMING CONVENTIONS:

/**
 * React Query Hooks: use[Entity][Action]
 * - useTrending(), useContentDetails(), useSearch()
 * - useSources(), useUser(), useWatchHistory()
 * 
 * Zustand Stores: use[Domain]Store
 * - usePlayerStore, useUIStore, useThemeStore
 * - useSettingsStore, useAuthStore, useContentStore
 */

// PERSISTENCE STRATEGY:

/**
 * localStorage (Persistent):
 * - User settings and preferences
 * - Theme selection
 * - Authentication tokens
 * - Watch history
 * - Library collections
 * 
 * sessionStorage (Session-based):
 * - Current player position
 * - Temporary UI state
 * - Form inputs
 * 
 * Memory (Ephemeral):
 * - Modal states
 * - Hover states
 * - Temporary notifications
 * - Real-time player state
 */

// MIGRATION EXAMPLES:

/**
 * BEFORE: Mixed state management
 * ```tsx
 * // Old approach - state scattered across stores
 * const { library, addToLibrary } = useLibraryStore();
 * const { isModalOpen } = useLibraryStore(); // Wrong location
 * const { volume } = usePlayerStore();
 * ```
 * 
 * AFTER: Clear separation
 * ```tsx
 * // New approach - clear separation of concerns
 * const { data: content } = useContentDetails(id); // Server state
 * const { isPlaying, volume } = usePlayerStore(); // Player state
 * const { openModal } = useModalStore(); // UI state
 * const { addToLibrary } = useLocalDataStore(); // Local data
 * ```
 */

// PERFORMANCE OPTIMIZATIONS:

/**
 * 1. Selectors for specific state slices
 * 2. Shallow comparisons to prevent unnecessary re-renders
 * 3. Partialize persist middleware to reduce storage size
 * 4. Debounced updates for frequent state changes
 * 5. Lazy initialization for expensive computations
 */

export const STATE_MANAGEMENT_DOCS = {
  version: '1.0.0',
  lastUpdated: '2025-01-25',
  architecture: 'React Query + Zustand',
  patterns: {
    serverState: 'React Query',
    clientState: 'Zustand',
    persistence: 'localStorage + sessionStorage + memory'
  }
};