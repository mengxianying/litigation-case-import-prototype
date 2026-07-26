import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const requiredTerms = [
  '待材料激活',
  '待初始化（一期）',
  '规则快照',
  '待补传材料',
  '未匹配材料',
];

for (const term of requiredTerms) {
  assert.ok(html.includes(term), `缺少二期关键口径：${term}`);
}

const batchManagement = html.match(/<section id="taskFull"[\s\S]*?<section id="newImportFull"/);
assert.ok(batchManagement, '缺少二期案件导入管理页面');
const batchHtml = batchManagement[0];

assert.ok(batchHtml.includes('<th colspan="3">案件结果</th>'), '案件结果应使用分组表头明确三类数量的归属');
assert.ok(batchHtml.includes('>材料处理</th>'), '材料状态应明确为材料处理结果');
assert.ok(batchHtml.includes('>导入状态</th>'), '批次任务状态应统一命名为导入状态');
assert.ok(/<th[^>]*>已生效<\/th><th[^>]*>待材料激活<\/th><th[^>]*>导入失败<\/th>/.test(batchHtml), '案件结果应与详情案件状态统一为已生效、待材料激活和导入失败');
assert.ok(!batchHtml.includes('class="case-result compact"'), '案件结果不应使用混合语义的单行摘要');
assert.ok(html.includes('字段状态枚举'), '主列表右侧备注应列出状态枚举');
assert.ok(html.includes('运营可直接筛选待材料激活、待补必填或待补非必填订单后批量补传'), '二期下载明细备注应说明按状态筛选待补订单的方式');
assert.ok(html.includes('字段失败、材料待补和重复跳过均按失败分类说明填写处理结果'), '二期下载明细备注应说明失败分类说明Sheet');
assert.ok(html.includes('普通“已生效 + 材料齐全”订单的处理结果为“成功”'), '二期下载明细应明确普通成功订单的处理结果');
const taskAnnotation = html.match(/<div class="anno-page active" data-anno="taskFull">[\s\S]*?<div class="anno-page" data-anno="newImportFull">/);
assert.ok(taskAnnotation, '缺少二期案件导入管理备注');
const taskAnnotationHtml = taskAnnotation[0];
assert.ok(!taskAnnotationHtml.includes('<tr><th>材料要求</th>'), '状态枚举不应保留材料要求行');
assert.ok(!taskAnnotationHtml.includes('<tr><th>异常文件<br>识别问题</th>'), '状态枚举不应保留异常文件识别问题行');
assert.ok(taskAnnotationHtml.includes('<tr><th>导入失败</th><td>处理详情、编辑、下载明细</td>'), '导入失败批次应支持编辑');
assert.ok(taskAnnotationHtml.includes('一期历史批次<br>待初始化（一期）'), '状态机应说明一期历史批次的操作');
assert.ok(/DR202606090006[\s\S]*?class="op-actions two-line"[\s\S]*?处理详情[\s\S]*?编辑[\s\S]*?class="text-link download-detail"[\s\S]*?下载明细/.test(batchHtml), '导入完成行应将处理详情和编辑放在第一行，下载明细放在第二行');
assert.ok(/DR202605080001[\s\S]*?class="op-actions two-line"[\s\S]*?补充历史材料[\s\S]*?编辑[\s\S]*?class="text-link download-detail"[\s\S]*?下载明细/.test(batchHtml), '一期历史批次应将下载明细放在第二行');
assert.ok(/openDebtAmountModal\('history'/.test(batchHtml), '一期历史批次应提供编辑功能');
assert.ok(batchHtml.includes('<span>订单号</span><div class="field-box"><div class="input">精确查询</div></div></label>'), '批次管理筛选区应支持按订单号精确查询');
assert.ok(batchHtml.includes('<span>债权出让主体</span><div class="field-box"><div class="input">支持模糊查询</div></div></label>'), '批次管理筛选区应支持按债权出让主体模糊查询');

const newImportFull = html.match(/<section id="newImportFull"[\s\S]*?<section id="detail"/);
assert.ok(newImportFull, '缺少二期新建导入批次页面');
assert.ok(newImportFull[0].includes('<input class="input text-input" id="importTransferorFull" type="text" maxlength="50"'), '二期新建批次应提供债权出让主体文本输入框');
assert.ok(newImportFull[0].includes('债权出让主体</span><div class="field-box"><input class="input text-input" id="importTransferorFull"'), '二期新建批次应展示债权出让主体字段');
assert.ok(newImportFull[0].includes('必填，最多50字符。'), '债权出让主体应限制最多50字');
assert.ok(newImportFull[0].includes('onclick="submitPhase2Import()">导入</button>'), '二期新建批次导入按钮应提交异步处理任务');
assert.ok(html.includes('id="phase2ImportProcessingModal"'), '二期应提供导入处理中提示框');
assert.ok(html.includes('<td>异步处理中</td><td><span class="tag info">导入中</span>'), '二期导入提示框应展示异步处理中和导入中');
assert.ok(html.includes('function submitPhase2Import()'), '原型应提供二期导入提交流程');
assert.ok(html.includes("switchTab('taskFull')"), '二期导入提示确认后应返回二期案件导入管理列表');
assert.ok(html.includes('提交成功后弹出“导入处理中”，处理阶段显示“异步处理中”，页面提示显示“导入中”。'), '二期备注应明确导入中的弹框口径');
assert.ok(html.includes("activePage && activePage.id === 'newImportFull' ? 'taskFull' : 'task'"), '二期新建导入确认取消后应返回二期案件导入管理，一期仍返回一期列表');

const batchEditModal = html.match(/<div id="debtAmountModal"[\s\S]*?<div id="coverageRecordModal"/);
assert.ok(batchEditModal, '缺少编辑批次信息弹框');
assert.ok(batchEditModal[0].includes('<input class="input text-input" id="batchTransferorEdit" type="text" maxlength="50"'), '编辑批次信息应允许修改债权出让主体');
assert.ok(html.includes('batchTransferorOverrides[currentEditingBatchKey] = transferor;'), '编辑保存后应保留债权出让主体修改值');
assert.ok(batchEditModal[0].includes('id="batchAttachmentBox"'), '编辑批次信息应提供批次附件区域');
assert.ok(batchEditModal[0].includes('onclick="uploadBatchAttachment()">上传附件</button>'), '批次附件区域应提供上传附件按钮');
assert.ok(batchEditModal[0].includes('最多上传10个文件，支持pdf、图片、xlsx、xls、zip、7z、rar。'), '批次附件应限制数量和文件格式');
assert.ok(batchEditModal[0].includes('下载</button>') && batchEditModal[0].includes('删除</button>'), '批次附件应支持下载和删除');
assert.ok(!batchEditModal[0].includes('重新上传</button>'), '批次附件列表不应提供重新上传操作');
assert.ok(html.includes('function uploadBatchAttachment()'), '原型应提供批次附件上传交互');
assert.ok(html.includes('function deleteBatchAttachment('), '原型应提供批次附件删除交互');
assert.ok(!html.includes('function replaceBatchAttachment('), '原型不应保留批次附件重新上传交互');
assert.ok(html.includes('批次附件不参与订单材料解析和材料完整度校验。'), '备注应说明批次附件不参与材料解析');
assert.ok(html.includes('债权出让主体支持模糊查询；订单号精确匹配批次内任一订单。'), '批次管理备注应明确新增筛选字段的匹配规则');

const importDetail = html.match(/<section id="detail"[\s\S]*?<section id="stateMachine"/);
assert.ok(importDetail, '缺少导入处理详情页面');
const detailHtml = importDetail[0];
assert.ok(detailHtml.includes('待材料激活'), '详情页案件状态应使用待材料激活');
assert.ok(detailHtml.includes('<b>债权出让主体</b><span>湖北创新融资租赁有限公司</span>'), '导入处理详情头部应展示债权出让主体');
assert.ok(detailHtml.includes('<span class="tag ok">材料齐全</span></td><td>成功</td>'), '普通已生效且材料齐全订单的处理结果应为成功');
assert.ok(detailHtml.includes('26012915050167612001') && detailHtml.includes('待初始化（一期）</span></td><td>成功</td><td class="muted">-</td>'), '一期字段通过订单应展示已生效、待初始化（一期）和成功，且不展示材料解析');
assert.ok(detailHtml.includes('26012915050167612002') && detailHtml.includes('身份证号字段格式错误</td><td><button class="text-link" onclick="openFailureModal(\'26012915050167612002\')">失败原因</button>'), '一期导入失败订单应展示未生成材料状态和具体失败结果');
assert.ok(detailHtml.includes('字段校验通过，缺少必填材料：租赁服务合同。'), '待补必填订单的处理结果应与下载明细一致');
assert.ok(detailHtml.includes('字段校验通过，缺少非必填材料：订单详情-物流。'), '待补非必填订单的处理结果应与下载明细一致');
assert.ok(detailHtml.includes('同批次覆盖成功</span><div id="duplicateNote1">使用后传Excel字段覆盖已有订单。'), '自动覆盖订单的处理结果应与下载明细一致');
assert.ok(detailHtml.includes('重复跳过</span><div id="duplicateNote2">该订单已分配或已流转，不可覆盖。'), '重复跳过订单的处理结果应与下载明细一致');
assert.ok(detailHtml.includes('强制覆盖成功</span><div>“是否强制覆盖”=是，已更新可覆盖字段。'), '强制覆盖订单的处理结果应与下载明细一致');
assert.ok(detailHtml.includes('<span class="tag gray">未生成</span>'), '详情页导入失败订单应明确材料状态为未生成');
assert.ok(detailHtml.includes('>查看覆盖记录</button>'), '自动覆盖订单应提供查看覆盖记录入口');
assert.ok(!detailHtml.includes('>覆盖记录</button>'), '自动覆盖订单不应使用含义不清的覆盖记录名称');
assert.ok(html.includes('id="coverageRecordModal"'), '应提供查看覆盖记录弹框');
assert.ok(html.includes('本记录仅用于追溯本次自动覆盖的结果，不会再次执行覆盖或修改案件。'), '覆盖记录弹框应明确为只读追溯');
assert.ok(html.includes('function openCoverageRecord('), '原型应提供查看覆盖记录交互');
assert.ok(html.includes('查看覆盖记录展示自动/强制覆盖方式、字段和同名文件变更，不会再次执行覆盖。'), '详情页备注应说明查看覆盖记录的效果');
assert.ok(html.includes('<span class="tag info">同批次覆盖成功</span> 使用后传Excel字段覆盖已有订单。'), '查看覆盖记录应展示与下载明细一致的自动覆盖结果');
assert.ok(html.includes('<span class="tag info">强制覆盖成功</span> “是否强制覆盖”=是，已更新可覆盖字段。'), '查看覆盖记录应展示与下载明细一致的强制覆盖结果');
assert.ok(html.includes('普通已生效且材料齐全的订单处理结果为“成功”'), '详情页备注应明确普通成功订单的处理结果');
assert.ok(html.includes('<h3>材料解析规则</h3>') && html.includes('首次导入：创建批次时选择导入规则') && html.includes('后续补传或重传：已存在订单始终按首次导入时固化的规则快照重新解析') && html.includes('同批次新增订单：沿用该批次创建时选定的导入规则'), '详情页备注应明确首次导入、后续补传和同批次新增订单的材料解析口径');
assert.ok(html.includes('id="historyMaterialRuleBox"') && html.includes('创新旧合同模式&创新新合同模式规则'), '补充历史材料弹框应展示创新历史批次固定的材料解析规则');
assert.ok(html.includes("document.getElementById('historyMaterialRuleBox').style.display = historyMode ? '' : 'none';"), '材料解析规则仅在补充历史材料时展示');
assert.ok(html.includes('一期历史订单仅完成Excel导入：字段校验通过的订单展示“已生效 / 待初始化（一期）/ 成功”'), '详情页备注应说明一期历史订单的展示口径');
assert.ok(detailHtml.includes('>重复跳过</span>'), '不可覆盖重复订单应直接标记为重复跳过');
assert.ok(detailHtml.includes('该订单已分配或已流转，不可覆盖。'), '重复跳过应说明不可覆盖原因');
assert.ok(!detailHtml.includes('>处理重复</button>'), '不可覆盖重复订单不应提供人工处理重复按钮');
assert.ok(!html.includes('id="duplicateModal"'), '重复跳过不应保留确认跳过弹框');
assert.ok(!html.includes('确认跳过'), '重复跳过不应要求人工确认');
assert.ok(detailHtml.includes('导出当前筛选订单明细'), '订单结果页签应保留当前筛选订单明细导出');
assert.ok(html.includes("if(target === 'orders')"), '导出按钮应仅在订单结果页签展示');
assert.ok(html.includes("download.style.display = 'none';"), '待补材料和异常文件页签应隐藏导出按钮');
assert.ok(!html.includes('导出当前筛选待补材料明细'), '待补材料页签不应保留单独导出按钮');
assert.ok(!html.includes('导出当前筛选异常文件明细'), '异常文件页签不应保留单独导出按钮');
assert.ok(html.includes('导入结果明细、待补材料明细、失败分类说明、口径说明'), '订单结果导出应与批次下载明细使用相同四张Sheet');
assert.ok(!detailHtml.includes('<th>来源</th>'), '待补材料列表不展示来源列');
assert.ok(detailHtml.includes('26012915050167612001') && detailHtml.includes('<td>吴静</td><td>主合同</td><td>租赁服务合同</td><td><span class="tag bad">必填</span></td><td><span class="tag ok">已生效</span>'), '一期历史订单解析出缺失材料后应进入待补材料列表，案件保持已生效');
assert.ok(html.includes('未上传材料包的订单仅在订单结果展示“待初始化（一期）”，不进入待补材料'), '备注应说明一期历史订单未解析时不进入待补材料');
assert.ok(detailHtml.includes('26012915050167612348</td><td>丁磊</td><td>6,990.00</td><td><span class="tag warn">待材料激活</span></td><td><span class="tag bad">待补必填</span>'), '同一订单缺少多项材料时，订单结果应只展示一条汇总记录');
assert.ok(detailHtml.includes('26012915050167612348</td><td>丁磊</td><td>主合同</td><td>租赁服务合同</td><td><span class="tag bad">必填</span>') && detailHtml.includes('26012915050167612348</td><td>丁磊</td><td>订单信息</td><td>订单详情-物流</td><td><span class="tag warn">非必填</span>'), '同一订单缺少两项材料时，待补材料应按材料展示两条记录');
assert.ok(html.includes('同一订单缺少多项材料时展示多条记录'), '备注应说明待补材料按材料多行展示');

assert.ok(newImportFull[0].includes('id="importAssetOwnerFull"'), '二期新建批次应提供外部资产方联动选择');
assert.ok(newImportFull[0].includes('class="select multi-rule-select"'), '创新导入规则应支持多选');
assert.ok(html.includes("'创新':['创新旧合同模式','创新新合同模式']"), '创新应加载旧合同和新合同两项规则');
assert.ok(html.includes("'转转':['转转租赁通用规则']"), '转转应仅加载自身导入规则');
assert.ok(html.includes('function downloadSelectedPhase2Template'), '二期下载模板应按已选规则动态生成文件名');
assert.ok(html.includes('合同模式'), '多选创新规则时模板应增加合同模式字段说明');
assert.ok(html.includes('function setPhase2RuleDetailTab'), '多选规则详情应支持Sheet页签切换');
assert.ok(html.includes('是否强制覆盖'), '二期模板与规则说明应包含强制覆盖控制列');
assert.ok(html.includes('默认隐藏且为空'), '强制覆盖控制列应默认隐藏且为空');
assert.ok(html.includes('跨批次订单仍阻断'), '强制覆盖不应突破跨批次重复限制');
assert.ok(html.includes('强制覆盖成功</span>'), '订单结果应展示强制覆盖终态示例');
assert.ok(html.includes('同批次、是否强制覆盖=是'), '覆盖记录应展示强制覆盖触发条件');

const stateMachine = html.match(/<section id="stateMachine"[\s\S]*?<\/section>\s*<\/main>/);
assert.ok(stateMachine, '缺少状态机说明页面');
assert.ok(stateMachine[0].includes('一期历史批次补充材料状态机'), '状态机页面应单独展示历史批次补充材料流程');
assert.ok(stateMachine[0].includes('待初始化（一期）') && stateMachine[0].includes('材料处理中'), '历史材料状态机应展示初始状态和处理中状态');
assert.ok(stateMachine[0].includes('材料齐全') && stateMachine[0].includes('待补必填 / 待补非必填'), '历史材料状态机应展示解析结果分支');
assert.ok(stateMachine[0].includes('案件结果保持已生效'), '历史材料状态机应明确不影响一期已生效案件');
assert.ok(batchHtml.includes('id="historyMaterialStatus"'), '历史批次材料状态应支持提交后回写');
assert.ok(batchHtml.includes('id="historyBatchActions"'), '历史批次操作区应支持状态变化后回写');
assert.ok(html.includes('function startHistoryMaterialProcessing()'), '提交历史材料后应触发历史材料处理中状态');
assert.ok(html.includes('id="batchReidentifyOption"'), '批量补传弹框应标记重新识别选项区域');
assert.ok(html.includes("reidentifyOption.style.display = historyMode ? 'none' : ''"), '首次补充历史材料时应隐藏重新识别历史异常文件选项');
assert.ok(stateMachine[0].includes('二期案件导入全流程状态机'), '状态机页面应提供二期端到端流程示例');
assert.ok(stateMachine[0].includes('运营人员') && stateMachine[0].includes('导入服务') && stateMachine[0].includes('案件与材料'), '全流程状态机应按操作与系统职责分泳道展示');
['新建导入批次', '上传资产明细和材料包', '上传前置校验', '异步处理', '订单与材料解析', '导入处理详情', '批量补传', '案件生效 / 材料待办'].forEach(function(term){
  assert.ok(stateMachine[0].includes(term), '全流程状态机缺少关键步骤：' + term);
});

console.log('phase2 prototype checks passed');
