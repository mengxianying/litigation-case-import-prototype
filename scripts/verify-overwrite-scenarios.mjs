import assert from 'node:assert/strict';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load('法诉案件导入_导入结果明细.xlsx'));
const result = await workbook.inspect({
  kind: 'table',
  range: "'导入结果明细'!A15:Q18",
  include: 'values',
  tableMaxRows: 4,
  tableMaxCols: 17
});
const rows = JSON.parse(result.ndjson).values;
assert.deepEqual(rows.map(row => row[7]), ['导入成功', '导入失败', '导入成功', '导入成功']);
assert.match(rows[0][14], /^同批次覆盖成功：/, '同批次覆盖成功应展示处理结果');
assert.equal(rows[0][11], null, '同批次覆盖成功的失败分类应为空');
assert.match(rows[2][14], /^强制覆盖成功：/, '强制覆盖成功应展示处理结果');
assert.equal(rows[2][11], null, '强制覆盖成功的失败分类应为空');
assert.match(rows[3][14], /^主子订单更新成功：/, '主子订单更新成功应展示处理结果');
assert.equal(rows[3][11], null, '主子订单更新成功的失败分类应为空');
assert.equal(rows[1][11], '重复订单', '重复跳过应归类为重复订单');
assert.equal(rows[1][14], '重复跳过：该订单已分配或已流转，不可覆盖。', '重复跳过应展示不可覆盖原因');
console.log('overwrite scenarios check passed');
