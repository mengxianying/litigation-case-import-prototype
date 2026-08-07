function filterTasks(tasks, filters = {}) {
  return tasks.filter(
    (task) =>
      (!filters.result || task.result === filters.result) &&
      (!filters.evidence || task.evidence === filters.evidence) &&
      (!filters.batchId || task.batchId === filters.batchId) &&
      (!filters.orderNo || task.orderNo.includes(filters.orderNo)) &&
      (!filters.name || task.name.includes(filters.name)),
  );
}

function filterBatches(batches, tasks, filters = {}) {
  return batches.filter((batch) => {
    if (filters.batchName && !batch.name.includes(filters.batchName)) return false;
    const hasTaskFilter = filters.orderNo || filters.name || filters.phone;
    if (!hasTaskFilter) return true;
    return tasks.some((task) => task.batchId === batch.id &&
      (!filters.orderNo || task.orderNo === filters.orderNo) &&
      (!filters.name || task.name === filters.name) &&
      (!filters.phone || task.phoneFull === filters.phone));
  });
}

function paginateTasks(tasks, page = 1, pageSize = 10) {
  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return { items: tasks.slice(start, start + pageSize), page: currentPage, pageSize, total, totalPages };
}

function renameBatch(batch, newName, operator, changedAt) {
  const name = newName.trim();
  if (!name) throw new Error("批次名称不能为空");
  return { ...batch, name, renameLogs: [{ oldName: batch.name, newName: name, operator, changedAt }, ...batch.renameLogs] };
}

function buildEvidenceManifest(tasks) {
  return tasks
    .filter((task) => task.result === "发送成功")
    .map((task) => `${task.orderNo}_${task.name}_发送凭证.jpg`);
}

function buildEvidenceSpreadsheet(tasks) {
  const headers = ["订单编号", "姓名", "手机号", "发送设备编号", "发送手机号", "批次名称", "发送状态", "发送凭证", "重试次数", "最后更新时间"];
  const rows = tasks.map((task) => [
    task.orderNo,
    task.name,
    task.phone,
    task.senderDeviceNo,
    task.senderPhone,
    batchById(task.batchId)?.name || "-",
    task.result,
    task.evidence,
    task.retry + task.manualRetryCount,
    task.updatedAt,
  ]);
  return { headers, rows };
}

function resolveEvidenceDownloadTasks(tasks, selectedIds = []) {
  return selectedIds.length ? tasks.filter((task) => selectedIds.includes(task.id)) : tasks;
}

function isDuplicateTouch(candidate, existing) {
  return ["orderNo", "name", "phone", "message"].every((field) => candidate[field] === existing[field]);
}

function canManualRetry(task) {
  return task.result === "发送失败" && task.manualRetryCount === 0 && !task.retryQueueStatus;
}

function createManualRetryRecord(task, { batchName, operator, startedAt }) {
  if (!canManualRetry(task)) throw new Error("该任务不满足人工批量重发条件");
  return {
    ...task,
    result: "发送中",
    manualRetryCount: 1,
    retryQueueStatus: "发送中",
    retryBatchName: batchName,
    updatedAt: startedAt,
    sendLogs: [...task.sendLogs, { type: "人工批量重发", result: "发送中", batchName, operator, at: startedAt, failureReason: task.failureReason }],
  };
}

function resolveFinalFailureReason(task) {
  const latestLog = task.sendLogs?.at(-1);
  return latestLog?.result === "发送失败" ? (latestLog.failureReason || task.failureReason || "") : "";
}

const sampleMessage = "【债转通知】您好，您申请的租赁业务相关应付款已由宁波晓程企业管理有限公司代为偿还，现依法向您进行债务追偿。请及时关注并处理。";
const now = "2026-08-05 14:30";
const contentErrorTypes = [
  { code: "REQUIRED_ORDER_NO", item: "必填字段", scenario: "订单编号为空", rule: "订单编号未填写或仅包含空格", result: "该行不进入发送队列" },
  { code: "REQUIRED_NAME", item: "必填字段", scenario: "客户姓名为空", rule: "客户姓名未填写或仅包含空格", result: "该行不进入发送队列" },
  { code: "REQUIRED_PHONE", item: "必填字段", scenario: "手机号为空", rule: "手机号未填写或仅包含空格", result: "该行不进入发送队列" },
  { code: "REQUIRED_MESSAGE", item: "必填字段", scenario: "短信内容为空", rule: "短信内容未填写或仅包含空格", result: "该行不进入发送队列" },
  { code: "ORDER_SETTLED", item: "订单状态", scenario: "订单已结清", rule: "订单实时状态为已结清", result: "不允许发送" },
  { code: "PHONE_INVALID", item: "手机号", scenario: "手机号格式错误", rule: "不符合 11 位中国大陆手机号规范", result: "该行不进入发送队列" },
  { code: "DUPLICATE_TOUCH", item: "重复触达", scenario: "重复触达", rule: "订单编号、客户姓名、手机号、短信内容四项完全一致", result: "该行不进入发送队列" },
];
const contentErrorSummary = [
  ["必填字段", 1500],
  ["订单状态", 1100],
  ["手机号", 900],
  ["重复触达", 500],
];
const contentErrorPreview = [
  [18, "DZ2026080017", "手机号", "手机号格式错误"],
  [76, "DZ2026080075", "订单状态", "订单已结清，不允许发送"],
  [121, "-", "必填字段", "订单编号、客户姓名、手机号、短信内容为空"],
  [238, "DZ2026080237", "重复触达", "订单编号、客户姓名、手机号、短信内容四项完全一致"],
  [509, "DZ2026080508", "手机号", "手机号格式错误"],
  [884, "-", "必填字段", "手机号为空"],
  [1260, "DZ2026081259", "订单状态", "订单已结清，不允许发送"],
  [2076, "DZ2026082075", "重复触达", "订单编号、客户姓名、手机号、短信内容四项完全一致"],
  [3321, "-", "必填字段", "短信内容为空"],
  [4988, "DZ2026084987", "手机号", "手机号格式错误"],
];

