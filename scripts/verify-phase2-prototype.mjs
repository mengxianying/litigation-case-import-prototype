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

assert.ok(batchHtml.includes('>案件结果</th>'), '案件结果应合并展示，避免拆分三列');
assert.ok(batchHtml.includes('>材料处理</th>'), '材料状态应明确为材料处理结果');
assert.ok(batchHtml.includes('>导入状态</th>'), '批次任务状态应统一命名为导入状态');
assert.ok(!batchHtml.includes('<th>已生效</th><th>待材料激活</th><th>导入失败</th>'), '不应保留三列并列的案件状态');

console.log('phase2 prototype checks passed');
