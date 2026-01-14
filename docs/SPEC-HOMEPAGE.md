# Homepage Mappings (SPEC-HOMEPAGE)

## 1. Rail to Filter Mappings

| UI Rail Name | Backend Query / Filter Logic | Persistence/Cache |
|--------------|------------------------------|-------------------|
| **Fresh Out The Oven** | `Content.find().sort({ createdAt: -1 }).limit(20)` | 1 Hour |
| **THE HYPE LIST** | `Content.find().sort({ trendingScore: -1 }).limit(10)` | 15 Mins |
| **A24 Vibes** | `Content.find({ genres: { $all: ["Drama", "Indie"] } }).limit(20)` | Static-ish |
| **Nightmare Fuel** | `Content.find({ genres: "Horror" }).limit(20)` | Static-ish |
| **Neon Nights** | `Content.find({ genres: "Sci-Fi" }).sort({ rating: -1 })` | Static-ish |

## 2. Aggregations (Pseudo-Mongo)

### Featured Hero Algorithm
1. Fetch top 5 `trendingScore`.
2. Ensure `backdropUrl` and `trailerUrl` both exist.
3. Seed random picker in `Hero.tsx` with this subset.

```javascript
db.contents.aggregate([
  { $match: { backdropUrl: { $ne: null }, trailerUrl: { $ne: null } } },
  { $sort: { trendingScore: -1 } },
  { $limit: 10 },
  { $sample: { size: 5 } }
])
```
