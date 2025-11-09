import { test, expect } from '@playwright/test';

test.describe('useThrottle Hook - Basic Usage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usethrottle--basic-usage&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display input field and buttons', async ({ page }) => {
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button:has-text("Flush")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Log")')).toBeVisible();
  });

  test('should show pending state indicator', async ({ page }) => {
    const statusIndicator = page.locator('text=/⏳ Pending|✓ Ready/');
    await expect(statusIndicator).toBeVisible();

    // Initially should be ready
    await expect(statusIndicator).toContainText('✓ Ready');
  });

  test('should log calls when typing', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const callLog = page.locator('text="Call Log:"').locator('..');

    // Type in the input
    await input.fill('test');

    // Wait for throttling
    await page.waitForTimeout(300);

    // Check that calls were logged
    const logContent = await callLog.textContent();
    expect(logContent).toContain('immediate');
  });

  test('should clear log when Clear Log button clicked', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const clearButton = page.locator('button:has-text("Clear Log")');

    // Type something to create log entries
    await input.fill('test');
    await page.waitForTimeout(300);

    // Clear the log
    await clearButton.click();

    // Check for "No calls yet" message
    await expect(page.locator('text="No calls yet..."')).toBeVisible();
  });

  test('should execute throttled call with Flush button', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const flushButton = page.locator('button:has-text("Flush")');

    await input.fill('flush test');

    // Click flush
    await flushButton.click();
    await page.waitForTimeout(100);

    // The call log should show activity
    const hasLog = await page.locator('text=/\\[\\d+:\\d+:\\d+/').count();
    expect(hasLog).toBeGreaterThan(0);
  });
});

test.describe('useThrottle - Scroll Throttle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usethrottle--scroll-throttle&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display scroll metrics', async ({ page }) => {
    await expect(page.locator('text="Scroll Position (px)"')).toBeVisible();
    await expect(page.locator('text="Scroll Events Fired"')).toBeVisible();
    await expect(page.locator('text="Throttled Calls"')).toBeVisible();
  });

  test('should show reduction percentage', async ({ page }) => {
    await expect(page.locator('text=/Reduction: \\d+(\\.\\d+)?%/')).toBeVisible();
  });

  test('should update metrics on scroll', async ({ page }) => {
    // Get initial scroll position
    const scrollPosElement = page.locator('text="Scroll Position (px)"').locator('..');
    const initialValue = await scrollPosElement.textContent();

    // Scroll down
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);

    // Check that position updated
    const newValue = await scrollPosElement.textContent();
    expect(newValue).not.toBe(initialValue);
  });

  test('should render content blocks for scrolling', async ({ page }) => {
    const contentBlocks = page.locator('text=/Content Block \\d+/');
    const count = await contentBlocks.count();
    expect(count).toBeGreaterThan(10);
  });
});

test.describe('useThrottle - Leading/Trailing Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usethrottle--leading-trailing-options&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display leading and trailing checkboxes', async ({ page }) => {
    const leadingCheckbox = page.locator('input[type="checkbox"]').first();
    const trailingCheckbox = page.locator('input[type="checkbox"]').last();

    await expect(leadingCheckbox).toBeVisible();
    await expect(trailingCheckbox).toBeVisible();

    // Both should be checked by default
    await expect(leadingCheckbox).toBeChecked();
    await expect(trailingCheckbox).toBeChecked();
  });

  test('should toggle leading option', async ({ page }) => {
    const leadingCheckbox = page.locator('input[type="checkbox"]').first();

    // Uncheck it
    await leadingCheckbox.uncheck();
    await expect(leadingCheckbox).not.toBeChecked();

    // Check it again
    await leadingCheckbox.check();
    await expect(leadingCheckbox).toBeChecked();
  });

  test('should trigger burst of calls', async ({ page }) => {
    const triggerButton = page.locator('button:has-text("Trigger Burst")');
    const clearButton = page.locator('button:has-text("Clear Log")');

    // Clear log first
    await clearButton.click();

    // Trigger burst
    await triggerButton.click();
    await page.waitForTimeout(1500);

    // Should show burst calls in log
    const logText = await page.locator('text="Call Log:"').locator('..').textContent();
    expect(logText).toContain('Burst');
  });

  test('should show different behavior based on options', async ({ page }) => {
    const leadingCheckbox = page.locator('input[type="checkbox"]').first();
    const trailingCheckbox = page.locator('input[type="checkbox"]').last();
    const triggerButton = page.locator('button:has-text("Trigger Burst")');
    const clearButton = page.locator('button:has-text("Clear Log")');

    // Test with both disabled
    await leadingCheckbox.uncheck();
    await trailingCheckbox.uncheck();
    await clearButton.click();
    await triggerButton.click();
    await page.waitForTimeout(1500);

    const logNoOptions = await page.locator('text="Call Log:"').locator('..').textContent();

    // Clear and test with both enabled
    await leadingCheckbox.check();
    await trailingCheckbox.check();
    await clearButton.click();
    await triggerButton.click();
    await page.waitForTimeout(1500);

    const logBothOptions = await page.locator('text="Call Log:"').locator('..').textContent();

    // The logs should be different
    expect(logNoOptions).not.toBe(logBothOptions);
  });
});
