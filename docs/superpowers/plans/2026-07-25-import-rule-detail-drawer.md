# 导入规则详情抽屉实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在二期“新建导入批次”中增加只读的导入规则详情抽屉，使运营可查看已选规则的模板、字段和材料要求。

**Architecture:** 在现有单页原型 `index.html` 内维护三套静态规则详情数据，以当前“导入规则”选择值为唯一数据源。规则详情使用一个右侧抽屉承载，切换规则后重新渲染摘要、字段、材料和模板下载链接；一期页面不挂载入口与抽屉交互。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript。

---

### Task 1: 增加抽屉样式与新建批次入口

**Files:**
- Modify: `index.html: CSS 区域`
- Modify: `index.html: #newImportFull 导入规则字段`
- Test: 浏览器中的二期“新建导入批次”页面

- [ ] **Step 1: 为规则详情抽屉编写页面验证点**

在浏览器打开二期“新建导入批次”，确认当前规则字段为“创新租赁通用规则”，且页面没有“查看规则详情”入口。记录入口位置应在规则说明下方，不影响债权接收主体字段的垂直对齐。

- [ ] **Step 2: 为抽屉和规则入口增加最小 HTML/CSS**

在导入规则字段的 `field-box` 内增加：

```html
<button id="viewRuleDetailBtn" class="text-link rule-detail-link" type="button" onclick="openRuleDetailDrawer()">查看规则详情</button>
```

在页面末尾 modal 区域新增：

```html
<div id="ruleDetailDrawer" class="rule-detail-drawer" aria-hidden="true">
  <div class="rule-detail-drawer__head">
    <div><b id="ruleDetailTitle">导入规则详情</b><span id="ruleDetailVersion"></span></div>
    <button class="text-link" type="button" onclick="closeRuleDetailDrawer()">关闭</button>
  </div>
  <div id="ruleDetailContent" class="rule-detail-drawer__body"></div>
  <div class="rule-detail-drawer__foot">
    <a id="ruleTemplateDownload" class="btn primary" href="./法诉案件导入_Excel模板及文件格式说明0702_最终版.xlsx" download>下载对应模板</a>
    <button type="button" onclick="closeRuleDetailDrawer()">关闭</button>
  </div>
</div>
```

抽屉固定在右侧，宽度 `560px`，正文可滚动，页头和页脚固定；不使用全屏遮罩，避免运营无法参照已填批次信息。

- [ ] **Step 3: 完成入口与布局验证**

检查入口位于“导入规则”说明下方，按钮文字不换行；抽屉关闭时不影响页面已填写的批次名称、债权出让主体和上传文件展示。

### Task 2: 增加规则详情数据与只读渲染

**Files:**
- Modify: `index.html: 现有脚本区，select 初始化与 modal 函数附近`
- Test: `node -e` 内嵌脚本语法校验

- [ ] **Step 1: 编写规则详情数据的预期结构**

为“创新租赁通用规则”“转转租赁规则”“人人租赁规则”各定义一份数据，包含：

```js
{
  assetOwner: '创新',
  businessType: '租赁',
  templateVersion: '0702最终版',
  updatedAt: '2026-07-25 10:00:00',
  fields: [
    { name: '订单编号', required: '必填', rule: '不可为空', example: '26012915050167612327', key: true },
    { name: '违约日', required: '必填', rule: '支持yyyy-MM-dd', example: '2026-05-06', key: true }
  ],
  materials: {
    first: [{ category: '订单信息', sourceName: '订单详情-账单', required: '必传', match: '精确' }],
    renewal: [{ category: '订单信息', sourceName: '订单详情-账单', required: '必传', match: '精确' }]
  }
}
```

字段数组中将 `key: true` 赋给必填或存在特殊格式校验的字段，以支持默认精简展示。

- [ ] **Step 2: 实现抽屉渲染函数**

新增 `openRuleDetailDrawer()`、`closeRuleDetailDrawer()`、`renderRuleDetail(ruleName)` 和 `setRuleMaterialTab(type)`。渲染内容按以下结构生成：

```html
<section class="rule-detail-section">规则摘要</section>
<section class="rule-detail-section">Excel字段要求</section>
<section class="rule-detail-section">材料要求</section>
```

字段要求默认渲染 `key: true` 字段并提供“查看全部字段 / 收起字段”；材料要求提供“首租订单 / 续租订单”两个页签。所有表格为只读文本，不生成编辑、删除、新增或检查重复按钮。

- [ ] **Step 3: 将规则选择与抽屉保持同步**

在现有 `setSelectValue(select, option)` 中，识别 `select` 位于 `#newImportFull` 的“导入规则”字段时：更新当前规则名称；如果抽屉已打开则调用 `renderRuleDetail(option)`；更新下载链接。未选规则时将入口置为禁用状态。

- [ ] **Step 4: 运行语法验证**

Run:

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].forEach(m=>new Function(m[1])); console.log('embedded scripts parse successfully');"
```

Expected: `embedded scripts parse successfully`

### Task 3: 更新右侧备注并完成交互走查

**Files:**
- Modify: `index.html: data-anno="newImportFull" 右侧备注区`
- Test: 二期“新建导入批次”页面

- [ ] **Step 1: 增加规则详情说明**

在“二期页面定位”备注中增加一条：选择规则后可查看只读规则详情和下载对应模板；规则详情包含字段要求、材料要求与规则版本，规则维护页面本期不做前端展示。

- [ ] **Step 2: 执行交互走查**

按以下场景验证：

1. 打开二期新建批次，点击“查看规则详情”，抽屉展示创新规则。
2. 在不关闭抽屉的情况下切换至“转转租赁规则”，摘要、字段、材料和模板下载链接更新为转转规则。
3. 切换材料页签，首租/续租内容切换，字段列表不变化。
4. 关闭抽屉后，规则选择和其它表单内容保持不变。
5. 切换到一期“新建导入批次”，确认不显示导入规则和规则详情入口。

- [ ] **Step 3: 完成最终验证**

Run:

```bash
node scripts/verify-phase2-prototype.mjs
git diff --check
```

Expected: 原型校验通过，且 `git diff --check` 无输出。
