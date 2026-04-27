# Design: African Cinematic Pavilion

**Date:** 2026-04-26
**Status:** Approved
**Topic:** Immersive, educational, and celebratory dedicated area for African media within MaiWatch.

## 1. Vision & Architecture

The African Cinematic Pavilion is a "Portal" experience within MaiWatch. It aims to elevate African cinema (movies, documentaries, series) to an institutional-grade "S-Tier" showcase.

### 1.1 The Portal Entrance
- **Directorially-driven transition:** GSAP-powered "shutter" or "dissolve" transition when entering the section.
- **Theme Shift:** Dynamic CSS variable swap to the **Heritage Palette** (Deep Umbers, Gold accents, Ochre, and Slate).

### 1.2 Layout Strategy
- **Curated Collections:** Content is grouped into narrative-driven buckets:
    - *The Pioneers* (Early Cinema)
    - *The Modern Renaissance* (High-budget modern)
    - *Earth's Pulse* (Documentaries)
    - *The Short-Form Gallery* (Indies/Shorts)

## 2. Visual Language & Components

### 2.1 Heritage Cards (Interactive "Did You Know?")
- **Tactile Maximalism:** Cards with high-gloss textures and 3D depth.
- **Educational Flip:** On hover, cards flip or expand to reveal cultural facts or historical context.
- **Micro-animations:** Subtle "breathing" or "shimmer" effects on gold-foil elements.

### 2.2 The Director's Sidebar
- **Contextual Overlay:** Glassmorphic sidebar triggered by focus/long-hover.
- **Curator's Note:** Provides professional insight into why the content is significant.

### 2.3 Dynamic Backgrounds
- **SVG Mask Patterns:** Subtle moving patterns inspired by traditional African textiles (Kente, Mudcloth).
- **Responsive Scroll:** Patterns move slightly on scroll to create depth (parallax).

## 3. Data & Accuracy

### 3.1 Extended Metadata Schema
- `cultural_context`: Rich documentation of cultural nuances.
- `regional_origins`: Mapping to specific tribes/cities.
- `accuracy_verified`: Boolean badge for high-fidelity documentaries.

### 3.2 The Documentation Tab
- Dedicated section in movie details for external archives, location maps, and historical references.

## 4. Implementation Plan (High Level)

1. **Tokens:** Define `heritage` design tokens (colors, spacing, typography).
2. **Components:** Build `HeritageCard`, `DirectorSidebar`, and `PatternBackground`.
3. **Store/State:** Add `isPavilionActive` state to manage theme transitions.
4. **Data:** Enrich sample African content with the new schema.
