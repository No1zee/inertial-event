# Electron Security (SPEC-ELECTRON-SECURITY)

## 1. Shell Hardening

### `webPreferences` Baseline
```javascript
{
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false
}
```

### Window Control
- **Popups**: `setWindowOpenHandler` ALWAYS returns `{ action: 'deny' }` except for known OAuth flows.
- **Navigation**: `will-navigate` events are blocked unless matching `localhost:3000` or a specific whitelist.

## 2. Network Surfaces

### Allowed Outbound Hosts
- `api.vidlink.pro`
- `api.consumet.org`
- `api.tmdb.org`
- `api.ani-skip.com`
- Mirror domains (Dynamic, filtered via regex)

### Header Hardening
- **Vidlink/Mirrors**: The main process injects `Referer` and `Origin` headers to bypass basic hotlink protections.

## 3. Environment Deviations

| Feature | Development | Production |
|---------|-------------|------------|
| **DevTools** | Enabled | Disabled |
| **CSP** | Relaxed (Unsafe inline for dev) | Strict (Self + Whitelist) |
| **Remote Debug** | On | Off |
