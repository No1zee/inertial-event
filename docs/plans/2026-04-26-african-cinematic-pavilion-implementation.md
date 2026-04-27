# African Cinematic Pavilion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the African Cinematic Universe into a high-end, educational "work of art" portal within MaiWatch.

**Architecture:** We will implement a "Theme-Portal" approach. When the Pavilion is active, the app switches to a `heritage` theme. We will add new metadata fields to the `Content` model and create specific components (`HeritageCard`, `DirectorSidebar`) to handle the educational layer.

**Tech Stack:** Next.js (App Router), Tailwind CSS, Framer Motion, GSAP, Zustand.

---

### Task 1: Design Tokens & Theme Setup

**Files:**
- Modify: `c:/Projects/nova_v2/src/app/globals.css`
- Modify: `c:/Projects/nova_v2/src/store/themeStore.ts`

**Step 1: Add Heritage Tokens to globals.css**
```css
  .theme-heritage {
    --background: 25 20% 5%;       /* Deep Umber */
    --surface-deep: 25 20% 3%;
    --surface-elevated: 25 20% 10%;
    --brand-primary: 43 100% 50%;   /* Gold */
    --brand-accent: 25 75% 45%;    /* Ochre */
    --ring: var(--brand-primary);
    --foreground: 43 100% 98%;
  }
```

**Step 2: Update themeStore.ts**
- Add `'heritage'` to `Theme` type.
- Update `setTheme` to include `theme-heritage`.

**Step 3: Commit**
```bash
git add src/app/globals.css src/store/themeStore.ts
git commit -m "feat(acu): add heritage design tokens and theme support"
```

---

### Task 2: Content Schema Extension

**Files:**
- Modify: `c:/Projects/nova_v2/src/store/contentStore.ts`

**Step 1: Update Content Interface**
```typescript
    heritage?: {
        culturalContext?: string;
        regionalOrigins?: string[];
        accuracyVerified?: boolean;
        curatorNote?: string;
        didYouKnow?: string;
    }
```

**Step 2: Commit**
```bash
git add src/store/contentStore.ts
git commit -m "feat(acu): extend content schema for heritage metadata"
```

---

### Task 3: Heritage UI Components

**Files:**
- Create: `c:/Projects/nova_v2/src/components/content/HeritageCard.tsx`
- Create: `c:/Projects/nova_v2/src/components/content/DirectorSidebar.tsx`

**Step 1: Build HeritageCard.tsx**
- High-gloss texture (using CSS gradients/scrims).
- Gold foil typography.
- Flip animation for "Did You Know?" facts.

**Step 2: Build DirectorSidebar.tsx**
- Glassmorphic slide-in.
- Focus-triggered content.

**Step 3: Commit**
```bash
git add src/components/content/HeritageCard.tsx src/components/content/DirectorSidebar.tsx
git commit -m "feat(acu): implement HeritageCard and DirectorSidebar components"
```

---

### Task 4: The Pavilion Portal Entrance

**Files:**
- Create: `c:/Projects/nova_v2/src/components/content/PavilionEntrance.tsx`
- Modify: `c:/Projects/nova_v2/src/app/(dashboard)/browse/page.tsx` (or similar)

**Step 1: Build PavilionEntrance.tsx**
- Use GSAP for the shutter/dissolve transition.

**Step 2: Integrate into Browse flow**
- Add a "Portal" button that triggers the theme switch and transition.

**Step 3: Commit**
```bash
git add src/components/content/PavilionEntrance.tsx src/app/(dashboard)/browse/page.tsx
git commit -m "feat(acu): add PavilionEntrance transition and portal logic"
```

---

### Task 5: Content Modal & Documentation Tab

**Files:**
- Modify: `c:/Projects/nova_v2/src/components/content/ContentModal.tsx`

**Step 1: Add "Documentation" tab**
- Render `heritage.culturalContext` and `regionalOrigins`.
- Display "Accuracy Verified" badge.

**Step 2: Commit**
```bash
git add src/components/content/ContentModal.tsx
git commit -m "feat(acu): add Documentation tab to ContentModal"
```