const state = {
  activeView: "batches",
  validationDemo: "success",
  draftName: "债转短信_20260805_1430",
  fileName: "整理完后.xlsx",
  batches: [
    {
      id: "B001",
      name: "债转短信_20260805_1430",
      fileName: "整理完后.xlsx",
      importedAt: "2026-08-05 14:30",
      importer: "当前用户",
      total: 119,
      valid: 119,
      rejected: 1,
      success: 0,
      failed: 0,
      awaitingReceipt: 0,
      status: "待执行",
      updatedAt: "2026-08-05 14:30",
      renameLogs: [],
    },
    {
      id: "B000",
      name: "债转短信_20260801_1000",
      fileName: "债转通知示例.xlsx",
      importedAt: "2026-08-01 10:00",
      importer: "王小组",
      total: 5,
      valid: 5,
      rejected: 0,
      success: 3,
      failed: 1,
      awaitingReceipt: 1,
      status: "已完成",
      updatedAt: "2026-08-01 10:18",
      renameLogs: [{ oldName: "债转短信_20260801_1000", newName: "八月债转通知试运行", operator: "王小组", changedAt: "2026-08-01 10:20" }],
    },
  ],
  tasks: [
    makeTask(1, "B000", "发送成功", "已留存", 0, "2026-08-01 10:05"),
    makeTask(2, "B000", "发送成功", "已留存", 0, "2026-08-01 10:07"),
    makeTask(3, "B000", "发送成功", "已留存", 0, "2026-08-01 10:09"),
    makeTask(4, "B000", "发送失败", "无凭证", 2, "2026-08-01 10:12"),
    makeTask(5, "B000", "待回执", "无凭证", 0, "2026-08-01 10:18"),
  ],
  selectedTaskId: null,
  selectedTaskIds: [],
  page: 1,
  pageSize: 10,
  filters: { orderNo: "", name: "", batchId: "", result: "", evidence: "" },
  batchFilters: { orderNo: "", name: "", phone: "", batchName: "" },
};

function makeTask(index, batchId, result = "发送中", evidence = "无凭证", retry = 0, updatedAt = now) {
  const suffix = String(index).padStart(4, "0");
  return {
    id: `${batchId}-T${suffix}`,
    orderNo: `DZ202608${suffix}`,
    name: `客户${String.fromCharCode(64 + ((index - 1) % 26) + 1)}`,
    phone: `138****${String(1000 + index).slice(-4)}`,
    phoneFull: `1380000${String(1000 + index).slice(-4)}`,
    senderDeviceNo: "SMS-ANDROID-01",
    senderPhone: "15600000001",
    message: sampleMessage,
    batchId,
    result,
    evidence,
    retry,
    manualRetryCount: 0,
    retryQueueStatus: "",
    updatedAt,
    failureReason: result === "发送失败" ? "手机明确返回：短信发送失败" : "",
    sendLogs: [{ type: "自动发送", result, at: updatedAt, failureReason: result === "发送失败" ? "手机明确返回：短信发送失败" : "" }],
  };
}

const menu = [
  ["⌂", "首页"],
  ["▣", "诉讼工作台"],
  ["□", "法诉材料管理"],
  ["▤", "待委外管理"],
  ["⚖", "诉讼管理"],
  ["✉", "短信通知"],
];
const views = [
  ["batches", "批次管理"],
  ["records", "任务记录"],
];

const header = document.querySelector("#page-header");
const content = document.querySelector("#page-content");
const menuRoot = document.querySelector("#menu");
const modalRoot = document.querySelector("#modal-root");
const drawerRoot = document.querySelector("#drawer-root");
const toastRoot = document.querySelector("#toast-root");

function batchById(id) {
  return state.batches.find((batch) => batch.id === id);
}

function tag(text, className) {
  return `<span class="tag ${className}">${text}</span>`;
}

function resultTag(result) {
  const classes = { "发送中": "status-running", "发送成功": "status-success", "发送失败": "status-failed", "待回执": "status-awaiting-receipt" };
  return tag(result, classes[result] || "status-pending");
}

function evidenceTag(evidence) {
  const classes = { "已留存": "evidence-ready", "无凭证": "evidence-na" };
  return tag(evidence, classes[evidence] || "evidence-na");
}

function renderWithRightNote(main, title, items) {
  return `<div class="page-with-note"><div class="page-main">${main}</div><aside class="right-note"><h3>备注说明</h3><h4>${title}</h4>${items.map((item, index) => `<p><b>${index + 1}.</b> ${item}</p>`).join("")}</aside></div>`;
}

function renderGroupedRightNote(main, title, groups) {
  return `<div class="page-with-note"><div class="page-main">${main}</div><aside class="right-note"><h3>备注说明</h3>${title ? `<h4>${title}</h4>` : ""}${groups.map((group) => `<section class="note-group"><h5>${group.title}</h5>${group.controls || ""}${group.items.map((item, index) => `<p><b>${index + 1}.</b> ${item}</p>`).join("")}</section>`).join("")}</aside></div>`;
}

function render() {
  menuRoot.innerHTML = menu
    .map(([icon, text]) => `<button class="nav-item ${text === "短信通知" ? "active" : ""}" type="button"><span class="nav-icon">${icon}</span>${text}</button>`)
    .join("");

  header.innerHTML = `
    <div class="breadcrumb"><span>诉讼工作台</span><span>/</span><span>短信通知</span></div>
    <div class="page-title-row"><div><h1>短信通知</h1><p class="subtitle">导入短信任务、启动固定手机串行发送，并留存可追溯的发送凭证。</p></div></div>
    <div class="tabs">${views.map(([id, label]) => `<button class="tab ${state.activeView === id ? "active" : ""}" data-view="${id}">${label}</button>`).join("")}</div>`;

  content.innerHTML = state.activeView === "import" ? renderImport() : state.activeView === "batches" ? renderBatches() : renderRecords();
  bindEvents();
}

