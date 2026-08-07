# SMS Content Error Result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the SMS import content-error state for a 5000-row upload with 4000 invalid rows and document the two-sheet error workbook.

**Architecture:** Keep the existing single-file prototype structure. Render a compact aggregate summary and fixed-size preview in `app.mjs`, add narrowly scoped styles in `styles.css`, and verify the visible contract through source-level Node tests before publishing the same assets to GitHub Pages.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner.

---

### Task 1: Lock the content-error interaction contract

**Files:**
- Modify: `debt_transfer_sms_notification_prototype/tests/model.test.mjs`

- [ ] **Step 1: Write the failing tests**

Add assertions for `5000` total rows, `1000` sendable rows, `4000` problem rows, an error distribution, a first-10 preview, the `下载错误明细` action, both workbook Sheet names, and all confirmed error scenarios.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/model.test.mjs`

Expected: the new content-error assertions fail because the current page still renders the three-row full-problem-list interaction.

- [ ] **Step 3: Keep the tests focused**

The tests must assert user-visible text and required CSS hooks without coupling to incidental markup ordering.

### Task 2: Implement the compact error result

**Files:**
- Modify: `debt_transfer_sms_notification_prototype/app.mjs`
- Modify: `debt_transfer_sms_notification_prototype/styles.css`
- Modify: `debt_transfer_sms_notification_prototype/index.html`

- [ ] **Step 1: Render the 5000-row scenario**

Change the content-error demo counts to 5000 total, 1000 sendable, and 4000 problem rows. Keep valid rows sendable.

- [ ] **Step 2: Replace the long-list action**

Render a compact error-type distribution, label the table as a first-10 preview, and replace `查看全部问题` with `下载错误明细`.

- [ ] **Step 3: Describe the workbook**

Add a download confirmation modal for `短信通知_导入错误明细.xlsx` with `错误数据明细` and `错误类型说明`. List the seven confirmed content-error scenarios in the second Sheet description.

- [ ] **Step 4: Update development notes**

Document preview limits, aggregation behavior, multi-error row expansion, workbook Sheet structure, and the rule that format errors do not create this workbook.

- [ ] **Step 5: Update the cache key**

Set both asset query strings in `index.html` to `20260807-content-error-excel`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test tests/model.test.mjs`

Expected: all tests pass with zero failures.

### Task 3: Publish and verify

**Files:**
- Modify: `github_publish_work/debt-transfer-sms-notification/app.mjs`
- Modify: `github_publish_work/debt-transfer-sms-notification/styles.css`
- Modify: `github_publish_work/debt-transfer-sms-notification/index.html`

- [ ] **Step 1: Sync only the three prototype assets**

Apply the exact source changes to the publishing copy and verify each pair with `cmp`.

- [ ] **Step 2: Run final verification**

Run: `node --test tests/model.test.mjs` and `node --check app.mjs` in the source prototype.

Expected: all tests pass and the syntax check exits with code 0.

- [ ] **Step 3: Commit and push**

Commit only the two design documents and three published prototype assets with message `feat: optimize sms content error results`, then push the current branch.

- [ ] **Step 4: Verify GitHub Pages**

Open `https://mengxianying.github.io/litigation-case-import-prototype/debt-transfer-sms-notification/?v=20260807-content-error-excel`, switch to the content-error demo, and confirm the summary, preview, download interaction, and right-side note.
