# Operations & Conventions (SPEC-OPS)

## 1. Network Topology

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| **Frontend** | 3000 | HTTP | Next.js Server & UI. |
| **Backend** | 5000 | HTTP | Express API (Standardized). |
| **Torrent** | 8888 | HTTP | Local stream proxy (Main Process). |

## 2. CLI Scripts

- `npm run dev`: Full stack launch (Concurrently: Web + API + Electron).
- `npm run server`: Standalone Backend launch.
- `npm run build`: Production binary build using `electron-builder`.

## 3. Environment Flags

- `NODE_ENV`: `development` | `production`.
- `NEXT_PUBLIC_API_URL`: Points to `:5000` in dev, local relative in prod.
- `DEBUG_MODE`: If true, show `Logger` UI overlay and verbose IPC logs.

## 4. Security Baseline
- **CSRF**: Protected by same-origin policy within the Electron shell.
- **Data Protection**: All sensitive API keys handled in Backend `.env`.
