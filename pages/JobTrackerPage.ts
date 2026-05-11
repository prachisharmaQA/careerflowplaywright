import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer';

export interface JobData {
  company: string;
  role: string;
  status?: JobStatus;
  url?: string;
  salary?: string;
  location?: string;
  description?: string;
}

/**
 * JobTrackerPage — covers the `/board` Kanban interactions.
 *
 * Public surface (only what the active tests need):
 *   • navigateToJobTracker / assertLoaded
 *   • addJob / deleteJob
 *   • assertJobVisible / assertJobNotVisible
 */
export class JobTrackerPage extends BasePage {
  // ── Board locators ────────────────────────────────────────────────────────

  private readonly addJobButton = () =>
    this.page.getByRole('button', { name: /add job|\+ job/i }).first();

  /**
   * Kanban card root — `role="button"` whose name includes title + company + date.
   * When `column` is provided, the search is scoped to that column container
   * so cards with the same company text in another column cannot match.
   */
  private jobCard(company: string, column?: JobStatus): Locator {
    const safe = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const scope = column ? this.columnFor(column) : this.page;
    return scope.getByRole('button', { name: new RegExp(safe) });
  }

  /** Heading element of a Kanban column. */
  private columnHeading(status: JobStatus): Locator {
    return this.page.getByRole('heading', {
      level: 2,
      name: new RegExp(`^${status}$`, 'i'),
    });
  }

  /** Column container — the closest section ancestor that holds the cards. */
  private columnFor(status: JobStatus): Locator {
    return this.columnHeading(status).locator(
      'xpath=ancestor::div[contains(@class,"container_section")][1]',
    );
  }

  // ── Add Job modal locators ────────────────────────────────────────────────

  /**
   * Scoped to the "Add Job" dialog specifically — otherwise it would also match
   * the Payment Plans / Job Details / delete-confirm dialogs and cause strict
   * mode violations or false "modal closed" assertions.
   */
  private readonly jobModal = () =>
    this.page.getByRole('dialog').filter({
      has: this.page.getByRole('heading', { name: /^Add Job$/i }),
    });

  private readonly companyInput = () =>
    this.jobModal().getByRole('textbox', { name: /company/i });

  private readonly roleInput = () =>
    this.jobModal().getByRole('textbox', { name: /role|position|title/i });

  private readonly locationInput = () =>
    this.jobModal().getByRole('textbox', { name: /location/i });

  private readonly jobUrlInput = () =>
    this.jobModal().getByRole('textbox', { name: /url|link/i });

  private readonly salaryInput = () =>
    this.jobModal().getByRole('textbox', { name: /salary/i });

  private readonly descriptionInput = () =>
    this.jobModal().getByRole('textbox', { name: /description|notes?/i });

  private readonly submitJobButton = () =>
    this.jobModal().getByRole('button', { name: /^Submit$/i });

  /**
   * Ant Design Section <Select>. The inner `[role=combobox]` lacks an accessible
   * name tied to "Section", so we scope by Form.Item and click the
   * `.ant-select-selector` div (the actual click surface — not a `<button>`).
   */
  private sectionSelectTrigger(): Locator {
    return this.jobModal()
      .locator('.ant-form-item')
      .filter({ hasText: /Section/i })
      .locator('.ant-select-selector');
  }

  // ── Delete-flow locators ──────────────────────────────────────────────────

  /** Dialog opened by clicking a card (distinct from the Add Job modal). */
  private jobDetailsDialog(): Locator {
    return this.page.getByRole('dialog').filter({
      has: this.page.getByRole('heading', { name: /^Job Details$/i }),
    });
  }

  /** Ant Design `Modal.confirm` — wording can vary slightly across builds. */
  private deleteConfirmDialog(): Locator {
    return this.page.getByRole('dialog').filter({
      hasText: /sure.*delete|delete this job/i,
    });
  }

