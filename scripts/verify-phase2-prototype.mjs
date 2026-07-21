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
assert.ok(/<th[^>]*>已生效<\/th><th[^>]*>待材料激活<\/th><th[^>]*>导入失败<\/th>/.test(batchHtml), '案件结果应与详情案件状态统一为已生效、待材料激活和导入失败');
assert.ok(!batchHtml.includes('class="case-result compact"'), '案件结果不应使用混合语义的单行摘要');
assert.ok(html.includes('字段状态枚举'), '主列表右侧备注应列出状态枚举');

const importDetail = html.match(/<section id="detail"[\s\S]*?<section id="stateMachine"/);
assert.ok(importDetail, '缺少导入处理详情页面');
const detailHtml = importDetail[0];
assert.ok(detailHtml.includes('待材料激活'), '详情页案件状态应使用待材料激活');
assert.ok(detailHtml.includes('<span class="tag gray">未生成</span>'), '详情页导入失败订单应明确材料状态为未生成');

console.log('phase2 prototype checks passed');
