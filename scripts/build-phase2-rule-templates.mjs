import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '/Users/xianying.meng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const sourcePath = '/Users/xianying.meng/Documents/贷后系统/outputs/github_publish_work/法诉案件导入_Excel模板及文件格式说明0702_最终版.xlsx';
const outputDir = fileURLToPath(new URL('..', import.meta.url));

function columnName(index) {
  let result = '';
  let value = index;
  while (value >= 0) {
    result = String.fromCharCode((value % 26) + 65) + result;
    value = Math.floor(value / 26) - 1;
  }
  return result;
}

function getMaterialGroup(category) {
  const groups = {
    '电子签章授权书': '合同材料', '主合同': '合同材料', '合同附件': '合同材料', '补充合同': '合同材料',
    '身份信息': '身份材料', '物流信息': '物流材料', '订单信息': '订单材料', '账单详情': '订单材料',
  };
  return groups[category] || '其它材料';
}

const innovationOldMaterials = {
  first: [
    ['电子签章授权书', '电子签章授权书', '必传', '精确'], ['电子签章授权书', '电子签章授权书验签截图', '必传', '精确'],
    ['主合同', '租赁服务合同', '必传', '精确'], ['主合同', '租赁服务合同验签报告', '必传', '精确'],
    ['合同附件', '合同附件-1', '必传', '精确'], ['合同附件', '合同附件-2', '非必传', '精确'],
    ['补充合同', '补充合同', '非必传', '精确'], ['身份信息', '人像面', '必传', '精确'],
    ['身份信息', '国徽面', '必传', '精确'], ['身份信息', '活体识别照片', '必传', '精确'],
    ['物流信息', '路由详情图', '非必传', '精确'], ['订单信息', '订单详情-账单', '必传', '精确'],
    ['订单信息', '订单详情-物流', '非必传', '精确'], ['订单信息', '账单详情', '必传', '精确'],
  ],
  renewal: [
    ['电子签章授权书', '电子签章授权书', '必传', '精确'], ['电子签章授权书', '电子签章授权书验签截图', '必传', '精确'],
    ['主合同', '续租服务合同', '必传', '精确'], ['主合同', '续租协议', '必传', '精确'],
    ['合同附件', '续租合同附件', '必传', '精确'], ['身份信息', '人像面', '非必传', '精确'],
    ['身份信息', '国徽面', '非必传', '精确'], ['物流信息', '续租交付凭证', '非必传', '精确'],
  ],
};

const innovationNewMaterials = {
  first: [
    ['电子签章授权书', '电子签章授权书', '必传', '精确'], ['主合同', '电子租赁服务合同', '必传', '精确'],
    ['主合同', '电子租赁服务合同验签报告', '必传', '精确'], ['合同附件', '电子合同附件', '非必传', '精确'],
    ['身份信息', '人像面', '必传', '精确'], ['身份信息', '国徽面', '必传', '精确'],
    ['订单信息', '订单详情-账单', '必传', '精确'], ['订单信息', '订单详情-物流', '非必传', '精确'],
    ['订单信息', '账单详情', '必传', '精确'], ['物流信息', '签收凭证', '非必传', '精确'],
  ],
  renewal: [
    ['电子签章授权书', '电子签章授权书', '必传', '精确'], ['主合同', '电子续租服务合同', '必传', '精确'],
    ['主合同', '电子续租服务合同验签报告', '必传', '精确'], ['合同附件', '续租电子合同附件', '非必传', '精确'],
    ['订单信息', '订单详情-账单', '必传', '精确'], ['订单信息', '账单详情', '必传', '精确'],
  ],
};

const zzMaterials = {
  first: [
    ['订单信息', '订单详情', '必传', '精确'], ['账单详情', '账单详情', '必传', '精确'], ['主合同', '租赁服务合同', '必传', '包含'],
  ],
  renewal: [
    ['订单信息', '订单详情', '必传', '精确'], ['主合同', '续租协议', '必传', '包含'],
  ],
};

const templateDefinitions = [
  { fileName: '创新_创新旧合同模式.xlsx', ruleName: '创新旧合同模式', materials: innovationOldMaterials },
  { fileName: '创新_创新新合同模式.xlsx', ruleName: '创新新合同模式', materials: innovationNewMaterials },
  { fileName: '创新_创新旧合同模式&创新新合同模式.xlsx', ruleName: '创新旧合同模式', materials: innovationOldMaterials, secondRuleName: '创新新合同模式', secondMaterials: innovationNewMaterials, contractMode: true },
  { fileName: '转转_转转租赁通用规则.xlsx', ruleName: '转转租赁通用规则', materials: zzMaterials },
];

