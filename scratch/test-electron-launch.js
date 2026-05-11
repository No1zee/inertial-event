const { _electron: electron } = require('@playwright/test');
const path = require('path');

(async () => {
  console.log('Launching Electron...');
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '..', 'electron/main.js')],
    executablePath: process.env.ELECTRON_PATH || undefined, // Fallback if needed
  });

  console.log('Electron launched.');
  const window = await electronApp.firstWindow();
  console.log('Window title:', await window.title());

  // Wait for a bit to see if it loads
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Closing Electron...');
  await electronApp.close();
})();
