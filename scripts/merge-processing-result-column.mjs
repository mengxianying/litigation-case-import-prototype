import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import { writeFile } from 'node:fs/promises';

const file = '法诉案件导入_导入结果明细.xlsx';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
const resultSheet = workbook.worksheets.getItemAt(0);
const failureSheet = workbook.worksheets.getItemAt(1);
const scopeSheet = workbook.worksheets.items.find((sheet) => sheet.name === '口径说明');
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
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612345', '周薇', '420106199201010008', '导入成功', '已生效', '材料齐全', '-', '', '', '', '重复跳过：该订单已分配或已流转，不可覆盖。', '否', '2026-06-12 10:06:42'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612347', '郑楠', '420106199201010010', '导入成功', '已生效', '材料齐全', '-', '', '', '', '主子订单更新成功：主订单和续租订单均已存在且未流转，已按本次Excel更新。', '否', '2026-06-12 10:10:34'],
  ['DR202606120003', '创新租赁一期Excel导入批次04', '创新', '租赁', '26012915050167612348', '丁磊', '420106199201010011', '导入成功', '待材料激活', '待补必填', '租赁服务合同；租赁服务合同验签报告', '缺少必填材料', '', '', '字段校验通过，缺少必填材料：租赁服务合同；租赁服务合同验签报告。', '否', '2026-06-12 10:12:08']
];

resultSheet.getRange('A1:Q18').values = rows;
resultSheet.getRange('R1:R18').values = rows.map((row, index) => [index === 0 ? '业务主体1' : (index % 2 ? '雅安欣天下办公设备租赁有限公司' : '雅安青年优品电子商务有限公司')]);
const resultAll = resultSheet.getRange('A1:R18');
const resultBodyAll = resultSheet.getRange('A2:R18');
resultAll.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
resultBodyAll.format.fill = '#FFFFFF';
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
resultSheet.getRange('E2:G18').format.numberFormat = '@';

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
resultTable.showBandedRows = false;

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
missingBody.format.fill = '#FFFFFF';
missingBody.format.verticalAlignment = 'center';
missingBody.format.wrapText = true;
missingBody.format.rowHeight = 32;
['23', '12', '18', '26', '14', '16', '22', '21'].forEach((width, index) => {
  const column = String.fromCharCode(65 + index);
  missingMaterialSheet.getRange(`${column}:${column}`).format.columnWidth = Number(width);
});
missingMaterialSheet.getRange('I1:I1001').format.columnWidth = 28;
missingMaterialSheet.getRange('A2:A7').format.numberFormat = '@';
missingMaterialSheet.freezePanes.freezeRows(1);
missingMaterialSheet.tables.deleteAll();
const missingMaterialTable = missingMaterialSheet.tables.add('A1:I7', true);
missingMaterialTable.style = 'TableStyleLight1';
missingMaterialTable.showBandedRows = false;

