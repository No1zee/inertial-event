import { test, expect } from '@playwright/test'

test.describe('NovaStream Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('home page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/NovaStream/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('navigation menu works', async ({ page }) => {
    // Test navigation to different sections
    await page.click('[data-testid="nav-movies"]')
    await expect(page).toHaveURL(/.*\/browse\/movies/)
    
    await page.click('[data-testid="nav-tv-shows"]')
    await expect(page).toHaveURL(/.*\/browse\/tv-shows/)
    
    await page.click('[data-testid="nav-home"]')
    await expect(page).toHaveURL(/.*\//)
  })

  test('search functionality works', async ({ page }) => {
    // Click on search
    await page.click('[data-testid="search-button"]')
    
    // Type search query
    await page.fill('[data-testid="search-input"]', 'test movie')
    
    // Wait for search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Click on first result
    await page.click('[data-testid="content-card"]:first-child')
    
    // Verify content modal opens
    await expect(page.locator('[data-testid="content-modal"]')).toBeVisible()
  })

  test('content card interactions', async ({ page }) => {
    // Wait for content cards to load
    await page.waitForSelector('[data-testid="content-card"]')
    
    // Hover over first content card
    const contentCard = page.locator('[data-testid="content-card"]:first-child')
    await contentCard.hover()
    
    // Verify overlay appears
    await expect(contentCard.locator('[data-testid="content-overlay"]')).toBeVisible()
    
    // Click play button
    await contentCard.locator('[data-testid="play-button"]').click()
    
    // Should navigate to watch page
    await expect(page).toHaveURL(/.*\/watch/)
  })

  test('watchlist functionality', async ({ page }) => {
    // Wait for content cards to load
    await page.waitForSelector('[data-testid="content-card"]')
    
    // Get first content card
    const contentCard = page.locator('[data-testid="content-card"]:first-child')
    await contentCard.hover()
    
    // Click add to watchlist button
    await contentCard.locator('[data-testid="watchlist-button"]').click()
    
    // Navigate to watchlist
    await page.click('[data-testid="nav-watchlist"]')
    
    // Verify item is in watchlist
    await expect(page.locator('[data-testid="watchlist-item"]')).toHaveCount(1)
  })

  test('video player functionality', async ({ page }) => {
    // Navigate to a video
    await page.click('[data-testid="content-card"]:first-child [data-testid="play-button"]')
    
    // Wait for player to load
    await page.waitForSelector('[data-testid="video-player"]')
    
    // Test play/pause
    const player = page.locator('[data-testid="video-player"]')
    await player.click() // Click to toggle play
    
    // Test volume control
    await page.click('[data-testid="volume-button"]')
    
    // Test fullscreen
    await page.click('[data-testid="fullscreen-button"]')
    
    // Verify player is in fullscreen
    await expect(page.locator('html')).toHaveClass(/fullscreen/)
  })

  test('theme switching', async ({ page }) => {
    // Find theme toggle button
    await page.click('[data-testid="theme-toggle"]')
    
    // Check if theme changes (could check for class on body or html element)
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark|light/)
  })

  test('user authentication', async ({ page }) => {
    // Click login button
    await page.click('[data-testid="login-button"]')
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    
    // Submit form
    await page.click('[data-testid="login-submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('content filtering', async ({ page }) => {
    // Navigate to browse page
    await page.click('[data-testid="nav-browse"]')
    
    // Apply genre filter
    await page.selectOption('[data-testid="genre-filter"]', 'action')
    
    // Apply year filter
    await page.selectOption('[data-testid="year-filter"]', '2024')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="content-card"]')).toBeVisible()
  })

  test('responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()
  })

  test('error handling', async ({ page }) => {
    // Navigate to invalid URL
    await page.goto('/invalid-page')
    
    // Should show 404 page
    await expect(page.locator('[data-testid="404-page"]')).toBeVisible()
    
    // Test API error handling
    await page.route('**/api/content/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    // Navigate to page that makes API call
    await page.goto('/')
    
    // Should show error toast
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible()
  })
})

test.describe('Video Streaming Features', () => {
  test('HLS streaming works', async ({ page }) => {
    // Mock HLS stream
    await page.route('**/*.m3u8', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/vnd.apple.mpegurl',
        body: '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10.0,\nsegment0.ts\n#EXTINF:10.0,\nsegment1.ts\n#EXT-X-ENDLIST'
      })
    })
    
    await page.goto('/watch?id=test-content-id')
    
    // Verify player loads HLS content
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible()
  })

  test('subtitle selection', async ({ page }) => {
    await page.goto('/watch?id=test-content-id')
    
    // Click subtitle button
    await page.click('[data-testid="subtitle-button"]')
    
    // Select subtitle language
    await page.click('[data-testid="subtitle-en"]')
    
    // Verify subtitles are displayed
    await expect(page.locator('[data-testid="subtitle-track"]')).toBeVisible()
  })

  test('casting functionality', async ({ page }) => {
    // Mock casting devices
    await page.route('**/cast/devices', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'device1', name: 'Living Room TV', type: 'chromecast' }
        ])
      })
    })
    
    await page.goto('/watch?id=test-content-id')
    
    // Click cast button
    await page.click('[data-testid="cast-button"]')
    
    // Select casting device
    await page.click('[data-testid="cast-device"]')
    
    // Verify casting starts
    await expect(page.locator('[data-testid="casting-indicator"]')).toBeVisible()
  })
})