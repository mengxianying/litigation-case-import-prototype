# 一期历史案件材料补齐兼容 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为一期已生效历史案件补齐二期材料包上传、材料解析与导出资格能力，同时确保材料缺失不会撤销案件生效或中断既有法诉流程。

**Architecture:** 历史案件与二期新批次共用材料规则、材料包解析和导入处理详情，但首次补充时独立确认适用规则并保存历史补材料规则快照。案件状态固定保持已生效；历史材料状态和导出资格作为独立维度驱动“补充历史材料”及导出按钮。

**Tech Stack:** 静态 HTML、CSS、原生 JavaScript、Node.js 结构校验、`@oai/artifact-tool` 生成 Excel 与图片版。

---

### Task 1: 扩展历史材料兼容回归校验

**Files:**
- Modify: `scripts/verify-phase2-prototype.mjs`
- Test: `scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 增加会失败的历史材料口径断言**

```js
for (const term of ['补充历史材料', '待初始化', '待补历史材料', '历史补材料规则快照', '导出资格', '可导出法诉材料']) {
  assert.ok(html.includes(term), `缺少历史材料兼容口径：${term}`);
}
```

- [ ] **Step 2: 运行校验确认失败**

Run: `node scripts/verify-phase2-prototype.mjs`

Expected: FAIL，提示缺少“补充历史材料”或其他新增口径。

- [ ] **Step 3: 保留断言并提交**

```bash
git add scripts/verify-phase2-prototype.mjs
git commit -m "test: 校验历史材料兼容口径"
```

### Task 2: 补充原型中的历史材料入口、状态和导出资格

**Files:**
- Modify: `index.html:656-804`
- Modify: `index.html:804-845`
- Modify: `index.html:892-1170`
- Modify: `index.html:1389-1575`
- Modify: `index.html:2640-2765`
- Test: `scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 在二期案件导入管理增加一期历史批次示例与列口径**

新增“历史材料状态”“导出资格”列，示例历史批次使用：

```html
<span class="tag gray">待初始化</span>
<span class="tag bad">不可导出</span>
<button class="text-link" onclick="openHistoricalMaterialFlow('DR202605080001')">补充历史材料</button>
```

历史批次案件生效情况固定为已生效；“待初始化”不计入材料待补任务数。

- [ ] **Step 2: 增加“补充历史材料”弹窗与规则快照确认交互**

弹窗默认展示当前批次的外部资产方、业务类型，并提供当前可用导入规则下拉。确认时保存历史补材料规则快照，更新材料状态为“待补历史材料”，进入导入处理详情的待补传材料页签。

```js
function confirmHistoricalMaterialRule() {
  document.getElementById('historyMaterialStatus').innerText = '待补历史材料';
  document.getElementById('historyExportStatus').innerText = '不可导出';
  showToast('已保存历史补材料规则快照，请上传材料包');
  goSupplementForBatch();
}
```

- [ ] **Step 3: 在导入处理详情区分历史材料场景**

历史批次展示“材料来源：一期历史导入”“历史补材料规则快照”，并提供：

```html
<button class="primary" onclick="openHistoricalMaterialModal()">补充历史材料</button>
<button onclick="showHistoricalExportMessage('要素表')">导出要素表</button>
<button onclick="showHistoricalExportMessage('法诉材料')">导出法诉材料</button>
```

必填材料未齐全时，导出按钮提示“当前批次仍缺必填材料，完成解析后可导出{类型}”；必填材料解析通过时，按钮提示已生成对应文件。非必填材料缺失不影响导出。

- [ ] **Step 4: 更新状态机和右侧备注**

新增历史材料状态流转：

```html
<tr><td>导入处理详情</td><td>一期历史材料状态</td><td>待初始化</td><td>首次未发起补充历史材料</td><td>补充历史材料：确认规则快照后变为待补历史材料</td></tr>
<tr><td>导入处理详情</td><td>一期历史材料状态</td><td>待补历史材料</td><td>缺失必填材料</td><td>案件保持已生效；材料解析通过后开放导出</td></tr>
```

每页备注明确：历史材料不影响案件生效与法诉流转；导出资格取规则快照下的必填材料解析结果。

- [ ] **Step 5: 运行校验并提交**

Run: `node scripts/verify-phase2-prototype.mjs`

Expected: PASS，输出 `phase2 prototype checks passed`。

```bash
git add index.html scripts/verify-phase2-prototype.mjs
git commit -m "feat: 支持一期历史案件补充材料和导出"
```

### Task 3: 更新 Excel 与图片版交付

**Files:**
- Modify: `/private/tmp/case_import_phase2_build/build_phase2_deliverables.mjs`
- Modify: `outputs/case_import_phase2_delivery_0719/案件导入二期设计说明.xlsx`
- Modify: `outputs/case_import_phase2_delivery_0719/案件导入二期设计说明_图片版.zip`

- [ ] **Step 1: 更新交付内容的历史材料状态和导出资格**

在“核心状态”“页面与交互”“备注要求”“验收标准”中加入待初始化、待补历史材料、历史补材料规则快照、材料包上传和导出资格规则。

- [ ] **Step 2: 重新生成工作簿和 6 张图片**

Run:

```bash
<bundled-node> build_phase2_deliverables.mjs
zip -r "案件导入二期设计说明_图片版.zip" "案件导入二期设计说明_图片版"
```

Expected: 生成一个 `.xlsx` 和包含 6 张 PNG 的图片压缩包。

- [ ] **Step 3: 验证交付**

检查“核心状态”表、图片总览页与验收页，确认不存在“历史批次不生成材料任务”“历史案件不支持导出”的旧口径；检查公式错误匹配结果为 0。

### Task 4: 最终验证与提交

**Files:**
- Modify: `index.html`
- Modify: `docs/superpowers/specs/2026-07-19-case-import-phase2-design.md`
- Test: `scripts/verify-phase2-prototype.mjs`

- [ ] **Step 1: 执行完整验证**

Run:

```bash
node scripts/verify-phase2-prototype.mjs
node --input-type=module -e "import {readFileSync} from 'node:fs'; const html=readFileSync('index.html','utf8'); [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].forEach((m)=>new Function(m[1])); console.log('inline scripts parse passed');"
git diff --check
```

Expected: 三条命令均成功；HTML 包含历史材料口径，内联脚本可解析，差异无空白错误。

- [ ] **Step 2: 提交最终变更**

```bash
git add index.html scripts/verify-phase2-prototype.mjs docs/superpowers/specs/2026-07-19-case-import-phase2-design.md
git commit -m "feat: 完善一期历史案件材料兼容"
```

## 自检结论

计划覆盖了历史批次按需初始化、规则快照、材料包上传、自动识别、导出资格、案件状态不回溯、原型备注和交付文件更新。历史案件的案件状态固定为已生效；只有材料状态和导出资格会随补充与解析结果变化。
