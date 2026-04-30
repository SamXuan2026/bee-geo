import { useEffect, useState } from "react";
import { ConfirmDialog, Modal, PageHeader, Panel, Toolbar } from "../../shared/ui";
import { createKeyword, deleteKeyword, listKeywordGroups, listKeywords, updateKeyword } from "./api";
import type { KeywordGroup, KeywordItem } from "./model";

interface KeywordForm {
  name: string;
  groupName: string;
  description: string;
  enabled: boolean;
}

const emptyKeywordForm: KeywordForm = {
  name: "",
  groupName: "",
  description: "",
  enabled: true,
};

export function KeywordsPage() {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [items, setItems] = useState<KeywordItem[]>([]);
  const [form, setForm] = useState<KeywordForm>(emptyKeywordForm);
  const [editingItem, setEditingItem] = useState<KeywordItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<KeywordItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [nextGroups, nextItems] = await Promise.all([listKeywordGroups(), listKeywords()]);
    setGroups(nextGroups);
    setItems(nextItems);
  }

  function openCreate() {
    setError("");
    setEditingItem(null);
    setForm({ ...emptyKeywordForm });
  }

  function openEdit(item: KeywordItem) {
    setError("");
    setEditingItem(item);
    setForm({
      name: item.name,
      groupName: item.group,
      description: item.description ?? "",
      enabled: item.enabled ?? true,
    });
  }

  async function submitForm() {
    if (!form.name.trim() || !form.groupName.trim()) {
      setError("请填写关键词名称和分组。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const command = {
        name: form.name.trim(),
        groupName: form.groupName.trim(),
        description: form.description.trim() || undefined,
        enabled: form.enabled,
      };
      if (editingItem) {
        await updateKeyword(editingItem.id, command);
      } else {
        await createKeyword(command);
      }
      setEditingItem(null);
      setForm(emptyKeywordForm);
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
      await deleteKeyword(deleteItem.id);
      setDeleteItem(null);
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "删除失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = editingItem !== null || form !== emptyKeywordForm;

  return (
    <div className="page-stack">
      <PageHeader title="关键词库" description="管理 GEO 分析和内容创作需要的关键词资产。" actionText="新增关键词" onAction={openCreate} />
      <div className="card-grid four">
        {groups.map((group) => (
          <article className="feature-card" key={group.id}>
            <span>{group.count} 个</span>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
          </article>
        ))}
      </div>
      <Panel title="关键词列表" action={<button className="ghost-button" type="button">批量上传</button>}>
        <Toolbar>
          <input placeholder="搜索关键词" />
          <select>
            <option>全部分组</option>
            {groups.map((group) => (
              <option key={group.id}>{group.name}</option>
            ))}
          </select>
        </Toolbar>
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>分组</th>
              <th>最后编辑日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.group}</td>
                <td>{item.updatedAt}</td>
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
          title={editingItem ? "编辑关键词" : "新增关键词"}
          onClose={() => {
            setEditingItem(null);
            setForm(emptyKeywordForm);
            setError("");
          }}
          footer={
            <>
              <button className="ghost-button" type="button" onClick={() => {
                setEditingItem(null);
                setForm(emptyKeywordForm);
                setError("");
              }}>取消</button>
              <button className="primary-button" type="submit" form="keyword-form" disabled={saving}>
                {saving ? "保存中" : "保存"}
              </button>
            </>
          }
        >
          <form
            id="keyword-form"
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
          >
            {error ? <div className="error-banner">{error}</div> : null}
            <div className="form-field">
              <label htmlFor="keyword-name">关键词名称</label>
              <input id="keyword-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="keyword-group">所属分组</label>
              <input id="keyword-group" value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="keyword-description">描述</label>
              <textarea id="keyword-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <label className="inline-check">
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
              启用关键词
            </label>
          </form>
        </Modal>
      ) : null}
      {deleteItem ? (
        <ConfirmDialog
          title="删除关键词"
          description={`确认删除“${deleteItem.name}”？删除后 GEO 分析和创作流程将无法继续使用该关键词。`}
          onCancel={() => setDeleteItem(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
