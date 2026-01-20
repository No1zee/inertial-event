const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const licenseManager = require('./licenseManager');

let activationWindow = null;

function createActivationWindow(parentWindow) {
    console.log('[Activation] Creating window...');
    activationWindow = new BrowserWindow({
        width: 480,
        height: 420,
        center: true,
        resizable: false,
        frame: false,
        transparent: false, // Changed to false for stability
        backgroundColor: '#1a1a2e', // Match theme background
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load local HTML file
    const htmlPath = path.join(__dirname, 'activation.html');
    console.log('[Activation] Loading file:', htmlPath);
    activationWindow.loadFile(htmlPath);
    
    activationWindow.once('ready-to-show', () => {
        console.log('[Activation] Window ready to show');
        activationWindow.show();
        activationWindow.focus();
    });
    
    return activationWindow;
}

// IPC Handlers for activation
ipcMain.handle('activate-license', async (event, licenseKey) => {
    return await licenseManager.activate(licenseKey);
});

ipcMain.on('close-activation', () => {
    if (activationWindow) {
        activationWindow.close();
        activationWindow = null;
    }
});

module.exports = {
    createActivationWindow
};
