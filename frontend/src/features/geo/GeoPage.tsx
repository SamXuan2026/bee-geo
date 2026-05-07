import { useEffect, useState } from "react";
import { contentWriteRoles, hasAnyRole, permissionTitle } from "../../shared/permissions";
import type { UserRoleCode } from "../../shared/types";
import { ConfirmDialog, Modal, PageHeader, Panel, StatusBadge, Toolbar } from "../../shared/ui";
import { createDraftFromGeo, createGeoTask, getAiProviderStatus, getGeoRuntimeMode, listGeoReferences, listGeoTasks } from "./api";
import type { AiProviderStatus } from "./api";
import type { GeoReference, GeoTask } from "./model";

interface GeoPageProps {
  currentRole: UserRoleCode;
  onCreateDraft: (creationId: number) => void;
}

const geoSourceItems = [
  { label: "自有站点", value: 42, className: "normal" },
  { label: "行业媒体", value: 28, className: "testing" },
  { label: "问答社区", value: 18, className: "left" },
  { label: "竞品内容", value: 12, className: "damage" },
];

const geoSignalItems = [
  { label: "品牌曝光", value: "76", unit: "%", tone: "teal" },
  { label: "引用可信", value: "88", unit: "%", tone: "blue" },
  { label: "待补内容", value: "9", unit: "项", tone: "amber" },
];

const runtimeMode = getGeoRuntimeMode();
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TIMES = 60;

