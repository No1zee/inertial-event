# Torrent & IPC Specification (SPEC-TORRENT-IPC)

## 1. IPC Channels

### `torrent:start-stream`
- **Direction**: Renderer -> Main
- **Payload**: `{ magnetUri: string, title?: string }`
- **Response**: `{ success: boolean, streamUrl?: string, error?: string }`

### `torrent:status` (Event)
- **Direction**: Main -> Renderer
- **Payload**: `{ progress: number, downloadSpeed: number, peers: number, status: 'downloading' | 'seeding' | 'stalled' }`

### `torrent:stop-stream`
- **Direction**: Renderer -> Main
- **Payload**: `void`
- **Response**: `{ success: boolean }`

## 2. Retry Policy
1. **Initial Connect**: 10s timeout for first piece (Metadata).
2. **Fallback**: If peers == 0 for 15s, emit `TORRENT_STALLED` to Page.
3. **Escalation**: Page attempts next provider in `fallbackService`.

## 3. Hook Logic (Pseudocode)

```typescript
function useTorrentEngine() {
  const start = async (uri) => {
    const res = await ipcRenderer.invoke('torrent:start-stream', { uri });
    if (!res.success) throw new Error(res.error);
    
    // Listen for progress
    ipcRenderer.on('torrent:status', (e, status) => {
      setInternalStatus(status);
    });
    
    return res.streamUrl; // Local HTTP server URL
  };

  const stop = () => ipcRenderer.invoke('torrent:stop-stream');

  return { start, stop, status };
}
```
