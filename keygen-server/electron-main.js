const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server'); // Import the existing Express App

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'admin-dashboard/public/vite.svg'), // Placeholder icon
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // In production, we load the built React app
    // In dev, we might want to load localhost:5173, but for this standalone build,
    // we assume the UI is built into 'admin-dashboard/dist'
    
    // We need to wait for the server to start? 
    // Actually, asking the main process to spawn the server is enough.
    // The UI (React) calls 'http://localhost:3000' (or whatever port).
    
    // Determine Environment
    const isDev = !app.isPackaged;

    if (isDev) {
        win.loadURL('http://localhost:5173'); // Dev Mode (Vite)
    } else {
        // Load built files
        // We need to ensure 'admin-dashboard/dist' exists and is copied
        win.loadFile(path.join(__dirname, 'admin-dashboard/dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
