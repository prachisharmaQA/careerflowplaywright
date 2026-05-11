import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage — interactions on `/login`.
 *
 * Selectors stay private; specs interact through the high-level helpers below.
 */
export class LoginPage extends BasePage {
  // ── Locators ──────────────────────────────────────────────────────────────

  private readonly emailInput = () =>
    this.page.getByRole('textbox', { name: /email/i });

  private readonly passwordInput = () =>
    this.page.getByRole('textbox', { name: /password/i });

  private readonly loginButton = () =>
    this.page.getByRole('button', { name: /^Login$/i });

  /**
   * CareerFlow announces auth toasts here with `role="status"` and zero-size
   * overflow — `getByRole('alert')` / `toBeVisible()` cannot see them, so we
   * read `textContent` directly via this locator.
   */
  private readonly a11yMessageLiveRegion = () =>
    this.page.locator('#a11y-message-live-region');

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigate() {
    await this.goto('/login');
    await expect(this.loginButton()).toBeVisible({ timeout: 20_000 });
  }

  /**
   * Clears cookies + web storage and reopens `/login`.
   * Use when the default `storageState` (from auth.setup) is loaded but the
   * test must start logged out.
   */
  async resetAuthToLoginScreen() {
    await this.goto('/');
    await this.page.context().clearCookies();
    // String form: tsconfig has no "DOM" lib, so browser globals are not typed.
    await this.page.evaluate(
      'try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}',
    );
    await this.navigate();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Submits the login form. Does NOT assert post-login state — caller's job. */
  async login(email: string, password: string) {
    const emailField = this.emailInput();
    await emailField.fill(email);
    // Guards against masked/disabled inputs silently swallowing the value.
    await expect(emailField).toHaveValue(email);
    await this.passwordInput().fill(password);
    await this.loginButton().click();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async assertLoginPageLoaded() {
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.loginButton()).toBeVisible();
  }

  /**
   * Polls the a11y live region (with a `role="alert"` fallback) for the
   * expected text. Accepts a plain string (matched case-insensitively) or a
   * RegExp for full control.
   */
  async assertErrorVisible(expectedText: string | RegExp) {
    const pattern =
      expectedText instanceof RegExp
        ? expectedText
        : new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    await expect
      .poll(
        async () => {
          const live = (await this.a11yMessageLiveRegion().textContent())?.trim() ?? '';
          if (pattern.test(live)) return live;
          const alert = this.page.getByRole('alert');
          if (await alert.isVisible().catch(() => false)) {
            return (await alert.textContent())?.trim() ?? '';
          }
          return live;
        },
        { timeout: 15_000 },
      )
      .toMatch(pattern);
  }
}
