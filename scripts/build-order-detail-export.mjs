import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const outputPath = fileURLToPath(new URL('../法诉案件导入_订单处理明细.xlsx', import.meta.url));
const textId = (value) => value === '-' ? value : `\u200B${value}`;

const sheets = [
  {
    name: '订单结果',
    headers: ['导入批次号', '外部资产方', '订单编号', '客户姓名', '主订单编号', '订单类型', '债权金额', '逾期天数', '案件状态', '材料状态', '处理结果'],
    rows: [
      ['DR202606100001', '创新', textId('26012915050167612327'), '张三', '-', '主订单', 12036.8, 61, '已生效', '材料齐全', '已进入待委外'],
      ['DR202606100001', '创新', textId('26012915050167612328'), '黄丽', textId('26012915050167612001'), '续租订单', 9420, 54, '待材料激活', '待补必填', '缺少主合同，补齐并复核通过后自动生效'],
      ['DR202606100001', '创新', textId('26012915050167612330'), '李明', '-', '主订单', 7290, 35, '导入失败', '-', '修正 Excel 后可在本批次批量补传'],
      ['DR202606100001', '创新', textId('26012915050167612333'), '赵倩', '-', '主订单', 6880, 39, '已生效', '未生成', '重复跳过：原案件已分配或已流转，不可覆盖'],
    ],
    widths: [18, 13, 23, 12, 23, 12, 14, 12, 15, 15, 36],
    moneyColumn: 'G',
  },
  {
    name: '待补材料',
    headers: ['导入批次号', '外部资产方', '订单编号', '客户姓名', '标准材料类别', '缺失材料名称', '材料要求', '案件状态', '补传结果', '最近处理时间'],
    rows: [
      ['DR202606100001', '创新', textId('26012915050167612328'), '黄丽', '主合同', '租赁服务合同', '必填', '待材料激活', '补齐并复核通过后自动生效', '2026-06-10 20:15:32'],
      ['DR202606100001', '创新', textId('26012915050167612331'), '周强', '担保合同', '保证合同', '非必填', '已生效', '补充后更新材料状态', '2026-06-10 20:15:32'],
      ['DR202606100001', '创新', textId('26012915050167612334'), '陈晨', '订单材料', '订单详情', '非必填', '已生效', '补充后更新材料状态', '2026-06-10 20:15:32'],
    ],
    widths: [18, 13, 23, 12, 16, 20, 12, 15, 30, 21],
  },
  {
    name: '异常文件',
    headers: ['导入批次号', '外部资产方', '文件名', '识别问题', '候选订单', '来源材料包', '上传时间', '处理提示', '最新处理时间'],
    rows: [
      ['DR202606100001', '创新', '26012915050167612327_人像面_01.jpg', '已识别为人像面，未识别订单归属', '-', '创新租赁批次01_材料包_01.zip', '2026-06-10 20:18:05', '上传对应订单 Excel 后，可同步重新识别', '2026-06-10 20:18:05'],
      ['DR202606100001', '创新', '26012915050167612327_租赁服务合同_01.pdf', '已识别为主合同，未识别订单归属', '-', '创新租赁批次01_材料包_01.zip', '2026-06-10 20:18:09', '需上传规范命名的材料包，或补充对应订单 Excel', '2026-06-10 20:18:09'],
      ['DR202606100001', '创新', '26012915050167612339_担保合同_01.pdf', '订单不存在或已结清', textId('26012915050167612339'), '创新租赁批次01_材料包_01.zip', '2026-06-10 20:20:41', '不纳入案件材料，不生成待补任务', '2026-06-10 20:20:41'],
    ],
    widths: [18, 13, 35, 30, 23, 31, 21, 37, 21],
  },
];

function toColumn(index) {
  let value = '';
  let current = index;
  while (current >= 0) {
    value = String.fromCharCode((current % 26) + 65) + value;
    current = Math.floor(current / 26) - 1;
  }
  return value;
}

function formatSheet(sheet, { headers, rows, widths, moneyColumn }) {
  const lastColumn = toColumn(headers.length - 1);
  const lastRow = rows.length + 1;
  const fullRange = sheet.getRange(`A1:${lastColumn}${lastRow}`);
  const headerRange = sheet.getRange(`A1:${lastColumn}1`);
  const bodyRange = sheet.getRange(`A2:${lastColumn}${lastRow}`);

  sheet.showGridLines = false;
  fullRange.values = [headers, ...rows];
  headerRange.format.fill = '#F2F4F7';
  headerRange.format.font = { bold: true, color: '#202B38' };
  headerRange.format.horizontalAlignment = 'center';
  headerRange.format.verticalAlignment = 'center';
  headerRange.format.wrapText = true;
  headerRange.format.rowHeight = 26;
  bodyRange.format.font = { color: '#202B38' };
  bodyRange.format.verticalAlignment = 'center';
  bodyRange.format.wrapText = true;
  bodyRange.format.rowHeight = 28;
  fullRange.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
  fullRange.format.horizontalAlignment = 'left';

  widths.forEach((width, index) => {
    sheet.getRange(`${toColumn(index)}:${toColumn(index)}`).format.columnWidth = width;
  });
  if (moneyColumn) {
    sheet.getRange(`${moneyColumn}2:${moneyColumn}${lastRow}`).format.numberFormat = '#,##0.00';
  }
  sheet.freezePanes.freezeRows(1);
}

const workbook = Workbook.create();
for (const definition of sheets) {
  const sheet = workbook.worksheets.add(definition.name);
  formatSheet(sheet, definition);
}

const inspections = [];
for (const definition of sheets) {
  inspections.push(await workbook.inspect({
    kind: 'table',
    range: `${definition.name}!A1:${toColumn(definition.headers.length - 1)}4`,
    include: 'values',
    tableMaxRows: 4,
    tableMaxCols: definition.headers.length,
  }));
}
if (inspections.some((result) => !result.ndjson.includes('DR202606100001'))) {
  throw new Error('导出明细数据校验失败');
}

await fs.mkdir(fileURLToPath(new URL('..', import.meta.url)), { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(outputPath);