function renderImport() {
  const batch = batchById("B001");
  const main = `
    <section class="card">
      <div class="toolbar"><h2 class="section-title" style="margin:0">新建发送批次</h2><button class="button" id="back-to-batches">返回批次管理</button></div>
      <div class="form-grid"><div class="form-item"><label class="required" for="batch-name">批次名称</label><input id="batch-name" maxlength="50" value="${escapeHtml(state.draftName)}" /><p class="helper">发送后仍可在“批次管理”中维护名称，系统将记录每次修改。</p></div></div>
      <div class="form-item" style="margin-top:20px"><label class="required">Excel 文件</label><div class="upload-box"><label class="upload-label" for="excel-file">⇧<strong>点击上传或拖拽 Excel 文件</strong><span class="helper">支持 .xlsx；单批最多 5000 条；上传后自动校验</span></label><input id="excel-file" type="file" /></div><div class="file-actions"><p class="helper">已选择：<strong id="file-name">${escapeHtml(state.fileName)}</strong></p><button class="link" id="download-template">下载模板</button></div></div>
    </section>
    ${renderValidationPanel(batch)}`;
  return renderGroupedRightNote(main, "导入规则说明", [
    {
      title: "状态演示（仅供原型查看）",
      controls: `<div class="note-demo-switch" role="group" aria-label="校验结果状态演示"><button class="note-demo-button ${state.validationDemo === "success" ? "active" : ""}" data-validation-demo="success">正常结果</button><button class="note-demo-button ${state.validationDemo === "format" ? "active" : ""}" data-validation-demo="format">格式错误</button><button class="note-demo-button ${state.validationDemo === "content" ? "active" : ""}" data-validation-demo="content">内容错误</button></div>`,
      items: ["此切换仅用于演示不同校验结果，正式上线页面不展示。"],
    },
    {
      title: "文件与数量限制",
      items: [
        "仅支持可正常读取、未损坏且未加密的 .xlsx 文件。",
        "每个批次最多导入 5000 条非空数据（不含表头），一次执行发送最多 5000 条。",
        "超过 5000 条时整份文件校验失败，不自动截断或拆分，不创建任务；提示拆分文件后重新上传。",
      ],
    },
    {
      title: "表格格式校验",
      items: [
        "订单编号、客户姓名、手机号、短信内容四个必填表头必须各出现一次，名称须完全一致；顺序不限，其他扩展列忽略。",
        "表头缺失、名称不一致、重复、为空或使用合并单元格时，判定表格格式校验失败。",
        "表头校验失败时，状态显示“文件校验失败”，用红色提示说明格式不正确并引导按模板修改后重新上传；不进入逐行校验，不展示可发送数，不创建任务，并禁用“执行发送”。",
        "重新上传符合模板的文件后自动重新校验。",
      ],
    },
    {
      title: "自动校验流程",
      items: [
        "上传 Excel 后自动校验，不设置独立“开始校验”按钮。",
        "文件选择后先做文件类型、大小、表头和必填字段检查，再自动发起后台完整校验。",
        "校验期间显示“正在校验”和进度；完成后展示总数、可发送数、问题数及问题清单。",
        "重新上传自动重新校验；仅校验服务异常时提供“重新校验”。",
      ],
    },
    {
      title: "校验结果与处理",
      items: [
        "格式错误仅采用文件级红色提示说明原因和处理方式，不额外展示重新上传按钮或表头差异表；整份文件阻断，不展示可发送数和逐行问题，不创建任务，并禁用执行发送。",
        "内容错误采用黄色提示，展示总数、可发送数、问题数和错误类型分布；主页面最多预览前 10 条问题，不渲染完整长列表或大量分页。",
        "完整问题通过“下载错误明细”导出；错误 Excel 包含“错误数据明细”和“错误类型说明”两个 Sheet。",
        "错误数据明细保留原 Excel 行号和原始业务字段；同一行存在多个错误时，每个问题单独一行。",
        "错误类型说明列出：订单编号为空、客户姓名为空、手机号为空、短信内容为空、订单已结清、手机号格式错误、重复触达。格式错误不生成错误明细 Excel。",
        "问题数据不进入队列，有效数据仍可执行发送；问题类型数量按命中行统计，同一行可命中多个类型，因此类型数量之和可能大于问题数据条数。",
        "内容校验后可发送数为 0 时，显示“无可发送数据”并禁用执行发送。",
        "校验服务异常不归类为格式错误或内容错误，应单独提示服务异常并提供“重新校验”。",
      ],
    },
    {
      title: "业务校验与发送",
      items: [
        "导入文件须包含订单编号、客户姓名、手机号、短信内容四项必填字段。",
        "重复触达以订单编号、姓名、手机号、短信内容四项完全一致为判断条件。",
        "问题数据不可进入发送队列。",
        "执行发送前实时复核订单是否结清、手机号和发送资格；不通过的数据剔除并提示原因。",
      ],
    },
  ]);
}

