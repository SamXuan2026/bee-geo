import { useEffect, useState } from "react";
import { contentStatusText } from "../../shared/statusMachine";
import { PageHeader, Panel, StatusBadge, Toolbar } from "../../shared/ui";
import { approveCreation, listCreations, scheduleCreationPublish, submitCreationReview, updateCreation } from "./api";
import type { CreationItem } from "./model";

interface CreationPageProps {
  onOpenPublish: () => void;
}

export function CreationPage({ onOpenPublish }: CreationPageProps) {
  const [items, setItems] = useState<CreationItem[]>([]);
  const [editing, setEditing] = useState<CreationItem | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  async function saveDraft() {
    if (!editing) {
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

  return (
    <div className="page-stack">
      <PageHeader title="AI 创作" description="围绕 GEO 结果、关键词和 AI 人设生成内容，并进入审核发布流程。" actionText="添加新的创作" />
      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}
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
            <button type="button">重新生成</button>
            <button type="button" onClick={saveDraft}>保存为草稿</button>
            <button type="button" onClick={() => editing ? createPublishSchedule(editing) : undefined}>保存并排期</button>
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
          <input placeholder="搜索文章标题" />
          <select>
            <option>全部状态</option>
            {Object.entries(contentStatusText).map(([key, text]) => (
              <option key={key}>{text}</option>
            ))}
          </select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>文章标题</th><th>品牌</th><th>推送平台</th><th>推送时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td><td>{item.brand}</td><td>{item.platform}</td><td>{item.publishAt}</td>
                <td><StatusBadge status={item.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => setEditing(item)}>编辑</button>
                    <button className="link-button" type="button" onClick={() => submitReview(item.id)}>提交审核</button>
                    <button className="link-button" type="button" onClick={() => approve(item.id)}>审核通过</button>
                    <button className="link-button" type="button" onClick={() => createPublishSchedule(item)}>创建排期</button>
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
