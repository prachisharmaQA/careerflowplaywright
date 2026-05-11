import { Page, expect } from '@playwright/test';

/**
 * BasePage — shared primitives for every Page Object.
 * Keep this surface minimal; helpers that only one page needs belong on that page.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigates to a path relative to `baseURL` from `playwright.config.ts`. */
  async goto(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** Asserts the page URL contains the given substring. Escapes regex specials. */
  async assertUrlContains(substring: string) {
    const escaped = substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page).toHaveURL(new RegExp(escaped));
  }
}
