import { useEffect, useMemo, useState } from "react";
import { hasAnyRole, permissionTitle, publishRoles } from "../../shared/permissions";
import type { UserRoleCode } from "../../shared/types";
import { ConfirmDialog, EmptyState, Modal, PageHeader, Panel, StatusBadge, Toolbar } from "../../shared/ui";
import { expireIntegrationCredential, listIntegrationAccounts, saveIntegrationCredential } from "./api";
import type { IntegrationAccount } from "./model";

export function IntegrationPage(props: { currentRole: UserRoleCode }) {
  const [items, setItems] = useState<IntegrationAccount[]>([]);
  const [keyword, setKeyword] = useState("");
  const [platformCode, setPlatformCode] = useState("");
  const [authTarget, setAuthTarget] = useState<IntegrationAccount | null>(null);
  const [expireTarget, setExpireTarget] = useState<IntegrationAccount | null>(null);
  const [secretValue, setSecretValue] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const canPublish = hasAnyRole(props.currentRole, publishRoles);
  const deniedTitle = permissionTitle(publishRoles);

  const platformOptions = useMemo(() => {
    const options = new Map<string, string>();
    items.forEach((item) => {
      if (item.platformCode) {
        options.set(item.platformCode, item.platformName ?? item.platform);
      }
    });
    return Array.from(options.entries()).map(([code, name]) => ({ code, name }));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.platform.toLowerCase().includes(normalizedKeyword) ||
        item.endpoint.toLowerCase().includes(normalizedKeyword);
      const matchesPlatform = !platformCode || item.platformCode === platformCode;
      return matchesKeyword && matchesPlatform;
    });
  }, [items, keyword, platformCode]);

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    try {
      setItems(await listIntegrationAccounts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取集成账号失败");
    }
  }

  function openAuth(item: IntegrationAccount) {
    if (!canPublish) {
      setNotice(deniedTitle);
      return;
    }
    setAuthTarget(item);
    setSecretValue("");
    setError("");
    setNotice("");
  }

  async function submitCredential() {
    if (!canPublish) {
      setError(deniedTitle);
      return;
    }
    if (!authTarget?.accountId || !authTarget.platformCode) {
      setError("集成账号缺少账号编码或平台编码");
      return;
    }
    if (!secretValue.trim()) {
      setError("请输入新的授权凭据");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await saveIntegrationCredential({
        accountId: authTarget.accountId,
        platformCode: authTarget.platformCode,
        secretValue,
      });
      setAuthTarget(null);
      setSecretValue("");
      setNotice("授权凭据已加密保存");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存授权凭据失败");
    } finally {
      setSaving(false);
    }
  }

  async function confirmExpire() {
    if (!canPublish) {
      setError(deniedTitle);
      return;
    }
    if (!expireTarget?.accountId) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await expireIntegrationCredential(expireTarget.accountId);
      setExpireTarget(null);
      setNotice("授权凭据已标记过期");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "标记凭据过期失败");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="集成设置" description="管理自有站点和免费媒体授权，凭据加密存储并脱敏展示。" />
      {error ? <div className="error-banner">{error}</div> : null}
      {notice ? <div className="success-banner">{notice}</div> : null}
      <Panel title="授权账号">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索网站、媒体或凭据状态" />
          <select value={platformCode} onChange={(event) => setPlatformCode(event.target.value)}>
            <option value="">全部平台</option>
            {platformOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </Toolbar>
        {filteredItems.length === 0 ? (
          <EmptyState title="暂无集成账号" description="发布账号会在这里展示授权状态和脱敏凭据。" />
        ) : (
          <table>
            <thead>
              <tr><th>名称</th><th>平台</th><th>地址 / 凭据</th><th>授权状态</th><th>过期时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.platform}</td>
                  <td>{item.endpoint}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.expiresAt || "-"}</td>
                  <td>
                    <div className="table-actions">
                      <button className="link-button" type="button" onClick={() => openAuth(item)} disabled={!canPublish} title={canPublish ? undefined : deniedTitle}>重新授权</button>
                      <button className="danger-link" type="button" onClick={() => setExpireTarget(item)} disabled={!canPublish} title={canPublish ? undefined : deniedTitle}>标记过期</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {authTarget ? (
        <Modal
          title="重新授权"
          onClose={() => setAuthTarget(null)}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => setAuthTarget(null)}>取消</button>
              <button className="primary-button" type="button" onClick={submitCredential} disabled={saving || !canPublish} title={canPublish ? undefined : deniedTitle}>
                {saving ? "保存中" : "加密保存"}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <label className="form-field">
              <span>账号</span>
              <input value={`${authTarget.name} / ${authTarget.accountId ?? ""}`} disabled />
            </label>
            <label className="form-field">
              <span>Token / Cookie</span>
              <textarea value={secretValue} onChange={(event) => setSecretValue(event.target.value)} placeholder="输入新授权凭据" />
            </label>
          </div>
        </Modal>
      ) : null}

      {expireTarget ? (
        <ConfirmDialog
          title="标记凭据过期"
          description={`确认将「${expireTarget.name}」的凭据标记为过期？该账号将无法继续发布。`}
          confirmText="标记过期"
          onCancel={() => setExpireTarget(null)}
          onConfirm={confirmExpire}
        />
      ) : null}
    </div>
  );
}