function renderValidationPanel(batch) {
  const isPending = batch.status === "待执行";
  if (state.validationDemo === "format") {
    return `<section class="card validation-panel">
      <div class="validation-line"><div class="validation-file"><strong>${escapeHtml(state.fileName)}</strong>${tag("文件校验失败", "status-failed")}</div></div>
      <div class="format-error-panel"><strong>表格格式不正确，无法继续校验</strong><p>必填表头与导入模板不一致，请按模板修改文件后重新上传。</p></div>
      <div class="button-row"><button class="button primary" id="execute-send" disabled title="请先上传符合模板的文件">执行发送</button></div>
    </section>`;
  }

  const hasContentErrors = state.validationDemo === "content";
  const statusText = hasContentErrors ? "校验完成，存在问题" : "校验完成";
  const statusClass = hasContentErrors ? "status-awaiting-receipt" : "status-success";
  const validationStats = hasContentErrors
    ? '<div class="validation-stats"><span>共 <b>5000</b> 条</span><span class="good">可发送 <b>1000</b> 条</span><span class="bad">问题 <b>4000</b> 条</span></div>'
    : '<div class="validation-stats"><span>共 <b>120</b> 条</span><span class="good">可发送 <b>119</b> 条</span><span class="bad">问题 <b>1</b> 条</span></div>';
  const executeLabel = hasContentErrors ? "执行发送 1000 条" : "执行发送 119 条";
  const problemRows = hasContentErrors
    ? contentErrorPreview.map(([row, orderNo, item, reason]) => `<tr><td>${row}</td><td>${orderNo}</td><td>${tag(item, "status-failed")}</td><td>${reason}</td></tr>`).join("")
    : `<tr><td>121</td><td>-</td><td>${tag("必填字段", "status-failed")}</td><td>订单编号、姓名、手机号、短信内容为空</td></tr>`;
  const issueSummary = hasContentErrors
    ? `<div class="issue-summary"><strong>问题类型分布</strong>${contentErrorSummary.map(([item, count]) => `<span>${item}<b>${count}</b></span>`).join("")}<small>同一行可命中多个类型</small></div>`
    : "";
  return `<section class="card validation-panel">
    <div class="validation-line"><div class="validation-file"><strong>${escapeHtml(state.fileName)}</strong>${tag(statusText, statusClass)}</div>${validationStats}</div>
    ${hasContentErrors ? '<div class="content-warning-line"><strong>部分数据未通过校验</strong><span>4000 条问题数据不会进入发送队列，其余 1000 条可继续发送。</span></div>' : ""}
    <p class="validation-scope">文件与表头校验通过后，已校验：必填字段、订单状态、手机号、重复触达（四项完全一致）、短信内容。</p>
    ${issueSummary}
    <div class="issue-list"><div class="issue-header"><h2 class="section-title">${hasContentErrors ? "问题数据预览（前 10 条）" : "校验问题清单"}</h2><span class="muted">${hasContentErrors ? "完整 4000 条请下载错误明细" : "问题数据不会进入发送队列"}</span></div><div class="table-wrap"><table><thead><tr><th>Excel 行号</th><th>订单编号</th><th>校验项</th><th>问题原因</th></tr></thead><tbody>${problemRows}</tbody></table></div>${hasContentErrors ? '<p class="issue-preview-note">页面固定展示前 10 条，仅用于快速核对；完整问题及全部错误类型请下载 Excel。</p>' : ""}</div>
    <div class="button-row">${hasContentErrors ? '<button class="button" id="download-error-details">下载错误明细</button>' : ""}<button class="button primary" id="execute-send" ${!isPending ? "disabled" : ""}>${isPending ? executeLabel : "已启动发送"}</button></div>
  </section>`;
}

function renderBatches() {
  const visibleBatches = filterBatches(state.batches, state.tasks, state.batchFilters);
  const rows = visibleBatches.map((batch) => {
    const statusClass = batch.status === "发送中" ? "status-running" : batch.status === "待执行" ? "status-pending" : "status-success";
    return `<tr><td><strong>${escapeHtml(batch.name)}</strong></td><td>${escapeHtml(batch.fileName)}</td><td>${batch.importedAt}</td><td>${batch.total}</td><td>${batch.success}</td><td>${batch.failed}</td><td>${batch.awaitingReceipt}</td><td>${tag(batch.status, statusClass)}</td><td>${batch.updatedAt}</td><td><button class="link" data-action="rename" data-id="${batch.id}">维护名称</button>　<button class="link" data-action="batch-tasks" data-id="${batch.id}">查看任务</button></td></tr>`;
  }).join("");
  const tableRows = rows || '<tr><td colspan="10" class="empty">暂无符合搜索条件的批次</td></tr>';
  const main = `<section class="card"><div class="toolbar"><div><h2 class="section-title" style="margin-bottom:4px">批次管理</h2></div><button class="button primary" id="open-import">任务导入</button></div><div class="filters batch-filters"><div class="filter"><label for="batch-filter-order">订单编号</label><input id="batch-filter-order" data-batch-filter placeholder="精确输入订单编号" value="${escapeHtml(state.batchFilters.orderNo)}" /></div><div class="filter"><label for="batch-filter-name">客户姓名</label><input id="batch-filter-name" data-batch-filter placeholder="精确输入客户姓名" value="${escapeHtml(state.batchFilters.name)}" /></div><div class="filter"><label for="batch-filter-phone">手机号</label><input id="batch-filter-phone" data-batch-filter placeholder="精确输入手机号" value="${escapeHtml(state.batchFilters.phone)}" /></div><div class="filter"><label for="batch-filter-name-keyword">批次名称</label><input id="batch-filter-name-keyword" data-batch-filter placeholder="模糊输入批次名称" value="${escapeHtml(state.batchFilters.batchName)}" /></div><div class="filter-actions"><button class="button primary" id="batch-search">查询</button><button class="button" id="batch-reset">重置</button></div></div><div class="table-wrap"><table><thead><tr><th>批次名称</th><th>原文件名</th><th>导入时间</th><th>总任务</th><th>成功</th><th>失败</th><th>待回执</th><th>执行状态</th><th>最后更新时间</th><th>操作</th></tr></thead><tbody>${tableRows}</tbody></table></div></section>`;
  return renderGroupedRightNote(main, "", [
    {
      title: "批次查询说明",
      items: [
        "订单编号、客户姓名、手机号均为精确查询；批次名称支持模糊查询。",
        "订单号命中批次内任一任务时，返回该任务所属的完整批次。",
      ],
    },
    {
      title: "列表区说明",
      items: [
        "批次名称可维护，名称变更不影响任务归属、发送记录及证据凭证。",
        "执行状态：【待执行：已导入、校验完成，尚未点击执行发送。发送中：已启动 JOB，正在按固定手机串行发送。已完成：该批次内任务全部处理结束。】",
      ],
    },
  ]);
}

