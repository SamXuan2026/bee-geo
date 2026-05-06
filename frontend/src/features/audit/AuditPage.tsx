import { useEffect, useMemo, useState } from "react";
import { EmptyState, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { exportAuditLogs, listAuditLogPage } from "./api";
import type { AuditLogItem } from "./model";

export function AuditPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [success, setSuccess] = useState<"true" | "false" | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null);
  const [exportResult, setExportResult] = useState<{ fileName: string; content: string } | null>(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const successCount = items.filter((item) => item.success).length;
    return {
      total: items.length,
      success: successCount,
      failed: items.length - successCount,
    };
  }, [items]);

  useEffect(() => {
    let active = true;
    listAuditLogPage({ keyword, success, startDate, endDate, page, pageSize })
      .then((data) => {
        if (active) {
          setItems(data.items);
          setTotal(data.total);
          setTotalPages(data.totalPages);
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
  }, [keyword, success, startDate, endDate, page, pageSize]);

  function updateKeyword(value: string) {
    setKeyword(value);
    setPage(1);
  }

  function updateSuccess(value: "true" | "false" | "") {
    setSuccess(value);
    setPage(1);
  }

  function updateStartDate(value: string) {
    setStartDate(value);
    setPage(1);
  }

  function updateEndDate(value: string) {
    setEndDate(value);
    setPage(1);
  }

  function updatePageSize(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  async function exportCurrentLogs() {
    setError("");
    try {
      const result = await exportAuditLogs({ keyword, success, startDate, endDate });
      setExportResult({ fileName: result.fileName, content: result.content });
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出审计日志失败");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="审计日志" description="追踪发布、授权、审核、用户和资产变更等关键操作，满足私有化部署追溯要求。" />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="card-grid three">
        <article className="feature-card"><span>{total}</span><h3>审计总数</h3><p>当前筛选条件下的操作记录。</p></article>
        <article className="feature-card"><span>{summary.success}</span><h3>成功操作</h3><p>已完成并记录结果的操作。</p></article>
        <article className="feature-card"><span>{summary.failed}</span><h3>失败操作</h3><p>需要排查或人工复核的操作。</p></article>
      </div>
      <Panel title="操作审计" action={<button className="ghost-button" type="button" onClick={exportCurrentLogs}>导出 CSV</button>}>
        <Toolbar>
          <input value={keyword} onChange={(event) => updateKeyword(event.target.value)} placeholder="搜索模块、动作、操作人或地址" />
          <select value={success} onChange={(event) => updateSuccess(event.target.value as "true" | "false" | "")}>
            <option value="">全部结果</option>
            <option value="true">成功</option>
            <option value="false">失败</option>
          </select>
          <input type="date" value={startDate} onChange={(event) => updateStartDate(event.target.value)} />
          <input type="date" value={endDate} onChange={(event) => updateEndDate(event.target.value)} />
          <select value={pageSize} onChange={(event) => updatePageSize(event.target.value)}>
            <option value="10">10 条/页</option>
            <option value="20">20 条/页</option>
            <option value="50">50 条/页</option>
          </select>
        </Toolbar>
        {items.length === 0 ? (
          <EmptyState title="暂无审计日志" description="关键操作执行后会在这里记录模块、动作、操作人和结果。" />
        ) : (
          <table>
            <thead>
              <tr><th>模块</th><th>动作</th><th>对象</th><th>操作人</th><th>结果</th><th>时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.module}</td>
                  <td>{item.action}</td>
                  <td>{item.targetId ?? "-"}</td>
                  <td>{item.operatorName} / {item.operatorAccount}</td>
                  <td><span className={item.success ? "result-success" : "result-failed"}>{item.success ? "成功" : "失败"}</span></td>
                  <td>{item.createdAt}</td>
                  <td><button className="link-button" type="button" onClick={() => setSelectedItem(item)}>详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pager">
          <button type="button" onClick={() => setPage(1)} disabled={page <= 1}>首页</button>
          <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1}>上一页</button>
          <span>第 {page} / {totalPages} 页，共 {total} 条</span>
          <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages}>下一页</button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>末页</button>
        </div>
      </Panel>
      {selectedItem ? (
        <Modal
          title="审计详情"
          onClose={() => setSelectedItem(null)}
          footer={<button className="primary-button" type="button" onClick={() => setSelectedItem(null)}>关闭</button>}
        >
          <div className="detail-grid">
            <div><span>模块</span><strong>{selectedItem.module}</strong></div>
            <div><span>动作</span><strong>{selectedItem.action}</strong></div>
            <div><span>对象编号</span><strong>{selectedItem.targetId ?? "-"}</strong></div>
            <div><span>操作结果</span><strong>{selectedItem.success ? "成功" : "失败"}</strong></div>
            <div><span>操作账号</span><strong>{selectedItem.operatorAccount}</strong></div>
            <div><span>操作人</span><strong>{selectedItem.operatorName}</strong></div>
            <div><span>角色</span><strong>{selectedItem.operatorRole}</strong></div>
            <div><span>客户端 IP</span><strong>{selectedItem.clientIp}</strong></div>
            <div><span>请求地址</span><strong>{selectedItem.requestUri}</strong></div>
            <div><span>操作时间</span><strong>{selectedItem.createdAt}</strong></div>
          </div>
        </Modal>
      ) : null}
      {exportResult ? (
        <Modal
          title="审计导出"
          onClose={() => setExportResult(null)}
          footer={<button className="primary-button" type="button" onClick={() => setExportResult(null)}>关闭</button>}
        >
          <div className="detail-grid">
            <div><span>文件名</span><strong>{exportResult.fileName}</strong></div>
            <div><span>记录数</span><strong>{Math.max(exportResult.content.split("\n").length - 1, 0)}</strong></div>
          </div>
          <textarea className="export-preview" value={exportResult.content} readOnly />
        </Modal>
      ) : null}
    </div>
  );
}
