# Homepage Architecture (SPEC-HOMEPAGE)

This document outlines the "Rich & Adaptive" homepage strategy for NovaStream, establishing the logic for the platform's core discovery engine.

## 1. The Component Stack

The homepage is composed of a layered architecture designed for cinematic depth and high-fidelity discovery.

| Component | Responsibility | Data Source |
|-----------|----------------|-------------|
| `CinemaMarquee` | High-impact full-screen hero | Personalized Trending (RQ) |
| `HomeDashboard` | Command Panel (Greeting, Pipeline, Pulse) | User Store + Trending (RQ) |
| `EditorialSpotlight`| "Masterpiece of the Week" (Premium Curation) | Hand-picked / High-Rating |
| `CriticsChoice` | Serendipity rail with high-fidelity visuals | Premium Metadata Filter |
| `SmartCollections` | "The Archives" (Editorial Clusters) | Smart Recommendation API |
| `StudioRail` | Brand-specific shortcuts | Constant / Providers |
| `AtmosphericRail` | Standardized content rows | Dynamic Discovery (RQ) |

## 2. Adaptive Logic & Personalization

The homepage uses a weighted sorting algorithm to prioritize content based on the active profile's "Vault" state.

### Rail Sorting Algorithm
1. **Genre Weights**: Onboarding genres receive a **10x boost**.
2. **Vibe Boosts**: Active vibes (e.g., "High-Energy", "Dark-Gritty") provide a **5x boost** to specific rail categories.
3. **Infinite Loading**: Rails are loaded in chunks of 2 to maintain performance and reduce DOM pressure.

### State Synchronization
- **Server State**: Managed via React Query (`queryKey: ['trending', activeProfile.preferences]`).
- **Client State**: UI preferences and profile weights managed via `useActiveProfile` (Zustand).

## 3. High-Fidelity Components

### Editorial Spotlight (Masterpiece)
Selected based on high rating (>8.0) and "Masterpiece" metadata tag. Designed to break the standard grid layout with a full-width immersive banner.

### The Pipeline (Continue Watching)
Dynamic progress tracking with visual indicators. Filtered to show the most recent 5 items across all devices.

## 4. Performance & UX
- **Shimmer Skeletons**: Applied to all rails during async hydration.
- **Directorial Motion**: Framer Motion entry animations for all major modules (`y: 20, opacity: 0` -> `y: 0, opacity: 1`).
- **Sentinel Loading**: `useInView` hook used for progressive disclosure of content rails.