function renderRecords() {
  const visible = filterTasks(state.tasks, state.filters);
  const paginated = paginateTasks(visible, state.page, state.pageSize);
  state.page = paginated.page;
  const batchOptions = state.batches.map((batch) => `<option value="${batch.id}" ${state.filters.batchId === batch.id ? "selected" : ""}>${escapeHtml(batch.name)}</option>`).join("");
  const rows = paginated.items.length ? paginated.items.map((task) => {
    const checked = state.selectedTaskIds.includes(task.id) ? "checked" : "";
    return `<tr><td><input type="checkbox" data-task-select="${task.id}" ${checked} aria-label="选择${task.orderNo}" /></td><td>${task.orderNo}</td><td>${task.name}</td><td>${task.phone}</td><td>${task.senderDeviceNo}</td><td>${task.senderPhone}</td><td>${escapeHtml(batchById(task.batchId)?.name || "-")}</td><td>${resultTag(task.result)}</td><td>${evidenceTag(task.evidence)}</td><td>${task.retry + task.manualRetryCount}</td><td>${task.updatedAt}</td><td><button class="link" data-action="detail" data-id="${task.id}">查看详情</button></td></tr>`;
  }).join("") : '<tr><td colspan="12" class="empty">暂无符合当前筛选条件的任务</td></tr>';
  const allSelected = paginated.items.length > 0 && paginated.items.every((task) => state.selectedTaskIds.includes(task.id));
  const retrySelectedCount = state.tasks.filter((task) => state.selectedTaskIds.includes(task.id) && canManualRetry(task)).length;
  const pagination = `<div class="pagination"><span>共 ${paginated.total} 条</span><label>每页 <select id="page-size"><option value="10" ${state.pageSize === 10 ? "selected" : ""}>10</option><option value="20" ${state.pageSize === 20 ? "selected" : ""}>20</option><option value="50" ${state.pageSize === 50 ? "selected" : ""}>50</option></select> 条</label><button class="button small" data-page="${paginated.page - 1}" ${paginated.page === 1 ? "disabled" : ""}>上一页</button><span>第 ${paginated.page} / ${paginated.totalPages} 页</span><button class="button small" data-page="${paginated.page + 1}" ${paginated.page === paginated.totalPages ? "disabled" : ""}>下一页</button></div>`;
  const main = `<section class="card records-card"><div class="toolbar records-toolbar"><div class="filters"><div class="filter"><label for="filter-order">订单编号</label><input id="filter-order" data-task-filter placeholder="请输入订单编号" value="${escapeHtml(state.filters.orderNo)}" /></div><div class="filter"><label for="filter-name">客户姓名</label><input id="filter-name" data-task-filter placeholder="请输入客户姓名" value="${escapeHtml(state.filters.name)}" /></div><div class="filter"><label for="filter-batch">批次名称</label><select id="filter-batch" data-task-filter><option value="">全部批次</option>${batchOptions}</select></div><div class="filter"><label for="filter-result">发送状态</label><select id="filter-result" data-task-filter><option value="">全部状态</option><option ${state.filters.result === "发送中" ? "selected" : ""}>发送中</option><option ${state.filters.result === "待回执" ? "selected" : ""}>待回执</option><option ${state.filters.result === "发送成功" ? "selected" : ""}>发送成功</option><option ${state.filters.result === "发送失败" ? "selected" : ""}>发送失败</option></select></div><div class="filter"><label for="filter-evidence">凭证状态</label><select id="filter-evidence" data-task-filter><option value="">全部状态</option><option ${state.filters.evidence === "已留存" ? "selected" : ""}>已留存</option><option ${state.filters.evidence === "无凭证" ? "selected" : ""}>无凭证</option></select></div></div><div class="toolbar-actions"><button class="button primary" id="task-search">查询</button><button class="button" id="task-reset">重置</button><span class="toolbar-divider"></span><button class="button" id="retry-selected" ${retrySelectedCount ? "" : "disabled"}>批量重新发送${retrySelectedCount ? ` (${retrySelectedCount})` : ""}</button><button class="button primary" id="download-evidence">下载证据</button></div></div><p class="helper">当前筛选结果：${visible.length} 条。选择任务后，下载证据导出选中任务的任务列表和发送成功凭证；未选择时导出当前筛选结果。</p><div class="table-wrap"><table><thead><tr><th><input id="select-all-tasks" type="checkbox" ${allSelected ? "checked" : ""} ${paginated.items.length ? "" : "disabled"} aria-label="全选本页任务" /></th><th>订单编号</th><th>姓名</th><th>手机号</th><th>发送设备编号</th><th>发送手机号</th><th>批次名称</th><th>发送状态</th><th>发送凭证</th><th>重试次数</th><th>最后更新时间</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>${pagination}</section>`;
  return renderGroupedRightNote(main, "任务处理说明", [
    {
      title: "状态说明",
      items: [
        "发送中：任务已进入前端固定手机的串行处理队列，尚未真正发出短信。",
        "待回执：手机已发起发送，等待手机或通道回传最终成功或失败结果。",
        "发送成功、发送失败：已取得最终发送结果。",
      ],
    },
    {
      title: "手工批量重发",
      items: [
        "仅发送失败且最新一次未发送成功的任务可手工批量重发。",
        "发送成功、发送中、待回执的任务均不可再次触发手工批量重发。",
        "单条任务最多人工重发 1 次；重发操作保留原发送记录，并新增人工批量重发记录。",
      ],
    },
    {
      title: "证据下载",
      items: [
        "每行均可选择；选择仅作用于当前操作。未选择任务时，下载当前筛选范围内的全部任务。",
        "下载证据包含任务列表 Excel，以及当前操作范围内发送成功任务的凭证压缩包。",
        "发送成功任务自动留存发送截图；截图命名为：订单号_姓名_发送凭证.jpg。",
      ],
    },
  ]);
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { state.activeView = button.dataset.view; render(); }));
  document.querySelector("#open-import")?.addEventListener("click", () => { state.activeView = "import"; render(); });
  document.querySelector("#back-to-batches")?.addEventListener("click", () => { state.activeView = "batches"; render(); });
  document.querySelector("#excel-file")?.addEventListener("change", (event) => { state.fileName = event.target.files?.[0]?.name || state.fileName; state.validationDemo = "success"; render(); showToast("文件已选择，已自动完成校验"); });
  document.querySelectorAll("[data-validation-demo]").forEach((button) => button.addEventListener("click", () => { state.validationDemo = button.dataset.validationDemo; render(); }));
  document.querySelector("#download-template")?.addEventListener("click", downloadTemplate);
  document.querySelector("#batch-name")?.addEventListener("input", (event) => { state.draftName = event.target.value; });
  document.querySelector("#download-error-details")?.addEventListener("click", showErrorWorkbookModal);
  document.querySelector("#execute-send")?.addEventListener("click", showExecuteModal);
  document.querySelectorAll("[data-action='rename']").forEach((button) => button.addEventListener("click", () => showRenameModal(button.dataset.id)));
  document.querySelectorAll("[data-action='batch-tasks']").forEach((button) => button.addEventListener("click", () => { state.filters.batchId = button.dataset.id; state.activeView = "records"; render(); }));
  document.querySelectorAll("[data-action='detail']").forEach((button) => button.addEventListener("click", () => openDrawer(button.dataset.id)));
  document.querySelector("#download-evidence")?.addEventListener("click", showEvidenceModal);
  document.querySelectorAll("[data-task-select]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    const id = checkbox.dataset.taskSelect;
    state.selectedTaskIds = checkbox.checked ? [...new Set([...state.selectedTaskIds, id])] : state.selectedTaskIds.filter((taskId) => taskId !== id);
    render();
  }));
  document.querySelector("#select-all-tasks")?.addEventListener("change", (event) => {
    const pageIds = paginateTasks(filterTasks(state.tasks, state.filters), state.page, state.pageSize).items.map((task) => task.id);
    state.selectedTaskIds = event.target.checked ? [...new Set([...state.selectedTaskIds, ...pageIds])] : state.selectedTaskIds.filter((id) => !pageIds.includes(id));
    render();
  });
  document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => { state.page = Number(button.dataset.page); render(); }));
  document.querySelector("#page-size")?.addEventListener("change", (event) => { state.pageSize = Number(event.target.value); state.page = 1; render(); });
  document.querySelector("#retry-selected")?.addEventListener("click", showRetryModal);
  document.querySelector("#batch-search")?.addEventListener("click", applyBatchSearch);
  document.querySelector("#batch-reset")?.addEventListener("click", resetBatchSearch);
  document.querySelector("#task-search")?.addEventListener("click", applyTaskSearch);
  document.querySelector("#task-reset")?.addEventListener("click", resetTaskSearch);
  document.querySelectorAll("[data-batch-filter], [data-task-filter]").forEach((field) => field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") (field.hasAttribute("data-batch-filter") ? applyBatchSearch : applyTaskSearch)();
  }));
}

