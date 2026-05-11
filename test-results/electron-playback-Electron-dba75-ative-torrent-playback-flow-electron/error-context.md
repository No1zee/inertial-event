# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: electron-playback.spec.ts >> Electron Native Playback E2E >> native torrent playback flow
- Location: tests\e2e\electron-playback.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('[data-testid="video-player"] video')
Expected: attached
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 45000ms
  - waiting for locator('[data-testid="video-player"] video')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e2]:
    - button "Return home" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
    - main [ref=e9]:
      - generic "Media player container" [ref=e13]:
        - region "Media Player" [ref=e14]:
          - generic [ref=e15]:
            - img
          - generic [ref=e16]:
            - img [ref=e17]
            - generic [ref=e20]: Aegis Shield // optimal // Torrentio // 0s Secure
          - generic [ref=e22]:
            - generic [ref=e24]:
              - button "Add to Library" [ref=e25] [cursor=pointer]:
                - img [ref=e26]
              - button "Download this stream" [ref=e28] [cursor=pointer]:
                - img [ref=e29]
            - generic [ref=e32]:
              - generic [ref=e33]:
                - generic [ref=e34]: 0:00
                - slider [ref=e36] [cursor=pointer]: "0"
                - generic [ref=e37]: 0:00
              - generic [ref=e38]:
                - generic [ref=e39]:
                  - button "Play" [ref=e40] [cursor=pointer]:
                    - img [ref=e41]
                  - generic [ref=e43]:
                    - button "Mute" [ref=e44] [cursor=pointer]:
                      - img [ref=e45]
                    - slider "Volume" [ref=e49] [cursor=pointer]: "1"
                  - generic [ref=e50]:
                    - generic [ref=e51]: 0:00
                    - generic [ref=e52]: /
                    - generic [ref=e53]: 0:00
                - generic [ref=e54]:
                  - button "Search Dialogue and Semantic Moments" [ref=e55] [cursor=pointer]:
                    - img [ref=e56]
                  - button "View Director's Cut X-Ray Context" [ref=e59] [cursor=pointer]:
                    - img [ref=e60]
                  - button "Switch Content Source" [ref=e62] [cursor=pointer]:
                    - img [ref=e63]
                  - button "Initialize Cinematic Lounge Watch Party" [ref=e69] [cursor=pointer]:
                    - img [ref=e70]
                  - button "Player Settings" [ref=e75] [cursor=pointer]:
                    - img [ref=e76]
                  - button "Cast to External Device" [ref=e79] [cursor=pointer]:
                    - img [ref=e80]
                  - button "Enter Picture-in-Picture Mode" [ref=e84] [cursor=pointer]:
                    - img [ref=e85]
                  - button "Toggle Fullscreen" [ref=e88] [cursor=pointer]:
                    - img [ref=e89]
  - generic [ref=e94]:
    - img [ref=e96]
    - button "Open Tanstack query devtools" [ref=e164] [cursor=pointer]:
      - img [ref=e165]
  - alert [ref=e233]
