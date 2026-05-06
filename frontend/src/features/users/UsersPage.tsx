import { useEffect, useState } from "react";
import { hasAnyRole, permissionTitle, superAdminRoles } from "../../shared/permissions";
import type { UserRoleCode } from "../../shared/types";
import { ConfirmDialog, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { createUser, deleteUser, listUserRoles, listUsers, updateUser } from "./api";
import type { UserItem } from "./model";
import type { UserRoleOption } from "./api";

interface UserForm {
  name: string;
  account: string;
  roleCode: string;
  status: string;
}

const emptyUserForm: UserForm = {
  name: "",
  account: "",
  roleCode: "CONTENT_ADMIN",
  status: "启用",
};

export function UsersPage(props: { currentRole: UserRoleCode }) {
  const [items, setItems] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<UserRoleOption[]>([]);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<UserItem | null>(null);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canManageUsers = hasAnyRole(props.currentRole, superAdminRoles);
  const deniedTitle = permissionTitle(superAdminRoles);

  useEffect(() => {
    refresh();
    listUserRoles().then(setRoles);
  }, []);

  async function refresh() {
    setItems(await listUsers());
  }

  function openCreate() {
    if (!canManageUsers) {
      setNotice(deniedTitle);
      return;
    }
    setError("");
    setNotice("");
    setEditingItem(null);
    setForm({ ...emptyUserForm, roleCode: roles[0]?.code ?? emptyUserForm.roleCode });
  }

  function openEdit(item: UserItem) {
    if (!canManageUsers) {
      setNotice(deniedTitle);
      return;
    }
    setError("");
    setNotice("");
    setEditingItem(item);
    setForm({
      name: item.name,
      account: item.account,
      roleCode: item.roleCode ?? "CONTENT_ADMIN",
      status: item.status ?? "启用",
    });
  }

  async function submitForm() {
    if (!canManageUsers) {
      setError(deniedTitle);
      return;
    }
    if (!form.name.trim() || !form.account.trim() || !form.roleCode.trim()) {
      setError("请填写用户名、账号和角色。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const command = {
        name: form.name.trim(),
        account: form.account.trim(),
        roleCode: form.roleCode,
        status: form.status.trim() || "启用",
      };
      if (editingItem) {
        await updateUser(editingItem.id, command);
      } else {
        await createUser(command);
      }
      setEditingItem(null);
      setForm(emptyUserForm);
      setNotice(editingItem ? "用户已更新" : "用户已添加");
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canManageUsers) {
      setError(deniedTitle);
      return;
    }
    if (!deleteItem) {
      return;
    }
    setSaving(true);
    try {
      await deleteUser(deleteItem.id);
      setDeleteItem(null);
      setNotice("用户已删除");
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "删除失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = editingItem !== null || form !== emptyUserForm;
  const filteredItems = items.filter((item) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const matchesKeyword =
      !normalizedKeyword ||
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.account.toLowerCase().includes(normalizedKeyword) ||
      item.role.toLowerCase().includes(normalizedKeyword);
    const matchesRole = !roleFilter || item.roleCode === roleFilter || item.role === roleFilter;
    return matchesKeyword && matchesRole;
  });

  return (
    <div className="page-stack">
      <PageHeader title="用户管理" description="管理用户账号、角色权限和管理员类型。" actionText="添加用户" onAction={openCreate} actionDisabled={!canManageUsers} actionTitle={canManageUsers ? undefined : deniedTitle} />
      {notice ? <div className="success-banner">{notice}</div> : null}
      <Panel title="用户列表">
        <Toolbar>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索用户名或账号" />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">全部角色</option>
            {roles.map((role) => (
              <option key={role.code} value={role.code}>{role.name}</option>
            ))}
            <option value="超级管理员">超级管理员</option>
            <option value="内容管理员">内容管理员</option>
            <option value="发布员">发布员</option>
          </select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>用户名</th><th>账号</th><th>角色</th><th>手机号</th><th>最后编辑时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.account}</td><td>{item.role}</td><td>{item.phone}</td><td>{item.updatedAt}</td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => openEdit(item)} disabled={!canManageUsers} title={canManageUsers ? undefined : deniedTitle}>编辑</button>
                    <button className="danger-link" type="button" onClick={() => setDeleteItem(item)} disabled={!canManageUsers} title={canManageUsers ? undefined : deniedTitle}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {formVisible ? (
        <Modal
          title={editingItem ? "编辑用户" : "添加用户"}
          onClose={() => {
            setEditingItem(null);
            setForm(emptyUserForm);
            setError("");
          }}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => {
                setEditingItem(null);
                setForm(emptyUserForm);
                setError("");
              }}>取消</button>
              <button className="primary-button" type="submit" form="user-form" disabled={saving || !canManageUsers} title={canManageUsers ? undefined : deniedTitle}>
                {saving ? "保存中" : "保存"}
              </button>
            </>
          }
        >
          <form
            id="user-form"
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
          >
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="form-field">
              <label htmlFor="user-name">用户名</label>
              <input id="user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="user-account">账号</label>
              <input id="user-account" value={form.account} onChange={(event) => setForm({ ...form, account: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="user-role">角色</label>
              <select id="user-role" value={form.roleCode} onChange={(event) => setForm({ ...form, roleCode: event.target.value })}>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="user-status">状态</label>
              <select id="user-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="启用">启用</option>
                <option value="停用">停用</option>
              </select>
            </div>
          </form>
        </Modal>
      ) : null}
      {deleteItem ? (
        <ConfirmDialog
          title="删除用户"
          description={`确认删除“${deleteItem.name}”？删除后该账号将无法继续进入系统。`}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