  /** Upsell dialog the app opens when the free-tier 10-job cap is hit. */
  private paymentPlansDialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Payment Plans$/i });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigateToJobTracker() {
    await this.goto('/board');
    // A failed prior test can leave the Payment Plans upsell open — clear it
    // so subsequent interactions aren't blocked by the overlay.
    await this.dismissPaymentPlansIfOpen();
    await this.assertLoaded();
  }

  async assertLoaded() {
    await expect(this.addJobButton()).toBeVisible({ timeout: 20_000 });
    await this.assertUrlContains('/board');
  }

  // ── Job actions ───────────────────────────────────────────────────────────

  /** Fills and submits the Add Job form, asserting the modal closes on success. */
  async addJob(data: JobData) {
    await this.openAddJobModal();

    // Required fields — "Job Title" maps to role/title/position regex.
    await this.roleInput().fill(data.role);
    await expect(this.roleInput()).toHaveValue(data.role);

    await this.companyInput().fill(data.company);
    await expect(this.companyInput()).toHaveValue(data.company);

    // Optional fields — only fill when the value is provided AND the field is rendered.
    if (data.url) {
      const url = this.jobUrlInput();
      if (await url.isVisible().catch(() => false)) await url.fill(data.url);
    }
    if (data.status) {
      await this.selectSection(data.status);
    }
    if (data.salary) {
      const salary = this.salaryInput();
      if (await salary.isVisible().catch(() => false)) await salary.fill(data.salary);
    }
    if (data.location) {
      const loc = this.locationInput();
      if (await loc.isVisible().catch(() => false)) await loc.fill(data.location);
    }
    if (data.description) {
      const desc = this.descriptionInput();
      if (await desc.isVisible().catch(() => false)) await desc.fill(data.description);
    }

    await this.submitJobButton().click();

    // Free-tier guard: the app silently swaps Add Job for the Payment Plans
    // upsell when the 10-job cap is hit. Without this check, the Add Job
    // modal "closes" (our assertion passes), no card is created, and the
    // next `assertJobVisible` fails with a misleading "element not found".
    if (await this.paymentPlansDialog().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.dismissPaymentPlansIfOpen();
      throw new Error(
        'CareerFlow free-tier job limit reached (10 jobs max). ' +
          'Delete existing jobs on the account or run against a premium account.',
      );
    }

    await expect(this.jobModal()).not.toBeVisible({ timeout: 10_000 });
  }

  /**
   * Deletes a job via the Job Details dialog: open card → Delete → confirm OK.
   * Reloads the board as a defensive fallback if dnd/list reconciliation
   * leaves the card mounted after the success toast.
   */
  async deleteJob(company: string) {
    const card = this.jobCard(company);
    await expect(card).toBeVisible();
    await card.click();

    const details = this.jobDetailsDialog();
    await expect(details).toBeVisible({ timeout: 10_000 });
    await details.getByRole('button', { name: /^Delete$/i }).click();

    const confirm = this.deleteConfirmDialog();
    const okInConfirm = confirm.getByRole('button', { name: /^OK$/i });
    if (await okInConfirm.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await okInConfirm.click();
    } else {
      // Some builds render the confirm without `role="dialog"`.
      await this.page.getByRole('button', { name: /^OK$/i }).click();
    }

    await expect(confirm).not.toBeVisible({ timeout: 10_000 }).catch(() => {});
    await expect(details).not.toBeVisible({ timeout: 15_000 });

    try {
      await expect(this.jobCard(company)).toHaveCount(0, { timeout: 25_000 });
    } catch {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.assertLoaded();
      await expect(this.jobCard(company)).toHaveCount(0, { timeout: 15_000 });
    }
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async assertJobVisible(company: string) {
    await expect(this.jobCard(company)).toBeVisible();
  }

  async assertJobNotVisible(company: string) {
    await expect(this.jobCard(company)).toHaveCount(0, { timeout: 15_000 });
  }

  /** Asserts the card lives in the specified column (scoped by `columnFor`). */
  async assertJobInColumn(company: string, status: JobStatus) {
    await expect(this.jobCard(company, status)).toBeVisible();
  }

  /** Asserts the Kanban column heading exists (used by the board-structure test). */
  async assertColumnExists(status: JobStatus) {
    await expect(this.columnHeading(status)).toBeVisible();
  }

  /** Asserts the "Add Job" CTA is actionable. Public wrapper over the private locator. */
  async assertAddJobButtonVisible() {
    await expect(this.addJobButton()).toBeVisible();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  /** Opens the Add Job modal; idempotent so it never clicks through itself. */
  private async openAddJobModal() {
    const modal = this.jobModal();
    if (await modal.isVisible().catch(() => false)) {
      await expect(this.companyInput()).toBeVisible();
      return;
    }
    await this.addJobButton().click();
    await expect(modal).toBeVisible();
    await expect(this.companyInput()).toBeVisible();
  }

  /** Picks a value in the Ant Design Section dropdown. */
  private async selectSection(status: JobStatus) {
    const option = this.page.getByRole('option', { name: new RegExp(`^${status}$`, 'i') });
    await this.sectionSelectTrigger().click();
    await option.click();
  }

  /** Closes the Payment Plans upsell if it is showing. No-op otherwise. */
  private async dismissPaymentPlansIfOpen() {
    const dialog = this.paymentPlansDialog();
    if (!(await dialog.isVisible({ timeout: 1_000 }).catch(() => false))) return;
    await dialog.getByRole('button', { name: /^Close$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5_000 }).catch(() => {});
  }
}
