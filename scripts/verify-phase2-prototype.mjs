import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const requiredTerms = [
  '待材料激活',
  '未校验（一期导入）',
  '规则快照',
  '待补传材料',
  '未匹配材料',
];

for (const term of requiredTerms) {
  assert.ok(html.includes(term), `缺少二期关键口径：${term}`);
}

console.log('phase2 prototype checks passed');
