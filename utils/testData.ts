/**
 * testData.ts — single source of truth for fixtures and product strings.
 *
 * Anything that is "data" (credentials, messages, factories that produce test
 * fixtures) lives here so specs stay focused on flow and POMs stay focused on
 * locators / actions.
 */

import type { JobData, JobStatus } from '../pages/JobTrackerPage';

// ── Env-backed credentials ────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Set it in .env or your CI environment.`,
    );
  }
  return value;
}

/**
 * Loaded lazily so specs that don't perform authentication can still import
 * this module without forcing CF_EMAIL / CF_PASSWORD to be set.
 */
export function getExistingUser(): { email: string; password: string } {
  return {
    email: requireEnv('CF_EMAIL'),
    password: requireEnv('CF_PASSWORD'),
  };
}

// ── Login error messages ──────────────────────────────────────────────────

/** Toast text rendered in `#a11y-message-live-region` when the email is not registered. */
export const LOGIN_USER_NOT_FOUND_MESSAGE =
  'User not found! Please use the Sign Up option to create a new account.';

/** Unique email guaranteed not to exist in the system — used for the user-not-found path. */
export function unregisteredLoginEmail(): string {
  return `playwright-nouser-${Date.now()}@example.com`;
}

/** Any password works for the user-not-found path; this constant documents the intent. */
export const ANY_NON_EMPTY_PASSWORD = 'WrongPassword123!';

// ── Job Tracker fixtures ──────────────────────────────────────────────────

/** Sections exercised by the parametrized "add job with all fields" test. */
export const KANBAN_SECTIONS: readonly JobStatus[] = [
  'Saved',
  'Applied',
  'Interviewing',
  'Offer',
];

/** Columns asserted by the "board structure" test. */
export const KANBAN_COLUMNS_TO_VERIFY: readonly JobStatus[] = [
  'Saved',
  'Applied',
  'Interviewing',
];

/** Description text used by the basic Add-Job test. */
export const ADD_JOB_DEFAULT_DESCRIPTION = 'Added by Playwright';

/**
 * Minimal unique job fixture (company + role only). Useful when the test
 * only cares that a job was created — not which optional fields were filled.
 */
export function uniqueJob(base = 'TestCo'): Pick<JobData, 'company' | 'role'> {
  return {
    company: `${base}_${Date.now()}`,
    role: 'QA Automation Lead',
  };
}

/** Fully-populated job fixture for the parametrized "all fields" test. */
export function allFieldsJobFor(section: JobStatus): JobData {
  return {
    company: `Playwright_AllFields_${section}_${Date.now()}`,
    role: 'Senior QA Automation Engineer',
    url: 'https://example.com/jobs/playwright-qa',
    status: section,
    salary: '120,000',
    location: 'Remote, India',
    description: `Full-stack QA role added by Playwright suite — targeting "${section}" section.`,
  };
}

/**
 * Two unique job fixtures for the delete-job flow.
 *
 * Two `Date.now()` calls in the same tick can return the same value, producing
 * identical company strings — one locator would then match two cards and the
 * delete assertion would never reach zero. The `_0` / `_1` suffix prevents that.
 */
export function deleteJobsFixtures(): readonly JobData[] {
  const ts = Date.now();
  return [
    {
      company: `Playwright_Delete_${ts}_0`,
      role: 'QA Automation Lead',
      status: 'Applied',
    },
    {
      company: `Playwright_Delete_${ts}_1`,
      role: 'QA Automation Lead',
      status: 'Saved',
    },
  ];
}