```

# Test source

```ts
  1  | import { test, expect, ElectronApplication, Page } from '@playwright/test';
  2  | import { launchElectronApp, waitForPlayerState } from '../utils/electronTestUtils';
  3  | 
  4  | test.describe('Electron Native Playback E2E', () => {
  5  |   test.describe.configure({ mode: 'serial' });
  6  |   let electronApp: ElectronApplication;
  7  |   let mainWindow: Page;
  8  | 
  9  |   test.beforeAll(async () => {
  10 |     const setup = await launchElectronApp();
  11 |     electronApp = setup.electronApp;
  12 |     mainWindow = setup.mainWindow;
  13 |   });
  14 | 
  15 |   test.afterAll(async () => {
  16 |     await electronApp.close();
  17 |   });
  18 | 
  19 |   test('application loads home page', async () => {
  20 |     await expect(mainWindow).toHaveTitle(/NovaStream/);
  21 |     // The home page might not have a direct h1, let's look for the main content area
  22 |     await expect(mainWindow.locator('main')).toBeVisible();
  23 |   });
  24 | 
  25 |   test('native torrent playback flow', async () => {
  26 |     // 1. Navigate to a specific content
  27 |     const testMagnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel';
  28 |     
  29 |     console.log('[Test] Navigating to watch page with test magnet...');
  30 |     const url = `http://localhost:3000/watch?id=550&type=movie&source=${encodeURIComponent(testMagnet)}`;
  31 |     await mainWindow.goto(url);
  32 | 
  33 |     // 2. Verify Cinematic Startup appears
  34 |     console.log('[Test] Verifying cinematic startup...');
  35 |     await expect(mainWindow.locator('[data-testid="cinematic-startup"]')).toBeVisible({ timeout: 10000 });
  36 | 
  37 |     // 3. Verify Aegis Shield status transitions
  38 |     console.log('[Test] Monitoring Aegis Shield status...');
  39 |     
  40 |     // Trigger controls visibility
  41 |     await mainWindow.locator('[data-testid="video-player"]').hover();
  42 |     
  43 |     // It might take a moment for the status to appear
  44 |     await expect(mainWindow.locator('[data-testid="aegis-badge"]')).toBeVisible({ timeout: 15000 });
  45 | 
  46 |     // 4. Wait for metadata and stream start
  47 |     // In a real E2E, this might take a while depending on peer availability
  48 |     // But Sintel is usually well-seeded.
  49 |     // 4. Wait for metadata and stream start
  50 |     console.log('[Test] Waiting for playback to start (Native Player active)...');
  51 |     
  52 |     // Check if NativePlayer video element is present and attached
  53 |     const videoElement = mainWindow.locator('[data-testid="video-player"] video');
> 54 |     await expect(videoElement).toBeAttached({ timeout: 45000 });
     |                                ^ Error: expect(locator).toBeAttached() failed
  55 |     
  56 |     // Wait for the video to have a non-zero duration (indicating metadata loaded)
  57 |     await expect(async () => {
  58 |       const duration = await videoElement.evaluate((el: HTMLVideoElement) => el.duration);
  59 |       console.log(`[Test] Current video duration: ${duration}`);
  60 |       expect(duration).toBeGreaterThan(0);
  61 |     }).toPass({ timeout: 60000 });
  62 | 
  63 |     // 5. Verify Aegis Shield reports "ACTIVE" or "SECURE" or "OPTIMAL"
  64 |     await expect(mainWindow.locator('[data-testid="aegis-badge"]')).toContainText(/SECURE|ACTIVE|OPTIMAL/i, { timeout: 30000 });
  65 | 
  66 |     // 6. Check playback progress (ensure currentTime is increasing)
  67 |     console.log('[Test] Verifying playback progression...');
  68 |     await expect(async () => {
  69 |       const time1 = await videoElement.evaluate((el: HTMLVideoElement) => el.currentTime);
  70 |       await mainWindow.waitForTimeout(2000);
  71 |       const time2 = await videoElement.evaluate((el: HTMLVideoElement) => el.currentTime);
  72 |       console.log(`[Test] Progress: ${time1.toFixed(2)}s -> ${time2.toFixed(2)}s`);
  73 |       expect(time2).toBeGreaterThan(time1);
  74 |     }).toPass({ timeout: 20000 });
  75 |     
  76 |     console.log('[Test] Playback verified successfully.');
  77 |   });
  78 | 
  79 |   test('IPC communication integrity', async () => {
  80 |     // We can check if specific IPC events were logged if we added logging in main.js
  81 |     // For now, we verify the results in the renderer which depend on IPC
  82 |     
  83 |     // Verify that the player store has been updated with torrent metadata
  84 |     const playerState = await mainWindow.evaluate(() => {
  85 |       // @ts-ignore - access zustand store if exposed or check DOM
  86 |       return document.querySelector('[data-testid="player-metadata"]')?.textContent;
  87 |     });
  88 |     
  89 |     if (playerState) {
  90 |       expect(playerState).toContain('Sintel');
  91 |     }
  92 |   });
  93 | });
  94 | 
```