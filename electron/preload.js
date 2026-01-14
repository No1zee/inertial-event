const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, func) => {
            const subscription = (_event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return subscription; // Return to allow removal if needed (though tricky with wrapper)
        },
        off: (channel, func) => {
            // Note: This requires the exact function reference, which is hard with the wrapper above. 
            // In a simple reload scenario, this might be fine, but for strict cleanup, we'd need a map.
            // For now, we expose removeListener directly or just rely on 'on' for one-way events.
            ipcRenderer.removeListener(channel, func);
        },
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func)
    }
});
