import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Error handling - catch early crashes
process.on('uncaughtException', (err) => {
    console.error('CRASH:', err);
    dialog.showErrorBox('Application Crash', err.stack || err.message);
});

async function startServer() {
    try {
        await import('./server.js');
    } catch (err) {
        console.error('Failed to start server:', err);
        dialog.showErrorBox('Server Error', `Failed to start background server: ${err.message}`);
    }
}

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

    // Determine Environment
    const isDev = !app.isPackaged;

    if (isDev) {
        win.loadURL('http://localhost:5173'); // Dev Mode (Vite)
    } else {
        // Load built files
        win.loadFile(path.join(__dirname, 'admin-dashboard/dist/index.html'));
    }
}

app.whenReady().then(() => {
    startServer();
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
