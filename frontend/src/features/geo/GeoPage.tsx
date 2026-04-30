import { useEffect, useState } from "react";
import { PageHeader, Panel, StatusBadge, Toolbar } from "../../shared/ui";
import { createDraftFromGeo, createGeoTask, listGeoReferences, listGeoTasks } from "./api";
import type { GeoReference, GeoTask } from "./model";

interface GeoPageProps {
  onCreateDraft: () => void;
}

export function GeoPage({ onCreateDraft }: GeoPageProps) {
  const [tasks, setTasks] = useState<GeoTask[]>([]);
  const [references, setReferences] = useState<GeoReference[]>([]);
  const [keyword, setKeyword] = useState("企业协同平台");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    try {
      const nextTasks = await listGeoTasks();
      setTasks(nextTasks);
      setReferences(await listGeoReferences(nextTasks[0]?.taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取 GEO 数据失败");
    }
  }

  async function submitTask() {
    setError("");
    setNotice("");
    try {
      const task = await createGeoTask(keyword);
      setNotice("GEO 分析任务已完成");
      await reload();
      setReferences(await listGeoReferences(task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建 GEO 任务失败");
    }
  }

  async function createDraft() {
    const taskId = tasks[0]?.taskId ?? 1;
    setError("");
    setNotice("");
    try {
      await createDraftFromGeo(taskId);
      setNotice("已基于 GEO 结果创建 AI 草稿");
      onCreateDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建 AI 草稿失败");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="GEO 分析" description="输入关键词生成模拟问题，分析 AI 引用来源和品牌曝光机会。" actionText="创建分析任务" onAction={submitTask} />
      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}
      <div className="hero-panel">
        <div>
          <span>当前分析关键词</span>
          <strong>{tasks[0]?.keyword ?? keyword}</strong>
          <p>已生成 {tasks.length} 个模拟问题，覆盖豆包、DeepSeek、文心一言等模型来源。</p>
        </div>
        <button className="primary-button" type="button" onClick={createDraft}>基于结果开始仿写</button>
      </div>
      <Panel title="模拟问题">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入关键词" />
          <select><option>全部状态</option><option>已完成</option><option>分析中</option></select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>模拟问题</th><th>状态</th><th>时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.question}</td>
                <td><StatusBadge status={task.status} /></td>
                <td>{task.createdAt}</td>
                <td><button className="link-button" type="button">查看</button><button className="danger-link" type="button">删除</button></td>
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
                <button className="link-button" type="button">查看来源</button>
              </footer>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
