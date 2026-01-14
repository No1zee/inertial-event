# Error Taxonomy & Logging (SPEC-ERRORS-LOGGING)

## 1. Error Categories

| Code | Type | UX Feedback | Recovery Action |
|------|------|-------------|-----------------|
| `SOURCE_ERROR` | Provider | "Mirrors are down." | Switch to next source in priority. |
| `NETWORK_ERROR`| Client | "No internet connection." | Show offline UI / Retry button. |
| `SUBTITLE_ERROR`| Metadata | "Failed to load subtitles." | Continue without subs / Try external. |
| `TORRENT_ERROR` | IPC | "Torrent engine stalled." | Fallback to HLS mirrors. |
| `GEO_BLOCKED` | Provider | "Stream not available in your region." | Notify user / Suggest VPN (Mirror fallback). |

## 2. Telemetry Schema

Every log entry recorded by the global `Logger` includes:
- `timestamp`: ISO String.
- `contentId`: For playback related errors.
- `provider`: (Vidlink/Nyaa/etc).
- `trace`: Stack trace or IPC message ID.
- `userId`: (Hashed for privacy).

## 3. Global Error Handling
- **React Boundary**: Catches render errors and shows the "NovaStream Crash" screen with a "Reload App" button.
- **Electron Uncaught**: Main process logs uncaught exceptions to a local `app.log` and restarts the window if critical.
