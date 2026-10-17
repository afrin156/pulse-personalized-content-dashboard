import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end tests for the critical user flows.
 * They run against the production build with NO API keys, so the built-in
 * sample data is used and results are deterministic.
 */

const articles = (page: Page) => page.getByRole('list', { name: 'Your feed' }).getByRole('article');
const titles = async (page: Page) =>
  (await articles(page).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label'))));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(articles(page).first()).toBeVisible();
});

test('feed combines news, movies and social posts', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Your feed' })).toBeVisible();
  await expect(page.getByRole('link', { name: /read more/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /play now/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /view post/i }).first()).toBeVisible();
});

test('search: debounced query shows results, then clearing returns to the feed', async ({ page }) => {
  const box = page.getByRole('searchbox', { name: 'Search content' });
  await box.fill('quantum');
  await expect(page.getByRole('heading', { name: 'Results for “quantum”' })).toBeVisible();
  await expect(page.getByText('Quantum networking test links two campuses')).toBeVisible();

  await page.getByRole('tab', { name: /movies/i }).click();
  await expect(page.getByText('No matches in this tab')).toBeVisible();

  await box.fill('zzzzzz');
  await expect(page.getByText('No results for “zzzzzz”')).toBeVisible();

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByRole('heading', { name: 'Your feed' })).toBeVisible();
});

test('favorites: saved items appear in Favorites and survive a reload', async ({ page }) => {
  const first = articles(page).first();
  const title = (await first.getAttribute('aria-label'))!;
  await first.getByRole('button', { name: /^Favorite:/ }).click();

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /favorites/i }).click();
  await expect(page.getByRole('list', { name: 'Favorite items' }).getByText(title)).toBeVisible();

  await page.reload();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /favorites/i }).click();
  await expect(page.getByRole('list', { name: 'Favorite items' }).getByText(title)).toBeVisible();
});

test('dark mode toggle applies and persists', async ({ page }) => {
  const html = page.locator('html');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(html).toHaveClass(/dark/);
  await page.reload();
  await expect(html).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(html).not.toHaveClass(/dark/);
});

test('settings: changing categories reloads the feed and is remembered', async ({ page }) => {
  await page.getByRole('button', { name: 'Open settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('button', { name: 'Health' }).click();
  await expect(dialog.getByRole('button', { name: 'Health' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(articles(page).first()).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('button', { name: 'Health' })).toHaveAttribute('aria-pressed', 'true');
});

test('reorder with the move buttons, and the order survives a reload', async ({ page }) => {
  const before = await titles(page);
  await articles(page).first().getByRole('button', { name: /^Move down:/ }).click();
  await expect.poll(async () => (await titles(page)).slice(0, 2)).toEqual([before[1], before[0]]);

  await page.reload();
  await expect(articles(page).first()).toBeVisible();
  expect((await titles(page)).slice(0, 2)).toEqual([before[1], before[0]]);
});

test('drag and drop: dragging the handle reorders the cards', async ({ page }) => {
  const before = await titles(page);
  const handle = articles(page).first().getByTestId('drag-handle');
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 25; i++) await page.mouse.move(x, y + i * 12, { steps: 2 });
  await page.mouse.up();

  await expect.poll(async () => (await titles(page))[0]).not.toBe(before[0]);
});

test('load more appends a new page of content', async ({ page }) => {
  const count = await articles(page).count();
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect.poll(() => articles(page).count()).toBeGreaterThan(count);
});

test('trending shows a ranked list', async ({ page }) => {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /trending/i }).click();
  await expect(page.getByRole('heading', { name: 'Trending now' })).toBeVisible();
  await expect(page.getByLabel('Rank 1')).toBeVisible();
});
