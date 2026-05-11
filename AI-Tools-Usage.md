# AI-Assisted QA Workflow

## 1. AI Tools Used
The following AI tools were used during this QA assignment:

| Tool | Primary Use | How Applied |
| --- | --- | --- |
| Claude (Anthropic) | Test case generation, coverage analysis | Prompted with feature requirements and iterated on output |
| GitHub Copilot | Playwright test code completion and assertion suggestions | Used inline in VS Code while writing test scripts |

Both tools were used in complementary ways: Claude handled high-level reasoning tasks such as test case ideation, coverage analysis, and structured documentation, while GitHub Copilot accelerated the mechanical parts of writing Playwright test scripts by completing repetitive patterns and suggesting assertion syntax inline.

## 2. How AI Was Used — Specific Examples

### Reviewing Test Coverage Gaps
After the initial test case set was created, Claude was used to audit coverage against the feature requirements and identify gaps.

Prompt:

> "Review the existing test cases for the interview platform and identify any untested feature areas based on this requirement doc."

Claude identified 5 uncovered areas:

- No tests for PDF export or report download
- No tests for LinkedIn / social sharing
- No tests for hint or skip-question features
- No tests for STAR-format validation in behavioral interviews
- No test for new user with zero session history (empty-state)

## 3. Writing Playwright Test Assertions
GitHub Copilot was used inline in VS Code to auto-complete Playwright test skeletons. Claude was used to generate the full assertion logic and structure for the AI feedback tests.

AI also helped with reviewing the page DOM and choosing selectors:

- Copilot suggested locator patterns based on the active HTML structure and existing page object patterns.
- AI-assisted review made it easier to find stable selectors, such as data-testid attributes and visible text, rather than brittle XPath or class-based selectors.
- AI suggestions also encouraged consistent code formatting, which kept the test files readable and maintainable.

The example below covers three test cases in a single spec file:

> [Example placeholder for a spec file with three AI-assisted test cases]

## 4. Where AI Output Was Useful

The AI output was most valuable for:

- Speed of ideation — generating a broad, structured set of scenarios in minutes
- Consistency — all test cases followed the same column format (Scenario, Steps, Input, Pre-conditions, Expected Result)
- Coverage breadth — surfacing non-obvious edge cases such as audio with background noise, offline behaviour, and XSS input in the answer field

## 5. Reflection on AI-Assisted QA Workflows
Working with AI tools in this assignment reinforced a practical model for AI-assisted QA: AI handles volume and structure, humans handle correctness and context.

Specific takeaways:

- AI is fastest at generating a broad first draft — it is not a final output. Every generated test case required at least a read-through before being accepted.
- Prompting quality directly determines output quality. Vague prompts produced generic test cases; prompts that referenced specific feature behaviours (e.g., "test that feedback appears within 5 seconds") produced actionable, precise cases.
- AI tools do not self-audit for cross-context errors. The medical billing data incident showed that the model can silently mix unrelated content. A structured review checklist is necessary.
- Playwright code generation benefited most from Copilot for boilerplate (beforeEach hooks, selector patterns), and from Claude for assertion logic and timeout handling.
- AI helped review the page DOM and choose better selectors, which reduced test flakiness and made the automation easier to maintain.
- The combination of AI-generated test cases and AI-assisted Playwright scripting reduced the time to produce a full test plan from an estimated full day to approximately 3–4 hours, including review and correction time.

## Overall, AI-assisted QA does not replace domain expertise — it amplifies it. A QA engineer who understands the product can use AI to move faster, cover more ground, and produce more consistent documentation. The goal is fluency, not dependence.
