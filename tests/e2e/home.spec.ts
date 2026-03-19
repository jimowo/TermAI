import { expect, test } from '@playwright/test';

test('renders the xshell-inspired workspace with the AI agent sidebar', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1', { hasText: 'TermAI' })).toBeVisible();
  await expect(page.getByText('Connections')).toBeVisible();
  await expect(page.getByText('Terminal workspace')).toBeVisible();
  await expect(page.getByText('AI Agents')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New host' })).toBeVisible();
  await expect(page.getByLabel('Terminal workspace')).toBeVisible();

  await page.screenshot({ path: 'artifacts/termai-home.png', fullPage: true });
});
