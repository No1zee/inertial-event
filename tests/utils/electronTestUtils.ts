import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

export async function launchElectronApp(): Promise<{ 
  electronApp: ElectronApplication; 
  mainWindow: Page; 
}> {
  const mainPath = path.join(__dirname, '../../electron/main.js');
  console.log(`[TestUtils] Main script path: ${mainPath}`);

  const electronApp = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_TEST_MODE: 'true',
    },
    timeout: 60000,
  });

  // Pipe process output to console
  electronApp.process().stdout?.on('data', (data) => console.log(`[Main Process] ${data.toString().trim()}`));
  electronApp.process().stderr?.on('data', (data) => console.error(`[Main Error] ${data.toString().trim()}`));


  console.log('[TestUtils] App launched, waiting for first window...');
  const mainWindow = await electronApp.firstWindow();
  
  // Inject test flags before page scripts load
  await mainWindow.addInitScript(() => {
    (window as any).NOVA_TEST_BYPASS_ONBOARDING = true;
    (window as any).ELECTRON_TEST_MODE = true;
    console.log('[Test] Injected test bypass flags');
  });
  
  // Pipe browser console to terminal
  mainWindow.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  mainWindow.on('pageerror', err => {
    console.log(`[Browser Error] ${err.message}\n${err.stack}`);
  });

  console.log('[TestUtils] First window found, waiting for load state...');
  
  // Wait for the app to be ready and loaded
  await mainWindow.waitForLoadState('domcontentloaded', { timeout: 30000 });
  console.log('[TestUtils] DOMContentLoaded reached.');
  
  console.log('[TestUtils] Electron application launched and ready.');
  
  return { electronApp, mainWindow };
}

export async function waitForPlayerState(page: Page, state: string, timeout = 30000) {
  console.log(`[TestUtils] Waiting for player state: ${state}...`);
  await page.waitForFunction(
    (targetState) => {
      // Assuming player state is available on window or via a specific DOM element
      const badge = document.querySelector('[data-testid="aegis-badge"]');
      return badge?.textContent?.toLowerCase().includes(targetState.toLowerCase());
    },
    state,
    { timeout }
  );
}

export async function getIpcEvents(electronApp: ElectronApplication) {
  // This is a bit tricky with standard Playwright, 
  // but we can evaluate in the main process if we have a way to hook it.
  // For now, we rely on observable side effects in the renderer.
}
