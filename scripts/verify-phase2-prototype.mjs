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
assert.ok(html.includes('可按“是否需补传”筛选待处理订单'), '二期下载明细备注应说明按是否需补传筛选订单的方式');
assert.ok(html.includes('最后以“错误分类说明”统一列明一期与二期的分类'), '二期下载明细备注应说明错误分类说明Sheet');
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
assert.ok(detailHtml.includes('<span class="tag gray">未生成</span>'), '详情页导入失败订单应明确材料状态为未生成');
assert.ok(detailHtml.includes('>查看覆盖记录</button>'), '自动覆盖订单应提供查看覆盖记录入口');
assert.ok(!detailHtml.includes('>覆盖记录</button>'), '自动覆盖订单不应使用含义不清的覆盖记录名称');
assert.ok(html.includes('id="coverageRecordModal"'), '应提供查看覆盖记录弹框');
assert.ok(html.includes('本记录仅用于追溯本次自动覆盖的结果，不会再次执行覆盖或修改案件。'), '覆盖记录弹框应明确为只读追溯');
assert.ok(html.includes('function openCoverageRecord('), '原型应提供查看覆盖记录交互');
assert.ok(html.includes('查看覆盖记录仅展示本次覆盖的字段和同名文件变更，不会再次执行覆盖。'), '详情页备注应说明查看覆盖记录的效果');
assert.ok(detailHtml.includes('>重复跳过</span>'), '不可覆盖重复订单应直接标记为重复跳过');
assert.ok(detailHtml.includes('系统自动跳过，不可覆盖'), '重复跳过应说明自动终态和不可覆盖原因');
assert.ok(!detailHtml.includes('>处理重复</button>'), '不可覆盖重复订单不应提供人工处理重复按钮');
assert.ok(!html.includes('id="duplicateModal"'), '重复跳过不应保留确认跳过弹框');
assert.ok(!html.includes('确认跳过'), '重复跳过不应要求人工确认');
assert.ok(detailHtml.includes('导出当前筛选处理明细'), '订单结果页签应保留当前筛选处理明细导出');
assert.ok(html.includes("if(target === 'orders')"), '导出按钮应仅在订单结果页签展示');
assert.ok(html.includes("download.style.display = 'none';"), '待补材料和异常文件页签应隐藏导出按钮');
assert.ok(!html.includes('导出当前筛选待补材料明细'), '待补材料页签不应保留单独导出按钮');
assert.ok(!html.includes('导出当前筛选异常文件明细'), '异常文件页签不应保留单独导出按钮');
assert.ok(html.includes('订单处理明细、材料处理明细、任务级异常、错误分类说明'), '订单结果导出应与批次下载明细使用相同四个Sheet');

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