async function inspect(workbook, sheetName, range) {
  return JSON.parse((await workbook.inspect({
    kind: 'table', range: `'${sheetName}'!${range}`, include: 'values', tableMaxRows: 30, tableMaxCols: 100,
  })).ndjson);
}

function writeMaterialRuleSheet(workbook, ruleName, materials) {
  const sheet = workbook.worksheets.add(`材料规则-${ruleName}`);
  const headers = ['订单类型', '标准材料类别', '材料大类', '资产方材料名称', '是否必传', '匹配方式', '规则说明'];
  const rows = [];
  Object.entries(materials).forEach(([orderType, items]) => {
    const label = orderType === 'first' ? '首租订单' : '续租订单';
    items.forEach(([category, sourceName, required, match]) => {
      rows.push([label, category, getMaterialGroup(category), sourceName, required, match, `${required === '必传' ? '缺失后案件待材料激活' : '缺失不影响案件生效'}；按${match}方式匹配文件名`]);
    });
  });
  const endRow = rows.length + 1;
  sheet.getRange(`A1:G${endRow}`).values = [headers, ...rows];
  sheet.getRange(`A1:G${endRow}`).format.borders = { preset: 'all', style: 'thin', color: '#D9E2EC' };
  sheet.getRange('A1:G1').format.fill = '#F2F4F7';
  sheet.getRange('A1:G1').format.font = { bold: true, color: '#202B38' };
  sheet.getRange('A1:G1').format.horizontalAlignment = 'center';
  sheet.getRange('A1:G1').format.verticalAlignment = 'center';
  sheet.getRange('A1:G1').format.rowHeight = 26;
  sheet.getRange(`A2:G${endRow}`).format.wrapText = true;
  sheet.getRange(`A2:G${endRow}`).format.verticalAlignment = 'center';
  sheet.getRange(`A2:G${endRow}`).format.rowHeight = 32;
  [15, 18, 16, 28, 12, 12, 48].forEach((width, index) => {
    sheet.getRange(`${columnName(index)}:${columnName(index)}`).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(1);
  const table = sheet.tables.add(`A1:G${endRow}`, true);
  table.style = 'TableStyleLight1';
}

const selectedFileName = process.argv[2];
const definitionsToBuild = selectedFileName
  ? templateDefinitions.filter((item) => item.fileName === selectedFileName)
  : templateDefinitions;
if (!definitionsToBuild.length) throw new Error(`未找到模板定义：${selectedFileName}`);

for (const definition of definitionsToBuild) {
  const source = await FileBlob.load(sourcePath);
  const workbook = await SpreadsheetFile.importXlsx(source);
  const templateSheet = workbook.worksheets.items.find((sheet) => sheet.name === '案件导入模板');
  if (!templateSheet) throw new Error('源模板缺少案件导入模板Sheet');

  const sourceTable = await inspect(workbook, '案件导入模板', 'A1:CV3');
  const lastIndex = sourceTable.values[0].reduce((last, value, index) => value ? index : last, -1);
  if (lastIndex < 0) throw new Error('源模板未识别到列头');
  if (definition.contractMode) {
    const contractColumn = columnName(lastIndex + 1);
    templateSheet.getRange(`${contractColumn}1:${contractColumn}3`).values = [
      ['规则模式'], ['创新旧合同模式'], ['必填；枚举值取该资产方配置的导入规则：创新旧合同模式、创新新合同模式；用于匹配对应的导入规则和材料规则'],
    ];
    templateSheet.getRange(`${contractColumn}1`).format.fill = '#F2F4F7';
    templateSheet.getRange(`${contractColumn}1`).format.font = { bold: true, color: '#202B38' };
    templateSheet.getRange(`${contractColumn}1`).format.horizontalAlignment = 'center';
    templateSheet.getRange(`${contractColumn}1:${contractColumn}3`).format.wrapText = true;
    templateSheet.getRange(`${contractColumn}:${contractColumn}`).format.columnWidth = 20;
  }
  writeMaterialRuleSheet(workbook, definition.ruleName, definition.materials);
  if (definition.secondRuleName) writeMaterialRuleSheet(workbook, definition.secondRuleName, definition.secondMaterials);

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(`${outputDir}/${definition.fileName}`);
}

console.log(definitionsToBuild.map((item) => item.fileName).join('\n'));
