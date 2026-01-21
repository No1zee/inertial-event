const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, func) => {
            const subscription = (_event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return subscription;
        },
        off: (channel, func) => {
            ipcRenderer.removeListener(channel, func);
        },
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
        log: (msg) => ipcRenderer.send('frontend-log', msg)
    }
});

// Activation Window API
contextBridge.exposeInMainWorld('electronAPI', {
    activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
    activationSuccess: () => ipcRenderer.send('activation-success'),
    closeActivation: () => ipcRenderer.send('close-activation'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});
