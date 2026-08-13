export function filterTasks(tasks, filters = {}) {
  return tasks.filter(
    (task) =>
      (!filters.result || task.result === filters.result) &&
      (!filters.evidence || task.evidence === filters.evidence) &&
      (!filters.batchId || task.batchId === filters.batchId) &&
      (!filters.orderNo || task.orderNo.includes(filters.orderNo)) &&
      (!filters.name || task.name.includes(filters.name)),
  );
}

export function filterBatches(batches, tasks, filters = {}) {
  return batches.filter((batch) => {
    if (filters.batchName && !batch.name.includes(filters.batchName)) return false;
    const hasTaskFilter = filters.orderNo || filters.name || filters.phone;
    if (!hasTaskFilter) return true;
    return tasks.some(
      (task) =>
        task.batchId === batch.id &&
        (!filters.orderNo || task.orderNo === filters.orderNo) &&
        (!filters.name || task.name === filters.name) &&
        (!filters.phone || task.phoneFull === filters.phone),
    );
  });
}

export function paginateTasks(tasks, page = 1, pageSize = 10) {
  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return { items: tasks.slice(start, start + pageSize), page: currentPage, pageSize, total, totalPages };
}

export function renameBatch(batch, newName, operator, changedAt) {
  const name = newName.trim();
  if (!name) throw new Error("批次名称不能为空");

  return {
    ...batch,
    name,
    renameLogs: [
      { oldName: batch.name, newName: name, operator, changedAt },
      ...batch.renameLogs,
    ],
  };
}

export function buildEvidenceManifest(tasks) {
  return tasks
    .filter((task) => task.result === "发送成功" && task.evidence === "已留存")
    .map((task) => `${task.orderNo}_${task.name}_发送凭证.jpg`);
}

export function buildEvidenceSpreadsheet(tasks, batches = []) {
  const batchNames = new Map(batches.map((batch) => [batch.id, batch.name]));
  const headers = ["订单编号", "姓名", "手机号", "发送设备编号", "发送手机号", "批次名称", "发送状态", "发送凭证", "重试次数", "最后更新时间"];
  const rows = tasks.map((task) => [
    task.orderNo,
    task.name,
    task.phoneFull,
    task.senderDeviceNo,
    task.senderPhone,
    batchNames.get(task.batchId) || "-",
    task.result,
    task.evidence,
    (task.retry || 0) + (task.manualRetryCount || 0),
    task.updatedAt,
  ]);
  return { headers, rows };
}

export function resolveEvidenceDownloadTasks(tasks, selectedIds = []) {
  return selectedIds.length ? tasks.filter((task) => selectedIds.includes(task.id)) : tasks;
}

export function isDuplicateTouch(candidate, existing) {
  return ["orderNo", "name", "phone", "message"].every(
    (field) => candidate[field] === existing[field],
  );
}

export function resolveFinalFailureReason(task) {
  const latestLog = task.sendLogs?.at(-1);
  return latestLog?.result === "发送失败" ? (latestLog.failureReason || task.failureReason || "") : "";
}

export function canManualRetry(task) {
  return task.result === "发送失败" && task.manualRetryCount === 0 && !task.retryQueueStatus;
}

export function createManualRetryRecord(task, { batchName, operator, startedAt }) {
  if (!canManualRetry(task)) throw new Error("该任务不满足人工批量重发条件");

  return {
    ...task,
    result: "发送中",
    manualRetryCount: 1,
    retryQueueStatus: "发送中",
    retryBatchName: batchName,
    updatedAt: startedAt,
    sendLogs: [
      ...(task.sendLogs || []),
      {
        type: "人工批量重发",
        result: "发送中",
        batchName,
        operator,
        at: startedAt,
        failureReason: task.failureReason,
      },
    ],
  };
}
