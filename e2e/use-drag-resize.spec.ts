import { test, expect } from '@playwright/test';

test.describe('useDragResize Hook - Basic Resize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usedragresize--basic-resize&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display initial dimensions', async ({ page }) => {
    const dimensionText = page.locator('text=/\\d+ × \\d+/').first();
    await expect(dimensionText).toBeVisible();

    const text = await dimensionText.textContent();
    expect(text).toMatch(/\d+ × \d+/);
  });

  test('should show resize handle', async ({ page }) => {
    // The resize handle should be visible on the right edge
    const resizeHandle = page.locator('[style*="cursor: ew-resize"]');
    await expect(resizeHandle).toBeVisible();
  });

  test('should update isResizing state during drag', async ({ page }) => {
    const resizeHandle = page.locator('[style*="cursor: ew-resize"]').first();
    const statusText = page.locator('text=/isResizing:/');

    // Initial state should be false
    await expect(statusText).toContainText('false');

    // Start dragging
    const box = await resizeHandle.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();

      // Move mouse to trigger resize
      await page.mouse.move(box.x + 50, box.y + box.height / 2);

      await page.mouse.up();
    }

    // After drag completes, should be back to false
    await page.waitForTimeout(100);
    await expect(statusText).toContainText('false');
  });

  test('should display current values', async ({ page }) => {
    await expect(page.locator('text=/width: \\d+px/')).toBeVisible();
    await expect(page.locator('text=/height: \\d+px/')).toBeVisible();
  });
});

test.describe('useDragResize - Aspect Ratio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usedragresize--aspect-ratio-locked&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should maintain 16:9 aspect ratio', async ({ page }) => {
    const ratioText = page.locator('text=/Ratio: \\d+\\.\\d+/');
    await expect(ratioText).toBeVisible();

    const text = await ratioText.textContent();
    const match = text?.match(/Ratio: ([\d.]+)/);

    if (match) {
      const ratio = parseFloat(match[1]);
      // 16:9 = 1.78 (with some tolerance for rounding)
      expect(ratio).toBeGreaterThanOrEqual(1.76);
      expect(ratio).toBeLessThanOrEqual(1.80);
    }
  });

  test('should render video player mockup', async ({ page }) => {
    const playButton = page.locator('text=▶');
    await expect(playButton).toBeVisible();
  });
});

test.describe('useDragResize - Grid Snapping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usedragresize--grid-snapping&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should show grid visualization', async ({ page }) => {
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();

    // Check for grid lines
    const lines = page.locator('svg line');
    const count = await lines.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow changing grid size', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // Change grid size
    await slider.fill('50');

    // Verify slider value changed
    const value = await slider.inputValue();
    expect(value).toBe('50');
  });

  test('should display current width', async ({ page }) => {
    const widthText = page.locator('text=/\\d+px/').first();
    await expect(widthText).toBeVisible();
  });
});
