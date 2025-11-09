import { test, expect } from '@playwright/test';

test.describe('useToast Hook - Basic Usage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usetoast--basic-usage&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display toast trigger buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Show Success Toast")')).toBeVisible();
    await expect(page.locator('button:has-text("Show Error Toast")')).toBeVisible();
    await expect(page.locator('button:has-text("Toast with Action")')).toBeVisible();
    await expect(page.locator('button:has-text("Dismiss All")')).toBeVisible();
  });

  test('should show success toast when button clicked', async ({ page }) => {
    const successButton = page.locator('button:has-text("Show Success Toast")');
    await successButton.click();

    // Wait for toast to appear
    await page.waitForTimeout(200);

    // Check for toast with success message
    const toast = page.locator('text="Success!"').first();
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Check description
    await expect(page.locator('text="Your action completed successfully."')).toBeVisible();
  });

  test('should show error toast with red background', async ({ page }) => {
    const errorButton = page.locator('button:has-text("Show Error Toast")');
    await errorButton.click();

    // Wait for toast to appear
    await page.waitForTimeout(200);

    // Check for toast with error message
    const toast = page.locator('text="Error"').first();
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Verify it has destructive styling (red background)
    const toastDiv = toast.locator('..');
    const background = await toastDiv.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Red color check (rgb format)
    expect(background).toContain('245, 101, 101'); // #f56565 in rgb
  });

  test('should show toast with action button', async ({ page }) => {
    const actionButton = page.locator('button:has-text("Toast with Action")');
    await actionButton.click();

    // Wait for toast to appear
    await page.waitForTimeout(200);

    // Check for toast with action
    await expect(page.locator('text="With Action"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="This toast has an action button."')).toBeVisible();

    // Check for Undo button
    const undoButton = page.locator('button:has-text("Undo")');
    await expect(undoButton).toBeVisible();
  });

  test('should dismiss all toasts when Dismiss All clicked', async ({ page }) => {
    // Show multiple toasts
    await page.locator('button:has-text("Show Success Toast")').click();
    await page.waitForTimeout(200);

    // Verify toast is visible
    await expect(page.locator('text="Success!"').first()).toBeVisible();

    // Click dismiss all
    await page.locator('button:has-text("Dismiss All")').click();
    await page.waitForTimeout(200);

    // Toast should be gone
    await expect(page.locator('text="Success!"')).not.toBeVisible({ timeout: 1000 });
  });

  test('should limit toasts to 1 (TOAST_LIMIT)', async ({ page }) => {
    // Show first toast
    await page.locator('button:has-text("Show Success Toast")').click();
    await page.waitForTimeout(200);

    // Show second toast
    await page.locator('button:has-text("Show Error Toast")').click();
    await page.waitForTimeout(200);

    // Only the error toast should be visible (replaces first)
    await expect(page.locator('text="Error"').first()).toBeVisible();

    // Count visible toasts (should be 1)
    const toastContainer = page.locator('[style*="position: fixed"][style*="bottom: 20"]');
    const toastCount = await toastContainer.locator('> div').count();
    expect(toastCount).toBe(1);
  });
});

test.describe('useToast - Update Toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usetoast--update-toast&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display upload simulation button', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Simulate File Upload")');
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeEnabled();
  });

  test('should show upload progression through toast updates', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Simulate File Upload")');
    await uploadButton.click();

    // Should show "Uploading..." initially
    await expect(page.locator('text="Uploading..."')).toBeVisible({ timeout: 5000 });

    // Wait for "Processing..." (after 2s)
    await expect(page.locator('text="Processing..."')).toBeVisible({ timeout: 3000 });

    // Wait for "Success!" (after 4s total)
    await expect(page.locator('text="Success!"')).toBeVisible({ timeout: 3000 });
  });

  test('should disable button during upload', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Simulate File Upload")');
    await uploadButton.click();

    // Button should be disabled and show "Uploading..."
    await expect(uploadButton).toBeDisabled();
    await expect(page.locator('button:has-text("Uploading...")')).toBeVisible();
  });

  test('should display how it works section', async ({ page }) => {
    await expect(page.locator('text="How it works:"')).toBeVisible();
    await expect(page.locator('text=/Toast shows "Uploading..."/i')).toBeVisible();
  });
});

test.describe('useToast - Imperative API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=hooks-usetoast--imperative-api&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should display imperative API buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Trigger from Function")')).toBeVisible();
    await expect(page.locator('button:has-text("Trigger Multiple")')).toBeVisible();
  });

  test('should trigger toast from outside React', async ({ page }) => {
    const triggerButton = page.locator('button:has-text("Trigger from Function")');
    await triggerButton.click();

    // Wait for toast
    await page.waitForTimeout(200);

    // Should show toast triggered from imperative API
    await expect(page.locator('text="Triggered from outside!"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="This toast was triggered using the imperative API."')).toBeVisible();
  });

  test('should show TOAST_LIMIT note', async ({ page }) => {
    await expect(page.locator('text=/TOAST_LIMIT = 1/i')).toBeVisible();
  });

  test('should demonstrate toast limit with multiple triggers', async ({ page }) => {
    const multipleButton = page.locator('button:has-text("Trigger Multiple")');
    await multipleButton.click();

    // Wait for toasts to process
    await page.waitForTimeout(300);

    // Should only show "Second toast" (replaces first)
    await expect(page.locator('text="Second toast"')).toBeVisible({ timeout: 5000 });

    // First toast should not be visible
    await expect(page.locator('text="First toast"')).not.toBeVisible();
  });

  test('should display example usage code', async ({ page }) => {
    const codeBlock = page.locator('pre');
    await expect(codeBlock).toBeVisible();

    const code = await codeBlock.textContent();
    expect(code).toContain('fetch');
    expect(code).toContain('toast');
    expect(code).toContain('window.addEventListener');
  });
});
