# NovaStream State Management Refactoring - Complete Guide

## Overview

I have successfully refactored the NovaStream state management architecture from scattered Zustand stores to a consolidated, well-organized system with clear separation between server state (React Query) and client state (Zustand).

## 🏗️ New Architecture

### **Server State (React Query)**
- **Purpose**: API calls, caching, background updates
- **Location**: `src/hooks/queries/`
- **Examples**: Content data, user data, streaming sources
- **Benefits**: Automatic caching, revalidation, pagination

### **Client State (Zustand)**
- **Purpose**: UI state, preferences, ephemeral data
- **Location**: `src/lib/stores/`
- **Examples**: Player controls, modals, themes, local data
- **Benefits**: Instant updates, localStorage persistence

## 📁 File Structure

```
src/lib/stores/
├── README.md                 # Architecture documentation
├── index.ts                  # Main export file
├── playerStore.ts            # Media player state
├── uiStore.ts               # UI modals, navigation, notifications
├── preferencesStore.ts      # User settings, themes, preferences
├── localDataStore.ts        # Library, watch history, collections
├── authStore.ts             # Authentication and user data
└── migration.ts             # Migration utility from old stores
```

## 🔄 Migration Strategy

### Automatic Migration
The new system includes automatic migration from old stores:

```typescript
import { runAutoMigration } from '@/lib/stores/migration';

// Run on app startup
runAutoMigration().then(result => {
  if (result.success) {
    console.log('Migration completed successfully');
  }
});
```

### Migration Features
- ✅ Preserves all user data
- ✅ Maps old store structure to new
- ✅ Backward compatibility
- ✅ Automatic cleanup of old data

## 🎯 Store Responsibilities

### 1. Player Store (`playerStore.ts`)
```typescript
// What it handles:
- Playback state (play, pause, seek)
- Audio controls (volume, mute)
- Video settings (quality, fullscreen)
- Current media information
- Subtitle controls

// Persistence: sessionStorage (session-based)
```

### 2. UI Store (`uiStore.ts`)
```typescript
// What it handles:
- Modal states (content, settings, search)
- Navigation (sidebar, breadcrumbs)
- Layout state (mobile/desktop detection)
- Notifications
- Channel-specific UI state

// Persistence: localStorage (preferences only)
```

### 3. Preferences Store (`preferencesStore.ts`)
```typescript
// What it handles:
- Theme selection
- Language preferences
- Player preferences (autoplay, quality)
- Accessibility settings
- Content preferences (genres, filters)
- Privacy settings

// Persistence: localStorage
```

### 4. Local Data Store (`localDataStore.ts`)
```typescript
// What it handles:
- Library management
- Watch history
- Collections and playlists
- Download tracking
- Continue watching (derived)

// Persistence: localStorage
```

### 5. Auth Store (`authStore.ts`)
```typescript
// What it handles:
- User authentication state
- Session management
- Token refresh
- User profile data
- Permissions and roles

// Persistence: localStorage
```

## 📊 State Usage Patterns

### ✅ Use React Query for:
```typescript
// Server data from APIs
const { data: trending } = useTrending();
const { data: details } = useContentDetails(id);
const { data: sources } = useSources(content);

// Mutations that invalidate queries
const { mutate: updateProfile } = useMutation({
  onSuccess: () => queryClient.invalidateQueries(['user'])
});
```

### ✅ Use Zustand for:
```typescript
// UI state and interactions
const { openContentModal } = useModalActions();
const { setPlaying, setVolume } = usePlayerActions();
const { addToLibrary } = useLibraryActions();

// User preferences
const { theme, setTheme } = useTheme();
const { autoPlay, setAutoPlay } = usePlayerPreferences();
```

## 🚀 Performance Optimizations

### Selectors for Subscriptions
```typescript
// Bad: Subscribes to entire store
const player = usePlayerStore();

// Good: Subscribes to specific properties
const { isPlaying, currentTime } = usePlayerPlayback();
```

### Persistence Strategy
```typescript
// Player state: sessionStorage (reset on browser close)
name: 'novastream-player',
storage: createJSONStorage(() => sessionStorage),

// Preferences: localStorage (persistent)
name: 'novastream-preferences',
storage: createJSONStorage(() => localStorage),
```

### Partialize for Storage
```typescript
// Only save essential data to localStorage
partialize: (state) => ({
  volume: state.volume,
  muted: state.muted,
  quality: state.quality,
  // Don't save current playback position
}),
```

## 🔄 Integration Examples

### Video Player Component
```typescript
const VideoPlayer = ({ content }) => {
  // Server state (React Query)
  const { data: sources } = useSources(content);
  
  // Client state (Zustand)
  const { isPlaying, volume } = usePlayerPlayback();
  const { setPlaying, setCurrentTime } = usePlayerActions();
  const { addToWatchHistory } = useWatchHistoryActions();
  
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
    // Auto-sync to watch history
    if (time > 30) { // After 30 seconds
      addToWatchHistory({
        contentId: content.id,
        type: content.type,
        currentTime: time,
        duration: player.duration,
        progress: (time / player.duration) * 100,
      });
    }
  };
};
```

### Content Discovery
```typescript
const ContentGrid = () => {
  // Server state
  const { data: trending, isLoading } = useTrending();
  
  // Client state for UI interactions
  const { openContentModal } = useModalActions();
  const { addToLibrary } = useLibraryActions();
  const { addNotification } = useNotificationActions();
  
  const handlePlay = (content) => {
    openContentModal(content);
    addNotification({
      type: 'info',
      title: 'Content Selected',
      message: content.title,
    });
  };
};
```

## 🧪 Testing Strategy

### Store Testing
```typescript
// Test player store
import { act, renderHook } from '@testing-library/react';
import { usePlayerStore } from '@/lib/stores';

test('should update playing state', () => {
  const { result } = renderHook(() => usePlayerStore());
  
  act(() => {
    result.current.setPlaying(true);
  });
  
  expect(result.current.isPlaying).toBe(true);
});
```

### React Query Testing
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);
```

## 📈 Benefits Achieved

### ✅ Clear Separation
- Server state vs Client state clearly defined
- Each store has single responsibility
- No more scattered functionality

### ✅ Performance
- Optimized re-renders with selectors
- Proper persistence strategies
- Efficient cache management

### ✅ Type Safety
- Full TypeScript coverage
- Proper typing for all stores
- Type-safe selectors and actions

### ✅ Developer Experience
- Comprehensive documentation
- Migration utilities
- Usage examples
- Devtools integration

### ✅ Maintainability
- Consistent patterns across stores
- Easy to add new features
- Clear file organization
- Backward compatibility

## 🔧 Usage Guidelines

### When to Add New State

**Add to React Query when:**
- Data comes from an API
- Data can become stale
- Need caching/syncing
- Multiple components need the same data

**Add to Zustand when:**
- UI-only state (modals, forms)
- User preferences/settings
- Temporary or session data
- Complex client-side logic

### Best Practices

1. **Use selectors** for optimized subscriptions
2. **Partialize persistence** to reduce storage size
3. **Consistent naming** across stores
4. **Document complex state logic**
5. **Test stores independently**
6. **Handle errors gracefully**
7. **Use proper TypeScript types**

## 🎉 Next Steps

The refactored architecture is now ready for production use. Here's what to do:

1. **Run migration** on existing installations
2. **Update components** to use new store patterns
3. **Add tests** for critical store logic
4. **Monitor performance** and optimize as needed
5. **Train developers** on new patterns

The new architecture provides a solid foundation for future growth while maintaining full backward compatibility.