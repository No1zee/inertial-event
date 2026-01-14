# Skip Rules & Heuristics (SPEC-SKIP-RULES)

## 1. AniSkip Integration

**Provider**: [AniSkip](https://github.com/skiptimes/ani-skip)
**Parameters**:
- `malId`: MyAnimeList ID (derived from TMDB/AL mapping).
- `episodeNumber`: Current episode.
- `types`: `["op", "ed"]`.

### Response Processing
- Use `interval.start` and `interval.end` from response.
- If response is 404/Null -> Fallback to Heuristics.

## 2. Fallback Heuristics

If no external data exists, apply "NovaStream Special" logic:

| Rule Type | Time Range | UX Action |
|-----------|------------|-----------|
| **Standard Intro** | 10s -> 40s | Show "Skip Intro" button. |
| **Credits/Outro** | >98% duration | Auto-advance to next episode / Show "Next Episode" card. |
| **Anime OP** | 80s -> 170s | Heuristic for 1:30 op length (standard). |

## 3. UI Implementation
- **Visibility**: Button appears in bottom-left above progress bar.
- **Duration**: Button remains for 5s or until range ends.
- **Auto-Skip**: Toggle in `preferencesStore`. If enabled, skip happens immediately upon entering range.
