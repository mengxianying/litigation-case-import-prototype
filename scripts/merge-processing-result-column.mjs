import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import { writeFile } from 'node:fs/promises';

const file = '法诉案件导入_导入结果明细.xlsx';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
const resultSheet = workbook.worksheets.getItemAt(0);
const failureSheet = workbook.worksheets.getItemAt(1);
let missingMaterialSheet = workbook.worksheets.items.find((sheet) => sheet.name === '待补材料明细');
if (!missingMaterialSheet) {
  missingMaterialSheet = workbook.worksheets.add('待补材料明细');
}

const rows = [
  ['导入批次号', '批次名称', '外部资产方', '业务类型', '订单编号', '客户姓名', '身份证号', '导入结果', '案件状态', '材料状态', '待补材料', '失败分类', '失败字段', '字段值', '处理结果', '是否阻断导入', '导入时间'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612327', '张三', '420106199201018888', '导入成功', '已生效', '材料齐全', '-', '', '', '', '成功', '否', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612328', '李明', '420106199201019999', '导入失败', '导入失败', '未生成', '-', '基础必填缺失', '债权金额', '', '债权金额为必填字段，当前为空', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612329', '王磊', '42010619920101', '导入失败', '导入失败', '未生成', '-', '字段格式错误', '身份证号', '42010619920101', '身份证号字段格式错误', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612330', '黄丽', '420106199201017777', '导入失败', '导入失败', '未生成', '-', '金额异常', '债权金额', '-5999.00', '债权金额异常', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612331', '周强', '420106199201016666', '导入失败', '导入失败', '未生成', '-', '字段格式错误', '性别', '未知', '性别字段格式错误', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612332', '赵倩', '420106199201015555', '导入失败', '导入失败', '未生成', '-', '主续关系异常', '父订单编号', '26012915050167610001', '父订单编号不存在，且本批次未导入对应主订单', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612336', '孙悦', '420106199201010001', '导入失败', '导入失败', '未生成', '-', '主续关系异常', '身份证号', '420106199201010001', '父订单客户证件号与当前订单身份证号不一致，请核对父订单编号和身份证号后重新上传。', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612337', '郑楠', '420106199201010002', '导入失败', '导入失败', '未生成', '-', '基础必填缺失', '违约日', '', '续租订单违约日不能为空，请补充后重新上传。', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612333', '陈晨', '420106199201014444', '导入失败', '导入失败', '未生成', '-', '重复订单', '订单编号', '26012915050167612333', '该订单已在批次DR202606100001导入，本次不允许重复导入', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612340', '刘洋', '420106199201010003', '导入失败', '导入失败', '未生成', '-', '主续关系异常', '父订单编号', '26012915050167612327', '续租订单关联的主订单【26012915050167612327】已在法诉系统形成案件，不符合续租订单导入条件。', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612341', '林浩', '420106199201010004', '导入失败', '导入失败', '未生成', '-', '系统异常', '-', '-', '系统异常', '是', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612342', '孙悦', '420106199201010005', '导入成功', '待材料激活', '待补必填', '租赁服务合同', '缺少必填材料', '', '', '字段校验通过，缺少必填材料：租赁服务合同。', '否', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612343', '林浩', '420106199201010006', '导入成功', '已生效', '待补非必填', '订单详情-物流', '缺少非必填材料', '', '', '字段校验通过，缺少非必填材料：订单详情-物流。', '否', '2026-06-12 09:20:16'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612344', '许诺', '420106199201010007', '导入成功', '已生效', '材料齐全', '-', '', '', '', '同批次覆盖成功：使用后传Excel字段覆盖已有订单。', '否', '2026-06-12 10:05:18'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612345', '周薇', '420106199201010008', '导入失败', '已生效', '材料齐全', '-', '重复订单', '订单编号', '26012915050167612345', '重复跳过：该订单已分配或已流转，不可覆盖。', '否', '2026-06-12 10:06:42'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612347', '郑楠', '420106199201010010', '导入成功', '已生效', '材料齐全', '-', '', '', '', '主子订单更新成功：主订单和续租订单均已存在且未流转，已按本次Excel更新。', '否', '2026-06-12 10:10:34'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612348', '丁磊', '420106199201010011', '导入成功', '待材料激活', '待补必填', '租赁服务合同；租赁服务合同验签报告', '缺少必填材料', '', '', '字段校验通过，缺少必填材料：租赁服务合同；租赁服务合同验签报告。', '否', '2026-06-12 10:12:08']
];

resultSheet.getRange('A1:Q18').values = rows;
resultSheet.getRange('R1:R18').values = rows.map((row, index) => [index === 0 ? '业务主体1' : (index % 2 ? '雅安欣天下办公设备租赁有限公司' : '雅安青年优品电子商务有限公司')]);
const resultAll = resultSheet.getRange('A1:R18');
const resultBodyAll = resultSheet.getRange('A2:R18');
resultAll.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
resultBodyAll.format.font = { color: '#202B38' };
resultBodyAll.format.verticalAlignment = 'center';
resultBodyAll.format.wrapText = true;
resultBodyAll.format.rowHeight = 32;
resultSheet.getRange('H1:J1001').format.columnWidth = 14;
resultSheet.getRange('K1:K1001').format.columnWidth = 22;
resultSheet.getRange('L1:L1001').format.columnWidth = 16;
resultSheet.getRange('M1:M1001').format.columnWidth = 16;
resultSheet.getRange('O1:O1001').format.columnWidth = 48;
resultSheet.getRange('R1:R1001').format.columnWidth = 28;

// Keep the final four columns visually consistent with the existing result-detail table.
const resultHeader = resultSheet.getRange('N1:R1');
const resultBody = resultSheet.getRange('N2:R18');
resultHeader.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
resultHeader.format.fill = '#F2F4F7';
resultHeader.format.font = { bold: true, color: '#202B38' };
resultHeader.format.horizontalAlignment = 'center';
resultHeader.format.verticalAlignment = 'center';
resultHeader.format.wrapText = true;
resultHeader.format.rowHeight = 26;
resultBody.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
resultBody.format.font = { color: '#202B38' };
resultBody.format.verticalAlignment = 'center';
resultBody.format.wrapText = true;
resultBody.format.rowHeight = 32;

// Extend the Excel table to the appended overwrite and update examples.
resultSheet.tables.deleteAll();
const resultTable = resultSheet.tables.add('A1:R18', true);
resultTable.style = 'TableStyleLight1';

const missingMaterialRows = [
  ['订单编号', '客户姓名', '标准材料类别', '缺失材料名称', '材料要求', '案件状态', '处理结果', '导入时间'],
  ['26012915050167612342', '孙悦', '主合同', '租赁服务合同', '必填', '待材料激活', '缺少必填材料', '2026-06-12 09:20:16'],
  ['26012915050167612343', '林浩', '订单信息', '订单详情-物流', '非必填', '已生效', '缺少非必填材料', '2026-06-12 09:20:16'],
  ['26012915050167612348', '丁磊', '主合同', '租赁服务合同', '必填', '待材料激活', '缺少必填材料', '2026-06-12 10:12:08'],
  ['26012915050167612348', '丁磊', '主合同', '租赁服务合同验签报告', '必填', '待材料激活', '缺少必填材料', '2026-06-12 10:12:08'],
  ['26012915050167612348', '丁磊', '订单信息', '订单详情-物流', '非必填', '待材料激活', '缺少非必填材料', '2026-06-12 10:12:08'],
  ['26012915050167612001', '吴静', '主合同', '租赁服务合同', '必填', '已生效', '缺少必填材料', '2026-06-12 10:15:26']
];
missingMaterialSheet.getRange('A1:H7').values = missingMaterialRows;
missingMaterialSheet.getRange('I1:I7').values = missingMaterialRows.map((row, index) => [index === 0 ? '业务主体1' : (index % 2 ? '雅安欣天下办公设备租赁有限公司' : '雅安青年优品电子商务有限公司')]);
const missingAll = missingMaterialSheet.getRange('A1:I7');
const missingHeader = missingMaterialSheet.getRange('A1:I1');
const missingBody = missingMaterialSheet.getRange('A2:I7');
missingAll.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
missingHeader.format.fill = '#F2F4F7';
missingHeader.format.font = { bold: true, color: '#202B38' };
missingHeader.format.horizontalAlignment = 'center';
missingHeader.format.verticalAlignment = 'center';
missingHeader.format.wrapText = true;
missingHeader.format.rowHeight = 26;
missingBody.format.font = { color: '#202B38' };
missingBody.format.verticalAlignment = 'center';
missingBody.format.wrapText = true;
missingBody.format.rowHeight = 32;
['23', '12', '18', '26', '14', '16', '22', '21'].forEach((width, index) => {
  const column = String.fromCharCode(65 + index);
  missingMaterialSheet.getRange(`${column}:${column}`).format.columnWidth = Number(width);
});
missingMaterialSheet.getRange('I1:I1001').format.columnWidth = 28;
missingMaterialSheet.freezePanes.freezeRows(1);
missingMaterialSheet.tables.deleteAll();
const missingMaterialTable = missingMaterialSheet.tables.add('A1:I7', true);
missingMaterialTable.style = 'TableStyleLight1';

failureSheet.getRange('A9:E9').values = [[
  '重复订单',
  '跨批次同一外部资产方+订单编号已存在；或同批次订单已分配/已流转，不可覆盖。',
  '跨批次：是；同批次跳过：否',
  '重复跳过',
  '跨批次重复：导入结果=导入失败，失败分类=重复订单，处理结果为“该订单已在批次【批次号】导入，本次不允许重复导入”。\n同批次重复跳过：导入结果=导入失败，失败分类=重复订单，处理结果为“重复跳过：该订单已分配或已流转，不可覆盖”。'
]];
failureSheet.getRange('A15:E16').values = [
  [
    '覆盖成功口径',
    '同批次订单未分配且未流转时自动覆盖。',
    '否',
    '同批次覆盖成功',
    '导入结果=导入成功；案件状态=已生效、材料状态=材料齐全时，失败分类、失败字段和字段值为空；普通导入的处理结果为“成功”。同批次覆盖时，处理结果为“同批次覆盖成功：使用后传Excel字段覆盖已有订单”。'
  ],
  [
    '主子订单更新成功',
    '本次同时导入主订单和续租订单，系统中已存在对应主子订单案件且均未流转。',
    '否',
    '主子订单更新成功',
    '导入结果=导入成功；案件状态=已生效、材料状态=材料齐全时，失败分类、失败字段和字段值为空；处理结果为“主子订单更新成功：主订单和续租订单均已存在且未流转，已按本次Excel更新”。'
  ]
];

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(file);
const preview = await workbook.render({ sheetName: '导入结果明细', range: 'A1:R18', format: 'png', scale: 1 });
await writeFile('/private/tmp/法诉案件导入_导入结果明细_预览.png', new Uint8Array(await preview.arrayBuffer()));
console.log('已将处理结果合并至原失败原因列，并统一两张Sheet口径');
