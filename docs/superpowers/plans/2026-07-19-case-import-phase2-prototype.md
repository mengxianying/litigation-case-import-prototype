# 案件导入二期原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将案件导入原型升级为二期目标态，形成“字段通过 → 待材料激活/已生效 → 补传复核 → 自动生效”的材料处理闭环，并保持一期历史批次不回溯失效。

**Architecture:** 原型继续由单页 HTML 承载，二期页面使用现有 `taskFull`、`newImportFull`、`detail`、`ruleConfig`、`newRule` 区块。通过明确的状态标签、列表页签、统计卡与弹窗文案表达业务规则；右侧 `anno-page` 与状态机页同步展示取数、按钮限制、一期兼容及异常口径。源原型与 GitHub 在线副本保持字节一致。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Node.js 结构校验、浏览器手工交互核验。

---

### Task 1: 建立二期原型结构校验

**Files:**
- Create: `outputs/github_publish_work/scripts/verify-phase2-prototype.mjs`
- Test: `outputs/github_publish_work/scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 编写会失败的结构校验**

```js
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const text of ['待材料激活', '未校验（一期导入）', '规则快照', '待补传材料清单', '未匹配材料池']) {
  assert.ok(html.includes(text), `缺少二期关键口径：${text}`);
}
console.log('phase2 prototype checks passed');
```

- [ ] **Step 2: 运行校验并确认当前失败**

Run: `node scripts/verify-phase2-prototype.mjs`

Expected: FAIL，提示至少一个尚未写入的二期关键口径。

- [ ] **Step 3: 保留此校验作为回归检查**

将脚本保留在仓库，不引入额外依赖；后续每次更新二期页面都运行该脚本。

- [ ] **Step 4: 提交**

```bash
git add scripts/verify-phase2-prototype.mjs
git commit -m "test: 增加二期原型结构校验"
```

### Task 2: 更新二期案件导入管理与新建导入批次

**Files:**
- Modify: `outputs/case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html:656-728`
- Modify: `outputs/github_publish_work/index.html:656-728`
- Test: `outputs/github_publish_work/scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 在二期批次列表增加案件激活和材料状态汇总**

将当前统计卡和表头中的“待处理”拆成“待材料激活”和“材料待补”，并保留“导入失败”。示例状态采用：

```html
<div class="summary compact">
  <div class="card">已生效<b>1,632</b></div>
  <div class="card">待材料激活<b>18</b></div>
  <div class="card">材料待补<b>4</b></div>
  <div class="card">导入失败<b>12</b></div>
</div>
```

列表增加“案件生效情况”“材料状态”两列，示例分别展示 `已生效`、`待材料激活`、`未校验（一期导入）`，并将详情入口统一命名为“导入处理详情”。

- [ ] **Step 2: 修订二期新建批次的提交说明与规则条**

替换“必填材料缺失按导入失败处理”的旧文案，使用：

```html
<div class="rule-item"><b>材料和合同</b><span>缺必填材料的订单创建为待材料激活；补齐并复核通过后自动生效。缺非必填材料仅标记材料待补，不影响案件进入待委外。</span></div>
```

补充规则快照说明：提交时固化字段与材料规则，后续规则变更不影响该批次。

- [ ] **Step 3: 同步源原型到在线副本**

```bash
cp "../case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html" index.html
```

在同步前后使用 `shasum -a 256` 确认两份文件一致。

- [ ] **Step 4: 运行结构校验**

Run: `node scripts/verify-phase2-prototype.mjs`

Expected: PASS，输出 `phase2 prototype checks passed`。

- [ ] **Step 5: 提交**

```bash
git add index.html
git commit -m "feat: 补充二期案件激活状态"
```

### Task 3: 收敛导入处理详情和材料补传闭环