function applyBatchSearch() {
  state.batchFilters = {
    orderNo: document.querySelector("#batch-filter-order")?.value.trim() || "",
    name: document.querySelector("#batch-filter-name")?.value.trim() || "",
    phone: document.querySelector("#batch-filter-phone")?.value.trim() || "",
    batchName: document.querySelector("#batch-filter-name-keyword")?.value.trim() || "",
  };
  render();
}

function resetBatchSearch() {
  state.batchFilters = { orderNo: "", name: "", phone: "", batchName: "" };
  render();
}

function applyTaskSearch() {
  state.filters = {
    orderNo: document.querySelector("#filter-order")?.value.trim() || "",
    name: document.querySelector("#filter-name")?.value.trim() || "",
    batchId: document.querySelector("#filter-batch")?.value || "",
    result: document.querySelector("#filter-result")?.value || "",
    evidence: document.querySelector("#filter-evidence")?.value || "",
  };
  state.selectedTaskIds = [];
  state.page = 1;
  render();
}

function resetTaskSearch() {
  state.filters = { orderNo: "", name: "", batchId: "", result: "", evidence: "" };
  state.selectedTaskIds = [];
  state.page = 1;
  render();
}

function showRetryModal() {
  const selected = state.tasks.filter((task) => state.selectedTaskIds.includes(task.id) && canManualRetry(task));
  if (!selected.length) return showToast("请选择可人工重发的失败任务");
  const batchName = "人工重发_20260806_1000";
  const details = selected.map((task) => `<tr><td>${task.orderNo}</td><td>${task.name}</td><td>${escapeHtml(resolveFinalFailureReason(task))}</td><td>${task.retry}</td></tr>`).join("");
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal wide-modal"><h2>确认批量重新发送？</h2><p>已选择 <strong>${selected.length}</strong> 条失败任务，将以“${batchName}”进入固定手机串行队列。</p><div class="table-wrap compact-table"><table><thead><tr><th>订单编号</th><th>客户姓名</th><th>失败原因</th><th>已自动重试</th></tr></thead><tbody>${details}</tbody></table></div><div class="button-row"><button class="button" data-close>取消</button><button class="button primary" id="confirm-retry">确认并进入队列</button></div></section></div>`;
  modalRoot.querySelector("[data-close]").onclick = closeModal;
  modalRoot.querySelector("#confirm-retry").onclick = () => startManualRetry(selected, batchName);
}

