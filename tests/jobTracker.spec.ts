/**
 * jobTracker.spec.ts — Job Tracker test suite.
 *
 * Tests run with a pre-authenticated session (from `auth.setup.ts`) so they
 * can focus entirely on Job Tracker behaviour.
 *
 * COVERED:
 *   1. Board structure — Kanban columns + Add Job CTA render on load
 *   2. Add a job (basic) — required fields → card appears on the board
 *   3. Add a job (all fields) — parametrized across every Section, with the
 *      card landing in the matching column
 *   4. Delete jobs — via Job Details modal + confirm OK (cleanup verified)
 */

import { test } from '@playwright/test';
import { JobTrackerPage } from '../pages/JobTrackerPage';
import {
  ADD_JOB_DEFAULT_DESCRIPTION,
  KANBAN_COLUMNS_TO_VERIFY,
  KANBAN_SECTIONS,
  allFieldsJobFor,
  deleteJobsFixtures,
  uniqueJob,
} from '../utils/testData';

test.describe('Job Tracker', () => {
  let jobTracker: JobTrackerPage;

  test.beforeEach(async ({ page }) => {
    jobTracker = new JobTrackerPage(page);
    await jobTracker.navigateToJobTracker();
  });

  // ── 1. Board structure ────────────────────────────────────────────────────
  test('should display Kanban columns and Add Job CTA on load', async () => {
    for (const column of KANBAN_COLUMNS_TO_VERIFY) {
      await jobTracker.assertColumnExists(column);
    }
    await jobTracker.assertAddJobButtonVisible();
  });

  // ── 2. Add a new job (required fields only) ──────────────────────────────
  test('should add a new job and show it on the board', async () => {
    const job = uniqueJob('Playwright_Add');

    await jobTracker.addJob({
      ...job,
      status: 'Applied',
      description: ADD_JOB_DEFAULT_DESCRIPTION,
    });

    await jobTracker.assertJobVisible(job.company);
  });

  // ── 3. Add a new job with ALL fields populated, one per Section ──────────
  for (const section of KANBAN_SECTIONS) {
    test(`should add a job with all fields populated to "${section}" section`, async () => {
      const jobData = allFieldsJobFor(section);

      await jobTracker.addJob(jobData);

      await jobTracker.assertJobInColumn(jobData.company, section);
    });
  }

  // ── 4. Delete jobs via Job Details → Delete → OK ─────────────────────────
  test('should delete jobs via Job Details modal and confirm OK', async () => {
    const jobs = deleteJobsFixtures();

    for (const job of jobs) {
      await jobTracker.addJob(job);
      await jobTracker.assertJobVisible(job.company);
    }

    for (const job of jobs) {
      await jobTracker.deleteJob(job.company);
      await jobTracker.assertJobNotVisible(job.company);
    }
  });
});