failureSheet.getRange('A9:E9').values = [[
  '重复订单',
  '跨批次同一外部资产方+订单编号已存在；或同批次订单已分配/已流转，不可覆盖。',
  '跨批次：是；同批次跳过：否',
  '重复跳过',
  '跨批次重复：导入结果=导入失败，失败分类=重复订单，处理结果为“该订单已在批次【批次号】导入，本次不允许重复导入”。\n同批次重复跳过：导入结果=导入成功，案件状态和材料状态保持当前最终状态；失败分类、失败字段和字段值为空，处理结果为“重复跳过：该订单已分配或已流转，不可覆盖”；本次失败另写入批次处理记录。'
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

failureSheet.getRange('A17:E17').values = [[
  '最终结果保留口径',
  '订单已为导入成功且待材料激活，后续再次上传Excel但本次字段校验失败。',
  '本次记录失败；不覆盖订单最终结果',
  '下载明细仍为导入成功 / 待材料激活 / 待补必填',
  '本次Excel失败写入批次处理记录；下载明细按订单当前最终结果展示，处理结果保留当前缺失材料说明。'
]];
failureSheet.getRange('A1:E17').format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
failureSheet.getRange('A2:E17').format.fill = '#FFFFFF';
failureSheet.getRange('A17:E17').format.wrapText = true;
failureSheet.getRange('A17:E17').format.verticalAlignment = 'center';
failureSheet.getRange('A17:E17').format.rowHeight = 52;

if (scopeSheet) {
  const scopeRows = [
    ['口径项', '统一口径', '二期处理规则'],
    ['适用范围', '本明细用于二期案件导入及一期历史批次补充材料后的结果排查。', '一期已生效案件不回退；二期在原有案件基础上补齐材料处理能力。'],
    ['导入规则', '导入字段、必填项和材料要求均以选中的导入规则为准。', '前端可查看规则详情；规则配置由后台维护，订单字段与材料规则按资产方、业务类型生效。'],
    ['Excel上传校验', '列头须与模板一致，列顺序可调整，额外列忽略；同一文件内订单编号重复时整份文件上传失败。', '列头不一致、缺少模板列、文件超限或单文件重复订单均在上传阶段拦截，不创建导入任务。'],
    ['点击导入校验', '订单必填字段为空、订单编号为空、格式或金额不合法等，按订单维度校验。', '校验失败仅影响对应订单，其余订单继续处理；失败原因写入导入结果明细。'],
    ['材料包上传', '新建二期批次须同时上传Excel和材料包；材料包仅支持zip。', '未上传材料包或上传非zip格式时整批不能提交；材料包解析异常不影响其它订单的字段处理。'],
    ['草稿与批次状态', '本期不提供保存草稿；未提交页面取消后不创建批次。', '批次导入状态仅为导入中、导入完成、导入失败。'],
    ['异步处理', '点击导入后创建异步任务，页面展示“导入中”；任务结束后进入导入完成或导入失败。', '确认提示后返回案件导入管理，可进入导入处理详情或下载明细查看处理结果。'],
    ['案件状态', '已生效：字段及必填材料均满足；待材料激活：字段通过但缺少必填材料；导入失败：订单字段或业务校验未通过。', '待材料激活订单补齐必填材料并解析通过后自动变更为已生效。'],
    ['材料状态', '未生成、材料齐全、待补必填、待补非必填四种状态；待补材料展示当前缺失材料名称。', '一期未补材、字段失败或尚无解析结果为未生成；字段成功后先校验必填材料，再校验非必填材料。'],
    ['批量补传', '同一批次可分多次上传，每次订单Excel最多500条。', '支持新增订单及材料、失败订单重新导入、仅补缺失材料、仅补订单Excel；处理过程归集在原批次。'],
    ['最终结果导出', '下载明细按订单当前最终结果导出，不按最后一次上传动作覆盖既有结果。', '待材料激活订单后续Excel校验失败时，仍展示导入成功、待材料激活、待补必填；本次失败仅写入批次处理记录。'],
    ['重复与覆盖', '跨批次同一资产方订单不允许重复导入；同批次再次导入时按订单当前案件状态判断是否可覆盖。', '案件已流转的订单不可覆盖；未流转且满足条件的订单可使用新上传Excel字段更新。'],
    ['主续订单', '首次导入续租订单时，主订单须同批导入且为已结清状态；首次导入主订单后，不允许再导入对应续租订单。', '主子订单同批复导且案件均未流转时可更新；仅已有主订单或单独导入续租订单时按主续关系异常阻断。'],
    ['历史批次补材', '一期历史案件仅导入Excel，案件已生效；未补充材料时材料状态为未生成。', '提交ZIP材料包后材料状态保持未生成，批次处理记录显示处理中；解析完成后更新为材料齐全、待补必填或待补非必填。'],
    ['下载明细', '批次管理“下载明细”与导入处理详情“导出当前筛选订单明细”使用同一模板。', '工作簿包含导入结果明细、待补材料明细、失败分类说明、口径说明。'],
    ['法诉材料导出', '一期历史案件在未补齐材料前不支持导出法诉材料。', '历史案件补充材料包且解析完成后，可在法诉系统现有功能中按既有能力导出法诉材料。'],
    ['批次信息与附件', '债权出让主体为文本输入，最多50字；附件用于留存债权转让协议、转账回单、补充协议等。', '单批次最多10个附件，支持pdf、图片、xlsx、xls、zip；已上传附件支持下载、删除。']
  ];
  scopeSheet.getRange('A1:C18').values = scopeRows;
  scopeSheet.getRange('A1:C18').format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
  scopeSheet.getRange('A2:C18').format.fill = '#FFFFFF';
  scopeSheet.getRange('A2:C18').format.font = { color: '#202B38' };
  scopeSheet.getRange('A2:C18').format.wrapText = true;
  scopeSheet.getRange('A2:C18').format.verticalAlignment = 'center';
}

for (const sheet of workbook.worksheets.items) {
  for (const table of sheet.tables.items) {
    table.showBandedRows = false;
  }
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(file);
const previewRanges = {
  '导入结果明细': 'A1:R18',
  '失败分类说明': 'A1:E17',
  '口径说明': 'A1:C18',
  '待补材料明细': 'A1:I7'
};
for (const [sheetName, range] of Object.entries(previewRanges)) {
  const preview = await workbook.render({ sheetName, range, format: 'png', scale: 1 });
  await writeFile(`/private/tmp/${sheetName}_预览.png`, new Uint8Array(await preview.arrayBuffer()));
}
console.log('已将处理结果合并至原失败原因列，并统一两张Sheet口径');
