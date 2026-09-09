import { test, expect } from '@playwright/test';

test('admin can complete stall booking flow', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page.getByText(/Core Committee Dashboard/i)).toBeVisible();
  await page.getByText('Stall Allocation').click();
  await expect(page.getByText(/Stall Master/i)).toBeVisible();
});
