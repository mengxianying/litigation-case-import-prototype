import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fieldConfigTable = html.match(/<table id="fieldRuleTable"[\s\S]*?<\/table>/)?.[0] || '';
const configuredFieldCount = (fieldConfigTable.match(/<tr(?:\s|>)/g) || []).length - 1;

assert.match(html, /id="viewRuleDetailBtn"/, '二期导入规则字段应提供“查看规则详情”入口');
assert.match(html, /id="ruleDetailModal" class="modal-mask"/, '页面应包含规则详情弹框');
assert.match(html, /function openRuleDetailModal\(\)/, '应提供打开规则详情弹框的方法');
assert.match(html, /function renderRuleDetail\(ruleName\)/, '应根据当前规则渲染规则详情');
assert.doesNotMatch(html, /rule-detail-drawer/, '规则详情不应再使用抽屉样式');
assert.match(html, /创新租赁通用规则/, '规则详情应包含创新租赁通用规则');
assert.match(html, /转转租赁规则/, '规则详情应包含转转租赁规则');
assert.match(html, /人人租赁规则/, '规则详情应包含人人租赁规则');
assert.match(html, /data-anno="newImportFull"/, '应保留二期新建导入批次的备注区域');
assert.doesNotMatch(html, /<b>模板版本<\/b><span>/, '规则摘要不应重复展示模板版本');
assert.doesNotMatch(html, /<b>规则状态<\/b><span>/, '规则摘要不应展示规则状态');
assert.doesNotMatch(html, /查看全部字段|收起字段|toggleRuleDetailFields/, '字段列表应默认完整展示，不提供收起操作');
assert.doesNotMatch(html, /id="ruleDetailVersion"/, '弹框标题下方不应展示模板版本和最近更新时间');
assert.match(html, /<th>材料大类<\/th>/, '材料要求应展示材料大类');
assert.match(html, /function getMaterialGroup\(category\)/, '材料大类应按标准材料类别统一映射');
assert.match(html, /function getConfiguredRuleFields\(rule\)/, '规则详情应读取完整Excel模板字段配置');
assert.match(html, /document\.getElementById\('fieldRuleTable'\)/, '规则详情字段应与字段配置表保持一致');
assert.equal(configuredFieldCount, 70, 'Excel字段配置应与70列模板一致');
assert.match(html, /<td>户籍地\(省\)<\/td>/, '字段配置应包含户籍地(省)');
assert.match(html, /<td>户籍地\(市\)<\/td>/, '字段配置应包含户籍地(市)');
assert.match(html, /<td>户籍地\(区\)<\/td>/, '字段配置应包含户籍地(区)');
assert.match(html, /电子签章授权书验签截图/, '创新规则详情应展示材料规则中的全部示例材料');
assert.match(html, /电子存根图/, '创新规则详情应展示物流材料示例');
assert.match(html, /订单详情-物流/, '创新规则详情应展示非必传订单材料示例');
assert.match(html, /rule-material-table/, '材料表应使用完整宽度展示，避免新增列后挤压内容');
assert.match(html, /rule-field-table"><thead><tr><th>中文列名<\/th><th>是否必填<\/th><th>示例<\/th><\/tr>/, '规则详情字段表应只展示中文列名、是否必填和示例');

console.log('rule detail drawer structure checks passed');
