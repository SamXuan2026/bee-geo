import { useEffect, useState } from "react";
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

export function UsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<UserRoleOption[]>([]);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
    listUserRoles().then(setRoles);
  }, []);

  async function refresh() {
    setItems(await listUsers());
  }

  function openCreate() {
    setError("");
    setEditingItem(null);
    setForm({ ...emptyUserForm, roleCode: roles[0]?.code ?? emptyUserForm.roleCode });
  }

  function openEdit(item: UserItem) {
    setError("");
    setEditingItem(item);
    setForm({
      name: item.name,
      account: item.account,
      roleCode: item.roleCode ?? "CONTENT_ADMIN",
      status: item.status ?? "启用",
    });
  }

  async function submitForm() {
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
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteItem) {
      return;
    }
    setSaving(true);
    try {
      await deleteUser(deleteItem.id);
      setDeleteItem(null);
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "删除失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = editingItem !== null || form !== emptyUserForm;

  return (
    <div className="page-stack">
      <PageHeader title="用户管理" description="管理用户账号、角色权限和管理员类型。" actionText="添加用户" onAction={openCreate} />
      <Panel title="用户列表">
        <Toolbar>
          <input placeholder="搜索用户名或账号" />
          <select><option>全部角色</option><option>超级管理员</option><option>内容管理员</option><option>发布员</option></select>
        </Toolbar>
        <table>
          <thead>
            <tr><th>用户名</th><th>账号</th><th>角色</th><th>手机号</th><th>最后编辑时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.account}</td><td>{item.role}</td><td>{item.phone}</td><td>{item.updatedAt}</td>
                <td>
                  <div className="table-actions">
                    <button className="link-button" type="button" onClick={() => openEdit(item)}>编辑</button>
                    <button className="danger-link" type="button" onClick={() => setDeleteItem(item)}>删除</button>
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
              <button className="primary-button" type="submit" form="user-form" disabled={saving}>
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
