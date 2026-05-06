import { useEffect, useMemo, useState } from "react";
import { hasAnyRole, permissionTitle, publishRoles } from "../../shared/permissions";
import type { ContentStatus, PublishAccount, PublishReceipt, PublishTask } from "../../shared/types";
import type { UserRoleCode } from "../../shared/types";
import { ConfirmDialog, EmptyState, Modal, PageHeader, Panel, StatusBadge, Toolbar } from "../../shared/ui";
import {
  createPublishTask,
  listPublishAccounts,
  listPublishReceipts,
  listPublishTasks,
  retryPublishTask,
  revokePublishTask,
} from "./api";
import type { PublishTaskForm } from "./model";

const emptyForm: PublishTaskForm = {
  contentId: "",
  title: "",
  body: "",
  platformCode: "OWNED_SITE",
  accountId: "",
  scheduledAt: "",
  maxRetryCount: "3",
};

const publishSignalItems = [
  { label: "发布成功率", value: "96", unit: "%", tone: "teal" },
  { label: "回执归档", value: "100", unit: "%", tone: "blue" },
  { label: "人工介入", value: "2", unit: "项", tone: "amber" },
];

export function PublishPage(props: { currentRole: UserRoleCode }) {
  const [items, setItems] = useState<PublishTask[]>([]);
  const [accounts, setAccounts] = useState<PublishAccount[]>([]);
  const [receipts, setReceipts] = useState<PublishReceipt[]>([]);
  const [keyword, setKeyword] = useState("");
  const [platformCode, setPlatformCode] = useState("");
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [form, setForm] = useState<PublishTaskForm | null>(null);
  const [selectedTask, setSelectedTask] = useState<PublishTask | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PublishTask | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const canPublish = hasAnyRole(props.currentRole, publishRoles);
  const deniedTitle = permissionTitle(publishRoles);

  const availableAccounts = useMemo(() => {
    if (!form?.platformCode) {
      return accounts;
    }
    return accounts.filter((account) => account.platformCode === form.platformCode);
  }, [accounts, form?.platformCode]);

  const platformOptions = useMemo(() => {
    const platforms = new Map<string, string>();
    accounts.forEach((account) => platforms.set(account.platformCode, account.platformName));
    if (platforms.size === 0) {
      platforms.set("OWNED_SITE", "自有站点");
      platforms.set("FREE_MEDIA", "免费媒体");
    }
    return Array.from(platforms.entries()).map(([code, name]) => ({ code, name }));
  }, [accounts]);

  useEffect(() => {
    listPublishAccounts().then(setAccounts).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    listPublishTasks({ keyword, platformCode, status })
      .then((data) => {
        if (active) {
          setItems(data);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });
    return () => {
      active = false;
    };
  }, [keyword, platformCode, status]);

  function openCreate() {
    if (!canPublish) {
      setNotice(deniedTitle);
      return;
    }
    const firstAccount = accounts.find((account) => account.status === "VALID") ?? accounts[0];
    setError("");
    setNotice("");
    setForm({
      ...emptyForm,
      platformCode: firstAccount?.platformCode ?? "OWNED_SITE",
      accountId: firstAccount?.accountId ?? "",
      scheduledAt: nextLocalDateTime(),
    });
  }

  function updateForm(field: keyof PublishTaskForm, value: string) {
    if (!form) {
      return;
    }
    if (field === "platformCode") {
      const nextAccount = accounts.find((account) => account.platformCode === value && account.status === "VALID")
        ?? accounts.find((account) => account.platformCode === value);
      setForm({ ...form, platformCode: value, accountId: nextAccount?.accountId ?? "" });
      return;
    }
    setForm({ ...form, [field]: value });
  }

  async function reloadTasks() {
    const data = await listPublishTasks({ keyword, platformCode, status });
    setItems(data);
  }

  async function submitTask() {
    if (!canPublish) {
      setError(deniedTitle);
      return;
    }
    if (!form) {
      return;
    }
    if (!form.title.trim() || !form.body.trim()) {
      setError("请填写发布标题和正文");
      return;
    }
    if (!form.platformCode || !form.accountId) {
      setError("请选择发布平台和发布账号");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await createPublishTask({
        contentId: form.contentId ? Number(form.contentId) : undefined,
        title: form.title,
        body: form.body,
        platformCode: form.platformCode,
        accountId: form.accountId,
        scheduledAt: normalizeDateTime(form.scheduledAt),
        maxRetryCount: form.maxRetryCount ? Number(form.maxRetryCount) : 3,
      });
      setForm(null);
      setNotice("发布任务已创建");
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建发布任务失败");
    } finally {
      setSaving(false);
    }
  }

  async function retryTask(task: PublishTask) {
    if (!canPublish) {
      setError(deniedTitle);
      return;
    }
    if (task.status === "PUBLISHED") {
      setNotice("该任务已发布成功，无需重试");
      return;
    }
    if (task.status === "REVOKED") {
      setError("已撤回任务不能重试");
      return;
    }
    setError("");
    setNotice("");
    try {
      const receipt = await retryPublishTask(task.id);
      setNotice(receipt.message);
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "重试发布任务失败");
    }
  }

  async function confirmRevoke() {
    if (!canPublish) {
      setError(deniedTitle);
      return;
    }
    if (!revokeTarget) {
      return;
    }
    setError("");
    setNotice("");
    try {
      const receipt = await revokePublishTask(revokeTarget.id);
      setNotice(receipt.message);
      setRevokeTarget(null);
      await reloadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "撤回发布任务失败");
    }
  }

  async function openReceipts(task: PublishTask) {
    setSelectedTask(task);
    setReceipts([]);
    setError("");
    try {
      setReceipts(await listPublishReceipts(task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取发布回执失败");
    }
  }

  function openRevokeConfirm(task: PublishTask) {
    if (!canPublish) {
      setNotice(deniedTitle);
      return;
    }
    if (task.status === "REVOKED") {
      setNotice("该任务已经撤回");
      return;
    }
    setRevokeTarget(task);
  }

  const scheduledCount = items.filter((item) => item.status === "SCHEDULED").length;
  const publishingCount = items.filter((item) => item.status === "PUBLISHING").length;
  const successCount = items.filter((item) => item.status === "PUBLISHED").length;
  const riskCount = items.filter((item) => item.status === "FAILED" || item.status === "MANUAL_REQUIRED").length;
  const validAccountCount = accounts.filter((account) => account.status === "VALID").length;
  const publishRate = items.length === 0 ? 0 : Math.round((successCount / items.length) * 100);

  return (
    <div className="page-stack">
      <PageHeader
        title="发布中心"
        description="统一管理审核后排期、发布执行、失败重试、人工介入和回执归档。"
        actionText="创建发布任务"
        onAction={openCreate}
        actionDisabled={!canPublish}
        actionTitle={canPublish ? undefined : deniedTitle}
      />
      <div className="publish-flow">
        {["审核通过", "已排期", "发布中", "发布成功", "回执归档"].map((item, index) => (
          <div className="flow-node" key={item}>
            <span>{index + 1}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}
      <section className="publish-console" aria-label="发布监控面板">
        <div className="publish-signal-board">
          <div className="monitor-tabs" aria-label="发布状态">
            {["Schedule", "Publishing", "Receipt", "Risk"].map((item, index) => (
              <span className={index === 1 ? "active" : ""} key={item}>{item}</span>
            ))}
          </div>
          <div className="geo-signal-grid">
            {publishSignalItems.map((item) => (
              <div className={`env-pill ${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}{item.unit}</strong>
              </div>
            ))}
          </div>
          <div className="geo-control-grid">
            <div className="control-tile"><span>已排期</span><strong>{scheduledCount}</strong></div>
            <div className="control-tile"><span>发布中</span><strong className="on">{publishingCount}</strong></div>
            <div className="control-tile"><span>已成功</span><strong className="on">{successCount}</strong></div>
            <div className="control-tile"><span>风险任务</span><strong>{riskCount}</strong></div>
          </div>
        </div>
        <div className="publish-health-board">
          <div className="environment-title">
            <span>PUBLISH HEALTH</span>
            <strong>{validAccountCount}/{accounts.length || 1}</strong>
          </div>
          <div className="geo-ring publish-ring">
            <strong>{publishRate}<small>%</small></strong>
            <span>成功率</span>
          </div>
          <div className="geo-source-list">
            {[
              { label: "有效账号", value: accounts.length === 0 ? 0 : Math.round((validAccountCount / accounts.length) * 100) },
              { label: "排期任务", value: Math.min(100, scheduledCount * 24) },
              { label: "发布成功", value: publishRate },
              { label: "风险占比", value: items.length === 0 ? 0 : Math.round((riskCount / items.length) * 100) },
            ].map((item) => (
              <div className="geo-source-row" key={item.label}>
                <span>{item.label}</span>
                <i><b className={item.label === "风险占比" ? "damage" : "normal"} style={{ width: `${item.value}%` }}></b></i>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Panel title="发布任务">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索任务标题、平台或账号" />
          <select value={platformCode} onChange={(event) => setPlatformCode(event.target.value)}>
            <option value="">全部平台</option>
            {platformOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as ContentStatus | "")}>
            <option value="">全部状态</option>
            <option value="SCHEDULED">已排期</option>
            <option value="PUBLISHING">发布中</option>
            <option value="PUBLISHED">发布成功</option>
            <option value="FAILED">发布失败</option>
            <option value="MANUAL_REQUIRED">人工介入</option>
            <option value="REVOKED">已撤回</option>
          </select>
        </Toolbar>
        {items.length === 0 ? (
          <EmptyState title="暂无发布任务" description="创建发布任务后会在这里显示排期、状态和回执。" />
        ) : (
          <table>
            <thead>
              <tr><th>内容标题</th><th>平台</th><th>账号</th><th>计划时间</th><th>状态</th><th>重试</th><th>回执</th><th>操作</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.platform}</td>
                  <td>{item.account}</td>
                  <td>{formatDateTime(item.scheduledAt)}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.retryCount}/{item.maxRetryCount ?? 3}</td>
                  <td>{item.url ? <a href={item.url}>{item.receipt}</a> : item.receipt}</td>
                  <td>
                    <div className="table-actions">
                      <button className="link-button" type="button" onClick={() => openReceipts(item)}>查看</button>
                      <button className="link-button" type="button" onClick={() => retryTask(item)} disabled={!canPublish} title={canPublish ? undefined : deniedTitle}>重试</button>
                      <button className="danger-link" type="button" onClick={() => openRevokeConfirm(item)} disabled={!canPublish} title={canPublish ? undefined : deniedTitle}>撤回</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {form ? (
        <Modal
          title="创建发布任务"
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setForm(null)}>取消</button>
              <button className="primary-button" type="button" onClick={submitTask} disabled={saving || !canPublish} title={canPublish ? undefined : deniedTitle}>
                {saving ? "保存中" : "保存任务"}
              </button>
            </>
          }
        >
          <div className="form-grid two-fields">
            <label className="form-field">
              <span>内容编号</span>
              <input value={form.contentId} onChange={(event) => updateForm("contentId", event.target.value)} placeholder="可留空" />
            </label>
            <label className="form-field">
              <span>计划时间</span>
              <input type="datetime-local" value={form.scheduledAt} onChange={(event) => updateForm("scheduledAt", event.target.value)} />
            </label>
            <label className="form-field">
              <span>平台</span>
              <select value={form.platformCode} onChange={(event) => updateForm("platformCode", event.target.value)}>
                {platformOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>发布账号</span>
              <select value={form.accountId} onChange={(event) => updateForm("accountId", event.target.value)}>
                {availableAccounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.name} / {account.status === "VALID" ? "有效" : "需授权"}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>重试上限</span>
              <input type="number" min="0" max="10" value={form.maxRetryCount} onChange={(event) => updateForm("maxRetryCount", event.target.value)} />
            </label>
            <label className="form-field full-width">
              <span>内容标题</span>
              <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="输入审核通过的内容标题" />
            </label>
            <label className="form-field full-width">
              <span>发布正文</span>
              <textarea value={form.body} onChange={(event) => updateForm("body", event.target.value)} placeholder="输入待发布正文" />
            </label>
          </div>
        </Modal>
      ) : null}

      {selectedTask ? (
        <Modal
          title="发布回执"
          onClose={() => setSelectedTask(null)}
          footer={<button className="primary-button" type="button" onClick={() => setSelectedTask(null)}>关闭</button>}
        >
          <div className="detail-grid">
            <div><span>任务</span><strong>{selectedTask.title}</strong></div>
            <div><span>平台</span><strong>{selectedTask.platform}</strong></div>
            <div><span>账号</span><strong>{selectedTask.account}</strong></div>
            <div><span>状态</span><StatusBadge status={selectedTask.status} /></div>
          </div>
          <div className="receipt-list">
            {receipts.length === 0 ? (
              <EmptyState title="暂无回执" description="任务执行后会保存平台返回结果。" />
            ) : receipts.map((receipt) => (
              <article key={receipt.id} className="receipt-item">
                <div>
                  <strong>{receipt.success ? "发布成功" : "发布失败"}</strong>
                  <span>第 {receipt.attemptNo} 次 / {formatDateTime(receipt.createdAt)}</span>
                </div>
                <p>{receipt.message}</p>
                {receipt.url ? <a href={receipt.url}>{receipt.url}</a> : null}
              </article>
            ))}
          </div>
        </Modal>
      ) : null}

      {revokeTarget ? (
        <ConfirmDialog
          title="撤回发布任务"
          description={`确认撤回「${revokeTarget.title}」？已经发布到外部平台的内容会通过适配器发起撤回请求。`}
          confirmText="确认撤回"
          onCancel={() => setRevokeTarget(null)}
          onConfirm={confirmRevoke}
        />
      ) : null}
    </div>
  );
}

function normalizeDateTime(value: string) {
  if (!value) {
    return undefined;
  }
  return value.length === 16 ? `${value}:00` : value;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  return value.replace("T", " ").slice(0, 16);
}

function nextLocalDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
