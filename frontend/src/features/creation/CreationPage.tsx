import { useEffect, useState } from "react";
import { contentWriteRoles, hasAnyRole, permissionTitle, publishRoles, reviewRoles } from "../../shared/permissions";
import { contentStatusText } from "../../shared/statusMachine";
import type { UserRoleCode } from "../../shared/types";
import { PageHeader, Panel, StatusBadge, Toolbar } from "../../shared/ui";
import { approveCreation, listCreations, scheduleCreationPublish, submitCreationReview, updateCreation } from "./api";
import type { CreationItem } from "./model";

interface CreationPageProps {
  currentRole: UserRoleCode;
  onOpenPublish: () => void;
}

const creationSignalItems = [
  { label: "生成质量", value: "92", unit: "%", tone: "teal" },
  { label: "审计覆盖", value: "100", unit: "%", tone: "blue" },
  { label: "待处理", value: "9", unit: "篇", tone: "amber" },
];

export function CreationPage({ currentRole, onOpenPublish }: CreationPageProps) {
  const [items, setItems] = useState<CreationItem[]>([]);
  const [editing, setEditing] = useState<CreationItem | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canWrite = hasAnyRole(currentRole, contentWriteRoles);
  const canReview = hasAnyRole(currentRole, reviewRoles);
  const canPublish = hasAnyRole(currentRole, publishRoles);
  const contentDeniedTitle = permissionTitle(contentWriteRoles);
  const reviewDeniedTitle = permissionTitle(reviewRoles);
  const publishDeniedTitle = permissionTitle(publishRoles);

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    try {
      const data = await listCreations();
      setItems(data);
      setEditing((current) => current ?? data[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取创作列表失败");
    }
  }

  function updateEditing(field: keyof CreationItem, value: string) {
    if (!editing) {
      return;
    }
    setEditing({ ...editing, [field]: value });
  }

  function createBlankDraft() {
    if (!canWrite) {
      setNotice(contentDeniedTitle);
      return;
    }
    const draft: CreationItem = {
      id: Date.now(),
      title: "未命名创作草稿",
      brand: "BeeWorks",
      platform: "自有站点",
      summary: "",
      body: "",
      publishAt: "未设置",
      status: "DRAFT",
    };
    setItems((current) => [draft, ...current]);
    setEditing(draft);
    setError("");
    setNotice("已创建本地草稿，请补充内容后保存");
  }

  function regenerateDraft() {
    if (!canWrite) {
      setNotice(contentDeniedTitle);
      return;
    }
    if (!editing) {
      setError("请先选择或新增一篇创作草稿");
      return;
    }
    const summary = editing.summary?.trim() || "围绕企业协同、权限管控、审计留痕和私有化部署展开选型建议。";
    setEditing({
      ...editing,
      title: editing.title || "企业协同平台私有化选型建议",
      summary,
      body: [
        "一、业务背景：企业在引入协同平台时，需要同时关注沟通效率、数据安全和系统集成能力。",
        "二、选型重点：建议优先评估组织架构同步、权限分层、操作审计、内网部署和开放接口。",
        "三、落地建议：先完成核心部门试点，再逐步接入知识库、审批流和发布审计能力。",
      ].join("\n\n"),
    });
    setNotice("已根据当前摘要重新生成正文草稿");
    setError("");
  }

  async function saveDraft() {
    if (!canWrite) {
      setError(contentDeniedTitle);
      return;
    }
    if (!editing) {
      setError("请先选择或新增一篇创作草稿");
      return;
    }
    if (!editing.title.trim() || !(editing.body ?? "").trim()) {
      setError("请填写文章标题和正文后再保存");
      return;
    }
    setError("");
    setNotice("");
    try {
      const saved = await updateCreation(editing.id, {
        title: editing.title,
        brand: editing.brand,
        platform: editing.platform,
        summary: editing.summary,
        body: editing.body ?? "",
      });
      setEditing(saved);
      setNotice("草稿已保存");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存草稿失败");
    }
  }

  async function submitReview(id: number) {
    if (!canWrite) {
      setError(contentDeniedTitle);
      return;
    }
    const target = items.find((item) => item.id === id);
    if (!target?.title.trim() || !(target.body ?? "").trim()) {
      setError("请先补齐文章标题和正文后再提交审核");
      return;
    }
    setError("");
    setNotice("");
    try {
      await submitCreationReview(id);
      setNotice("内容已提交审核");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交审核失败");
    }
  }

  async function approve(id: number) {
    if (!canReview) {
      setError(reviewDeniedTitle);
      return;
    }
    const target = items.find((item) => item.id === id);
    if (target?.status === "DRAFT") {
      setError("草稿需先提交审核后才能审核通过");
      return;
    }
    setError("");
    setNotice("");
    try {
      await approveCreation(id);
      setNotice("内容已审核通过");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核通过失败");
    }
  }

  async function createPublishSchedule(item: CreationItem) {
    if (!canPublish) {
      setError(publishDeniedTitle);
      return;
    }
    if (!item.title.trim() || !(item.body ?? "").trim()) {
      setError("请先补齐文章标题和正文后再创建排期");
      return;
    }
    if (item.status !== "APPROVED" && item.status !== "SCHEDULED") {
      setError("仅审核通过的内容可以创建发布排期");
      return;
    }
    setError("");
    setNotice("");
    try {
      await scheduleCreationPublish(item.id, {
        platformCode: item.platform === "免费媒体" ? "FREE_MEDIA" : "OWNED_SITE",
        accountId: item.platform === "免费媒体" ? "cnblogs" : "site-main",
        scheduledAt: nextLocalDateTime(),
        maxRetryCount: 3,
      });
      setNotice("已创建发布排期");
      await reload();
      onOpenPublish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建发布排期失败");
    }
  }

  const filteredItems = items.filter((item) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const matchesKeyword =
      !normalizedKeyword ||
      item.title.toLowerCase().includes(normalizedKeyword) ||
      item.brand.toLowerCase().includes(normalizedKeyword) ||
      item.platform.toLowerCase().includes(normalizedKeyword);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesKeyword && matchesStatus;
  });
  const draftCount = items.filter((item) => item.status === "DRAFT").length;
  const reviewCount = items.filter((item) => item.status === "PENDING_REVIEW").length;
  const approvedCount = items.filter((item) => item.status === "APPROVED" || item.status === "SCHEDULED").length;
  const bodyLength = editing?.body?.length ?? 0;
  const completion = Math.min(100, Math.round(((editing?.title ? 25 : 0) + (editing?.summary ? 25 : 0) + Math.min(bodyLength, 800) / 16)));

  return (
    <div className="page-stack">
      <PageHeader title="AI 创作" description="围绕 GEO 结果、关键词和 AI 人设生成内容，并进入审核发布流程。" actionText="添加新的创作" onAction={createBlankDraft} actionDisabled={!canWrite} actionTitle={canWrite ? undefined : contentDeniedTitle} />
      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}
      <section className="creation-console" aria-label="创作监控面板">
        <div className="creation-signal-board">
          <div className="monitor-tabs" aria-label="创作阶段">
            {["Draft", "Review", "Approve", "Schedule"].map((item, index) => (
              <span className={index === 0 ? "active" : ""} key={item}>{item}</span>
            ))}
          </div>
          <div className="geo-signal-grid">
            {creationSignalItems.map((item) => (
              <div className={`env-pill ${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}{item.unit}</strong>
              </div>
            ))}
          </div>
          <div className="geo-control-grid">
            <div className="control-tile"><span>草稿</span><strong>{draftCount}</strong></div>
            <div className="control-tile"><span>审核中</span><strong>{reviewCount}</strong></div>
            <div className="control-tile"><span>可排期</span><strong className="on">{approvedCount}</strong></div>
            <div className="control-tile"><span>正文字符</span><strong className="on">{bodyLength}</strong></div>
          </div>
        </div>
        <div className="creation-progress-board">
          <div className="environment-title">
            <span>CONTENT COMPLETION</span>
            <strong>{editing ? "EDITING" : "EMPTY"}</strong>
          </div>
          <div className="geo-ring creation-ring">
            <strong>{completion}<small>%</small></strong>
            <span>完成度</span>
          </div>
          <div className="geo-source-list">
            {[
              { label: "标题", value: editing?.title ? 100 : 0 },
              { label: "摘要", value: editing?.summary ? 100 : 0 },
              { label: "正文", value: Math.min(100, Math.round(bodyLength / 8)) },
              { label: "排期", value: editing?.publishAt && editing.publishAt !== "未设置" ? 100 : 12 },
            ].map((item) => (
              <div className="geo-source-row" key={item.label}>
                <span>{item.label}</span>
                <i><b className="normal" style={{ width: `${item.value}%` }}></b></i>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="editor-shell">
        <div className="editor-main">
          <span>文章编辑区</span>
          <input
            className="editor-title-input"
            value={editing?.title ?? ""}
            onChange={(event) => updateEditing("title", event.target.value)}
            placeholder="文章标题"
          />
          <div className="editor-meta-grid">
            <input value={editing?.brand ?? ""} onChange={(event) => updateEditing("brand", event.target.value)} placeholder="品牌" />
            <select value={editing?.platform ?? "自有站点"} onChange={(event) => updateEditing("platform", event.target.value)}>
              <option>自有站点</option>
              <option>免费媒体</option>
            </select>
          </div>
          <textarea
            value={editing?.summary ?? ""}
            onChange={(event) => updateEditing("summary", event.target.value)}
            placeholder="文章摘要"
          />
          <textarea
            value={editing?.body ?? ""}
            onChange={(event) => updateEditing("body", event.target.value)}
            placeholder="文章正文"
          />
          <div className="editor-toolbar">
            <button type="button" onClick={regenerateDraft} disabled={!canWrite} title={canWrite ? undefined : contentDeniedTitle}>重新生成</button>
            <button type="button" onClick={saveDraft} disabled={!canWrite} title={canWrite ? undefined : contentDeniedTitle}>保存为草稿</button>
            <button type="button" onClick={() => editing ? createPublishSchedule(editing) : undefined} disabled={!canPublish} title={canPublish ? undefined : publishDeniedTitle}>保存并排期</button>
          </div>
        </div>
        <aside className="assistant-card">
          <strong>AI 人设优化大师</strong>
          <p>当前表达策略：专业、克制、偏企业选型建议。</p>
          <div className="assistant-tags">
            <span>GPT 5.4</span>
            <span>销售经理</span>
            <span>知识库增强</span>
          </div>
        </aside>
      </div>
      <Panel title="创作列表">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索文章标题" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">全部状态</option>
            {Object.entries(contentStatusText).map(([key, text]) => (
              <option key={key} value={key}>{text}</option>
            ))}
          </select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>文章标题</th><th>品牌</th><th>推送平台</th><th>推送时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td><td>{item.brand}</td><td>{item.platform}</td><td>{item.publishAt}</td>
                <td><StatusBadge status={item.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => setEditing(item)}>查看</button>
                    <button className="link-button" type="button" onClick={() => submitReview(item.id)} disabled={!canWrite} title={canWrite ? undefined : contentDeniedTitle}>提交审核</button>
                    <button className="link-button" type="button" onClick={() => approve(item.id)} disabled={!canReview} title={canReview ? undefined : reviewDeniedTitle}>审核通过</button>
                    <button className="link-button" type="button" onClick={() => createPublishSchedule(item)} disabled={!canPublish} title={canPublish ? undefined : publishDeniedTitle}>创建排期</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function nextLocalDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}