function startManualRetry(tasks, batchName) {
  const startedAt = "2026-08-06 10:00";
  tasks.forEach((task) => Object.assign(task, createManualRetryRecord(task, { batchName, operator: "当前用户", startedAt })));
  state.selectedTaskIds = [];
  closeModal();
  render();
  showToast(`已将 ${tasks.length} 条任务加入固定手机串行重发队列`);
  window.setTimeout(() => {
    tasks.forEach((task) => {
      task.result = "发送成功";
      task.evidence = "已留存";
      task.retryQueueStatus = "";
      task.updatedAt = "2026-08-06 10:02";
      const latestLog = task.sendLogs.at(-1);
      Object.assign(latestLog, { result: "发送成功", completedAt: task.updatedAt });
    });
    render();
    showToast("演示重发完成，新的发送凭证已留存");
  }, 1800);
}

function showExecuteModal() {
  const name = state.draftName.trim();
  if (!name) return showToast("请先填写批次名称");
  if (state.validationDemo === "format") return showToast("请先上传符合模板的文件");
  const sendableCount = state.validationDemo === "content" ? 1000 : 119;
  const rejectedCount = state.validationDemo === "content" ? 4000 : 1;
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal"><h2>确认执行发送？</h2><p>将以批次“<strong>${escapeHtml(name)}</strong>”创建 ${sendableCount} 条有效任务，并立即启动固定手机串行 Job。未通过校验的 ${rejectedCount} 条数据不会进入发送队列。</p><div class="button-row"><button class="button" data-close>取消</button><button class="button primary" id="confirm-send">确认并启动 Job</button></div></section></div>`;
  modalRoot.querySelector("[data-close]").onclick = closeModal;
  modalRoot.querySelector("#confirm-send").onclick = startJob;
}

function startJob() {
  const batch = batchById("B001");
  const sendableCount = state.validationDemo === "content" ? 1000 : 119;
  batch.name = state.draftName.trim();
  batch.fileName = state.fileName;
  batch.total = sendableCount;
  batch.valid = sendableCount;
  batch.rejected = state.validationDemo === "content" ? 3 : 1;
  batch.status = "发送中";
  batch.updatedAt = "2026-08-05 14:32";
  if (!state.tasks.some((task) => task.batchId === "B001")) {
    for (let index = 1; index <= sendableCount; index += 1) {
      const result = index % 23 === 0 ? "待回执" : index % 17 === 0 ? "发送失败" : "发送成功";
      const evidence = result === "发送成功" && index % 19 !== 0 ? "已留存" : "无凭证";
      state.tasks.unshift(makeTask(index, "B001", result, evidence, result === "发送失败" ? 2 : 0, "2026-08-05 14:32"));
    }
    batch.success = state.tasks.filter((task) => task.batchId === "B001" && task.result === "发送成功").length;
    batch.failed = state.tasks.filter((task) => task.batchId === "B001" && task.result === "发送失败").length;
    batch.awaitingReceipt = state.tasks.filter((task) => task.batchId === "B001" && task.result === "待回执").length;
  }
  closeModal();
  state.activeView = "records";
  state.filters = { orderNo: "", name: "", batchId: "B001", result: "", evidence: "" };
  render();
  showToast("Job 已启动：任务正在由固定手机串行发送");
  window.setTimeout(() => { batch.status = "已完成"; batch.updatedAt = "2026-08-05 14:36"; render(); showToast("演示 Job 已完成，发送凭证已同步留存"); }, 2400);
}

function showErrorWorkbookModal() {
  const errorTypeRows = contentErrorTypes.map((type) => `<tr><td>${type.code}</td><td>${type.item}</td><td>${type.scenario}</td><td>${type.rule}</td><td>${type.result}</td></tr>`).join("");
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal wide-modal error-workbook-modal"><h2>下载错误明细</h2><p>将生成 <strong>短信通知_导入错误明细.xlsx</strong>，包含 4000 条问题数据和以下两个 Sheet。</p><div class="workbook-sheets"><div class="workbook-sheet"><span class="excel-mark">XLSX</span><div><strong>错误数据明细</strong><p>原 Excel 行号、订单编号、客户姓名、手机号、短信内容、校验项、问题原因。同一行存在多个错误时，每个问题单独一行。</p></div></div><div class="workbook-sheet"><span class="excel-mark">SHEET</span><div><strong>错误类型说明</strong><p>类型编码、校验项、错误场景、判定规则、处理结果。</p></div></div></div><div class="table-wrap error-type-table"><table><thead><tr><th>类型编码</th><th>校验项</th><th>错误场景</th><th>判定规则</th><th>处理结果</th></tr></thead><tbody>${errorTypeRows}</tbody></table></div><div class="button-row"><button class="button" data-close>取消</button><button class="button primary" id="confirm-error-download">确认下载</button></div></section></div>`;
  modalRoot.querySelector("[data-close]").onclick = closeModal;
  modalRoot.querySelector("#confirm-error-download").onclick = () => {
    closeModal();
    showToast("原型演示：错误明细 Excel 已生成，包含 2 个 Sheet");
  };
}

