import { expect, test } from '@playwright/test';

import { annotationLabel } from '../../';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  test.info().annotations.push({
    type: annotationLabel('foobar'),
    description: 'fizzbuzz',
  });

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole('heading', { name: 'Installation' })
  ).toBeVisible();
});

test.fail('looking for a non-existent link', async ({ page }) => {
  await page.goto('https://playwright.dev');

  await expect(page.getByRole('link', { name: 'Foobar' })).toBeVisible();
});
