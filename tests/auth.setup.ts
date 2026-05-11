import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { LoginPage } from '../pages/LoginPage';
import { getExistingUser } from '../utils/testData';

/**
 * auth.setup.ts — logs in once with real credentials and saves the browser's
 * storage state to `.auth/user.json`. Test projects that declare
 * `dependencies: ['setup']` reuse this session instead of logging in again.
 *
 * Reference: https://playwright.dev/docs/auth
 */

const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const { email, password } = getExistingUser();
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login(email, password);

  // Wait for the auth redirect — robust alternative to a hardcoded sleep.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
