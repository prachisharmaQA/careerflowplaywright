import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage — the landing page after a successful login.
 *
 * The sidebar is rendered as `role="complementary"` (with an inner `menu`),
 * not `role="navigation"`, so we anchor on the former and fall back to the
 * latter for resilience across builds.
 */
export class DashboardPage extends BasePage {
  private readonly sideNav = () =>
    this.page
      .getByRole('complementary')
      .or(this.page.getByRole('navigation'));

  /** Asserts the dashboard shell is rendered AND we are no longer on `/login`. */
  async assertLoaded() {
    await expect(this.sideNav()).toBeVisible({ timeout: 20_000 });
    await expect(this.page).not.toHaveURL(/\/login/);
  }

  /** Asserts an authenticated landmark (sidebar) is visible. */
  async assertUserLoggedIn() {
    await expect(this.sideNav()).toBeVisible();
  }
}