function showRenameModal(batchId) {
  const batch = batchById(batchId);
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal"><h2>维护批次名称</h2><div class="form-item"><label class="required" for="rename-value">新批次名称</label><input id="rename-value" maxlength="50" value="${escapeHtml(batch.name)}" /></div><div class="button-row"><button class="button" data-close>取消</button><button class="button primary" id="confirm-rename">保存名称</button></div></section></div>`;
  modalRoot.querySelector("[data-close]").onclick = closeModal;
  modalRoot.querySelector("#confirm-rename").onclick = () => {
    try {
      const updated = renameBatch(batch, modalRoot.querySelector("#rename-value").value, "当前用户", "2026-08-05 14:35");
      Object.assign(batch, updated, { updatedAt: "2026-08-05 14:35" });
      closeModal(); render(); showToast("批次名称已保存，并写入修改记录");
    } catch (error) { showToast(error.message); }
  };
}

function showEvidenceModal() {
  const visible = filterTasks(state.tasks, state.filters);
  const targets = resolveEvidenceDownloadTasks(visible, state.selectedTaskIds);
  const manifest = buildEvidenceManifest(targets);
  const spreadsheet = buildEvidenceSpreadsheet(targets);
  const selected = state.selectedTaskIds.length > 0;
  const listing = manifest.length ? manifest.join("\n") : "当前范围内没有发送成功任务";
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal wide-modal evidence-modal"><h2>下载证据</h2><p>${selected ? "已按选中条目" : "未选择条目，已按当前筛选结果"}生成以下文件。</p><div class="evidence-files"><div class="evidence-file"><strong>任务列表 Excel</strong><span>1 个文件，包含列表全部字段，共 ${spreadsheet.rows.length} 条。</span></div><div class="evidence-file"><strong>发送凭证压缩包</strong><span>1 个压缩包，包含所有发送成功任务的 ${manifest.length} 张截图。</span></div></div><p class="helper">截图命名：订单号_姓名_发送凭证.jpg</p><pre class="manifest">${escapeHtml(listing)}</pre><div class="button-row"><button class="button" data-close>取消</button><button class="button primary" id="confirm-download">确认下载</button></div></section></div>`;
  modalRoot.querySelector("[data-close]").onclick = closeModal;
  modalRoot.querySelector("#confirm-download").addEventListener("click", () => downloadEvidenceFiles(spreadsheet, manifest));
}

function downloadEvidenceFiles(spreadsheet, manifest) {
  const csv = "\uFEFF" + [spreadsheet.headers, ...spreadsheet.rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), "短信通知任务列表.csv");
  triggerDownload(new Blob([manifest.join("\n")], { type: "text/plain;charset=utf-8" }), "短信通知发送凭证压缩包清单.txt");
  closeModal();
  showToast("已下载任务列表 Excel 和发送凭证压缩包演示清单");
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

function downloadTemplate() {
  const contents = "\uFEFF订单编号,客户姓名,手机号,短信内容\nDZ2026080001,客户示例,13800000000,【债转通知】请填写实际短信内容";
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: "债转短信通知导入模板.csv" });
  link.click();
  URL.revokeObjectURL(url);
  showToast("导入模板已下载");
}

function openDrawer(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const batch = batchById(task.batchId);
  const showEvidence = task.evidence === "已留存";
  const finalFailureReason = resolveFinalFailureReason(task);
  const logs = task.sendLogs.map((log, index) => `<div class="timeline-item"><strong>${log.type}：${log.result}</strong><p>${log.at}${log.operator ? ` · 发起人：${log.operator}` : ""}${log.batchName ? ` · 重发批次：${log.batchName}` : ""}${index === task.sendLogs.length - 1 && finalFailureReason ? ` · 失败原因：${escapeHtml(finalFailureReason)}` : ""}</p></div>`).join("");
  drawerRoot.innerHTML = `<section class="drawer"><div class="drawer-header"><div><h2>发送任务详情</h2><p class="subtitle">${task.orderNo} · ${task.name}</p></div><button class="close" id="close-drawer" aria-label="关闭">×</button></div><dl class="detail-grid"><dt>导入批次</dt><dd>${escapeHtml(batch?.name || "-")}</dd><dt>收件手机号</dt><dd>${task.phoneFull}</dd><dt>发送状态</dt><dd>${resultTag(task.result)}</dd><dt>发送凭证</dt><dd>${evidenceTag(task.evidence)}</dd><dt>自动重试次数</dt><dd>${task.retry}</dd><dt>人工重发次数</dt><dd>${task.manualRetryCount}</dd><dt>短信内容</dt><dd>${escapeHtml(task.message)}</dd>${finalFailureReason ? `<dt>失败原因</dt><dd>${escapeHtml(finalFailureReason)}</dd>` : ""}</dl><h3 class="section-title" style="margin-top:24px">发送记录</h3><div class="timeline"><div class="timeline-item"><strong>导入校验通过</strong><p>${batch?.importedAt || now} · 已创建触达任务</p></div>${logs}${showEvidence ? '<div class="timeline-item"><strong>发送凭证已留存</strong><p>系统已关联固定手机原始短信界面截图</p></div>' : ""}</div>${showEvidence ? `<div class="evidence-preview"><strong>发送凭证截图</strong><p class="helper">原手机短信界面凭证（原型示意）</p><div class="phone"><div class="phone-top">短信 · ${task.phoneFull}</div><div class="sms-bubble">${escapeHtml(task.message)}<div class="sms-time">${task.updatedAt}</div></div></div></div>` : '<div class="notice">ⓘ 当前任务无凭证，暂不可下载。</div>'}</section>`;
  drawerRoot.querySelector("#close-drawer").onclick = () => { drawerRoot.innerHTML = ""; };
}

function closeModal() { modalRoot.innerHTML = ""; }
function showToast(message) { toastRoot.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`; window.setTimeout(() => { toastRoot.innerHTML = ""; }, 2500); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }

render();
