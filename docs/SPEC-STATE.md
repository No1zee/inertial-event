# State Management (SPEC-STATE)

## 1. Store Layout

### `contentStore`
- **Focus**: Global content feeds, editorial rails, and individual item caching.
- **Shape**: `{ trending: [], recent: [], featured: [], library: [], loading: boolean }`
- **Persistence**: `library` IDs persisted to Backend User model.

### `playerStore`
- **Focus**: Active playback session state.
- **Shape**: `{ currentContentId: string, currentTime: number, isBuffering: boolean, volume: number }`
- **Persistence**: **NONE**. Volatile memory only.

### `preferencesStore`
- **Focus**: User settings and UI behavior.
- **Shape**: `{ autoSkip: boolean, preferredQuality: string, subtitleScale: number, theme: 'dark' }`
- **Persistence**: **LocalStorage** (`ns-prefs`).

## 2. Persistence Rules

| Key | Layer | Fields |
|-----|-------|--------|
| `ns-library` | Backend | `[contentId]` |
| `ns-history` | Backend/LocalStorage | `{ contentId, position, date }` |
| `ns-prefs` | LocalStorage | JSON blob of user preferences. |

> [!CAUTION]
> **ACCESS TOKENS**: Never persist JWTs in Zustand state that gets serialized to localStorage. Use `HttpOnly` cookies for token storage where possible, or a dedicated volatile `authStore`.
