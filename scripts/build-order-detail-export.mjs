import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const outputPath = fileURLToPath(new URL('../法诉案件导入_订单处理明细.xlsx', import.meta.url));
const textId = (value) => value === '-' || value == null ? value : `\u200B${value}`;

function toColumn(index) {
  let value = '';
  let current = index;
  while (current >= 0) {
    value = String.fromCharCode((current % 26) + 65) + value;
    current = Math.floor(current / 26) - 1;
  }
  return value;
}

function formatTable(sheet, headers, rows, widths) {
  const lastColumn = toColumn(headers.length - 1);
  const lastRow = rows.length + 1;
  const allRange = sheet.getRange(`A1:${lastColumn}${lastRow}`);
  const headerRange = sheet.getRange(`A1:${lastColumn}1`);
  const bodyRange = sheet.getRange(`A2:${lastColumn}${lastRow}`);

  sheet.showGridLines = false;
  allRange.values = [headers, ...rows];
  headerRange.format.fill = '#F2F4F7';
  headerRange.format.font = { bold: true, color: '#202B38' };
  headerRange.format.wrapText = true;
  headerRange.format.rowHeight = 26;
  bodyRange.format.font = { color: '#202B38' };
  bodyRange.format.wrapText = true;
  bodyRange.format.verticalAlignment = 'center';
  bodyRange.format.rowHeight = 30;
  allRange.format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
  widths.forEach((width, index) => {
    sheet.getRange(`${toColumn(index)}:${toColumn(index)}`).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(1);
  return { lastColumn, lastRow };
}

const workbook = Workbook.create();

const orderSheet = workbook.worksheets.add('订单处理明细');
const order = formatTable(orderSheet,
  ['导入批次号', '外部资产方', '订单编号', '父订单编号', '客户姓名', '处理结果', '失败分类', '失败原因', '案件状态', '材料状态', '是否需补传', '补传内容', '待补材料', '首次导入时间', '最近处理时间'],
  [
    ['DR202606100001', '创新', textId('26012915050167612327'), '-', '张三', '处理成功', '-', '-', '已生效', '材料齐全', '否', '无需补传', '-', '2026-06-10 20:15:32', '2026-06-10 20:16:08'],
    ['DR202606100001', '创新', textId('26012915050167612328'), textId('26012915050167612001'), '黄丽', '待材料补齐', '缺少必填材料', '缺少必填材料：租赁服务合同', '待材料激活', '待补必填', '是', '仅上传材料包（必填）', '租赁服务合同', '2026-06-10 20:15:32', '2026-06-10 20:16:08'],
    ['DR202606100001', '创新', textId('26012915050167612331'), '-', '周强', '处理成功', '缺少非必填材料', '缺少非必填材料：担保合同', '已生效', '待补非必填', '是', '仅上传材料包（非必填）', '担保合同', '2026-06-10 20:15:32', '2026-06-11 10:08:16'],
    ['DR202606100001', '创新', textId('26012915050167612330'), '-', '李明', '导入失败', '字段格式错误', '身份证号格式错误', '-', '未生成', '是', '仅上传订单 Excel', '-', '2026-06-10 20:15:32', '2026-06-11 10:06:42'],
    ['DR202606100001', '创新', textId('26012915050167612333'), '-', '赵倩', '重复跳过', '重复跳过', '原案件已分配或已流转，系统自动跳过，不可覆盖。', '已生效', '未生成', '否', '无需补传', '-', '2026-06-10 20:15:32', '2026-06-11 10:08:18'],
  ],
  [18, 13, 23, 23, 12, 16, 18, 36, 16, 16, 14, 25, 20, 21, 21],
);
orderSheet.getRange(`C2:D${order.lastRow}`).format.numberFormat = '@';

const materialSheet = workbook.worksheets.add('材料处理明细');
formatTable(materialSheet,
  ['导入批次号', '订单编号', '客户姓名', '标准材料类别', '资产方材料名称', '是否必填', '匹配模式', '解析文件', '解析结果', '问题原因', '最近处理时间'],
  [
    ['DR202606100001', textId('26012915050167612327'), '张三', '主合同', '租赁服务合同', '必填', '精确', '26012915050167612327_租赁服务合同_01.pdf', '解析通过', '-', '2026-06-10 20:16:08'],
    ['DR202606100001', textId('26012915050167612328'), '黄丽', '主合同', '租赁服务合同', '必填', '精确', '-', '待补必填', '缺少必填材料：租赁服务合同', '2026-06-10 20:16:08'],
    ['DR202606100001', textId('26012915050167612331'), '周强', '担保合同', '保证合同', '非必填', '包含', '-', '待补非必填', '缺少非必填材料：担保合同', '2026-06-11 10:08:16'],
  ],
  [18, 23, 12, 16, 20, 12, 12, 38, 16, 36, 21],
);

const taskSheet = workbook.worksheets.add('任务级异常');
formatTable(taskSheet,
  ['导入批次号', '异常类型', '异常说明', '发生时间', '处理状态'],
  [
    ['DR202606100001', '材料包解压异常', '材料包内存在损坏文件，未影响其他文件解析。', '2026-06-10 20:15:48', '待重传'],
  ],
  [18, 20, 55, 21, 14],
);

const categorySheet = workbook.worksheets.add('错误分类说明');
const categories = formatTable(categorySheet,
  ['分类/规则', '触发场景', '是否阻断', '示例', '提示文案', '处理方式'],
  [
    ['上传前置校验', '列头名称与模板不一致，或本Excel内订单编号重复；列顺序可调整，额外列忽略', '上传阶段拦截，不创建任务', '模板中有重复订单', '列头不一致：模板列头【实际列名】与标准模板不一致，请下载最新模板修正后重新上传。\n重复订单：模板中有重复订单，请修正后重新上传。', '下载最新模板或修正重复订单后重新上传'],
    ['导入前校验', '必填列缺失、订单编号为空、文件超过50MB或订单超过500条', '点击导入时拦截，不提交任务', '订单编号为空', '订单编号为空：模板中订单编号不能为空，请修正后重新上传。\n缺少必填列：模板缺少必填列【列名】，请修正后重新上传。', '修正Excel后重新上传'],
    ['模板格式错误', '文件无法解析、列头名称与模板不一致等模板问题', '上传阶段拦截，不创建任务', '文件无法解析', '文件无法解析，请确认文件未损坏且格式为xlsx/xls后重新上传。', '下载最新模板，修正后重新上传'],
    ['基础必填缺失', '导入规则配置为必填或条件必填的字段为空', '订单不生成案件', '债权金额为空', '【字段名】不能为空', '修正订单Excel后批量补传'],
    ['字段格式错误', '身份证号、手机号、日期、枚举值等不符合字段校验规则', '订单不生成案件', '身份证号格式错误', '【字段名】字段格式错误', '修正订单Excel后批量补传'],
    ['金额异常', '金额非数字、为负数或金额关系不合法', '订单不生成案件', '债权金额为负数', '【字段名】金额异常', '修正订单Excel后批量补传'],
    ['主子订单校验异常', '主订单未同批导入、未结清、父子订单证件号不一致；系统仅已有主订单案件时，本次主子订单导入或仅续租订单导入均不允许更新', '订单不生成案件', '主订单已形成案件', '续租订单关联的主订单【父订单编号】已在法诉系统形成案件，不符合续租订单导入条件。', '调整订单组合或主子订单关系后批量补传订单Excel'],
    ['跨批次重复', '同一外部资产方+订单编号已在其他批次导入', '上传阶段阻断，不创建本批次记录', '订单已在其他批次导入', '该订单已在批次【批次号】导入，本次不允许重复导入。', '更换正确订单后重新上传'],
    ['重复跳过', '同批次已有案件已分配或已流转，不能自动覆盖', '不覆盖原案件，直接终态', '案件已流转', '原案件已分配或已流转，系统自动跳过，不可覆盖。', '无需重复上传该订单'],
    ['缺少必填材料', '订单字段校验通过，但未匹配到规则要求的必填材料', '案件待材料激活', '缺少租赁服务合同', '缺少必填材料：{材料名称}', '仅上传材料包；补齐后案件自动生效'],
    ['缺少非必填材料', '订单已生效，但未匹配到规则要求的非必填材料', '不阻断案件生效', '缺少担保合同', '缺少非必填材料：{材料名称}', '按需仅上传材料包'],
    ['材料包解压异常', '材料包损坏、无法解压或存在不支持的压缩结构', '任务级异常，其他文件可继续解析', '压缩包损坏', '材料包无法解压，请确认压缩包完整后重新上传。', '重新打包材料包后批量补传'],
    ['异常文件', '文件未匹配到订单、订单已结清或文件不符合材料规则', '不影响其他订单处理', '订单不存在', '订单不存在或已结清，未纳入案件材料。', '核对文件命名和订单状态后重新上传材料包'],
    ['规则快照异常', '规则快照读取或应用失败', '任务级异常', '规则快照读取超时', '规则快照读取异常，系统将自动重试。', '已恢复无需操作；未恢复时按任务异常说明重传'],
    ['系统异常', '任务创建后，解析、校验或落库发生技术异常', '任务或订单处理失败', '解析服务异常', '系统异常，请稍后重试。', '在任务级异常查看说明后重传；持续失败联系技术处理'],
    ['首错输出规则', '同一订单命中多个校验问题时', '不适用', '必填缺失且身份证号格式错误', '仅展示按校验优先级命中的首个订单级失败原因。', '按问题分类和问题原因修正后批量补传'],
  ],
  [22, 54, 24, 26, 68, 38],
);
categorySheet.getRange(`A2:F${categories.lastRow}`).format.rowHeight = 46;

const names = workbook.worksheets.items.map((sheet) => sheet.name);
if (names.join('|') !== '订单处理明细|材料处理明细|任务级异常|错误分类说明') {
  throw new Error(`Sheet 顺序不符合预期：${names.join('|')}`);
}

const checks = await Promise.all([
  workbook.inspect({ kind: 'table', range: '订单处理明细!A1:O6', include: 'values', tableMaxRows: 6, tableMaxCols: 15 }),
  workbook.inspect({ kind: 'table', range: '材料处理明细!A1:K4', include: 'values', tableMaxRows: 4, tableMaxCols: 11 }),
  workbook.inspect({ kind: 'table', range: '任务级异常!A1:E2', include: 'values', tableMaxRows: 2, tableMaxCols: 5 }),
  workbook.inspect({ kind: 'table', range: '错误分类说明!A1:F4', include: 'values', tableMaxRows: 4, tableMaxCols: 6 }),
]);
if (
  !checks[0].ndjson.includes('26012915050167612327') ||
  !checks[1].ndjson.includes('租赁服务合同') ||
  !checks[2].ndjson.includes('材料包解压异常') ||
  !checks[3].ndjson.includes('上传前置校验')
) {
  throw new Error('当前筛选处理明细数据校验失败');
}

await fs.mkdir(fileURLToPath(new URL('..', import.meta.url)), { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(outputPath);
