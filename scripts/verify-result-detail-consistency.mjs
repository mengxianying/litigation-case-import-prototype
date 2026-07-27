import assert from 'node:assert/strict';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load('法诉案件导入_导入结果明细.xlsx'));
const resultDetail = await workbook.inspect({
  kind: 'table',
  range: "'导入结果明细'!A1:Q18",
  include: 'values',
  tableMaxRows: 18,
  tableMaxCols: 17
});
const rows = JSON.parse(resultDetail.ndjson).values;

assert.equal(rows[0][7], '导入结果');
assert.equal(rows[0][14], '处理结果');
assert.ok(rows.slice(1).every(row => ['导入成功', '导入失败'].includes(row[7])), '导入结果只能为成功或失败');
assert.equal(rows[1][14], '成功');
assert.equal(rows[14][14], '同批次覆盖成功：使用后传Excel字段覆盖已有订单。');
assert.equal(rows[15][7], '导入失败');
assert.equal(rows[15][11], '重复订单');
assert.equal(rows[15][14], '重复跳过：该订单已分配或已流转，不可覆盖。');
assert.match(rows[16][14], /^主子订单更新成功/);
assert.equal(rows[12][11], '缺少必填材料');
assert.equal(rows[13][11], '缺少非必填材料');
assert.ok(rows[12][12] == null || rows[12][12] === '');
assert.ok(rows[12][13] == null || rows[12][13] === '');
assert.ok(rows[13][12] == null || rows[13][12] === '');
assert.ok(rows[13][13] == null || rows[13][13] === '');
assert.equal(rows[12][14], '字段校验通过，缺少必填材料：租赁服务合同。');
assert.equal(rows[13][14], '字段校验通过，缺少非必填材料：订单详情-物流。');
assert.equal(rows[17][4], '26012915050167612348', '同一订单多材料场景在导入结果明细中仍只保留一行订单记录');
assert.equal(rows[17][10], '租赁服务合同；租赁服务合同验签报告');
assert.ok(rows[17][12] == null || rows[17][12] === '');
assert.ok(rows[17][13] == null || rows[17][13] === '');
assert.equal(rows[17][14], '字段校验通过，缺少必填材料：租赁服务合同；租赁服务合同验签报告。');

for (const row of rows.slice(1)) {
  if (row[7] === '导入成功' && row[8] === '已生效' && row[9] === '材料齐全') {
    assert.ok(row.slice(11, 14).every(value => value == null || value === ''), '成功且材料齐全订单的失败相关列应为空');
  }
}

const failureDetail = await workbook.inspect({
  kind: 'table',
  range: "'失败分类说明'!A1:E16",
  include: 'values',
  tableMaxRows: 16,
  tableMaxCols: 5
});
const failureRows = JSON.parse(failureDetail.ndjson).values;
const failureText = failureRows.flat().filter(Boolean).join('\n');
assert.match(failureText, /同批次重复跳过/);
assert.match(failureText, /覆盖成功口径/);
assert.match(failureText, /主子订单更新成功/);
assert.match(failureText, /导入结果=导入成功/);

const missingMaterialDetail = await workbook.inspect({
  kind: 'table',
  range: "'待补材料明细'!A1:H7",
  include: 'values',
  tableMaxRows: 7,
  tableMaxCols: 8
});
const missingRows = JSON.parse(missingMaterialDetail.ndjson).values;
assert.deepEqual(missingRows[0], ['订单编号', '客户姓名', '标准材料类别', '缺失材料名称', '材料要求', '案件状态', '处理结果', '导入时间']);
assert.equal(missingRows.filter((row) => row[0] === '26012915050167612348').length, 3, '同一订单缺少多项材料时，待补材料明细应按材料展示多行');
assert.deepEqual(missingRows.filter((row) => row[0] === '26012915050167612348').map((row) => row[3]), ['租赁服务合同', '租赁服务合同验签报告', '订单详情-物流']);

console.log('result detail consistency check passed');
