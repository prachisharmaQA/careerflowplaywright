# CareerFlow Playwright Test Suite

End-to-end UI automation for [app.careerflow.ai](https://app.careerflow.ai), written in **TypeScript** on top of **Playwright** and organised around the **Page Object Model (POM)**.

The suite intentionally focuses on the two flows that have the highest user impact — **authentication** and the **Job Tracker** (CRUD on Kanban cards). A failure in either of these is immediately visible to real users and erodes trust in the product.

---

## Table of contents

- [What's covered](#whats-covered)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the tests](#running-the-tests)
- [Authentication strategy](#authentication-strategy)
- [Retries, traces, and reports](#retries-traces-and-reports)
- [Page Object Model — design notes](#page-object-model--design-notes)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## What's covered

| Suite | File | Tests |
| --- | --- | --- |
| Auth setup | `tests/auth.setup.ts` | Logs in once and persists session state for the rest of the suite. |
| Login | `tests/login.spec.ts` | (1) Happy path — valid credentials redirect to the dashboard.<br>(2) Unregistered email shows the "User not found" toast. |
| Job Tracker | `tests/jobTracker.spec.ts` | (1) Board structure — columns + Add Job CTA visible.<br>(2) Add a job (required fields only).<br>(3) Add a job with all fields populated — parametrised across every Section.<br>(4) Delete jobs via Job Details → Delete → confirm OK. |

---

## Tech stack

- **Playwright** (`@playwright/test`) — browser automation, retries, reporters, traces
- **TypeScript** — type-safe POMs and fixtures
- **dotenv** — loads credentials from `.env`
- **Node.js 18+**

---

## Repository layout

```
.
├── pages/                  # Page Object Models — selectors and actions live here, never in specs
│   ├── BasePage.ts         # Shared primitives: goto, assertUrlContains
│   ├── DashboardPage.ts    # Post-login landmark assertions
│   ├── LoginPage.ts        # /login interactions + a11y-live-region error reading
│   └── JobTrackerPage.ts   # /board Kanban: add, delete, column assertions
├── tests/
│   ├── auth.setup.ts       # Setup project — saves storage state to .auth/user.json
│   ├── login.spec.ts
│   └── jobTracker.spec.ts
├── utils/
│   └── testData.ts         # Fixtures, env-backed credentials, product strings, factories
├── .auth/                  # Generated — storage state (DO NOT commit)
├── .env                    # Local credentials (DO NOT commit)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

- **Node.js 18 or newer** (LTS recommended). Verify with `node --version`.
- A working **CareerFlow account** for the auth-dependent tests.
- For the Add-Job tests to succeed end-to-end, the account should have **fewer than 10 jobs on the board** — the CareerFlow free tier caps at 10. The suite detects this and fails with a clear, actionable error (see [Known limitations](#known-limitations)).

---

## Setup

### 1. Clone

```bash
git clone https://github.com/prachisharmaQA/careerflowplaywright.git
cd careerflowplaywright
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install --with-deps chromium
```

### 4. Configure credentials

Create a `.env` file at the repo root:

```env
BASE_URL=https://app.careerflow.ai

# Account used by auth.setup.ts to log in once for the whole suite.
CF_EMAIL=your-account@example.com
CF_PASSWORD=your-password
```

> **Security note**: `.env` and `.auth/user.json` contain live secrets. They are listed in `.gitignore` — **never commit them**. If they have been pushed in the past, rotate the password and clear them from the git history before sharing the repo publicly.

### 5. Verify the setup

```bash
npm run typecheck   # TypeScript compiles cleanly
npm test            # Full suite runs
```

---

## Running the tests

| Command | Description |
| --- | --- |
| `npm test` | Full suite, headless. |
| `npm run test:headed` | Full suite with the browser visible. |
| `npm run test:debug` | Open the Playwright Inspector and step through. |
| `npm run test:login` | Just the login spec. |
| `npm run test:jobtracker` | Just the Job Tracker spec. |
| `npm run report` | Open the HTML report from the last run. |
| `npm run typecheck` | TypeScript compile check (no emit). |

Useful Playwright flags:

```bash
# Run a single test by name
npx playwright test -g "should add a new job"

# Run a single file
npx playwright test tests/login.spec.ts

# Disable retries for a faster local feedback loop
npx playwright test --retries=0

# Get a UI runner with time-travel debugging
npx playwright test --ui
```

---

## Authentication strategy

The `setup` project (`tests/auth.setup.ts`) logs in **once** with the real credentials from `.env` and persists the browser's storage state to `.auth/user.json`. The `chromium` project depends on `setup` and loads that state via `storageState`, so every test starts authenticated — no per-test login overhead and no risk of rate-limiting CareerFlow.

The login spec is the exception: it explicitly wipes that session via `LoginPage.resetAuthToLoginScreen()` in `beforeEach` so it can exercise the real login flow.

Reference: <https://playwright.dev/docs/auth>

---

## Retries, traces, and reports

`playwright.config.ts` is set to **`retries: 3`** — every failing test is retried up to 3 times before being reported as failed. On the **first retry**, Playwright captures:

- A **trace** (full DOM + network + screenshots at each step)
- A **video** of the entire run
- A **screenshot** at the point of failure

Open the HTML report after a run:

```bash
npm run report
```

Open a specific trace:

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

To override retries for one run:

```bash
npx playwright test --retries=0
npx playwright test --retries=1
```

## License & attribution

Authored by Prachi Sharma for the CareerFlow QA assignment. Built on Playwright and TypeScript.
