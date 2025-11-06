/**
 * E2E tests for homepage
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading exists
    await expect(page.locator('text=LUXCERA').first()).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation links
    const navLinks = ['בית', 'קטגוריות', 'יצירה מותאמת', 'יצירת קשר'];
    for (const link of navLinks) {
      await expect(page.locator(`text=${link}`).first()).toBeVisible();
    }
  });

  test('should open cart modal', async ({ page }) => {
    await page.goto('/');
    
    // Click cart button
    await page.click('button[aria-label*="עגלה"]');
    
    // Check if cart modal is visible
    await expect(page.locator('text=עגלת קניות').first()).toBeVisible();
  });

  test('should have contact form', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to contact section
    await page.locator('text=יצירת קשר').first().scrollIntoViewIfNeeded();
    
    // Check form fields
    await expect(page.locator('input[placeholder*="שם מלא"]').first()).toBeVisible();
    await expect(page.locator('textarea[placeholder*="הודעה"]').first()).toBeVisible();
  });
});
