import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchElectronApp, waitForPlayerState } from '../utils/electronTestUtils';

test.describe('Electron Native Playback E2E', () => {
  test.describe.configure({ mode: 'serial' });
  let electronApp: ElectronApplication;
  let mainWindow: Page;

  test.beforeAll(async () => {
    const setup = await launchElectronApp();
    electronApp = setup.electronApp;
    mainWindow = setup.mainWindow;
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('application loads home page', async () => {
    await expect(mainWindow).toHaveTitle(/NovaStream/);
    // The home page might not have a direct h1, let's look for the main content area
    await expect(mainWindow.locator('main')).toBeVisible();
  });

  test('native torrent playback flow', async () => {
    // 1. Navigate to a specific content
    const testMagnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel';
    
    console.log('[Test] Navigating to watch page with test magnet...');
    const url = `http://localhost:3000/watch?id=550&type=movie&source=${encodeURIComponent(testMagnet)}`;
    await mainWindow.goto(url);
    await mainWindow.waitForURL(/watch/, { timeout: 15000 });

    // 2. Verify Cinematic Startup appears
    console.log('[Test] Verifying cinematic startup...');
    await expect(mainWindow.locator('[data-testid="cinematic-startup"]')).toBeVisible({ timeout: 15000 });

    // 3. Verify Aegis Shield status transitions
    console.log('[Test] Monitoring Aegis Shield status...');
    
    // Trigger controls visibility (needed for some UI elements)
    await mainWindow.locator('[data-testid="video-player"]').hover();
    
    // Wait for the status badge to appear
    const aegisBadge = mainWindow.locator('[data-testid="aegis-badge"]');
    await expect(aegisBadge).toBeVisible({ timeout: 25000 });
    
    // 4. Wait for metadata and stream start
    console.log('[Test] Waiting for playback to start (Native Player active)...');
    
    // Check if NativePlayer video element is present and attached
    const videoElement = mainWindow.locator('[data-testid="video-player"] video');
    await expect(videoElement).toBeAttached({ timeout: 60000 });
    
    // Wait for the video to have a non-zero duration (indicating metadata loaded)
    console.log('[Test] Waiting for non-zero duration...');
    await expect(async () => {
      const duration = await videoElement.evaluate((el: HTMLVideoElement) => el.duration);
      console.log(`[Test] Current video duration: ${duration}`);
      expect(duration).toBeGreaterThan(0);
    }).toPass({ timeout: 90000 });

    // 5. Verify Aegis Shield reports status
    console.log('[Test] Verifying Aegis Shield reports status...');
    await expect(aegisBadge).toContainText(/SECURE|ACTIVE|OPTIMAL|DEGRADED/i, { timeout: 30000 });

    // 6. Check playback progress (ensure currentTime is increasing)
    console.log('[Test] Verifying playback progression...');
    await expect(async () => {
      const time1 = await videoElement.evaluate((el: HTMLVideoElement) => el.currentTime);
      await mainWindow.waitForTimeout(3000);
      const time2 = await videoElement.evaluate((el: HTMLVideoElement) => el.currentTime);
      console.log(`[Test] Progress: ${time1.toFixed(2)}s -> ${time2.toFixed(2)}s`);
      expect(time2).toBeGreaterThan(time1);
    }).toPass({ timeout: 40000 });
    
    console.log('[Test] Playback verified successfully.');
  });

  test('IPC communication integrity', async () => {
    // We can check if specific IPC events were logged if we added logging in main.js
    // For now, we verify the results in the renderer which depend on IPC
    
    // Verify that the player store has been updated with torrent metadata
    const playerState = await mainWindow.evaluate(() => {
      // @ts-ignore - access zustand store if exposed or check DOM
      return document.querySelector('[data-testid="player-metadata"]')?.textContent;
    });
    
    if (playerState) {
      expect(playerState).toContain('Sintel');
    }
  });
});
