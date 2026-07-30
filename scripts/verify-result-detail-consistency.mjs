import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath = '法诉案件导入_导入结果明细.xlsx';
const tableFiles = execFileSync('unzip', ['-Z1', workbookPath], { encoding: 'utf8' })
  .split('\n')
  .filter((name) => /^xl\/tables\/table\d+\.xml$/.test(name));
assert.ok(tableFiles.length > 0, '下载明细应包含Excel表格');
for (const tableFile of tableFiles) {
  const tableXml = execFileSync('unzip', ['-p', workbookPath, tableFile], { encoding: 'utf8' });
  assert.doesNotMatch(tableXml, /showRowStripes="1"/, `${tableFile} 不应启用灰白交替的带状行`);
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const resultDetail = await workbook.inspect({
  kind: 'table',
  range: "'导入结果明细'!A1:R18",
  include: 'values',
  tableMaxRows: 18,
  tableMaxCols: 18
});
const rows = JSON.parse(resultDetail.ndjson).values;

assert.equal(rows[0][7], '导入结果');
assert.equal(rows[0][14], '处理结果');
assert.equal(rows[0][17], '业务主体1');
assert.ok(rows.slice(1).every(row => ['雅安欣天下办公设备租赁有限公司', '雅安青年优品电子商务有限公司'].includes(row[17])), '导入结果明细应展示订单所属业务主体1');
assert.ok(rows.slice(1).every(row => ['导入成功', '导入失败'].includes(row[7])), '导入结果只能为成功或失败');
assert.ok(rows.slice(1).every(row => ['未生成', '材料齐全', '待补必填', '待补非必填'].includes(row[9])), '下载明细材料状态只能使用四种统一枚举');
assert.equal(rows[1][14], '成功');
assert.equal(rows[14][14], '同批次覆盖成功：使用后传Excel字段覆盖已有订单。');
assert.equal(rows[15][7], '导入成功');
assert.equal(rows[15][8], '已生效');
assert.equal(rows[15][9], '材料齐全');
assert.ok(rows[15].slice(11, 14).every(value => value == null || value === ''));
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
  range: "'失败分类说明'!A1:E17",
  include: 'values',
  tableMaxRows: 17,
  tableMaxCols: 5
});
const failureRows = JSON.parse(failureDetail.ndjson).values;
const failureText = failureRows.flat().filter(Boolean).join('\n');
assert.match(failureText, /同批次重复跳过/);
assert.match(failureText, /覆盖成功口径/);
assert.match(failureText, /主子订单更新成功/);
assert.match(failureText, /导入结果=导入成功/);
assert.match(failureText, /最终结果保留口径/);
assert.match(failureText, /本次Excel失败写入批次处理记录/);
assert.match(failureText, /同批次重复跳过：导入结果=导入成功/);

const scopeDetail = await workbook.inspect({
  kind: 'table',
  range: "'口径说明'!A1:F20",
  include: 'values',
  tableMaxRows: 20,
  tableMaxCols: 6
});
const scopeRows = JSON.parse(scopeDetail.ndjson).values;
const scopeText = scopeRows.flat().filter(Boolean).join('\n');
assert.match(scopeText, /材料包仅支持zip/i, '口径说明应明确材料包仅支持ZIP');
assert.doesNotMatch(scopeText, /rar|7z/i, '口径说明不应继续支持RAR或7Z');
assert.match(scopeText, /按订单当前最终结果导出/, '口径说明应明确下载明细按订单最终结果导出');
assert.match(scopeText, /待材料激活/, '口径说明应覆盖待材料激活订单的后续Excel失败场景');
assert.match(scopeText, /批次处理记录/, '口径说明应说明本次失败保留在批次处理记录中');
assert.match(scopeText, /未生成、材料齐全、待补必填、待补非必填四种状态/, '口径说明应列明四种材料状态');
assert.doesNotMatch(scopeText, /待初始化（一期）|材料处理中/, '口径说明不应保留已删除的材料状态');

const missingMaterialDetail = await workbook.inspect({
  kind: 'table',
  range: "'待补材料明细'!A1:I7",
  include: 'values',
  tableMaxRows: 7,
  tableMaxCols: 9
});
const missingRows = JSON.parse(missingMaterialDetail.ndjson).values;
assert.deepEqual(missingRows[0], ['订单编号', '客户姓名', '标准材料类别', '缺失材料名称', '材料要求', '案件状态', '处理结果', '导入时间', '业务主体1']);
assert.ok(missingRows.slice(1).every(row => ['雅安欣天下办公设备租赁有限公司', '雅安青年优品电子商务有限公司'].includes(row[8])), '待补材料明细应展示订单所属业务主体1');
assert.equal(missingRows.filter((row) => row[0] === '26012915050167612348').length, 3, '同一订单缺少多项材料时，待补材料明细应按材料展示多行');
assert.deepEqual(missingRows.filter((row) => row[0] === '26012915050167612348').map((row) => row[3]), ['租赁服务合同', '租赁服务合同验签报告', '订单详情-物流']);

console.log('result detail consistency check passed');
