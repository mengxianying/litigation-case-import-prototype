# 订单多次导入状态机实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在二期原型中增加从一期存量到多次导入的订单最终状态机，明确最终状态、本次处理结果和页面统计的关系。

**Architecture:** 沿用现有 `stateMachine` 页面和静态 HTML/CSS 组件，不引入新依赖。状态机采用“双轨口径”：案件导入列表、订单结果和下载明细展示订单当前最终状态；批次处理记录展示每次上传的本次结果，失败尝试不得回退已成立的最终状态。

**Tech Stack:** 单文件 HTML/CSS、Node.js 静态断言校验。

---

### 任务一：补充状态机校验

**Files:**
- Modify: `scripts/verify-phase2-prototype.mjs`

- [x] **步骤一：新增失败断言**

校验状态机必须包含“双轨状态”“一期字段成功/失败”“仅补 Excel 转待材料激活”“已流转重复跳过”“批次处理记录”和“按最终状态去重统计”等关键口径。

- [x] **步骤二：运行校验并确认失败**

Run: `/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/verify-phase2-prototype.mjs`

Expected: FAIL，提示缺少订单多次导入最终状态机。

### 任务二：实现订单多次导入状态机

**Files:**
- Modify: `index.html`

- [x] **步骤一：增加流程图样式**

新增状态轨道、判断节点、连接线、结果节点和页面回写说明样式，保持现有蓝灰色工作台风格和 4px 圆角。

- [x] **步骤二：增加状态机流程图**

流程覆盖：一期字段成功与失败、二期首次导入、原失败订单只补 Excel、待材料激活继续补材、同批次未流转覆盖、已流转重复跳过和跨批次阻断。

- [x] **步骤三：增加页面回写表**

明确订单结果页、案件导入列表、批次处理记录和下载明细分别展示最终状态还是本次处理结果。

### 任务三：同步需求说明与验证

**Files:**
- Modify: `docs/superpowers/specs/2026-07-19-case-import-phase2-design.md`
- Test: `scripts/verify-phase2-prototype.mjs`

- [x] **步骤一：同步双轨状态规则**

增加最终状态优先级、失败尝试不回退、只补 Excel 的状态、已流转订单重复跳过及统计去重口径。

- [x] **步骤二：运行完整验证**

Run: `/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/verify-phase2-prototype.mjs`

Expected: `phase2 prototype checks passed`

Run: `/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/verify-result-detail-consistency.mjs`

Expected: `result detail consistency check passed`

Run: `git diff --check`

Expected: 无输出，退出码为 0。
