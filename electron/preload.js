const { contextBridge, ipcRenderer } = require('electron');

// Strict allow-list for IPC channels
const ALLOWED_CHANNELS = {
    INVOKE: [
        'activate-license',
        'check-for-updates',
        'get-settings',
        'save-settings',
        'torrent:start-stream',
        'torrent:stop-stream',
        'torrent:get-status',
        'source:get-all',
        'CAST_PLAY',
        'get-player-preload-path-v2'
    ],
    SEND: [
        'activation-success',
        'close-activation',
        'frontend-log',
        'app-minimize',
        'app-maximize',
        'app-close',
        'CAST_SCAN_START',
        'CAST_SCAN_STOP',
        'stop-status-updates'
    ],
    ON: [
        'update-available',
        'update-downloaded',
        'license-status',
        'CAST_DEVICE_LIST',
        'torrent:status'
    ]
};

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => {
            const isAllowed = ALLOWED_CHANNELS.INVOKE.includes(channel) || 
                             channel.startsWith('torrent:') || 
                             channel.startsWith('source:') || 
                             channel.startsWith('CAST_');
                             
            if (isAllowed) {
                return ipcRenderer.invoke(channel, ...args);
            }
            console.warn(`[Blocked IPC Invoke] Channel: ${channel}`);
            return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
        },
        send: (channel, ...args) => {
            const isAllowed = ALLOWED_CHANNELS.SEND.includes(channel) || 
                             channel.startsWith('torrent:') || 
                             channel.startsWith('CAST_');

            if (isAllowed) {
                ipcRenderer.send(channel, ...args);
            } else {
                console.warn(`[Blocked IPC Send] Channel: ${channel}`);
            }
        },
        on: (channel, func) => {
            const isAllowed = ALLOWED_CHANNELS.ON.includes(channel) || 
                             channel.startsWith('torrent:') || 
                             channel.startsWith('CAST_');

            if (isAllowed) {
                const subscription = (_event, ...args) => func(...args);
                ipcRenderer.on(channel, subscription);
                return subscription;
            }
            console.warn(`[Blocked IPC On] Channel: ${channel}`);
        },
        off: (channel, func) => {
            ipcRenderer.removeListener(channel, func);
        },
        log: (msg) => ipcRenderer.send('frontend-log', msg)
    }
});

// Activation Window API - specifically mapped for clarity
contextBridge.exposeInMainWorld('electronAPI', {
    activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
    activationSuccess: () => ipcRenderer.send('activation-success'),
    closeActivation: () => ipcRenderer.send('close-activation'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});