export function GeoPage({ currentRole, onCreateDraft }: GeoPageProps) {
  const [tasks, setTasks] = useState<GeoTask[]>([]);
  const [references, setReferences] = useState<GeoReference[]>([]);
  const [keyword, setKeyword] = useState("企业协同平台");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<GeoTask | null>(null);
  const [selectedReference, setSelectedReference] = useState<GeoReference | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoTask | null>(null);
  const [aiProviderStatus, setAiProviderStatus] = useState<AiProviderStatus | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const canWrite = hasAnyRole(currentRole, contentWriteRoles);
  const deniedTitle = permissionTitle(contentWriteRoles);

  useEffect(() => {
    loadAiProviderStatus();
    reload();
  }, []);

  async function loadAiProviderStatus() {
    try {
      setAiProviderStatus(await getAiProviderStatus());
    } catch (err) {
      setError(formatError(err, "读取 AI Provider 状态失败"));
    }
  }

  async function reload() {
    try {
      const nextTasks = await listGeoTasks();
      setTasks(nextTasks);
      setReferences(await listGeoReferences(nextTasks[0]?.taskId));
    } catch (err) {
      setError(formatError(err, "读取 GEO 数据失败"));
    }
  }

  async function submitTask() {
    if (!canWrite) {
      setNotice(deniedTitle);
      return;
    }
    if (!keyword.trim()) {
      setError("请输入 GEO 分析关键词");
      return;
    }
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError("");
    setNotice("任务已创建，正在后台调用真实 AI 分析");
    try {
      const task = await createGeoTask(keyword);
      await reload();
      const finishedTask = await pollTaskUntilFinished(task.id);
      await reload();
      if (finishedTask?.status === "失败") {
        setNotice("");
        setError(finishedTask.failureReason ?? "GEO 分析失败，请查看后端日志");
        return;
      }
      setNotice("GEO 分析任务已完成");
      setReferences(await listGeoReferences(task.id));
    } catch (err) {
      setNotice("");
      setError(formatError(err, "创建 GEO 任务失败"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function pollTaskUntilFinished(taskId: number) {
    for (let index = 0; index < POLL_MAX_TIMES; index += 1) {
      await delay(POLL_INTERVAL_MS);
      const nextTasks = await listGeoTasks();
      setTasks(nextTasks);
      const nextTask = nextTasks.find((item) => (item.taskId ?? item.id) === taskId);
      if (nextTask && nextTask.status !== "分析中") {
        return nextTask;
      }
    }
    throw new Error("真实 AI 分析仍在后台执行，请稍后刷新任务列表查看结果");
  }

  async function openTask(task: GeoTask) {
    setSelectedTask(task);
    setError("");
    try {
      setReferences(await listGeoReferences(task.taskId ?? task.id));
    } catch (err) {
      setError(formatError(err, "读取 GEO 引用失败"));
    }
  }

  function confirmDeleteTask() {
    if (!canWrite) {
      setNotice(deniedTitle);
      return;
    }
    if (!deleteTarget) {
      return;
    }
    setTasks((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    setNotice("分析任务已从当前列表移除");
  }

  async function createDraft() {
    if (!canWrite) {
      setNotice(deniedTitle);
      return;
    }
    if (isCreatingDraft) {
      return;
    }
    const completedTask = firstCompletedTask(tasks);
    if (!completedTask) {
      setError("请先等待 GEO 分析任务完成后再开始仿写");
      return;
    }
    const taskId = completedTask.taskId ?? completedTask.id;
    setIsCreatingDraft(true);
    setError("");
    setNotice("正在基于 GEO 结果生成 AI 草稿");
    try {
      const draft = await createDraftFromGeo(taskId);
      setNotice("已基于 GEO 结果创建 AI 草稿");
      onCreateDraft(draft.id);
    } catch (err) {
      setNotice("");
      setError(formatError(err, "创建 AI 草稿失败"));
    } finally {
      setIsCreatingDraft(false);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesKeyword = !keyword.trim() || task.question.includes(keyword.trim()) || task.keyword?.includes(keyword.trim());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesKeyword && matchesStatus;
  });
  const completedCount = tasks.filter((task) => task.status === "已完成").length;
  const runningCount = tasks.filter((task) => task.status === "分析中").length;
  const failedCount = tasks.filter((task) => task.status === "失败").length;

  return (
    <div className="page-stack">
      <PageHeader title="GEO 分析" description="输入关键词调用后端 AI Provider，生成 GEO 研究问题和品牌曝光分析。" actionText={isSubmitting ? "分析中..." : "创建分析任务"} onAction={submitTask} actionDisabled={!canWrite || isSubmitting || isCreatingDraft} actionTitle={canWrite ? undefined : deniedTitle} />
      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}
      <div className={runtimeMode.mockFallbackEnabled ? "warning-banner" : "success-banner"}>
        当前前端模式：{runtimeMode.mockFallbackEnabled ? "本地兜底已开启，后端异常时会显示浏览器本地数据" : "真实接口模式，后端异常会直接报错"}；接口地址：{runtimeMode.apiBaseUrl}
      </div>
      <div className="hero-panel">
        <div>
          <span>当前分析关键词</span>
          <strong>{tasks[0]?.keyword ?? keyword}</strong>
          <p>已生成 {tasks.length} 个 GEO 研究问题；当前模型来源：{aiProviderStatus ? `${aiProviderStatus.providerName} / ${aiProviderStatus.modelName}` : "读取中"}。</p>
        </div>
        <button className="primary-button" type="button" onClick={createDraft} disabled={!canWrite || isSubmitting || isCreatingDraft} title={canWrite ? undefined : deniedTitle}>{isCreatingDraft ? "生成草稿中..." : "基于结果开始仿写"}</button>
      </div>
      <section className="geo-console" aria-label="GEO 监控面板">
        <div className="geo-signal-board">
          <div className="monitor-tabs" aria-label="GEO 分析分区">
            {["Query", "Cite", "Brand", "Risk"].map((item, index) => (
              <span className={index === 1 ? "active" : ""} key={item}>{item}</span>
            ))}
          </div>
          <div className="geo-signal-grid">
            {geoSignalItems.map((item) => (
              <div className={`env-pill ${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}{item.unit}</strong>
              </div>
            ))}
          </div>
          <div className="geo-control-grid">
            <div className="control-tile">
              <span>任务总量</span>
              <strong className="on">{tasks.length}</strong>
            </div>
            <div className="control-tile">
              <span>已完成</span>
              <strong className="on">{completedCount}</strong>
            </div>
            <div className="control-tile">
              <span>分析中</span>
              <strong>{runningCount}</strong>
            </div>
            <div className="control-tile">
              <span>失败</span>
              <strong className={failedCount > 0 ? "danger" : ""}>{failedCount}</strong>
            </div>
            <div className="control-tile">
              <span>引用来源</span>
              <strong className="on">{references.length}</strong>
            </div>
            <div className="control-tile">
              <span>模型来源</span>
              <strong className={aiProviderStatus?.remoteProvider ? "on" : ""}>{aiProviderStatus?.providerName ?? "读取中"}</strong>
            </div>
          </div>
        </div>
        <div className="geo-radar-board">
          <div className="environment-title">
            <span>CITATION SOURCE</span>
            <strong>LIVE</strong>
          </div>
          <div className="geo-ring">
            <strong>{Math.min(99, references.length * 18 || 63)}<small>%</small></strong>
            <span>引用覆盖</span>
          </div>
          <div className="geo-source-list">
            {geoSourceItems.map((item) => (
              <div className="geo-source-row" key={item.label}>
                <span>{item.label}</span>
                <i><b className={item.className} style={{ width: `${item.value}%` }}></b></i>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Panel title="GEO 研究问题">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入关键词" disabled={isSubmitting} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={isSubmitting}>
            <option value="">全部状态</option>
            <option value="已完成">已完成</option>
            <option value="分析中">分析中</option>
            <option value="失败">失败</option>
            <option value="待处理">待处理</option>
          </select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>研究问题</th><th>状态</th><th>时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div>{task.question}</div>
                  {task.failureReason ? <small className="table-subtext error">{task.failureReason}</small> : null}
                </td>
                <td><StatusBadge status={task.status} /></td>
                <td>{task.createdAt}</td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => openTask(task)} disabled={isSubmitting}>查看</button>
                    <button className="danger-link" type="button" onClick={() => setDeleteTarget(task)} disabled={!canWrite || isSubmitting} title={canWrite ? undefined : deniedTitle}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="AI 引用分析">
        <div className="reference-grid">
          {references.map((item) => (
            <article className="reference-card" key={item.id}>
              <span>{item.keyword}</span>
              <h3>{item.question}</h3>
              <strong>{item.aiTitle}</strong>
              <p>{item.description}</p>
              <footer>
                <em>{item.media}</em>
                <button className="link-button" type="button" onClick={() => setSelectedReference(item)}>查看来源</button>
              </footer>
            </article>
          ))}
        </div>
      </Panel>
      {selectedTask ? (
        <Modal
          title="分析任务详情"
          onClose={() => setSelectedTask(null)}
          footer={<button className="primary-button" type="button" onClick={() => setSelectedTask(null)}>关闭</button>}
        >
          <div className="detail-grid">
            <div><span>关键词</span><strong>{selectedTask.keyword ?? keyword}</strong></div>
            <div><span>状态</span><StatusBadge status={selectedTask.status} /></div>
            <div><span>创建时间</span><strong>{selectedTask.createdAt}</strong></div>
            <div><span>问题</span><strong>{selectedTask.question}</strong></div>
            {selectedTask.failureReason ? <div><span>失败原因</span><strong>{selectedTask.failureReason}</strong></div> : null}
          </div>
        </Modal>
      ) : null}
      {selectedReference ? (
        <Modal
          title="引用来源"
          onClose={() => setSelectedReference(null)}
          footer={<button className="primary-button" type="button" onClick={() => setSelectedReference(null)}>关闭</button>}
        >
          <div className="detail-grid">
            <div><span>来源媒体</span><strong>{selectedReference.media}</strong></div>
            <div><span>关键词</span><strong>{selectedReference.keyword}</strong></div>
            <div><span>标题</span><strong>{selectedReference.aiTitle}</strong></div>
            <div><span>地址</span>{selectedReference.url ? <a href={selectedReference.url}>{selectedReference.url}</a> : <strong>模型生成内容，无外部来源链接</strong>}</div>
          </div>
          <p>{selectedReference.description}</p>
        </Modal>
      ) : null}
      {deleteTarget ? (
        <ConfirmDialog
          title="删除分析任务"
          description={`确认删除“${deleteTarget.question}”？当前仅移除页面列表，后端删除接口接入后会同步删除。`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteTask}
        />
      ) : null}
    </div>
  );
}

function delay(timeoutMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
}

function firstCompletedTask(tasks: GeoTask[]) {
  const seenTaskIds = new Set<number>();
  for (const task of tasks) {
    const taskId = task.taskId ?? task.id;
    if (seenTaskIds.has(taskId)) {
      continue;
    }
    seenTaskIds.add(taskId);
    if (task.status === "已完成") {
      return task;
    }
  }
  return null;
}

function formatError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }
  if (error.name === "AbortError" || error.message.includes("aborted")) {
    return "真实 AI 分析耗时较长，请稍后在任务列表查看结果";
  }
  if (error.message === "Failed to fetch" || error.message.includes("fetch")) {
    return "后端接口不可用，请确认 8088 后端服务已启动且允许前端访问";
  }
  return error.message || fallback;
}
