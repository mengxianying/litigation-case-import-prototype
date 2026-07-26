import assert from 'node:assert/strict';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load('法诉案件导入_导入结果明细.xlsx'));
const result = await workbook.inspect({
  kind: 'table',
  range: "'导入结果明细'!H1:Q3",
  include: 'values',
  tableMaxRows: 3,
  tableMaxCols: 10
});
const rows = JSON.parse(result.ndjson).values;
assert.equal(rows[1][0], '导入成功', '普通成功订单的导入结果应为导入成功');
assert.equal(rows[1][1], '已生效', '普通成功订单应已生效');
assert.equal(rows[1][2], '材料齐全', '普通成功订单材料应齐全');
assert.equal(rows[1][7], '成功', '普通成功订单的处理结果应为成功');
assert.ok(rows[1].slice(4, 7).every(value => value == null || value === ''), '普通成功订单的失败分类、失败字段和字段值应为空');
console.log('success-order processing result check passed');
