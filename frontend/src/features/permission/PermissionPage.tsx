import { useEffect, useMemo, useState } from "react";
import { EmptyState, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { listPermissionRoles, listPermissions } from "./api";
import type { PermissionMatrixItem } from "./model";

interface RoleOption {
  code: string;
  name: string;
}

export function PermissionPage() {
  const [items, setItems] = useState<PermissionMatrixItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [riskLevel, setRiskLevel] = useState<PermissionMatrixItem["riskLevel"] | "">("");
  const [selectedItem, setSelectedItem] = useState<PermissionMatrixItem | null>(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => ({
    total: items.length,
    high: items.filter((item) => item.riskLevel === "高").length,
    guarded: items.filter((item) => item.backendGuarded).length,
  }), [items]);

  useEffect(() => {
    listPermissionRoles().then(setRoles).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    listPermissions({ keyword, roleCode, riskLevel })
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
  }, [keyword, roleCode, riskLevel]);

  function roleName(code: string) {
    return roles.find((role) => role.code === code)?.name ?? code;
  }

  return (
    <div className="page-stack">
      <PageHeader title="权限矩阵" description="查看角色、模块、权限点和后端拦截状态，确保高风险操作只向授权角色开放。" />
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="card-grid three">
        <article className="feature-card"><span>{summary.total}</span><h3>权限点</h3><p>当前筛选下的功能权限总数。</p></article>
        <article className="feature-card"><span>{summary.high}</span><h3>高风险</h3><p>涉及凭据、用户、发布或审计的权限。</p></article>
        <article className="feature-card"><span>{summary.guarded}</span><h3>后端拦截</h3><p>已由角色注解或接口拦截保护。</p></article>
      </div>
      <Panel title="角色权限">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索模块、权限点或说明" />
          <select value={roleCode} onChange={(event) => setRoleCode(event.target.value)}>
            <option value="">全部角色</option>
            {roles.map((role) => (
              <option key={role.code} value={role.code}>{role.name}</option>
            ))}
          </select>
          <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as PermissionMatrixItem["riskLevel"] | "")}>
            <option value="">全部风险</option>
            <option value="高">高风险</option>
            <option value="中">中风险</option>
            <option value="低">低风险</option>
          </select>
        </Toolbar>
        {items.length === 0 ? (
          <EmptyState title="暂无权限点" description="调整筛选条件后查看角色授权范围。" />
        ) : (
          <table>
            <thead>
              <tr><th>模块</th><th>权限点</th><th>风险</th><th>授权角色</th><th>后端保护</th><th>操作</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.module}</td>
                  <td>{item.permission}</td>
                  <td><span className={`risk-badge risk-${item.riskLevel}`}>{item.riskLevel}</span></td>
                  <td>{item.roles.map(roleName).join("、")}</td>
                  <td><span className={item.backendGuarded ? "result-success" : "result-failed"}>{item.backendGuarded ? "已保护" : "待接入"}</span></td>
                  <td><button className="link-button" type="button" onClick={() => setSelectedItem(item)}>详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {selectedItem ? (
        <Modal
          title="权限详情"
          onClose={() => setSelectedItem(null)}
          footer={<button className="primary-button" type="button" onClick={() => setSelectedItem(null)}>关闭</button>}
        >
          <div className="detail-grid">
            <div><span>模块</span><strong>{selectedItem.module}</strong></div>
            <div><span>权限点</span><strong>{selectedItem.permission}</strong></div>
            <div><span>风险等级</span><strong>{selectedItem.riskLevel}</strong></div>
            <div><span>后端保护</span><strong>{selectedItem.backendGuarded ? "已保护" : "待接入"}</strong></div>
            <div><span>授权角色</span><strong>{selectedItem.roles.map(roleName).join("、")}</strong></div>
            <div><span>权限说明</span><strong>{selectedItem.description}</strong></div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
