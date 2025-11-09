import { test, expect } from '@playwright/test';

test.describe('useContainerSize Hook', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usecontainersize--basic-usage&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display initial dimensions', async ({ page }) => {
    // Check that dimension values are displayed
    const widthText = await page.locator('text=/Width: \\d+px/').first();
    const heightText = await page.locator('text=/Height: \\d+px/').first();

    await expect(widthText).toBeVisible();
    await expect(heightText).toBeVisible();
  });

  test('should update dimensions when slider changes', async ({ page }) => {
    // Get initial width value
    const slider = page.locator('input[type="range"]');
    const initialValue = await slider.inputValue();

    // Move slider to a different position
    await slider.fill('600');

    // Wait a bit for the update to apply
    await page.waitForTimeout(300);

    // Get new value and verify it changed
    const newValue = await slider.inputValue();
    expect(newValue).not.toBe(initialValue);
    expect(newValue).toBe('600');
  });

  test('should show position coordinates', async ({ page }) => {
    const positionText = await page.locator('text=/Position: \\(/');
    await expect(positionText).toBeVisible();
  });
});

test.describe('useContainerSize - Responsive Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usecontainersize--responsive-chart&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should render SVG chart', async ({ page }) => {
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();

    // Check SVG has dimensions
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');

    expect(Number(width)).toBeGreaterThan(0);
    expect(Number(height)).toBeGreaterThan(0);
  });

  test('should display size indicator text in SVG', async ({ page }) => {
    const sizeText = page.locator('svg text');
    await expect(sizeText).toBeVisible();

    const textContent = await sizeText.textContent();
    expect(textContent).toMatch(/\d+ × \d+/);
  });
});