**Files:**
- Modify: `outputs/case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html:729-803`
- Modify: `outputs/github_publish_work/index.html:729-803`
- Test: `outputs/github_publish_work/scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 将处理详情固定为三类页面页签**

页签名称和职责固定为：

```html
<button class="active" data-supp-tab="orders">订单处理</button>
<button data-supp-tab="missing">待补传材料</button>
<button data-supp-tab="unmatched">未匹配材料</button>
```

订单处理只承接字段、主续关系、重复订单和落库失败；待补传材料只承接已识别订单的材料缺失；未匹配材料只承接无订单归属或无类别归属的文件。

- [ ] **Step 2: 更新批量补传弹窗的可上传范围与处理结果**

在弹窗和右侧备注中写明：待材料激活订单允许补当前规则缺失的必填与非必填材料；已生效订单仅补非必填材料；材料补齐后系统重新解析并复核，必填材料齐全时自动从待材料激活变为已生效。删除“人工绑定订单”“单个文件上传”入口，只保留查看/下载和重新识别。

- [ ] **Step 3: 增加材料状态示例数据**

在待补传材料列表中至少包含：

```html
<span class="tag warn">待材料激活</span>
<span class="tag ok">已生效</span>
<span class="tag info">必填材料缺失</span>
<span class="tag gray">非必填材料待补</span>
```

并在示例说明中明确“必填缺失不等于导入失败”。

- [ ] **Step 4: 运行结构校验**

Run: `node scripts/verify-phase2-prototype.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add index.html
git commit -m "feat: 完善二期材料处理闭环"
```

### Task 4: 更新规则配置、状态机和右侧备注

**Files:**
- Modify: `outputs/case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html:370-643`
- Modify: `outputs/case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html:804-835`
- Modify: `outputs/case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html:892-1164`
- Modify: `outputs/github_publish_work/index.html`
- Test: `outputs/github_publish_work/scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 统一规则配置为 70 列和规则快照口径**

将所有“67列”替换为“70列”。字段配置备注新增“订单编号、姓名、身份证号、债权金额、违约日为锁定必填”的说明；材料规则备注明确首租/续租仅切换材料规则、Excel 字段共用一套配置；已提交批次读取规则快照。

- [ ] **Step 2: 在状态机中新增两条二期订单状态**

```html
<tr><td>导入处理详情</td><td>二期案件状态</td><td><span class="tag warn">待材料激活</span></td><td>字段校验通过但缺必填材料</td><td>补齐并复核后自动变为已生效，期间不进入待委外</td></tr>
<tr><td>导入处理详情</td><td>二期材料状态</td><td><span class="tag gray">未校验（一期导入）</span></td><td>一期历史已生效批次</td><td>保持已生效，不生成材料待补任务</td></tr>
```

- [ ] **Step 3: 重写二期页面右侧备注**

每个二期页面使用 `【二期调整】` 开头，并至少包含：筛选/列表取数逻辑、状态判定、按钮权限、处理结果、一期历史兼容。避免继续保留“必填材料缺失时订单导入失败”“一期材料状态影响案件生效”等旧口径。

- [ ] **Step 4: 运行结构校验**

Run: `node scripts/verify-phase2-prototype.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add index.html
git commit -m "docs: 明确二期规则与一期兼容口径"
```

### Task 5: 验证、同步与交付

**Files:**
- Modify: `outputs/github_publish_work/index.html`
- Test: `outputs/github_publish_work/scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 执行自动校验与源文件一致性校验**

Run:

```bash
node scripts/verify-phase2-prototype.mjs
shasum -a 256 index.html "../case_import_modao_0610/法诉案件导入_墨刀宽屏批注版_最新修改版.html"
```

Expected: 结构校验通过，两份 HTML 的 SHA-256 值相同。

- [ ] **Step 2: 浏览器手工验证**

验证二期案件导入管理、二期新建导入批次、导入处理详情、导入规则配置、新建导入规则和状态机页。确认菜单跳转、页签切换、批量补传弹窗、查看/下载文件、保存草稿、导入提示均可正常使用；确认待材料激活和一期未校验状态不会被误展示为导入失败。

- [ ] **Step 3: 提交最终变更**

```bash
git add index.html scripts/verify-phase2-prototype.mjs
git commit -m "feat: 完成案件导入二期原型升级"
```

## 自检结论

设计说明中的案件激活、一期兼容、规则快照、三类处理页签、主续订单口径和备注要求均有对应任务。计划未使用 TBD、TODO 或“后续处理”等占位语；二期状态统一为“已生效 / 待材料激活 / 导入失败”，材料状态统一为“未校验（一期导入）/ 材料齐全 / 待补必填材料 / 材料待补 / 未匹配材料”。
