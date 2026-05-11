/**
 * login.spec.ts — Login page test suite.
 *
 * The `chromium` project loads `.auth/user.json` from `auth.setup.ts`, so every
 * test here begins authenticated. `resetAuthToLoginScreen()` wipes that
 * session in `beforeEach` so we can exercise the real login flow.
 *
 * COVERED:
 *   1. Happy path — valid credentials → dashboard redirect
 *   2. Unregistered email → "User not found" toast is announced
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import {
  ANY_NON_EMPTY_PASSWORD,
  LOGIN_USER_NOT_FOUND_MESSAGE,
  getExistingUser,
  unregisteredLoginEmail,
} from '../utils/testData';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.resetAuthToLoginScreen();
    await loginPage.assertLoginPageLoaded();
  });

  // ── 1. Happy path ──────────────────────────────────────────────────────────
  test('should login with valid credentials and redirect to dashboard', async ({
    page,
  }) => {
    const { email, password } = getExistingUser();
    await loginPage.login(email, password);

    // Wait for the auth redirect away from /login.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    const dashboard = new DashboardPage(page);
    await dashboard.assertLoaded();
    await dashboard.assertUserLoggedIn();
  });

  // ── 2. Unregistered email → "User not found" toast ────────────────────────
  test('should show user-not-found message for an unregistered email', async () => {
    // Fixed strings like `test@gmail.com` may already be registered → CareerFlow
    // would respond with "Incorrect password…" instead. Use a unique address.
    await loginPage.login(unregisteredLoginEmail(), ANY_NON_EMPTY_PASSWORD);

    await loginPage.assertErrorVisible(LOGIN_USER_NOT_FOUND_MESSAGE);
    await loginPage.assertUrlContains('/login');
  });
});
