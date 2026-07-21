import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const requiredTerms = [
  '待材料激活',
  '待初始化（一期）',
  '规则快照',
  '待补传材料',
  '未匹配材料',
];

for (const term of requiredTerms) {
  assert.ok(html.includes(term), `缺少二期关键口径：${term}`);
}

const batchManagement = html.match(/<section id="taskFull"[\s\S]*?<section id="newImportFull"/);
assert.ok(batchManagement, '缺少二期案件导入管理页面');
const batchHtml = batchManagement[0];

assert.ok(batchHtml.includes('<th colspan="3">案件结果</th>'), '案件结果应使用分组表头明确三类数量的归属');
assert.ok(batchHtml.includes('>材料处理</th>'), '材料状态应明确为材料处理结果');
assert.ok(batchHtml.includes('>导入状态</th>'), '批次任务状态应统一命名为导入状态');
assert.ok(/<th[^>]*>已生效<\/th><th[^>]*>待补必填<\/th><th[^>]*>导入失败<\/th>/.test(batchHtml), '案件结果应列明已生效、待补必填和导入失败');
assert.ok(!batchHtml.includes('class="case-result compact"'), '案件结果不应使用混合语义的单行摘要');

console.log('phase2 prototype checks passed');
