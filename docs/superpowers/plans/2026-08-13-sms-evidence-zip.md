# SMS Evidence ZIP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display recipient phone numbers in full and download one ZIP containing a real XLSX task list plus retained JPEG evidence screenshots.

**Architecture:** Keep selection/filter resolution in the existing model. Build the XLSX from a styled static workbook template in the browser, generate JPEG evidence images with Canvas, then package all files at the ZIP root with the vendored JSZip browser bundle.

**Tech Stack:** Plain browser JavaScript, JSZip, Canvas, `@oai/artifact-tool`, Node test runner.

---

### Task 1: Phone and evidence scope

**Files:**
- Modify: `debt-transfer-sms-notification/model.mjs`
- Modify: `debt-transfer-sms-notification/app.mjs`
- Test: source prototype `tests/model.test.mjs`

- [ ] Add failing tests for clear-text recipient phones and retained-success evidence filtering.
- [ ] Update task rows and spreadsheet data to use `phoneFull`.
- [ ] Restrict screenshots to `发送成功` plus `已留存`.
- [ ] Run the model tests.

### Task 2: Single ZIP download

**Files:**
- Create: `debt-transfer-sms-notification/vendor/jszip.min.js`
- Create: `debt-transfer-sms-notification/assets/短信通知任务列表模板.xlsx`
- Modify: `debt-transfer-sms-notification/index.html`
- Modify: `debt-transfer-sms-notification/app.mjs`

- [ ] Add failing tests for `短信通知证据.zip`, `短信通知任务列表.xlsx`, and no CSV download.
- [ ] Generate and visually verify the styled XLSX template with `@oai/artifact-tool`.
- [ ] Build dynamic worksheet XML, JPEG evidence images, and one ZIP in the browser.
- [ ] Update the confirmation modal and right-side development notes.
- [ ] Run syntax and full regression tests.

### Task 3: Publish

**Files:**
- Modify: `debt-transfer-sms-notification/index.html` cache version.

- [ ] Copy verified source files to the publishing repository.
- [ ] Commit only the SMS prototype files and this plan.
- [ ] Push `main` and verify the GitHub Pages URL responds successfully.
