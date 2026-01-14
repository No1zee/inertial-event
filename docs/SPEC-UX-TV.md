# TV & UX Ergonomics (SPEC-UX-TV)

## 1. Interaction Rules

### Remote Control Mapping
- **Arrow Keys**: Navigate focus between rail items and sidebar.
- **Enter/OK**: Select item (Open Modal or Start Watch).
- **Back/Escape**: Close modal -> Return to previous focus.
- **Play/Pause**: Toggle playback (Watch Page only).

### Focus Management
- **Initial Focus**: The first item in the "Trending Now" rail (below the Hero) gets focus on mount.
- **Boundary Behavior**: If at the end of a rail, Right Arrow does nothing (no wrap-around). Down Arrow moves to the next rail.

## 2. Animation Guidelines

| Element | Duration | Easing | Intent |
|---------|----------|--------|--------|
| **Hero Change** | 1000ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Cinematic cinematic transition. |
| **Card Hover** | 250ms | `ease-out` | Immediate user feedback. |
| **Modal Entry** | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Premium "Slide Up" effect. |

## 3. "Total Failure" Graceful Degradation
If no sources are found:
1. Hide the video player immediately.
2. Show a "Fallback Slate" consisting of the content backdrop (blurred 20px).
3. Overlay text: "Transmission Interrupted: No healthy sources found."
4. Provide a "Try Mirror" button that force-triggers a refresh of `fallbackService`.
